/**
 * AdRide — Cennik (SINGLE SOURCE OF TRUTH)
 *
 * WSZYSTKIE ceny pakietów w jednym miejscu. Nie duplikuj cen w komponentach,
 * API ani na landing page — importuj z tego pliku albo synchronizuj ręcznie
 * z wartościami tutaj.
 *
 * Model: flat-fee dla klienta (per-km rozliczany wewnętrznie — tajemnica operacyjna).
 * Źródło kanoniczne: CLAUDE.md + memory/project_adride.md
 */

export type PackageId = 'START' | 'SCALE' | 'PREMIUM'

export interface PricingPackage {
  id: PackageId
  /** Nazwa marketingowa (landing) */
  marketingName: string
  /** Nazwa techniczna (app) */
  name: string
  /** Minimalna liczba pojazdów */
  minVehicles: number
  /** Minimalny okres w miesiącach */
  minMonths: number
  /** Cena miesięczna netto w PLN */
  monthlyPLN: number
  /** Cena miesięczna w groszach (Stripe) */
  monthlyGrosze: number
  /** Krótki opis */
  desc: string
  /** Czy oklejenie wliczone (true = ABO/Miasto) */
  wrapIncluded: boolean
}

export const PACKAGES: Record<PackageId, PricingPackage> = {
  START: {
    id: 'START',
    marketingName: 'Dzielnica',
    name: 'START',
    minVehicles: 3,
    minMonths: 3,
    monthlyPLN: 2800,
    monthlyGrosze: 280000,
    desc: 'Pakiet startowy — 3 pojazdy, jedna dzielnica',
    wrapIncluded: false,
  },
  SCALE: {
    id: 'SCALE',
    marketingName: 'Metro',
    name: 'SCALE',
    minVehicles: 7,
    minMonths: 6,
    monthlyPLN: 17500,
    monthlyGrosze: 1750000,
    desc: 'Pakiet skalowania — 7+ pojazdów, kilka dzielnic',
    wrapIncluded: false,
  },
  PREMIUM: {
    id: 'PREMIUM',
    marketingName: 'Miasto',
    name: 'PREMIUM',
    minVehicles: 15,
    minMonths: 12,
    monthlyPLN: 33000,
    monthlyGrosze: 3300000,
    desc: 'Pakiet miejski — 15+ pojazdów, pełne pokrycie miasta (oklejenie wliczone)',
    wrapIncluded: true,
  },
}

export const PACKAGE_LIST: PricingPackage[] = [PACKAGES.START, PACKAGES.SCALE, PACKAGES.PREMIUM]

/** Pakiet → cena w groszach (dla payment-intent) */
export const PACKAGE_PRICES_GROSZE: Record<PackageId, number> = {
  START: PACKAGES.START.monthlyGrosze,
  SCALE: PACKAGES.SCALE.monthlyGrosze,
  PREMIUM: PACKAGES.PREMIUM.monthlyGrosze,
}

/**
 * Średni CPM na bazie naszego cennika (bez kosztów oklejania).
 * Liczony: cena_miesięczna / (impressions_miesięczne / 1000).
 * Zwraca null gdy brak impressions.
 */
export function cpmFromPricing(monthlyPLN: number, impressionsMonthly: number): number | null {
  if (impressionsMonthly <= 0) return null
  return (monthlyPLN / impressionsMonthly) * 1000
}

/** Formatuje PLN w polskim formacie: 2 800 zł */
export function formatPLN(value: number): string {
  return `${value.toLocaleString('pl-PL')} zł`
}
