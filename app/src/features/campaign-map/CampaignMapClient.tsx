'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Map, { type MapRef } from 'react-map-gl';
import { sessionsToFeatureCollection } from './utils/geojson';
import {
  computeBoundsFromFeatures,
  padBounds,
  WARSAW_CENTER,
} from './utils/bounds';
import { useMapStore } from './store';
import { useRoutes } from './hooks/useRoutes';
import { useRealtimeVehicles } from './hooks/useRealtimeVehicles';
import { useUrlSync } from './hooks/useUrlSync';
import { useMapHover } from './hooks/useMapHover';
import { RoutesLayer } from './layers/RoutesLayer';
import { HeatmapLayer } from './layers/HeatmapLayer';
import { LiveVehiclesLayer } from './layers/LiveVehiclesLayer';
import { DistrictsLayer } from './layers/DistrictsLayer';
import { MapControls } from './controls/MapControls';
import { LayerToggle } from './controls/LayerToggle';
import { FilterPanel } from './controls/FilterPanel';
import { TimeSlider } from './controls/TimeSlider';
import { VehiclePopup } from './popups/VehiclePopup';
import { RouteTooltip } from './popups/RouteTooltip';
import { MAP_STYLES, type CampaignMapClientProps } from './types';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function CampaignMapClient({
  campaignId,
  initialRoutes,
  vehicles,
}: CampaignMapClientProps) {
  const mapRef = useRef<MapRef | null>(null);

  const mapStyle = useMapStore((s) => s.mapStyle);
  const layerVisibility = useMapStore((s) => s.filters.layerVisibility);

  const { routes, isLoading } = useRoutes(campaignId, initialRoutes);
  useRealtimeVehicles(campaignId, vehicles, initialRoutes);
  useUrlSync();

  const featureCollection = useMemo(
    () => sessionsToFeatureCollection(routes),
    [routes],
  );

  const { onMouseMove, onMouseLeave, hoverPoint } = useMapHover(
    mapRef,
    'routes-line',
  );

  // FlyTo initial bounds once we have data
  const [didInitialFit, setDidInitialFit] = useState(false);
  useEffect(() => {
    if (didInitialFit || featureCollection.features.length === 0) return;
    const bbox = computeBoundsFromFeatures(featureCollection);
    if (!bbox) return;
    mapRef.current?.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      { padding: 60, duration: 800 },
    );
    setDidInitialFit(true);
  }, [featureCollection, didInitialFit]);

  const initialBbox = useMemo(() => {
    const bbox = computeBoundsFromFeatures(
      sessionsToFeatureCollection(initialRoutes),
    );
    return bbox ? padBounds(bbox) : null;
  }, [initialRoutes]);

  if (!MAPBOX_TOKEN) {
    return <MissingTokenScreen />;
  }

  return (
    <div className="relative h-full w-full">
      <Map
        ref={(instance) => {
          mapRef.current = instance;
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={MAP_STYLES[mapStyle]}
        initialViewState={
          initialBbox
            ? {
                bounds: [
                  [initialBbox[0], initialBbox[1]],
                  [initialBbox[2], initialBbox[3]],
                ],
                fitBoundsOptions: { padding: 60 },
              }
            : {
                longitude: WARSAW_CENTER.lng,
                latitude: WARSAW_CENTER.lat,
                zoom: WARSAW_CENTER.zoom,
              }
        }
        interactiveLayerIds={['routes-line', 'live-vehicles']}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        attributionControl={true}
      >
        {layerVisibility.districts && <DistrictsLayer />}
        {layerVisibility.routes && (
          <RoutesLayer featureCollection={featureCollection} />
        )}
        {layerVisibility.heatmap && (
          <HeatmapLayer featureCollection={featureCollection} />
        )}
        {layerVisibility.live && <LiveVehiclesLayer />}

        <VehiclePopup />
        <RouteTooltip hoverPoint={hoverPoint} />
      </Map>

      <MapControls />
      <LayerToggle />
      <FilterPanel vehicles={vehicles} />
      <TimeSlider />

      {isLoading && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-panel-bg px-4 py-1.5 text-xs text-adride-orange shadow-lg ring-1 ring-panel-border">
          Ładowanie tras…
        </div>
      )}
    </div>
  );
}

function MissingTokenScreen() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#0a0d12] p-8">
      <div className="max-w-md rounded-lg border border-red-700 bg-red-950/40 p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold text-red-200">
          Brak tokenu Mapbox
        </h2>
        <p className="text-sm text-red-300/80">
          Ustaw <code className="rounded bg-black/40 px-1.5 py-0.5">NEXT_PUBLIC_MAPBOX_TOKEN</code> w
          pliku <code className="rounded bg-black/40 px-1.5 py-0.5">.env.local</code> i zrestartuj serwer.
        </p>
      </div>
    </div>
  );
}
