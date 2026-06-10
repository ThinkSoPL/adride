import { supabase } from './supabase';

// ─── Typy zwracane przez queries ──────────────────────────────────────────────

export interface DriverProfile {
  id: string;
  fullName: string;
  status: 'pending' | 'approved' | 'active' | 'paused' | 'rejected';
  stripePayoutsEnabled: boolean;
  city: string;
}

export interface MonthlyStats {
  totalKm: number;
  totalSessions: number;
  daysActive: number;
}

export interface ActiveCampaign {
  id: string;
  name: string;
  status: string;
  endDate: string | null;
  minKmMonthly: number;
  kmThisMonth: number;
}

export interface SessionSummary {
  id: string;
  startedAt: string;
  endedAt: string | null;
  totalKm: number;
  avgSpeedKmh: number | null;
  campaignName: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currentMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function currentMonthEnd(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function fetchDriverProfile(driverId: string): Promise<DriverProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      drivers!inner ( status, stripe_payouts_enabled, city )
    `)
    .eq('id', driverId)
    .single();

  if (error) throw new Error(`fetchDriverProfile: ${error.message}`);

  const profile = data as {
    id: string;
    full_name: string;
    drivers: {
      status: DriverProfile['status'];
      stripe_payouts_enabled: boolean;
      city: string;
    };
  };

  return {
    id: profile.id,
    fullName: profile.full_name ?? 'Kierowca',
    status: profile.drivers.status,
    stripePayoutsEnabled: profile.drivers.stripe_payouts_enabled,
    city: profile.drivers.city,
  };
}

export async function fetchMonthlyStats(driverId: string): Promise<MonthlyStats> {
  const yearMonth = (() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
  })();

  const { data, error } = await supabase
    .from('mv_driver_monthly_stats')
    .select('total_km, total_sessions, days_active')
    .eq('driver_id', driverId)
    .eq('year_month', yearMonth)
    .maybeSingle();

  if (error) throw new Error(`fetchMonthlyStats: ${error.message}`);

  return {
    totalKm: Number(data?.total_km ?? 0),
    totalSessions: Number(data?.total_sessions ?? 0),
    daysActive: Number(data?.days_active ?? 0),
  };
}

export async function fetchMonthlyEarningsPLN(driverId: string): Promise<number> {
  const { data, error } = await supabase
    .from('payouts')
    .select('amount_grosze')
    .eq('driver_id', driverId)
    .eq('status', 'paid')
    .gte('period_start', currentMonthStart().slice(0, 10))
    .lte('period_end', currentMonthEnd().slice(0, 10));

  if (error) throw new Error(`fetchMonthlyEarnings: ${error.message}`);

  const totalGrosze = (data ?? []).reduce(
    (sum, row) => sum + Number((row as { amount_grosze: number }).amount_grosze),
    0,
  );
  return totalGrosze / 100;
}

export async function fetchActiveCampaign(
  driverId: string,
  monthlyKm: number,
): Promise<ActiveCampaign | null> {
  // Krok 1: znajdź pojazdy kierowcy w aktywnej kampanii
  const { data: vehicles, error: vErr } = await supabase
    .from('vehicles')
    .select('id')
    .eq('driver_id', driverId)
    .eq('status', 'in_campaign');

  if (vErr) throw new Error(`fetchActiveCampaign/vehicles: ${vErr.message}`);
  if (!vehicles || vehicles.length === 0) return null;

  const vehicleIds = (vehicles as { id: string }[]).map((v) => v.id);

  // Krok 2: znajdź aktywne przypisanie do kampanii
  const { data: assignments, error: aErr } = await supabase
    .from('campaign_vehicles')
    .select(`
      campaign_id,
      campaigns!inner ( id, name, status, end_date, min_km_per_vehicle_monthly )
    `)
    .in('vehicle_id', vehicleIds)
    .is('removed_at', null)
    .limit(1);

  if (aErr) throw new Error(`fetchActiveCampaign/assignments: ${aErr.message}`);
  if (!assignments || assignments.length === 0) return null;

  const first = assignments[0] as {
    campaign_id: string;
    campaigns: {
      id: string;
      name: string;
      status: string;
      end_date: string | null;
      min_km_per_vehicle_monthly: number;
    };
  };

  if (!first?.campaigns) return null;
  const c = first.campaigns;

  return {
    id: c.id,
    name: c.name,
    status: c.status,
    endDate: c.end_date,
    minKmMonthly: c.min_km_per_vehicle_monthly,
    kmThisMonth: monthlyKm,
  };
}

export async function fetchRecentSessions(
  driverId: string,
  limit = 10,
): Promise<SessionSummary[]> {
  const { data, error } = await supabase
    .from('gps_sessions')
    .select(`
      id,
      started_at,
      ended_at,
      total_distance_m,
      avg_speed_kmh,
      campaigns ( name )
    `)
    .eq('driver_id', driverId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`fetchRecentSessions: ${error.message}`);

  return (data ?? []).map((row) => {
    const r = row as {
      id: string;
      started_at: string;
      ended_at: string | null;
      total_distance_m: number | null;
      avg_speed_kmh: number | null;
      campaigns: { name: string } | null;
    };
    return {
      id: r.id,
      startedAt: r.started_at,
      endedAt: r.ended_at,
      totalKm: r.total_distance_m ? r.total_distance_m / 1000 : 0,
      avgSpeedKmh: r.avg_speed_kmh,
      campaignName: r.campaigns?.name ?? null,
    };
  });
}
