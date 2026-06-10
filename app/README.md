# AdRide — Schemat bazy danych

Fleet advertising platform: kierowcy oklejają auta, reklamodawcy płacą za ekspozycję, GPS śledzi przebieg.

## Szybki start

```bash
# Lokalne środowisko Supabase
supabase start
supabase db reset   # czyści i uruchamia wszystkie migracje
supabase db push    # pushuje do projektu Supabase

# Weryfikacja
psql $DATABASE_URL -c "SELECT COUNT(*) FROM gps_points;"
```

## Struktura migracji

| Plik | Zawartość |
|------|-----------|
| `000001_extensions` | PostGIS, pgcrypto, pg_cron, pg_stat_statements |
| `000002_enums` | Typy: user_role, driver_status, vehicle_status, campaign_package, campaign_status, payout_status |
| `000003_profiles` | Tabela profiles + trigger auth.users → profiles |
| `000004_drivers` | Tabela drivers |
| `000005_advertisers` | Tabela advertisers |
| `000006_vehicles` | Tabela vehicles (z generated column registration_plate_masked) |
| `000007_campaigns` | Tabela campaigns + campaign_vehicles (M:N) |
| `000008_gps_sessions` | Tabela gps_sessions |
| `000009_gps_points` | Tabela gps_points (partycjonowana miesięcznie) + partycje 2026 + pg_cron |
| `000010_payouts` | Tabela payouts (kwoty w groszach BIGINT) |
| `000011_stripe_events` | Tabela stripe_events + audit_log |
| `000012_indexes` | Wszystkie indeksy: BRIN, GiST, B-tree, GIN, partial |
| `000013_functions` | Funkcje: auth helpers, geo agregacje, statystyki, partycje |
| `000014_triggers` | Triggery: updated_at, referral_code, audit, GPS stats enqueue |
| `000015_rls_policies` | Kompletne polityki RLS dla każdej tabeli |
| `000016_views` | Widoki zmaterializowane + harmonogram pg_cron |
| `000017_seed_dev` | Dane deweloperskie: 3 admini, 20 kierowców, 8 reklamodawców, 100k GPS |

---

## ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    auth_users {
        uuid id PK
        text email
        jsonb raw_user_meta_data
    }

    profiles {
        uuid id PK
        user_role role
        text full_name
        text phone
        text language
        text avatar_url
        timestamptz created_at
        timestamptz updated_at
    }

    drivers {
        uuid id PK
        driver_status status
        text city
        text stripe_account_id
        bool stripe_payouts_enabled
        timestamptz kyc_completed_at
        bool bank_account_verified
        text referral_code
        uuid referred_by FK
        text notes
    }

    advertisers {
        uuid id PK
        text company_name
        text vat_id
        jsonb billing_address
        text stripe_customer_id
        text industry
        text[] district_focus
    }

    vehicles {
        uuid id PK
        uuid driver_id FK
        text registration_plate
        text registration_plate_masked
        text make
        text model
        int year
        text color
        int mileage_monthly_estimate
        vehicle_status status
    }

    campaigns {
        uuid id PK
        uuid advertiser_id FK
        text name
        campaign_package package
        campaign_status status
        text stripe_subscription_id
        date start_date
        date end_date
        int min_km_per_vehicle_monthly
        text[] target_districts
        uuid[] vehicle_ids
        text design_artwork_url
    }

    campaign_vehicles {
        uuid campaign_id FK
        uuid vehicle_id FK
        timestamptz assigned_at
        timestamptz removed_at
    }

    gps_sessions {
        uuid id PK
        uuid driver_id FK
        uuid vehicle_id FK
        uuid campaign_id FK
        timestamptz started_at
        timestamptz ended_at
        int total_distance_m
        int total_points
        numeric avg_speed_kmh
        geometry route_geom
        jsonb device_info
    }

    gps_points {
        bigserial id
        uuid session_id FK
        uuid driver_id FK
        uuid campaign_id FK
        geography location
        numeric speed_kmh
        numeric accuracy_m
        numeric heading
        numeric battery_level
        timestamptz recorded_at
    }

    payouts {
        uuid id PK
        uuid driver_id FK
        uuid campaign_id FK
        date period_start
        date period_end
        numeric total_km
        bigint amount_grosze
        bool within_guarantee
        text stripe_transfer_id
        payout_status status
        timestamptz paid_at
    }

    stripe_events {
        text id PK
        text type
        jsonb payload
        timestamptz processed_at
        text processing_error
    }

    audit_log {
        bigserial id PK
        uuid actor_id FK
        text action
        text entity_type
        text entity_id
        jsonb diff
        inet ip
        timestamptz created_at
    }

    warsaw_districts {
        serial id PK
        text name
        geometry geom
    }

    auth_users ||--|| profiles : "1:1 (trigger)"
    profiles   ||--o| drivers      : "1:1"
    profiles   ||--o| advertisers  : "1:1"
    drivers    ||--o{ vehicles     : "1:N"
    drivers    ||--o{ gps_sessions : "1:N"
    drivers    ||--o{ gps_points   : "1:N (denorm)"
    drivers    ||--o{ payouts      : "1:N"
    drivers    }o--o| drivers      : "referral (self)"
    advertisers||--o{ campaigns    : "1:N"
    campaigns  ||--o{ campaign_vehicles : "1:N"
    vehicles   ||--o{ campaign_vehicles : "1:N"
    campaigns  ||--o{ gps_sessions  : "1:N"
    campaigns  ||--o{ gps_points    : "1:N (denorm)"
    campaigns  ||--o{ payouts       : "1:N"
    gps_sessions ||--o{ gps_points  : "1:N"
    profiles   ||--o{ audit_log    : "1:N (actor)"
```

---

## Skala danych

| Metryka | Wartość |
|---------|---------|
| Punkty GPS / kierowca / dzień | ~10 000 |
| Punkty GPS / 100 kierowców / miesiąc | ~30 000 000 |
| Odczyt GPS | co 12 sekund |
| Partycjonowanie | miesięczne (RANGE na `recorded_at`) |
| Archiwizacja | partycje > 12 miesięcy → Supabase Storage |

## Indeksy kluczowe dla wydajności

| Tabela | Indeks | Typ | Cel |
|--------|--------|-----|-----|
| `gps_points` | `idx_gps_points_recorded_at_brin` | BRIN | Range scans na czasie |
| `gps_points` | `idx_gps_points_location_gist` | GiST | Zapytania przestrzenne |
| `gps_points` | `idx_gps_points_driver_recorded` | B-tree | RLS + historia kierowcy |
| `gps_points` | `idx_gps_points_campaign_recorded` | B-tree | Raporty kampanii |
| `gps_sessions` | `idx_gps_sessions_route_geom` | GiST | Heatmapy tras |
| `campaigns` | `idx_campaigns_vehicle_ids` | GIN | `ANY(vehicle_ids)` lookup |

## Bezpieczeństwo (RLS)

- Każda tabela ma `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`
- `service_role` ma `BYPASSRLS` — używany wyłącznie przez backend (Stripe webhooks, cron)
- `anon` nie ma żadnych polityk → zero dostępu
- Denormalizacja `driver_id` i `campaign_id` w `gps_points` eliminuje JOIN w politykach RLS

Szczegóły: [docs/rls-test-matrix.md](docs/rls-test-matrix.md)

## Zadania pg_cron

| Nazwa | Harmonogram | Akcja |
|-------|-------------|-------|
| `adride-create-gps-partition` | `5 0 1 * *` | Tworzy partycję na 2 miesiące do przodu |
| `adride-refresh-driver-monthly-stats` | `0 3 * * *` | Odświeża `mv_driver_monthly_stats` |
| `adride-refresh-campaign-dashboard` | `0 * * * *` | Odświeża `mv_campaign_dashboard` |
| `adride-refresh-district-exposure` | `0 4 * * *` | Odświeża `mv_district_exposure` |
| `adride-archive-old-gps-partition` | `0 2 1 * *` | Archiwizuje partycję sprzed 13 miesięcy |

## Archiwizacja partycji

```sql
-- Archiwizacja partycji starszej niż 12 miesięcy
SELECT * FROM archive_gps_partition('2025-01-01');

-- Weryfikacja
SELECT verify_gps_partition_archive('2025-01-01');

-- Przywracanie
SELECT restore_gps_partition('2025-01-01');

-- Status wszystkich partycji
SELECT * FROM v_gps_partition_status;
```

Szczegóły: [scripts/partition_archive.sql](scripts/partition_archive.sql)

## Benchmark

```bash
psql $DATABASE_URL -f scripts/benchmark.sql
```

Cel: SELECT z `gps_points` dla 1 kierowcy w ostatnich 7 dniach < 100ms przy 30M wierszy.

Szczegóły: [scripts/benchmark.sql](scripts/benchmark.sql)
