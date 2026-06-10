// =============================================================================
// AdRide GPS Tracking — hook statystyk live
// Odpytuje SQLite co 2s i oblicza km/czas/prędkość na bieżąco
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import { cumulativeDistance } from '../haversine';
import { gpsBuffer } from '../storage';
import { trackingEmitter } from '../emitter';
import type { GpsPoint, TrackingStats } from '../types';

const STATS_POLL_INTERVAL_MS = 2_000; // odświeżaj UI co 2s

const EMPTY_STATS: TrackingStats = {
  km: 0,
  durationSec: 0,
  avgSpeedKmh: 0,
  pointsCount: 0,
};

// =============================================================================
// useTrackingStats
// =============================================================================

/**
 * Hook zwracający statystyki na żywo dla aktywnej sesji.
 *
 * Dane pobierane z lokalnego buffera SQLite (nie z Supabase),
 * więc działają offline i mają minimalne opóźnienie.
 *
 * @param sessionId - UUID aktywnej sesji (null → zwraca zerowe statsy)
 * @param startedAt - ISO timestamp startu sesji (do obliczenia durationSec)
 */
export function useTrackingStats(
  sessionId: string | null,
  startedAt: string | null,
): TrackingStats {
  const [stats, setStats] = useState<TrackingStats>(EMPTY_STATS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!sessionId || !startedAt) {
      setStats(EMPTY_STATS);
      return;
    }

    startTimeRef.current = new Date(startedAt).getTime();

    const computeStats = async (): Promise<void> => {
      try {
        // Pobierz wszystkie punkty sesji z buffera lokalnego
        // Uwaga: dla dużych sesji (>5000 pkt) limit zapytania by ROWID
        const rows = await gpsBuffer.getUnuploadedBatch(10_000);
        const sessionRows = rows.filter((r) => r.sessionId === sessionId);

        // Mapa StoredPoint → GpsPoint (subset)
        const points: GpsPoint[] = sessionRows.map((r) => ({
          sessionId: r.sessionId,
          lat: r.lat,
          lng: r.lng,
          speedKmh: r.speedKmh,
          accuracyM: r.accuracyM,
          heading: r.heading,
          batteryLevel: r.batteryLevel,
          recordedAt: r.recordedAt,
        }));

        const distanceM = cumulativeDistance(points);
        const km = Math.round(distanceM / 10) / 100; // zaokrągl do 0.01km

        const durationSec = Math.floor(
          (Date.now() - startTimeRef.current) / 1_000,
        );

        // Prędkość z ostatnich 30 sekund (bardziej "live" niż avg sesji)
        const recentCutoff = Date.now() - 30_000;
        const recentPoints = points.filter((p) => p.recordedAt >= recentCutoff);
        const avgSpeedKmh =
          recentPoints.length > 0
            ? recentPoints.reduce((sum, p) => sum + (p.speedKmh ?? 0), 0) /
              recentPoints.length
            : 0;

        const newStats: TrackingStats = {
          km,
          durationSec,
          avgSpeedKmh: Math.round(avgSpeedKmh * 10) / 10,
          pointsCount: points.length,
        };

        setStats(newStats);
        trackingEmitter.emit('STATS_UPDATED', newStats);
      } catch (err) {
        console.warn('[useTrackingStats] Błąd obliczania statystyk:', err);
      }
    };

    // Pierwsze wywołanie natychmiastowe
    computeStats();

    timerRef.current = setInterval(computeStats, STATS_POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [sessionId, startedAt]);

  // Reset przy zakończeniu sesji
  useEffect(() => {
    const unsub = trackingEmitter.on('STATUS_CHANGED', ({ status }) => {
      if (status === 'idle') {
        setStats(EMPTY_STATS);
      }
    });
    return unsub;
  }, []);

  return stats;
}
