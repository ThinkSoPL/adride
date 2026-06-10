import { calculate } from '../calculator';

describe('calculate', () => {
  const baseInput = {
    districtId: 'srodmiescie',
    numVehicles: 1,
    kmDailyPerVehicle: 100,
    months: 1,
    budgetMonthlyPLN: null,
  };

  it('returns null for unknown district', () => {
    expect(calculate({ ...baseInput, districtId: 'mars' })).toBeNull();
  });

  it('calculates impressions per vehicle daily correctly', () => {
    // Śródmieście trafficDensity = 420, visibility = 0.15
    // 1 vehicle × 100 km × 420 × 0.15 = 6300
    const result = calculate(baseInput);
    expect(result?.impressionsPerVehicleDaily).toBe(6300);
    expect(result?.impressionsDaily).toBe(6300);
  });

  it('scales linearly with vehicles', () => {
    const result = calculate({ ...baseInput, numVehicles: 5 });
    expect(result?.impressionsDaily).toBe(6300 * 5);
  });

  it('scales monthly = daily × 30', () => {
    const result = calculate(baseInput);
    expect(result?.impressionsMonthly).toBe(6300 * 30);
  });

  it('scales total = monthly × months', () => {
    const result = calculate({ ...baseInput, months: 6 });
    expect(result?.impressionsTotal).toBe(6300 * 30 * 6);
  });

  it('returns null CPM when budget is not provided', () => {
    const result = calculate(baseInput);
    expect(result?.cpmPLN).toBeNull();
  });

  it('returns null CPM when budget is zero', () => {
    const result = calculate({ ...baseInput, budgetMonthlyPLN: 0 });
    expect(result?.cpmPLN).toBeNull();
  });

  it('calculates CPM correctly when budget is provided', () => {
    // 1 vehicle, 100 km, srodmiescie (420 density), 1 month, 5000 PLN budget
    // impressions_total = 6300 × 30 × 1 = 189000
    // total_budget = 5000 × 1 = 5000
    // cpm = (5000 / 189000) × 1000 = 26.46
    const result = calculate({ ...baseInput, budgetMonthlyPLN: 5000 });
    expect(result?.cpmPLN).toBeCloseTo(26.46, 1);
  });

  it('handles edge case: zero kilometers', () => {
    const result = calculate({ ...baseInput, kmDailyPerVehicle: 0 });
    expect(result?.impressionsDaily).toBe(0);
    expect(result?.impressionsTotal).toBe(0);
  });

  it('rounds impressions to nearest integer (no fractional impressions)', () => {
    // 1 vehicle × 33 km × 420 density × 0.15 = 2079.0 (no fraction)
    const result = calculate({ ...baseInput, kmDailyPerVehicle: 33 });
    expect(Number.isInteger(result?.impressionsPerVehicleDaily)).toBe(true);
  });

  it('district affects density: bigger district → bigger impressions', () => {
    const srodmiescie = calculate({ ...baseInput, districtId: 'srodmiescie' });
    const wesola = calculate({ ...baseInput, districtId: 'wesola' });
    expect(srodmiescie!.impressionsDaily).toBeGreaterThan(wesola!.impressionsDaily);
  });
});
