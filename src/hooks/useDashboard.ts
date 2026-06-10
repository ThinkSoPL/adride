import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  fetchDriverProfile,
  fetchMonthlyStats,
  fetchMonthlyEarningsPLN,
  fetchActiveCampaign,
  fetchRecentSessions,
} from '../lib/queries-mobile';
import type {
  ActiveCampaign,
  DriverProfile,
  MonthlyStats,
  SessionSummary,
} from '../lib/queries-mobile';

export interface DashboardData {
  profile: DriverProfile;
  monthlyStats: MonthlyStats;
  earningsPLN: number;
  activeCampaign: ActiveCampaign | null;
  recentSessions: SessionSummary[];
}

interface UseDashboardResult {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Brak aktywnej sesji.');

      const driverId = user.id;

      // Ładuj profile i stats równolegle — stats potrzebne do activeCampaign
      const [profile, monthlyStats, earningsPLN] = await Promise.all([
        fetchDriverProfile(driverId),
        fetchMonthlyStats(driverId),
        fetchMonthlyEarningsPLN(driverId),
      ]);

      // activeCampaign i sessions mogą iść równolegle
      const [activeCampaign, recentSessions] = await Promise.all([
        fetchActiveCampaign(driverId, monthlyStats.totalKm),
        fetchRecentSessions(driverId, 10),
      ]);

      setData({ profile, monthlyStats, earningsPLN, activeCampaign, recentSessions });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieoczekiwany błąd.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
