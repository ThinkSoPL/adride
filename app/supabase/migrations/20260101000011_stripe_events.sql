-- =============================================================================
-- AdRide: Zdarzenia Stripe (webhook idempotency) + Dziennik audytowy
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabela zdarzeń Stripe — idempotentny rejestr webhooków
-- Dostęp wyłącznie przez service_role (backend webhook handler)
-- -----------------------------------------------------------------------------
CREATE TABLE stripe_events (
  id               TEXT        NOT NULL PRIMARY KEY,
  type             TEXT        NOT NULL,
  payload          JSONB       NOT NULL,
  processed_at     TIMESTAMPTZ,
  processing_error TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE stripe_events IS 'Idempotentny rejestr webhooków Stripe — gwarantuje przetworzenie każdego zdarzenia dokładnie raz';
COMMENT ON COLUMN stripe_events.id               IS 'ID zdarzenia Stripe (np. evt_1234abcd) — klucz idempotentności';
COMMENT ON COLUMN stripe_events.type             IS 'Typ zdarzenia Stripe (np. payment_intent.succeeded, invoice.paid)';
COMMENT ON COLUMN stripe_events.payload          IS 'Pełny payload JSON zdarzenia Stripe (do audytu i ponownego przetwarzania)';
COMMENT ON COLUMN stripe_events.processed_at     IS 'Czas pomyślnego przetworzenia zdarzenia (NULL = nieprzetworzone)';
COMMENT ON COLUMN stripe_events.processing_error IS 'Ostatni błąd przetwarzania (NULL = brak błędów)';
COMMENT ON COLUMN stripe_events.created_at       IS 'Czas otrzymania zdarzenia przez webhook handler';

-- -----------------------------------------------------------------------------
-- Tabela dziennika audytowego — niemodyfikowalne logi akcji
-- -----------------------------------------------------------------------------
CREATE TABLE audit_log (
  id          BIGSERIAL   NOT NULL PRIMARY KEY,
  actor_id    UUID                 REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,
  entity_type TEXT        NOT NULL,
  entity_id   TEXT        NOT NULL,
  diff        JSONB,
  ip          INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE audit_log IS 'Niemodyfikowalny dziennik audytowy zmian w systemie AdRide';
COMMENT ON COLUMN audit_log.id          IS 'Auto-inkrementowany identyfikator wpisu audytu';
COMMENT ON COLUMN audit_log.actor_id    IS 'FK do profilu wykonującego akcję (NULL = akcja systemowa / cron)';
COMMENT ON COLUMN audit_log.action      IS 'Typ akcji (np. status_change, driver_approved, payout_created)';
COMMENT ON COLUMN audit_log.entity_type IS 'Typ encji, której dotyczy zmiana (np. campaign, driver, payout)';
COMMENT ON COLUMN audit_log.entity_id   IS 'Identyfikator encji (UUID jako TEXT dla elastyczności)';
COMMENT ON COLUMN audit_log.diff        IS 'Różnica stanu: {"from": ..., "to": ...} lub zmienione pola';
COMMENT ON COLUMN audit_log.ip          IS 'Adres IP aktora (do logowania bezpieczeństwa)';
COMMENT ON COLUMN audit_log.created_at  IS 'Czas zdarzenia audytowego (tylko INSERT, nigdy UPDATE)';
