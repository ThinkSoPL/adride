/**
 * Location Processing Utilities
 * Haversine distance, outlier detection, adaptive intervals
 */

import { GpsPoint, LocationData } from '../types';

const EARTH_RADIUS_M = 6371000;
const ACCURACY_THRESHOLD_M = 30;
const OUTLIER_THRESHOLD_M = 1000;
const MOVEMENT_THRESHOLD_M = 50;
const MOVEMENT_WINDOW_MS = 30000;
const IDLE_TIMEOUT_MS = 60000;

/**
 * Calculate distance between two points using Haversine formula
 * @returns distance in meters
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/**
 * Check if a point is an outlier (likely GPS spike)
 */
export function isOutlier(lastPoint: GpsPoint | null, currentPoint: GpsPoint): boolean {
  if (!lastPoint) return false;

  const distance = haversineDistance(
    lastPoint.latitude,
    lastPoint.longitude,
    currentPoint.latitude,
    currentPoint.longitude,
  );

  return distance > OUTLIER_THRESHOLD_M;
}

/**
 * Check if point accuracy is acceptable
 */
export function isAccuracyAcceptable(accuracy: number): boolean {
  return accuracy <= ACCURACY_THRESHOLD_M;
}

/**
 * Get adaptive location update interval (ms)
 * Returns 5000ms if moving, 30000ms if idle
 */
export function getNextInterval(lastPoints: GpsPoint[]): number {
  if (lastPoints.length < 2) return 5000; // Default to active while collecting data

  const now = Date.now();
  const recentPoints = lastPoints.filter((p) => now - p.timestamp < MOVEMENT_WINDOW_MS);

  if (recentPoints.length < 2) return 30000; // Not enough data, assume idle

  // Calculate total movement in window
  let totalMovement = 0;
  for (let i = 1; i < recentPoints.length; i++) {
    totalMovement += haversineDistance(
      recentPoints[i - 1].latitude,
      recentPoints[i - 1].longitude,
      recentPoints[i].latitude,
      recentPoints[i].longitude,
    );
  }

  // If moved more than threshold, stay in active mode (5s)
  return totalMovement > MOVEMENT_THRESHOLD_M ? 5000 : 30000;
}

/**
 * Convert location update to GpsPoint
 */
export function locationToGpsPoint(
  location: LocationData,
  batteryPercent: number,
): GpsPoint {
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    batteryPercent,
    speedKmph: location.speed || 0,
    headingDeg: location.heading || 0,
    timestamp: location.timestamp,
  };
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
