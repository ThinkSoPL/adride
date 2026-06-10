import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_STATUSES = ['pending', 'approved', 'active', 'paused', 'rejected'] as const
type DriverStatus = typeof ALLOWED_STATUSES[number]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  }

  // Weryfikacja roli admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Tylko administrator' }, { status: 403 })
  }

  let body: { status?: string }
  try {
    body = (await req.json()) as { status?: string }
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowe dane' }, { status: 400 })
  }

  const status = body.status as DriverStatus
  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Nieprawidłowy status' }, { status: 400 })
  }

  const patch: Record<string, unknown> = { status }
  if (status === 'approved') {
    patch.kyc_completed_at = new Date().toISOString()
  }

  // RLS: admin może aktualizować dowolnego kierowcę (drivers_update_admin)
  const { error } = await supabase
    .from('drivers')
    .update(patch)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
