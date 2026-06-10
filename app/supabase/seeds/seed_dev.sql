-- =============================================================================
-- AdRide: Dane deweloperskie (seed)
-- Uruchamiać TYLKO na środowisku lokalnym / staging — NIE na produkcji
-- Wszystkie inserty idempotentne: ON CONFLICT DO NOTHING
-- =============================================================================

DO $$
BEGIN
  IF current_database() = 'postgres' AND
     EXISTS (SELECT 1 FROM pg_settings WHERE name = 'is_superuser' AND setting = 'on') THEN
    RAISE NOTICE 'UWAGA: Seed dev uruchomiony na środowisku produkcyjnym! Przerwij jeśli to błąd.';
  END IF;
END $$;

-- =============================================================================
-- SEKCJA 1: Dane referencyste — dzielnice Warszawy (uproszczone bbox)
-- Produkcyjne dane GIS: https://warszawa.pl/opendata lub geofabrik.de
-- =============================================================================

INSERT INTO warsaw_districts (name, geom) VALUES
  ('Śródmieście',   ST_GeomFromText('MULTIPOLYGON(((21.005 52.220, 21.040 52.220, 21.040 52.250, 21.005 52.250, 21.005 52.220)))', 4326)),
  ('Mokotów',       ST_GeomFromText('MULTIPOLYGON(((20.970 52.175, 21.050 52.175, 21.050 52.220, 20.970 52.220, 20.970 52.175)))', 4326)),
  ('Wola',          ST_GeomFromText('MULTIPOLYGON(((20.950 52.215, 21.010 52.215, 21.010 52.255, 20.950 52.255, 20.950 52.215)))', 4326)),
  ('Praga-Południe',ST_GeomFromText('MULTIPOLYGON(((21.035 52.210, 21.095 52.210, 21.095 52.265, 21.035 52.265, 21.035 52.210)))', 4326)),
  ('Ursynów',       ST_GeomFromText('MULTIPOLYGON(((20.960 52.120, 21.060 52.120, 21.060 52.175, 20.960 52.175, 20.960 52.120)))', 4326)),
  ('Bemowo',        ST_GeomFromText('MULTIPOLYGON(((20.890 52.215, 20.960 52.215, 20.960 52.270, 20.890 52.270, 20.890 52.215)))', 4326)),
  ('Targówek',      ST_GeomFromText('MULTIPOLYGON(((21.040 52.255, 21.100 52.255, 21.100 52.305, 21.040 52.305, 21.040 52.255)))', 4326)),
  ('Białołęka',     ST_GeomFromText('MULTIPOLYGON(((20.980 52.290, 21.070 52.290, 21.070 52.360, 20.980 52.360, 20.980 52.290)))', 4326))
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- SEKCJA 2: Użytkownicy auth.users (3 admini, 20 kierowców, 8 reklamodawców)
-- Hasło dla wszystkich: AdRide2026!
-- =============================================================================

-- Stałe UUID dla powtarzalności seeda
DO $$
DECLARE
  -- Admini
  admin1_id  UUID := 'a0000001-0000-0000-0000-000000000001';
  admin2_id  UUID := 'a0000002-0000-0000-0000-000000000002';
  admin3_id  UUID := 'a0000003-0000-0000-0000-000000000003';
  -- Kierowcy (d01-d20)
  d_ids      UUID[] := ARRAY[
    'd0000001-0000-0000-0000-000000000001',
    'd0000002-0000-0000-0000-000000000002',
    'd0000003-0000-0000-0000-000000000003',
    'd0000004-0000-0000-0000-000000000004',
    'd0000005-0000-0000-0000-000000000005',
    'd0000006-0000-0000-0000-000000000006',
    'd0000007-0000-0000-0000-000000000007',
    'd0000008-0000-0000-0000-000000000008',
    'd0000009-0000-0000-0000-000000000009',
    'd0000010-0000-0000-0000-000000000010',
    'd0000011-0000-0000-0000-000000000011',
    'd0000012-0000-0000-0000-000000000012',
    'd0000013-0000-0000-0000-000000000013',
    'd0000014-0000-0000-0000-000000000014',
    'd0000015-0000-0000-0000-000000000015',
    'd0000016-0000-0000-0000-000000000016',
    'd0000017-0000-0000-0000-000000000017',
    'd0000018-0000-0000-0000-000000000018',
    'd0000019-0000-0000-0000-000000000019',
    'd0000020-0000-0000-0000-000000000020'
  ];
  -- Reklamodawcy
  adv_ids    UUID[] := ARRAY[
    'b0000001-0000-0000-0000-000000000001',
    'b0000002-0000-0000-0000-000000000002',
    'b0000003-0000-0000-0000-000000000003',
    'b0000004-0000-0000-0000-000000000004',
    'b0000005-0000-0000-0000-000000000005',
    'b0000006-0000-0000-0000-000000000006',
    'b0000007-0000-0000-0000-000000000007',
    'b0000008-0000-0000-0000-000000000008'
  ];
  -- Kampanie
  camp_ids   UUID[] := ARRAY[
    'c0000001-0000-0000-0000-000000000001',
    'c0000002-0000-0000-0000-000000000002',
    'c0000003-0000-0000-0000-000000000003',
    'c0000004-0000-0000-0000-000000000004',
    'c0000005-0000-0000-0000-000000000005'
  ];
  -- Pojazdy
  veh_ids    UUID[] := ARRAY[
    'e0000001-0000-0000-0000-000000000001',
    'e0000002-0000-0000-0000-000000000002',
    'e0000003-0000-0000-0000-000000000003',
    'e0000004-0000-0000-0000-000000000004',
    'e0000005-0000-0000-0000-000000000005',
    'e0000006-0000-0000-0000-000000000006',
    'e0000007-0000-0000-0000-000000000007',
    'e0000008-0000-0000-0000-000000000008',
    'e0000009-0000-0000-0000-000000000009',
    'e0000010-0000-0000-0000-000000000010',
    'e0000011-0000-0000-0000-000000000011',
    'e0000012-0000-0000-0000-000000000012',
    'e0000013-0000-0000-0000-000000000013',
    'e0000014-0000-0000-0000-000000000014',
    'e0000015-0000-0000-0000-000000000015'
  ];

  v_encrypted_pass TEXT;
  i                INT;
  v_session_id     UUID;
  v_lat            DOUBLE PRECISION;
  v_lon            DOUBLE PRECISION;
  v_lat_step       DOUBLE PRECISION;
  v_lon_step       DOUBLE PRECISION;
  v_recorded_at    TIMESTAMPTZ;
  v_session_start  TIMESTAMPTZ;
  v_driver_id      UUID;
  v_vehicle_id     UUID;
  v_campaign_id    UUID;
  v_session_idx    INT;
  v_point_idx      INT;
  v_total_sessions INT := 10;
  v_points_per_session INT := 500;
  -- Centrum Warszawy
  WAW_LAT CONSTANT DOUBLE PRECISION := 52.2297;
  WAW_LON CONSTANT DOUBLE PRECISION := 21.0122;

BEGIN
  v_encrypted_pass := crypt('AdRide2026!', gen_salt('bf', 10));

  -- -----------------------------------------------------------------------
  -- Admini
  -- -----------------------------------------------------------------------
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_user_meta_data, is_super_admin)
  VALUES
    (admin1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin1@adride.pl', v_encrypted_pass, now(), now(), now(),
     '{"role":"admin","full_name":"Adam Kowalski"}'::jsonb, false),
    (admin2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin2@adride.pl', v_encrypted_pass, now(), now(), now(),
     '{"role":"admin","full_name":"Anna Nowak"}'::jsonb, false),
    (admin3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin3@adride.pl', v_encrypted_pass, now(), now(), now(),
     '{"role":"admin","full_name":"Marek Wiśniewski"}'::jsonb, false)
  ON CONFLICT (id) DO NOTHING;

  -- -----------------------------------------------------------------------
  -- Kierowcy (20 sztuk — różne statusy)
  -- -----------------------------------------------------------------------
  FOR i IN 1..20 LOOP
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_user_meta_data, is_super_admin)
    VALUES (
      d_ids[i],
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'driver' || lpad(i::text, 2, '0') || '@adride.pl',
      v_encrypted_pass,
      now(), now(), now(),
      jsonb_build_object(
        'role', 'driver',
        'full_name', 'Kierowca ' || i::text,
        'phone', '+485' || lpad((10000000 + i * 7919)::text, 8, '0')
      ),
      false
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

  -- -----------------------------------------------------------------------
  -- Reklamodawcy (8 sztuk)
  -- -----------------------------------------------------------------------
  FOR i IN 1..8 LOOP
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_user_meta_data, is_super_admin)
    VALUES (
      adv_ids[i],
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'advertiser' || i::text || '@firma.pl',
      v_encrypted_pass,
      now(), now(), now(),
      jsonb_build_object(
        'role', 'advertiser',
        'full_name', 'Reklamodawca ' || i::text
      ),
      false
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

  -- -----------------------------------------------------------------------
  -- Profile (trigger handle_new_user powinien je już stworzyć, ale na wszelki wypadek)
  -- -----------------------------------------------------------------------
  INSERT INTO profiles (id, role, full_name, phone) VALUES
    (admin1_id, 'admin', 'Adam Kowalski', '+48500000001'),
    (admin2_id, 'admin', 'Anna Nowak', '+48500000002'),
    (admin3_id, 'admin', 'Marek Wiśniewski', '+48500000003')
  ON CONFLICT (id) DO NOTHING;

  FOR i IN 1..20 LOOP
    INSERT INTO profiles (id, role, full_name, phone) VALUES (
      d_ids[i], 'driver',
      'Kierowca ' || i::text,
      '+485' || lpad((10000000 + i * 7919)::text, 8, '0')
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;

  FOR i IN 1..8 LOOP
    INSERT INTO profiles (id, role, full_name) VALUES (
      adv_ids[i], 'advertiser', 'Reklamodawca ' || i::text
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;

  -- -----------------------------------------------------------------------
  -- Kierowcy — rekordy w tabeli drivers (różne statusy)
  -- -----------------------------------------------------------------------
  FOR i IN 1..20 LOOP
    INSERT INTO drivers (
      id, status, city, stripe_account_id, stripe_payouts_enabled,
      kyc_completed_at, bank_account_verified
    ) VALUES (
      d_ids[i],
      CASE
        WHEN i <= 3  THEN 'pending'
        WHEN i <= 5  THEN 'approved'
        WHEN i <= 15 THEN 'active'
        WHEN i <= 18 THEN 'paused'
        ELSE              'rejected'
      END::driver_status,
      CASE WHEN i % 3 = 0 THEN 'Kraków' ELSE 'Warszawa' END,
      CASE WHEN i > 5 THEN 'acct_seed_' || lpad(i::text, 4, '0') ELSE NULL END,
      i > 5,
      CASE WHEN i > 5 THEN now() - (i * INTERVAL '10 days') ELSE NULL END,
      i > 5
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;

  -- -----------------------------------------------------------------------
  -- Reklamodawcy — rekordy w tabeli advertisers
  -- -----------------------------------------------------------------------
  FOR i IN 1..8 LOOP
    INSERT INTO advertisers (id, company_name, vat_id, billing_address, stripe_customer_id, industry, district_focus)
    VALUES (
      adv_ids[i],
      CASE i
        WHEN 1 THEN 'TechStart Sp. z o.o.'
        WHEN 2 THEN 'FoodDelivery S.A.'
        WHEN 3 THEN 'FinBank Polska'
        WHEN 4 THEN 'MobileNet Telekom'
        WHEN 5 THEN 'EcoClean Usługi'
        WHEN 6 THEN 'SportMax Sp. z o.o.'
        WHEN 7 THEN 'MedClinic Centrum'
        ELSE        'RetailPro S.A.'
      END,
      '525' || lpad((1000000 + i * 13337)::text, 7, '0'),
      jsonb_build_object(
        'street', 'ul. Testowa ' || (i * 10)::text,
        'city', 'Warszawa',
        'postal_code', '00-' || lpad((100 + i)::text, 3, '0'),
        'country', 'PL'
      ),
      'cus_seed_' || lpad(i::text, 6, '0'),
      CASE i % 4
        WHEN 0 THEN 'fintech'
        WHEN 1 THEN 'e-commerce'
        WHEN 2 THEN 'healthcare'
        ELSE        'telecom'
      END,
      ARRAY[
        (ARRAY['Śródmieście','Mokotów','Wola','Ursynów','Praga-Południe'])[1 + (i % 5)],
        (ARRAY['Bemowo','Targówek','Białołęka','Śródmieście','Mokotów'])[1 + ((i+2) % 5)]
      ]
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;

  -- -----------------------------------------------------------------------
  -- Pojazdy (15 pojazdów przypisanych do aktywnych kierowców d6-d15)
  -- -----------------------------------------------------------------------
  FOR i IN 1..15 LOOP
    INSERT INTO vehicles (id, driver_id, registration_plate, make, model, year, color, mileage_monthly_estimate, status)
    VALUES (
      veh_ids[i],
      d_ids[i + 5],
      'WA' || lpad((10000 + i * 3)::text, 5, '0'),
      (ARRAY['Toyota','Volkswagen','Ford','Skoda','Opel'])[1 + (i % 5)],
      (ARRAY['Yaris','Golf','Focus','Octavia','Astra'])[1 + (i % 5)],
      2019 + (i % 5),
      (ARRAY['biały','czarny','szary','srebrny','granatowy'])[1 + (i % 5)],
      1500 + (i * 100),
      CASE
        WHEN i <= 3  THEN 'available'
        WHEN i <= 6  THEN 'wrapped'
        WHEN i <= 12 THEN 'in_campaign'
        ELSE              'inactive'
      END::vehicle_status
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;

  -- -----------------------------------------------------------------------
  -- Kampanie (5 kampanii w różnych stanach)
  -- -----------------------------------------------------------------------
  INSERT INTO campaigns (id, advertiser_id, name, package, status, stripe_subscription_id, start_date, end_date, target_districts)
  VALUES
    (camp_ids[1], adv_ids[1], 'TechStart Launch Q1 2026', 'START',
     'active', 'sub_seed_001',
     '2026-01-15', '2026-04-15',
     ARRAY['Śródmieście','Mokotów','Wola']),

    (camp_ids[2], adv_ids[2], 'FoodDelivery Wiosna 2026', 'SCALE',
     'active', 'sub_seed_002',
     '2026-02-01', '2026-05-31',
     ARRAY['Ursynów','Mokotów','Praga-Południe']),

    (camp_ids[3], adv_ids[3], 'FinBank Brand Awareness', 'SCALE',
     'paused', 'sub_seed_003',
     '2026-01-01', '2026-06-30',
     ARRAY['Śródmieście','Wola']),

    (camp_ids[4], adv_ids[4], 'MobileNet 5G Kampania', 'START',
     'pending_payment', NULL,
     '2026-06-01', '2026-08-31',
     ARRAY['Bemowo','Targówek']),

    (camp_ids[5], adv_ids[1], 'TechStart Summer 2026', 'SCALE',
     'draft', NULL,
     NULL, NULL,
     ARRAY['Śródmieście','Białołęka'])
  ON CONFLICT (id) DO NOTHING;

  -- -----------------------------------------------------------------------
  -- Przypisania pojazdów do kampanii (campaign_vehicles)
  -- -----------------------------------------------------------------------
  -- Kampania 1: pojazdy 7-12
  FOR i IN 7..12 LOOP
    INSERT INTO campaign_vehicles (campaign_id, vehicle_id, assigned_at)
    VALUES (camp_ids[1], veh_ids[i], now() - INTERVAL '45 days')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Kampania 2: pojazdy 8-12
  FOR i IN 8..12 LOOP
    INSERT INTO campaign_vehicles (campaign_id, vehicle_id, assigned_at)
    VALUES (camp_ids[2], veh_ids[i], now() - INTERVAL '30 days')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Kampania 3 (paused): pojazdy 7-10
  FOR i IN 7..10 LOOP
    INSERT INTO campaign_vehicles (campaign_id, vehicle_id, assigned_at)
    VALUES (camp_ids[3], veh_ids[i], now() - INTERVAL '100 days')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- -----------------------------------------------------------------------
  -- Sesje GPS + punkty GPS (random walk po Warszawie)
  -- Łącznie: 10 kierowców aktywnych × 10 sesji × 1000 punktów = 100k punktów
  -- -----------------------------------------------------------------------
  FOR i IN 1..10 LOOP
    v_driver_id  := d_ids[i + 5];   -- aktywni kierowcy d6-d15
    v_vehicle_id := veh_ids[i];

    -- Kampania: pierwsze 5 kierowców w kampanii 1, kolejne 5 w kampanii 2
    v_campaign_id := CASE WHEN i <= 5 THEN camp_ids[1] ELSE camp_ids[2] END;

    FOR v_session_idx IN 1..v_total_sessions LOOP
      v_session_id   := gen_random_uuid();
      -- Sesje rozłożone na ostatnie 30 dni
      v_session_start := now()
                         - ((v_total_sessions - v_session_idx) * INTERVAL '3 days')
                         - (random() * INTERVAL '2 days');

      -- Start trasy: centrum Warszawy ± niewielki losowy offset
      v_lat := WAW_LAT + (random() - 0.5) * 0.08;
      v_lon := WAW_LON + (random() - 0.5) * 0.12;

      INSERT INTO gps_sessions (
        id, driver_id, vehicle_id, campaign_id, started_at,
        ended_at, device_info
      ) VALUES (
        v_session_id,
        v_driver_id,
        v_vehicle_id,
        v_campaign_id,
        v_session_start,
        v_session_start + INTERVAL '2 hours' + (random() * INTERVAL '1 hour'),
        jsonb_build_object(
          'device_model', (ARRAY['iPhone 14','Samsung S24','Pixel 8'])[1 + floor(random()*3)::INT],
          'os_version', (ARRAY['iOS 17.4','Android 14','Android 13'])[1 + floor(random()*3)::INT],
          'app_version', '2.1.' || floor(random()*10)::TEXT
        )
      ) ON CONFLICT DO NOTHING;

      -- Generowanie punktów GPS — random walk
      v_recorded_at := v_session_start;

      FOR v_point_idx IN 1..v_points_per_session LOOP
        -- Krok ~15m = ~0.000135° lat, ~0.000215° lon przy kat. 52°N
        v_lat_step := (random() - 0.5) * 0.00027;
        v_lon_step := (random() - 0.5) * 0.00043;

        -- Korekta: wróć do centrum jeśli za daleko (>5km od centrum)
        IF abs(v_lat - WAW_LAT) > 0.045 THEN
          v_lat_step := v_lat_step - sign(v_lat - WAW_LAT) * 0.0002;
        END IF;
        IF abs(v_lon - WAW_LON) > 0.070 THEN
          v_lon_step := v_lon_step - sign(v_lon - WAW_LON) * 0.0003;
        END IF;

        v_lat := v_lat + v_lat_step;
        v_lon := v_lon + v_lon_step;
        -- Odczyt co 12 sekund (300 odczytów/godzinę)
        v_recorded_at := v_recorded_at + INTERVAL '12 seconds';

        INSERT INTO gps_points (
          session_id, driver_id, campaign_id,
          location, speed_kmh, accuracy_m, heading, battery_level, recorded_at
        ) VALUES (
          v_session_id,
          v_driver_id,
          v_campaign_id,
          ST_SetSRID(ST_MakePoint(v_lon, v_lat), 4326)::geography,
          (20 + random() * 60)::NUMERIC(5,2),
          (3 + random() * 12)::NUMERIC(6,2),
          (random() * 360)::NUMERIC(5,2),
          (0.2 + random() * 0.8)::NUMERIC(3,2),
          v_recorded_at
        ) ON CONFLICT DO NOTHING;

      END LOOP; -- punkty

    END LOOP; -- sesje
  END LOOP; -- kierowcy

  -- -----------------------------------------------------------------------
  -- Wypłaty historyczne (dla aktywnych kierowców)
  -- -----------------------------------------------------------------------
  FOR i IN 1..8 LOOP
    INSERT INTO payouts (
      driver_id, campaign_id,
      period_start, period_end,
      total_km, amount_grosze, within_guarantee,
      stripe_transfer_id, status, paid_at
    ) VALUES (
      d_ids[i + 5],
      camp_ids[1],
      '2026-01-01', '2026-01-31',
      (1200 + random() * 800)::NUMERIC(10,2),
      (150000 + floor(random() * 100000))::BIGINT,
      random() > 0.2,
      'tr_seed_' || lpad((i * 1337)::text, 8, '0'),
      'paid',
      now() - ((8 - i) * INTERVAL '5 days')
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  -- -----------------------------------------------------------------------
  -- Przykładowe zdarzenia Stripe
  -- -----------------------------------------------------------------------
  INSERT INTO stripe_events (id, type, payload, processed_at) VALUES
    ('evt_seed_001', 'payment_intent.succeeded',
     '{"amount": 29900, "currency": "pln", "subscription": "sub_seed_001"}'::jsonb,
     now() - INTERVAL '30 days'),
    ('evt_seed_002', 'customer.subscription.updated',
     '{"subscription_id": "sub_seed_002", "status": "active"}'::jsonb,
     now() - INTERVAL '20 days'),
    ('evt_seed_003', 'transfer.created',
     '{"amount": 150000, "destination": "acct_seed_0006", "transfer_id": "tr_seed_0008381"}'::jsonb,
     now() - INTERVAL '5 days')
  ON CONFLICT (id) DO NOTHING;

  -- -----------------------------------------------------------------------
  -- Odświeżenie statystyk sesji dla seeda
  -- -----------------------------------------------------------------------
  UPDATE gps_sessions s
  SET
    total_points     = (SELECT COUNT(*) FROM gps_points WHERE session_id = s.id),
    total_distance_m = COALESCE((
      SELECT ST_Length(ST_MakeLine(location::geometry ORDER BY recorded_at)::geography)::INT
      FROM gps_points WHERE session_id = s.id
    ), 0),
    avg_speed_kmh    = (SELECT AVG(speed_kmh)::NUMERIC(5,2) FROM gps_points WHERE session_id = s.id)
  WHERE total_points = 0;

  RAISE NOTICE 'Seed deweloperski załadowany pomyślnie.';
  RAISE NOTICE 'Liczba punktów GPS: %', (SELECT COUNT(*) FROM gps_points);
  RAISE NOTICE 'Liczba sesji GPS: %',   (SELECT COUNT(*) FROM gps_sessions);
  RAISE NOTICE 'Liczba kierowców: %',   (SELECT COUNT(*) FROM drivers);

END $$;

-- Odświeżenie widoków zmaterializowanych po załadowaniu seeda
REFRESH MATERIALIZED VIEW mv_driver_monthly_stats;
REFRESH MATERIALIZED VIEW mv_campaign_dashboard;
REFRESH MATERIALIZED VIEW mv_district_exposure;
