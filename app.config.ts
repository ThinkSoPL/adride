import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'AdRide',
  slug: 'adride-driver',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0A0D12',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'pl.adride.driver',
    infoPlist: {
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'AdRide potrzebuje dostępu do lokalizacji zawsze, aby rejestrować Twoją trasę i naliczać kilometry z reklamą.',
      NSLocationAlwaysUsageDescription:
        'AdRide potrzebuje dostępu do lokalizacji zawsze, aby rejestrować trasę gdy aplikacja działa w tle.',
      NSLocationWhenInUseUsageDescription:
        'AdRide potrzebuje dostępu do lokalizacji podczas używania aplikacji.',
      NSCameraUsageDescription:
        'AdRide potrzebuje dostępu do aparatu, aby wykonać zdjęcie dowodowe pojazdu z reklamą.',
      UIBackgroundModes: ['location', 'fetch'],
    },
  },
  android: {
    package: 'pl.adride.driver',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0A0D12',
    },
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_LOCATION',
      'CAMERA',
    ],
  },
  plugins: [
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'AdRide potrzebuje dostępu do lokalizacji, aby rejestrować Twoją trasę i naliczać kilometry za przejechane kilometry z reklamą.',
        locationAlwaysPermission:
          'AdRide potrzebuje dostępu do lokalizacji zawsze, aby rejestrować trasę gdy aplikacja działa w tle.',
        locationWhenInUsePermission:
          'AdRide potrzebuje dostępu do lokalizacji podczas używania aplikacji.',
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    'expo-task-manager',
    'expo-secure-store',
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default config;
