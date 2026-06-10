import type { FleetStats } from '../lib/types';
import { formatCurrency } from '../lib/calculations';
import { MetricCard } from './MetricCard';

interface FleetOverviewProps {
  stats: FleetStats;
  isDark: boolean;
}

export function FleetOverview({ stats, isDark }: FleetOverviewProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}
    >
      <MetricCard
        label="Przychód dzisiaj"
        value={formatCurrency(stats.totalRevenueToday)}
        subtext={`+${formatCurrency(stats.totalRevenueWeek)} w tym tygodniu`}
        icon="📊"
        isDark={isDark}
      />
      <MetricCard
        label="Przychód miesiąc"
        value={formatCurrency(stats.totalRevenueMonth)}
        subtext={`${stats.totalRevenueMonth > 0 ? '+' : ''}${((stats.totalRevenueMonth / 25000) * 100).toFixed(0)}% celu`}
        icon="📈"
        isDark={isDark}
      />
      <MetricCard
        label="Aktywne samochody"
        value={stats.activeVehicles}
        subtext={`${stats.offlineVehicles} offline, ${stats.serviceVehicles} w serwisie`}
        icon="🚗"
        isDark={isDark}
      />
      <MetricCard
        label="Średnia na samochód"
        value={formatCurrency(stats.averageRevenuePerVehicle)}
        subtext="Średnia dzienna"
        icon="💰"
        isDark={isDark}
      />
    </div>
  );
}
