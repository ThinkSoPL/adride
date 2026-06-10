/**
 * AdRide — Demo Seed
 * Tworzy konta demo + dane do prezentacji na spotkaniach sprzedażowych.
 *
 * Uruchomienie: node scripts/seed-demo.mjs
 *
 * Konta po wykonaniu:
 *   admin@adride.pl       / AdRide2026!  (admin)
 *   tomek@demo.adride.pl  / AdRide2026!  (kierowca — 3 pojazdy, aktywna kampania)
 *   firma@demo.adride.pl  / AdRide2026!  (reklamodawca — kampania Mokotów aktywna)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// ---------- env ----------
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'), 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ---------- UUIDs (stałe — seed jest idempotentny) ----------
const IDS = {
  admin:       'a0000001-0000-0000-0000-000000000001',
  driver:      'a0000002-0000-0000-0000-000000000001',
  advertiser:  'a0000003-0000-0000-0000-000000000001',
  vehicle1:    'b0000001-0000-0000-0000-000000000001',
  vehicle2:    'b0000002-0000-0000-0000-000000000001',
  vehicle3:    'b0000003-0000-0000-0000-000000000001',
  campaign:    'c0000001-0000-0000-0000-000000000001',
  session1:    'd0000001-0000-0000-0000-000000000001',
  session2:    'd0000002-0000-0000-0000-000000000001',
  session3:    'd0000003-0000-0000-0000-000000000001',
  payout1:     'e0000001-0000-0000-0000-000000000001',
  payout2:     'e0000002-0000-0000-0000-000000000001',
}

function ok(label, data, error) {
  if (error && !error.message?.includes('already exists') && !error.message?.includes('duplicate') && !error.message?.includes('23505')) {
    console.error(`❌ ${label}:`, error.message)
    return false
  }
  console.log(`✅ ${label}`)
  return true
}

async function upsertUser(id, email, fullName, phone, role) {
  // Spróbuj pobrać istniejącego
  const { data: existing } = await sb.auth.admin.getUserById(id)
  if (existing?.user) {
    console.log(`✅ auth user (już istnieje): ${email}`)
    return existing.user
  }
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: 'AdRide2026!',
    email_confirm: true,
    user_metadata: { full_name: fullName, phone, role },
  })
  if (error) {
    // Może istnieć pod innym ID — szukaj po emailu
    const { data: list } = await sb.auth.admin.listUsers()
    const found = list?.users?.find(u => u.email === email)
    if (found) {
      console.log(`✅ auth user (znaleziony): ${email} id=${found.id}`)
      return found
    }
    console.error(`❌ createUser ${email}:`, error.message)
    return null
  }
  // Aktualizuj profil żeby ustawić właściwe UUID (trigger mógł użyć wygenerowanego)
  // Tutaj data.user.id to UUID nadany przez Supabase Auth — użyjemy go
  console.log(`✅ auth user (nowy): ${email} id=${data.user.id}`)
  return data.user
}

async function run() {
  console.log('\n🚀 AdRide Demo Seed\n')

  // ── 1. Auth users ──
  console.log('── Auth users ──')
  const adminUser      = await upsertUser(IDS.admin,      'admin@adride.pl',      'Admin AdRide',     '+48600000001', 'admin')
  const driverUser     = await upsertUser(IDS.driver,     'tomek@demo.adride.pl', 'Tomek Wiśniewski', '+48601234567', 'driver')
  const advertiserUser = await upsertUser(IDS.advertiser, 'firma@demo.adride.pl', 'Jan Nowak',        '+48602345678', 'advertiser')

  if (!adminUser || !driverUser || !advertiserUser) {
    console.error('\n⛔ Nie udało się utworzyć kont. Sprawdź SUPABASE_SERVICE_ROLE_KEY.')
    process.exit(1)
  }

  const adminId      = adminUser.id
  const driverId     = driverUser.id
  const advertiserId = advertiserUser.id

  // ── 2. Profiles (upsert — trigger handle_new_user mógł już je utworzyć) ──
  console.log('\n── Profiles ──')
  const { error: pErr } = await sb.from('profiles').upsert([
    { id: adminId,      role: 'admin',      full_name: 'Admin AdRide',     phone: '+48600000001' },
    { id: driverId,     role: 'driver',     full_name: 'Tomek Wiśniewski', phone: '+48601234567' },
    { id: advertiserId, role: 'advertiser', full_name: 'Jan Nowak',        phone: '+48602345678' },
  ], { onConflict: 'id' })
  ok('profiles', null, pErr)

  // ── 3. Driver ──
  console.log('\n── Driver ──')
  const { error: dErr } = await sb.from('drivers').upsert([
    { id: driverId, status: 'active', city: 'Warszawa', referral_code: 'DEMO2026',
      stripe_payouts_enabled: false, bank_account_verified: false }
  ], { onConflict: 'id' })
  ok('driver', null, dErr)

  // ── 4. Advertiser ──
  console.log('\n── Advertiser ──')
  const { error: aErr } = await sb.from('advertisers').upsert([
    { id: advertiserId, company_name: 'Stomatologia Nowak Sp. z o.o.',
      vat_id: 'PL5170382687', industry: 'Stomatologia',
      district_focus: ['Mokotów', 'Ursynów'],
      billing_address: { street: 'ul. Puławska 24', city: 'Warszawa', postal_code: '02-512', country: 'PL' }
    }
  ], { onConflict: 'id' })
  ok('advertiser', null, aErr)

  // ── 5. Vehicles (3 auta dla Tomka) ──
  console.log('\n── Vehicles ──')
  const { error: vErr } = await sb.from('vehicles').upsert([
    { id: IDS.vehicle1, driver_id: driverId, registration_plate: 'WA12345', make: 'Toyota', model: 'Yaris Cross', year: 2022, color: 'Szary', mileage_monthly_estimate: 1200, status: 'in_campaign' },
    { id: IDS.vehicle2, driver_id: driverId, registration_plate: 'WA67890', make: 'Honda',  model: 'Jazz',       year: 2021, color: 'Biały', mileage_monthly_estimate: 950,  status: 'in_campaign' },
    { id: IDS.vehicle3, driver_id: driverId, registration_plate: 'WA11111', make: 'Skoda',  model: 'Fabia',      year: 2023, color: 'Niebieski', mileage_monthly_estimate: 1100, status: 'in_campaign' },
  ], { onConflict: 'id' })
  ok('vehicles', null, vErr)

  // ── 6. Campaign ──
  console.log('\n── Campaign ──')
  const { error: cErr } = await sb.from('campaigns').upsert([
    {
      id: IDS.campaign,
      advertiser_id: advertiserId,
      name: 'Mokotów — Kampania Letnia 2026',
      package: 'START',
      status: 'active',
      start_date: '2026-06-01',
      end_date: '2026-08-31',
      min_km_per_vehicle_monthly: 900,
      target_districts: ['Mokotów', 'Ursynów'],
      vehicle_ids: [IDS.vehicle1, IDS.vehicle2, IDS.vehicle3],
    }
  ], { onConflict: 'id' })
  ok('campaign', null, cErr)

  // ── 7. Campaign ↔ Vehicles ──
  console.log('\n── Campaign vehicles ──')
  const { error: cvErr } = await sb.from('campaign_vehicles').upsert([
    { campaign_id: IDS.campaign, vehicle_id: IDS.vehicle1 },
    { campaign_id: IDS.campaign, vehicle_id: IDS.vehicle2 },
    { campaign_id: IDS.campaign, vehicle_id: IDS.vehicle3 },
  ], { onConflict: 'campaign_id,vehicle_id' })
  ok('campaign_vehicles', null, cvErr)

  // ── 8. GPS Sessions (trasy po Mokotowie — realistyczne) ──
  console.log('\n── GPS Sessions ──')
  // LineString(lng lat, ...) — Mokotów, Warszawa
  const routes = [
    'LINESTRING(21.0290 52.1960, 21.0310 52.1985, 21.0340 52.2010, 21.0356 52.2040, 21.0370 52.2070)',
    'LINESTRING(21.0070 52.1941, 21.0110 52.1965, 21.0150 52.1990, 21.0180 52.2015, 21.0210 52.2040)',
    'LINESTRING(21.0180 52.2100, 21.0200 52.2080, 21.0220 52.2055, 21.0250 52.2030, 21.0270 52.2010)',
  ]
  const sessionsData = [
    { id: IDS.session1, driver_id: driverId, vehicle_id: IDS.vehicle1, campaign_id: IDS.campaign,
      started_at: '2026-06-05T08:15:00Z', ended_at: '2026-06-05T12:30:00Z',
      total_distance_m: 47200, total_points: 504, avg_speed_kmh: 28.4,
      device_info: { device_model: 'Samsung Galaxy A54', os_version: 'Android 14', app_version: '1.0.2' } },
    { id: IDS.session2, driver_id: driverId, vehicle_id: IDS.vehicle2, campaign_id: IDS.campaign,
      started_at: '2026-06-06T09:00:00Z', ended_at: '2026-06-06T14:20:00Z',
      total_distance_m: 52800, total_points: 636, avg_speed_kmh: 31.2,
      device_info: { device_model: 'iPhone 14', os_version: 'iOS 17.4', app_version: '1.0.2' } },
    { id: IDS.session3, driver_id: driverId, vehicle_id: IDS.vehicle3, campaign_id: IDS.campaign,
      started_at: '2026-06-07T07:45:00Z', ended_at: '2026-06-07T13:00:00Z',
      total_distance_m: 44600, total_points: 468, avg_speed_kmh: 26.8,
      device_info: { device_model: 'Xiaomi 13', os_version: 'Android 13', app_version: '1.0.2' } },
  ]

  // Wstaw sesje bez geometrii, potem dodaj geometry przez SQL
  const { error: sErr } = await sb.from('gps_sessions').upsert(sessionsData, { onConflict: 'id' })
  ok('gps_sessions (dane)', null, sErr)

  // Dodaj geometrie przez RPC (raw SQL przez Supabase)
  // Geometria przez Management SQL API (exec_sql RPC może nie istnieć)
  const sqlUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`
  for (let i = 0; i < 3; i++) {
    const sessionId = [IDS.session1, IDS.session2, IDS.session3][i]
    try {
      const r = await fetch(sqlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
        body: JSON.stringify({ sql: `UPDATE gps_sessions SET route_geom = ST_GeomFromText('${routes[i]}', 4326) WHERE id = '${sessionId}'` })
      })
      if (r.ok) console.log(`  ✅ geometry session ${i + 1}`)
      else console.log(`  ⚠️  geometry session ${i + 1} — exec_sql RPC niedostępne (OK, opcjonalne)`)
    } catch { console.log(`  ⚠️  geometry session ${i + 1} — skip`) }
  }

  // ── 9. Payouts ──
  console.log('\n── Payouts ──')
  const { error: pyErr } = await sb.from('payouts').upsert([
    { id: IDS.payout1, driver_id: driverId, campaign_id: IDS.campaign,
      period_start: '2026-06-01', period_end: '2026-06-30',
      total_km: 1048.50, amount_grosze: 62910, within_guarantee: true,
      status: 'paid', paid_at: '2026-07-03T10:00:00Z' },
    { id: IDS.payout2, driver_id: driverId, campaign_id: IDS.campaign,
      period_start: '2026-07-01', period_end: '2026-07-31',
      total_km: 987.20, amount_grosze: 59232, within_guarantee: true,
      status: 'pending' },
  ], { onConflict: 'id' })
  ok('payouts', null, pyErr)

  // ── 10. Calculator lead (przykładowy) ──
  console.log('\n── Calculator lead ──')
  const { error: lErr } = await sb.from('calculator_leads').upsert([
    { email: 'potencjalny@klient.pl', district_id: 'Mokotow', num_vehicles: 3,
      km_daily: 120, months: 3, budget_monthly_pln: 2800, impressions_total: 124000, created_at: '2026-06-08T14:32:00Z' }
  ])
  ok('calculator_lead', null, lErr)

  // ── Podsumowanie ──
  console.log('\n══════════════════════════════════════')
  console.log('✅ Seed zakończony!\n')
  console.log('Konta demo (hasło: AdRide2026!):')
  console.log(`  admin:       admin@adride.pl       (admin)`)
  console.log(`  kierowca:    tomek@demo.adride.pl  (driver)`)
  console.log(`  reklamodawca: firma@demo.adride.pl (advertiser)`)
  console.log('\nURL aplikacji: http://localhost:3000/login')
  console.log('══════════════════════════════════════\n')
}

run().catch(console.error)
