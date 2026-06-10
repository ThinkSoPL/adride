'use client';

import { Source, Layer, type LayerProps } from 'react-map-gl';
import {
  routeColorExpression,
  routeWidthExpression,
  routeGlowWidthExpression,
  routeOpacityByHourExpression,
  COLOR_HOVER,
} from '../utils/colorScale';
import { useMapStore } from '../store';
import type { RouteFeatureCollection } from '../types';

interface RoutesLayerProps {
  featureCollection: RouteFeatureCollection;
}

export function RoutesLayer({ featureCollection }: RoutesLayerProps) {
  const timeOfDay = useMapStore((s) => s.filters.timeOfDay);
  const highContrast = useMapStore((s) => s.highContrast);

  const glowLayer: LayerProps = {
    id: 'routes-glow',
    type: 'line',
    paint: {
      'line-color': COLOR_HOVER,
      'line-width': routeGlowWidthExpression(),
      'line-blur': 4,
      'line-opacity': 0.4,
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
  };

  const mainLayer: LayerProps = {
    id: 'routes-line',
    type: 'line',
    paint: {
      'line-color': highContrast ? '#FFFFFF' : routeColorExpression(),
      'line-width': routeWidthExpression(),
      'line-opacity': routeOpacityByHourExpression(
        timeOfDay[0],
        timeOfDay[1],
      ),
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
  };

  return (
    <Source
      id="routes-source"
      type="geojson"
      data={featureCollection}
      promoteId="sessionId"
    >
      <Layer {...glowLayer} />
      <Layer {...mainLayer} />
    </Source>
  );
}
