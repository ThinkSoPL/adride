import { subDays, startOfDay, endOfDay } from 'date-fns';
import { createSupabaseServerClient } from './lib/supabase-server';
import {
  fetchCampaignSessions,
  fetchCampaignVehicles,
} from './lib/queries';
import { CampaignMapClient } from './CampaignMapClient';
import type { CampaignMapServerProps } from './types';

export async function CampaignMapServer({
  campaignId,
}: CampaignMapServerProps) {
  const supabase = await createSupabaseServerClient();

  const initialRange = {
    from: startOfDay(subDays(new Date(), 7)),
    to: endOfDay(new Date()),
  };

  const [sessions, vehicles] = await Promise.all([
    fetchCampaignSessions(supabase, campaignId, initialRange),
    fetchCampaignVehicles(supabase, campaignId),
  ]);

  return (
    <CampaignMapClient
      campaignId={campaignId}
      initialRoutes={sessions}
      vehicles={vehicles}
    />
  );
}
