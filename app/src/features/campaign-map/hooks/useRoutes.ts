'use client';

import { useEffect, useRef, useState } from 'react';
import { useMapStore } from '../store';
import { getSupabaseBrowserClient } from '../lib/supabase-browser';
import { fetchCampaignSessions } from '../lib/queries';
import type { SessionRoute } from '../types';

/**
 * Re-fetch sessions po zmianie dateRange / vehicleIds.
 * Pierwszy render zwraca initialRoutes z SSR; kolejne zmiany trigger refetch.
 */
export function useRoutes(
  campaignId: string,
  initialRoutes: SessionRoute[],
) {
  const dateRange = useMapStore((s) => s.filters.dateRange);
  const vehicleIds = useMapStore((s) => s.filters.vehicleIds);

  const [routes, setRoutes] = useState<SessionRoute[]>(initialRoutes);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const firstRenderRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Pomiń pierwszy render (mamy SSR data)
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const sessions = await fetchCampaignSessions(
          supabase,
          campaignId,
          dateRange,
        );

        if (controller.signal.aborted) return;

        const filtered =
          vehicleIds.length === 0
            ? sessions
            : sessions.filter((s) => vehicleIds.includes(s.vehicle_id));

        setRoutes(filtered);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [campaignId, dateRange, vehicleIds]);

  return { routes, isLoading, error };
}
