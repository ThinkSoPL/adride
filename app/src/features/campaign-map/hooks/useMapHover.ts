'use client';

import { useCallback, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { MapRef, MapMouseEvent } from 'react-map-gl';
import { useMapStore } from '../store';
import type { RouteProperties } from '../types';

interface HoverPoint {
  x: number;
  y: number;
  properties: RouteProperties;
}

/**
 * Obsługa hover na warstwie tras: feature-state hover + tooltip pozycja.
 */
export function useMapHover(
  mapRef: RefObject<MapRef | null>,
  layerId: string,
) {
  const setHoveredSessionId = useMapStore((s) => s.setHoveredSessionId);
  const [hoverPoint, setHoverPoint] = useState<HoverPoint | null>(null);
  const lastIdRef = useRef<string | null>(null);

  const clearHover = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map && lastIdRef.current) {
      map.setFeatureState(
        { source: 'routes-source', id: lastIdRef.current },
        { hover: false },
      );
    }
    lastIdRef.current = null;
    setHoverPoint(null);
    setHoveredSessionId(null);
  }, [mapRef, setHoveredSessionId]);

  const onMouseMove = useCallback(
    (e: MapMouseEvent) => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      const feature = e.features?.find((f) => f.layer?.id === layerId);

      if (!feature || feature.id == null) {
        if (lastIdRef.current) clearHover();
        return;
      }

      const sessionId = String(feature.id);

      if (lastIdRef.current && lastIdRef.current !== sessionId) {
        map.setFeatureState(
          { source: 'routes-source', id: lastIdRef.current },
          { hover: false },
        );
      }

      if (lastIdRef.current !== sessionId) {
        map.setFeatureState(
          { source: 'routes-source', id: sessionId },
          { hover: true },
        );
        lastIdRef.current = sessionId;
        setHoveredSessionId(sessionId);
      }

      setHoverPoint({
        x: e.point.x,
        y: e.point.y,
        properties: feature.properties as RouteProperties,
      });
    },
    [layerId, mapRef, setHoveredSessionId, clearHover],
  );

  const onMouseLeave = useCallback(() => {
    clearHover();
  }, [clearHover]);

  return { onMouseMove, onMouseLeave, hoverPoint };
}
