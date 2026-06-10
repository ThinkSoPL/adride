-- =============================================================================
-- AdRide: Triggery
-- =============================================================================

-- =============================================================================
-- SEKCJA 1: Triggery updated_at (BEFORE UPDATE na wszystkich tabelach)
-- =============================================================================

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER trg_profiles_updated_at ON profiles IS 'Automatyczna aktualizacja updated_at przy każdej modyfikacji wiersza';

CREATE TRIGGER trg_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER trg_drivers_updated_at ON drivers IS 'Automatyczna aktualizacja updated_at przy każdej modyfikacji wiersza';

CREATE TRIGGER trg_advertisers_updated_at
  BEFORE UPDATE ON advertisers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER trg_advertisers_updated_at ON advertisers IS 'Automatyczna aktualizacja updated_at przy każdej modyfikacji wiersza';

CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER trg_vehicles_updated_at ON vehicles IS 'Automatyczna aktualizacja updated_at przy każdej modyfikacji wiersza';

CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER trg_campaigns_updated_at ON campaigns IS 'Automatyczna aktualizacja updated_at przy każdej modyfikacji wiersza';

CREATE TRIGGER trg_payouts_updated_at
  BEFORE UPDATE ON payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER trg_payouts_updated_at ON payouts IS 'Automatyczna aktualizacja updated_at przy każdej modyfikacji wiersza';

-- =============================================================================
-- SEKCJA 2: Generowanie referral_code przy INSERT do drivers (BEFORE INSERT)
-- =============================================================================

CREATE TRIGGER trg_drivers_referral_code
  BEFORE INSERT ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION generate_driver_referral_code();

COMMENT ON TRIGGER trg_drivers_referral_code ON drivers IS 'Generuje 8-znakowy kod polecenia (hex uppercase) jeśli nie podano przy rejestracji kierowcy';

-- =============================================================================
-- SEKCJA 3: Synchronizacja campaigns.vehicle_ids po zmianach w campaign_vehicles
-- =============================================================================

CREATE TRIGGER trg_campaign_vehicles_sync_ids
  AFTER INSERT OR UPDATE OF removed_at ON campaign_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION sync_campaign_vehicle_ids();

COMMENT ON TRIGGER trg_campaign_vehicles_sync_ids ON campaign_vehicles IS 'Synchronizuje denormalizowaną tablicę campaigns.vehicle_ids po każdej zmianie przypisania pojazdu';

-- =============================================================================
-- SEKCJA 4: Zbiorczy enqueue odświeżania statystyk sesji GPS (AFTER INSERT, per STATEMENT)
-- Używa transition table NEW TABLE — wymaga PostgreSQL 14+ na partycjonowanych tabelach
-- =============================================================================

CREATE TRIGGER trg_gps_points_enqueue_stats
  AFTER INSERT ON gps_points
  REFERENCING NEW TABLE AS new_table
  FOR EACH STATEMENT
  EXECUTE FUNCTION enqueue_session_stats_refresh();

COMMENT ON TRIGGER trg_gps_points_enqueue_stats ON gps_points IS
  'Statement-level trigger (per INSERT, nie per wiersz) — wysyła NOTIFY z ID sesji do odświeżenia statystyk. '
  'Wydajny dla zbiorczych insertów GPS (batche po kilkaset punktów). Transition table NEW TABLE wymaga PG14+.';

-- =============================================================================
-- SEKCJA 5: Audytowanie zmian statusu kampanii (AFTER UPDATE)
-- =============================================================================

CREATE TRIGGER trg_campaigns_audit_status
  AFTER UPDATE OF status ON campaigns
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION audit_campaign_status_change();

COMMENT ON TRIGGER trg_campaigns_audit_status ON campaigns IS 'Zapisuje każdą zmianę statusu kampanii do audit_log (np. draft → active, active → paused)';
