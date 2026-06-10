/**
 * useGpsTracking Hook
 * Manages GPS tracking state, session lifecycle, and integration with background task
 */

import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';

import { supabase } from '../../lib/supabase';
import {
  UseGpsTrackingResult,
  GpsSession,
  StartSessionOptions,
  GpsError,
} from '../types';
import { getBufferedPoints } from '../lib/sqlite-buffer';
import { uploadAndFinalizeSession } from '../lib/supabase-uploader';
import { startBackgroundTracking, stopBackgroundTracking } from '../background-task';

const SESSION_STORAGE_KEY = 'gps_session_state';
const TASK_NAME = 'gps-tracking-background';

export function useGpsTracking(): UseGpsTrackingResult {
  const [session, setSession] = useState<GpsSession | null>(null);
  const [status, setStatus] = useState<'idle' | 'active' | 'paused' | 'error'>('idle');
  const [error, setError] = useState<GpsError | null>(null);

  // On mount: restore state from SecureStore
  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
        if (saved) {
          const s = JSON.parse(saved);
          setSession(s);
          setStatus(s.status === 'paused' ? 'paused' : 'active');

          // If was active, re-start background tracking
          if (s.status === 'active') {
            try {
              const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
              if (isRegistered) {
                await startBackgroundTracking();
              }
            } catch (err) {
              console.warn('[gps-hook] Failed to restore background tracking:', err);
            }
          }
        }
      } catch (err) {
        console.warn('[gps-hook] Failed to restore session:', err);
      }
    })();
  }, []);

  const start = useCallback(
    async (opts: StartSessionOptions) => {
      setError(null);

      try {
        // Request permission
        const permStatus = await Location.requestForegroundPermissionsAsync();
        if (permStatus.status !== 'granted') {
          setStatus('error');
          setError({
            code: 'PERMISSION_DENIED',
            message: 'Dostęp do lokalizacji został odrzucony',
          });
          return;
        }

        // Check if task is registered
        const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
        if (!isRegistered) {
          setStatus('error');
          setError({
            code: 'TASK_FAILED',
            message: 'Tło zadanie GPS nie zarejestrowane',
          });
          return;
        }

        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          setStatus('error');
          setError({
            code: 'TASK_FAILED',
            message: 'Brak zalogowanego użytkownika',
          });
          return;
        }

        // Create session in Supabase
        const { data: sessionData, error: sessionError } = await supabase
          .from('gps_sessions')
          .insert({
            driver_id: userData.user.id,
            vehicle_id: opts.vehicleId,
            campaign_id: opts.campaignId,
            status: 'active',
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (sessionError || !sessionData) {
          setStatus('error');
          setError({
            code: 'TASK_FAILED',
            message: `Błąd tworzenia sesji: ${sessionError?.message || 'Unknown error'}`,
          });
          return;
        }

        // Create session object
        const newSession: GpsSession = {
          id: sessionData.id,
          vehicleId: opts.vehicleId,
          campaignId: opts.campaignId,
          startedAt: sessionData.started_at,
          status: 'active',
          pointsCount: 0,
        };

        // Persist to SecureStore
        await SecureStore.setItemAsync(SESSION_STORAGE_KEY, JSON.stringify(newSession));

        // Start background tracking
        await startBackgroundTracking();

        // Update state
        setSession(newSession);
        setStatus('active');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setStatus('error');
        setError({
          code: 'TASK_FAILED',
          message: `Błąd uruchomienia GPS: ${message}`,
        });
        console.error('[gps-hook] Start error:', err);
      }
    },
    [],
  );

  const pause = useCallback(async () => {
    if (!session) return;

    try {
      // Update in Supabase
      const { error: updateError } = await supabase
        .from('gps_sessions')
        .update({ status: 'paused' })
        .eq('id', session.id);

      if (updateError) {
        setError({
          code: 'TASK_FAILED',
          message: `Błąd wznowienia: ${updateError.message}`,
        });
        return;
      }

      // Update local state
      const paused: GpsSession = { ...session, status: 'paused' };
      setSession(paused);
      setStatus('paused');

      // Persist
      await SecureStore.setItemAsync(SESSION_STORAGE_KEY, JSON.stringify(paused));

      // Stop location updates but keep session
      await stopBackgroundTracking();
    } catch (err) {
      setError({
        code: 'TASK_FAILED',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
      console.error('[gps-hook] Pause error:', err);
    }
  }, [session]);

  const stop = useCallback(async () => {
    if (!session) return;

    try {
      // Stop background tracking
      await stopBackgroundTracking();

      // Upload remaining points
      const bufferedPoints = await getBufferedPoints(session.id);
      if (bufferedPoints.length > 0) {
        console.log(`[gps-hook] Uploading ${bufferedPoints.length} remaining points`);
        await uploadAndFinalizeSession(session.id, bufferedPoints);
      } else {
        // No points, but still finalize session
        const now = new Date().toISOString();
        const { error: updateError } = await supabase
          .from('gps_sessions')
          .update({
            ended_at: now,
            status: 'ended',
          })
          .eq('id', session.id);

        if (updateError) {
          console.error('[gps-hook] Failed to finalize session:', updateError);
        }
      }

      // Clear persisted state
      await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);

      // Update local state
      setSession(null);
      setStatus('idle');
      setError(null);
    } catch (err) {
      setError({
        code: 'TASK_FAILED',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
      console.error('[gps-hook] Stop error:', err);
    }
  }, [session]);

  return {
    isTracking: session !== null && status === 'active',
    status,
    session,
    error,
    start,
    stop,
    pause,
  };
}
