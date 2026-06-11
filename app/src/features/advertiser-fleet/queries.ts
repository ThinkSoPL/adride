import { createServiceClient } from '@/lib/supabase/service'

export interface FleetDriverRow {
  driverId: string
  driverName: string
  vehicleId: string
  plateMasked: string
  makeModel: string
  year: number | null
  district: string
  driverStatus: string
  campaignName: string
  /** km przejechane w bieżącym miesiącu (z reklamą) */
  kmThisMonth: number
}

export interface FleetSummary {
  rows: FleetDriverRow[]
  totalDrivers: number
  totalKmThisMonth: number
  /** lista unikalnych dzielnic (do filtra) */
  districts: string[]
}

/** Pierwszy dzień bieżącego miesiąca w ISO (UTC). */
function startOfMonthISO(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

/**
 * Zwraca flotę kierowców uczestniczących w kampaniach danego reklamodawcy,
 * wraz z km przejechanymi w bieżącym miesiącu.
 *
 * Bezpieczeństwo: używa service_role (BYPASSRLS), ale ZAWSZE zawęża dane do
 * kampanii, których `advertiser_id` = przekazane `advertiserId`. Wywołuj
 * wyłącznie po stronie serwera, po potwierdzeniu tożsamości reklamodawcy.
 */
export async function getAdvertiserFleet(advertiserId: string): Promise<FleetSummary> {
  const sb = createServiceClient()

  // 1. Kampanie reklamodawcy
  const { data: campaigns } = await sb
    .from('campaigns')
    .select('id, name, target_districts')
    .eq('advertiser_id', advertiserId)

  const campaignIds = (campaigns ?? []).map(c => c.id)
  if (campaignIds.length === 0) {
    return { rows: [], totalDrivers: 0, totalKmThisMonth: 0, districts: [] }
  }
  const campaignById = new Map(
    (campaigns ?? []).map(c => [c.id, { name: c.name as string, districts: (c.target_districts as string[]) ?? [] }]),
  )

  // 2. Pojazdy przypisane do tych kampanii (aktywne przypisania)
  const { data: cvRows } = await sb
    .from('campaign_vehicles')
    .select('campaign_id, vehicle_id, driver_id')
    .in('campaign_id', campaignIds)
    .is('removed_at', null)

  const vehicleIds = [...new Set((cvRows ?? []).map(r => r.vehicle_id))]
  if (vehicleIds.length === 0) {
    return { rows: [], totalDrivers: 0, totalKmThisMonth: 0, districts: [] }
  }

  // 3. Dane pojazdów (RODO: tablica zamaskowana)
  const { data: vehicles } = await sb
    .from('vehicles')
    .select('id, driver_id, registration_plate_masked, make, model, year, status')
    .in('id', vehicleIds)
  const vehicleById = new Map((vehicles ?? []).map(v => [v.id, v]))

  // 4. Dane kierowców: status + profil (imię)
  const driverIds = [...new Set((cvRows ?? []).map(r => r.driver_id).filter(Boolean) as string[])]
  const { data: drivers } = await sb
    .from('drivers')
    .select('id, status, city')
    .in('id', driverIds)
  const driverById = new Map((drivers ?? []).map(d => [d.id, d]))

  const { data: profiles } = await sb
    .from('profiles')
    .select('id, full_name')
    .in('id', driverIds)
  const profileById = new Map((profiles ?? []).map(p => [p.id, p]))

  // 5. km w bieżącym miesiącu — agregacja gps_sessions per pojazd
  const { data: sessions } = await sb
    .from('gps_sessions')
    .select('vehicle_id, total_distance_m, started_at')
    .in('campaign_id', campaignIds)
    .gte('started_at', startOfMonthISO())

  const kmByVehicle = new Map<string, number>()
  for (const s of sessions ?? []) {
    const m = (s.total_distance_m as number | null) ?? 0
    kmByVehicle.set(s.vehicle_id as string, (kmByVehicle.get(s.vehicle_id as string) ?? 0) + m)
  }

  // 6. Złożenie wierszy
  const rows: FleetDriverRow[] = (cvRows ?? []).map(cv => {
    const v = vehicleById.get(cv.vehicle_id)
    const d = cv.driver_id ? driverById.get(cv.driver_id) : undefined
    const p = cv.driver_id ? profileById.get(cv.driver_id) : undefined
    const camp = campaignById.get(cv.campaign_id)
    const km = (kmByVehicle.get(cv.vehicle_id) ?? 0) / 1000

    return {
      driverId: (cv.driver_id as string) ?? '',
      driverName: (p?.full_name as string) ?? 'Kierowca',
      vehicleId: cv.vehicle_id as string,
      plateMasked: (v?.registration_plate_masked as string) ?? '—',
      makeModel: [v?.make, v?.model].filter(Boolean).join(' ') || '—',
      year: (v?.year as number | null) ?? null,
      district: camp?.districts?.[0] ?? (d?.city as string) ?? '—',
      driverStatus: (d?.status as string) ?? 'unknown',
      campaignName: camp?.name ?? '—',
      kmThisMonth: Math.round(km * 10) / 10,
    }
  })

  const districts = [...new Set(rows.map(r => r.district).filter(x => x && x !== '—'))].sort()
  const totalKmThisMonth = Math.round(rows.reduce((s, r) => s + r.kmThisMonth, 0) * 10) / 10
  const totalDrivers = new Set(rows.map(r => r.driverId)).size

  return { rows, totalDrivers, totalKmThisMonth, districts }
}
