-- =============================================================================
-- AdRide: Indeksy wydajnościowe
-- Zasady: FK zawsze indeksowane; kolumny w WHERE/ORDER BY; GIST dla geometrii;
--          BRIN dla gps_points (dane wstawiane w kolejności czasowej)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
CREATE INDEX idx_profiles_role ON profiles (role);

COMMENT ON INDEX idx_profiles_role IS 'Szybkie filtrowanie według roli (is_admin, is_driver, is_advertiser)';

-- -----------------------------------------------------------------------------
-- drivers
-- -----------------------------------------------------------------------------
CREATE INDEX idx_drivers_status ON drivers (status);
CREATE INDEX idx_drivers_city   ON drivers (city);

-- Wyszukiwanie po kodzie polecenia
CREATE INDEX idx_drivers_referral_code ON drivers (referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX idx_drivers_referred_by   ON drivers (referred_by)   WHERE referred_by IS NOT NULL;

COMMENT ON INDEX idx_drivers_status        IS 'Filtrowanie kierowców według statusu (dashboard admin)';
COMMENT ON INDEX idx_drivers_referral_code IS 'Lookup kodu polecenia przy rejestracji (partial — tylko niepuste)';

-- -----------------------------------------------------------------------------
-- vehicles
-- -----------------------------------------------------------------------------
CREATE INDEX idx_vehicles_driver_id_status ON vehicles (driver_id, status);
CREATE INDEX idx_vehicles_status           ON vehicles (status);

COMMENT ON INDEX idx_vehicles_driver_id_status IS 'Główne zapytanie: pojazdy kierowcy według statusu';

-- -----------------------------------------------------------------------------
-- campaigns
-- -----------------------------------------------------------------------------
CREATE INDEX idx_campaigns_advertiser_id_status ON campaigns (advertiser_id, status);
CREATE INDEX idx_campaigns_status_start_date    ON campaigns (status, start_date);
CREATE INDEX idx_campaigns_stripe_sub           ON campaigns (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- Indeks GIN na tablicy vehicle_ids dla szybkiego sprawdzenia przynależności pojazdu
CREATE INDEX idx_campaigns_vehicle_ids ON campaigns USING gin (vehicle_ids);

COMMENT ON INDEX idx_campaigns_advertiser_id_status IS 'Dashboard reklamodawcy: lista kampanii z filtrem statusu';
COMMENT ON INDEX idx_campaigns_status_start_date    IS 'Wyszukiwanie aktywnych kampanii do uruchomienia';
COMMENT ON INDEX idx_campaigns_vehicle_ids          IS 'GIN: szybkie ANY(vehicle_ids) — czy pojazd jest w jakiejkolwiek kampanii';

-- -----------------------------------------------------------------------------
-- campaign_vehicles
-- -----------------------------------------------------------------------------
CREATE INDEX idx_campaign_vehicles_vehicle_id ON campaign_vehicles (vehicle_id, campaign_id);
CREATE INDEX idx_campaign_vehicles_active     ON campaign_vehicles (campaign_id, vehicle_id)
  WHERE removed_at IS NULL;

COMMENT ON INDEX idx_campaign_vehicles_vehicle_id IS 'Zapytanie odwrotne: kampanie danego pojazdu';
COMMENT ON INDEX idx_campaign_vehicles_active     IS 'Partial index: tylko aktywne przypisania (bez soft-deleted)';

-- -----------------------------------------------------------------------------
-- gps_sessions
-- -----------------------------------------------------------------------------
CREATE INDEX idx_gps_sessions_driver_started    ON gps_sessions (driver_id, started_at DESC);
CREATE INDEX idx_gps_sessions_campaign_ended    ON gps_sessions (campaign_id, ended_at DESC)
  WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_gps_sessions_vehicle_id        ON gps_sessions (vehicle_id);
CREATE INDEX idx_gps_sessions_active            ON gps_sessions (driver_id) WHERE ended_at IS NULL;

-- GIST dla trasy sesji (zapytania przestrzenne, heatmapy)
CREATE INDEX idx_gps_sessions_route_geom ON gps_sessions USING gist (route_geom)
  WHERE route_geom IS NOT NULL;

COMMENT ON INDEX idx_gps_sessions_driver_started IS 'Główne zapytanie: historia jazd kierowcy (DESC = najnowsze pierwsze)';
COMMENT ON INDEX idx_gps_sessions_route_geom     IS 'GIST: zapytania przestrzenne na trasach sesji';
COMMENT ON INDEX idx_gps_sessions_active         IS 'Partial: szybkie sprawdzenie aktywnej sesji kierowcy';

-- -----------------------------------------------------------------------------
-- gps_points (tabela partycjonowana — indeksy na rodzicu propagują do partycji)
-- -----------------------------------------------------------------------------

-- BRIN: optymalny dla danych wstawianych w porządku czasowym (~1000× mniejszy niż B-tree)
CREATE INDEX idx_gps_points_recorded_at_brin ON gps_points USING brin (recorded_at)
  WITH (pages_per_range = 128);

-- GiST: zapytania przestrzenne (ST_DWithin, ST_Contains, heatmapy)
CREATE INDEX idx_gps_points_location_gist ON gps_points USING gist (location);

-- B-tree: główny wzorzec dostępu — dane kierowcy w zakresie czasu (krytyczny dla RLS)
CREATE INDEX idx_gps_points_driver_recorded ON gps_points (driver_id, recorded_at DESC);

-- B-tree: raportowanie kampanii (zasięg geograficzny, km per kampania)
CREATE INDEX idx_gps_points_campaign_recorded ON gps_points (campaign_id, recorded_at DESC)
  WHERE campaign_id IS NOT NULL;

-- B-tree: cascade delete z gps_sessions (FK session_id)
CREATE INDEX idx_gps_points_session_id ON gps_points (session_id);

COMMENT ON INDEX idx_gps_points_recorded_at_brin IS 'BRIN: wydajne range scans na czasie przy sequential inserts (strony 128 bloków)';
COMMENT ON INDEX idx_gps_points_location_gist    IS 'GiST: zapytania przestrzenne PostGIS (w promieniu, w dzielnicy)';
COMMENT ON INDEX idx_gps_points_driver_recorded  IS 'Krytyczny: RLS + dashboard kierowcy; covering scan dla 7-dniowego okna';
COMMENT ON INDEX idx_gps_points_campaign_recorded IS 'Raportowanie kampanii: km, ekspozycja, mapa zasięgu';
COMMENT ON INDEX idx_gps_points_session_id       IS 'Wspiera ON DELETE CASCADE z gps_sessions i compute_session_stats()';

-- -----------------------------------------------------------------------------
-- payouts
-- -----------------------------------------------------------------------------
CREATE INDEX idx_payouts_driver_period      ON payouts (driver_id, period_start DESC);
CREATE INDEX idx_payouts_campaign_id        ON payouts (campaign_id);
CREATE INDEX idx_payouts_status             ON payouts (status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_payouts_stripe_transfer    ON payouts (stripe_transfer_id) WHERE stripe_transfer_id IS NOT NULL;

COMMENT ON INDEX idx_payouts_driver_period   IS 'Historia wypłat kierowcy (DESC = najnowsze pierwsze)';
COMMENT ON INDEX idx_payouts_status          IS 'Partial: monitoring niezrealizowanych wypłat przez admina';

-- -----------------------------------------------------------------------------
-- stripe_events
-- -----------------------------------------------------------------------------
CREATE INDEX idx_stripe_events_type         ON stripe_events (type);
CREATE INDEX idx_stripe_events_unprocessed  ON stripe_events (created_at) WHERE processed_at IS NULL;

COMMENT ON INDEX idx_stripe_events_unprocessed IS 'Partial: kolejka zdarzeń Stripe czekających na przetworzenie';

-- -----------------------------------------------------------------------------
-- audit_log
-- -----------------------------------------------------------------------------
CREATE INDEX idx_audit_log_actor_created     ON audit_log (actor_id, created_at DESC);
CREATE INDEX idx_audit_log_entity           ON audit_log (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_log_action           ON audit_log (action, created_at DESC);

COMMENT ON INDEX idx_audit_log_entity IS 'Historia zmian konkretnej encji (np. historia statusów kampanii ID=xxx)';
