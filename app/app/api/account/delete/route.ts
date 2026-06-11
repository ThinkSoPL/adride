import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Usunięcie konta z 30-dniową karencją (soft delete).
 * POST   — zgłoś usunięcie konta (deletion_requested_at = now())
 * DELETE — cofnij decyzję (deletion_requested_at = NULL), możliwe przez 30 dni
 *
 * Zapis przez service_role (kolumna jest poza policy self-update),
 * autoryzacja: tylko własne konto (user.id z sesji).
 */

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  }

  const service = createServiceClient()
  const { error } = await service
    .from('profiles')
    .update({ deletion_requested_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Nie udało się zgłosić usunięcia konta' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  }

  const service = createServiceClient()
  const { error } = await service
    .from('profiles')
    .update({ deletion_requested_at: null })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Nie udało się cofnąć usunięcia konta' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
