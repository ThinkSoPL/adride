/**
 * Background Location Task
 * Registers with expo-task-manager to poll location in background
 * CRITICAL: This module must be imported before any rendering (App.tsx line 3)
 */

import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import * as Battery from 'expo-battery';

import { initDb, insertPoint } from './lib/sqlite-buffer';
import {
  isAccuracyAcceptable,
  isOutlier,
  locationToGpsPoint,
  getNextInterval,
} from './lib/location-processor';
import { GpsPoint } from './types';

const TASK_NAME = 'gps-tracking-background';
const SESSION_STORAGE_KEY = 'gps_session_state';
const LAST_LOCATION_STORAGE_KEY = 'gps_last_location';

let lastPoint: GpsPoint | null = null;
let taskStarted = false;

/**
 * Register background location task
 * Called at module import time (side-effect in index.ts)
 */
export async function defineBackgroundLocationTask(): Promise<void> {
  if (taskStarted) return;
  taskStarted = true;

  try {
    // Initialize SQLite buffer
    await initDb();

    // Define task handler
    TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
      if (error) {
        console.error('[gps-background] Task error:', error);
        return;
      }

      if (!data || !data.locations || data.locations.length === 0) {
        return;
      }

      try {
        // Check if session is active
        const sessionJson = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
        if (!sessionJson) {
          // No active session, stop task
          await stopBackgroundTracking();
          return;
        }

        const session = JSON.parse(sessionJson);
        if (session.status !== 'active') {
          return; // Session paused, skip processing
        }

        // Get battery level
        const batteryLevel = await Battery.getBatteryLevelAsync();
        const batteryPercent = Math.round(batteryLevel * 100);

        // Restore last location
        const lastLocationJson = await SecureStore.getItemAsync(LAST_LOCATION_STORAGE_KEY);
        if (lastLocationJson) {
          lastPoint = JSON.parse(lastLocationJson);
        }

        // Process locations
        const locations = data.locations as any[];
        for (const location of locations) {
          // Filter by accuracy
          if (!isAccuracyAcceptable(location.coords.accuracy)) {
            continue;
          }

          // Convert to GpsPoint
          const point = locationToGpsPoint(
            {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy,
              speed: location.coords.speed || 0,
              heading: location.coords.heading || 0,
              timestamp: location.timestamp,
            },
            batteryPercent,
          );

          // Filter outliers
          if (isOutlier(lastPoint, point)) {
            console.warn('[gps-background] Outlier detected, skipping point');
            continue;
          }

          // Store in buffer
          await insertPoint(session.id, point);
          lastPoint = point;

          // Save last location for next batch
          await SecureStore.setItemAsync(LAST_LOCATION_STORAGE_KEY, JSON.stringify(point));
        }

        // Update next interval
        const nextInterval = getNextInterval(lastPoint ? [lastPoint] : []);
        await Location.setLocationChangeSubscriptionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: nextInterval,
          distanceInterval: 0,
        });
      } catch (err) {
        console.error('[gps-background] Processing error:', err);
      }
    });

    console.log('[gps] Background task registered');
  } catch (error) {
    console.error('[gps] Failed to define background task:', error);
  }
}

/**
 * Start background location tracking
 * Called when user clicks "Start" in TrackingCard
 */
export async function startBackgroundTracking(): Promise<void> {
  try {
    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    // Check if task is registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (!isRegistered) {
      throw new Error('Background task not registered');
    }

    // Start tracking
    await Location.startLocationUpdatesAsync(TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000, // Start with 5s
      distanceInterval: 0,
      showsBackgroundLocationIndicator: true,
      pausesUpdatesAutomatically: false, // Continue in background
      foregroundService: {
        notificationTitle: 'AdRide GPS aktywny',
        notificationBody: 'Rejestrowanie trasy...',
        notificationColor: '#FF6B35',
      },
    });

    console.log('[gps] Background tracking started');
  } catch (error) {
    console.error('[gps] Failed to start background tracking:', error);
    throw error;
  }
}

/**
 * Stop background location tracking
 * Called when user clicks "Stop" in TrackingCard
 */
export async function stopBackgroundTracking(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(TASK_NAME);
    }

    // Clear persisted location
    await SecureStore.deleteItemAsync(LAST_LOCATION_STORAGE_KEY);
    lastPoint = null;

    console.log('[gps] Background tracking stopped');
  } catch (error) {
    console.error('[gps] Failed to stop background tracking:', error);
  }
}
