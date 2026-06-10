'use client';

import { useEffect, useRef } from 'react';
import { useMapStore } from '../store';
import { getSupabaseBrowserClient } from '../lib/supabase-browser';
import type {
  CampaignVehicle,
  GpsPointRaw,
  SessionRoute,
  VehicleMarker,
} from '../types';

const STALE_CHECK_MS = 30_000;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

/**
 * Subskrypcja Supabase Realtime na gps_points dla campaignId.
 * Buduje cache session_id → vehicle_id z initialSessions; brakujące mappings
 * fetcha leniwie z gps_sessions przy pierwszym napotkaniu.
 */
export function useRealtimeVehicles(
  campaignId: string,
  vehicles: CampaignVehicle[],
  initialSessions: SessionRoute[] = [],
) {
  const upsertLive = useMapStore((s) => s.upsertLiveVehicle);
  const removeStale = useMapStore((s) => s.removeStaleLiveVehicles);

  const vehiclesByIdRef = useRef<Map<string, CampaignVehicle>>(new Map());
  const sessionToVehicleRef = useRef<Map<string, string>>(new Map());
  const pendingLookupRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    vehiclesByIdRef.current = new Map(vehicles.map((v) => [v.id, v]));
  }, [vehicles]);

  useEffect(() => {
    const cache = sessionToVehicleRef.current;
    for (const s of initialSessions) cache.set(s.id, s.vehicle_id);
  }, [initialSessions]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const handle = async (row: GpsPointRaw) => {
      let vehicleId = sessionToVehicleRef.current.get(row.session_id);

      if (!vehicleId && !pendingLookupRef.current.has(row.session_id)) {
        pendingLookupRef.current.add(row.session_id);
        const { data } = await supabase
          .from('gps_sessions')
          .select('vehicle_id')
          .eq('id', row.session_id)
          .maybeSingle();
        pendingLookupRef.current.delete(row.session_id);

        if (data?.vehicle_id) {
          vehicleId = data.vehicle_id as string;
          sessionToVehicleRef.current.set(row.session_id, vehicleId);
        }
      }

      if (!vehicleId) return;
      const vehicle = vehiclesByIdRef.current.get(vehicleId);
      if (!vehicle) return;

      const marker = mapRowToMarker(row, vehicleId, vehicle.registration_plate_masked);
      upsertLive(marker);
    };

    const channel = supabase
      .channel(`campaign-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gps_points',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          void handle(payload.new as GpsPointRaw);
        },
      )
      .subscribe();

    const interval = setInterval(removeStale, STALE_CHECK_MS);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [campaignId, upsertLive, removeStale]);
}

function mapRowToMarker(
  row: GpsPointRaw,
  vehicleId: string,
  registrationMasked: string,
): VehicleMarker {
  const lastSeenMs = new Date(row.recorded_at).getTime();
  const isLive = Date.now() - lastSeenMs < FIVE_MINUTES_MS;
  const [lng, lat] = row.location.coordinates;

  return {
    vehicleId,
    sessionId: row.session_id,
    registrationMasked,
    lat,
    lng,
    heading: row.heading,
    speedKmh: row.speed_kmh,
    batteryLevel: row.battery_level,
    lastSeen: row.recorded_at,
    isLive,
  };
}
