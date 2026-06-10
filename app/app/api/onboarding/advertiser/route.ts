import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_STR = 200

interface AdvertiserPayload {
  company_name?: string
  vat_id?: string | null
  industry?: string | null
  billing_address?: Record<string, unknown>
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'advertiser') {
    return NextResponse.json({ error: 'Tylko reklamodawcy mogą tu wejść' }, { status: 403 })
  }

  let body: AdvertiserPayload
  try {
    body = (await req.json()) as AdvertiserPayload
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowe dane' }, { status: 400 })
  }

  const companyName = str(body.company_name)
  if (!companyName) {
    return NextResponse.json({ error: 'Nazwa firmy jest wymagana' }, { status: 400 })
  }

  // Stripe customer tworzony leniwie przy pierwszym checkoutcie (gdy Stripe skonfigurowany)
  const { error } = await supabase
    .from('advertisers')
    .upsert(
      {
        id: user.id,
        company_name: companyName,
        vat_id: str(body.vat_id),
        industry: str(body.industry),
        billing_address: body.billing_address ?? null,
      },
      { onConflict: 'id' }
    )

  if (error) {
    return NextResponse.json({ error: `Błąd zapisu: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
