'use client';

import { useEffect, useState } from 'react';
import { Source, Layer, type LayerProps } from 'react-map-gl';
import { getSupabaseBrowserClient } from '../lib/supabase-browser';
import type { DistrictFeatureCollection } from '../types';

/**
 * Warstwa dzielnic Warszawy z poziomem ekspozycji (km).
 * Fetch z widoku `mv_district_exposure` (z migracji 000016).
 */
export function DistrictsLayer() {
  const [fc, setFc] = useState<DistrictFeatureCollection | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('warsaw_districts')
        .select('name, geom');

      if (cancelled || error || !data) return;

      const features = (data as Array<{
        name: string;
        geom: GeoJSON.MultiPolygon;
      }>).map((row) => ({
        type: 'Feature' as const,
        properties: {
          name: row.name,
          exposureKm: 0,
        },
        geometry: row.geom,
      }));

      setFc({ type: 'FeatureCollection', features });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!fc) return null;

  const fillLayer: LayerProps = {
    id: 'districts-fill',
    type: 'fill',
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'exposureKm'],
        0,   'rgba(85,85,85,0.05)',
        100, 'rgba(255,154,53,0.18)',
        500, 'rgba(255,107,53,0.35)',
        1000,'rgba(255,60,30,0.55)',
      ],
      'fill-outline-color': 'rgba(255,255,255,0.15)',
    },
  };

  const labelLayer: LayerProps = {
    id: 'districts-label',
    type: 'symbol',
    layout: {
      'text-field': ['get', 'name'],
      'text-size': 11,
      'text-anchor': 'center',
    },
    paint: {
      'text-color': 'rgba(255,255,255,0.7)',
      'text-halo-color': 'rgba(0,0,0,0.6)',
      'text-halo-width': 1,
    },
  };

  return (
    <Source id="districts-source" type="geojson" data={fc}>
      <Layer {...fillLayer} />
      <Layer {...labelLayer} />
    </Source>
  );
}
