'use client';

import { useMemo } from 'react';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { useMapStore } from '../store';
import type { CampaignVehicle } from '../types';

interface FilterPanelProps {
  vehicles: CampaignVehicle[];
}

export function FilterPanel({ vehicles }: FilterPanelProps) {
  const dateRange = useMapStore((s) => s.filters.dateRange);
  const vehicleIds = useMapStore((s) => s.filters.vehicleIds);
  const setDateRange = useMapStore((s) => s.setDateRange);
  const toggleVehicle = useMapStore((s) => s.toggleVehicle);
  const resetFilters = useMapStore((s) => s.resetFilters);

  const fromIso = useMemo(
    () => format(dateRange.from, 'yyyy-MM-dd'),
    [dateRange.from],
  );
  const toIso = useMemo(
    () => format(dateRange.to, 'yyyy-MM-dd'),
    [dateRange.to],
  );

  const isAll = vehicleIds.length === 0;

  return (
    <div className="absolute left-4 top-56 z-10 w-72 rounded-lg border border-panel-border bg-panel-bg p-3 shadow-lg backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">
          Filtry
        </h3>
        <button
          type="button"
          onClick={resetFilters}
          className="text-xs text-adride-orange hover:underline"
        >
          Reset
        </button>
      </div>

      <div className="mb-3 space-y-2">
        <label className="block text-xs text-white/60">Od</label>
        <input
          type="date"
          value={fromIso}
          onChange={(e) => {
            const v = e.target.value;
            if (v) setDateRange(startOfDay(parseISO(v)), dateRange.to);
          }}
          className="w-full rounded border border-panel-border bg-black/30 px-2 py-1 text-sm text-white/90 focus:border-adride-orange focus:outline-none"
        />
        <label className="block text-xs text-white/60">Do</label>
        <input
          type="date"
          value={toIso}
          onChange={(e) => {
            const v = e.target.value;
            if (v) setDateRange(dateRange.from, endOfDay(parseISO(v)));
          }}
          className="w-full rounded border border-panel-border bg-black/30 px-2 py-1 text-sm text-white/90 focus:border-adride-orange focus:outline-none"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-white/60">Pojazdy</span>
          <span className="text-white/40">
            {isAll ? `Wszystkie (${vehicles.length})` : `${vehicleIds.length}/${vehicles.length}`}
          </span>
        </div>
        <ul className="max-h-44 space-y-1 overflow-y-auto pr-1">
          {vehicles.map((v) => {
            const checked = isAll || vehicleIds.includes(v.id);
            return (
              <li key={v.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm text-white/90 hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleVehicle(v.id)}
                    className="h-4 w-4 accent-adride-orange"
                  />
                  <span className="font-mono text-xs">
                    {v.registration_plate_masked}
                  </span>
                </label>
              </li>
            );
          })}
          {vehicles.length === 0 && (
            <li className="px-1 py-0.5 text-xs italic text-white/40">
              Brak pojazdów w kampanii
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
