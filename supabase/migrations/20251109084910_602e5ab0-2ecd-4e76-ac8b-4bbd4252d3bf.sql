-- Adicionar colunas para capacidade por tipo de dia
ALTER TABLE capacidade_maternidades 
ADD COLUMN vagas_dia_util INTEGER NOT NULL DEFAULT 3,
ADD COLUMN vagas_sabado INTEGER NOT NULL DEFAULT 1,
ADD COLUMN vagas_domingo INTEGER NOT NULL DEFAULT 0;

-- Configurar capacidades específicas para cada maternidade
UPDATE capacidade_maternidades SET vagas_dia_util = 3, vagas_sabado = 1, vagas_domingo = 0 WHERE maternidade = 'Cruzeiro';
UPDATE capacidade_maternidades SET vagas_dia_util = 2, vagas_sabado = 1, vagas_domingo = 0 WHERE maternidade = 'Guarulhos';
UPDATE capacidade_maternidades SET vagas_dia_util = 6, vagas_sabado = 1, vagas_domingo = 0 WHERE maternidade = 'Notrecare';
UPDATE capacidade_maternidades SET vagas_dia_util = 9, vagas_sabado = 1, vagas_domingo = 0 WHERE maternidade = 'Salvalus';

-- Adicionar comentários explicativos
COMMENT ON COLUMN capacidade_maternidades.vagas_dia_util IS 'Número máximo de vagas em dias úteis (segunda a sexta)';
COMMENT ON COLUMN capacidade_maternidades.vagas_sabado IS 'Número máximo de vagas aos sábados';
COMMENT ON COLUMN capacidade_maternidades.vagas_domingo IS 'Número máximo de vagas aos domingos';