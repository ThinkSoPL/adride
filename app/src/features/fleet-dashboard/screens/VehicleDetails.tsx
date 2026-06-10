'use client';

import type { Vehicle } from '../data/mockFleetData';
import type { FleetData } from '../data/mockFleetData';
import { calculateNetRevenue, formatCurrency, formatDistance, getStatusLabel } from '../lib/calculations';
import { StatusBadge } from '../components/StatusBadge';
import { MiniChart } from '../components/MiniChart';

interface Colors {
  bg: string;
  bgSecondary: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  success: string;
  warning: string;
}

interface VehicleDetailsProps {
  vehicle: Vehicle;
  owner: FleetData['owner'];
  isDark: boolean;
  onBack: () => void;
  colors: Colors;
}

export function VehicleDetails({ vehicle, owner, isDark, onBack, colors }: VehicleDetailsProps) {
  const totalEarned = vehicle.revenueThisMonth;
  const netRevenue = calculateNetRevenue(totalEarned, vehicle.platformCommissionPercent);
  const lastThirtyDays = vehicle.dailyRevenueHistory;
  const avgDailyRevenue = lastThirtyDays.reduce((a, b) => a + b, 0) / lastThirtyDays.length;

  return (
    <div style={{ backgroundColor: colors.bg, color: colors.text, minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.bgSecondary,
          padding: '24px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <button
            onClick={onBack}
            style={{
              padding: '8px 12px',
              border: 'none',
              backgroundColor: 'transparent',
              color: colors.accent,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '16px',
            }}
          >
            ← Wróć
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px' }}>
            <div>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700' }}>
                {vehicle.plate}
              </h1>
              <p style={{ margin: 0, fontSize: '16px', color: colors.textSecondary }}>
                {vehicle.model}
              </p>
            </div>
            <StatusBadge status={vehicle.status} isDark={isDark} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div style={{ backgroundColor: colors.bgSecondary, padding: '20px', borderRadius: '10px', border: `1px solid ${colors.border}` }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: colors.textSecondary, textTransform: 'uppercase' }}>
              Przychód dzisiaj
            </p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: colors.accent }}>
              {formatCurrency(vehicle.revenueToday)}
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: colors.textSecondary }}>
              {formatDistance(vehicle.kmToday)} dzisiaj
            </p>
          </div>

          <div style={{ backgroundColor: colors.bgSecondary, padding: '20px', borderRadius: '10px', border: `1px solid ${colors.border}` }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: colors.textSecondary, textTransform: 'uppercase' }}>
              Przychód miesiąc
            </p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
              {formatCurrency(vehicle.revenueThisMonth)}
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: colors.textSecondary }}>
              {formatDistance(vehicle.kmThisMonthBilled)} rozliczonych
            </p>
          </div>

          <div style={{ backgroundColor: colors.bgSecondary, padding: '20px', borderRadius: '10px', border: `1px solid ${colors.border}` }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: colors.textSecondary, textTransform: 'uppercase' }}>
              Średnia dzienna
            </p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
              {formatCurrency(avgDailyRevenue)}
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: colors.textSecondary }}>
              Ostatnie 30 dni
            </p>
          </div>

          <div style={{ backgroundColor: colors.bgSecondary, padding: '20px', borderRadius: '10px', border: `1px solid ${colors.border}` }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: colors.textSecondary, textTransform: 'uppercase' }}>
              Status
            </p>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              {getStatusLabel(vehicle.status)}
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: colors.textSecondary }}>
              {vehicle.advertisingPackage}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div style={{ backgroundColor: colors.bgSecondary, padding: '24px', borderRadius: '12px', border: `1px solid ${colors.border}`, marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600' }}>
            Trend przychodów (ostatnie 30 dni)
          </h3>
          <MiniChart data={lastThirtyDays} isDark={isDark} height={180} />
        </div>

        {/* Billing Section */}
        <div style={{ backgroundColor: colors.bgSecondary, padding: '24px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: '600' }}>
            Rozliczenia
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px',
            }}
          >
            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: colors.textSecondary, textTransform: 'uppercase' }}>
                Stawka za kilometr
              </p>
              <p style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700' }}>
                {formatCurrency(vehicle.ratePerKm)}
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: colors.textSecondary }}>
                za 1 km rozliczony
              </p>
            </div>

            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: colors.textSecondary, textTransform: 'uppercase' }}>
                Przychód brutto
              </p>
              <p style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700' }}>
                {formatCurrency(netRevenue.gross)}
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: colors.textSecondary }}>
                {vehicle.kmThisMonthBilled.toFixed(0)} km × {formatCurrency(vehicle.ratePerKm)}
              </p>
            </div>

            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: colors.textSecondary, textTransform: 'uppercase' }}>
                Prowizja platformy
              </p>
              <p style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700', color: colors.warning }}>
                -{formatCurrency(netRevenue.commission)}
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: colors.textSecondary }}>
                {vehicle.platformCommissionPercent}% od przychodu
              </p>
            </div>

            <div
              style={{
                backgroundColor: isDark ? 'rgba(255, 107, 53, 0.1)' : 'rgba(255, 107, 53, 0.05)',
                padding: '16px',
                borderRadius: '8px',
                border: `1px solid ${colors.accent}`,
              }}
            >
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: colors.textSecondary, textTransform: 'uppercase' }}>
                Przychód netto
              </p>
              <p style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700', color: colors.accent }}>
                {formatCurrency(netRevenue.net)}
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: colors.textSecondary }}>
                Do wypłaty
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
