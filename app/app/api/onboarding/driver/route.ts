import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_STR = 100

interface VehiclePayload {
  registration_plate?: string
  make?: string | null
  model?: string | null
  year?: number | null
  engine_type?: string | null
  mileage_monthly_estimate?: number | null
}

interface DriverOnboardingPayload {
  city?: string
  vehicle?: VehiclePayload
}

function str(v: unknown, max = MAX_STR): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  if (!t || t.length > max) return null
  return t
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  }

  // Sprawdź rolę
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'driver') {
    return NextResponse.json({ error: 'Tylko kierowcy mogą tu wejść' }, { status: 403 })
  }

  let body: DriverOnboardingPayload
  try {
    body = (await req.json()) as DriverOnboardingPayload
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowe dane' }, { status: 400 })
  }

  const city = str(body.city) ?? 'Warszawa'
  const plate = str(body.vehicle?.registration_plate, 12)
  if (!plate) {
    return NextResponse.json({ error: 'Tablica rejestracyjna jest wymagana' }, { status: 400 })
  }

  // 1. Utwórz rekord kierowcy (status pending → czeka na KYC)
  const { error: driverErr } = await supabase
    .from('drivers')
    .upsert({ id: user.id, status: 'pending', city }, { onConflict: 'id' })

  if (driverErr) {
    return NextResponse.json({ error: `Błąd zapisu kierowcy: ${driverErr.message}` }, { status: 500 })
  }

  // 2. Utwórz pojazd
  const year = typeof body.vehicle?.year === 'number' && body.vehicle.year >= 1990 && body.vehicle.year <= 2030
    ? body.vehicle.year
    : null
  const mileage = typeof body.vehicle?.mileage_monthly_estimate === 'number' && body.vehicle.mileage_monthly_estimate > 0
    ? body.vehicle.mileage_monthly_estimate
    : null

  const { data: insertedVehicle, error: vehicleErr } = await supabase.from('vehicles').insert({
    driver_id: user.id,
    registration_plate: plate,
    make: str(body.vehicle?.make),
    model: str(body.vehicle?.model),
    year,
    engine_type: str(body.vehicle?.engine_type),
    mileage_monthly_estimate: mileage,
    status: 'available',
  }).select('id').maybeSingle()

  if (vehicleErr) {
    // Sprawdź czy to duplikat WŁASNEGO pojazdu (idempotent re-submit — OK)
    // czy duplikat pojazdu INNEGO kierowcy (ERROR)
    // SQLSTATE 23505 = unique constraint violation (bardziej niezawodne niż .includes('duplicate'))
    if (vehicleErr.code === '23505') {
      const { data: existingVehicle } = await supabase
        .from('vehicles')
        .select('driver_id')
        .eq('registration_plate', plate)
        .single()

      // Jeśli tablica należy do innego kierowcy — błąd
      if (existingVehicle?.driver_id !== user.id) {
        return NextResponse.json(
          { error: 'Ta tablica rejestracyjna jest już zarejestrowana w systemie' },
          { status: 409 }
        )
      }
      // Jeśli tablica już należy do tego kierowcy — OK, idempotentny re-submit
    } else {
      // Inny błąd zapisu
      return NextResponse.json({ error: `Błąd zapisu pojazdu: ${vehicleErr.message}` }, { status: 500 })
    }
  }

  // Weryfikuj że pojazd istnieje dla tego kierowcy
  if (!insertedVehicle) {
    const { data: existingVehicle } = await supabase
      .from('vehicles')
      .select('id')
      .eq('driver_id', user.id)
      .eq('registration_plate', plate)
      .single()

    if (!existingVehicle) {
      return NextResponse.json(
        { error: 'Pojazd nie został utworzony. Spróbuj ponownie.' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ ok: true })
}
