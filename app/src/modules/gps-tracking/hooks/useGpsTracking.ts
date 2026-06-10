// =============================================================================
// AdRide GPS Tracking — hook React dla UI
// Opakowuje TrackingService w reaktywny interfejs dla komponentów
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { trackingEmitter } from '../emitter';
import { trackingService } from '../tracking-service';
import type {
  GpsSession,
  TrackingConfig,
  TrackingError,
  TrackingStatus,
} from '../types';

// ─── Typ zwracany przez hook ──────────────────────────────────────────────────

export interface UseGpsTrackingReturn {
  /** Czy sesja jest aktywna (nie paused) */
  isTracking: boolean;
  /** Aktywna sesja lub null gdy idle */
  session: GpsSession | null;
  /** Aktualny status: idle | active | paused | error */
  status: TrackingStatus;
  /** Ostatni błąd (null gdy brak) */
  error: TrackingError | null;
  /** Startuje nową sesję z podaną konfiguracją */
  start: (config: TrackingConfig) => Promise<void>;
  /** Kończy sesję i flushuje bufor */
  stop: () => Promise<void>;
  /** Pauzuje sesję bez kończenia */
  pause: () => Promise<void>;
  /** Wznawia zapauzowaną sesję */
  resume: () => Promise<void>;
}

// =============================================================================
// useGpsTracking
// =============================================================================

export function useGpsTracking(): UseGpsTrackingReturn {
  const [status, setStatus] = useState<TrackingStatus>(
    trackingService.getStatus(),
  );
  const [session, setSession] = useState<GpsSession | null>(
    trackingService.getSession(),
  );
  const [error, setError] = useState<TrackingError | null>(null);

  // Ref do anulowania subskrypcji
  const unsubsRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    const unsubs = unsubsRef.current;

    // Subskrybuj zmiany statusu
    unsubs.push(
      trackingEmitter.on('STATUS_CHANGED', ({ status: s }) => {
        setStatus(s);
        setSession(trackingService.getSession());
      }),
    );

    // Autoryzacja wygasła — pokaż błąd w UI
    unsubs.push(
      trackingEmitter.on('AUTH_ERROR', () => {
        setError({
          code: 'AUTH_ERROR',
          message: 'Sesja wygasła. Zaloguj się ponownie, aby kontynuować.',
        });
        setStatus('error');
      }),
    );

    // Wznowienie sesji po restarcie aplikacji
    unsubs.push(
      trackingEmitter.on('SESSION_RESUMED', () => {
        setStatus(trackingService.getStatus());
        setSession(trackingService.getSession());
      }),
    );

    return () => {
      unsubs.forEach((fn) => fn());
      unsubsRef.current = [];
    };
  }, []);

  // ─── Akcje ─────────────────────────────────────────────────────────────────

  const start = useCallback(async (config: TrackingConfig): Promise<void> => {
    setError(null);
    try {
      await trackingService.startSession(config);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      const trackingError: TrackingError = { code: 'UNKNOWN', message };
      setError(trackingError);
      setStatus('error');
    }
  }, []);

  const stop = useCallback(async (): Promise<void> => {
    try {
      await trackingService.stopSession();
    } catch (err) {
      console.error('[useGpsTracking] Błąd stopSession:', err);
    }
  }, []);

  const pause = useCallback(async (): Promise<void> => {
    try {
      await trackingService.pauseSession();
    } catch (err) {
      console.error('[useGpsTracking] Błąd pauseSession:', err);
    }
  }, []);

  const resume = useCallback(async (): Promise<void> => {
    try {
      await trackingService.resumeSession();
    } catch (err) {
      console.error('[useGpsTracking] Błąd resumeSession:', err);
    }
  }, []);

  return {
    isTracking: status === 'active',
    session,
    status,
    error,
    start,
    stop,
    pause,
    resume,
  };
}
