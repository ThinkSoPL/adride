'use client';

import { useMemo } from 'react';
import { Source, Layer, type LayerProps } from 'react-map-gl';
import { routesToHeatmapFeatures } from '../utils/geojson';
import type { RouteFeatureCollection } from '../types';

interface HeatmapLayerProps {
  featureCollection: RouteFeatureCollection;
}

export function HeatmapLayer({ featureCollection }: HeatmapLayerProps) {
  const heatPoints = useMemo(
    () => routesToHeatmapFeatures(featureCollection, 5),
    [featureCollection],
  );

  const heatLayer: LayerProps = {
    id: 'heatmap-layer',
    type: 'heatmap',
    paint: {
      'heatmap-weight': [
        'interpolate',
        ['linear'],
        ['get', 'weight'],
        0, 0,
        1, 1,
      ],
      'heatmap-intensity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10, 0.5,
        15, 2,
      ],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,   'rgba(0,0,0,0)',
        0.2, 'rgba(255,154,53,0.25)',
        0.4, 'rgba(255,107,53,0.5)',
        0.6, 'rgba(255,80,30,0.7)',
        0.8, 'rgba(255,40,0,0.85)',
        1,   'rgba(255,255,255,0.95)',
      ],
      'heatmap-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10, 8,
        15, 24,
      ],
      'heatmap-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        13, 0.9,
        17, 0.2,
      ],
    },
  };

  return (
    <Source id="heatmap-source" type="geojson" data={heatPoints}>
      <Layer {...heatLayer} />
    </Source>
  );
}
