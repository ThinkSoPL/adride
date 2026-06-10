/**
 * GPS Tracking Module Types
 * Matches TrackingCard expectations and Supabase schema
 */

export interface UseGpsTrackingResult {
  isTracking: boolean;
  status: 'idle' | 'active' | 'paused' | 'error';
  session: GpsSession | null;
  error: GpsError | null;
  start: (opts: StartSessionOptions) => Promise<void>;
  stop: () => Promise<void>;
  pause: () => Promise<void>;
}

export interface GpsSession {
  id: string;
  vehicleId: string;
  campaignId: string;
  startedAt: string;
  pausedAt?: string;
  status: 'active' | 'paused';
  pointsCount: number;
}

export interface StartSessionOptions {
  vehicleId: string;
  campaignId: string;
}

export interface GpsPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  batteryPercent: number;
  speedKmph: number;
  headingDeg: number;
  timestamp: number;
}

export interface GpsError {
  code: 'PERMISSION_DENIED' | 'NETWORK_ERROR' | 'UPLOAD_FAILED' | 'TASK_FAILED';
  message: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  timestamp: number;
}

export interface UploadResult {
  success: number;
  failed: string[];
}
