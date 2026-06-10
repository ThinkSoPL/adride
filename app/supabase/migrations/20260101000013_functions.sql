-- =============================================================================
-- AdRide: Funkcje pomocnicze, biznesowe i RLS helpers
-- =============================================================================

-- =============================================================================
-- SEKCJA 1: Tabela referencji dzielnic Warszawy (wymagana przez points_in_district)
-- =============================================================================

CREATE TABLE warsaw_districts (
  id       SERIAL      NOT NULL PRIMARY KEY,
  name     TEXT        NOT NULL UNIQUE,
  geom     GEOMETRY(MultiPolygon, 4326) NOT NULL
);

COMMENT ON TABLE warsaw_districts IS 'Geometrie dzielnic Warszawy — wymagane do funkcji points_in_district(). Należy wypełnić oficjalnymi danymi GIS z warszawa.pl/opendata';
COMMENT ON COLUMN warsaw_districts.name IS 'Oficjalna nazwa dzielnicy (np. Śródmieście, Mokotów, Ursynów)';
COMMENT ON COLUMN warsaw_districts.geom IS 'Wielokąt dzielnicy EPSG:4326 — źródło: BDO/GIS Warszawa';

CREATE INDEX idx_warsaw_districts_geom ON warsaw_districts USING gist (geom);
CREATE INDEX idx_warsaw_districts_name ON warsaw_districts (name);

-- =============================================================================
-- SEKCJA 2: Helper functions dla RLS (schemat auth — zgodne z konwencją Supabase)
-- =============================================================================

-- Sprawdza czy zalogowany użytkownik ma rolę 'admin'
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS 'RLS helper: zwraca TRUE jeśli auth.uid() ma rolę admin. SECURITY DEFINER dla wydajności.';

-- Sprawdza czy zalogowany użytkownik ma rolę 'driver'
CREATE OR REPLACE FUNCTION public.is_driver()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'driver'
  );
$$;

COMMENT ON FUNCTION public.is_driver() IS 'RLS helper: zwraca TRUE jeśli auth.uid() ma rolę driver.';

-- Sprawdza czy zalogowany użytkownik ma rolę 'advertiser'
CREATE OR REPLACE FUNCTION public.is_advertiser()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'advertiser'
  );
$$;

COMMENT ON FUNCTION public.is_advertiser() IS 'RLS helper: zwraca TRUE jeśli auth.uid() ma rolę advertiser.';

-- Sprawdza czy zalogowany reklamodawca jest właścicielem danej kampanii
CREATE OR REPLACE FUNCTION public.advertiser_owns_campaign(p_campaign_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM campaigns
    WHERE id = p_campaign_id AND advertiser_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.advertiser_owns_campaign(UUID) IS 'RLS helper: zwraca TRUE jeśli auth.uid() jest właścicielem kampanii p_campaign_id.';

-- Sprawdza czy zalogowany kierowca jest przypisany do danej kampanii
CREATE OR REPLACE FUNCTION public.driver_in_campaign(p_campaign_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM gps_sessions
    WHERE driver_id   = auth.uid()
      AND campaign_id = p_campaign_id
    LIMIT 1
  );
$$;

COMMENT ON FUNCTION public.driver_in_campaign(UUID) IS 'RLS helper: zwraca TRUE jeśli kierowca (auth.uid()) ma sesje w kampanii p_campaign_id.';

-- =============================================================================
-- SEKCJA 3: Funkcja update_updated_at_column (trigger function)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function: automatycznie ustawia updated_at = now() przed każdym UPDATE.';

-- =============================================================================
-- SEKCJA 4: Generowanie kodu polecenia (trigger function)
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_driver_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_attempts INT := 0;
BEGIN
  -- Generuj tylko jeśli referral_code jest NULL przy INSERT
  IF NEW.referral_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  LOOP
    -- 4 bajty losowe → 8 znaków szesnastkowych uppercase
    v_code := upper(encode(gen_random_bytes(4), 'hex'));

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM drivers WHERE referral_code = v_code
    );

    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'Nie udało się wygenerować unikalnego referral_code po 10 próbach';
    END IF;
  END LOOP;

  NEW.referral_code := v_code;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION generate_driver_referral_code() IS 'Trigger: generuje 8-znakowy kod polecenia (hex uppercase) przed INSERT do drivers jeśli referral_code IS NULL.';

-- =============================================================================
-- SEKCJA 5: Synchronizacja vehicle_ids w campaigns (trigger function)
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_campaign_vehicle_ids()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign_id UUID;
BEGIN
  -- Obsługa INSERT i UPDATE (soft delete przez removed_at)
  v_campaign_id := COALESCE(NEW.campaign_id, OLD.campaign_id);

  UPDATE campaigns
  SET vehicle_ids = (
    SELECT ARRAY_AGG(vehicle_id ORDER BY assigned_at)
    FROM   campaign_vehicles
    WHERE  campaign_id = v_campaign_id
      AND  removed_at IS NULL
  )
  WHERE id = v_campaign_id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION sync_campaign_vehicle_ids() IS 'Trigger: synchronizuje campaigns.vehicle_ids z tabelą campaign_vehicles po każdej zmianie przypisania pojazdu.';

-- =============================================================================
-- SEKCJA 6: Enqueue odświeżania statystyk sesji (trigger function — per statement)
-- =============================================================================

CREATE OR REPLACE FUNCTION enqueue_session_stats_refresh()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Powiadomienie przez NOTIFY — backend (np. worker) subskrybuje kanał
  -- i wywołuje compute_session_stats() dla dotkniętych sesji
  PERFORM pg_notify(
    'refresh_session_stats',
    (
      SELECT jsonb_agg(DISTINCT session_id)::text
      FROM new_table
    )
  );
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION enqueue_session_stats_refresh() IS 'Statement-level trigger: wysyła NOTIFY z listą session_id do odświeżenia po zbiorczym INSERT gps_points.';

-- =============================================================================
-- SEKCJA 7: Audytowanie zmiany statusu kampanii (trigger function)
-- =============================================================================

CREATE OR REPLACE FUNCTION audit_campaign_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO audit_log (actor_id, action, entity_type, entity_id, diff)
    VALUES (
      auth.uid(),           -- NULL dla akcji systemowych/cron
      'status_change',
      'campaign',
      NEW.id::text,
      jsonb_build_object('from', OLD.status::text, 'to', NEW.status::text)
    );
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION audit_campaign_status_change() IS 'Trigger: zapisuje zmianę statusu kampanii do audit_log. actor_id = NULL przy akcjach systemowych.';

-- =============================================================================
-- SEKCJA 8: Funkcje analityczne / geospatial
-- =============================================================================

-- Agreguje trasę sesji (LineString) z punktów GPS
CREATE OR REPLACE FUNCTION aggregate_session_geom(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE gps_sessions
  SET route_geom = (
    SELECT ST_MakeLine(location::geometry ORDER BY recorded_at)
    FROM   gps_points
    WHERE  session_id = p_session_id
      AND  recorded_at >= (SELECT started_at FROM gps_sessions WHERE id = p_session_id)
  )
  WHERE id = p_session_id
    AND total_points > 1;
END;
$$;

COMMENT ON FUNCTION aggregate_session_geom(UUID) IS 'Buduje route_geom (LineString) w gps_sessions z punktów gps_points przez ST_MakeLine(ORDER BY recorded_at).';

-- Oblicza statystyki sesji GPS (dystans, punkty, średnia prędkość)
CREATE OR REPLACE FUNCTION compute_session_stats(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE gps_sessions s
  SET
    total_points     = stats.cnt,
    avg_speed_kmh    = stats.avg_speed,
    total_distance_m = CASE
      WHEN stats.cnt > 1
      THEN ST_Length(ST_MakeLine(stats.loc ORDER BY stats.ts)::geography)::INT
      ELSE 0
    END
  FROM (
    SELECT
      COUNT(*)                           AS cnt,
      AVG(speed_kmh)                     AS avg_speed,
      array_agg(location::geometry)      AS loc,
      array_agg(recorded_at)             AS ts
    FROM gps_points
    WHERE session_id = p_session_id
  ) stats
  WHERE s.id = p_session_id;
END;
$$;

COMMENT ON FUNCTION compute_session_stats(UUID) IS 'Przelicza total_distance_m, total_points i avg_speed_kmh w gps_sessions na podstawie aktualnych gps_points.';

-- Zlicza punkty GPS wewnątrz dzielnicy od podanego czasu
CREATE OR REPLACE FUNCTION points_in_district(
  p_district_name TEXT,
  p_since         TIMESTAMPTZ DEFAULT now() - INTERVAL '30 days'
)
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(gp.id)
  FROM   gps_points        gp
  JOIN   warsaw_districts  wd ON wd.name = p_district_name
  WHERE  gp.recorded_at >= p_since
    AND  ST_Contains(wd.geom, gp.location::geometry);
$$;

COMMENT ON FUNCTION points_in_district(TEXT, TIMESTAMPTZ) IS 'Zlicza punkty GPS w podanej dzielnicy Warszawy od p_since. Wymaga wypełnienia warsaw_districts danymi GIS.';

-- Zwraca GeoJSON FeatureCollection tras sesji dla kampanii (heatmap data)
CREATE OR REPLACE FUNCTION campaign_coverage_geojson(p_campaign_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'type',     'FeatureCollection',
    'features', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'type',     'Feature',
          'geometry', ST_AsGeoJSON(gs.route_geom)::jsonb,
          'properties', jsonb_build_object(
            'session_id',       gs.id,
            'driver_id',        gs.driver_id,
            'started_at',       gs.started_at,
            'ended_at',         gs.ended_at,
            'total_distance_m', gs.total_distance_m
          )
        )
      ),
      '[]'::jsonb
    )
  )
  FROM gps_sessions gs
  WHERE gs.campaign_id  = p_campaign_id
    AND gs.route_geom   IS NOT NULL;
$$;

COMMENT ON FUNCTION campaign_coverage_geojson(UUID) IS 'Zwraca GeoJSON FeatureCollection tras sesji GPS dla kampanii — używane do map zasięgu i heatmap.';

-- Oblicza łączny przebieg kierowcy w danym miesiącu (dla generowania wypłat)
CREATE OR REPLACE FUNCTION monthly_km_for_driver(
  p_driver_id UUID,
  p_period    DATE
)
RETURNS NUMERIC(10,2)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    SUM(total_distance_m) / 1000.0,
    0.0
  )::NUMERIC(10,2)
  FROM gps_sessions
  WHERE driver_id        = p_driver_id
    AND started_at      >= date_trunc('month', p_period)
    AND started_at       < date_trunc('month', p_period) + INTERVAL '1 month'
    AND total_distance_m IS NOT NULL;
$$;

COMMENT ON FUNCTION monthly_km_for_driver(UUID, DATE) IS 'Oblicza łączny przebieg (km) kierowcy w miesiącu podanym jako p_period. Używana przy generowaniu wypłat.';
