-- =============================================================================
-- AdRide: Kampanie reklamowe i relacja M:N kampania-pojazd
-- =============================================================================

CREATE TABLE campaigns (
  id                         UUID              NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id              UUID              NOT NULL REFERENCES advertisers(id) ON DELETE RESTRICT,
  name                       TEXT              NOT NULL,
  package                    campaign_package  NOT NULL,
  status                     campaign_status   NOT NULL DEFAULT 'draft',
  stripe_subscription_id     TEXT              UNIQUE,
  start_date                 DATE,
  end_date                   DATE,
  min_km_per_vehicle_monthly INT               NOT NULL DEFAULT 1500,
  target_districts           TEXT[],
  vehicle_ids                UUID[],
  design_artwork_url         TEXT,
  created_at                 TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ       NOT NULL DEFAULT now(),

  CONSTRAINT campaigns_dates_check CHECK (
    end_date IS NULL OR start_date IS NULL OR end_date >= start_date
  ),
  CONSTRAINT campaigns_min_km_check CHECK (min_km_per_vehicle_monthly > 0)
);

COMMENT ON TABLE campaigns IS 'Kampanie reklamowe tworzone przez reklamodawców — centralna tabela modelu biznesowego';
COMMENT ON COLUMN campaigns.id                         IS 'Unikalny identyfikator kampanii';
COMMENT ON COLUMN campaigns.advertiser_id              IS 'FK do reklamodawcy — właściciel kampanii (RESTRICT: nie można usunąć reklamodawcy z kampaniami)';
COMMENT ON COLUMN campaigns.name                       IS 'Nazwa kampanii nadana przez reklamodawcę';
COMMENT ON COLUMN campaigns.package                    IS 'Wybrany pakiet cenowy (START / SCALE)';
COMMENT ON COLUMN campaigns.status                     IS 'Aktualny stan kampanii w całym cyklu życia';
COMMENT ON COLUMN campaigns.stripe_subscription_id     IS 'ID subskrypcji Stripe — cykliczne płatności miesięczne';
COMMENT ON COLUMN campaigns.start_date                 IS 'Data planowanego startu kampanii';
COMMENT ON COLUMN campaigns.end_date                   IS 'Data planowanego zakończenia kampanii';
COMMENT ON COLUMN campaigns.min_km_per_vehicle_monthly IS 'Gwarantowany minimalny przebieg km/pojazd/miesiąc (SLA dla wypłat)';
COMMENT ON COLUMN campaigns.target_districts           IS 'Docelowe dzielnice Warszawy (tablica nazw)';
COMMENT ON COLUMN campaigns.vehicle_ids                IS 'Denormalizowana lista UUID pojazdów (spójność utrzymywana triggerem sync_campaign_vehicle_ids)';
COMMENT ON COLUMN campaigns.design_artwork_url         IS 'URL do pliku graficznego projektu oklejenia (Supabase Storage)';

-- -----------------------------------------------------------------------------
-- Relacja M:N kampania-pojazd (soft delete przez removed_at)
-- -----------------------------------------------------------------------------
CREATE TABLE campaign_vehicles (
  campaign_id UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  vehicle_id  UUID        NOT NULL REFERENCES vehicles(id)  ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at  TIMESTAMPTZ,

  PRIMARY KEY (campaign_id, vehicle_id)
);

COMMENT ON TABLE campaign_vehicles IS 'Relacja M:N kampania–pojazd; soft delete przez kolumnę removed_at';
COMMENT ON COLUMN campaign_vehicles.campaign_id  IS 'FK do kampanii';
COMMENT ON COLUMN campaign_vehicles.vehicle_id   IS 'FK do pojazdu';
COMMENT ON COLUMN campaign_vehicles.assigned_at  IS 'Znacznik czasu przypisania pojazdu do kampanii';
COMMENT ON COLUMN campaign_vehicles.removed_at   IS 'Znacznik czasu usunięcia pojazdu z kampanii (NULL = aktywne przypisanie)';
