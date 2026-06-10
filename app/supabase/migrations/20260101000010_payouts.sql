-- =============================================================================
-- AdRide: Tabela wypłat dla kierowców
-- =============================================================================

CREATE TABLE payouts (
  id                 UUID          NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id          UUID          NOT NULL REFERENCES drivers(id)   ON DELETE RESTRICT,
  campaign_id        UUID          NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
  period_start       DATE          NOT NULL,
  period_end         DATE          NOT NULL,
  total_km           NUMERIC(10,2) NOT NULL,
  amount_grosze      BIGINT        NOT NULL,
  within_guarantee   BOOLEAN       NOT NULL DEFAULT false,
  stripe_transfer_id TEXT          UNIQUE,
  status             payout_status NOT NULL DEFAULT 'pending',
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT payouts_period_check        CHECK (period_end >= period_start),
  CONSTRAINT payouts_total_km_positive   CHECK (total_km >= 0),
  CONSTRAINT payouts_amount_positive     CHECK (amount_grosze >= 0),
  -- Jeden rekord wypłaty na kierowcę per kampania per okres
  CONSTRAINT payouts_unique_period       UNIQUE (campaign_id, driver_id, period_start)
);

COMMENT ON TABLE payouts IS 'Wypłaty dla kierowców za przebieg w kampaniach — zawsze w groszach (BIGINT, brak float)';
COMMENT ON COLUMN payouts.id                 IS 'Unikalny identyfikator wypłaty';
COMMENT ON COLUMN payouts.driver_id          IS 'FK do kierowcy otrzymującego wypłatę (RESTRICT: nie usuń kierowcy z wypłatami)';
COMMENT ON COLUMN payouts.campaign_id        IS 'FK do kampanii, za którą następuje wypłata';
COMMENT ON COLUMN payouts.period_start       IS 'Początek okresu rozliczeniowego (włącznie)';
COMMENT ON COLUMN payouts.period_end         IS 'Koniec okresu rozliczeniowego (włącznie)';
COMMENT ON COLUMN payouts.total_km           IS 'Łączny przebieg kierowcy w tym okresie i kampanii';
COMMENT ON COLUMN payouts.amount_grosze      IS 'Kwota wypłaty w groszach (1 PLN = 100 groszy) — BIGINT eliminuje błędy zaokrągleń float';
COMMENT ON COLUMN payouts.within_guarantee   IS 'Czy kierowca spełnił gwarantowany próg km (min_km_per_vehicle_monthly)';
COMMENT ON COLUMN payouts.stripe_transfer_id IS 'ID transferu Stripe Connect — powiązanie z Stripe Dashboard';
COMMENT ON COLUMN payouts.status             IS 'Aktualny stan procesu wypłaty';
COMMENT ON COLUMN payouts.paid_at            IS 'Znacznik czasu potwierdzenia wypłaty przez Stripe';
COMMENT ON COLUMN payouts.created_at         IS 'Czas utworzenia rekordu wypłaty';
COMMENT ON COLUMN payouts.updated_at         IS 'Czas ostatniej aktualizacji statusu wypłaty';
