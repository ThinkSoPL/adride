import {
  calculateFleetStats,
  calculateNetRevenue,
  formatCurrency,
  formatDistance,
  getStatusLabel,
  formatLastSync,
} from '../calculations';
import type { Vehicle } from '../../data/mockFleetData';

const mkVehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
  id: 'v1',
  plate: 'WA 11111',
  model: 'Test',
  status: 'active',
  kmToday: 100,
  kmThisMonthBilled: 2000,
  revenueToday: 400,
  revenueThisMonth: 8000,
  advertisingPackage: 'Standard',
  lastSyncAt: new Date().toISOString(),
  ratePerKm: 4,
  platformCommissionPercent: 15,
  dailyRevenueHistory: [100, 200, 300],
  dailyKmHistory: [25, 50, 75],
  ...overrides,
});

describe('calculateFleetStats', () => {
  it('handles empty fleet', () => {
    const stats = calculateFleetStats([]);
    expect(stats.totalRevenueToday).toBe(0);
    expect(stats.totalRevenueMonth).toBe(0);
    expect(stats.activeVehicles).toBe(0);
    expect(stats.averageRevenuePerVehicle).toBe(0);
  });

  it('sums revenues across vehicles', () => {
    const stats = calculateFleetStats([
      mkVehicle({ revenueToday: 100, revenueThisMonth: 3000 }),
      mkVehicle({ revenueToday: 200, revenueThisMonth: 4000 }),
    ]);
    expect(stats.totalRevenueToday).toBe(300);
    expect(stats.totalRevenueMonth).toBe(7000);
  });

  it('counts vehicles by status', () => {
    const stats = calculateFleetStats([
      mkVehicle({ status: 'active' }),
      mkVehicle({ status: 'active' }),
      mkVehicle({ status: 'offline' }),
      mkVehicle({ status: 'service' }),
    ]);
    expect(stats.activeVehicles).toBe(2);
    expect(stats.offlineVehicles).toBe(1);
    expect(stats.serviceVehicles).toBe(1);
  });

  it('computes average revenue per vehicle', () => {
    const stats = calculateFleetStats([
      mkVehicle({ revenueToday: 100 }),
      mkVehicle({ revenueToday: 200 }),
      mkVehicle({ revenueToday: 300 }),
    ]);
    expect(stats.averageRevenuePerVehicle).toBe(200);
  });
});

describe('calculateNetRevenue', () => {
  it('computes commission and net correctly', () => {
    const result = calculateNetRevenue(1000, 15);
    expect(result.gross).toBe(1000);
    expect(result.commission).toBe(150);
    expect(result.net).toBe(850);
  });

  it('handles zero gross', () => {
    const result = calculateNetRevenue(0, 15);
    expect(result.commission).toBe(0);
    expect(result.net).toBe(0);
  });

  it('handles zero commission', () => {
    const result = calculateNetRevenue(1000, 0);
    expect(result.net).toBe(1000);
  });
});

describe('formatCurrency', () => {
  it('formats PLN with proper symbol and decimals', () => {
    const formatted = formatCurrency(1234.5);
    // Polish locale: "1234,50 zł" or "1 234,50 zł"
    expect(formatted).toMatch(/1.*234[,.]50.*zł/);
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toMatch(/0[,.]00.*zł/);
  });
});

describe('formatDistance', () => {
  it('formats km with one decimal', () => {
    expect(formatDistance(123.456)).toBe('123.5 km');
  });
});

describe('getStatusLabel', () => {
  it('translates status to Polish', () => {
    expect(getStatusLabel('active')).toBe('Aktywny');
    expect(getStatusLabel('offline')).toBe('Offline');
    expect(getStatusLabel('service')).toBe('Serwis');
  });
});

describe('formatLastSync', () => {
  it('shows "Teraz" for very recent dates', () => {
    expect(formatLastSync(new Date().toISOString())).toBe('Teraz');
  });

  it('shows minutes for dates < 1h old', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatLastSync(fiveMinAgo)).toBe('5 min temu');
  });

  it('shows hours for dates < 24h old', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600_000).toISOString();
    expect(formatLastSync(threeHoursAgo)).toBe('3 godz. temu');
  });
});
