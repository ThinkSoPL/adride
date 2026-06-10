import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PACKAGES = ['START', 'SCALE', 'PREMIUM'] as const

interface CampaignPayload {
  name?: string
  package?: string
  start_date?: string | null
  min_km_per_vehicle_monthly?: number
  target_districts?: string[]
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'advertiser') {
    return NextResponse.json({ error: 'Tylko reklamodawcy' }, { status: 403 })
  }

  let body: CampaignPayload
  try {
    body = (await req.json()) as CampaignPayload
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowe dane' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 200) {
    return NextResponse.json({ error: 'Nazwa kampanii jest wymagana' }, { status: 400 })
  }

  const pkg = PACKAGES.includes(body.package as typeof PACKAGES[number])
    ? (body.package as string)
    : 'START'

  const minKm = typeof body.min_km_per_vehicle_monthly === 'number' && body.min_km_per_vehicle_monthly > 0
    ? Math.round(body.min_km_per_vehicle_monthly)
    : 1500

  const districts = Array.isArray(body.target_districts)
    ? body.target_districts.filter(d => typeof d === 'string').slice(0, 30)
    : null

  // Waliduj datę startu
  let startDate: string | null = null
  if (typeof body.start_date === 'string' && body.start_date) {
    const dateObj = new Date(body.start_date)
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: 'Data startu musi być w formacie ISO (YYYY-MM-DD)' }, { status: 400 })
    }
    // Sprawdzić że data nie jest w przeszłości
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (dateObj < today) {
      return NextResponse.json({ error: 'Data startu nie może być w przeszłości' }, { status: 400 })
    }
    startDate = body.start_date
  }

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .insert({
      advertiser_id: user.id,
      name,
      package: pkg,
      status: 'draft',
      min_km_per_vehicle_monthly: minKm,
      target_districts: districts,
      start_date: startDate,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: `Błąd zapisu: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: campaign.id })
}
