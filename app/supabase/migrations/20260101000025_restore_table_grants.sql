-- =============================================================================
-- Fix: "permission denied for table drivers/vehicles"
-- Problem: Migracja 22 zrobiła REVOKE ALL ... FROM authenticated zakładając,
--          że FORCE RLS nadaje uprawnienia. RLS NIE nadaje uprawnień —
--          tylko filtruje wiersze. Bez GRANT każde zapytanie kończy się
--          "permission denied for table X" (SQLSTATE 42501).
-- Skutek:  onboarding kierowcy = błąd zapisu; dashboardy = puste liczniki.
-- Rozwiązanie: przywróć GRANT-y; RLS policies (FORCE) nadal ograniczają
--          dostęp do własnych wierszy / admina.
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON drivers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON vehicles TO authenticated;
GRANT SELECT ON campaign_vehicles TO authenticated;

COMMENT ON TABLE drivers IS
  'GRANT: SELECT/INSERT/UPDATE dla authenticated (wiersze ogranicza FORCE RLS). '
  'RLS: SELECT self/admin; UPDATE self (ograniczone pola)/admin; INSERT self/admin; DELETE admin';
