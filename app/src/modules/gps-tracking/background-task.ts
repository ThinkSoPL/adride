// =============================================================================
// AdRide GPS Tracking — definicja background task (Expo TaskManager)
//
// WAŻNE: Ten plik MUSI być zaimportowany w głównym wejściu aplikacji
//        (np. App.tsx lub index.ts) PRZED jakimkolwiek renderowaniem.
//        TaskManager.defineTask() musi być wywołane na poziomie modułu.
// =============================================================================

import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';

import {
  ACCURACY_THRESHOLD_M,
  IDLE_SPEED_THRESHOLD_KMH,
  IDLE_TIMEOUT_MS,
  NOTIFICATION_COLOR,
  NOTIFICATION_TITLE,
  SESSION_STORAGE_KEY,
  TASK_CONFIG_KEY,
  TASK_NAME,
  TIME_INTERVAL_NORMAL_MS,
  TIME_INTERVAL_SLOW_MS,
} from './config';
import { filterOutlier } from './haversine';
import { gpsBuffer } from './storage';
import type { GpsPoint } from './types';

// ─── Persystentny stan między wywołaniami taska ───────────────────────────────

interface TaskState {
  prevPoint: Pick<GpsPoint, 'lat' | 'lng' | 'recordedAt'> | null;
  slowModeEnteredAt: number | null;
  currentIntervalMs: number;
  lastBatteryLevel: number | null;
}

const state: TaskState = {
  prevPoint: null,
  slowModeEnteredAt: null,
  currentIntervalMs: TIME_INTERVAL_NORMAL_MS,
  lastBatteryLevel: null,
};

// ─── Konfiguracja zadania (czytana z SecureStore przy każdym uruchomieniu) ────

interface TaskConfig {
  campaignId: string | null;
  vehicleId: string;
  batteryLevel: number | null;
}

async function readTaskConfig(): Promise<TaskConfig | null> {
  const raw = await SecureStore.getItemAsync(TASK_CONFIG_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TaskConfig;
  } catch {
    return null;
  }
}

/** Aktualizuje konfigurację taska w SecureStore (wywoływane przez tracking-service) */
export async function writeTaskConfig(config: TaskConfig): Promise<void> {
  await SecureStore.setItemAsync(TASK_CONFIG_KEY, JSON.stringify(config));
}

// ─── Adaptive interval — zmiana interwału GPS przez tracking-service ─────────

/**
 * Zwraca pożądany interwał GPS na podstawie bieżącej prędkości.
 * Logika: jeśli prędkość < 5 km/h przez 60s → tryb idle (30s).
 */
function computeDesiredIntervalMs(speedKmh: number): number {
  const now = Date.now();

  if (speedKmh < IDLE_SPEED_THRESHOLD_KMH) {
    if (state.slowModeEnteredAt === null) {
      state.slowModeEnteredAt = now;
    } else if (now - state.slowModeEnteredAt > IDLE_TIMEOUT_MS) {
      return TIME_INTERVAL_SLOW_MS;
    }
  } else {
    state.slowModeEnteredAt = null;
  }

  return TIME_INTERVAL_NORMAL_MS;
}

// ─── Budowanie obiektu GpsPoint z LocationObject expo ────────────────────────

function locationToGpsPoint(
  loc: Location.LocationObject,
  sessionId: string,
  taskConfig: TaskConfig,
): GpsPoint {
  const speedMs = loc.coords.speed ?? 0;
  return {
    sessionId,
    lat: loc.coords.latitude,
    lng: loc.coords.longitude,
    speedKmh: speedMs >= 0 ? speedMs * 3.6 : null,
    accuracyM: loc.coords.accuracy,
    heading: loc.coords.heading,
    batteryLevel: taskConfig.batteryLevel,
    recordedAt: loc.timestamp,
  };
}

// =============================================================================
// Definicja taska — MUSI być na poziomie modułu
// =============================================================================

TaskManager.defineTask(
  TASK_NAME,
  async ({
    data,
    error,
  }: TaskManager.TaskManagerTaskBody<{
    locations: Location.LocationObject[];
  }>) => {
    // Błąd platformowy — zdarza się przy problemach z GPS lub uprawnieniami
    if (error) {
      console.error('[GPS Task] Błąd zadania:', error.message);
      return;
    }

    if (!data?.locations?.length) return;

    // Odczyt aktywnej sesji
    const sessionId = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
    if (!sessionId) return; // Brak aktywnej sesji — ignoruj

    const taskConfig = await readTaskConfig();
    if (!taskConfig) return;

    const pointsToSave: GpsPoint[] = [];

    for (const loc of data.locations) {
      // Odrzuć punkty o złej dokładności GPS
      if (
        loc.coords.accuracy !== null &&
        loc.coords.accuracy > ACCURACY_THRESHOLD_M
      ) {
        continue;
      }

      const point = locationToGpsPoint(loc, sessionId, taskConfig);

      // Filtr outlierów Haversine — odrzuć skok GPS
      if (state.prevPoint !== null && filterOutlier(state.prevPoint, point)) {
        console.warn('[GPS Task] Odrzucono outlier GPS:', {
          prev: state.prevPoint,
          current: { lat: point.lat, lng: point.lng },
        });
        continue;
      }

      pointsToSave.push(point);

      // Aktualizuj stan adaptatywnego interwału
      if (point.speedKmh !== null) {
        computeDesiredIntervalMs(point.speedKmh);
      }

      state.prevPoint = {
        lat: point.lat,
        lng: point.lng,
        recordedAt: point.recordedAt,
      };
    }

    // Zapisz do SQLite buffera (offline-first)
    if (pointsToSave.length > 0) {
      await gpsBuffer.savePoints(pointsToSave);
    }
  },
);

// =============================================================================
// Helpers do zarządzania taskiem (wywoływane przez tracking-service)
// =============================================================================

/** Bazowe opcje startu lokalizacji (wartości dla trybu normalnego) */
function buildLocationOptions(
  intervalMs: number,
  notificationBody: string,
): Location.LocationTaskOptions {
  return {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: intervalMs,
    distanceInterval: 0, // używamy timeInterval jako primary trigger
    deferredUpdatesInterval: 60_000,
    deferredUpdatesDistance: 0,
    pausesUpdatesAutomatically: false,         // iOS — nie pauzuj automatycznie
    activityType: Location.ActivityType.AutomotiveNavigation,
    showsBackgroundLocationIndicator: true,   // iOS — wskaźnik w pasku stanu
    foregroundService: {                      // Android — persistent notification
      notificationTitle: NOTIFICATION_TITLE,
      notificationBody,
      notificationColor: NOTIFICATION_COLOR,
    },
  };
}

/** Uruchamia tracking GPS z podaną konfiguracją */
export async function startLocationTask(
  intervalMs: number,
  notificationBody: string,
): Promise<void> {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(TASK_NAME);
  }
  await Location.startLocationUpdatesAsync(
    TASK_NAME,
    buildLocationOptions(intervalMs, notificationBody),
  );
  state.currentIntervalMs = intervalMs;
}

/** Zatrzymuje tracking GPS */
export async function stopLocationTask(): Promise<void> {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(TASK_NAME);
  }
  state.prevPoint = null;
  state.slowModeEnteredAt = null;
}

/** Sprawdza czy task lokalizacji jest aktywny */
export async function isLocationTaskRunning(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false);
}

/** Resetuje stan adaptatywnego interwału (np. po wznawieniu sesji) */
export function resetTaskState(): void {
  state.prevPoint = null;
  state.slowModeEnteredAt = null;
  state.currentIntervalMs = TIME_INTERVAL_NORMAL_MS;
}
