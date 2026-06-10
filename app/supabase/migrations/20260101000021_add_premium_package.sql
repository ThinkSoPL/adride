-- =============================================================================
-- AdRide: Dodanie pakietu PREMIUM do enuma campaign_package
-- Pakiet PREMIUM (Miasto): 15+ pojazdów, 12 mc min., 33 000 zł/mc
-- Zgodny z regulaminem i cennikiem (_materialy/regulamin-adride-pl.md)
-- =============================================================================

-- ALTER TYPE ... ADD VALUE nie może działać w bloku transakcyjnym z użyciem
-- nowej wartości w tej samej migracji — dodanie wartości jest jednak bezpieczne
-- i idempotentne dzięki IF NOT EXISTS (PostgreSQL 12+).
ALTER TYPE campaign_package ADD VALUE IF NOT EXISTS 'PREMIUM';

COMMENT ON TYPE campaign_package IS 'Pakiet cenowy kampanii: START (3 auta), SCALE (7+ aut), PREMIUM (15+ aut)';
