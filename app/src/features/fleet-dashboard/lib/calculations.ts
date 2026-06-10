import type { Vehicle, VehicleStatus } from '../data/mockFleetData';
import type { FleetStats } from './types';

export function calculateFleetStats(vehicles: Vehicle[]): FleetStats {
  const totalRevenueToday = vehicles.reduce((sum, v) => sum + v.revenueToday, 0);
  const totalRevenueMonth = vehicles.reduce((sum, v) => sum + v.revenueThisMonth, 0);
  const totalKmToday = vehicles.reduce((sum, v) => sum + v.kmToday, 0);

  const activeCount = vehicles.filter(v => v.status === 'active').length;
  const offlineCount = vehicles.filter(v => v.status === 'offline').length;
  const serviceCount = vehicles.filter(v => v.status === 'service').length;

  // Calculate week (assume this week so far = 2.3 days of the week)
  const totalRevenueWeek = totalRevenueToday * 2.3;

  const averageRevenuePerVehicle = vehicles.length > 0 ? totalRevenueToday / vehicles.length : 0;

  return {
    totalRevenueToday,
    totalRevenueWeek,
    totalRevenueMonth,
    activeVehicles: activeCount,
    offlineVehicles: offlineCount,
    serviceVehicles: serviceCount,
    averageRevenuePerVehicle,
    totalKmToday,
  };
}

export function calculateNetRevenue(
  grossRevenue: number,
  commissionPercent: number,
): { gross: number; commission: number; net: number } {
  const commission = grossRevenue * (commissionPercent / 100);
  const net = grossRevenue - commission;
  return { gross: grossRevenue, commission, net };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}

export function getStatusLabel(status: VehicleStatus): string {
  const labels: Record<VehicleStatus, string> = {
    active: 'Aktywny',
    offline: 'Offline',
    service: 'Serwis',
  };
  return labels[status];
}

export function getStatusColor(status: VehicleStatus, isDark: boolean): string {
  const lightColors: Record<VehicleStatus, string> = {
    active: '#10B981',
    offline: '#EF4444',
    service: '#F59E0B',
  };
  const darkColors: Record<VehicleStatus, string> = {
    active: '#34D399',
    offline: '#FCA5A5',
    service: '#FBBF24',
  };
  return isDark ? darkColors[status] : lightColors[status];
}

export function formatLastSync(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Teraz';
  if (diffMins < 60) return `${diffMins} min temu`;
  if (diffHours < 24) return `${diffHours} godz. temu`;
  if (diffDays < 2) return 'Wczoraj';
  return `${diffDays} dni temu`;
}
