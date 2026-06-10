-- =============================================================================
-- AdRide: Tabela kierowców
-- =============================================================================

CREATE TABLE drivers (
  id                     UUID          NOT NULL PRIMARY KEY
                           REFERENCES profiles(id) ON DELETE CASCADE,
  status                 driver_status NOT NULL DEFAULT 'pending',
  city                   TEXT          NOT NULL DEFAULT 'Warszawa',
  stripe_account_id      TEXT          UNIQUE,
  stripe_payouts_enabled BOOLEAN       NOT NULL DEFAULT false,
  kyc_completed_at       TIMESTAMPTZ,
  bank_account_verified  BOOLEAN       NOT NULL DEFAULT false,
  referral_code          TEXT          UNIQUE,
  referred_by            UUID          REFERENCES drivers(id) ON DELETE SET NULL,
  notes                  TEXT,
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE drivers IS 'Dane kierowców uczestniczących w kampaniach AdRide (1:1 z profiles)';
COMMENT ON COLUMN drivers.id                     IS 'UUID tożsamy z profiles.id; kaskadowe usunięcie przy usunięciu profilu';
COMMENT ON COLUMN drivers.status                 IS 'Aktualny status kierowcy w procesie weryfikacji i aktywności';
COMMENT ON COLUMN drivers.city                   IS 'Miasto operowania kierowcy (do targetowania kampanii)';
COMMENT ON COLUMN drivers.stripe_account_id      IS 'ID konta Stripe Connect Express — wymagane do wypłat';
COMMENT ON COLUMN drivers.stripe_payouts_enabled IS 'Czy Stripe potwierdził gotowość do wypłat (po pełnym KYC)';
COMMENT ON COLUMN drivers.kyc_completed_at       IS 'Znacznik czasu zakończenia weryfikacji tożsamości (KYC)';
COMMENT ON COLUMN drivers.bank_account_verified  IS 'Czy konto bankowe zostało zweryfikowane przez Stripe';
COMMENT ON COLUMN drivers.referral_code          IS '8-znakowy alfanumeryczny kod polecenia (generowany triggerem przy INSERT)';
COMMENT ON COLUMN drivers.referred_by            IS 'FK do kierowcy, który polecił tego użytkownika (do programu poleceń)';
COMMENT ON COLUMN drivers.notes                  IS 'Notatki administracyjne — widoczne wyłącznie dla adminów (RLS policy)';
COMMENT ON COLUMN drivers.created_at             IS 'Czas rejestracji kierowcy';
COMMENT ON COLUMN drivers.updated_at             IS 'Czas ostatniej modyfikacji danych kierowcy';
