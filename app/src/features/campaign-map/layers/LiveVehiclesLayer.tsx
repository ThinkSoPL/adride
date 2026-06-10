'use client';

import { Marker } from 'react-map-gl';
import { useMapStore, selectLiveVehiclesArray } from '../store';
import type { VehicleMarker } from '../types';

export function LiveVehiclesLayer() {
  const liveVehicles = useMapStore(selectLiveVehiclesArray);
  const setSelected = useMapStore((s) => s.setSelectedVehicle);

  return (
    <>
      {liveVehicles.map((marker) => (
        <Marker
          key={marker.vehicleId}
          longitude={marker.lng}
          latitude={marker.lat}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelected({
              vehicleId: marker.vehicleId,
              sessionId: marker.sessionId,
              registrationMasked: marker.registrationMasked,
              kmToday: 0,
              kmInCampaign: 0,
              lastLocation: { lat: marker.lat, lng: marker.lng },
              lastSeen: marker.lastSeen,
              avgSpeedKmh: null,
              currentSpeedKmh: marker.speedKmh,
              batteryLevel: marker.batteryLevel,
            });
          }}
        >
          <VehicleMarkerSvg marker={marker} />
        </Marker>
      ))}
    </>
  );
}

function VehicleMarkerSvg({ marker }: { marker: VehicleMarker }) {
  const rotation = marker.heading ?? 0;
  const color = marker.isLive ? '#FF6B35' : '#777777';

  return (
    <div
      className="relative cursor-pointer transition-transform hover:scale-110"
      style={{ transform: `rotate(${rotation}deg)` }}
      role="button"
      aria-label={`Pojazd ${marker.registrationMasked}`}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="13" fill={color} fillOpacity="0.2" />
        <circle cx="14" cy="14" r="8" fill={color} stroke="#0a0d12" strokeWidth="2" />
        <path d="M14 6 L18 14 L14 12 L10 14 Z" fill="#0a0d12" />
      </svg>
      {marker.isLive && (
        <span
          className="absolute -inset-2 animate-ping rounded-full bg-adride-orange/30"
          aria-hidden
        />
      )}
    </div>
  );
}
