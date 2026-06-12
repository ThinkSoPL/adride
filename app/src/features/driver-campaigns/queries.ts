import { createServiceClient } from '@/lib/supabase/service'

export interface DriverCampaignRow {
  campaignId: string
  campaignName: string
  campaignStatus: string
  firmName: string
  vehiclePlateMasked: string
  vehicleMakeModel: string
  /** km przejechane w tej kampanii w bieżącym miesiącu */
  kmThisMonth: number
}

/** Pierwszy dzień bieżącego miesiąca w ISO (UTC). */
function startOfMonthISO(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

/**
 * Kampanie, w których uczestniczy dany kierowca (po denormalizowanym driver_id
 * w campaign_vehicles), wraz z nazwą firmy i pojazdem.
 *
 * Bezpieczeństwo: service_role (BYPASSRLS), ale ZAWSZE zawężone do
 * `driver_id = przekazany driverId`. Wywołuj tylko po stronie serwera, po
 * potwierdzeniu tożsamości kierowcy (requireRole('driver')).
 *
 * Powód: kierowca nie ma SELECT na `advertisers` (RLS), więc nazwę firmy,
 * w której jeździ, czytamy przez tę warstwę z jawną kontrolą własności.
 */
export async function getDriverCampaigns(driverId: string): Promise<DriverCampaignRow[]> {
  const sb = createServiceClient()

  // 1. Aktywne przypisania pojazd–kampania tego kierowcy
  const { data: cvRows } = await sb
    .from('campaign_vehicles')
    .select('campaign_id, vehicle_id')
    .eq('driver_id', driverId)
    .is('removed_at', null)

  const campaignIds = [...new Set((cvRows ?? []).map(r => r.campaign_id as string))]
  if (campaignIds.length === 0) return []

  const vehicleIds = [...new Set((cvRows ?? []).map(r => r.vehicle_id as string))]

  // 2. Kampanie + 3. firmy + 4. pojazdy (równolegle)
  const [{ data: campaigns }, { data: vehicles }, { data: sessions }] = await Promise.all([
    sb.from('campaigns').select('id, name, status, advertiser_id').in('id', campaignIds),
    sb.from('vehicles').select('id, registration_plate_masked, make, model').in('id', vehicleIds),
    sb.from('gps_sessions')
      .select('campaign_id, total_distance_m')
      .eq('driver_id', driverId)
      .in('campaign_id', campaignIds)
      .gte('started_at', startOfMonthISO()),
  ])

  const advertiserIds = [...new Set((campaigns ?? []).map(c => c.advertiser_id as string))]
  const { data: advertisers } = await sb
    .from('advertisers')
    .select('id, company_name')
    .in('id', advertiserIds)

  const campaignById = new Map((campaigns ?? []).map(c => [c.id, c]))
  const vehicleById = new Map((vehicles ?? []).map(v => [v.id, v]))
  const firmById = new Map((advertisers ?? []).map(a => [a.id, a.company_name as string]))

  const kmByCampaign = new Map<string, number>()
  for (const s of sessions ?? []) {
    const m = (s.total_distance_m as number | null) ?? 0
    const cid = s.campaign_id as string
    kmByCampaign.set(cid, (kmByCampaign.get(cid) ?? 0) + m)
  }

  return (cvRows ?? []).map(cv => {
    const c = campaignById.get(cv.campaign_id)
    const v = vehicleById.get(cv.vehicle_id)
    const km = (kmByCampaign.get(cv.campaign_id as string) ?? 0) / 1000
    return {
      campaignId: cv.campaign_id as string,
      campaignName: (c?.name as string) ?? 'Kampania',
      campaignStatus: (c?.status as string) ?? 'unknown',
      firmName: c?.advertiser_id ? (firmById.get(c.advertiser_id as string) ?? 'Firma') : 'Firma',
      vehiclePlateMasked: (v?.registration_plate_masked as string) ?? '—',
      vehicleMakeModel: [v?.make, v?.model].filter(Boolean).join(' ') || 'Pojazd',
      kmThisMonth: Math.round(km * 10) / 10,
    }
  })
}
