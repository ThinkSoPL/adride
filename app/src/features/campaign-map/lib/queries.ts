import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CampaignVehicle,
  DateRange,
  SessionRoute,
} from '../types';
import { createServiceClient } from '@/lib/supabase/service';

// UWAGA: nie pobieramy już `registration_plate_masked` przez zagnieżdżony JOIN.
// Po naprawie rekursji RLS reklamodawca nie ma SELECT na `vehicles`, więc join
// zwracałby null. Zamiast tego dociągamy zamaskowane tablice osobno przez
// service_role — ALE wyłącznie dla vehicle_id, które RLS-client już zwrócił
// (czyli do których użytkownik ma dostęp w ramach kampanii). Autoryzacja
// pozostaje po stronie RLS; service_role służy tylko do wzbogacenia wyświetlania.
const SESSION_SELECT = `
  id,
  vehicle_id,
  campaign_id,
  started_at,
  ended_at,
  total_distance_m,
  total_points,
  avg_speed_kmh,
  route_geom
`;

/** Mapa vehicle_id → zamaskowana tablica (przez service_role). */
async function fetchMaskedPlates(vehicleIds: string[]): Promise<Map<string, string>> {
  const ids = [...new Set(vehicleIds)].filter(Boolean);
  if (ids.length === 0) return new Map();
  const service = createServiceClient();
  const { data } = await service
    .from('vehicles')
    .select('id, registration_plate_masked')
    .in('id', ids);
  return new Map((data ?? []).map((v) => [v.id as string, (v.registration_plate_masked as string) ?? '—']));
}

export async function fetchCampaignSessions(
  supabase: SupabaseClient,
  campaignId: string,
  range: DateRange,
): Promise<SessionRoute[]> {
  const { data, error } = await supabase
    .from('gps_sessions')
    .select(SESSION_SELECT)
    .eq('campaign_id', campaignId)
    .gte('started_at', range.from.toISOString())
    .lte('started_at', range.to.toISOString())
    .order('started_at', { ascending: false })
    .limit(500);

  if (error) throw new Error(`fetchCampaignSessions: ${error.message}`);

  const rows = data ?? [];
  const plates = await fetchMaskedPlates(rows.map((r: Record<string, unknown>) => r.vehicle_id as string));

  return rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    vehicle_id: row.vehicle_id as string,
    campaign_id: row.campaign_id as string,
    started_at: row.started_at as string,
    ended_at: row.ended_at as string | null,
    total_distance_m: row.total_distance_m as number | null,
    total_points: (row.total_points as number) ?? 0,
    avg_speed_kmh: row.avg_speed_kmh as number | null,
    route_geom: row.route_geom as SessionRoute['route_geom'],
    vehicles: { registration_plate_masked: plates.get(row.vehicle_id as string) ?? '—' },
  }));
}

export async function fetchCampaignVehicles(
  supabase: SupabaseClient,
  campaignId: string,
): Promise<CampaignVehicle[]> {
  // campaign_vehicles ma zdenormalizowany driver_id (migracja 23) — nie trzeba
  // już joinować vehicles (do którego advertiser nie ma RLS).
  const { data, error } = await supabase
    .from('campaign_vehicles')
    .select('vehicle_id, driver_id')
    .eq('campaign_id', campaignId)
    .is('removed_at', null);

  if (error) throw new Error(`fetchCampaignVehicles: ${error.message}`);

  const rows = (data ?? []) as Array<{ vehicle_id: string; driver_id: string | null }>;
  const plates = await fetchMaskedPlates(rows.map((r) => r.vehicle_id));

  return rows.map((r) => ({
    id: r.vehicle_id,
    driver_id: r.driver_id ?? '',
    registration_plate_masked: plates.get(r.vehicle_id) ?? '—',
  }));
}
