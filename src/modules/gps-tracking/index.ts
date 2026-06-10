/**
 * GPS Tracking Module
 * Side-effect: Registers background location task at module import time
 * CRITICAL: This module must be imported at App.tsx line 3, BEFORE any rendering
 */

import { defineBackgroundLocationTask } from './background-task';

// Side-effect: Register background task exactly once, at module parse time
// This ensures TaskManager.defineTask() is called before App renders
try {
  defineBackgroundLocationTask();
} catch (error) {
  console.error('[gps] Failed to initialize background task:', error);
}

// Exports
export { useGpsTracking } from './hooks/useGpsTracking';
export type { UseGpsTrackingResult, GpsSession, GpsPoint, GpsError } from './types';
