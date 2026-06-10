-- =============================================================================
-- AdRide: Rozszerzenia PostgreSQL
-- =============================================================================

-- Obsługa danych geograficznych i geometrycznych (PostGIS)
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;

-- Funkcje kryptograficzne (UUID v4, hashing, generowanie losowych danych)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- Harmonogramowanie zadań cron wewnątrz bazy danych
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA cron;

-- Statystyki wykonywanych zapytań SQL (monitoring wydajności)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;

COMMENT ON EXTENSION postgis IS 'Obsługa danych geograficznych (geometrie, projekcje, indeksy przestrzenne)';
COMMENT ON EXTENSION pgcrypto IS 'Funkcje kryptograficzne: gen_random_bytes, gen_random_uuid, crypt';
COMMENT ON EXTENSION pg_cron IS 'Harmonogram zadań cron wykonywanych przez PostgreSQL (odświeżanie widoków, partycje)';
COMMENT ON EXTENSION pg_stat_statements IS 'Śledzenie statystyk zapytań SQL dla optymalizacji wydajności';
