// =============================================================================
// AdRide GPS Tracking — główny serwis zarządzający sesjami
// Koordynuje: background task, SQLite buffer, Supabase upload, baterię, sieć
// =============================================================================

import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import {
  BATTERY_CHECK_INTERVAL_MS,
  BATTERY_LOW_THRESHOLD,
  NOTIFICATION_TITLE,
  SESSION_STORAGE_KEY,
  TASK_CONFIG_KEY,
  TIME_INTERVAL_LOW_POWER_MS,
  TIME_INTERVAL_NORMAL_MS,
  TIME_INTERVAL_SLOW_MS,
} from './config';
import { trackingEmitter } from './emitter';
import { gpsBuffer } from './storage';
import {
  configureUploader,
  triggerUpload,
  UploadScheduler,
} from './supabase-uploader';
import {
  isLocationTaskRunning,
  resetTaskState,
  startLocationTask,
  stopLocationTask,
  writeTaskConfig,
} from './background-task';
import type {
  AccuracyMode,
  BatteryState,
  DeviceInfo,
  GpsSession,
  PersistedSession,
  SupabaseSessionPayload,
  TrackingConfig,
  TrackingStatus,
} from './types';

// =============================================================================
// TrackingService — singleton
// =============================================================================

class TrackingService {
  private status: TrackingStatus = 'idle';
  private session: GpsSession | null = null;
  private batteryState: BatteryState = 'normal';
  private accuracyMode: AccuracyMode = 'balanced';
  private supabase: SupabaseClient | null = null;
  private driverId: string | null = null;

  private batteryTimer: ReturnType<typeof setInterval> | null = null;
  private networkUnsubscribe: (() => void) | null = null;
  private scheduler = new UploadScheduler();

  // ─── Inicjalizacja ────────────────────────────────────────────────────────

  /**
   * Inicjalizuje serwis — wywołaj przy starcie aplikacji.
   * Sprawdza czy istnieje przerwana sesja i wznawia tracking.
   */
  async initialize(supabase: SupabaseClient): Promise<void> {
    this.supabase = supabase;

    // Pobierz ID zalogowanego kierowcy
    const { data } = await supabase.auth.getUser();
    this.driverId = data.user?.id ?? null;
    if (!this.driverId) return;

    configureUploader(supabase, this.driverId);

    // Sprawdź czy mamy persystowaną sesję (appka była zabita w trakcie sesji)
    const savedRaw = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
    if (savedRaw) {
      try {
        const saved = JSON.parse(savedRaw) as PersistedSession;

        // Sprawdź czy background task wciąż działa (np. Android foreground service)
        const taskRunning = await isLocationTaskRunning();

        this.session = {
          id: saved.id,
          driverId: saved.driverId,
          vehicleId: saved.vehicleId,
          campaignId: saved.campaignId,
          startedAt: saved.startedAt,
          endedAt: null,
          totalDistanceM: 0,
          totalPoints: await gpsBuffer.getSessionPointCount(saved.id),
          deviceInfo: this.getDeviceInfo(),
        };

        if (!taskRunning) {
          // Task nie działa — wznów (np. Android zabił FG service)
          await this.resumeLocationTask(saved.campaignId);
        }

        this.status = 'active';
        this.startBatteryMonitor();
        this.subscribeNetwork();
        this.scheduler.start(saved.campaignId);

        trackingEmitter.emit('SESSION_RESUMED', { sessionId: saved.id });
        trackingEmitter.emit('STATUS_CHANGED', { status: 'active' });
      } catch {
        // Uszkodzony zapis — wyczyść
        await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
      }
    }
  }

  // ─── startSession ─────────────────────────────────────────────────────────

  /**
   * Tworzy nową sesję GPS.
   * Generuje UUID, zapisuje do Supabase i uruchamia background task.
   */
  async startSession(config: TrackingConfig): Promise<string> {
    if (this.status === 'active') {
      throw new Error('Sesja już aktywna — wywołaj stopSession() przed nową sesją.');
    }
    if (!this.supabase || !this.driverId) {
      throw new Error('TrackingService nie zainicjalizowany — wywołaj initialize() najpierw.');
    }

    const sessionId = generateUUID();
    const startedAt = new Date().toISOString();

    // Persystuj w SecureStore — ochrona przed zabijeciem aplikacji
    const persisted: PersistedSession = {
      id: sessionId,
      vehicleId: config.vehicleId,
      campaignId: config.campaignId,
      driverId: this.driverId,
      startedAt,
    };
    await SecureStore.setItemAsync(SESSION_STORAGE_KEY, JSON.stringify(persisted));

    // Zapisz config dla background taska
    const batteryLevel = await this.getCurrentBatteryLevel();
    await writeTaskConfig({
      campaignId: config.campaignId,
      vehicleId: config.vehicleId,
      batteryLevel,
    });

    // Utwórz sesję w Supabase (nie blokuje — upload może się nie powieść)
    const payload: SupabaseSessionPayload = {
      id: sessionId,
      driver_id: this.driverId,
      vehicle_id: config.vehicleId,
      campaign_id: config.campaignId,
      started_at: startedAt,
      device_info: this.getDeviceInfo(),
    };
    this.supabase.from('gps_sessions').insert(payload).then(({ error }) => {
      if (error) console.warn('[TrackingService] Błąd tworzenia sesji:', error.message);
    });

    this.session = {
      id: sessionId,
      driverId: this.driverId,
      vehicleId: config.vehicleId,
      campaignId: config.campaignId,
      startedAt,
      endedAt: null,
      totalDistanceM: 0,
      totalPoints: 0,
      deviceInfo: this.getDeviceInfo(),
    };

    // Uruchom task GPS
    await startLocationTask(
      TIME_INTERVAL_NORMAL_MS,
      buildNotificationBody(0),
    );
    resetTaskState();

    this.status = 'active';
    this.accuracyMode = 'balanced';

    this.startBatteryMonitor();
    this.subscribeNetwork();
    this.scheduler.start(config.campaignId);

    trackingEmitter.emit('STATUS_CHANGED', { status: 'active' });
    return sessionId;
  }

  // ─── stopSession ──────────────────────────────────────────────────────────

  /**
   * Kończy sesję GPS.
   * Flushuje bufor, aktualizuje `ended_at` w Supabase, czyści persystencję.
   */
  async stopSession(): Promise<void> {
    if (!this.session) return;

    const sessionId = this.session.id;
    const endedAt = new Date().toISOString();

    // Zatrzymaj task i harmonogram
    await stopLocationTask();
    await this.scheduler.flushAndStop();
    this.stopBatteryMonitor();
    this.unsubscribeNetwork();

    // Aktualizuj sesję w Supabase
    if (this.supabase) {
      const pointCount = await gpsBuffer.getSessionPointCount(sessionId);
      this.supabase
        .from('gps_sessions')
        .update({
          ended_at: endedAt,
          total_points: pointCount,
        })
        .eq('id', sessionId)
        .then(({ error }) => {
          if (error) console.warn('[TrackingService] Błąd aktualizacji sesji:', error.message);
        });
    }

    // Wyczyść persystencję
    await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
    await SecureStore.deleteItemAsync(TASK_CONFIG_KEY);

    this.session = null;
    this.status = 'idle';
    trackingEmitter.emit('STATUS_CHANGED', { status: 'idle' });
  }

  // ─── pauseSession ─────────────────────────────────────────────────────────

  /**
   * Pauzuje sesję bez jej kończenia (np. kierowca tankuje).
   * Task GPS jest zatrzymany, ale sesja pozostaje aktywna w Supabase.
   */
  async pauseSession(): Promise<void> {
    if (this.status !== 'active') return;

    await stopLocationTask();
    this.status = 'paused';
    trackingEmitter.emit('STATUS_CHANGED', { status: 'paused' });
  }

  /**
   * Wznawia zapauzowaną sesję.
   */
  async resumeSession(): Promise<void> {
    if (this.status !== 'paused' || !this.session) return;

    await this.resumeLocationTask(this.session.campaignId);
    this.status = 'active';
    trackingEmitter.emit('STATUS_CHANGED', { status: 'active' });
  }

  // ─── Gettery ──────────────────────────────────────────────────────────────

  getStatus(): TrackingStatus { return this.status; }
  getSession(): GpsSession | null { return this.session; }
  getBatteryState(): BatteryState { return this.batteryState; }
  getAccuracyMode(): AccuracyMode { return this.accuracyMode; }

  // ─── Bateria ──────────────────────────────────────────────────────────────

  private startBatteryMonitor(): void {
    this.stopBatteryMonitor();
    this.batteryTimer = setInterval(
      () => this.checkBattery().catch(console.error),
      BATTERY_CHECK_INTERVAL_MS,
    );
    // Sprawdź natychmiast
    this.checkBattery().catch(console.error);
  }

  private stopBatteryMonitor(): void {
    if (this.batteryTimer !== null) {
      clearInterval(this.batteryTimer);
      this.batteryTimer = null;
    }
  }

  private async checkBattery(): Promise<void> {
    const [level, state] = await Promise.all([
      Battery.getBatteryLevelAsync(),
      Battery.getBatteryStateAsync(),
    ]);

    const isCharging =
      state === Battery.BatteryState.Charging ||
      state === Battery.BatteryState.Full;

    if (isCharging) {
      if (this.batteryState === 'low_power') {
        this.batteryState = 'charging';
        await this.switchAccuracyMode('balanced');
        trackingEmitter.emit('NORMAL_BATTERY_MODE', { level });
      }
      return;
    }

    // Aktualizuj batteryLevel w task config (zapisywany do SQLite z każdym punktem)
    if (this.session) {
      const config = await SecureStore.getItemAsync(TASK_CONFIG_KEY);
      if (config) {
        const parsed = JSON.parse(config);
        await writeTaskConfig({ ...parsed, batteryLevel: level });
      }
    }

    if (level < BATTERY_LOW_THRESHOLD && this.batteryState !== 'low_power') {
      this.batteryState = 'low_power';
      await this.switchAccuracyMode('low');
      trackingEmitter.emit('LOW_BATTERY_MODE', { level });
    } else if (level >= BATTERY_LOW_THRESHOLD && this.batteryState === 'low_power') {
      this.batteryState = 'normal';
      await this.switchAccuracyMode('balanced');
      trackingEmitter.emit('NORMAL_BATTERY_MODE', { level });
    }
  }

  private async getCurrentBatteryLevel(): Promise<number | null> {
    try {
      return await Battery.getBatteryLevelAsync();
    } catch {
      return null;
    }
  }

  private async switchAccuracyMode(mode: AccuracyMode): Promise<void> {
    if (this.accuracyMode === mode || this.status !== 'active') return;

    const intervalMs =
      mode === 'low' ? TIME_INTERVAL_LOW_POWER_MS : TIME_INTERVAL_NORMAL_MS;

    const pointCount = this.session
      ? await gpsBuffer.getSessionPointCount(this.session.id)
      : 0;

    await startLocationTask(intervalMs, buildNotificationBody(pointCount));
    this.accuracyMode = mode;
    trackingEmitter.emit('ACCURACY_MODE_CHANGED', { mode });
  }

  // ─── Sieć ─────────────────────────────────────────────────────────────────

  private subscribeNetwork(): void {
    this.networkUnsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && this.session) {
        // Sieć przywrócona — wyślij zaległe punkty
        triggerUpload(this.session.campaignId).catch(console.error);
      }
    });
  }

  private unsubscribeNetwork(): void {
    this.networkUnsubscribe?.();
    this.networkUnsubscribe = null;
  }

  // ─── Wznowienie taska po restarcie aplikacji ──────────────────────────────

  private async resumeLocationTask(campaignId: string | null): Promise<void> {
    const intervalMs =
      this.batteryState === 'low_power'
        ? TIME_INTERVAL_LOW_POWER_MS
        : TIME_INTERVAL_NORMAL_MS;

    const pointCount = this.session
      ? await gpsBuffer.getSessionPointCount(this.session.id)
      : 0;

    await startLocationTask(intervalMs, buildNotificationBody(pointCount));
    resetTaskState();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private getDeviceInfo(): DeviceInfo {
    return {
      deviceModel: Device.modelName ?? 'Nieznany',
      osVersion: `${Platform.OS} ${Platform.Version}`,
      appVersion: Constants.expoConfig?.version ?? '0.0.0',
    };
  }
}

// ─── Helpers modułowe ─────────────────────────────────────────────────────────

/** Buduje treść notyfikacji foreground service z km */
function buildNotificationBody(pointCount: number): string {
  const approxKm = Math.round(pointCount * 0.05) / 10; // przybliżenie: 1 pkt ≈ 50m
  if (approxKm < 1) return 'AdRide rejestruje Twoją trasę';
  return `AdRide rejestruje Twoją trasę — ${approxKm.toFixed(1)} km dziś`;
}

/** UUID v4 bez zależności (crypto.randomUUID nie jest dostępne wszędzie w RN) */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Eksportowany singleton */
export const trackingService = new TrackingService();
