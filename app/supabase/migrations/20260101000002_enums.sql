-- =============================================================================
-- AdRide: Typy wyliczeniowe (enums)
-- =============================================================================

-- Rola użytkownika w systemie AdRide
CREATE TYPE user_role AS ENUM (
  'driver',      -- kierowca posiadający pojazd i uczestniczący w kampaniach
  'advertiser',  -- reklamodawca zlecający kampanie
  'admin'        -- administrator systemu z pełnym dostępem
);

-- Status kierowcy w procesie weryfikacji i aktywności
CREATE TYPE driver_status AS ENUM (
  'pending',   -- oczekuje na weryfikację dokumentów (KYC)
  'approved',  -- zatwierdzony, gotowy do przyjęcia kampanii
  'active',    -- aktywnie uczestniczy w co najmniej jednej kampanii
  'paused',    -- tymczasowo wstrzymany (urlop, usterka pojazdu)
  'rejected'   -- odrzucony przez system lub administratora
);

-- Status pojazdu w procesie oklejania i przypisywania do kampanii
CREATE TYPE vehicle_status AS ENUM (
  'available',   -- pojazd dostępny do oklejenia i kampanii
  'wrapped',     -- oklejony i gotowy do kampanii, oczekuje na przypisanie
  'in_campaign', -- aktywnie uczestniczy w kampanii reklamowej
  'inactive'     -- nieaktywny (sprzedany, uszkodzony, etc.)
);

-- Pakiet reklamowy kampanii
CREATE TYPE campaign_package AS ENUM (
  'START', -- pakiet startowy: mniejszy zasięg, niższy koszt
  'SCALE'  -- pakiet skalowania: większy zasięg, premium targetowanie
);

-- Status kampanii w jej cyklu życia
CREATE TYPE campaign_status AS ENUM (
  'draft',           -- szkic, edytowany przez reklamodawcę
  'pending_payment', -- oczekuje na potwierdzenie płatności Stripe
  'active',          -- aktywna kampania w toku
  'paused',          -- tymczasowo wstrzymana przez reklamodawcę lub admina
  'completed',       -- zakończona po upływie okresu kampanii
  'cancelled'        -- anulowana przed zakończeniem
);

-- Status wypłaty dla kierowcy
CREATE TYPE payout_status AS ENUM (
  'pending',    -- utworzona, oczekuje na przetworzenie
  'processing', -- w trakcie przetwarzania przez Stripe Connect
  'paid',       -- wypłata zrealizowana na konto kierowcy
  'failed',     -- nieudana próba wypłaty (błąd Stripe)
  'reversed'    -- cofnięta wypłata (dispute, zwrot)
);

COMMENT ON TYPE user_role        IS 'Rola biznesowa użytkownika w systemie AdRide';
COMMENT ON TYPE driver_status    IS 'Status kierowcy: odzwierciedla etap w procesie onboardingu i aktywności';
COMMENT ON TYPE vehicle_status   IS 'Status pojazdu: śledzi etap oklejania i uczestnictwa w kampanii';
COMMENT ON TYPE campaign_package IS 'Pakiet cenowy kampanii reklamowej';
COMMENT ON TYPE campaign_status  IS 'Stan kampanii reklamowej w całym cyklu życia';
COMMENT ON TYPE payout_status    IS 'Stan wypłaty pieniędzy kierowcy przez Stripe Connect';
