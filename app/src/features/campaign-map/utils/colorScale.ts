// =============================================================================
// AdRide Campaign Map — skala kolorów tras
// Gradient: świeża trasa (#FF6B35 AdRide orange) → stara (#555555 szary)
// =============================================================================

import { differenceInSeconds } from 'date-fns';
import type { ExpressionSpecification } from 'mapbox-gl';

/** Kolor AdRide — świeże trasy (<1h) */
export const COLOR_FRESH = '#FF6B35';
/** Kolor tras starszych (>7 dni) */
export const COLOR_STALE = '#555555';
/** Kolor hover / zaznaczony */
export const COLOR_HOVER = '#FFAA00';
/** Kolor punktów heatmapy — intensywny */
export const COLOR_HEAT = '#FF6B35';

/** Maksymalny wiek trasy w sekundach, powyżej którego kolor = COLOR_STALE */
const MAX_AGE_SECONDS = 7 * 24 * 3600;

/**
 * Oblicza znormalizowany wiek trasy (0 = świeża, 1 = stara ≥7 dni).
 * Używane jako właściwość `routeAgeNormalized` w GeoJSON feature.
 */
export function routeAgeNormalized(startedAt: string): number {
  const ageSeconds = differenceInSeconds(new Date(), new Date(startedAt));
  return Math.min(1, Math.max(0, ageSeconds / MAX_AGE_SECONDS));
}

/**
 * Interpoluje kolor na podstawie znormalizowanego wieku (0→1).
 * Używane przy renderowaniu CSS / ikony markera.
 */
export function interpolateRouteColor(normalized: number): string {
  const fresh = [0xff, 0x6b, 0x35] as const;
  const stale = [0x55, 0x55, 0x55] as const;
  const r = Math.round(fresh[0] + (stale[0] - fresh[0]) * normalized);
  const g = Math.round(fresh[1] + (stale[1] - fresh[1]) * normalized);
  const b = Math.round(fresh[2] + (stale[2] - fresh[2]) * normalized);
  return `rgb(${r},${g},${b})`;
}

/**
 * Mapbox GL expression do data-driven kolorowania linii tras.
 * Odczytuje `routeAgeNormalized` z properties featurea.
 */
export function routeColorExpression(): ExpressionSpecification {
  return [
    'interpolate',
    ['linear'],
    ['get', 'routeAgeNormalized'],
    0,   COLOR_FRESH,   // świeża — pomarańczowy AdRide
    0.3, '#FF9A35',     // kilka godzin
    0.7, '#AA6633',     // dzień
    1,   COLOR_STALE,   // stara — szary
  ] as ExpressionSpecification;
}

/**
 * Mapbox GL expression do szerokości linii (hover = 5px, normal = 3px).
 * Używa feature-state 'hover' ustawianego przez onMouseMove.
 */
export function routeWidthExpression(): ExpressionSpecification {
  return [
    'case',
    ['boolean', ['feature-state', 'hover'], false],
    5,
    3,
  ] as ExpressionSpecification;
}

/**
 * Mapbox GL expression dla warstwy glow (szeroka, przezroczysta linia pod trasą).
 */
export function routeGlowWidthExpression(): ExpressionSpecification {
  return [
    'case',
    ['boolean', ['feature-state', 'hover'], false],
    14,
    0,
  ] as ExpressionSpecification;
}

/**
 * Mapbox GL expression do opacity linii — filtr po godzinie (TimeSlider).
 * Ukrywa trasy których godzina startu jest poza zakresem.
 *
 * @param from - godzina od (0-24)
 * @param to - godzina do (0-24)
 */
export function routeOpacityByHourExpression(
  from: number,
  to: number,
): ExpressionSpecification {
  return [
    'case',
    [
      'all',
      ['>=', ['get', 'startHourWaw'], from],
      ['<=', ['get', 'startHourWaw'], to],
    ],
    1,
    0.1,
  ] as ExpressionSpecification;
}
