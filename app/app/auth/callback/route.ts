import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Callback route do wymiany kodu PKCE z linku aktywacyjnego e-maila
 * na sesję użytkownika (ciasteczka).
 * Wywoływany po kliknięciu linku: ?code=... (z Supabase)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Jeśli brak kodu lub błąd wymiany — redirect na login
  return NextResponse.redirect(new URL('/login', request.url))
}
