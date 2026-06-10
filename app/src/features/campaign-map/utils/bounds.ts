import type { RouteFeatureCollection } from '../types';

export type BBox = [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]

/** Centrum Warszawy — fallback gdy brak danych do bounds */
export const WARSAW_CENTER: { lng: number; lat: number; zoom: number } = {
  lng: 21.0122,
  lat: 52.2297,
  zoom: 11,
};

/**
 * Oblicza prostokąt obejmujący wszystkie współrzędne we FeatureCollection.
 * Zwraca null jeśli kolekcja jest pusta.
 */
export function computeBoundsFromFeatures(
  fc: RouteFeatureCollection,
): BBox | null {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  let hasAny = false;

  for (const feature of fc.features) {
    for (const coord of feature.geometry.coordinates) {
      const lng = coord[0];
      const lat = coord[1];
      if (lng === undefined || lat === undefined) continue;
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
      hasAny = true;
    }
  }

  if (!hasAny) return null;
  return [minLng, minLat, maxLng, maxLat];
}

/**
 * Dodaje padding (w stopniach) do bbox — żeby trasy nie były przyklejone do krawędzi.
 */
export function padBounds(bbox: BBox, padding = 0.01): BBox {
  return [
    bbox[0] - padding,
    bbox[1] - padding,
    bbox[2] + padding,
    bbox[3] + padding,
  ];
}
