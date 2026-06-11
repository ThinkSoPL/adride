-- =============================================================================
-- Fix: infinite recursion (42P17) campaigns <-> campaign_vehicles
-- Wykryto: QA 2026-06-11 — SELECT na campaigns/campaign_vehicles pada dla
--          KAŻDEJ roli (admin/advertiser/driver) z błędem 42P17.
-- Cykl: campaigns_select (migracja 15, nigdy nieprzepisana) odpytuje
--       campaign_vehicles, a campaign_vehicles_select (migracja 23)
--       odpytuje campaigns -> nieskończona rekursja.
-- Skutek w UI: pulpit reklamodawcy "Aktywne kampanie: 0", panel admina
--       sekcja Kampanie pusta i licznik 0 (mimo 4 kampanii w bazie).
-- Rozwiązanie: denormalizacja advertiser_id w campaign_vehicles (analogicznie
--       do driver_id z migracji 23) i przepisanie OBU policy tak, by żadna
--       nie odpytywała tabeli, której policy odpytuje ją z powrotem.
-- =============================================================================

-- 1. Denormalizowany advertiser_id w campaign_vehicles
ALTER TABLE campaign_vehicles
ADD COLUMN IF NOT EXISTS advertiser_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE campaign_vehicles cv
SET advertiser_id = c.advertiser_id
FROM campaigns c
WHERE c.id = cv.campaign_id
  AND cv.advertiser_id IS NULL;

CREATE OR REPLACE FUNCTION update_campaign_vehicle_advertiser_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT advertiser_id INTO NEW.advertiser_id FROM campaigns WHERE id = NEW.campaign_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_campaign_vehicles_set_advertiser_id ON campaign_vehicles;
CREATE TRIGGER trg_campaign_vehicles_set_advertiser_id
BEFORE INSERT ON campaign_vehicles
FOR EACH ROW
EXECUTE FUNCTION update_campaign_vehicle_advertiser_id();

CREATE INDEX IF NOT EXISTS idx_campaign_vehicles_advertiser_id
ON campaign_vehicles (advertiser_id, campaign_id);

-- 2. campaign_vehicles_select — BEZ referencji do campaigns (przerwanie cyklu)
DROP POLICY IF EXISTS campaign_vehicles_select ON campaign_vehicles;
CREATE POLICY campaign_vehicles_select
  ON campaign_vehicles FOR SELECT
  USING (
    public.is_admin()
    OR (public.is_advertiser() AND advertiser_id = auth.uid())
    OR (public.is_driver() AND driver_id = auth.uid())
  );

COMMENT ON POLICY campaign_vehicles_select ON campaign_vehicles IS
  'FIXED 2026-06-11: zero subzapytań do campaigns — advertiser przez '
  'denormalizowany advertiser_id, kierowca przez driver_id (migracja 23).';

-- 3. campaigns_select — kierowca przez denormalizowany cv.driver_id,
--    bez JOIN do vehicles. campaign_vehicles_select (pkt 2) nie odpytuje już
--    campaigns, więc referencja jednokierunkowa jest bezpieczna.
DROP POLICY IF EXISTS campaigns_select ON campaigns;
CREATE POLICY campaigns_select
  ON campaigns FOR SELECT
  USING (
    advertiser_id = auth.uid()
    OR public.is_admin()
    OR (
      public.is_driver()
      AND EXISTS (
        SELECT 1 FROM campaign_vehicles cv
        WHERE cv.campaign_id = campaigns.id
          AND cv.driver_id   = auth.uid()
          AND cv.removed_at  IS NULL
      )
    )
  );

COMMENT ON POLICY campaigns_select ON campaigns IS
  'FIXED 2026-06-11: bez JOIN do vehicles; cykl campaigns<->campaign_vehicles przerwany.';

-- =============================================================================
-- Weryfikacja po uruchomieniu (oczekiwane: brak 42P17):
--   SELECT count(*) FROM campaigns;          -- jako zalogowany advertiser: >=1
--   SELECT count(*) FROM campaign_vehicles;  -- jako advertiser: >=1
-- =============================================================================
