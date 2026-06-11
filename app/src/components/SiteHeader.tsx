import Link from 'next/link'

const LANDING = 'https://adride.pl'

const NAV_LINKS = [
  { href: `${LANDING}/#how`, label: 'Jak to działa' },
  { href: `${LANDING}/#drivers`, label: 'Dla kierowców' },
  { href: `${LANDING}/#brands`, label: 'Dla reklamodawców' },
  { href: `${LANDING}/#pricing`, label: 'Pakiety' },
  { href: '/kalkulator', label: 'Kalkulator' },
]

/**
 * Wspólny pasek nawigacji dla publicznych stron aplikacji
 * (kalkulator, login, register, onboarding). Logo prowadzi na landing adride.pl.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-[#1E2A38] bg-[#0A0D12]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <a href={LANDING} className="text-xl font-bold text-[#E6EDF3] shrink-0">
          Ad<span className="text-[#FF6B35]">Ride</span>
        </a>

        <nav className="hidden md:flex items-center gap-5 text-sm text-[#A0AEC0]">
          {NAV_LINKS.map(l =>
            l.href.startsWith('/') ? (
              <Link key={l.label} href={l.href} className="hover:text-[#E6EDF3] transition-colors">
                {l.label}
              </Link>
            ) : (
              <a key={l.label} href={l.href} className="hover:text-[#E6EDF3] transition-colors">
                {l.label}
              </a>
            )
          )}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/login"
            className="text-sm font-medium text-[#A0AEC0] hover:text-[#E6EDF3] border border-[#1E2A38] hover:border-[#FF6B35] px-3 py-2 rounded-lg transition-colors"
          >
            Zaloguj
          </Link>
          <Link
            href="/register?role=driver"
            className="hidden sm:inline-block text-sm font-medium text-[#E6EDF3] border border-[#1E2A38] hover:border-[#FF6B35] px-3 py-2 rounded-lg transition-colors"
          >
            Zostań kierowcą
          </Link>
          <Link
            href="/register?role=advertiser"
            className="text-sm font-semibold text-white bg-[#FF6B35] hover:bg-[#e55a2b] px-3 py-2 rounded-lg transition-colors"
          >
            Zacznij kampanię
          </Link>
        </div>
      </div>
    </header>
  )
}
