-- =============================================================================
-- Fix: campaign_vehicles policy dla kierowców — bez cyklicznych JOINów
-- Problem: campaigns_select dla kierowcy JOIN-uje campaign_vehicles,
--          ale campaign_vehicles policy nie daje dostępu kierowcom
-- Rozwiązanie: Denormalizuj driver_id w campaign_vehicles + policy bez JOINów
-- =============================================================================

-- Dodaj driver_id (denormalizowany) do campaign_vehicles
ALTER TABLE campaign_vehicles
ADD COLUMN driver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Populuj istniejące wiersze poprzez JOIN z vehicles
UPDATE campaign_vehicles cv
SET driver_id = v.driver_id
FROM vehicles v
WHERE v.id = cv.vehicle_id;

-- Trigger: automatycznie ustaw driver_id przy INSERT
CREATE OR REPLACE FUNCTION update_campaign_vehicle_driver_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT driver_id INTO NEW.driver_id FROM vehicles WHERE id = NEW.vehicle_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_campaign_vehicles_set_driver_id
BEFORE INSERT ON campaign_vehicles
FOR EACH ROW
EXECUTE FUNCTION update_campaign_vehicle_driver_id();

-- =============================================================================
-- Zaktualizuj policy campaign_vehicles_select
-- =============================================================================
DROP POLICY IF EXISTS campaign_vehicles_select ON campaign_vehicles;

CREATE POLICY campaign_vehicles_select
  ON campaign_vehicles FOR SELECT
  USING (
    public.is_admin()
    OR (
      public.is_advertiser()
      AND EXISTS (
        SELECT 1 FROM campaigns c
        WHERE c.id = campaign_vehicles.campaign_id
          AND c.advertiser_id = auth.uid()
      )
    )
    OR (
      public.is_driver()
      AND driver_id = auth.uid()
    )
  );

COMMENT ON POLICY campaign_vehicles_select ON campaign_vehicles IS
  'FIXED: Kierowca widzi swoje pojazdy w kampaniach (via denormalizowany driver_id). '
  'Bez rekursywnych JOINów — przerwanie cyklu RLS.';

-- Dodaj index dla performance
CREATE INDEX IF NOT EXISTS idx_campaign_vehicles_driver_id
ON campaign_vehicles (driver_id, campaign_id);
