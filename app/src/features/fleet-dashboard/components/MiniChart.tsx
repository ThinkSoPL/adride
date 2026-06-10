interface MiniChartProps {
  data: number[];
  isDark: boolean;
  height?: number;
}

export function MiniChart({ data, isDark, height = 40 }: MiniChartProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const width = 100 / data.length;
  const barColor = isDark ? '#FF6B35' : '#FF6B35';
  const opacityBase = isDark ? 0.4 : 0.5;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: `${height}px`,
        gap: '2px',
      }}
    >
      {data.map((value, idx) => {
        const normalizedHeight = ((value - min) / range) * 100;
        const opacity = opacityBase + (normalizedHeight / 100) * (1 - opacityBase);

        return (
          <div
            key={idx}
            style={{
              flex: 1,
              height: `${Math.max(2, normalizedHeight)}%`,
              backgroundColor: barColor,
              opacity,
              borderRadius: '2px',
            }}
          />
        );
      })}
    </div>
  );
}
