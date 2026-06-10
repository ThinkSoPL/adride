-- =============================================================================
-- AdRide: Row Level Security — polityki dostępu
-- Każda tabela: ENABLE RLS + FORCE RLS (dotyczy też właściciela tabeli)
-- service_role ma BYPASSRLS → pomija RLS bez względu na FORCE
-- anon nie ma żadnej polityki → brak dostępu do wszystkich tabel
-- =============================================================================

-- =============================================================================
-- profiles
-- =============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

-- Użytkownik widzi własny profil LUB admin widzi wszystkie
CREATE POLICY profiles_select
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR public.is_admin()
  );

-- Użytkownik aktualizuje własny profil (kolumna `role` chroniona osobno — aplikacja + audit)
CREATE POLICY profiles_update_self
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Blokada zmiany roli przez zwykłego użytkownika (wymaga dodatkowej walidacji w API)
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Admin może zmienić rolę i inne pola dowolnego profilu
CREATE POLICY profiles_update_admin
  ON profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- INSERT tylko przez trigger handle_new_user (SECURITY DEFINER) — blokujemy jawny INSERT
CREATE POLICY profiles_insert_blocked
  ON profiles FOR INSERT
  WITH CHECK (false);

-- Usunięcie profilu — wyłącznie admin (kierowcy usuwają konto przez API → kaskada z auth.users)
CREATE POLICY profiles_delete_admin
  ON profiles FOR DELETE
  USING (public.is_admin());

COMMENT ON TABLE profiles IS 'RLS: SELECT — własny lub admin; UPDATE — własny (bez zmiany roli) lub admin; INSERT — tylko trigger; DELETE — admin';

-- =============================================================================
-- drivers
-- =============================================================================
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers FORCE ROW LEVEL SECURITY;

-- Kierowca widzi własny rekord; admin widzi wszystko;
-- Reklamodawca widzi kierowców przypisanych do jego kampanii (dla widgetów dashboard)
CREATE POLICY drivers_select
  ON drivers FOR SELECT
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR (
      public.is_advertiser()
      AND EXISTS (
        SELECT 1
        FROM campaign_vehicles cv
        JOIN campaigns          c  ON c.id  = cv.campaign_id
        JOIN vehicles           v  ON v.id  = cv.vehicle_id
        WHERE c.advertiser_id   = auth.uid()
          AND v.driver_id       = drivers.id
          AND cv.removed_at     IS NULL
      )
    )
  );

-- Kierowca aktualizuje swoje dane (z wyłączeniem pól admin: status, notes, stripe_*)
-- Ograniczenie kolumn wymuszane aplikacyjnie; poniższe sprawdza ownership
CREATE POLICY drivers_update_self
  ON drivers FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Nie pozwól na zmianę pól zarezerwowanych dla admina
    AND status        = (SELECT status        FROM drivers WHERE id = auth.uid())
    AND notes         IS NOT DISTINCT FROM (SELECT notes FROM drivers WHERE id = auth.uid())
    AND stripe_account_id IS NOT DISTINCT FROM (SELECT stripe_account_id FROM drivers WHERE id = auth.uid())
  );

-- Admin aktualizuje dowolnego kierowcę (w tym status, notes, stripe_*)
CREATE POLICY drivers_update_admin
  ON drivers FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- INSERT — tylko przez handle_new_user lub bezpośrednio API z service_role
CREATE POLICY drivers_insert_self
  ON drivers FOR INSERT
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- DELETE — tylko admin
CREATE POLICY drivers_delete_admin
  ON drivers FOR DELETE
  USING (public.is_admin());

COMMENT ON TABLE drivers IS 'RLS: SELECT — self/admin/advertiser-z-kampanią; UPDATE self (ograniczone pola) / admin; DELETE admin';

-- =============================================================================
-- advertisers
-- =============================================================================
ALTER TABLE advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisers FORCE ROW LEVEL SECURITY;

CREATE POLICY advertisers_select
  ON advertisers FOR SELECT
  USING (
    id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY advertisers_update_self
  ON advertisers FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY advertisers_update_admin
  ON advertisers FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY advertisers_insert_self
  ON advertisers FOR INSERT
  WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY advertisers_delete_admin
  ON advertisers FOR DELETE
  USING (public.is_admin());

COMMENT ON TABLE advertisers IS 'RLS: SELECT — self/admin; UPDATE — self/admin; DELETE — admin';

-- =============================================================================
-- vehicles
-- =============================================================================
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles FORCE ROW LEVEL SECURITY;

-- Kierowca widzi własne pojazdy; admin widzi wszystko; reklamodawca widzi pojazdy swoich kampanii
CREATE POLICY vehicles_select
  ON vehicles FOR SELECT
  USING (
    driver_id = auth.uid()
    OR public.is_admin()
    OR (
      public.is_advertiser()
      AND EXISTS (
        SELECT 1
        FROM campaign_vehicles cv
        JOIN campaigns         c ON c.id = cv.campaign_id
        WHERE c.advertiser_id  = auth.uid()
          AND cv.vehicle_id    = vehicles.id
          AND cv.removed_at    IS NULL
      )
    )
  );

-- Kierowca zarządza własnymi pojazdami
CREATE POLICY vehicles_insert_self
  ON vehicles FOR INSERT
  WITH CHECK (driver_id = auth.uid() OR public.is_admin());

CREATE POLICY vehicles_update_self
  ON vehicles FOR UPDATE
  USING (driver_id = auth.uid() OR public.is_admin())
  WITH CHECK (driver_id = auth.uid() OR public.is_admin());

CREATE POLICY vehicles_delete
  ON vehicles FOR DELETE
  USING (
    (driver_id = auth.uid() AND status = 'available')
    OR public.is_admin()
  );

COMMENT ON TABLE vehicles IS 'RLS: SELECT — kierowca/admin/advertiser-z-kampanią; CUD — kierowca(własne)/admin';

-- =============================================================================
-- campaigns
-- =============================================================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns FORCE ROW LEVEL SECURITY;

-- Reklamodawca widzi swoje kampanie; admin widzi wszystko; kierowca widzi kampanie, w których uczestniczy
CREATE POLICY campaigns_select
  ON campaigns FOR SELECT
  USING (
    advertiser_id = auth.uid()
    OR public.is_admin()
    OR (
      public.is_driver()
      AND EXISTS (
        SELECT 1
        FROM campaign_vehicles cv
        JOIN vehicles          v ON v.id = cv.vehicle_id
        WHERE cv.campaign_id = campaigns.id
          AND v.driver_id    = auth.uid()
          AND cv.removed_at  IS NULL
      )
    )
  );

-- Tylko reklamodawca tworzy kampanie (jako siebie)
CREATE POLICY campaigns_insert_advertiser
  ON campaigns FOR INSERT
  WITH CHECK (
    advertiser_id = auth.uid()
    AND public.is_advertiser()
  );

-- Reklamodawca może edytować własną kampanię (ograniczone pola — aplikacja egzekwuje)
-- Nie można zmienić advertiser_id ani przejść do statusów zarezerwowanych dla admina
CREATE POLICY campaigns_update_advertiser
  ON campaigns FOR UPDATE
  USING (advertiser_id = auth.uid() AND public.is_advertiser())
  WITH CHECK (
    advertiser_id = auth.uid()
    -- Nie pozwól reklamodawcy aktywować kampanii bez płatności (aplikacja to kontroluje)
    AND status NOT IN ('active', 'completed')
  );

-- Admin może zmieniać wszystko
CREATE POLICY campaigns_update_admin
  ON campaigns FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Tylko admin może usuwać kampanie
CREATE POLICY campaigns_delete_admin
  ON campaigns FOR DELETE
  USING (public.is_admin());

COMMENT ON TABLE campaigns IS 'RLS: SELECT — advertiser/admin/kierowca-w-kampanii; INSERT — advertiser jako siebie; UPDATE — advertiser(ograniczone)/admin; DELETE — admin';

-- =============================================================================
-- campaign_vehicles
-- =============================================================================
ALTER TABLE campaign_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_vehicles FORCE ROW LEVEL SECURITY;

CREATE POLICY campaign_vehicles_select
  ON campaign_vehicles FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_vehicles.campaign_id
        AND c.advertiser_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = campaign_vehicles.vehicle_id
        AND v.driver_id = auth.uid()
    )
  );

-- Tylko admin i service_role zarządzają przypisaniami pojazdów
CREATE POLICY campaign_vehicles_insert_admin
  ON campaign_vehicles FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY campaign_vehicles_update_admin
  ON campaign_vehicles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY campaign_vehicles_delete_admin
  ON campaign_vehicles FOR DELETE
  USING (public.is_admin());

COMMENT ON TABLE campaign_vehicles IS 'RLS: SELECT — admin/advertiser-właściciel/kierowca-pojazdu; CUD — admin';

-- =============================================================================
-- gps_sessions
-- =============================================================================
ALTER TABLE gps_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_sessions FORCE ROW LEVEL SECURITY;

-- Kierowca widzi własne sesje; admin widzi wszystkie; reklamodawca widzi sesje swoich kampanii
CREATE POLICY gps_sessions_select
  ON gps_sessions FOR SELECT
  USING (
    driver_id = auth.uid()
    OR public.is_admin()
    OR (
      public.is_advertiser()
      AND campaign_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM campaigns c
        WHERE c.id = gps_sessions.campaign_id
          AND c.advertiser_id = auth.uid()
      )
    )
  );

-- Kierowca tworzy tylko własne sesje
CREATE POLICY gps_sessions_insert_driver
  ON gps_sessions FOR INSERT
  WITH CHECK (
    driver_id = auth.uid()
    AND public.is_driver()
  );

-- Kierowca aktualizuje tylko własne sesje (np. ended_at po zakończeniu jazdy)
CREATE POLICY gps_sessions_update_driver
  ON gps_sessions FOR UPDATE
  USING (driver_id = auth.uid() AND public.is_driver())
  WITH CHECK (
    driver_id = auth.uid()
    -- Nie pozwól na zmianę driver_id, vehicle_id — tylko aplikacja może to modyfikować przez service_role
    AND driver_id  = (SELECT driver_id  FROM gps_sessions WHERE id = gps_sessions.id)
    AND vehicle_id = (SELECT vehicle_id FROM gps_sessions WHERE id = gps_sessions.id)
  );

-- Admin może aktualizować wszystkie sesje (np. korekty, agregacja route_geom przez cron)
CREATE POLICY gps_sessions_update_admin
  ON gps_sessions FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Usuwanie — tylko admin
CREATE POLICY gps_sessions_delete_admin
  ON gps_sessions FOR DELETE
  USING (public.is_admin());

COMMENT ON TABLE gps_sessions IS 'RLS: SELECT — kierowca-własne/admin/advertiser-kampania; INSERT/UPDATE — kierowca własne; DELETE — admin';

-- =============================================================================
-- gps_points (tabela partycjonowana — RLS stosuje się do rodzica i wszystkich partycji)
-- =============================================================================
ALTER TABLE gps_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_points FORCE ROW LEVEL SECURITY;

-- Taki sam wzorzec jak gps_sessions — denormalizacja driver_id i campaign_id umożliwia
-- wydajne sprawdzenie RLS bez dodatkowych JOINów
CREATE POLICY gps_points_select
  ON gps_points FOR SELECT
  USING (
    driver_id = auth.uid()
    OR public.is_admin()
    OR (
      public.is_advertiser()
      AND campaign_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM campaigns c
        WHERE c.id = gps_points.campaign_id
          AND c.advertiser_id = auth.uid()
      )
    )
  );

-- Kierowca wstawia tylko własne punkty GPS
CREATE POLICY gps_points_insert_driver
  ON gps_points FOR INSERT
  WITH CHECK (
    driver_id = auth.uid()
    AND public.is_driver()
  );

-- Brak UPDATE dla gps_points — dane GPS są immutable po zapisie
-- (aktualizacje przez service_role/cron omijają RLS via BYPASSRLS)

-- Usuwanie — tylko admin (np. GDPR deletion, błędy urządzenia)
CREATE POLICY gps_points_delete_admin
  ON gps_points FOR DELETE
  USING (public.is_admin());

COMMENT ON TABLE gps_points IS 'RLS: SELECT — kierowca-własne/admin/advertiser-kampania; INSERT — kierowca; UPDATE — brak (immutable); DELETE — admin';

-- =============================================================================
-- payouts
-- =============================================================================
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts FORCE ROW LEVEL SECURITY;

-- Kierowca widzi własne wypłaty; admin widzi wszystkie
-- INSERT i UPDATE wyłącznie przez service_role (Stripe webhook handler) — BYPASSRLS
CREATE POLICY payouts_select
  ON payouts FOR SELECT
  USING (
    driver_id = auth.uid()
    OR public.is_admin()
  );

-- Blokada jawnych INSERT/UPDATE/DELETE przez authenticated — tylko service_role
CREATE POLICY payouts_no_insert
  ON payouts FOR INSERT
  WITH CHECK (false);

CREATE POLICY payouts_no_update
  ON payouts FOR UPDATE
  USING (false);

CREATE POLICY payouts_delete_admin
  ON payouts FOR DELETE
  USING (public.is_admin());

COMMENT ON TABLE payouts IS 'RLS: SELECT — kierowca-własne/admin; INSERT/UPDATE — service_role (BYPASSRLS); DELETE — admin';

-- =============================================================================
-- stripe_events
-- =============================================================================
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events FORCE ROW LEVEL SECURITY;

-- ŻADNE polityki dla authenticated/anon — dostęp wyłącznie przez service_role (BYPASSRLS)
-- Celowe — webhooks Stripe nie powinny być dostępne przez API klienta

CREATE POLICY stripe_events_no_access
  ON stripe_events FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE stripe_events IS 'RLS: BRAK dostępu dla authenticated/anon. Wyłącznie service_role (BYPASSRLS) — Stripe webhook handler.';

-- =============================================================================
-- audit_log
-- =============================================================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;

-- Tylko admin może czytać logi audytowe
CREATE POLICY audit_log_select_admin
  ON audit_log FOR SELECT
  USING (public.is_admin());

-- INSERT — service_role (BYPASSRLS) oraz triggery (SECURITY DEFINER)
CREATE POLICY audit_log_no_insert
  ON audit_log FOR INSERT
  WITH CHECK (false);

-- UPDATE i DELETE — całkowicie zablokowane (niemodyfikowalność logów)
CREATE POLICY audit_log_no_update
  ON audit_log FOR UPDATE
  USING (false);

CREATE POLICY audit_log_no_delete
  ON audit_log FOR DELETE
  USING (false);

COMMENT ON TABLE audit_log IS 'RLS: SELECT — admin; INSERT — service_role/triggery SECURITY DEFINER; UPDATE/DELETE — całkowity zakaz (immutable audit trail)';

-- =============================================================================
-- warsaw_districts (tabela referencyjna — publiczny odczyt)
-- =============================================================================
ALTER TABLE warsaw_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE warsaw_districts FORCE ROW LEVEL SECURITY;

CREATE POLICY warsaw_districts_select_all
  ON warsaw_districts FOR SELECT
  USING (true);

CREATE POLICY warsaw_districts_manage_admin
  ON warsaw_districts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON TABLE warsaw_districts IS 'RLS: SELECT — wszyscy uwierzytelnieni; CUD — admin';
