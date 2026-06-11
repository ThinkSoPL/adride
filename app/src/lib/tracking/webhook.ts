'use client'

/**
 * Wysyłka danych formularzy do webhooka apix-drive (no-cors).
 * Payload = dane formularza + pełny zestaw parametrów śledzenia:
 * UTM, strona, timing, scroll, urządzenie, przeglądarka, czas.
 *
 * Tryb no-cors: odpowiedź jest "opaque" — nie da się odczytać statusu.
 * Wysyłka jest fire-and-forget i NIE blokuje głównego flow formularza.
 */

const WEBHOOK_URL = 'https://a1.apix-drive.com/web-hooks/15083/4pnjdpx6'

let pageLoadedAt = 0
let maxScrollDepth = 0
let listenersAttached = false

function attachListeners() {
  if (listenersAttached || typeof window === 'undefined') return
  listenersAttached = true
  pageLoadedAt = Date.now()

  window.addEventListener(
    'scroll',
    () => {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      if (scrollable <= 0) return
      const depth = Math.round((window.scrollY / scrollable) * 100)
      if (depth > maxScrollDepth) maxScrollDepth = Math.min(depth, 100)
    },
    { passive: true }
  )
}

// Inicjalizacja przy imporcie po stronie klienta
if (typeof window !== 'undefined') attachListeners()

function utmParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search)
  const out: Record<string, string> = {}
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const v = params.get(key)
    if (v) out[key] = v
  }
  return out
}

function browserName(ua: string): string {
  if (/edg\//i.test(ua)) return 'Edge'
  if (/opr\//i.test(ua)) return 'Opera'
  if (/chrome/i.test(ua)) return 'Chrome'
  if (/safari/i.test(ua)) return 'Safari'
  if (/firefox/i.test(ua)) return 'Firefox'
  return 'Inna'
}

function osName(ua: string): string {
  if (/windows/i.test(ua)) return 'Windows'
  if (/android/i.test(ua)) return 'Android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS'
  if (/mac os/i.test(ua)) return 'macOS'
  if (/linux/i.test(ua)) return 'Linux'
  return 'Inny'
}

export interface WebhookFormData {
  form_type: string
  [key: string]: unknown
}

/**
 * Wyślij dane formularza + parametry śledzenia do apix-drive.
 * @param formType identyfikator formularza, np. 'register', 'onboarding_driver'
 * @param formData pola formularza (name, email, industry, challenges, team, ...)
 * @param formStartedAt timestamp (Date.now()) rozpoczęcia wypełniania — opcjonalny
 */
export function sendToWebhook(
  formType: string,
  formData: Record<string, unknown>,
  formStartedAt?: number
): void {
  if (typeof window === 'undefined') return

  try {
    const now = Date.now()
    const ua = navigator.userAgent
    const isMobile = /mobi|android|iphone|ipad/i.test(ua)
    const timeOnPageSec = pageLoadedAt ? Math.round((now - pageLoadedAt) / 1000) : null
    const fillTimeSec = formStartedAt ? Math.round((now - formStartedAt) / 1000) : null
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const pageLoadMs = nav ? Math.round(nav.loadEventEnd - nav.startTime) : null

    const payload = {
      // Formularz
      form_type: formType,
      ...formData,
      // UTM
      ...utmParams(),
      // Strona
      referrer: document.referrer || null,
      page_url: window.location.href,
      url_strony: window.location.href,
      // Timing
      page_load_time: pageLoadMs,
      czas_na_stronie: timeOnPageSec,
      form_fill_time: fillTimeSec,
      czas_wypelnienia_formularza: fillTimeSec,
      // Scroll
      scroll_depth: maxScrollDepth,
      pozycja_scrolla: maxScrollDepth,
      // Urządzenie
      device_type: isMobile ? 'mobile' : 'desktop',
      czy_mobile: isMobile,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      rozdzielczosc: `${window.screen.width}x${window.screen.height}`,
      pixel_ratio: window.devicePixelRatio,
      // Przeglądarka
      user_agent: ua,
      przegladarka: browserName(ua),
      system: osName(ua),
      jezyk: navigator.language,
      // Czas
      timestamp: new Date().toISOString(),
      godzina_wyslania: new Date().toLocaleTimeString('pl-PL'),
      strefa_czasowa: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }

    // fire-and-forget; w no-cors nie odczytamy odpowiedzi — celowo bez await
    void fetch(WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Tracking nigdy nie może zepsuć formularza
    })
  } catch {
    // jw. — tracking jest best-effort
  }
}
