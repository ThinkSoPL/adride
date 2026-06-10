import type { VehicleStatus } from '../data/mockFleetData';
import { getStatusLabel, getStatusColor } from '../lib/calculations';

interface StatusBadgeProps {
  status: VehicleStatus;
  isDark: boolean;
}

export function StatusBadge({ status, isDark }: StatusBadgeProps) {
  const label = getStatusLabel(status);
  const color = getStatusColor(status, isDark);
  const bgColor = isDark
    ? status === 'active'
      ? 'rgba(52, 211, 153, 0.1)'
      : status === 'offline'
        ? 'rgba(252, 165, 165, 0.1)'
        : 'rgba(251, 191, 36, 0.1)'
    : status === 'active'
      ? 'rgba(16, 185, 129, 0.1)'
      : status === 'offline'
        ? 'rgba(239, 68, 68, 0.1)'
        : 'rgba(245, 158, 11, 0.1)';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '6px',
        backgroundColor: bgColor,
        color,
        fontSize: '12px',
        fontWeight: '600',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: color,
        }}
      />
      {label}
    </span>
  );
}
