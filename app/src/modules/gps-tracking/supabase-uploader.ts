// =============================================================================
// AdRide GPS Tracking — upload batchy do Supabase z retry i backoff
// =============================================================================

import NetInfo from '@react-native-community/netinfo';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  BATCH_SIZE,
  MAX_RETRY_ATTEMPTS,
  RETRY_BACKOFF_BASE_MS,
  UPLOAD_INTERVAL_MS,
} from './config';
import { trackingEmitter } from './emitter';
import { gpsBuffer } from './storage';
import type { StoredPoint, SupabaseGpsPointPayload } from './types';

// ─── Konfiguracja zewnętrznego klienta ───────────────────────────────────────

let _supabase: SupabaseClient | null = null;
let _driverId: string | null = null;

/**
 * Inicjalizuje uploader — wywołaj raz, zanim startSession().
 * Umożliwia DI klienta Supabase bez hardkodowania go w module.
 */
export function configureUploader(
  supabase: SupabaseClient,
  driverId: string,
): void {
  _supabase = supabase;
  _driverId = driverId;
}

// ─── Pomocnik delay ───────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Mapowanie StoredPoint → payload Supabase ─────────────────────────────────

function toSupabasePayload(
  point: StoredPoint,
  campaignId: string | null,
): SupabaseGpsPointPayload {
  return {
    session_id: point.sessionId,
    driver_id: _driverId!,
    campaign_id: campaignId,
    // WKT EWKT — PostgREST rozumie "POINT(lng lat)" dla kolumn GEOGRAPHY
    location: `POINT(${point.lng} ${point.lat})`,
    speed_kmh: point.speedKmh,
    accuracy_m: point.accuracyM,
    heading: point.heading,
    battery_level: point.batteryLevel,
    recorded_at: new Date(point.recordedAt).toISOString(),
  };
}

// =============================================================================
// uploadBatch — wysyła jeden batch z retry + exponential backoff
// =============================================================================

/**
 * Wysyła batch punktów do Supabase.
 * Retry: 3 próby z backoff 1s → 4s → 16s.
 *
 * @returns `true` gdy upload się powiódł, `false` przy permanentnym błędzie
 */
export async function uploadBatch(
  points: StoredPoint[],
  campaignId: string | null,
): Promise<boolean> {
  if (!_supabase || !_driverId) {
    console.warn('[Uploader] Brak konfiguracji — wywołaj configureUploader()');
    return false;
  }
  if (points.length === 0) return true;

  const payload = points.map((p) => toSupabasePayload(p, campaignId));

  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    // Backoff: 0ms → 1s → 4s → 16s
    if (attempt > 0) {
      await delay(RETRY_BACKOFF_BASE_MS * 4 ** (attempt - 1));
    }

    const { error } = await _supabase.from('gps_points').insert(payload);

    if (!error) return true;

    // 401/403 — token wygasł lub brak uprawnień RLS — nie retryuj
    const status = (error as { status?: number }).status ?? 0;
    if (status === 401 || status === 403) {
      trackingEmitter.emit('AUTH_ERROR', undefined);
      return false;
    }

    console.warn(`[Uploader] Próba ${attempt + 1}/${MAX_RETRY_ATTEMPTS}: ${error.message}`);
  }

  // Wszystkie próby nieudane — zostaw w bufferze, spróbuj przy kolejnym interwale
  return false;
}

// =============================================================================
// triggerUpload — sprawdza sieć, pobiera bufor, uploaduje kolejno
// =============================================================================

let _isUploading = false;

/**
 * Sprawdza dostępność sieci, pobiera nieprzesłane punkty z SQLite i uploaduje
 * partiami po BATCH_SIZE. Bezpieczne do wielokrotnego wywołania (guard flag).
 *
 * @param campaignId — aktywna kampania (do payload Supabase)
 */
export async function triggerUpload(campaignId: string | null): Promise<void> {
  if (_isUploading) return;

  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return;

  _isUploading = true;
  try {
    const pendingBefore = await gpsBuffer.getPendingCount();

    let batch = await gpsBuffer.getUnuploadedBatch(BATCH_SIZE);

    while (batch.length > 0) {
      const success = await uploadBatch(batch, campaignId);
      if (!success) break;

      await gpsBuffer.markUploaded(batch.map((p) => p.id));

      // Poinformuj UI o przywróceniu sieci gdy uploadujemy po przerwie
      if (pendingBefore > BATCH_SIZE) {
        const remaining = await gpsBuffer.getPendingCount();
        if (remaining === 0) {
          trackingEmitter.emit('NETWORK_RESTORED', { pendingPoints: pendingBefore });
        }
      }

      batch = await gpsBuffer.getUnuploadedBatch(BATCH_SIZE);
    }

    // Sprzątaj stare przesłane dane (nieblokująco)
    gpsBuffer.vacuum().catch(() => {});
  } finally {
    _isUploading = false;
  }
}

// =============================================================================
// UploadScheduler — zarządza interwałem uploadu
// =============================================================================

export class UploadScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private campaignId: string | null = null;

  start(campaignId: string | null): void {
    this.campaignId = campaignId;
    this.stop();
    this.timer = setInterval(() => {
      triggerUpload(this.campaignId).catch(console.error);
    }, UPLOAD_INTERVAL_MS);
  }

  /** Natychmiastowy flush + zatrzymanie schedulera */
  async flushAndStop(): Promise<void> {
    this.stop();
    await triggerUpload(this.campaignId);
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
