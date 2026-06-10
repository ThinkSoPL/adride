'use client';

import { useState } from 'react';
import type { Vehicle } from '../data/mockFleetData';
import type { SortField, SortOrder } from '../lib/types';
import { formatCurrency, formatDistance, formatLastSync } from '../lib/calculations';
import { StatusBadge } from './StatusBadge';
import { MiniChart } from './MiniChart';

interface VehicleTableProps {
  vehicles: Vehicle[];
  isDark: boolean;
  onVehicleSelect: (vehicle: Vehicle) => void;
}

export function VehicleTable({ vehicles, isDark, onVehicleSelect }: VehicleTableProps) {
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedVehicles = [...vehicles].sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    switch (sortField) {
      case 'plate':
        aVal = a.plate;
        bVal = b.plate;
        break;
      case 'revenue':
        aVal = a.revenueToday;
        bVal = b.revenueToday;
        break;
      case 'km':
        aVal = a.kmToday;
        bVal = b.kmToday;
        break;
      case 'status':
        aVal = a.status;
        bVal = b.status;
        break;
    }

    if (typeof aVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
    }

    return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const bgColor = isDark ? '#1B2332' : '#F3F4F6';
  const headerColor = isDark ? '#A0AEC0' : '#6B7280';
  const borderColor = isDark ? '#364156' : '#D1D5DB';
  const hoverBg = isDark ? '#252D3D' : '#E5E7EB';

  const SortArrow = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span style={{ color: headerColor }}>⇅</span>;
    return <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
        }}
      >
        <thead>
          <tr style={{ borderBottom: `2px solid ${borderColor}` }}>
            <th
              onClick={() => handleSort('plate')}
              style={{
                padding: '16px',
                textAlign: 'left',
                fontWeight: '600',
                color: headerColor,
                cursor: 'pointer',
                userSelect: 'none',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Pojazd <SortArrow field="plate" />
            </th>
            <th
              style={{
                padding: '16px',
                textAlign: 'left',
                fontWeight: '600',
                color: headerColor,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Status
            </th>
            <th
              onClick={() => handleSort('km')}
              style={{
                padding: '16px',
                textAlign: 'right',
                fontWeight: '600',
                color: headerColor,
                cursor: 'pointer',
                userSelect: 'none',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Km dzisiaj <SortArrow field="km" />
            </th>
            <th
              style={{
                padding: '16px',
                textAlign: 'right',
                fontWeight: '600',
                color: headerColor,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Km rozliczonych
            </th>
            <th
              onClick={() => handleSort('revenue')}
              style={{
                padding: '16px',
                textAlign: 'right',
                fontWeight: '600',
                color: headerColor,
                cursor: 'pointer',
                userSelect: 'none',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Przychód dzisiaj <SortArrow field="revenue" />
            </th>
            <th
              style={{
                padding: '16px',
                textAlign: 'right',
                fontWeight: '600',
                color: headerColor,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Przychód miesiąc
            </th>
            <th
              style={{
                padding: '16px',
                textAlign: 'right',
                fontWeight: '600',
                color: headerColor,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Trend
            </th>
            <th
              style={{
                padding: '16px',
                textAlign: 'right',
                fontWeight: '600',
                color: headerColor,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Ostatnia sync
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedVehicles.map((vehicle) => (
            <tr
              key={vehicle.id}
              onClick={() => onVehicleSelect(vehicle)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onVehicleSelect(vehicle);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Otwórz szczegóły pojazdu ${vehicle.plate}`}
              style={{
                borderBottom: `1px solid ${borderColor}`,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = hoverBg;
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <td style={{ padding: '16px', fontWeight: '500' }}>
                <div>{vehicle.plate}</div>
                <div style={{ fontSize: '12px', color: headerColor, marginTop: '4px' }}>
                  {vehicle.model}
                </div>
              </td>
              <td style={{ padding: '16px' }}>
                <StatusBadge status={vehicle.status} isDark={isDark} />
              </td>
              <td style={{ padding: '16px', textAlign: 'right', fontWeight: '500' }}>
                {formatDistance(vehicle.kmToday)}
              </td>
              <td style={{ padding: '16px', textAlign: 'right', color: headerColor }}>
                {formatDistance(vehicle.kmThisMonthBilled)}
              </td>
              <td style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#FF6B35' }}>
                {formatCurrency(vehicle.revenueToday)}
              </td>
              <td style={{ padding: '16px', textAlign: 'right', color: headerColor }}>
                {formatCurrency(vehicle.revenueThisMonth)}
              </td>
              <td style={{ padding: '16px', textAlign: 'right' }}>
                <div style={{ width: '120px', marginLeft: 'auto' }}>
                  <MiniChart data={vehicle.dailyRevenueHistory.slice(-10)} isDark={isDark} height={30} />
                </div>
              </td>
              <td style={{ padding: '16px', textAlign: 'right', fontSize: '12px', color: headerColor }}>
                {formatLastSync(vehicle.lastSyncAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
