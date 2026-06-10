import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type UserRole = 'driver' | 'advertiser' | 'admin'

export interface SessionProfile {
  id: string
  role: UserRole
  full_name: string | null
  phone: string | null
  email: string
}

/**
 * Pobiera zalogowanego użytkownika + jego profil.
 * Przekierowuje do /login jeśli brak sesji.
 */
export async function requireUser(): Promise<SessionProfile> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, phone')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Profil nie istnieje (rzadki edge case) — wyloguj
    redirect('/login')
  }

  return {
    id: profile.id,
    role: profile.role as UserRole,
    full_name: profile.full_name,
    phone: profile.phone,
    email: user.email ?? '',
  }
}

/**
 * Wymaga konkretnej roli. Przekierowuje do /dashboard jeśli rola się nie zgadza.
 */
export async function requireRole(role: UserRole): Promise<SessionProfile> {
  const profile = await requireUser()
  if (profile.role !== role) {
    redirect('/dashboard')
  }
  return profile
}
