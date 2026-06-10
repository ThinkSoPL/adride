-- =============================================================================
-- AdRide: Zmaterializowane widoki analityczne + harmonogramy odświeżania
-- =============================================================================

-- =============================================================================
-- mv_driver_monthly_stats
-- Statystyki miesięczne kierowcy: km, sesje, dni aktywności
-- Odświeżanie: codziennie o 03:00 (niska aktywność nocna)
-- =============================================================================

CREATE MATERIALIZED VIEW mv_driver_monthly_stats AS
SELECT
  d.id                                       AS driver_id,
  date_trunc('month', gs.started_at)::DATE   AS year_month,
  COALESCE(SUM(gs.total_distance_m) / 1000.0, 0)::NUMERIC(10,2) AS total_km,
  COUNT(DISTINCT gs.id)                      AS total_sessions,
  COUNT(DISTINCT gs.started_at::DATE)        AS days_active
FROM drivers d
LEFT JOIN gps_sessions gs
  ON  gs.driver_id   = d.id
  AND gs.started_at IS NOT NULL
GROUP BY
  d.id,
  date_trunc('month', gs.started_at)::DATE
WITH NO DATA;

COMMENT ON MATERIALIZED VIEW mv_driver_monthly_stats IS
  'Miesięczne statystyki kierowcy: łączny km, liczba sesji, dni aktywności. '
  'Odświeżanie: cron daily 03:00. Używana do dashboardu kierowcy i generowania wypłat.';

CREATE UNIQUE INDEX mv_driver_monthly_stats_pk
  ON mv_driver_monthly_stats (driver_id, year_month);

CREATE INDEX mv_driver_monthly_stats_month
  ON mv_driver_monthly_stats (year_month DESC);

-- Wstępne wypełnienie danymi
REFRESH MATERIALIZED VIEW mv_driver_monthly_stats;

-- Harmonogram odświeżania — codziennie o 03:00
SELECT cron.schedule(
  'adride-refresh-driver-monthly-stats',
  '0 3 * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_driver_monthly_stats;'
);

-- =============================================================================
-- mv_campaign_dashboard
-- Dashboard kampanii: km, unikalne pojazdy, dni aktywności, pokrycie dzielnic
-- Odświeżanie: co godzinę (dane operacyjne — reklamodawcy patrzą na progress)
-- =============================================================================

CREATE MATERIALIZED VIEW mv_campaign_dashboard AS
SELECT
  c.id                                          AS campaign_id,
  c.advertiser_id,
  c.name                                        AS campaign_name,
  c.status,
  c.start_date,
  c.end_date,
  COALESCE(SUM(gs.total_distance_m) / 1000.0, 0)::NUMERIC(10,2) AS total_km,
  COUNT(DISTINCT gs.vehicle_id)                 AS unique_vehicles,
  COUNT(DISTINCT gs.started_at::DATE)           AS days_active,
  COUNT(DISTINCT gs.id)                         AS total_sessions,
  -- Pokrycie dzielnic: JSON z listą unikalnych dzielnic na podstawie target_districts kampanii
  COALESCE(
    to_jsonb(c.target_districts),
    '[]'::jsonb
  )                                             AS districts_covered
FROM campaigns c
LEFT JOIN gps_sessions gs
  ON  gs.campaign_id = c.id
  AND gs.ended_at   IS NOT NULL
GROUP BY
  c.id, c.advertiser_id, c.name, c.status, c.start_date, c.end_date,
  c.target_districts
WITH NO DATA;

COMMENT ON MATERIALIZED VIEW mv_campaign_dashboard IS
  'Dashboard kampanii: km, pojazdy, dni aktywności, sesje. '
  'Odświeżanie: co godzinę (cron hourly). Używana przez dashboard reklamodawcy.';

CREATE UNIQUE INDEX mv_campaign_dashboard_pk
  ON mv_campaign_dashboard (campaign_id);

CREATE INDEX mv_campaign_dashboard_advertiser
  ON mv_campaign_dashboard (advertiser_id);

CREATE INDEX mv_campaign_dashboard_status
  ON mv_campaign_dashboard (status);

REFRESH MATERIALIZED VIEW mv_campaign_dashboard;

-- Harmonogram odświeżania — co godzinę
SELECT cron.schedule(
  'adride-refresh-campaign-dashboard',
  '0 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_campaign_dashboard;'
);

-- =============================================================================
-- mv_district_exposure
-- Ekspozycja reklamowa według dzielnicy: km całkowity i z ostatnich 30 dni
-- Odświeżanie: codziennie o 04:00
-- =============================================================================

CREATE MATERIALIZED VIEW mv_district_exposure AS
SELECT
  unnest(c.target_districts)                       AS district,
  c.id                                             AS campaign_id,
  c.advertiser_id,
  COALESCE(SUM(gs.total_distance_m) / 1000.0, 0)::NUMERIC(10,2) AS total_km,
  COALESCE(SUM(
    CASE WHEN gs.started_at > now() - INTERVAL '30 days'
         THEN gs.total_distance_m ELSE 0 END
  ) / 1000.0, 0)::NUMERIC(10,2)                   AS last_30d_km
FROM campaigns c
LEFT JOIN gps_sessions gs
  ON  gs.campaign_id = c.id
  AND gs.ended_at   IS NOT NULL
WHERE c.target_districts IS NOT NULL
  AND array_length(c.target_districts, 1) > 0
GROUP BY district, c.id, c.advertiser_id
WITH NO DATA;

COMMENT ON MATERIALIZED VIEW mv_district_exposure IS
  'Ekspozycja reklamowa per dzielnica per kampania: łączny km i km z ostatnich 30 dni. '
  'Odświeżanie: cron daily 04:00. Używana do analizy zasięgu geograficznego.';

CREATE INDEX mv_district_exposure_district
  ON mv_district_exposure (district);

CREATE INDEX mv_district_exposure_campaign
  ON mv_district_exposure (campaign_id);

CREATE UNIQUE INDEX mv_district_exposure_pk
  ON mv_district_exposure (district, campaign_id);

REFRESH MATERIALIZED VIEW mv_district_exposure;

-- Harmonogram odświeżania — codziennie o 04:00
SELECT cron.schedule(
  'adride-refresh-district-exposure',
  '0 4 * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_district_exposure;'
);

-- =============================================================================
-- Widok bezpieczny dla kierowcy (maskuje kolumnę notes — tylko admin)
-- Używaj tego widoku zamiast tabeli drivers w zapytaniach klienckich
-- =============================================================================

CREATE VIEW v_drivers_public AS
SELECT
  id,
  status,
  city,
  stripe_payouts_enabled,
  kyc_completed_at,
  bank_account_verified,
  referral_code,
  referred_by,
  -- Notatki administracyjne widoczne tylko dla admina
  CASE WHEN public.is_admin() THEN notes ELSE NULL END AS notes,
  created_at,
  updated_at
FROM drivers;

COMMENT ON VIEW v_drivers_public IS 'Widok kierowców z ukrytą kolumną notes dla nie-adminów. Używaj tego widoku w API klienckim.';
