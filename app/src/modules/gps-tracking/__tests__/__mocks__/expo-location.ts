// Mock expo-location
export const Accuracy = { Balanced: 3, Low: 1, High: 5, Highest: 6, BestForNavigation: 6 };
export const ActivityType = { AutomotiveNavigation: 2 };
export const PermissionStatus = { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' };
export const requestForegroundPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
export const requestBackgroundPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
export const getForegroundPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
export const getBackgroundPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
export const startLocationUpdatesAsync = jest.fn().mockResolvedValue(undefined);
export const stopLocationUpdatesAsync = jest.fn().mockResolvedValue(undefined);
export const hasStartedLocationUpdatesAsync = jest.fn().mockResolvedValue(false);
