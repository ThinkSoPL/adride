import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CampaignVehicle,
  DateRange,
  SessionRoute,
} from '../types';

const SESSION_SELECT = `
  id,
  vehicle_id,
  campaign_id,
  started_at,
  ended_at,
  total_distance_m,
  total_points,
  avg_speed_kmh,
  route_geom,
  vehicles:vehicle_id ( registration_plate_masked )
`;

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

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    vehicle_id: row.vehicle_id as string,
    campaign_id: row.campaign_id as string,
    started_at: row.started_at as string,
    ended_at: row.ended_at as string | null,
    total_distance_m: row.total_distance_m as number | null,
    total_points: (row.total_points as number) ?? 0,
    avg_speed_kmh: row.avg_speed_kmh as number | null,
    route_geom: row.route_geom as SessionRoute['route_geom'],
    vehicles: row.vehicles as SessionRoute['vehicles'],
  }));
}

export async function fetchCampaignVehicles(
  supabase: SupabaseClient,
  campaignId: string,
): Promise<CampaignVehicle[]> {
  const { data, error } = await supabase
    .from('campaign_vehicles')
    .select(`
      vehicle_id,
      vehicles:vehicle_id ( id, driver_id, registration_plate_masked )
    `)
    .eq('campaign_id', campaignId)
    .is('removed_at', null);

  if (error) throw new Error(`fetchCampaignVehicles: ${error.message}`);

  const rows = (data ?? []) as unknown as Array<{
    vehicles: {
      id: string;
      driver_id: string;
      registration_plate_masked: string;
    } | null;
  }>;

  return rows
    .map((row) => row.vehicles)
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .map((v) => ({
      id: v.id,
      driver_id: v.driver_id,
      registration_plate_masked: v.registration_plate_masked,
    }));
}
