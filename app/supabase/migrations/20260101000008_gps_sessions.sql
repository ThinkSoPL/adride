-- =============================================================================
-- AdRide: Sesje GPS kierowców
-- =============================================================================

CREATE TABLE gps_sessions (
  id               UUID                    NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id        UUID                    NOT NULL REFERENCES drivers(id)   ON DELETE CASCADE,
  vehicle_id       UUID                    NOT NULL REFERENCES vehicles(id)  ON DELETE RESTRICT,
  campaign_id      UUID                             REFERENCES campaigns(id) ON DELETE SET NULL,
  started_at       TIMESTAMPTZ             NOT NULL,
  ended_at         TIMESTAMPTZ,
  total_distance_m INT,
  total_points     INT                     NOT NULL DEFAULT 0,
  avg_speed_kmh    NUMERIC(5,2),
  route_geom       GEOMETRY(LineString, 4326),
  device_info      JSONB,
  created_at       TIMESTAMPTZ             NOT NULL DEFAULT now(),

  CONSTRAINT gps_sessions_ended_after_started CHECK (
    ended_at IS NULL OR ended_at > started_at
  ),
  CONSTRAINT gps_sessions_distance_positive CHECK (
    total_distance_m IS NULL OR total_distance_m >= 0
  ),
  CONSTRAINT gps_sessions_points_positive CHECK (
    total_points >= 0
  )
);

COMMENT ON TABLE gps_sessions IS 'Sesje GPS — od uruchomienia aplikacji do jej zamknięcia; agreguje punkty GPS';
COMMENT ON COLUMN gps_sessions.id               IS 'Unikalny identyfikator sesji';
COMMENT ON COLUMN gps_sessions.driver_id        IS 'FK do kierowcy prowadzącego sesję (denormalizacja dla RLS)';
COMMENT ON COLUMN gps_sessions.vehicle_id       IS 'FK do pojazdu używanego w sesji (RESTRICT: nie usuń pojazdu z sesjami)';
COMMENT ON COLUMN gps_sessions.campaign_id      IS 'FK do kampanii (NULL jeśli pojazd nie ma aktywnej kampanii w trakcie sesji)';
COMMENT ON COLUMN gps_sessions.started_at       IS 'Czas rozpoczęcia sesji GPS (uruchomienie aplikacji)';
COMMENT ON COLUMN gps_sessions.ended_at         IS 'Czas zakończenia sesji (NULL = sesja aktualnie aktywna)';
COMMENT ON COLUMN gps_sessions.total_distance_m IS 'Łączny dystans trasy w metrach — aktualizowany przez compute_session_stats()';
COMMENT ON COLUMN gps_sessions.total_points     IS 'Liczba punktów GPS w tej sesji — aktualizowana triggerem';
COMMENT ON COLUMN gps_sessions.avg_speed_kmh    IS 'Średnia prędkość jazdy w km/h — aktualizowana przez compute_session_stats()';
COMMENT ON COLUMN gps_sessions.route_geom       IS 'Trasa jako LineString EPSG:4326 — uzupełniana przez cron aggregate_session_geom()';
COMMENT ON COLUMN gps_sessions.device_info      IS 'Informacje o urządzeniu mobilnym (JSON: device_model, os_version, app_version)';
COMMENT ON COLUMN gps_sessions.created_at       IS 'Czas utworzenia rekordu w bazie';
