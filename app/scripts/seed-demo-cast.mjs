/**
 * AdRide — Rozszerzony seed demo ("cast")
 *
 * Dodaje pełną obsadę do prezentacji panelu admina i reklamodawcy:
 *   - 12 kierowców z różnymi statusami (pending / approved / active / paused / rejected)
 *   - 5 firm reklamodawców z różnych branż
 *   - dodatkowe kampanie z przypisanymi pojazdami (pkt 10: wyszukiwanie/aktywność)
 *
 * Idempotentny — można uruchomić wielokrotnie (wyszukuje istniejące po emailu).
 * Uruchomienie: node scripts/seed-demo-cast.mjs
 * UWAGA: uruchom NAJPIERW główny seed (seed-demo.mjs), potem ten.
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

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function ok(label, error) {
  if (error && !/already exists|duplicate|23505/.test(error.message || '')) {
    console.error(`❌ ${label}:`, error.message)
    return false
  }
  console.log(`✅ ${label}`)
  return true
}

// Tworzy auth usera (lub znajduje po emailu) i zwraca id
async function ensureUser(email, fullName, phone, role) {
  const { data: list } = await sb.auth.admin.listUsers()
  const found = list?.users?.find(u => u.email === email)
  if (found) return found.id
  const { data, error } = await sb.auth.admin.createUser({
    email, password: 'AdRide2026!', email_confirm: true,
    user_metadata: { full_name: fullName, phone, role },
  })
  if (error) { console.error(`❌ createUser ${email}:`, error.message); return null }
  return data.user.id
}

// ---------- Obsada kierowców ----------
const ENGINE = ['Benzyna', 'Diesel', 'Hybryda', 'Plug-in hibryda', 'Elektryczny']
const DRIVERS = [
  // status, imię, marka, model, rok, silnik, km/mc, tablica, dzielnica
  ['pending',  'Marek Kowalczyk',   'Toyota', 'Corolla',  2021, 'Hybryda',  1400, 'WB10001'],
  ['pending',  'Anna Lewandowska',  'Skoda',  'Octavia',  2020, 'Diesel',   1800, 'WB10002'],
  ['pending',  'Piotr Zieliński',   'Kia',    'Ceed',     2022, 'Benzyna',  1100, 'WB10003'],
  ['pending',  'Ewa Wójcik',        'Hyundai','i30',      2019, 'Benzyna',   950, 'WB10004'],
  ['approved', 'Tomasz Kamiński',   'Volkswagen','Golf',  2021, 'Diesel',   1600, 'WB10005'],
  ['approved', 'Karolina Nowak',    'Mazda',  'CX-5',     2022, 'Benzyna',  1300, 'WB10006'],
  ['approved', 'Grzegorz Mazur',    'Ford',   'Focus',    2020, 'Benzyna',  1500, 'WB10007'],
  ['approved', 'Magda Krawczyk',    'Honda',  'Civic',    2023, 'Hybryda',  1250, 'WB10008'],
  ['active',   'Łukasz Wiśniewski', 'Tesla',  'Model 3',  2023, 'Elektryczny', 2100, 'WB10009'],
  ['active',   'Joanna Dąbrowska',  'BMW',    'Seria 3',  2021, 'Diesel',   1700, 'WB10010'],
  ['active',   'Rafał Szymański',   'Audi',   'A4',       2022, 'Benzyna',  1900, 'WB10011'],
  ['paused',   'Natalia Woźniak',   'Renault','Megane',   2019, 'Diesel',    800, 'WB10012'],
]

// ---------- Obsada firm ----------
const ADVERTISERS = [
  ['restauracja@demo.adride.pl', 'Trattoria Bella Sp. z o.o.', 'PL1234567801', 'Gastronomia',  ['Śródmieście', 'Wola']],
  ['fitness@demo.adride.pl',     'PowerGym Warszawa',          'PL1234567802', 'Fitness',      ['Mokotów', 'Ursynów']],
  ['deweloper@demo.adride.pl',   'Horyzont Development',       'PL1234567803', 'Deweloper',    ['Wilanów', 'Białołęka']],
  ['beauty@demo.adride.pl',      'Studio Uroda',               'PL1234567804', 'Beauty',       ['Żoliborz', 'Bielany']],
  ['klinika@demo.adride.pl',     'MedDent Klinika',            'PL1234567805', 'Medycyna',     ['Praga-Południe', 'Targówek']],
]

async function run() {
  console.log('\n🎭 AdRide — Rozszerzony seed (obsada)\n')

  // ── Kierowcy ──
  console.log('── Kierowcy ──')
  const driverIds = []
  for (let i = 0; i < DRIVERS.length; i++) {
    const [status, name, make, model, year, engine, km, plate] = DRIVERS[i]
    const email = `kierowca${String(i + 1).padStart(2, '0')}@demo.adride.pl`
    const phone = `+486010000${String(i + 10).padStart(2, '0')}`
    const id = await ensureUser(email, name, phone, 'driver')
    if (!id) continue
    driverIds.push({ id, status })

    await sb.from('profiles').upsert([{ id, role: 'driver', full_name: name, phone }], { onConflict: 'id' })
    const { error: dErr } = await sb.from('drivers').upsert(
      [{ id, status, city: 'Warszawa', referral_code: `REF${1000 + i}` }],
      { onConflict: 'id' }
    )
    // Pojazd dla kierowcy
    const vStatus = status === 'active' ? 'in_campaign' : status === 'approved' ? 'wrapped' : 'available'
    await sb.from('vehicles').upsert(
      [{ driver_id: id, registration_plate: plate, make, model, year, engine_type: engine,
         mileage_monthly_estimate: km, status: vStatus }],
      { onConflict: 'registration_plate' }
    )
    ok(`kierowca ${name} (${status})`, dErr)
  }

  // ── Firmy ──
  console.log('\n── Firmy (reklamodawcy) ──')
  const advIds = []
  for (let i = 0; i < ADVERTISERS.length; i++) {
    const [email, company, vat, industry, districts] = ADVERTISERS[i]
    const id = await ensureUser(email, company, `+486020000${String(i + 10).padStart(2, '0')}`, 'advertiser')
    if (!id) continue
    advIds.push({ id, company, districts })

    await sb.from('profiles').upsert([{ id, role: 'advertiser', full_name: company, phone: null }], { onConflict: 'id' })
    const { error: aErr } = await sb.from('advertisers').upsert(
      [{ id, company_name: company, vat_id: vat, industry, district_focus: districts,
         billing_address: { street: 'ul. Przykładowa 1', city: 'Warszawa', postal_code: '00-001', country: 'PL' } }],
      { onConflict: 'id' }
    )
    ok(`firma ${company}`, aErr)
  }

  // ── Kampanie (przypisz pojazdy aktywnych kierowców do pierwszych 3 firm) ──
  console.log('\n── Kampanie ──')
  const activeDrivers = driverIds.filter(d => d.status === 'active')
  // Pobierz pojazdy aktywnych kierowców
  const { data: activeVehicles } = await sb
    .from('vehicles')
    .select('id, driver_id')
    .in('driver_id', activeDrivers.map(d => d.id))

  const PACKAGES = ['START', 'SCALE', 'PREMIUM']
  const STATUSES = ['active', 'active', 'pending_payment']
  for (let i = 0; i < Math.min(3, advIds.length); i++) {
    const adv = advIds[i]
    const vehiclesForCampaign = (activeVehicles ?? []).slice(i, i + 2).map(v => v.id)
    const { data: campaign, error: cErr } = await sb.from('campaigns').upsert(
      [{
        advertiser_id: adv.id,
        name: `${adv.company.split(' ')[0]} — Kampania ${adv.districts[0]} 2026`,
        package: PACKAGES[i],
        status: STATUSES[i],
        start_date: '2026-06-01',
        end_date: '2026-12-31',
        min_km_per_vehicle_monthly: 1000,
        target_districts: adv.districts,
        vehicle_ids: vehiclesForCampaign,
      }],
      { onConflict: 'id', ignoreDuplicates: false }
    ).select('id').maybeSingle()

    if (cErr) { ok(`kampania ${adv.company}`, cErr); continue }

    // Powiąż pojazdy z kampanią (trigger ustawi driver_id)
    if (campaign?.id && vehiclesForCampaign.length) {
      for (const vid of vehiclesForCampaign) {
        await sb.from('campaign_vehicles').upsert(
          [{ campaign_id: campaign.id, vehicle_id: vid }],
          { onConflict: 'campaign_id,vehicle_id' }
        )
      }
    }
    ok(`kampania ${adv.company} (${STATUSES[i]})`, null)
  }

  // ── Podsumowanie ──
  console.log('\n══════════════════════════════════════')
  console.log('✅ Rozszerzony seed zakończony!')
  console.log(`   Kierowcy: ${driverIds.length} (4 pending / 4 approved / 3 active / 1 paused)`)
  console.log(`   Firmy: ${advIds.length}`)
  console.log('   Wszystkie konta: hasło AdRide2026!')
  console.log('══════════════════════════════════════\n')
}

run().catch(console.error)
