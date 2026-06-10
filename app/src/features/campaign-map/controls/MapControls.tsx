'use client';

import {
  NavigationControl,
  ScaleControl,
  GeolocateControl,
} from 'react-map-gl';
import { useMapStore } from '../store';
import type { MapStyleId } from '../types';

export function MapControls() {
  const mapStyle = useMapStore((s) => s.mapStyle);
  const setMapStyle = useMapStore((s) => s.setMapStyle);
  const highContrast = useMapStore((s) => s.highContrast);
  const setHighContrast = useMapStore((s) => s.setHighContrast);

  const styles: { id: MapStyleId; label: string }[] = [
    { id: 'dark', label: 'Ciemny' },
    { id: 'streets', label: 'Ulice' },
  ];

  return (
    <>
      <NavigationControl position="top-right" />
      <ScaleControl position="bottom-right" />
      <GeolocateControl position="top-right" />

      <div className="absolute right-4 top-32 z-10 flex flex-col gap-2">
        <div className="rounded-lg border border-panel-border bg-panel-bg p-1 shadow-lg">
          {styles.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setMapStyle(s.id)}
              className={`block w-full px-3 py-1 text-xs transition-colors ${
                mapStyle === s.id
                  ? 'rounded bg-adride-orange text-black'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setHighContrast(!highContrast)}
          className={`rounded-lg border border-panel-border bg-panel-bg px-3 py-1.5 text-xs shadow-lg transition-colors ${
            highContrast ? 'text-adride-highlight' : 'text-white/70 hover:text-white'
          }`}
          aria-pressed={highContrast}
          title="Tryb wysokiego kontrastu"
        >
          A11y
        </button>
      </div>
    </>
  );
}
