// =============================================================================
// AdRide Campaign Map — konwersja Supabase → GeoJSON
// =============================================================================

import { toZonedTime } from 'date-fns-tz';
import { simplifyRoute } from './simplify';
import { routeAgeNormalized } from './colorScale';
import type {
  SessionRoute,
  RouteFeature,
  RouteFeatureCollection,
  VehicleMarker,
} from '../types';
import type { Feature, FeatureCollection, Point } from 'geojson';

const WAW_TZ = 'Europe/Warsaw';
const MAX_ROUTE_POINTS = 300;

/**
 * Konwertuje SessionRoute z Supabase na GeoJSON Feature z RouteProperties.
 * Upraszcza trasę do MAX_ROUTE_POINTS punktów algorytmem Douglas-Peucker.
 * Zwraca null jeśli brak route_geom.
 */
export function sessionToFeature(session: SessionRoute): RouteFeature | null {
  if (!session.route_geom || session.route_geom.coordinates.length < 2) {
    return null;
  }

  const coords = simplifyRoute(
    session.route_geom.coordinates as [number, number][],
    MAX_ROUTE_POINTS,
  );

  const startedAtWaw = toZonedTime(new Date(session.started_at), WAW_TZ);
  const startHourWaw = startedAtWaw.getHours();

  return {
    type: 'Feature',
    id: session.id,
    geometry: {
      type: 'LineString',
      coordinates: coords,
    },
    properties: {
      sessionId: session.id,
      vehicleId: session.vehicle_id,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      totalDistanceM: session.total_distance_m ?? 0,
      avgSpeedKmh: session.avg_speed_kmh,
      registrationMasked: session.vehicles?.registration_plate_masked ?? '',
      routeAgeNormalized: routeAgeNormalized(session.started_at),
      startHourWaw,
    },
  };
}

/**
 * Konwertuje tablicę SessionRoute na FeatureCollection.
 * Pomija sesje bez geometrii trasy.
 */
export function sessionsToFeatureCollection(
  sessions: SessionRoute[],
): RouteFeatureCollection {
  const features: RouteFeature[] = [];
  for (const session of sessions) {
    const feature = sessionToFeature(session);
    if (feature) features.push(feature);
  }
  return { type: 'FeatureCollection', features };
}

/**
 * Konwertuje tablicę punktów GPS (lng, lat) na FeatureCollection dla heatmapy.
 * Każdy punkt to Feature<Point> z wagą (weight = 1 dla uproszczenia).
 */
export function pointsToHeatmapFeatures(
  points: [number, number][],
): FeatureCollection<Point, { weight: number }> {
  return {
    type: 'FeatureCollection',
    features: points.map(([lng, lat]) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: { weight: 1 },
    })),
  };
}

/**
 * Wyodrębnia wszystkie punkty ze FeatureCollection tras do heatmapy.
 * Bierze max co N-ty punkt żeby nie przeciążać heatmapy przy dużych zbiorach.
 */
export function routesToHeatmapFeatures(
  fc: RouteFeatureCollection,
  sampleEvery = 5,
): FeatureCollection<Point, { weight: number }> {
  const points: [number, number][] = [];
  for (const feature of fc.features) {
    feature.geometry.coordinates.forEach((coord, i) => {
      if (i % sampleEvery === 0) points.push(coord as [number, number]);
    });
  }
  return pointsToHeatmapFeatures(points);
}

/**
 * Konwertuje VehicleMarker na GeoJSON Feature<Point>.
 * Używane do warstwy markerów live pojazdów.
 */
export function vehicleToGeoJsonFeature(
  marker: VehicleMarker,
): Feature<Point, VehicleMarker> {
  return {
    type: 'Feature',
    id: marker.vehicleId,
    geometry: {
      type: 'Point',
      coordinates: [marker.lng, marker.lat],
    },
    properties: { ...marker },
  };
}

/**
 * Konwertuje Map<string, VehicleMarker> na FeatureCollection dla source Mapboxa.
 */
export function liveVehiclesToFeatureCollection(
  vehicles: Map<string, VehicleMarker>,
): FeatureCollection<Point, VehicleMarker> {
  return {
    type: 'FeatureCollection',
    features: Array.from(vehicles.values()).map(vehicleToGeoJsonFeature),
  };
}
