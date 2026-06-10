// =============================================================================
// AdRide GPS Tracking — wzór Haversine + filtrowanie outlierów
// =============================================================================

import { EARTH_RADIUS_M, MAX_SPEED_KMH } from './config';
import type { GpsPoint } from './types';

/** Konwersja stopni dziesiętnych na radiany */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Oblicza odległość między dwoma punktami GPS na sferze (wzór Haversine).
 * Zwraca metry. Dokładność: < 0.5% dla odległości < 100km.
 */
export function haversineDistance(
  p1: Pick<GpsPoint, 'lat' | 'lng'>,
  p2: Pick<GpsPoint, 'lat' | 'lng'>,
): number {
  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lng - p1.lng);
  const lat1 = toRad(p1.lat);
  const lat2 = toRad(p2.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/**
 * Sprawdza czy punkt GPS jest outlierem (skok, dryf odbiornika).
 * Kryterium: obliczona prędkość od poprzedniego punktu > MAX_SPEED_KMH.
 *
 * @returns `true` gdy punkt NALEŻY odrzucić
 */
export function filterOutlier(
  prev: Pick<GpsPoint, 'lat' | 'lng' | 'recordedAt'>,
  current: Pick<GpsPoint, 'lat' | 'lng' | 'recordedAt'>,
): boolean {
  const timeDeltaMs = current.recordedAt - prev.recordedAt;

  // Punkty jednoczesne lub ujemna delta — nie można obliczyć prędkości, przepuść
  if (timeDeltaMs <= 0) return false;

  const distanceM = haversineDistance(prev, current);
  const speedKmh = (distanceM / timeDeltaMs) * 3_600_000; // ms → h

  return speedKmh > MAX_SPEED_KMH;
}

/**
 * Oblicza łączny dystans (metry) dla uporządkowanej tablicy punktów GPS.
 * Automatycznie pomija outliery — nie wlicza skoków GPS do sumy.
 */
export function cumulativeDistance(points: ReadonlyArray<GpsPoint>): number {
  if (points.length < 2) return 0;

  let total = 0;
  let prev = points[0]!;

  for (let i = 1; i < points.length; i++) {
    const current = points[i]!;
    if (!filterOutlier(prev, current)) {
      total += haversineDistance(prev, current);
    }
    // Aktualizuj prev nawet jeśli odrzucono — następny punkt liczymy od last valid
    prev = current;
  }

  return total;
}

/**
 * Oblicza chwilową prędkość między dwoma punktami GPS (km/h).
 * Zwraca `null` gdy delta czasu wynosi 0 lub punkty są identyczne.
 */
export function instantSpeedKmh(
  prev: Pick<GpsPoint, 'lat' | 'lng' | 'recordedAt'>,
  current: Pick<GpsPoint, 'lat' | 'lng' | 'recordedAt'>,
): number | null {
  const timeDeltaMs = current.recordedAt - prev.recordedAt;
  if (timeDeltaMs <= 0) return null;

  const distanceM = haversineDistance(prev, current);
  return (distanceM / timeDeltaMs) * 3_600_000;
}
