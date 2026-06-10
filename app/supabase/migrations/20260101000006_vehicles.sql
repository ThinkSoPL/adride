-- =============================================================================
-- AdRide: Tabela pojazdów kierowców
-- =============================================================================

CREATE TABLE vehicles (
  id                        UUID           NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id                 UUID           NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  registration_plate        TEXT           NOT NULL UNIQUE,
  -- Kolumna generowana — maskuje tablicę dla prywatności w publicznych endpointach
  registration_plate_masked TEXT           GENERATED ALWAYS AS (
                              substring(registration_plate FROM 1 FOR 2)
                              || ' ••• '
                              || right(registration_plate, 3)
                            ) STORED,
  make                      TEXT,
  model                     TEXT,
  year                      INT,
  color                     TEXT,
  mileage_monthly_estimate  INT,
  status                    vehicle_status NOT NULL DEFAULT 'available',
  created_at                TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ    NOT NULL DEFAULT now(),

  CONSTRAINT vehicles_year_check CHECK (year IS NULL OR (year >= 1990 AND year <= 2030)),
  CONSTRAINT vehicles_mileage_check CHECK (mileage_monthly_estimate IS NULL OR mileage_monthly_estimate > 0)
);

COMMENT ON TABLE vehicles IS 'Pojazdy kierowców dostępne do kampanii reklamowych (oklejanie)';
COMMENT ON COLUMN vehicles.id                        IS 'Unikalny identyfikator pojazdu generowany przez bazę';
COMMENT ON COLUMN vehicles.driver_id                 IS 'FK do właściciela pojazdu (kierowca)';
COMMENT ON COLUMN vehicles.registration_plate        IS 'Tablica rejestracyjna pojazdu — oryginalna wartość (np. WA12345)';
COMMENT ON COLUMN vehicles.registration_plate_masked IS 'Zamaskowana tablica (np. WA ••• 345) — bezpieczna do wyświetlenia w API';
COMMENT ON COLUMN vehicles.make                      IS 'Marka pojazdu (np. Toyota, Volkswagen)';
COMMENT ON COLUMN vehicles.model                     IS 'Model pojazdu (np. Yaris, Golf)';
COMMENT ON COLUMN vehicles.year                      IS 'Rok produkcji pojazdu (1990–2030)';
COMMENT ON COLUMN vehicles.color                     IS 'Kolor pojazdu (istotny przy weryfikacji oklejenia)';
COMMENT ON COLUMN vehicles.mileage_monthly_estimate  IS 'Szacowany miesięczny przebieg w km (podstawa kwalifikacji do kampanii)';
COMMENT ON COLUMN vehicles.status                    IS 'Aktualny stan pojazdu w systemie AdRide';
COMMENT ON COLUMN vehicles.created_at                IS 'Czas dodania pojazdu do systemu';
COMMENT ON COLUMN vehicles.updated_at                IS 'Czas ostatniej modyfikacji danych pojazdu';
