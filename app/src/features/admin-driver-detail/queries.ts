import { createServiceClient } from '@/lib/supabase/service'

export interface AdminDriverVehicle {
  id: string
  plate: string
  makeModel: string
  year: number | null
  engineType: string | null
  status: string
}

export interface AdminDriverCampaign {
  campaignId: string
  campaignName: string
  campaignStatus: string
  firmName: string
}

export interface AdminDriverDetail {
  id: string
  fullName: string | null
  email: string | null
  phone: string | null
  city: string | null
  status: string
  referralCode: string | null
  stripePayoutsEnabled: boolean
  kycCompletedAt: string | null
  createdAt: string | null
  vehicles: AdminDriverVehicle[]
  campaigns: AdminDriverCampaign[]
}

/**
 * Pełne dane kierowcy dla panelu admina (profil + pojazdy + kampanie/firmy).
 * service_role — wywołuj wyłącznie po zweryfikowaniu roli admin w stronie.
 * Zwraca null, gdy kierowca nie istnieje.
 */
export async function getAdminDriverDetail(driverId: string): Promise<AdminDriverDetail | null> {
  const sb = createServiceClient()

  const { data: driver } = await sb
    .from('drivers')
    .select('id, status, city, referral_code, stripe_payouts_enabled, kyc_completed_at, created_at')
    .eq('id', driverId)
    .maybeSingle()

  if (!driver) return null

  const [{ data: profile }, { data: vehicles }, { data: cvRows }] = await Promise.all([
    sb.from('profiles').select('full_name, email, phone').eq('id', driverId).maybeSingle(),
    sb.from('vehicles')
      .select('id, registration_plate, make, model, year, engine_type, status')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: true }),
    sb.from('campaign_vehicles').select('campaign_id').eq('driver_id', driverId).is('removed_at', null),
  ])

  // Kampanie + firmy
  const campaignIds = [...new Set((cvRows ?? []).map(r => r.campaign_id as string))]
  let campaigns: AdminDriverCampaign[] = []
  if (campaignIds.length > 0) {
    const { data: camps } = await sb
      .from('campaigns')
      .select('id, name, status, advertiser_id')
      .in('id', campaignIds)
    const advertiserIds = [...new Set((camps ?? []).map(c => c.advertiser_id as string))]
    const { data: advertisers } = await sb
      .from('advertisers')
      .select('id, company_name')
      .in('id', advertiserIds)
    const firmById = new Map((advertisers ?? []).map(a => [a.id, a.company_name as string]))
    campaigns = (camps ?? []).map(c => ({
      campaignId: c.id as string,
      campaignName: c.name as string,
      campaignStatus: c.status as string,
      firmName: c.advertiser_id ? (firmById.get(c.advertiser_id as string) ?? 'Firma') : 'Firma',
    }))
  }

  return {
    id: driver.id as string,
    fullName: (profile?.full_name as string) ?? null,
    email: (profile?.email as string) ?? null,
    phone: (profile?.phone as string) ?? null,
    city: (driver.city as string) ?? null,
    status: driver.status as string,
    referralCode: (driver.referral_code as string) ?? null,
    stripePayoutsEnabled: Boolean(driver.stripe_payouts_enabled),
    kycCompletedAt: (driver.kyc_completed_at as string) ?? null,
    createdAt: (driver.created_at as string) ?? null,
    vehicles: (vehicles ?? []).map(v => ({
      id: v.id as string,
      plate: (v.registration_plate as string) ?? '—',
      makeModel: [v.make, v.model].filter(Boolean).join(' ') || '—',
      year: (v.year as number | null) ?? null,
      engineType: (v.engine_type as string) ?? null,
      status: (v.status as string) ?? '—',
    })),
    campaigns,
  }
}
