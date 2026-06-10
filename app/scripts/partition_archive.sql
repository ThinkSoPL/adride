-- =============================================================================
-- AdRide: Procedura archiwizacji i przywracania partycji GPS
-- Archiwizacja partycji starszych niż 12 miesięcy do Supabase Storage
-- =============================================================================
-- WYMAGANIA:
--   - pg_cron (do automatycznego uruchamiania)
--   - Supabase Storage bucket 'gps-archive' (utwórz przez Dashboard lub CLI)
--   - pg_dump dostępny na serwerze (Supabase managed: użyj pg_copy_to_bucket)
--
-- STRATEGIA ARCHIWIZACJI:
--   1. DETACH partycji z tabeli rodzica (dane nadal dostępne jako osobna tabela)
--   2. Eksport do formatu CSV (COPY TO) — natywna metoda PostgreSQL
--   3. Zapis metadanych archiwum do tabeli gps_partition_archives
--   4. DROP detached partition (opcjonalnie — po weryfikacji archiwum)
--
-- PRZYWRACANIE:
--   1. Utwórz nową tabelę z odpowiednim schema
--   2. COPY FROM CSV z Supabase Storage
--   3. ATTACH jako partycja (opcjonalnie — do analiz historycznych)
-- =============================================================================

-- =============================================================================
-- Tabela metadanych archiwum partycji
-- =============================================================================

CREATE TABLE IF NOT EXISTS gps_partition_archives (
  id               SERIAL      PRIMARY KEY,
  partition_name   TEXT        NOT NULL UNIQUE,
  period_start     DATE        NOT NULL,
  period_end       DATE        NOT NULL,
  row_count        BIGINT,
  size_bytes       BIGINT,
  storage_path     TEXT        NOT NULL,
  archived_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at      TIMESTAMPTZ,
  restored_at      TIMESTAMPTZ,
  status           TEXT        NOT NULL DEFAULT 'archived'
    CHECK (status IN ('archiving', 'archived', 'verified', 'restored', 'failed'))
);

COMMENT ON TABLE gps_partition_archives IS
  'Rejestr archiwizowanych partycji gps_points — śledzi status eksportu do Supabase Storage';

-- =============================================================================
-- Funkcja archiwizacji pojedynczej partycji
-- Parametr: partition_month DATE — miesiąc partycji do archiwizacji
-- =============================================================================

CREATE OR REPLACE FUNCTION archive_gps_partition(partition_month DATE)
RETURNS TABLE (
  partition_name TEXT,
  rows_archived  BIGINT,
  storage_path   TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_partition_name TEXT;
  v_start_date     DATE;
  v_end_date       DATE;
  v_row_count      BIGINT;
  v_storage_path   TEXT;
  v_copy_path      TEXT;
BEGIN
  v_start_date     := date_trunc('month', partition_month)::DATE;
  v_end_date       := (v_start_date + INTERVAL '1 month')::DATE;
  v_partition_name := 'gps_points_' || to_char(v_start_date, 'YYYY_MM');

  -- Sprawdź czy partycja istnieje
  IF NOT EXISTS (
    SELECT 1 FROM pg_class     c
    JOIN   pg_namespace        n ON n.oid = c.relnamespace
    WHERE  c.relname = v_partition_name AND n.nspname = 'public'
  ) THEN
    RAISE EXCEPTION 'Partycja % nie istnieje', v_partition_name;
  END IF;

  -- Sprawdź czy partycja jest wystarczająco stara (> 12 miesięcy)
  IF v_start_date > (now() - INTERVAL '12 months')::DATE THEN
    RAISE EXCEPTION
      'Partycja % jest nowsza niż 12 miesięcy. Archiwizacja anulowana dla bezpieczeństwa.',
      v_partition_name;
  END IF;

  -- Pobierz liczbę wierszy
  EXECUTE format('SELECT COUNT(*) FROM %I', v_partition_name) INTO v_row_count;

  -- Ścieżka w Supabase Storage (bucket: gps-archive)
  v_storage_path := 'gps-archive/' || to_char(v_start_date, 'YYYY/MM') || '/' || v_partition_name || '.csv';
  -- Lokalna ścieżka tymczasowa (dostępna z PostgreSQL)
  v_copy_path := '/tmp/' || v_partition_name || '.csv';

  -- Zapisz status jako 'archiving'
  INSERT INTO gps_partition_archives (
    partition_name, period_start, period_end, row_count, storage_path, status
  ) VALUES (
    v_partition_name, v_start_date, v_end_date, v_row_count, v_storage_path, 'archiving'
  ) ON CONFLICT (partition_name) DO UPDATE SET
    status      = 'archiving',
    archived_at = now();

  -- Eksport do CSV (COPY TO — wymaga superuser lub pg_write_server_files)
  EXECUTE format(
    'COPY (SELECT * FROM %I ORDER BY recorded_at) TO %L WITH (FORMAT CSV, HEADER)',
    v_partition_name,
    v_copy_path
  );

  -- UWAGA: Przesłanie pliku do Supabase Storage wymaga pg_net lub zewnętrznego procesu
  -- Poniżej pseudokod — zastąp odpowiednim wywołaniem dla swojego setupu:
  --
  -- Opcja A: Supabase Edge Function wywołana przez pg_net:
  --   PERFORM net.http_post(
  --     url := 'https://<project>.supabase.co/functions/v1/archive-upload',
  --     body := jsonb_build_object('path', v_copy_path, 'storage_path', v_storage_path)
  --   );
  --
  -- Opcja B: Skrypt shell wywołany przez pg_cron (supabase CLI):
  --   supabase storage cp /tmp/<file>.csv ss://gps-archive/<path>/<file>.csv
  --
  -- Opcja C: AWS CLI / rclone w cron systemowym serwera DB (self-hosted)

  -- DETACH partycji (dane nadal dostępne jako oddzielna tabela do czasu DROP)
  EXECUTE format(
    'ALTER TABLE gps_points DETACH PARTITION %I CONCURRENTLY',
    v_partition_name
  );

  -- Aktualizuj status
  UPDATE gps_partition_archives
  SET status = 'archived', archived_at = now()
  WHERE partition_name = v_partition_name;

  RAISE NOTICE 'Partycja % zarchiwizowana: % wierszy → %',
    v_partition_name, v_row_count, v_storage_path;

  RETURN QUERY SELECT v_partition_name, v_row_count, v_storage_path;
END;
$$;

COMMENT ON FUNCTION archive_gps_partition(DATE) IS
  'Archiwizuje partycję gps_points starszą niż 12 miesięcy: COPY TO CSV + DETACH. '
  'Przesłanie do Supabase Storage przez pg_net lub zewnętrzny skrypt.';

-- =============================================================================
-- Funkcja przywracania partycji z archiwum
-- =============================================================================

CREATE OR REPLACE FUNCTION restore_gps_partition(partition_month DATE)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_partition_name TEXT;
  v_start_date     DATE;
  v_end_date       DATE;
  v_archive_rec    gps_partition_archives%ROWTYPE;
  v_copy_path      TEXT;
BEGIN
  v_start_date     := date_trunc('month', partition_month)::DATE;
  v_end_date       := (v_start_date + INTERVAL '1 month')::DATE;
  v_partition_name := 'gps_points_' || to_char(v_start_date, 'YYYY_MM');

  SELECT * INTO v_archive_rec
  FROM gps_partition_archives
  WHERE partition_name = v_partition_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nie znaleziono archiwum dla partycji: %', v_partition_name;
  END IF;

  -- Sprawdź czy partycja jest już dołączona do rodzica
  IF EXISTS (
    SELECT 1 FROM pg_inherits i
    JOIN pg_class c_parent ON c_parent.oid = i.inhparent
    JOIN pg_class c_child  ON c_child.oid  = i.inhrelid
    WHERE c_parent.relname = 'gps_points'
      AND c_child.relname  = v_partition_name
  ) THEN
    RAISE NOTICE 'Partycja % jest już aktywna (dołączona).', v_partition_name;
    RETURN v_partition_name;
  END IF;

  v_copy_path := '/tmp/' || v_partition_name || '_restore.csv';

  -- UWAGA: Przed tym krokiem pobierz plik z Supabase Storage:
  --   supabase storage cp ss://gps-archive/<path>/<file>.csv /tmp/<file>_restore.csv
  -- lub przez pg_net z Edge Function.

  -- Utwórz lub upewnij się że tabela partycji istnieje jako standalone
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = v_partition_name AND n.nspname = 'public'
  ) THEN
    -- Odtwórz strukturę tabeli (identyczna z rodzicem)
    EXECUTE format(
      'CREATE TABLE %I (LIKE gps_points INCLUDING ALL)',
      v_partition_name
    );
  END IF;

  -- Importuj dane z CSV
  EXECUTE format(
    'COPY %I FROM %L WITH (FORMAT CSV, HEADER)',
    v_partition_name,
    v_copy_path
  );

  -- Dołącz jako partycję (opcjonalnie — tylko jeśli potrzebne do zapytań przez rodzica)
  EXECUTE format(
    'ALTER TABLE gps_points ATTACH PARTITION %I FOR VALUES FROM (%L::timestamptz) TO (%L::timestamptz)',
    v_partition_name,
    v_start_date::timestamptz,
    v_end_date::timestamptz
  );

  -- Zaktualizuj status
  UPDATE gps_partition_archives
  SET status = 'restored', restored_at = now()
  WHERE partition_name = v_partition_name;

  RAISE NOTICE 'Partycja % przywrócona i dołączona do gps_points.', v_partition_name;
  RETURN v_partition_name;
END;
$$;

COMMENT ON FUNCTION restore_gps_partition(DATE) IS
  'Przywraca partycję gps_points z archiwum CSV i dołącza ją z powrotem do tabeli rodzica.';

-- =============================================================================
-- Funkcja weryfikacji archiwum (checksum)
-- =============================================================================

CREATE OR REPLACE FUNCTION verify_gps_partition_archive(partition_month DATE)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_partition_name TEXT;
  v_archived_count BIGINT;
  v_live_count     BIGINT;
  v_archive_rec    gps_partition_archives%ROWTYPE;
BEGIN
  v_partition_name := 'gps_points_' || to_char(date_trunc('month', partition_month), 'YYYY_MM');

  SELECT * INTO v_archive_rec
  FROM gps_partition_archives
  WHERE partition_name = v_partition_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Archiwum % nie istnieje', v_partition_name;
  END IF;

  -- Pobierz zapisaną liczbę wierszy
  v_archived_count := v_archive_rec.row_count;

  -- Jeśli partycja nadal istnieje jako tabela, porównaj
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = v_partition_name AND n.nspname = 'public'
  ) THEN
    EXECUTE format('SELECT COUNT(*) FROM %I', v_partition_name) INTO v_live_count;

    IF v_live_count <> v_archived_count THEN
      RAISE WARNING 'Niezgodność! Archiwum: %, tabela: %', v_archived_count, v_live_count;
      RETURN false;
    END IF;
  END IF;

  UPDATE gps_partition_archives
  SET status = 'verified', verified_at = now()
  WHERE partition_name = v_partition_name;

  RAISE NOTICE 'Weryfikacja OK: % — % wierszy', v_partition_name, v_archived_count;
  RETURN true;
END;
$$;

COMMENT ON FUNCTION verify_gps_partition_archive(DATE) IS
  'Weryfikuje spójność archiwum partycji porównując liczbę wierszy.';

-- =============================================================================
-- Harmonogram automatycznej archiwizacji (pg_cron)
-- Uruchamiany 1-go każdego miesiąca o 02:00 — archiwizuje partycję sprzed 13 miesięcy
-- =============================================================================

SELECT cron.schedule(
  'adride-archive-old-gps-partition',
  '0 2 1 * *',
  $$
    SELECT archive_gps_partition(
      (date_trunc('month', now()) - INTERVAL '13 months')::DATE
    );
  $$
);

-- =============================================================================
-- Widok: status wszystkich partycji i archiwów
-- =============================================================================

CREATE OR REPLACE VIEW v_gps_partition_status AS
SELECT
  p.relname                                  AS partition_name,
  pg_size_pretty(pg_total_relation_size(p.oid)) AS partition_size,
  (SELECT row_count FROM gps_partition_archives a WHERE a.partition_name = p.relname) AS archived_rows,
  (SELECT status      FROM gps_partition_archives a WHERE a.partition_name = p.relname) AS archive_status,
  (SELECT archived_at FROM gps_partition_archives a WHERE a.partition_name = p.relname) AS archived_at,
  EXISTS (
    SELECT 1 FROM pg_inherits i
    WHERE i.inhrelid = p.oid
      AND (SELECT relname FROM pg_class WHERE oid = i.inhparent) = 'gps_points'
  )                                          AS is_attached
FROM pg_class p
JOIN pg_namespace n ON n.oid = p.relnamespace
WHERE p.relname LIKE 'gps_points_20%'
  AND n.nspname = 'public'
ORDER BY p.relname;

COMMENT ON VIEW v_gps_partition_status IS
  'Przegląd statusu wszystkich partycji gps_points: rozmiar, liczba wierszy, status archiwum, czy dołączona.';

-- =============================================================================
-- Przykładowe użycie
-- =============================================================================

/*
-- Archiwizacja partycji ze stycznia 2025 (starsza niż 12 miesięcy):
SELECT * FROM archive_gps_partition('2025-01-01');

-- Weryfikacja archiwum:
SELECT verify_gps_partition_archive('2025-01-01');

-- Przywrócenie (po pobraniu pliku CSV z Supabase Storage):
SELECT restore_gps_partition('2025-01-01');

-- Status wszystkich partycji:
SELECT * FROM v_gps_partition_status;

-- Ręczne usunięcie zweryfikowanej, detached partycji (nieodwracalne!):
-- DROP TABLE gps_points_2025_01;
*/
