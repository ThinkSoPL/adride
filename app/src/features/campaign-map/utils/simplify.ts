// =============================================================================
// AdRide Campaign Map — upraszczanie tras (Douglas-Peucker)
// Redukuje liczbę punktów przy zachowaniu kształtu trasy
// =============================================================================

type Coord = [number, number]; // [lng, lat]

/**
 * Odległość prostopadła punktu od odcinka linii (w stopniach).
 * Wystarczająca precyzja dla małych odległości na mapach miejskich.
 */
function perpendicularDistance(
  point: Coord,
  lineStart: Coord,
  lineEnd: Coord,
): number {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];

  if (dx === 0 && dy === 0) {
    return Math.hypot(point[0] - lineStart[0], point[1] - lineStart[1]);
  }

  const t =
    ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) /
    (dx * dx + dy * dy);

  const clampedT = Math.max(0, Math.min(1, t));
  const closestX = lineStart[0] + clampedT * dx;
  const closestY = lineStart[1] + clampedT * dy;

  return Math.hypot(point[0] - closestX, point[1] - closestY);
}

/**
 * Rekurencyjny algorytm Douglas-Peucker.
 *
 * @param points - tablica współrzędnych [lng, lat]
 * @param tolerance - tolerancja w stopniach (0.0001 ≈ ~11m na szer. 52°N)
 * @returns uproszczona tablica punktów
 */
export function douglasPeucker(points: Coord[], tolerance: number): Coord[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIndex = 0;
  const last = points.length - 1;

  for (let i = 1; i < last; i++) {
    const dist = perpendicularDistance(points[i]!, points[0]!, points[last]!);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > tolerance) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIndex), tolerance);
    // Połącz bez duplikatu punktu granicznego
    return [...left.slice(0, -1), ...right];
  }

  return [points[0]!, points[last]!];
}

/**
 * Upraszcza trasę do maksymalnie `maxPoints` punktów.
 * Iteracyjnie zwiększa tolerancję aż osiągnie cel.
 *
 * @param coordinates - oryginalne współrzędne LineString
 * @param maxPoints - maksymalna liczba punktów w wyniku
 * @param initialTolerance - startowa tolerancja
 */
export function simplifyRoute(
  coordinates: Coord[],
  maxPoints: number,
  initialTolerance = 0.0001,
): Coord[] {
  if (coordinates.length <= maxPoints) return coordinates;

  let tolerance = initialTolerance;
  let simplified = douglasPeucker(coordinates, tolerance);

  // Podwajaj tolerancję dopóki za dużo punktów (max 10 iteracji)
  for (let i = 0; i < 10 && simplified.length > maxPoints; i++) {
    tolerance *= 2;
    simplified = douglasPeucker(coordinates, tolerance);
  }

  // Zawsze zachowaj pierwszy i ostatni punkt
  if (simplified[0] !== coordinates[0]) {
    simplified.unshift(coordinates[0]!);
  }
  const lastOrig = coordinates[coordinates.length - 1]!;
  const lastSimpl = simplified[simplified.length - 1]!;
  if (lastSimpl[0] !== lastOrig[0] || lastSimpl[1] !== lastOrig[1]) {
    simplified.push(lastOrig);
  }

  return simplified;
}
