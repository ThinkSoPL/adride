import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera } from 'expo-camera';
import type { CameraView } from 'expo-camera';
import { supabase } from '../../../lib/supabase';
import { getCurrentLocationForProof } from '../lib/location';
import { uploadProofPhoto } from '../lib/upload';
import type { ProofPhoto, PhotoCaptureResult } from '../types';

export interface UseProofPhotoCameraResult {
  cameraRef: React.RefObject<CameraView | null>;
  hasPermission: boolean | null;
  isUploading: boolean;
  uploadError: string | null;
  takePhoto: () => Promise<void>;
  clearError: () => void;
}

export function useProofPhotoCamera(
  driverId: string,
  campaignId: string,
  onPhotoUploaded?: (photo: ProofPhoto) => void,
): UseProofPhotoCameraResult {
  const cameraRef = useRef<CameraView | null>(null);
  const isMountedRef = useRef(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (isMountedRef.current) {
          setHasPermission(status === 'granted');
        }
      } catch (err) {
        console.warn('[proof-photos] Permission request failed:', err);
        if (isMountedRef.current) setHasPermission(false);
      }
    })();
  }, []);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current || isUploading) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const photo = (await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
        skipProcessing: false,
      })) as PhotoCaptureResult | undefined;

      if (!photo) {
        throw new Error('Nie udało się zrobić zdjęcia');
      }

      const location = await getCurrentLocationForProof();

      const { id } = await uploadProofPhoto(supabase, {
        driverId,
        campaignId,
        photo,
        location,
      });

      const { data } = await supabase
        .from('proof_photos')
        .select('*')
        .eq('id', id)
        .single();

      if (!isMountedRef.current) return;

      if (data && onPhotoUploaded) {
        onPhotoUploaded({
          id: data.id,
          createdAt: new Date(data.created_at),
          driverId: data.driver_id,
          campaignId: data.campaign_id,
          storagePath: data.storage_path,
          latitude: data.latitude,
          longitude: data.longitude,
          accuracyMeters: data.accuracy_meters,
          photoTimestamp: new Date(data.photo_timestamp),
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        const message =
          error instanceof Error ? error.message : 'Upload nie powiódł się';
        setUploadError(message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
      }
    }
  }, [driverId, campaignId, onPhotoUploaded, isUploading]);

  const clearError = useCallback(() => setUploadError(null), []);

  return {
    cameraRef,
    hasPermission,
    isUploading,
    uploadError,
    takePhoto,
    clearError,
  };
}
