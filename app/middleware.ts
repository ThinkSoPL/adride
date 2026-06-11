import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/register', '/auth/callback', '/kalkulator', '/flota', '/forgot-password', '/update-password', '/api/stripe/webhook', '/api/leads', '/api/onboarding/driver', '/api/onboarding/advertiser']
const PUBLIC_PREFIXES = ['/onboarding']
const ADMIN_ROUTES = ['/admin']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Pozwól na publiczne trasy (dokładne dopasowanie) oraz webhook Stripe (weryfikuje podpis sam)
  if (PUBLIC_ROUTES.includes(pathname) || pathname === '/api/stripe/webhook' || PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return supabaseResponse
  }

  // Origin za reverse proxy — nextUrl może mieć host localhost:3000
  const forwardedHost = request.headers.get('x-forwarded-host')
  const origin = forwardedHost
    ? `${request.headers.get('x-forwarded-proto') ?? 'https'}://${forwardedHost}`
    : request.nextUrl.origin

  // Brak sesji → redirect do logowania
  if (!user) {
    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Sprawdź rolę użytkownika dla tras adminów
  if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', origin))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
