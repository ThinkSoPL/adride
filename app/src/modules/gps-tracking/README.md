# AdRide GPS Tracking Module

Moduł rejestracji trasy GPS do aplikacji Expo dla kierowców AdRide.
Offline-first, battery-aware, gotowy na background tracking iOS + Android.

---

## Zależności

```bash
npx expo install \
  expo-location \
  expo-task-manager \
  expo-sqlite \
  expo-secure-store \
  expo-battery \
  expo-device \
  expo-constants \
  @react-native-community/netinfo \
  @supabase/supabase-js
```

---

## Konfiguracja app.json / app.config.ts

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "AdRide potrzebuje dostępu do lokalizacji, aby rejestrować Twoją trasę i naliczać kilometry za przejechane kilometry z reklamą.",
          "locationAlwaysPermission": "AdRide potrzebuje dostępu do lokalizacji zawsze, aby rejestrować trasę gdy aplikacja działa w tle.",
          "locationWhenInUsePermission": "AdRide potrzebuje dostępu do lokalizacji podczas używania aplikacji.",
          "isIosBackgroundLocationEnabled": true,
          "isAndroidBackgroundLocationEnabled": true,
          "isAndroidForegroundServiceEnabled": true
        }
      ],
      "expo-task-manager"
    ],
    "ios": {
      "infoPlist": {
        "NSLocationAlwaysAndWhenInUseUsageDescription": "AdRide potrzebuje dostępu do lokalizacji zawsze, aby rejestrować Twoją trasę i naliczać kilometry nawet gdy aplikacja działa w tle.",
        "NSLocationAlwaysUsageDescription": "AdRide potrzebuje dostępu do lokalizacji zawsze, aby rejestrować trasę w tle.",
        "NSLocationWhenInUseUsageDescription": "AdRide potrzebuje dostępu do lokalizacji podczas używania aplikacji.",
        "UIBackgroundModes": ["location", "fetch"]
      }
    },
    "android": {
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION"
      ]
    }
  }
}
```

> **Android 14+ (API 34):** `FOREGROUND_SERVICE_LOCATION` jest wymagane. Expo SDK 51 obsługuje to przez `expo-location` plugin.

---

## Integracja — App.tsx

```tsx
// KROK 1: Importuj moduł JAKO PIERWSZY w pliku wejściowym
// To rejestruje background task zanim React Native się załaduje
import 'src/modules/gps-tracking';

import React, { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { trackingService, requestPermissions } from 'src/modules/gps-tracking';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function App() {
  useEffect(() => {
    // KROK 2: Inicjalizuj serwis po zalogowaniu użytkownika
    trackingService.initialize(supabase).catch(console.error);
  }, []);

  // ... reszta aplikacji
}
```

---

## Użycie w komponencie

```tsx
import React from 'react';
import { Button, Text, View } from 'react-native';
import {
  useGpsTracking,
  useTrackingStats,
  requestPermissions,
} from 'src/modules/gps-tracking';

export function TrackingScreen() {
  const { isTracking, session, status, error, start, stop, pause } = useGpsTracking();
  const stats = useTrackingStats(session?.id ?? null, session?.startedAt ?? null);

  const handleStart = async () => {
    const perm = await requestPermissions();
    if (!perm.granted) return;

    await start({
      vehicleId: 'e0000001-0000-0000-0000-000000000001',
      campaignId: 'c0000001-0000-0000-0000-000000000001',
    });
  };

  return (
    <View>
      <Text>Status: {status}</Text>
      <Text>Km: {stats.km.toFixed(2)}</Text>
      <Text>Czas: {Math.floor(stats.durationSec / 60)} min</Text>
      <Text>Prędkość: {stats.avgSpeedKmh.toFixed(1)} km/h</Text>
      <Text>Punkty: {stats.pointsCount}</Text>

      {error && <Text style={{ color: 'red' }}>{error.message}</Text>}

      {!isTracking ? (
        <Button title="Rozpocznij trasę" onPress={handleStart} />
      ) : (
        <>
          <Button title="Zakończ trasę" onPress={stop} />
          <Button title="Pauza" onPress={pause} />
        </>
      )}
    </View>
  );
}
```

---

## Nasłuchiwanie na zdarzenia

```tsx
import { useEffect } from 'react';
import { trackingEmitter } from 'src/modules/gps-tracking';

useEffect(() => {
  const unsubs = [
    trackingEmitter.on('LOW_BATTERY_MODE', ({ level }) => {
      showToast(`Niski poziom baterii (${Math.round(level * 100)}%) — tryb oszczędzania`);
    }),
    trackingEmitter.on('NETWORK_RESTORED', ({ pendingPoints }) => {
      showToast(`Sieć przywrócona — synchronizacja ${pendingPoints} punktów`);
    }),
    trackingEmitter.on('AUTH_ERROR', () => {
      navigation.navigate('Login');
    }),
  ];
  return () => unsubs.forEach(fn => fn());
}, []);
```

---

## Przykładowy payload do Supabase

```json
{
  "session_id": "d4f2a1c0-8b3e-4f7d-9e2a-1b0c5d3f8e9a",
  "driver_id": "d0000006-0000-0000-0000-000000000006",
  "campaign_id": "c0000001-0000-0000-0000-000000000001",
  "location": "POINT(21.0122 52.2297)",
  "speed_kmh": 47.3,
  "accuracy_m": 4.8,
  "heading": 182.5,
  "battery_level": 0.72,
  "recorded_at": "2026-05-20T14:30:45.123Z"
}
```

> **Uwaga:** `location` to WKT w formacie `POINT(longitude latitude)` — PostgREST automatycznie konwertuje na `GEOGRAPHY(Point, 4326)`.

---

## Architektura

```
App.tsx
  └── import 'gps-tracking'          ← rejestruje background task
        ↓
  trackingService.initialize(supabase)
        ↓
  startSession({ vehicleId, campaignId })
        ├── SecureStore (persystencja sesji)
        ├── startLocationTask() → expo-location
        │     └── ADRIDE_LOCATION_TASK (background)
        │           └── filterOutlier()
        │           └── gpsBuffer.savePoints() → SQLite
        ├── UploadScheduler (co 60s)
        │     └── triggerUpload() → Supabase batch insert
        └── BatteryMonitor (co 5min)
              └── switchAccuracyMode() → restart task z nowym interwałem
```

---

## Adaptive interval

| Sytuacja | Interwał GPS | Dokładność |
|----------|-------------|------------|
| Normalna jazda (> 5 km/h) | 10s | Balanced |
| Idle / korek (< 5 km/h przez 60s) | 30s | Balanced |
| LOW_POWER (bateria < 15%) | 60s | Low |

---

## Uruchamianie testów

```bash
# Testy jednostkowe (Haversine)
npx jest src/modules/gps-tracking/__tests__/

# TypeScript strict check
npx tsc --noEmit

# Lint
npx eslint src/modules/gps-tracking/
```

---

## Wymagania do `supabase db push`

Moduł zakłada istnienie tabel `gps_sessions` i `gps_points` w Supabase.
Schematy znajdują się w `supabase/migrations/` — uruchom:

```bash
supabase db reset && supabase db push
```

---

## Znane ograniczenia

1. **iOS background time limit** — system może zawiesić task po ~3 min jeśli `significant-location-change` nie jest aktywne. `UIBackgroundModes: ["location"]` przedłuża to bezterminowo na urządzeniach z włączonym GPS.

2. **Android Doze mode** — na Androidzie 6+ przy wyłączonym ekranie system może opóźniać task. Foreground service (notyfikacja) zapobiega temu w większości przypadków. Producenci (Xiaomi, Samsung) mogą agresywniej zarządzać procesami — dodaj do białej listy `Ustawienia → Bateria → Wyjątki`.

3. **Notyfikacja foreground (Android)** — treść notyfikacji aktualizuje się przez restart taska co zmianę trybu baterii. Dla częstszych aktualizacji km w notyfikacji potrzebny natywny moduł.

4. **SQLite vs AsyncStorage** — moduł celowo nie używa AsyncStorage do bufferowania GPS (brak transakcji, wolniejszy zapis, brak możliwości VACUUM).
