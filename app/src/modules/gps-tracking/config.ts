// =============================================================================
// AdRide GPS Tracking — stałe konfiguracyjne
// Zmień tu zamiast w logice — ułatwia tuning wydajność/bateria
// =============================================================================

/** Minimalna odległość między kolejnymi punktami GPS (metry) */
export const MIN_DISTANCE_M = 50;

/** Powyżej tej prędkości punkt jest traktowany jako outlier GPS */
export const MAX_SPEED_KMH = 200;

/** Liczba punktów w jednym batchu uploadu do Supabase */
export const BATCH_SIZE = 50;

/** Odrzucaj punkty o dokładności gorszej niż ta wartość (metry) */
export const ACCURACY_THRESHOLD_M = 50;

/** Interwał między uploadami batchy (ms) — co 60s lub po BATCH_SIZE punktach */
export const UPLOAD_INTERVAL_MS = 60_000;

/** Prędkość poniżej której uruchamia się tryb idle */
export const IDLE_SPEED_THRESHOLD_KMH = 5;

/** Czas poniżej progu prędkości zanim zmienimy interwał na wolniejszy (ms) */
export const IDLE_TIMEOUT_MS = 60_000;

/** Próg baterii poniżej którego włącza się LOW_POWER (15%) */
export const BATTERY_LOW_THRESHOLD = 0.15;

/** Jak często polling baterii (co 5 minut) */
export const BATTERY_CHECK_INTERVAL_MS = 5 * 60_000;

/** Po ilu dniach od uploadu usuwamy lokalne dane z SQLite */
export const VACUUM_AFTER_DAYS = 30;

/** Liczba prób retry przy błędzie uploadu */
export const MAX_RETRY_ATTEMPTS = 3;

/** Bazowy czas backoff (ms) — 1s → 4s → 16s (base^attempt) */
export const RETRY_BACKOFF_BASE_MS = 1_000;

/** Nazwa zarejestrowanego zadania Expo TaskManager */
export const TASK_NAME = 'ADRIDE_LOCATION_TASK';

/** Klucz w SecureStore przechowujący JSON aktywnej sesji */
export const SESSION_STORAGE_KEY = 'adride_active_session';

/** Klucz w SecureStore przechowujący config uruchamianego taska */
export const TASK_CONFIG_KEY = 'adride_task_config';

/** Promień Ziemi w metrach (używany przez Haversine) */
export const EARTH_RADIUS_M = 6_371_000;

// ─── Interwały lokalizacji (ms) ──────────────────────────────────────────────

/** Tryb normalny: aktywna jazda po mieście */
export const TIME_INTERVAL_NORMAL_MS = 10_000;

/** Tryb idle: wolna jazda / postój > IDLE_TIMEOUT_MS */
export const TIME_INTERVAL_SLOW_MS = 30_000;

/** Tryb LOW_POWER: bateria < BATTERY_LOW_THRESHOLD */
export const TIME_INTERVAL_LOW_POWER_MS = 60_000;

// ─── Konfiguracja Expo Location ──────────────────────────────────────────────

/** Minimalny ruch wyzwalający update lokalizacji (metry) */
export const DISTANCE_INTERVAL_M = 50;

/** Android: pozwól systemowi batchować aktualizacje co tyle ms */
export const DEFERRED_UPDATES_INTERVAL_MS = 60_000;

// ─── Notyfikacja foreground service (Android) ────────────────────────────────

export const NOTIFICATION_TITLE = 'AdRide — śledzenie trasy';
export const NOTIFICATION_COLOR = '#1A73E8';
