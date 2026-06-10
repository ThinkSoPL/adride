'use client';

import { format } from 'date-fns';
import { useMapStore } from '../store';
import type { RouteProperties } from '../types';

interface RouteTooltipProps {
  hoverPoint: {
    x: number;
    y: number;
    properties: RouteProperties;
  } | null;
}

export function RouteTooltip({ hoverPoint }: RouteTooltipProps) {
  if (!hoverPoint) return null;

  const { properties, x, y } = hoverPoint;

  const km = (properties.totalDistanceM / 1000).toFixed(1);
  const speed = properties.avgSpeedKmh?.toFixed(0) ?? '—';
  const started = format(new Date(properties.startedAt), 'd MMM, HH:mm');

  return (
    <div
      className="pointer-events-none absolute z-20 rounded-md border border-panel-border bg-panel-bg px-2.5 py-1.5 text-[11px] shadow-lg"
      style={{
        left: x + 14,
        top: y + 14,
        transform: 'translate(0, 0)',
      }}
    >
      <div className="mb-0.5 font-mono text-xs font-semibold text-adride-orange">
        {properties.registrationMasked}
      </div>
      <div className="text-white/80">{started}</div>
      <div className="mt-0.5 text-white/60">
        {km} km · ⌀ {speed} km/h
      </div>
    </div>
  );
}
