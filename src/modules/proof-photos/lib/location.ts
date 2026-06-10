import * as Location from 'expo-location';
import type { LocationMetadata } from '../types';

export async function getCurrentLocationForProof(): Promise<LocationMetadata> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { latitude: null, longitude: null, accuracyMeters: null };
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracyMeters: Math.round(loc.coords.accuracy ?? 0),
    };
  } catch {
    return { latitude: null, longitude: null, accuracyMeters: null };
  }
}
