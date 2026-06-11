-- =============================================================================
-- Fix: Nieskończona rekursja w RLS policies (infinite recursion)
-- Problem: drivers_select, vehicles_select, campaign_vehicles_select
--          JOIN-owały się nawzajem, powodując cykl
-- Rozwiązanie: Uproszczenie policies — reklamodawca widzi dane TYLKO przez API
--             na service_role, nie bezpośrednio przez SELECT z RLS
-- =============================================================================

-- DROP stare policies
DROP POLICY IF EXISTS drivers_select ON drivers;
DROP POLICY IF EXISTS vehicles_select ON vehicles;
DROP POLICY IF EXISTS campaign_vehicles_select ON campaign_vehicles;

-- =============================================================================
-- Nowa policy drivers_select — bez JOINów do campaign_vehicles
-- =============================================================================
CREATE POLICY drivers_select
  ON drivers FOR SELECT
  USING (
    id = auth.uid()
    OR public.is_admin()
  );

COMMENT ON POLICY drivers_select ON drivers IS
  'FIXED: Kierowca widzi własny rekord; admin widzi wszystko. '
  'Reklamodawca widzi kierowców TYLKO poprzez API /campaigns/{id}/vehicles (service_role)';

-- =============================================================================
-- Nowa policy vehicles_select — bez JOINów do campaign_vehicles
-- =============================================================================
CREATE POLICY vehicles_select
  ON vehicles FOR SELECT
  USING (
    driver_id = auth.uid()
    OR public.is_admin()
  );

COMMENT ON POLICY vehicles_select ON vehicles IS
  'FIXED: Kierowca widzi własne pojazdy; admin widzi wszystko. '
  'Reklamodawca widzi pojazdy TYLKO poprzez API /campaigns/{id}/vehicles (service_role)';

-- =============================================================================
-- Nowa policy campaign_vehicles_select — tylko admin i advertiser
-- =============================================================================
CREATE POLICY campaign_vehicles_select
  ON campaign_vehicles FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_vehicles.campaign_id
        AND c.advertiser_id = auth.uid()
    )
  );

COMMENT ON POLICY campaign_vehicles_select ON campaign_vehicles IS
  'FIXED: Uproszczona logika — bez JOINów do vehicles. '
  'Kierowca dostęp do campaign_vehicles TYLKO poprzez API /campaigns/{id}/vehicles (service_role)';

-- =============================================================================
-- Wznowienie stanu RLS (aby policy weszły w życie)
-- =============================================================================
REVOKE ALL ON drivers FROM authenticated;
REVOKE ALL ON vehicles FROM authenticated;
REVOKE ALL ON campaign_vehicles FROM authenticated;

-- Granted przez FORCE RLS — brak jawnych GRANT dla authenticated
-- (RLS policies sterują dostępem)
