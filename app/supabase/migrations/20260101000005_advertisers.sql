-- =============================================================================
-- AdRide: Tabela reklamodawców
-- =============================================================================

CREATE TABLE advertisers (
  id                 UUID        NOT NULL PRIMARY KEY
                       REFERENCES profiles(id) ON DELETE CASCADE,
  company_name       TEXT        NOT NULL,
  vat_id             TEXT,
  billing_address    JSONB,
  stripe_customer_id TEXT        UNIQUE,
  industry           TEXT,
  district_focus     TEXT[],
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE advertisers IS 'Dane reklamodawców zlecających kampanie AdRide (1:1 z profiles)';
COMMENT ON COLUMN advertisers.id                 IS 'UUID tożsamy z profiles.id; kaskadowe usunięcie przy usunięciu profilu';
COMMENT ON COLUMN advertisers.company_name       IS 'Oficjalna nazwa firmy reklamodawcy';
COMMENT ON COLUMN advertisers.vat_id             IS 'Numer NIP firmy (format: PL1234567890 lub 1234567890)';
COMMENT ON COLUMN advertisers.billing_address    IS 'Adres rozliczeniowy do faktur (JSON: street, city, postal_code, country)';
COMMENT ON COLUMN advertisers.stripe_customer_id IS 'ID klienta Stripe — powiązanie z subskrypcjami i fakturami';
COMMENT ON COLUMN advertisers.industry           IS 'Branża działalności (używana do segmentacji i raportów)';
COMMENT ON COLUMN advertisers.district_focus     IS 'Tablica preferencji dzielnic Warszawy do targetowania kampanii';
COMMENT ON COLUMN advertisers.created_at         IS 'Czas rejestracji reklamodawcy';
COMMENT ON COLUMN advertisers.updated_at         IS 'Czas ostatniej modyfikacji danych reklamodawcy';
