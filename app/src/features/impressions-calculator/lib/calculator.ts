import { WARSAW_DISTRICTS, type WarsawDistrict } from '../data/aadt-warsaw';
import { PACKAGES, type PricingPackage } from '@/lib/pricing';

export interface CalculatorInput {
  /** Wybrane dzielnice (multi-select). Pusta lista = brak wyniku. */
  districtIds: string[];
  numVehicles: number;
  kmDailyPerVehicle: number;
  /** Czas kampanii w miesiącach (6–24). */
  months: number;
}

export interface CalculatorResult {
  districts: WarsawDistrict[];
  /** Średnia gęstość ruchu z wybranych dzielnic */
  avgTrafficDensity: number;
  impressionsPerVehicleDaily: number;
  impressionsDaily: number;
  impressionsMonthly: number;
  impressionsTotal: number;
  /** Szacowany wzrost zapamiętywalności marki (%) w obszarze kampanii */
  brandRecallLiftPct: number;
  /** Szacowana liczba nowych klientów z kampanii */
  estimatedNewClients: number;
  /** Rekomendowany pakiet na bazie liczby pojazdów */
  recommendedPackage: PricingPackage;
  /** Średni CPM (zł / 1000 wyświetleń) wyliczony z naszego cennika — bez kosztów oklejania */
  cpmPLN: number;
}

const VISIBILITY_FACTOR = 0.15;
const DAYS_PER_MONTH = 30;

// Model zapamiętywalności (heurystyka, jawnie oznaczona jako szacunek):
// unikalny zasięg ≈ 40% wszystkich kontaktów (reszta to powtórne wyświetlenia)
const UNIQUE_REACH_RATIO = 0.4;
// Populacja Warszawy (GUS 2023, ~1,86 mln) — baza do wyliczenia % zapamiętywalności
const WARSAW_POPULATION = 1_860_000;
// Współczynnik recall: jaka część unikalnego zasięgu zapamiętuje markę
const RECALL_FACTOR = 0.55;
// Współczynnik konwersji zapamiętania → klient (bardzo konserwatywny, 0,15%)
const AWARENESS_TO_CLIENT_RATE = 0.0015;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Rekomendowany pakiet na bazie liczby pojazdów. */
function recommendPackage(numVehicles: number): PricingPackage {
  if (numVehicles >= PACKAGES.PREMIUM.minVehicles) return PACKAGES.PREMIUM;
  if (numVehicles >= PACKAGES.SCALE.minVehicles) return PACKAGES.SCALE;
  return PACKAGES.START;
}

export function calculate(input: CalculatorInput): CalculatorResult | null {
  const districts = WARSAW_DISTRICTS.filter(d => input.districtIds.includes(d.id));
  if (districts.length === 0) return null;

  const avgTrafficDensity = Math.round(
    districts.reduce((sum, d) => sum + d.trafficDensity, 0) / districts.length,
  );

  const impressionsPerVehicleDaily = Math.round(
    input.kmDailyPerVehicle * avgTrafficDensity * VISIBILITY_FACTOR,
  );
  const impressionsDaily = impressionsPerVehicleDaily * input.numVehicles;
  const impressionsMonthly = impressionsDaily * DAYS_PER_MONTH;
  const impressionsTotal = impressionsMonthly * input.months;

  // Zapamiętywalność marki
  const uniqueReach = impressionsTotal * UNIQUE_REACH_RATIO;
  const brandRecallLiftPct = clamp(
    (uniqueReach / WARSAW_POPULATION) * 100 * RECALL_FACTOR,
    0.5,
    14,
  );
  const estimatedNewClients = Math.round(uniqueReach * AWARENESS_TO_CLIENT_RATE);

  // CPM z naszego cennika (rekomendowany pakiet) — bez kosztów oklejania
  const recommendedPackage = recommendPackage(input.numVehicles);
  const cpmPLN =
    impressionsMonthly > 0
      ? (recommendedPackage.monthlyPLN / impressionsMonthly) * 1000
      : 0;

  return {
    districts,
    avgTrafficDensity,
    impressionsPerVehicleDaily,
    impressionsDaily,
    impressionsMonthly,
    impressionsTotal,
    brandRecallLiftPct: Math.round(brandRecallLiftPct * 10) / 10,
    estimatedNewClients,
    recommendedPackage,
    cpmPLN: Math.round(cpmPLN * 100) / 100,
  };
}
