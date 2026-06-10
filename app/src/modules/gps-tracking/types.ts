// =============================================================================
// AdRide GPS Tracking — typy publiczne
// =============================================================================

/** Pojedynczy punkt GPS zarejestrowany przez urządzenie */
export interface GpsPoint {
  sessionId: string;
  lat: number;
  lng: number;
  speedKmh: number | null;
  accuracyM: number | null;
  heading: number | null;
  batteryLevel: number | null;  // 0.00–1.00
  recordedAt: number;           // Unix timestamp w milisekundach
}

/** Punkt GPS z metadanymi SQLite (do bufferowania offline) */
export interface StoredPoint extends GpsPoint {
  id: number;
  uploaded: 0 | 1;
}

/** Sesja GPS — mapuje na tabelę gps_sessions w Supabase */
export interface GpsSession {
  id: string;
  driverId: string;
  vehicleId: string;
  campaignId: string | null;
  startedAt: string;       // ISO 8601
  endedAt: string | null;
  totalDistanceM: number;
  totalPoints: number;
  deviceInfo: DeviceInfo;
}

/** Parametry przekazywane przy startSession() */
export interface TrackingConfig {
  vehicleId: string;
  campaignId: string | null;
}

/** Dane aktywnej sesji persystowane w SecureStore */
export interface PersistedSession {
  id: string;
  vehicleId: string;
  campaignId: string | null;
  driverId: string;
  startedAt: string;
}

/** Stan baterii z perspektywy modułu trackingu */
export type BatteryState = 'normal' | 'low_power' | 'charging';

/** Aktualny status sesji śledzenia trasy */
export type TrackingStatus = 'idle' | 'active' | 'paused' | 'error';

/** Tryb dokładności GPS */
export type AccuracyMode = 'balanced' | 'low';

/** Statystyki na żywo eksponowane przez hooki */
export interface TrackingStats {
  km: number;
  durationSec: number;
  avgSpeedKmh: number;
  pointsCount: number;
}

/** Błąd modułu trackingu z typowanym kodem */
export interface TrackingError {
  code:
    | 'PERMISSION_DENIED'
    | 'BACKGROUND_PERMISSION_DENIED'
    | 'AUTH_ERROR'
    | 'NETWORK_ERROR'
    | 'TASK_ERROR'
    | 'SESSION_NOT_FOUND'
    | 'UNKNOWN';
  message: string;
}

/** Mapa zdarzeń emitowanych przez TrackingService — brak `any` */
export interface TrackingEventMap {
  AUTH_ERROR: undefined;
  LOW_BATTERY_MODE: { level: number };
  NORMAL_BATTERY_MODE: { level: number };
  NETWORK_RESTORED: { pendingPoints: number };
  SESSION_RESUMED: { sessionId: string };
  STATUS_CHANGED: { status: TrackingStatus };
  STATS_UPDATED: TrackingStats;
  ACCURACY_MODE_CHANGED: { mode: AccuracyMode };
}

/** Informacje o urządzeniu mobilnym (zapisywane przy starcie sesji) */
export interface DeviceInfo {
  deviceModel: string;
  osVersion: string;
  appVersion: string;
}

/** Payload wstawiany do tabeli gps_points w Supabase */
export interface SupabaseGpsPointPayload {
  session_id: string;
  driver_id: string;
  campaign_id: string | null;
  location: string;          // WKT EWKT: "POINT(lng lat)"
  speed_kmh: number | null;
  accuracy_m: number | null;
  heading: number | null;
  battery_level: number | null;
  recorded_at: string;       // ISO 8601
}

/** Payload tworzący/aktualizujący sesję w tabeli gps_sessions */
export interface SupabaseSessionPayload {
  id: string;
  driver_id: string;
  vehicle_id: string;
  campaign_id: string | null;
  started_at: string;
  ended_at?: string | null;
  device_info: DeviceInfo;
}
