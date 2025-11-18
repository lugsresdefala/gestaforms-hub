-- ============================================================================
-- SCHEMA DE BANCO DE DADOS - SISTEMA DE AGENDAMENTO OBSTÉTRICO
-- ============================================================================
-- Data: 17/11/2025
-- Versão: 1.0
-- ============================================================================

-- Tabela de Maternidades
CREATE TABLE maternidades (
    id_maternidade SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pacientes
CREATE TABLE pacientes (
    id_paciente SERIAL PRIMARY KEY,
    carteirinha VARCHAR(50) UNIQUE,
    nome_completo VARCHAR(200) NOT NULL,
    data_nascimento DATE,
    telefone VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Dados Obstétricos
CREATE TABLE dados_obstetricos (
    id_dados_obstetricos SERIAL PRIMARY KEY,
    id_paciente INTEGER NOT NULL REFERENCES pacientes(id_paciente),
    dum DATE,
    dum_confiavel BOOLEAN,
    data_primeiro_usg DATE,
    ig_primeiro_usg_semanas INTEGER,
    ig_primeiro_usg_dias INTEGER,
    usg_mais_recente TEXT,
    dpp_dum DATE,
    dpp_usg DATE,
    metodo_datacao VARCHAR(10) CHECK (metodo_datacao IN ('DUM', 'USG')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Diagnósticos
CREATE TABLE diagnosticos (
    id_diagnostico SERIAL PRIMARY KEY,
    id_paciente INTEGER NOT NULL REFERENCES pacientes(id_paciente),
    diagnostico_materno TEXT,
    indicacao_procedimento TEXT,
    procedimento_solicitado VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Agendamentos
CREATE TABLE agendamentos (
    id_agendamento SERIAL PRIMARY KEY,
    id_paciente INTEGER NOT NULL REFERENCES pacientes(id_paciente),
    id_maternidade INTEGER NOT NULL REFERENCES maternidades(id_maternidade),
    data_referencia DATE NOT NULL,
    ig_atual_dias INTEGER,
    ig_atual_semanas INTEGER,
    ig_atual_dias_resto INTEGER,
    ig_recomendada_semanas INTEGER NOT NULL,
    motivo_ig_recomendada VARCHAR(200),
    data_ideal DATE NOT NULL,
    data_agendada DATE,
    ig_na_data_agendada_dias INTEGER,
    ig_na_data_agendada_semanas INTEGER,
    ig_na_data_agendada_dias_resto INTEGER,
    status VARCHAR(20) CHECK (status IN ('AGENDADO', 'JÁ AGENDADO', 'SEM VAGA', 'ERRO', 'URGENTE_PS')),
    observacoes TEXT,
    protocolo_aplicado VARCHAR(50),
    prioridade VARCHAR(20) CHECK (prioridade IN ('CRÍTICA', 'ALTA', 'MÉDIA', 'PADRÃO')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Vagas de Agenda
CREATE TABLE vagas_agenda (
    id_vaga SERIAL PRIMARY KEY,
    id_maternidade INTEGER NOT NULL REFERENCES maternidades(id_maternidade),
    data_vaga DATE NOT NULL,
    dia_semana VARCHAR(20),
    mes_ano VARCHAR(20),
    ocupada BOOLEAN DEFAULT FALSE,
    id_agendamento INTEGER REFERENCES agendamentos(id_agendamento),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_maternidade, data_vaga)
);

-- Tabela de Histórico de Alterações
CREATE TABLE historico_alteracoes (
    id_historico SERIAL PRIMARY KEY,
    tabela VARCHAR(50) NOT NULL,
    id_registro INTEGER NOT NULL,
    campo_alterado VARCHAR(100),
    valor_anterior TEXT,
    valor_novo TEXT,
    usuario VARCHAR(100),
    data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_pacientes_carteirinha ON pacientes(carteirinha);
CREATE INDEX idx_pacientes_nome ON pacientes(nome_completo);
CREATE INDEX idx_agendamentos_data ON agendamentos(data_agendada);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);
CREATE INDEX idx_agendamentos_maternidade ON agendamentos(id_maternidade);
CREATE INDEX idx_vagas_data ON vagas_agenda(data_vaga);
CREATE INDEX idx_vagas_maternidade ON vagas_agenda(id_maternidade);
CREATE INDEX idx_dados_obstetricos_paciente ON dados_obstetricos(id_paciente);
CREATE INDEX idx_diagnosticos_paciente ON diagnosticos(id_paciente);

-- Views úteis
CREATE VIEW view_agendamentos_completos AS
SELECT 
    a.id_agendamento,
    p.carteirinha,
    p.nome_completo,
    p.data_nascimento,
    p.telefone,
    m.nome AS maternidade,
    a.data_referencia,
    a.ig_atual_semanas || 's ' || a.ig_atual_dias_resto || 'd' AS ig_atual,
    a.ig_recomendada_semanas || 's' AS ig_recomendada,
    a.motivo_ig_recomendada,
    a.data_ideal,
    a.data_agendada,
    CASE 
        WHEN a.ig_na_data_agendada_semanas IS NOT NULL 
        THEN a.ig_na_data_agendada_semanas || 's ' || a.ig_na_data_agendada_dias_resto || 'd'
        ELSE NULL
    END AS ig_na_data_agendada,
    a.status,
    a.prioridade,
    a.observacoes,
    d.diagnostico_materno,
    d.indicacao_procedimento,
    d.procedimento_solicitado,
    do.metodo_datacao,
    do.dpp_usg,
    do.dpp_dum
FROM agendamentos a
JOIN pacientes p ON a.id_paciente = p.id_paciente
JOIN maternidades m ON a.id_maternidade = m.id_maternidade
LEFT JOIN diagnosticos d ON p.id_paciente = d.id_paciente
LEFT JOIN dados_obstetricos do ON p.id_paciente = do.id_paciente;

CREATE VIEW view_vagas_disponiveis AS
SELECT 
    v.id_vaga,
    m.nome AS maternidade,
    v.data_vaga,
    v.dia_semana,
    v.ocupada
FROM vagas_agenda v
JOIN maternidades m ON v.id_maternidade = m.id_maternidade
WHERE v.ocupada = FALSE
ORDER BY m.nome, v.data_vaga;

CREATE VIEW view_estatisticas_agendamentos AS
SELECT 
    m.nome AS maternidade,
    COUNT(*) AS total_agendamentos,
    COUNT(CASE WHEN a.status = 'AGENDADO' THEN 1 END) AS novos_agendamentos,
    COUNT(CASE WHEN a.status = 'JÁ AGENDADO' THEN 1 END) AS ja_agendados,
    COUNT(CASE WHEN a.status = 'SEM VAGA' THEN 1 END) AS sem_vaga,
    COUNT(CASE WHEN a.status = 'URGENTE_PS' THEN 1 END) AS urgentes,
    COUNT(CASE WHEN a.prioridade = 'CRÍTICA' THEN 1 END) AS criticos,
    COUNT(CASE WHEN a.prioridade = 'ALTA' THEN 1 END) AS alta_prioridade
FROM agendamentos a
JOIN maternidades m ON a.id_maternidade = m.id_maternidade
GROUP BY m.nome;

-- Comentários nas tabelas
COMMENT ON TABLE pacientes IS 'Cadastro de pacientes gestantes';
COMMENT ON TABLE maternidades IS 'Cadastro de maternidades da rede';
COMMENT ON TABLE dados_obstetricos IS 'Dados obstétricos e de datação gestacional';
COMMENT ON TABLE diagnosticos IS 'Diagnósticos e indicações clínicas';
COMMENT ON TABLE agendamentos IS 'Agendamentos de partos com cálculos de IG';
COMMENT ON TABLE vagas_agenda IS 'Vagas disponíveis nas agendas das maternidades';
COMMENT ON TABLE historico_alteracoes IS 'Auditoria de alterações nos dados';

-- Comentários nas colunas principais
COMMENT ON COLUMN agendamentos.ig_atual_dias IS 'Idade gestacional atual em dias totais';
COMMENT ON COLUMN agendamentos.ig_recomendada_semanas IS 'IG recomendada conforme protocolo PT-AON-097';
COMMENT ON COLUMN agendamentos.data_ideal IS 'Data calculada para atingir IG recomendada';
COMMENT ON COLUMN agendamentos.protocolo_aplicado IS 'Protocolo médico aplicado (PR-DIMEP-PGS-01, PT-AON-097)';
COMMENT ON COLUMN dados_obstetricos.metodo_datacao IS 'Método utilizado para datação: DUM ou USG';
