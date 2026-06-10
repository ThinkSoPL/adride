'use client';

import { useMapStore } from '../store';
import type { MapFilters } from '../types';

type LayerKey = keyof MapFilters['layerVisibility'];

const LAYERS: { key: LayerKey; label: string; hint: string }[] = [
  { key: 'routes', label: 'Trasy', hint: 'Historyczne przejazdy z gradientem wieku' },
  { key: 'heatmap', label: 'Heatmapa', hint: 'Natężenie ekspozycji' },
  { key: 'live', label: 'Pojazdy live', hint: 'Aktualne pozycje GPS (≤5 min)' },
  { key: 'districts', label: 'Dzielnice', hint: 'Granice Warszawy + km ekspozycji' },
];

export function LayerToggle() {
  const visibility = useMapStore((s) => s.filters.layerVisibility);
  const toggle = useMapStore((s) => s.toggleLayer);

  return (
    <div className="absolute left-4 top-4 z-10 w-56 rounded-lg border border-panel-border bg-panel-bg p-3 shadow-lg backdrop-blur">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">
        Warstwy
      </h3>
      <ul className="space-y-1">
        {LAYERS.map((l) => (
          <li key={l.key}>
            <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-white/90 hover:bg-white/5">
              <input
                type="checkbox"
                checked={visibility[l.key]}
                onChange={() => toggle(l.key)}
                className="h-4 w-4 accent-adride-orange"
              />
              <span className="flex-1" title={l.hint}>
                {l.label}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
