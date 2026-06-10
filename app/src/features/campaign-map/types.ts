// =============================================================================
// AdRide Campaign Map — typy publiczne
// =============================================================================

import type { Feature, FeatureCollection, LineString, Point, MultiPolygon } from 'geojson';

// ─── Supabase raw data ────────────────────────────────────────────────────────

/** Pojedynczy punkt GPS z tabeli gps_points */
export interface GpsPointRaw {
  id: number;
  session_id: string;
  driver_id: string;
  campaign_id: string;
  /** GeoJSON Point zwracany przez PostgREST */
  location: { type: 'Point'; coordinates: [number, number] };
  speed_kmh: number | null;
  accuracy_m: number | null;
  heading: number | null;
  battery_level: number | null;
  recorded_at: string;
}

/** Sesja GPS z widokiem trasy — z joinami Supabase */
export interface SessionRoute {
  id: string;
  vehicle_id: string;
  campaign_id: string;
  started_at: string;
  ended_at: string | null;
  total_distance_m: number | null;
  total_points: number;
  avg_speed_kmh: number | null;
  /** GeoJSON LineString zwracany przez PostgREST (może być null jeśli brak punktów) */
  route_geom: LineString | null;
  vehicles: {
    registration_plate_masked: string;
  } | null;
}

/** Pojazd aktywny w kampanii — do selektora filtrów */
export interface CampaignVehicle {
  id: string;
  registration_plate_masked: string;
  driver_id: string;
}

// ─── GeoJSON features ─────────────────────────────────────────────────────────

/** Properties dodawane do każdej trasy w FeatureCollection */
export interface RouteProperties {
  sessionId: string;
  vehicleId: string;
  startedAt: string;
  endedAt: string | null;
  totalDistanceM: number;
  avgSpeedKmh: number | null;
  registrationMasked: string;
  /** Znormalizowany wiek trasy 0 (świeża) → 1 (7 dni) — do gradientu kolorów */
  routeAgeNormalized: number;
  /** Godzina startu w Warszawie (0-23) — do filtra TimeSlider */
  startHourWaw: number;
}

/** Typowana GeoJSON Feature dla trasy */
export type RouteFeature = Feature<LineString, RouteProperties>;

/** Typowana FeatureCollection tras */
export type RouteFeatureCollection = FeatureCollection<LineString, RouteProperties>;

/** Properties dzielnicy Warszawy */
export interface DistrictProperties {
  name: string;
  /** Łączne km ekspozycji w aktywnej kampanii */
  exposureKm: number;
}

export type DistrictFeature = Feature<MultiPolygon, DistrictProperties>;
export type DistrictFeatureCollection = FeatureCollection<MultiPolygon, DistrictProperties>;

// ─── Live vehicles ────────────────────────────────────────────────────────────

/** Pozycja pojazdu w czasie rzeczywistym */
export interface VehicleMarker {
  vehicleId: string;
  sessionId: string;
  registrationMasked: string;
  lat: number;
  lng: number;
  heading: number | null;
  speedKmh: number | null;
  batteryLevel: number | null;
  lastSeen: string;   // ISO timestamp ostatniego punktu
  /** Czy widziano w ostatnich 5 minutach */
  isLive: boolean;
}

/** Szczegóły pojazdu w popupie */
export interface VehicleSummary {
  vehicleId: string;
  sessionId: string;
  registrationMasked: string;
  kmToday: number;
  kmInCampaign: number;
  lastLocation: { lat: number; lng: number };
  lastSeen: string;
  avgSpeedKmh: number | null;
  currentSpeedKmh: number | null;
  batteryLevel: number | null;
}

// ─── Filtry ───────────────────────────────────────────────────────────────────

export interface DateRange {
  from: Date;
  to: Date;
}

export interface LayerVisibility {
  routes: boolean;
  heatmap: boolean;
  live: boolean;
  districts: boolean;
}

/** Kompletny stan filtrów — synchronizowany z URL searchParams */
export interface MapFilters {
  dateRange: DateRange;
  /** Puste = wszystkie pojazdy */
  vehicleIds: string[];
  /** Puste = wszystkie dzielnice */
  districts: string[];
  layerVisibility: LayerVisibility;
  /** Filtr godzinowy [od, do] 0-24 */
  timeOfDay: [number, number];
}

// ─── Styl mapy ────────────────────────────────────────────────────────────────

export type MapStyleId = 'dark' | 'streets';

export const MAP_STYLES: Record<MapStyleId, string> = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  streets: 'mapbox://styles/mapbox/streets-v12',
};

// ─── Props komponentów ────────────────────────────────────────────────────────

export interface CampaignMapClientProps {
  campaignId: string;
  initialRoutes: SessionRoute[];
  vehicles: CampaignVehicle[];
}

export interface CampaignMapServerProps {
  campaignId: string;
}
