import { calculate, type CalculatorInput } from '../calculator';

describe('calculate', () => {
  const baseInput: CalculatorInput = {
    districtIds: ['srodmiescie'],
    numVehicles: 1,
    kmDailyPerVehicle: 100,
    months: 6,
  };

  it('returns null for empty district selection', () => {
    expect(calculate({ ...baseInput, districtIds: [] })).toBeNull();
  });

  it('returns null when no selected district is known', () => {
    expect(calculate({ ...baseInput, districtIds: ['mars'] })).toBeNull();
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
    const result = calculate({ ...baseInput, months: 12 });
    expect(result?.impressionsTotal).toBe(6300 * 30 * 12);
  });

  it('averages traffic density across multiple districts', () => {
    // srodmiescie 420 + mokotow 310 = 730 / 2 = 365
    // 1 vehicle × 100 km × 365 × 0.15 = 5475
    const result = calculate({ ...baseInput, districtIds: ['srodmiescie', 'mokotow'] });
    expect(result?.avgTrafficDensity).toBe(365);
    expect(result?.impressionsPerVehicleDaily).toBe(5475);
  });

  it('derives CPM from our pricing (always positive, not from user budget)', () => {
    // 1 vehicle → recommended START (2800 PLN). impressionsMonthly = 189000.
    // cpm = (2800 / 189000) × 1000 = 14.81
    const result = calculate(baseInput);
    expect(result?.recommendedPackage.id).toBe('START');
    expect(result?.cpmPLN).toBeCloseTo(14.81, 1);
  });

  it('recommends bigger package as fleet grows', () => {
    expect(calculate({ ...baseInput, numVehicles: 3 })?.recommendedPackage.id).toBe('START');
    expect(calculate({ ...baseInput, numVehicles: 7 })?.recommendedPackage.id).toBe('SCALE');
    expect(calculate({ ...baseInput, numVehicles: 15 })?.recommendedPackage.id).toBe('PREMIUM');
  });

  it('returns brand-recall lift and estimated clients within sane bounds', () => {
    const result = calculate({ ...baseInput, numVehicles: 10, months: 12 });
    expect(result?.brandRecallLiftPct).toBeGreaterThan(0);
    expect(result?.brandRecallLiftPct).toBeLessThanOrEqual(14);
    expect(result?.estimatedNewClients).toBeGreaterThanOrEqual(0);
  });

  it('handles edge case: zero kilometers', () => {
    const result = calculate({ ...baseInput, kmDailyPerVehicle: 0 });
    expect(result?.impressionsDaily).toBe(0);
    expect(result?.impressionsTotal).toBe(0);
  });

  it('rounds impressions to nearest integer (no fractional impressions)', () => {
    const result = calculate({ ...baseInput, kmDailyPerVehicle: 33 });
    expect(Number.isInteger(result?.impressionsPerVehicleDaily)).toBe(true);
  });

  it('district affects density: bigger district → bigger impressions', () => {
    const srodmiescie = calculate({ ...baseInput, districtIds: ['srodmiescie'] });
    const wesola = calculate({ ...baseInput, districtIds: ['wesola'] });
    expect(srodmiescie!.impressionsDaily).toBeGreaterThan(wesola!.impressionsDaily);
  });
});
