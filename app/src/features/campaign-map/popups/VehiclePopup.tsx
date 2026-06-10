'use client';

import { Popup } from 'react-map-gl';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useMapStore } from '../store';

export function VehiclePopup() {
  const selected = useMapStore((s) => s.selectedVehicle);
  const setSelected = useMapStore((s) => s.setSelectedVehicle);

  if (!selected) return null;

  const battery =
    selected.batteryLevel !== null
      ? `${Math.round(selected.batteryLevel * 100)}%`
      : '—';
  const speed =
    selected.currentSpeedKmh !== null
      ? `${selected.currentSpeedKmh.toFixed(0)} km/h`
      : '—';

  return (
    <Popup
      longitude={selected.lastLocation.lng}
      latitude={selected.lastLocation.lat}
      anchor="bottom"
      onClose={() => setSelected(null)}
      closeOnClick={false}
      offset={20}
    >
      <div className="min-w-[200px] space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-sm font-semibold text-adride-orange">
            {selected.registrationMasked}
          </span>
          <span className="rounded-full bg-adride-orange/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-adride-orange">
            Live
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <dt className="text-white/50">Prędkość</dt>
          <dd className="text-right text-white/90">{speed}</dd>

          <dt className="text-white/50">Bateria</dt>
          <dd className="text-right text-white/90">{battery}</dd>

          <dt className="text-white/50">Km dziś</dt>
          <dd className="text-right text-white/90">
            {selected.kmToday.toFixed(1)} km
          </dd>

          <dt className="text-white/50">Km w kampanii</dt>
          <dd className="text-right text-white/90">
            {selected.kmInCampaign.toFixed(0)} km
          </dd>
        </dl>

        <div className="border-t border-white/10 pt-1.5 text-[11px] text-white/50">
          Ostatnie zgłoszenie{' '}
          {formatDistanceToNow(new Date(selected.lastSeen), {
            addSuffix: true,
            locale: pl,
          })}
        </div>
      </div>
    </Popup>
  );
}
