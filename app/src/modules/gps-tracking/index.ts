// =============================================================================
// AdRide GPS Tracking — publiczne API modułu
//
// WAŻNE: Ten plik importuj w App.tsx / index.ts aplikacji.
// Samo zaimportowanie rejestruje background task przez background-task.ts.
// =============================================================================

// Rejestracja background task — MUSI być przed jakimkolwiek renderowaniem
// Side-effect import: TaskManager.defineTask() jest wywoływane na poziomie modułu
import './background-task';

// ─── Główny serwis ────────────────────────────────────────────────────────────
export { trackingService } from './tracking-service';

// ─── Hooki React ─────────────────────────────────────────────────────────────
export { useGpsTracking } from './hooks/useGpsTracking';
export { useTrackingStats } from './hooks/useTrackingStats';

// ─── Uprawnienia ──────────────────────────────────────────────────────────────
export {
  requestPermissions,
  requestForegroundPermission,
  requestBackgroundPermission,
  checkPermissions,
} from './permissions';

// ─── Upload ───────────────────────────────────────────────────────────────────
export { configureUploader, triggerUpload } from './supabase-uploader';

// ─── Obliczenia GPS ───────────────────────────────────────────────────────────
export {
  haversineDistance,
  filterOutlier,
  cumulativeDistance,
  instantSpeedKmh,
} from './haversine';

// ─── Typy publiczne ───────────────────────────────────────────────────────────
export type {
  GpsPoint,
  GpsSession,
  TrackingConfig,
  TrackingStats,
  TrackingStatus,
  TrackingError,
  TrackingEventMap,
  BatteryState,
  AccuracyMode,
  DeviceInfo,
  SupabaseGpsPointPayload,
} from './types';

// ─── Event bus (subskrypcja z zewnątrz modułu) ────────────────────────────────
export { trackingEmitter } from './emitter';

// ─── Stałe konfiguracyjne (do nadpisywania w testach) ─────────────────────────
export { TASK_NAME, BATCH_SIZE, MAX_SPEED_KMH } from './config';
