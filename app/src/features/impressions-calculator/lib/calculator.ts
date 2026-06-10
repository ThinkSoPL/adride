import { WARSAW_DISTRICTS, type WarsawDistrict } from '../data/aadt-warsaw';

export interface CalculatorInput {
  districtId: string;
  numVehicles: number;
  kmDailyPerVehicle: number;
  months: number;
  budgetMonthlyPLN: number | null;
}

export interface CalculatorResult {
  district: WarsawDistrict;
  impressionsPerVehicleDaily: number;
  impressionsDaily: number;
  impressionsMonthly: number;
  impressionsTotal: number;
  cpmPLN: number | null;
}

const VISIBILITY_FACTOR = 0.15;
const DAYS_PER_MONTH = 30;

export function calculate(input: CalculatorInput): CalculatorResult | null {
  const district = WARSAW_DISTRICTS.find(d => d.id === input.districtId);
  if (!district) return null;

  const impressionsPerVehicleDaily = Math.round(
    input.kmDailyPerVehicle * district.trafficDensity * VISIBILITY_FACTOR,
  );
  const impressionsDaily = impressionsPerVehicleDaily * input.numVehicles;
  const impressionsMonthly = impressionsDaily * DAYS_PER_MONTH;
  const impressionsTotal = impressionsMonthly * input.months;

  let cpmPLN: number | null = null;
  if (input.budgetMonthlyPLN !== null && input.budgetMonthlyPLN > 0 && impressionsTotal > 0) {
    const totalBudget = input.budgetMonthlyPLN * input.months;
    cpmPLN = (totalBudget / impressionsTotal) * 1000;
  }

  return {
    district,
    impressionsPerVehicleDaily,
    impressionsDaily,
    impressionsMonthly,
    impressionsTotal,
    cpmPLN,
  };
}
