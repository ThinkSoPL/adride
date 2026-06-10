interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: string;
  isDark: boolean;
}

export function MetricCard({ label, value, subtext, icon, isDark }: MetricCardProps) {
  const bgColor = isDark ? '#1B2332' : '#F3F4F6';
  const textColor = isDark ? '#E6EDF3' : '#1F2937';
  const labelColor = isDark ? '#A0AEC0' : '#6B7280';

  return (
    <div
      style={{
        padding: '24px',
        borderRadius: '12px',
        backgroundColor: bgColor,
        border: `1px solid ${isDark ? '#364156' : '#D1D5DB'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        {icon && <span style={{ fontSize: '24px' }}>{icon}</span>}
        <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: labelColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </p>
      </div>
      <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: textColor }}>
        {value}
      </p>
      {subtext && (
        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: labelColor }}>
          {subtext}
        </p>
      )}
    </div>
  );
}
