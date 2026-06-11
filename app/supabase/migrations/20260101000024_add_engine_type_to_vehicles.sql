-- =============================================================================
-- Add engine_type column to vehicles
-- =============================================================================

ALTER TABLE vehicles
ADD COLUMN engine_type text DEFAULT NULL;

COMMENT ON COLUMN vehicles.engine_type IS
  'Typ silnika pojazdu: Benzyna, Diesel, Hybryda, Plug-in hibryda, Elektryczny, Wodorowy, Inne';

-- Create index for filtering by engine type (dla analityki)
CREATE INDEX idx_vehicles_engine_type ON vehicles (engine_type);
