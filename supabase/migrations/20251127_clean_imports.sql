/*
 * Migration: Clean Import Data and Add Audit View
 * Date: 2025-11-27
 *
 * PURPOSE:
 * This migration addresses data quality issues in the import pipeline:
 * 1. Replaces placeholder dates (year < 1920, 1900, 0000) with NULL
 * 2. Trims whitespace from relevant columns
 * 3. Creates an audit view for deterministic IG/DPP calculation
 *
 * BEFORE RUNNING:
 * 1. Backup your database
 * 2. Review the tables affected (agendamentos_obst, staging_forms if exists)
 * 3. Test in a non-production environment first
 *
 * USAGE:
 *   supabase db push
 *   -- or --
 *   psql -d your_database -f 20251127_clean_imports.sql
 *
 * ROLLBACK:
 * This migration modifies data. To rollback, restore from backup.
 * The view can be dropped with: DROP VIEW IF EXISTS vw_staging_with_dpp;
 *
 * NOTE:
 * - The staging_forms table name is assumed; adjust if your table has a different name
 * - After running this migration, reprocess imports using the importSanitizer utility
 * - All future imports should use importSanitizer.chooseAndCompute() before persisting
 */

-- =============================================================================
-- PART 1: Clean placeholder dates in agendamentos_obst
-- =============================================================================

-- Update data_dum: set to NULL if year < 1920 (placeholder detection)
UPDATE agendamentos_obst
SET data_dum = NULL
WHERE data_dum IS NOT NULL
  AND (
    EXTRACT(YEAR FROM data_dum) < 1920
    OR EXTRACT(YEAR FROM data_dum) = 1900
  );

-- Update data_primeiro_usg: set to NULL if year < 1920
UPDATE agendamentos_obst
SET data_primeiro_usg = NULL
WHERE data_primeiro_usg IS NOT NULL
  AND (
    EXTRACT(YEAR FROM data_primeiro_usg) < 1920
    OR EXTRACT(YEAR FROM data_primeiro_usg) = 1900
  );

-- Update data_nascimento: set to NULL if year < 1920 (unlikely valid)
UPDATE agendamentos_obst
SET data_nascimento = NULL
WHERE data_nascimento IS NOT NULL
  AND EXTRACT(YEAR FROM data_nascimento) < 1920;

-- =============================================================================
-- PART 2: Trim whitespace from text columns
-- =============================================================================

UPDATE agendamentos_obst
SET 
  dum_status = TRIM(dum_status),
  diagnosticos_maternos = TRIM(diagnosticos_maternos),
  diagnosticos_fetais = TRIM(diagnosticos_fetais),
  diagnostico_livre = TRIM(diagnostico_livre),
  indicacao_procedimento = TRIM(indicacao_procedimento)
WHERE 
  dum_status IS NOT NULL
  OR diagnosticos_maternos IS NOT NULL
  OR diagnosticos_fetais IS NOT NULL
  OR diagnostico_livre IS NOT NULL
  OR indicacao_procedimento IS NOT NULL;

-- =============================================================================
-- PART 3: Handle staging_forms table (if exists)
-- =============================================================================

-- Check if staging_forms exists and clean it
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'staging_forms'
  ) THEN
    -- Clean placeholder dates in staging_forms
    EXECUTE '
      UPDATE staging_forms
      SET data_dum = NULL
      WHERE data_dum IS NOT NULL
        AND (
          data_dum::text LIKE ''%1900%''
          OR data_dum::text LIKE ''%0000%''
        );
    ';
    
    EXECUTE '
      UPDATE staging_forms
      SET data_primeiro_usg = NULL
      WHERE data_primeiro_usg IS NOT NULL
        AND (
          data_primeiro_usg::text LIKE ''%1900%''
          OR data_primeiro_usg::text LIKE ''%0000%''
        );
    ';

    RAISE NOTICE 'staging_forms table cleaned';
  ELSE
    RAISE NOTICE 'staging_forms table does not exist, skipping';
  END IF;
END $$;

-- =============================================================================
-- PART 4: Create audit view for deterministic IG/DPP calculation
-- =============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS vw_staging_with_dpp;

-- Create view that demonstrates deterministic calculation logic
-- This view shows the calculation source (DUM or USG) and computed values
CREATE VIEW vw_staging_with_dpp AS
SELECT
  a.id,
  a.carteirinha,
  a.nome_completo,
  a.data_nascimento,
  a.maternidade,
  a.status,
  a.created_at,
  
  -- DUM data
  a.data_dum,
  a.dum_status,
  
  -- USG data
  a.data_primeiro_usg,
  a.semanas_usg,
  a.dias_usg,
  
  -- Determine calculation source
  CASE
    WHEN a.data_dum IS NOT NULL 
         AND a.dum_status IS NOT NULL
         AND (
           LOWER(a.dum_status) LIKE '%confiavel%'
           OR LOWER(a.dum_status) LIKE '%confiável%'
           OR LOWER(a.dum_status) LIKE '%certa%'
           OR LOWER(a.dum_status) LIKE '%sim%'
         )
    THEN 'DUM'
    WHEN a.data_primeiro_usg IS NOT NULL
         AND (COALESCE(a.semanas_usg, 0) > 0 OR COALESCE(a.dias_usg, 0) > 0)
    THEN 'USG'
    ELSE 'INVALID'
  END AS ga_source,
  
  -- Calculate gestational age in days based on source
  CASE
    -- Using DUM
    WHEN a.data_dum IS NOT NULL 
         AND a.dum_status IS NOT NULL
         AND (
           LOWER(a.dum_status) LIKE '%confiavel%'
           OR LOWER(a.dum_status) LIKE '%confiável%'
           OR LOWER(a.dum_status) LIKE '%certa%'
           OR LOWER(a.dum_status) LIKE '%sim%'
         )
    THEN (CURRENT_DATE - a.data_dum)
    
    -- Using USG
    WHEN a.data_primeiro_usg IS NOT NULL
         AND (COALESCE(a.semanas_usg, 0) > 0 OR COALESCE(a.dias_usg, 0) > 0)
    THEN (
      (COALESCE(a.semanas_usg, 0) * 7 + COALESCE(a.dias_usg, 0))
      + (CURRENT_DATE - a.data_primeiro_usg)
    )
    
    ELSE NULL
  END AS ga_days_calculated,
  
  -- Calculate gestational age weeks component
  CASE
    WHEN a.data_dum IS NOT NULL 
         AND a.dum_status IS NOT NULL
         AND (
           LOWER(a.dum_status) LIKE '%confiavel%'
           OR LOWER(a.dum_status) LIKE '%confiável%'
           OR LOWER(a.dum_status) LIKE '%certa%'
           OR LOWER(a.dum_status) LIKE '%sim%'
         )
    THEN FLOOR((CURRENT_DATE - a.data_dum) / 7)::INTEGER
    
    WHEN a.data_primeiro_usg IS NOT NULL
         AND (COALESCE(a.semanas_usg, 0) > 0 OR COALESCE(a.dias_usg, 0) > 0)
    THEN FLOOR((
      (COALESCE(a.semanas_usg, 0) * 7 + COALESCE(a.dias_usg, 0))
      + (CURRENT_DATE - a.data_primeiro_usg)
    ) / 7)::INTEGER
    
    ELSE NULL
  END AS ga_weeks_calculated,
  
  -- Calculate gestational age days remainder
  CASE
    WHEN a.data_dum IS NOT NULL 
         AND a.dum_status IS NOT NULL
         AND (
           LOWER(a.dum_status) LIKE '%confiavel%'
           OR LOWER(a.dum_status) LIKE '%confiável%'
           OR LOWER(a.dum_status) LIKE '%certa%'
           OR LOWER(a.dum_status) LIKE '%sim%'
         )
    THEN MOD((CURRENT_DATE - a.data_dum), 7)::INTEGER
    
    WHEN a.data_primeiro_usg IS NOT NULL
         AND (COALESCE(a.semanas_usg, 0) > 0 OR COALESCE(a.dias_usg, 0) > 0)
    THEN MOD((
      (COALESCE(a.semanas_usg, 0) * 7 + COALESCE(a.dias_usg, 0))
      + (CURRENT_DATE - a.data_primeiro_usg)
    ), 7)::INTEGER
    
    ELSE NULL
  END AS ga_days_rem_calculated,
  
  -- Calculate DPP (due date) = reference + (280 - current_ga_days)
  CASE
    -- Using DUM: DPP = DUM + 280 days
    WHEN a.data_dum IS NOT NULL 
         AND a.dum_status IS NOT NULL
         AND (
           LOWER(a.dum_status) LIKE '%confiavel%'
           OR LOWER(a.dum_status) LIKE '%confiável%'
           OR LOWER(a.dum_status) LIKE '%certa%'
           OR LOWER(a.dum_status) LIKE '%sim%'
         )
    THEN a.data_dum + INTERVAL '280 days'
    
    -- Using USG: DPP = today + (280 - current_ga_days)
    WHEN a.data_primeiro_usg IS NOT NULL
         AND (COALESCE(a.semanas_usg, 0) > 0 OR COALESCE(a.dias_usg, 0) > 0)
    THEN CURRENT_DATE + (
      280 - (
        (COALESCE(a.semanas_usg, 0) * 7 + COALESCE(a.dias_usg, 0))
        + (CURRENT_DATE - a.data_primeiro_usg)
      )
    )
    
    ELSE NULL
  END AS dpp_calculated,
  
  -- Current stored values for comparison
  a.idade_gestacional_calculada AS idade_gestacional_stored,
  a.data_agendamento_calculada,
  
  -- Calculation reason/audit
  CASE
    WHEN a.data_dum IS NOT NULL 
         AND a.dum_status IS NOT NULL
         AND (
           LOWER(a.dum_status) LIKE '%confiavel%'
           OR LOWER(a.dum_status) LIKE '%confiável%'
           OR LOWER(a.dum_status) LIKE '%certa%'
           OR LOWER(a.dum_status) LIKE '%sim%'
         )
    THEN 'IG calculada a partir da DUM confiável'
    
    WHEN a.data_primeiro_usg IS NOT NULL
         AND (COALESCE(a.semanas_usg, 0) > 0 OR COALESCE(a.dias_usg, 0) > 0)
         AND a.data_dum IS NULL
    THEN 'DUM não disponível, utilizando USG'
    
    WHEN a.data_primeiro_usg IS NOT NULL
         AND (COALESCE(a.semanas_usg, 0) > 0 OR COALESCE(a.dias_usg, 0) > 0)
         AND a.data_dum IS NOT NULL
         AND (
           a.dum_status IS NULL
           OR NOT (
             LOWER(a.dum_status) LIKE '%confiavel%'
             OR LOWER(a.dum_status) LIKE '%confiável%'
             OR LOWER(a.dum_status) LIKE '%certa%'
             OR LOWER(a.dum_status) LIKE '%sim%'
           )
         )
    THEN 'DUM não confiável, utilizando USG'
    
    WHEN a.data_dum IS NULL AND a.data_primeiro_usg IS NULL
    THEN 'Nenhuma fonte de data disponível'
    
    WHEN a.data_primeiro_usg IS NOT NULL
         AND COALESCE(a.semanas_usg, 0) = 0 
         AND COALESCE(a.dias_usg, 0) = 0
    THEN 'USG presente mas sem IG informada'
    
    ELSE 'Não foi possível determinar fonte'
  END AS ga_calculation_reason

FROM agendamentos_obst a;

-- Add comment to the view for documentation
COMMENT ON VIEW vw_staging_with_dpp IS 
'Audit view for gestational age (IG) and due date (DPP) calculation.
Shows the deterministic calculation logic applied to each record.
Use this view to audit imports and identify records with calculation issues.

Columns:
- ga_source: DUM, USG, or INVALID
- ga_days_calculated: Total gestational age in days
- ga_weeks_calculated: Weeks component of GA
- ga_days_rem_calculated: Days remainder (0-6)
- dpp_calculated: Calculated due date (DPP)
- ga_calculation_reason: Human-readable explanation

Note: This view uses CURRENT_DATE, so results change daily.';

-- =============================================================================
-- PART 5: Create index for audit queries (optional but recommended)
-- =============================================================================

-- Index for faster filtering by source type (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'agendamentos_obst' 
    AND indexname = 'idx_agendamentos_dum_usg_audit'
  ) THEN
    CREATE INDEX idx_agendamentos_dum_usg_audit 
    ON agendamentos_obst (data_dum, data_primeiro_usg, dum_status);
    RAISE NOTICE 'Created index idx_agendamentos_dum_usg_audit';
  END IF;
END $$;

-- =============================================================================
-- VERIFICATION QUERIES (run manually to verify migration)
-- =============================================================================

-- Uncomment to run verification:

-- Count records by calculation source:
-- SELECT ga_source, COUNT(*) FROM vw_staging_with_dpp GROUP BY ga_source;

-- Find records with discrepancies between stored and calculated values:
-- SELECT * FROM vw_staging_with_dpp 
-- WHERE ga_source != 'INVALID' 
-- AND idade_gestacional_stored IS NOT NULL
-- AND idade_gestacional_stored != (ga_weeks_calculated || ' semanas e ' || ga_days_rem_calculated || ' dias');

-- Find records with placeholder dates that were cleaned:
-- SELECT COUNT(*) FROM agendamentos_obst WHERE data_dum IS NULL AND dum_status IS NOT NULL;
