-- =============================================================================
-- AdRide: Skrypt benchmarkowy — wydajność zapytań na gps_points
-- Uruchamiać po załadowaniu danych produkcyjnych lub większego seeda (>1M wierszy)
-- Cel: SELECT na gps_points dla 1 kierowcy w ostatnich 7 dniach < 100ms przy 30M wierszy
-- =============================================================================

-- Ustaw parametry środowiskowe
\set driver_id 'd0000006-0000-0000-0000-000000000006'
\set campaign_id 'c0000001-0000-0000-0000-000000000001'

-- Włącz śledzenie czasu wykonania
\timing on

-- =============================================================================
-- BENCHMARK 1: Podstawowe zapytanie kierowcy (główny przypadek użycia / RLS)
-- Oczekiwany plan: Partition Pruning + Index Scan na idx_gps_points_driver_recorded
-- Cel: < 100ms przy 30M wierszy
-- =============================================================================

\echo '=== BENCHMARK 1: Punkty GPS kierowcy z ostatnich 7 dni ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
  id,
  session_id,
  location::geometry AS geom,
  speed_kmh,
  recorded_at
FROM gps_points
WHERE driver_id   = :'driver_id'
  AND recorded_at >= now() - INTERVAL '7 days'
ORDER BY recorded_at DESC
LIMIT 10000;

-- =============================================================================
-- BENCHMARK 2: Agregacja odległości sesji (używana przez compute_session_stats)
-- Oczekiwany plan: Bitmap Heap Scan na idx_gps_points_session_id
-- =============================================================================

\echo '=== BENCHMARK 2: Statystyki sesji GPS (session_id lookup) ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
  session_id,
  COUNT(*)                                    AS total_points,
  AVG(speed_kmh)                              AS avg_speed,
  ST_Length(
    ST_MakeLine(location::geometry ORDER BY recorded_at)::geography
  )::INT                                      AS distance_m
FROM gps_points
WHERE session_id = (
  SELECT id FROM gps_sessions
  WHERE driver_id = :'driver_id'
  ORDER BY started_at DESC
  LIMIT 1
)
GROUP BY session_id;

-- =============================================================================
-- BENCHMARK 3: Zapytanie kampanii — ile km w bieżącym miesiącu
-- Oczekiwany plan: Partition Pruning (bieżący miesiąc) + idx_gps_points_campaign_recorded
-- =============================================================================

\echo '=== BENCHMARK 3: Km kampanii w bieżącym miesiącu ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
  campaign_id,
  COUNT(DISTINCT driver_id)          AS unique_drivers,
  COUNT(*)                           AS total_points,
  -- Przybliżony dystans w km (bez pełnego ST_MakeLine dla wydajności)
  SUM(speed_kmh * 12.0 / 3600.0)    AS approx_km
FROM gps_points
WHERE campaign_id   = :'campaign_id'
  AND recorded_at  >= date_trunc('month', now())
  AND recorded_at   < date_trunc('month', now()) + INTERVAL '1 month'
GROUP BY campaign_id;

-- =============================================================================
-- BENCHMARK 4: Zapytanie przestrzenne — punkty w promieniu 2km od centrum Warszawy
-- Oczekiwany plan: GiST Index Scan na idx_gps_points_location_gist
-- =============================================================================

\echo '=== BENCHMARK 4: Zapytanie przestrzenne ST_DWithin (promień 2km) ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
  driver_id,
  COUNT(*) AS points_in_radius
FROM gps_points
WHERE ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(21.0122, 52.2297), 4326)::geography,
    2000  -- 2000 metrów = 2km
  )
  AND recorded_at >= now() - INTERVAL '7 days'
GROUP BY driver_id
ORDER BY points_in_radius DESC;

-- =============================================================================
-- BENCHMARK 5: BRIN index effectiveness — zakres tygodniowy
-- Sprawdza czy BRIN poprawnie eliminuje bloki danych
-- =============================================================================

\echo '=== BENCHMARK 5: BRIN index — tygodniowy range scan ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
  date_trunc('hour', recorded_at) AS hour_bucket,
  COUNT(*)                        AS point_count
FROM gps_points
WHERE recorded_at BETWEEN now() - INTERVAL '7 days' AND now()
GROUP BY hour_bucket
ORDER BY hour_bucket;

-- =============================================================================
-- BENCHMARK 6: Widok zmaterializowany vs tabela bazowa
-- =============================================================================

\echo '=== BENCHMARK 6: Materialized View vs live aggregate ==='

-- 6a: Z widoku zmaterializowanego (powinno być bardzo szybkie)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM mv_driver_monthly_stats
WHERE driver_id  = :'driver_id'
ORDER BY year_month DESC
LIMIT 12;

-- 6b: Zapytanie live (dla porównania)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
  date_trunc('month', gs.started_at)::DATE AS year_month,
  SUM(gs.total_distance_m) / 1000.0        AS total_km,
  COUNT(DISTINCT gs.id)                    AS total_sessions
FROM gps_sessions gs
WHERE gs.driver_id = :'driver_id'
GROUP BY 1
ORDER BY 1 DESC;

-- =============================================================================
-- BENCHMARK 7: Partition pruning — czy PostgreSQL eliminuje zbędne partycje
-- =============================================================================

\echo '=== BENCHMARK 7: Partition pruning — weryfikacja ==='
EXPLAIN (ANALYZE, FORMAT TEXT)
SELECT COUNT(*)
FROM gps_points
WHERE recorded_at >= '2026-05-01'
  AND recorded_at  < '2026-06-01';

-- =============================================================================
-- Statystyki tabel i indeksów
-- =============================================================================

\echo '=== STATYSTYKI: Rozmiar tabel i indeksów ==='

SELECT
  relname                              AS "tabela/indeks",
  pg_size_pretty(pg_relation_size(oid)) AS "rozmiar",
  pg_size_pretty(pg_total_relation_size(oid)) AS "łącznie z indeksami"
FROM pg_class
WHERE relname LIKE 'gps_points%'
   OR relname LIKE 'idx_gps_points%'
ORDER BY pg_total_relation_size(oid) DESC;

\echo '=== STATYSTYKI: Wykorzystanie indeksów gps_points ==='
SELECT
  indexrelname  AS "indeks",
  idx_scan      AS "skanowania",
  idx_tup_read  AS "odczytane krotki",
  idx_tup_fetch AS "pobrane krotki"
FROM pg_stat_user_indexes
WHERE relname LIKE 'gps_points%'
ORDER BY idx_scan DESC;

\timing off
