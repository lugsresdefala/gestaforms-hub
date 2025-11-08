import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ID do usuário admin que criará os registros
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000000';

interface AgendamentoData {
  data_agendamento_calculada: string;
  maternidade: string;
  nome_completo: string;
  carteirinha: string;
  data_nascimento?: string;
  telefones: string;
  procedimentos: string[];
  diagnosticos_maternos?: string;
  medicacao?: string;
  historia_obstetrica?: string;
  observacoes_agendamento?: string;
  numero_gestacoes: number;
  numero_partos_normais: number;
  numero_partos_cesareas: number;
  numero_abortos: number;
  dum_status: string;
  usg_recente: string;
  data_primeiro_usg: string;
  semanas_usg: number;
  dias_usg: number;
  ig_pretendida: string;
  indicacao_procedimento: string;
  email_paciente: string;
  medico_responsavel: string;
  centro_clinico: string;
  status: string;
  created_by: string;
}

// Converte data serial do Excel para Date
function excelSerialToDate(serial: number): Date {
  const excelEpoch = new Date(1899, 11, 30);
  const days = Math.floor(serial);
  return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
}

// Extrai procedimentos da via de parto
function extractProcedimentos(viaParto: string): string[] {
  const procedimentos: string[] = [];
  const lower = viaParto.toLowerCase();
  
  if (lower.includes('cesárea') || lower.includes('cesarea')) {
    procedimentos.push('Cesárea');
  }
  if (lower.includes('laqueadura')) {
    procedimentos.push('Laqueadura');
  }
  if (lower.includes('indução') || lower.includes('inducao')) {
    procedimentos.push('Indução');
  }
  if (lower.includes('cerclagem')) {
    procedimentos.push('Cerclagem');
  }
  if (lower.includes('parto normal') || lower.includes('tp')) {
    procedimentos.push('Parto Normal');
  }
  
  return procedimentos.length > 0 ? procedimentos : ['Cesárea'];
}

// Extrai informações obstétricas do diagnóstico (ex: "2g1c" = 2 gestações, 1 cesárea)
function extractObstetricHistory(diagnostico: string): {
  gestacoes: number;
  cesareas: number;
  normais: number;
  abortos: number;
} {
  const match = diagnostico.match(/(\d+)g(\d*)([nc])(\d*)([a])(\d*)/i);
  
  if (match) {
    const gestacoes = parseInt(match[1]) || 1;
    let cesareas = 0;
    let normais = 0;
    let abortos = 0;
    
    // Procura por padrões como "1c", "2n", "1a"
    const cMatch = diagnostico.match(/(\d+)c/i);
    const nMatch = diagnostico.match(/(\d+)n/i);
    const aMatch = diagnostico.match(/(\d+)a/i);
    
    if (cMatch) cesareas = parseInt(cMatch[1]);
    if (nMatch) normais = parseInt(nMatch[1]);
    if (aMatch) abortos = parseInt(aMatch[1]);
    
    return { gestacoes, cesareas, normais, abortos };
  }
  
  return { gestacoes: 1, cesareas: 0, normais: 0, abortos: 0 };
}

// Extrai idade gestacional (ex: "37s" = 37 semanas)
function extractIdadeGestacional(diagnostico: string): number {
  const match = diagnostico.match(/(\d+)s/i);
  return match ? parseInt(match[1]) : 37;
}

// Processa o documento parseado
function processDocument(content: string): AgendamentoData[] {
  const agendamentos: AgendamentoData[] = [];
  const lines = content.split('\n');
  
  let currentAgendamento: Partial<AgendamentoData> | null = null;
  let currentField: string | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detecta início de novo agendamento: "2025-10-01 — Notrecare — NOME — procedimento"
    const agendamentoMatch = line.match(/^(\d{4}-\d{2}-\d{2})\s*—\s*([A-Za-z\s]+)\s*—\s*([^—]+)/);
    
    if (agendamentoMatch) {
      // Salva agendamento anterior se existir
      if (currentAgendamento && currentAgendamento.nome_completo && currentAgendamento.carteirinha) {
        agendamentos.push(finalizeAgendamento(currentAgendamento));
      }
      
      // Inicia novo agendamento
      const [_, data, maternidade, resto] = agendamentoMatch;
      const viaParto = line.split('—').slice(3).join('—').trim();
      
      currentAgendamento = {
        data_agendamento_calculada: data,
        maternidade: maternidade.trim(),
        nome_completo: '',
        carteirinha: '',
        telefones: '',
        procedimentos: viaParto ? extractProcedimentos(viaParto) : ['Cesárea'],
        status: 'aprovado',
        created_by: ADMIN_USER_ID,
        dum_status: 'Não lembra',
        usg_recente: 'Sim',
        ig_pretendida: '37-38 semanas',
        indicacao_procedimento: 'Eletiva',
        email_paciente: 'nao_informado@hapvida.com.br',
        medico_responsavel: 'Sistema',
        centro_clinico: maternidade.trim(),
      };
      currentField = null;
      continue;
    }
    
    // Captura campos específicos
    if (line.startsWith('CARTEIRINHA:')) {
      if (currentAgendamento) {
        currentAgendamento.carteirinha = line.replace('CARTEIRINHA:', '').trim();
      }
    } else if (line.startsWith('NOME:')) {
      if (currentAgendamento) {
        currentAgendamento.nome_completo = line.replace('NOME:', '').trim();
      }
    } else if (line.startsWith('DATA NASCIMENTO:') || line.startsWith('DATA DE NASCIMENTO:')) {
      if (currentAgendamento) {
        const valor = line.replace(/DATA (DE )?NASCIMENTO:/i, '').trim();
        if (valor && valor !== 'nan' && !isNaN(parseInt(valor))) {
          const serial = parseInt(valor);
          const date = excelSerialToDate(serial);
          currentAgendamento.data_nascimento = date.toISOString().split('T')[0];
        }
      }
    } else if (line.startsWith('DIAGNÓSTICO:')) {
      if (currentAgendamento) {
        const diagnostico = line.replace('DIAGNÓSTICO:', '').trim();
        currentAgendamento.diagnosticos_maternos = diagnostico;
        
        // Extrai história obstétrica
        const obsHistory = extractObstetricHistory(diagnostico);
        currentAgendamento.numero_gestacoes = obsHistory.gestacoes;
        currentAgendamento.numero_partos_cesareas = obsHistory.cesareas;
        currentAgendamento.numero_partos_normais = obsHistory.normais;
        currentAgendamento.numero_abortos = obsHistory.abortos;
        
        // Extrai idade gestacional
        const semanas = extractIdadeGestacional(diagnostico);
        currentAgendamento.semanas_usg = semanas;
        currentAgendamento.dias_usg = 0;
        currentAgendamento.data_primeiro_usg = currentAgendamento.data_agendamento_calculada || new Date().toISOString().split('T')[0];
      }
    } else if (line.startsWith('MEDICAÇÃO:') || line.startsWith('MEDICACAO:')) {
      if (currentAgendamento) {
        currentAgendamento.medicacao = line.replace(/MEDICA[ÇC][ÃA]O:/i, '').trim();
      }
    } else if (line.startsWith('TELEFONE:')) {
      if (currentAgendamento) {
        currentAgendamento.telefones = line.replace('TELEFONE:', '').trim();
      }
    } else if (line.startsWith('VIA DE PARTO:')) {
      if (currentAgendamento) {
        const viaParto = line.replace('VIA DE PARTO:', '').trim();
        currentAgendamento.procedimentos = extractProcedimentos(viaParto);
      }
    } else if (line.startsWith('CONDIÇÕES:') || line.startsWith('CONDICOES:')) {
      if (currentAgendamento) {
        currentAgendamento.historia_obstetrica = line.replace(/CONDI[ÇC][ÕO]ES:/i, '').trim();
      }
    }
  }
  
  // Salva último agendamento
  if (currentAgendamento && currentAgendamento.nome_completo && currentAgendamento.carteirinha) {
    agendamentos.push(finalizeAgendamento(currentAgendamento));
  }
  
  return agendamentos;
}

function finalizeAgendamento(data: Partial<AgendamentoData>): AgendamentoData {
  return {
    data_agendamento_calculada: data.data_agendamento_calculada || new Date().toISOString().split('T')[0],
    maternidade: data.maternidade || 'Não informada',
    nome_completo: data.nome_completo || 'Não informado',
    carteirinha: data.carteirinha || 'Não informada',
    data_nascimento: data.data_nascimento,
    telefones: data.telefones || 'Não informado',
    procedimentos: data.procedimentos || ['Cesárea'],
    diagnosticos_maternos: data.diagnosticos_maternos,
    medicacao: data.medicacao,
    historia_obstetrica: data.historia_obstetrica,
    observacoes_agendamento: data.observacoes_agendamento,
    numero_gestacoes: data.numero_gestacoes || 1,
    numero_partos_normais: data.numero_partos_normais || 0,
    numero_partos_cesareas: data.numero_partos_cesareas || 0,
    numero_abortos: data.numero_abortos || 0,
    dum_status: data.dum_status || 'Não lembra',
    usg_recente: data.usg_recente || 'Sim',
    data_primeiro_usg: data.data_primeiro_usg || new Date().toISOString().split('T')[0],
    semanas_usg: data.semanas_usg || 37,
    dias_usg: data.dias_usg || 0,
    ig_pretendida: data.ig_pretendida || '37-38 semanas',
    indicacao_procedimento: data.indicacao_procedimento || 'Eletiva',
    email_paciente: data.email_paciente || 'nao_informado@hapvida.com.br',
    medico_responsavel: data.medico_responsavel || 'Sistema',
    centro_clinico: data.centro_clinico || data.maternidade || 'Não informado',
    status: data.status || 'aprovado',
    created_by: data.created_by || ADMIN_USER_ID,
  };
}

async function main() {
  console.log('🚀 Iniciando importação do relatório único...\n');
  
  // Lê o conteúdo do documento parseado (cole aqui o conteúdo completo)
  const parsedContent = `# Document parsed from: RELATORIO_OUT_NOV_DEZ_2025_UNICO.docx

## Page 1

RELATÓRIO ÚNICO — AGENDAMENTOS OUTUBRO/ NOVEMBRO/ DEZEMBRO 2025

# Introdução — Características por Maternidade

# Cruzeiro

Total de agendamentos no período: 1

Período coberto: 2025-10-08 a 2025-10-08

Arquivos de origem: Agenda Cruzeiro 2024 (1).xlsx

Abas incluídas (origem das linhas filtradas): Outubro

# Guarulhos

Total de agendamentos no período: 7

Período coberto: 2025-10-13 a 2025-11-01

Arquivos de origem: Agenda Guarulhos 2024 (1).xlsx

Abas incluídas (origem das linhas filtradas): Dezembro, Novembro

# Notrecare

Total de agendamentos no período: 17

Período coberto: 2025-10-01 a 2025-10-28

Arquivos de origem: Agenda Notrecare 2024 (1).xlsx

Abas incluídas (origem das linhas filtradas): Dezembro, Novembro, Outubro

# Salvalus

Total de agendamentos no período: 23

Período coberto: 2025-10-02 a 2025-12-18

Arquivos de origem: Salvalus 2024 (1).xlsx

Abas incluídas (origem das linhas filtradas): Dezembro, Janeiro 25, Novembro, Outubro
`;
  
  // Para executar: cole o conteúdo completo do documento parseado acima
  
  console.log('📄 Processando documento...');
  const agendamentos = processDocument(parsedContent);
  
  console.log(`\n✅ Encontrados ${agendamentos.length} agendamentos\n`);
  
  // Agrupa por maternidade
  const porMaternidade = agendamentos.reduce((acc, ag) => {
    acc[ag.maternidade] = (acc[ag.maternidade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('📊 Distribuição por maternidade:');
  Object.entries(porMaternidade).forEach(([mat, count]) => {
    console.log(`   - ${mat}: ${count} agendamentos`);
  });
  
  console.log('\n💾 Inserindo no banco de dados...\n');
  
  let sucessos = 0;
  let erros = 0;
  
  for (const agendamento of agendamentos) {
    try {
      const { error } = await supabase
        .from('agendamentos_obst')
        .insert(agendamento);
      
      if (error) {
        console.error(`❌ Erro ao inserir ${agendamento.nome_completo}:`, error.message);
        erros++;
      } else {
        console.log(`✅ ${agendamento.nome_completo} - ${agendamento.maternidade} - ${agendamento.data_agendamento_calculada}`);
        sucessos++;
      }
    } catch (err) {
      console.error(`❌ Erro ao inserir ${agendamento.nome_completo}:`, err);
      erros++;
    }
  }
  
  console.log(`\n✨ Importação concluída!`);
  console.log(`   ✅ Sucessos: ${sucessos}`);
  console.log(`   ❌ Erros: ${erros}`);
}

main().catch(console.error);
