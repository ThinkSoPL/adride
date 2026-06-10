// =============================================================================
// AdRide GPS Tracking — żądanie uprawnień lokalizacji
// Obsługuje iOS (Always) i Android 14+ (FOREGROUND_SERVICE_LOCATION)
// =============================================================================

import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import type { TrackingError } from './types';

export interface PermissionResult {
  granted: boolean;
  error?: TrackingError;
}

// ─── Tekst komunikatów (po polsku) ───────────────────────────────────────────

const MESSAGES = {
  foregroundDenied: {
    title: 'Lokalizacja jest wymagana',
    body: 'AdRide potrzebuje dostępu do lokalizacji, aby rejestrować Twoją trasę i naliczać kilometry.\n\nOtwórz Ustawienia → AdRide → Lokalizacja i wybierz „Zawsze" lub „Podczas używania".',
  },
  backgroundDenied: {
    title: 'Lokalizacja w tle',
    body: 'Aby rejestrować trasę gdy ekran jest wyłączony, AdRide wymaga dostępu do lokalizacji „Zawsze".\n\nOtwórz Ustawienia → AdRide → Lokalizacja → Zawsze.',
  },
  backgroundRequired:
    'Bez uprawnienia „Lokalizacja — Zawsze" tracking trasy w tle nie będzie działać. Przejdź do ustawień?',
} as const;

// ─── Pomocnik do otwarcia ustawień systemowych ────────────────────────────────

async function openAppSettings(): Promise<void> {
  await Linking.openSettings();
}

function showSettingsAlert(title: string, body: string): void {
  Alert.alert(title, body, [
    { text: 'Anuluj', style: 'cancel' },
    {
      text: 'Otwórz ustawienia',
      onPress: () => openAppSettings(),
    },
  ]);
}

// =============================================================================
// requestForegroundPermission
// =============================================================================

/**
 * Prosi o uprawnienie do lokalizacji na pierwszym planie.
 * Wymagane zanim poprosimy o background.
 */
export async function requestForegroundPermission(): Promise<PermissionResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status === Location.PermissionStatus.GRANTED) {
    return { granted: true };
  }

  // Pokaż dialog tylko gdy user nie zaakceptował (undetermined → denied)
  showSettingsAlert(
    MESSAGES.foregroundDenied.title,
    MESSAGES.foregroundDenied.body,
  );

  return {
    granted: false,
    error: {
      code: 'PERMISSION_DENIED',
      message: 'Uprawnienie do lokalizacji na pierwszym planie odrzucone.',
    },
  };
}

// =============================================================================
// requestBackgroundPermission
// =============================================================================

/**
 * Prosi o uprawnienie do lokalizacji w tle (zawsze).
 * Na Android 14+ wymaga FOREGROUND_SERVICE_LOCATION.
 * MUSI być wywołane po requestForegroundPermission.
 */
export async function requestBackgroundPermission(): Promise<PermissionResult> {
  // Android 12+ wymaga odrębnego kroku po foreground
  const { status } = await Location.requestBackgroundPermissionsAsync();

  if (status === Location.PermissionStatus.GRANTED) {
    return { granted: true };
  }

  showSettingsAlert(
    MESSAGES.backgroundDenied.title,
    MESSAGES.backgroundDenied.body,
  );

  return {
    granted: false,
    error: {
      code: 'BACKGROUND_PERMISSION_DENIED',
      message:
        'Uprawnienie do lokalizacji w tle odrzucone. Tracking nie będzie działać po zamknięciu aplikacji.',
    },
  };
}

// =============================================================================
// requestPermissions — pełny flow
// =============================================================================

/**
 * Wykonuje pełny flow żądania uprawnień:
 * 1. foreground (WHEN_IN_USE)
 * 2. background (ALWAYS) — iOS i Android
 *
 * Zwraca wynik końcowy. Nie rzuca wyjątku.
 */
export async function requestPermissions(): Promise<PermissionResult> {
  const foreground = await requestForegroundPermission();
  if (!foreground.granted) return foreground;

  // Na Androidzie poniżej 10 background == foreground — pomiń
  if (Platform.OS === 'android' && Platform.Version < 29) {
    return { granted: true };
  }

  return requestBackgroundPermission();
}

// =============================================================================
// checkPermissions — tylko sprawdza, nie pyta
// =============================================================================

export interface PermissionStatus {
  foreground: Location.PermissionStatus;
  background: Location.PermissionStatus;
  allGranted: boolean;
}

/** Sprawdza aktualny stan uprawnień bez wyświetlania dialogów */
export async function checkPermissions(): Promise<PermissionStatus> {
  const [fg, bg] = await Promise.all([
    Location.getForegroundPermissionsAsync(),
    Location.getBackgroundPermissionsAsync(),
  ]);

  return {
    foreground: fg.status,
    background: bg.status,
    allGranted:
      fg.status === Location.PermissionStatus.GRANTED &&
      bg.status === Location.PermissionStatus.GRANTED,
  };
}
