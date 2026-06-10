/**
 * Supabase GPS Points Uploader
 * Batch uploads GPS points with retry logic and offline handling
 */

import * as NetInfo from '@react-native-community/netinfo';
import { supabase } from '../../lib/supabase';
import { GpsPoint, UploadResult } from '../types';
import { clearSessionBuffer, deletePoints } from './sqlite-buffer';

const MAX_POINTS_PER_BATCH = 50;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

/**
 * Upload batch of GPS points to Supabase
 * Handles offline scenarios, retries, and cleanup
 */
export async function uploadBatch(
  sessionId: string,
  points: GpsPoint[],
): Promise<UploadResult> {
  const result: UploadResult = {
    success: 0,
    failed: [],
  };

  if (points.length === 0) {
    return result;
  }

  // Check network connectivity
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    console.warn('[uploader] No network connection, points remain in buffer');
    return result;
  }

  try {
    // Chunk points
    const chunks = chunkArray(points, MAX_POINTS_PER_BATCH);

    for (const chunk of chunks) {
      const uploadResult = await uploadChunkWithRetry(sessionId, chunk);

      if (uploadResult.success) {
        result.success += chunk.length;

        // Delete successfully uploaded points from buffer
        const pointIds = chunk.map((p, i) => `${sessionId}_${i}`);
        await deletePoints(sessionId, pointIds);
      } else {
        result.failed.push(...chunk.map((p) => `${p.latitude},${p.longitude}`));
      }
    }

    console.log(
      `[uploader] Upload complete: ${result.success} success, ${result.failed.length} failed`,
    );
  } catch (error) {
    console.error('[uploader] Upload batch error:', error);
  }

  return result;
}

/**
 * Upload single chunk with retries
 */
async function uploadChunkWithRetry(
  sessionId: string,
  chunk: GpsPoint[],
): Promise<{ success: boolean }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { error } = await supabase.from('gps_points').insert(
        chunk.map((point) => ({
          session_id: sessionId,
          latitude: point.latitude,
          longitude: point.longitude,
          accuracy_m: point.accuracy,
          battery_level: point.batteryPercent / 100, // Convert to 0-1 range
          speed_kmh: point.speedKmph,
          heading: point.headingDeg,
          recorded_at: new Date(point.timestamp).toISOString(),
        })),
      );

      if (error) {
        console.error(`[uploader] Upload error on attempt ${attempt}:`, error.message);

        // Retry with exponential backoff
        if (attempt < MAX_RETRIES) {
          const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          await sleep(delay);
          continue;
        }

        return { success: false };
      }

      console.log(`[uploader] Chunk uploaded successfully (attempt ${attempt})`);
      return { success: true };
    } catch (error) {
      console.error(`[uploader] Attempt ${attempt} failed:`, error);

      if (attempt < MAX_RETRIES) {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  return { success: false };
}

/**
 * Upload and finalize session
 * Called when user stops tracking
 */
export async function uploadAndFinalizeSession(
  sessionId: string,
  points: GpsPoint[],
): Promise<boolean> {
  try {
    // Upload all points
    const uploadResult = await uploadBatch(sessionId, points);

    if (uploadResult.success === 0 && points.length > 0) {
      console.warn('[uploader] No points uploaded, but session will be finalized');
    }

    // Update session status in Supabase
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('gps_sessions')
      .update({
        ended_at: now,
        total_points: uploadResult.success,
        status: 'ended',
      })
      .eq('id', sessionId);

    if (error) {
      console.error('[uploader] Failed to update session:', error);
      return false;
    }

    // Clear buffer
    await clearSessionBuffer(sessionId);

    console.log('[uploader] Session finalized');
    return true;
  } catch (error) {
    console.error('[uploader] Finalize session error:', error);
    return false;
  }
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
