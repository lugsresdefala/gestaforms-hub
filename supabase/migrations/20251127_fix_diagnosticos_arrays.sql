-- ============================================================================
-- Migration: Fix Diagnosis Columns to Native PostgreSQL Arrays
-- Date: 2025-11-27
-- Purpose: Convert TEXT columns to TEXT[] for proper semantic storage
-- ============================================================================

-- PART 1: Add temporary columns with correct type
ALTER TABLE public.agendamentos_obst 
  ADD COLUMN diagnosticos_maternos_new TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN diagnosticos_fetais_new TEXT[] DEFAULT ARRAY[]::TEXT[];

-- PART 2: Migrate existing data with error handling
UPDATE public.agendamentos_obst
SET 
  diagnosticos_maternos_new = CASE 
    WHEN diagnosticos_maternos IS NULL OR diagnosticos_maternos = '' OR diagnosticos_maternos = 'null' THEN 
      ARRAY[]::TEXT[]
    WHEN diagnosticos_maternos LIKE '[%]' OR diagnosticos_maternos LIKE '{%}' THEN 
      -- Parse JSON arrays safely
      COALESCE(
        (SELECT ARRAY(SELECT json_array_elements_text(diagnosticos_maternos::json))),
        ARRAY[diagnosticos_maternos]
      )
    ELSE 
      -- Single string value or comma-separated
      string_to_array(diagnosticos_maternos, ',')
  END,
  diagnosticos_fetais_new = CASE 
    WHEN diagnosticos_fetais IS NULL OR diagnosticos_fetais = '' OR diagnosticos_fetais = 'null' THEN 
      ARRAY[]::TEXT[]
    WHEN diagnosticos_fetais LIKE '[%]' OR diagnosticos_fetais LIKE '{%}' THEN 
      COALESCE(
        (SELECT ARRAY(SELECT json_array_elements_text(diagnosticos_fetais::json))),
        ARRAY[diagnosticos_fetais]
      )
    ELSE 
      string_to_array(diagnosticos_fetais, ',')
  END;

-- PART 3: Drop old columns and rename
ALTER TABLE public.agendamentos_obst 
  DROP COLUMN diagnosticos_maternos,
  DROP COLUMN diagnosticos_fetais;

ALTER TABLE public.agendamentos_obst 
  RENAME COLUMN diagnosticos_maternos_new TO diagnosticos_maternos;

ALTER TABLE public.agendamentos_obst 
  RENAME COLUMN diagnosticos_fetais_new TO diagnosticos_fetais;

-- PART 4: Add constraints and indexes
ALTER TABLE public.agendamentos_obst 
  ALTER COLUMN diagnosticos_maternos SET NOT NULL,
  ALTER COLUMN diagnosticos_fetais SET NOT NULL;

-- GIN indexes for efficient array searches
CREATE INDEX idx_agendamentos_diagnosticos_maternos_gin 
  ON public.agendamentos_obst USING GIN (diagnosticos_maternos);

CREATE INDEX idx_agendamentos_diagnosticos_fetais_gin 
  ON public.agendamentos_obst USING GIN (diagnosticos_fetais);

-- PART 5: Update comments
COMMENT ON COLUMN public.agendamentos_obst.diagnosticos_maternos IS 
  'Array de diagnósticos maternos. Use ARRAY[] para casos sem diagnósticos aplicáveis.';

COMMENT ON COLUMN public.agendamentos_obst.diagnosticos_fetais IS 
  'Array de diagnósticos fetais. Use ARRAY[] para casos sem diagnósticos aplicáveis.';
