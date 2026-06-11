/**
 * Za reverse proxy (nginx/Cloudflare na app.adride.pl) request.url ma host
 * "localhost:3000". Origin do redirectów budujemy z nagłówków x-forwarded-*
 * albo z NEXT_PUBLIC_SITE_URL.
 */
export function resolveOrigin(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  if (forwardedHost) {
    const proto = request.headers.get('x-forwarded-proto') ?? 'https'
    return `${proto}://${forwardedHost}`
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin
}
