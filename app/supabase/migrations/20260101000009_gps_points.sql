-- =============================================================================
-- AdRide: Tabela punktów GPS — partycjonowana miesięcznie (declarative)
-- =============================================================================
-- Skala: ~10k punktów/kierowca/dzień; 100 kierowców = ~30M punktów/miesiąc
-- Strategia: RANGE partition po recorded_at; BRIN index na czas; GIST na lokalizację
-- =============================================================================

CREATE TABLE gps_points (
  id            BIGSERIAL,
  session_id    UUID                    NOT NULL REFERENCES gps_sessions(id) ON DELETE CASCADE,
  driver_id     UUID                    NOT NULL REFERENCES drivers(id)      ON DELETE CASCADE,
  campaign_id   UUID                             REFERENCES campaigns(id)    ON DELETE SET NULL,
  location      GEOGRAPHY(Point, 4326)  NOT NULL,
  speed_kmh     NUMERIC(5,2),
  accuracy_m    NUMERIC(6,2),
  heading       NUMERIC(5,2),
  battery_level NUMERIC(3,2),
  recorded_at   TIMESTAMPTZ             NOT NULL,
  created_at    TIMESTAMPTZ             NOT NULL DEFAULT now(),

  PRIMARY KEY (id, recorded_at),

  CONSTRAINT gps_points_speed_check    CHECK (speed_kmh     IS NULL OR speed_kmh     >= 0),
  CONSTRAINT gps_points_accuracy_check CHECK (accuracy_m    IS NULL OR accuracy_m    >= 0),
  CONSTRAINT gps_points_heading_check  CHECK (heading       IS NULL OR (heading >= 0 AND heading < 360)),
  CONSTRAINT gps_points_battery_check  CHECK (battery_level IS NULL OR (battery_level >= 0 AND battery_level <= 1))

) PARTITION BY RANGE (recorded_at);

COMMENT ON TABLE gps_points IS 'Punkty GPS kierowców — partycjonowane miesięcznie; ~30M wierszy/miesiąc przy 100 kierowcach';
COMMENT ON COLUMN gps_points.id            IS 'Auto-inkrementowany identyfikator (BIGSERIAL, globalny między partycjami)';
COMMENT ON COLUMN gps_points.session_id    IS 'FK do sesji GPS';
COMMENT ON COLUMN gps_points.driver_id     IS 'Denormalizacja driver_id — umożliwia wydajne RLS bez JOIN z gps_sessions';
COMMENT ON COLUMN gps_points.campaign_id   IS 'Denormalizacja campaign_id — dla wydajnych raportów kampanii';
COMMENT ON COLUMN gps_points.location      IS 'Pozycja geograficzna jako GEOGRAPHY(Point) — dokładne obliczenia odległości w metrach';
COMMENT ON COLUMN gps_points.speed_kmh     IS 'Prędkość z GPS/telefonu w km/h';
COMMENT ON COLUMN gps_points.accuracy_m    IS 'Dokładność pomiaru GPS w metrach (niższe = lepsze)';
COMMENT ON COLUMN gps_points.heading       IS 'Kierunek jazdy w stopniach dziesiętnych (0-359.99)';
COMMENT ON COLUMN gps_points.battery_level IS 'Poziom baterii urządzenia (0.00 = rozładowana, 1.00 = pełna)';
COMMENT ON COLUMN gps_points.recorded_at   IS 'Czas pomiaru GPS z urządzenia — KLUCZ PARTYCJONOWANIA';
COMMENT ON COLUMN gps_points.created_at    IS 'Czas zapisu punktu do bazy danych';

-- =============================================================================
-- Partycje miesięczne na rok 2026
-- =============================================================================

CREATE TABLE gps_points_2026_01 PARTITION OF gps_points
  FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2026-02-01 00:00:00+00');
COMMENT ON TABLE gps_points_2026_01 IS 'Partycja GPS: styczeń 2026';

CREATE TABLE gps_points_2026_02 PARTITION OF gps_points
  FOR VALUES FROM ('2026-02-01 00:00:00+00') TO ('2026-03-01 00:00:00+00');
COMMENT ON TABLE gps_points_2026_02 IS 'Partycja GPS: luty 2026';

CREATE TABLE gps_points_2026_03 PARTITION OF gps_points
  FOR VALUES FROM ('2026-03-01 00:00:00+00') TO ('2026-04-01 00:00:00+00');
COMMENT ON TABLE gps_points_2026_03 IS 'Partycja GPS: marzec 2026';

CREATE TABLE gps_points_2026_04 PARTITION OF gps_points
  FOR VALUES FROM ('2026-04-01 00:00:00+00') TO ('2026-05-01 00:00:00+00');
COMMENT ON TABLE gps_points_2026_04 IS 'Partycja GPS: kwiecień 2026';

CREATE TABLE gps_points_2026_05 PARTITION OF gps_points
  FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');
COMMENT ON TABLE gps_points_2026_05 IS 'Partycja GPS: maj 2026';

CREATE TABLE gps_points_2026_06 PARTITION OF gps_points
  FOR VALUES FROM ('2026-06-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');
COMMENT ON TABLE gps_points_2026_06 IS 'Partycja GPS: czerwiec 2026';

CREATE TABLE gps_points_2026_07 PARTITION OF gps_points
  FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');
COMMENT ON TABLE gps_points_2026_07 IS 'Partycja GPS: lipiec 2026';

CREATE TABLE gps_points_2026_08 PARTITION OF gps_points
  FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');
COMMENT ON TABLE gps_points_2026_08 IS 'Partycja GPS: sierpień 2026';

CREATE TABLE gps_points_2026_09 PARTITION OF gps_points
  FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');
COMMENT ON TABLE gps_points_2026_09 IS 'Partycja GPS: wrzesień 2026';

CREATE TABLE gps_points_2026_10 PARTITION OF gps_points
  FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');
COMMENT ON TABLE gps_points_2026_10 IS 'Partycja GPS: październik 2026';

CREATE TABLE gps_points_2026_11 PARTITION OF gps_points
  FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');
COMMENT ON TABLE gps_points_2026_11 IS 'Partycja GPS: listopad 2026';

CREATE TABLE gps_points_2026_12 PARTITION OF gps_points
  FOR VALUES FROM ('2026-12-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');
COMMENT ON TABLE gps_points_2026_12 IS 'Partycja GPS: grudzień 2026';

-- Partycja domyślna — dla danych poza zdefiniowanymi zakresami (failsafe)
CREATE TABLE gps_points_default PARTITION OF gps_points DEFAULT;
COMMENT ON TABLE gps_points_default IS 'Partycja domyślna GPS — dane poza zdefiniowanymi zakresami miesięcznymi';

-- =============================================================================
-- Funkcja dynamicznego tworzenia miesięcznych partycji
-- Wywoływana przez pg_cron 1-go każdego miesiąca na 2 miesiące do przodu
-- =============================================================================
CREATE OR REPLACE FUNCTION create_monthly_partition(target_month DATE)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_partition_name TEXT;
  v_start_date     DATE;
  v_end_date       DATE;
BEGIN
  v_start_date     := date_trunc('month', target_month)::DATE;
  v_end_date       := (v_start_date + INTERVAL '1 month')::DATE;
  v_partition_name := 'gps_points_' || to_char(v_start_date, 'YYYY_MM');

  IF NOT EXISTS (
    SELECT 1
    FROM   pg_class     c
    JOIN   pg_namespace n ON n.oid = c.relnamespace
    WHERE  c.relname = v_partition_name
      AND  n.nspname = 'public'
  ) THEN
    EXECUTE format(
      'CREATE TABLE %I PARTITION OF gps_points FOR VALUES FROM (%L::timestamptz) TO (%L::timestamptz)',
      v_partition_name,
      v_start_date::timestamptz,
      v_end_date::timestamptz
    );

    EXECUTE format(
      'COMMENT ON TABLE %I IS %L',
      v_partition_name,
      'Partycja GPS: ' || to_char(v_start_date, 'Month YYYY') || ' (tworzona automatycznie przez pg_cron)'
    );

    RAISE NOTICE 'Utworzono partycję gps_points: %', v_partition_name;
  ELSE
    RAISE NOTICE 'Partycja % już istnieje — pomijam.', v_partition_name;
  END IF;
END;
$$;

COMMENT ON FUNCTION create_monthly_partition(DATE) IS
  'Tworzy miesięczną partycję gps_points jeśli nie istnieje. '
  'Wywoływana przez pg_cron: 1-go każdego miesiąca, tworzy partycję na 2 miesiące do przodu.';

-- =============================================================================
-- Harmonogram pg_cron: twórz kolejną partycję 1-go każdego miesiąca o 00:05
-- =============================================================================
SELECT cron.schedule(
  'adride-create-gps-partition',
  '5 0 1 * *',
  $cron$
    SELECT create_monthly_partition(
      (date_trunc('month', now()) + INTERVAL '2 months')::DATE
    );
  $cron$
);
