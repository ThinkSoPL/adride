// Konfiguracja Jest dla projektu Expo + TypeScript
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'src/modules/gps-tracking/**/*.{ts,tsx}',
    '!src/modules/gps-tracking/**/*.d.ts',
    '!src/modules/gps-tracking/**/index.ts',
  ],
  // Mocki dla modułów natywnych Expo (nie są dostępne w środowisku Node)
  moduleNameMapper: {
    'expo-location': '<rootDir>/src/modules/gps-tracking/__tests__/__mocks__/expo-location.ts',
    'expo-task-manager': '<rootDir>/src/modules/gps-tracking/__tests__/__mocks__/expo-task-manager.ts',
    'expo-sqlite': '<rootDir>/src/modules/gps-tracking/__tests__/__mocks__/expo-sqlite.ts',
    'expo-secure-store': '<rootDir>/src/modules/gps-tracking/__tests__/__mocks__/expo-secure-store.ts',
    'expo-battery': '<rootDir>/src/modules/gps-tracking/__tests__/__mocks__/expo-battery.ts',
    '@react-native-community/netinfo': '<rootDir>/src/modules/gps-tracking/__tests__/__mocks__/netinfo.ts',
  },
};
