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
  const nextParam = searchParams.get('next') ?? '/dashboard'
  // Zapobiega open-redirect: akceptuj tylko ścieżki względne (jeden ukośnik na początku)
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard'

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
