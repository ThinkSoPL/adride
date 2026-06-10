// =============================================================================
// Testy jednostkowe — haversine.ts
// =============================================================================

import {
  haversineDistance,
  filterOutlier,
  cumulativeDistance,
  instantSpeedKmh,
} from '../haversine';
import type { GpsPoint } from '../types';

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Tworzy minimalny GpsPoint do testów */
function pt(lat: number, lng: number, recordedAt = 0): GpsPoint {
  return {
    sessionId: 'test-session',
    lat,
    lng,
    recordedAt,
    speedKmh: null,
    accuracyM: null,
    heading: null,
    batteryLevel: null,
  };
}

// =============================================================================
// haversineDistance
// =============================================================================

describe('haversineDistance', () => {
  test('identyczne punkty → 0 metrów', () => {
    const p = pt(52.2297, 21.0122);
    expect(haversineDistance(p, p)).toBe(0);
  });

  test('biegun północny vs południowy → ~20 015 km (antypody)', () => {
    // Odległość wzdłuż południka = połowa obwodu Ziemi
    const polnocny = pt(90, 0);
    const poludniowy = pt(-90, 0);
    const dist = haversineDistance(polnocny, poludniowy);
    // Dokładna wartość: π × R ≈ 20 015 087 m; tolerancja ±5km
    expect(dist).toBeGreaterThan(20_010_000);
    expect(dist).toBeLessThan(20_020_000);
  });

  test('krótki dystans ~10m (centrum Warszawy)', () => {
    const p1 = pt(52.229700, 21.012200);
    // ~9m na północ (1° ≈ 111km → 0.00009° ≈ 10m)
    const p2 = pt(52.229781, 21.012200);
    const dist = haversineDistance(p1, p2);
    expect(dist).toBeGreaterThan(7);
    expect(dist).toBeLessThan(13);
  });

  test('Warszawa → Kraków: ~251km', () => {
    const warszawa = pt(52.2297, 21.0122);
    const krakow = pt(50.0647, 19.9450);
    const dist = haversineDistance(warszawa, krakow);
    expect(dist).toBeGreaterThan(248_000);
    expect(dist).toBeLessThan(254_000);
  });

  test('Warszawa → Berlin: ~520km', () => {
    const warszawa = pt(52.2297, 21.0122);
    const berlin = pt(52.5200, 13.4050);
    const dist = haversineDistance(warszawa, berlin);
    expect(dist).toBeGreaterThan(515_000);
    expect(dist).toBeLessThan(525_000);
  });

  test('symetria: d(A, B) === d(B, A)', () => {
    const p1 = pt(52.2297, 21.0122);
    const p2 = pt(54.3520, 18.6466); // Gdańsk
    expect(haversineDistance(p1, p2)).toBeCloseTo(haversineDistance(p2, p1), 3);
  });

  test('punkt na równiku — poprawna obsługa cos(0) = 1', () => {
    const p1 = pt(0, 0);
    const p2 = pt(0, 1); // 1° długości na równiku ≈ 111.3km
    const dist = haversineDistance(p1, p2);
    expect(dist).toBeGreaterThan(111_000);
    expect(dist).toBeLessThan(112_000);
  });
});

// =============================================================================
// filterOutlier
// =============================================================================

describe('filterOutlier', () => {
  test('skok 50km w 1 sekundę → outlier (odrzuć)', () => {
    // ~50km ≈ 0.45° szerokości; czas delta 1000ms → ~180 000 km/h
    const prev = pt(52.2297, 21.0122, 1_000);
    const current = pt(52.6800, 21.0122, 2_000);
    expect(filterOutlier(prev, current)).toBe(true);
  });

  test('normalna jazda 50 km/h → przepuść', () => {
    // 50 km/h = ~13.9 m/s; w 5s przejedzie ~69m
    // ~69m ≈ 0.00062° szerokości
    const prev = pt(52.229700, 21.012200, 0);
    const current = pt(52.230324, 21.012200, 5_000);
    expect(filterOutlier(prev, current)).toBe(false);
  });

  test('postój — identyczne współrzędne → przepuść', () => {
    const prev = pt(52.2297, 21.0122, 0);
    const current = pt(52.2297, 21.0122, 10_000);
    expect(filterOutlier(prev, current)).toBe(false);
  });

  test('delta czasu = 0 → przepuść (nie dziel przez zero)', () => {
    // Ten sam timestamp ale inne współrzędne (np. duplikat z błędem)
    const prev = pt(52.2297, 21.0122, 5_000);
    const current = pt(52.9000, 21.0122, 5_000);
    expect(filterOutlier(prev, current)).toBe(false);
  });

  test('delta czasu ujemna → przepuść (zegar cofnięty)', () => {
    const prev = pt(52.2297, 21.0122, 10_000);
    const current = pt(52.9000, 21.0122, 9_000);
    expect(filterOutlier(prev, current)).toBe(false);
  });

  test('prędkość 199 km/h → przepuść (poniżej progu 200)', () => {
    // 199 km/h = ~55.3 m/s; w 10s przejedzie ~553m ≈ 0.00497° szerokości
    const prev = pt(52.229700, 21.012200, 0);
    const current = pt(52.234672, 21.012200, 10_000);
    expect(filterOutlier(prev, current)).toBe(false);
  });

  test('skok GPS do Oslo w 1s → outlier', () => {
    const prev = pt(52.2297, 21.0122, 0);
    const oslo = pt(59.9139, 10.7522, 1_000); // ~1200km w 1s
    expect(filterOutlier(prev, oslo)).toBe(true);
  });
});

// =============================================================================
// cumulativeDistance
// =============================================================================

describe('cumulativeDistance', () => {
  test('pusta tablica → 0', () => {
    expect(cumulativeDistance([])).toBe(0);
  });

  test('jeden punkt → 0', () => {
    expect(cumulativeDistance([pt(52.2297, 21.0122)])).toBe(0);
  });

  test('dwa punkty ~100m → ~100m', () => {
    const points = [
      pt(52.229700, 21.012200, 0),
      pt(52.230602, 21.012200, 10_000), // ~100m na północ
    ];
    const dist = cumulativeDistance(points);
    expect(dist).toBeGreaterThan(90);
    expect(dist).toBeLessThan(110);
  });

  test('trasa ~1km — 11 punktów co ~100m', () => {
    // Prosta trasa na wschód: 0.00134° ≈ 100m na szerokości 52°N
    const points: GpsPoint[] = Array.from({ length: 11 }, (_, i) =>
      pt(52.2297, 21.0122 + i * 0.00134, i * 8_000),
    );
    const dist = cumulativeDistance(points);
    expect(dist).toBeGreaterThan(900);
    expect(dist).toBeLessThan(1_100);
  });

  test('outlier w środku trasy — nie wliczony do sumy', () => {
    const points: GpsPoint[] = [
      pt(52.229700, 21.012200, 0),
      pt(52.230602, 21.012200, 10_000), // ~100m — ok
      pt(59.913900, 10.752200, 11_000), // skok Oslo w 1s — OUTLIER
      pt(52.231504, 21.012200, 20_000), // ~200m od startu — ok
    ];
    const dist = cumulativeDistance(points);
    // Oczekiwany dystans: ~100m + ~100m = ~200m (bez Oslo)
    expect(dist).toBeLessThan(300);
    expect(dist).toBeGreaterThan(150);
  });

  test('wszystkie punkty identyczne → 0', () => {
    const points = [
      pt(52.2297, 21.0122, 0),
      pt(52.2297, 21.0122, 10_000),
      pt(52.2297, 21.0122, 20_000),
    ];
    expect(cumulativeDistance(points)).toBe(0);
  });
});

// =============================================================================
// instantSpeedKmh
// =============================================================================

describe('instantSpeedKmh', () => {
  test('delta czasu = 0 → null', () => {
    const p = pt(52.2297, 21.0122, 1_000);
    expect(instantSpeedKmh(p, p)).toBeNull();
  });

  test('~50 km/h dla 69m w 5s', () => {
    const prev = pt(52.229700, 21.012200, 0);
    const current = pt(52.230324, 21.012200, 5_000);
    const speed = instantSpeedKmh(prev, current);
    expect(speed).not.toBeNull();
    expect(speed!).toBeGreaterThan(45);
    expect(speed!).toBeLessThan(55);
  });
});
