import type { SupabaseClient } from '@supabase/supabase-js';
import type { LocationMetadata, PhotoCaptureResult } from '../types';

const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface UploadProofPhotoParams {
  driverId: string;
  campaignId: string;
  photo: PhotoCaptureResult;
  location: LocationMetadata;
}

/**
 * Decode base64 string to Uint8Array using built-in atob (available in RN).
 */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function uploadProofPhoto(
  supabase: SupabaseClient,
  params: UploadProofPhotoParams,
): Promise<{ id: string; path: string }> {
  const { photo, driverId, campaignId, location } = params;

  if (!driverId || !campaignId) {
    throw new Error('Brakuje driverId lub campaignId');
  }

  const timestamp = Date.now();
  const storagePath = `proofs/${campaignId}/${driverId}/${timestamp}.jpg`;

  let fileData: Uint8Array;

  if (photo.base64) {
    fileData = base64ToBytes(photo.base64);
  } else if (photo.uri) {
    // Fallback: fetch URI and convert to bytes
    const res = await fetch(photo.uri);
    const buffer = await res.arrayBuffer();
    fileData = new Uint8Array(buffer);
  } else {
    throw new Error('Brak danych zdjęcia (base64 ani uri)');
  }

  if (fileData.byteLength > MAX_PHOTO_SIZE_BYTES) {
    throw new Error(
      `Zdjęcie zbyt duże (${(fileData.byteLength / 1024 / 1024).toFixed(1)} MB, max ${MAX_PHOTO_SIZE_BYTES / 1024 / 1024} MB)`,
    );
  }

  // Upload to Storage
  const { error: uploadError } = await supabase.storage
    .from('proofs')
    .upload(storagePath, fileData, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // Insert database record
  const { data, error: insertError } = await supabase
    .from('proof_photos')
    .insert({
      driver_id: driverId,
      campaign_id: campaignId,
      storage_path: storagePath,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy_meters: location.accuracyMeters,
      photo_timestamp: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertError || !data) {
    // Rollback storage upload
    await supabase.storage.from('proofs').remove([storagePath]).catch(() => {
      console.warn('[proof-photos] Failed to rollback storage upload');
    });
    throw new Error(`Database insert failed: ${insertError?.message ?? 'unknown'}`);
  }

  return { id: data.id, path: storagePath };
}
