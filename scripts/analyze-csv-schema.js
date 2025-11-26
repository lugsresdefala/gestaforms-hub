#!/usr/bin/env node

/**
 * CSV to Backend Schema Comparison Tool
 * Compares CSV files structure with database schema and form validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSV Header mapping to Database Schema
const CSV_TO_DB_MAPPING = {
  // CSV Column Index -> Database Field Name
  0: 'id',                                    // ID
  1: 'hora_inicio',                          // Hora de início  
  2: 'hora_conclusao',                       // Hora da conclusão
  3: 'email',                                // Email
  4: 'nome',                                 // Nome
  5: 'nome_completo',                        // Nome completo da paciente
  6: 'data_nascimento',                      // Data de nascimento da gestante
  7: 'carteirinha',                          // CARTEIRINHA
  8: 'numero_gestacoes',                     // Número de Gestações
  9: 'numero_partos_cesareas',               // Número de Partos Cesáreas
  10: 'numero_partos_normais',               // Número de Partos Normais
  11: 'numero_abortos',                      // Número de Abortos
  12: 'telefones',                           // Telefones de contato
  13: 'procedimentos',                       // Procedimento(s) que será(ão) realizado(s)
  14: 'dum_status',                          // DUM
  15: 'data_dum',                           // Data da DUM
  16: 'data_primeiro_usg',                   // Data do Primeiro USG
  17: 'semanas_usg',                         // Numero de semanas no primeiro USG
  18: 'dias_usg',                            // Numero de dias no primeiro USG
  19: 'usg_recente',                         // USG mais recente
  20: 'ig_pretendida',                       // IG pretendida para o procedimento
  21: 'coluna3',                             // Coluna3 (unused)
  22: 'indicacao_procedimento',              // Indicação do procedimento
  23: 'medicacao',                           // Medicação e dosagem
  24: 'diagnosticos_maternos',               // Diagnósticos Obstétricos Maternos
  25: 'placenta_previa',                     // Placenta prévia
  26: 'diagnosticos_fetais',                 // Diagnósticos Fetais
  27: 'historia_obstetrica',                 // História Obstétrica Prévia
  28: 'necessidade_uti_materna',             // Necessidade de reserva de UTI materna
  29: 'necessidade_reserva_sangue',          // Necessidade de reserva de Sangue
  30: 'maternidade',                         // Maternidade que a paciente deseja
  31: 'medico_responsavel',                  // Médico responsável pelo agendamento
  32: 'email_paciente',                      // E-mail da paciente
  33: 'dpp_dum',                             // DPP DUM
  34: 'dpp_usg',                             // DPP USG
  35: 'idade',                               // Idade
  36: 'data_agendada',                       // DATA AGENDADA
  37: 'coluna2',                             // Coluna2 (observações)
  38: 'coluna22',                            // Coluna22
  39: 'coluna23',                            // Coluna23
  40: 'coluna24',                            // Coluna24
  41: 'coluna25',                            // Coluna25
  42: 'coluna26'                             // Coluna26
};

// Database Schema from migration files
const DATABASE_SCHEMA = {
  // Core table: agendamentos_obst
  agendamentos_obst: {
    id: 'UUID PRIMARY KEY',
    created_at: 'TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()',
    updated_at: 'TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()',
    
    // Dados da Paciente (Step 1)
    carteirinha: 'TEXT NOT NULL',
    nome_completo: 'TEXT NOT NULL',
    data_nascimento: 'DATE NOT NULL',
    numero_gestacoes: 'INTEGER NOT NULL',
    numero_partos_cesareas: 'INTEGER NOT NULL',
    numero_partos_normais: 'INTEGER NOT NULL',
    numero_abortos: 'INTEGER NOT NULL',
    telefones: 'TEXT NOT NULL',
    
    // Procedimento e DUM (Step 2)
    procedimentos: 'TEXT[] NOT NULL',
    dum_status: 'TEXT NOT NULL CHECK (dum_status IN (\'Sim - Confiavel\', \'Incerta\', \'Não sabe\'))',
    data_dum: 'DATE',
    
    // Detalhes da Gestação (Step 3)
    data_primeiro_usg: 'DATE NOT NULL',
    semanas_usg: 'INTEGER NOT NULL',
    dias_usg: 'INTEGER NOT NULL CHECK (dias_usg >= 0 AND dias_usg <= 6)',
    usg_recente: 'TEXT NOT NULL',
    ig_pretendida: 'TEXT NOT NULL',
    indicacao_procedimento: 'TEXT NOT NULL',
    
    // Histórico Médico (Step 4)
    medicacao: 'TEXT NOT NULL',
    diagnosticos_maternos: 'TEXT NOT NULL',
    placenta_previa: 'TEXT CHECK (placenta_previa IN (\'Sim\', \'Não\'))',
    diagnosticos_fetais: 'TEXT NOT NULL',
    historia_obstetrica: 'TEXT NOT NULL',
    
    // Reservas (Step 5)
    necessidade_uti_materna: 'TEXT CHECK (necessidade_uti_materna IN (\'Sim\', \'Não\'))',
    necessidade_reserva_sangue: 'TEXT CHECK (necessidade_reserva_sangue IN (\'Sim\', \'Não\'))',
    
    // Instalação e Provedor (Step 6)
    maternidade: 'TEXT NOT NULL',
    medico_responsavel: 'TEXT NOT NULL',
    centro_clinico: 'TEXT NOT NULL',
    email_paciente: 'TEXT NOT NULL',
    
    // Campos calculados
    data_agendamento_calculada: 'DATE',
    idade_gestacional_calculada: 'TEXT',
    observacoes_agendamento: 'TEXT',
    
    // Status e aprovação fields (added later)
    status: 'TEXT NOT NULL DEFAULT \'pendente\' CHECK (status IN (\'pendente\', \'aprovado\', \'rejeitado\'))',
    aprovado_por: 'UUID REFERENCES auth.users(id)',
    aprovado_em: 'TIMESTAMP WITH TIME ZONE',
    observacoes_aprovacao: 'TEXT',
    created_by: 'UUID REFERENCES auth.users(id)',
    
    // Additional fields
    diagnostico_livre: 'TEXT' // Added in newer migration
  }
};

// Form Schema Validation (from Zod)
const FORM_SCHEMA = {
  carteirinha: 'string().min(1, "Campo obrigatório")',
  nomeCompleto: 'string().min(1, "Campo obrigatório")',
  dataNascimento: 'string().min(1, "Campo obrigatório")',
  numeroGestacoes: 'string().min(1, "Campo obrigatório")',
  numeroPartosCesareas: 'string().min(1, "Campo obrigatório")',
  numeroPartosNormais: 'string().min(1, "Campo obrigatório")',
  numeroAbortos: 'string().min(1, "Campo obrigatório")',
  telefones: 'string().min(1, "Campo obrigatório")',
  procedimento: 'array(string()).min(1, "Selecione pelo menos um procedimento")',
  dum: 'string().min(1, "Campo obrigatório")',
  dataDum: 'string().min(1, "Campo obrigatório")',
  dataPrimeiroUsg: 'string().min(1, "Campo obrigatório")',
  semanasUsg: 'string().min(1, "Campo obrigatório")',
  diasUsg: 'string().min(1, "Campo obrigatório")',
  usgRecente: 'string().min(1, "Campo obrigatório")',
  igPretendida: 'string().min(1, "Campo obrigatório")',
  indicacaoProcedimento: 'string().min(1, "Campo obrigatório")',
  medicacao: 'string().min(1, "Campo obrigatório")',
  diagnosticosMaternos: 'array(string()).min(1, "Selecione pelo menos um diagnóstico")',
  placentaPrevia: 'string().min(1, "Campo obrigatório")',
  diagnosticosFetais: 'array(string()).min(1, "Selecione pelo menos um diagnóstico")',
  diagnosticosFetaisOutros: 'string().optional()',
  historiaObstetrica: 'string().min(1, "Campo obrigatório")',
  necessidadeUtiMaterna: 'string().min(1, "Campo obrigatório")',
  necessidadeReservaSangue: 'string().min(1, "Campo obrigatório")',
  maternidade: 'string().min(1, "Campo obrigatório")',
  medicoResponsavel: 'string().min(1, "Campo obrigatório")',
  centroClinico: 'string().min(1, "Campo obrigatório")',
  email: 'string().email("Email inválido").min(1, "Campo obrigatório")'
};

// Field transformations needed for import
const FIELD_TRANSFORMATIONS = {
  data_nascimento: 'DATE_PARSE', // Convert from string to DATE
  numero_gestacoes: 'INT_PARSE',   // Convert from string to INTEGER
  numero_partos_cesareas: 'INT_PARSE',
  numero_partos_normais: 'INT_PARSE', 
  numero_abortos: 'INT_PARSE',
  procedimentos: 'STRING_TO_ARRAY', // Convert comma-separated to TEXT[]
  data_dum: 'DATE_PARSE_NULLABLE',  // Convert from string to DATE, allow NULL
  data_primeiro_usg: 'DATE_PARSE',
  semanas_usg: 'INT_PARSE',
  dias_usg: 'INT_PARSE',
  diagnosticos_maternos: 'STRING_NORMALIZE', // Normalize text
  diagnosticos_fetais: 'STRING_NORMALIZE'
};

/**
 * Analyzes CSV file and compares with backend schema
 */
function analyzeCSV(csvPath) {
  console.log('🔍 Analyzing CSV file:', csvPath);
  console.log('=====================================\n');

  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV file not found:', csvPath);
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    console.error('❌ Empty CSV file');
    return;
  }

  const headers = lines[0].split(',');
  const sampleData = lines.slice(1, 4); // First 3 data rows for analysis
  
  console.log('📊 CSV Structure Analysis:');
  console.log('========================');
  console.log(`Total columns: ${headers.length}`);
  console.log(`Total data rows: ${lines.length - 1}`);
  console.log();

  console.log('🗂️ Column Mapping Analysis:');
  console.log('===========================');
  
  headers.forEach((header, index) => {
    const mappedField = CSV_TO_DB_MAPPING[index];
    const dbField = DATABASE_SCHEMA.agendamentos_obst[mappedField];
    const transformation = FIELD_TRANSFORMATIONS[mappedField];
    
    console.log(`[${index.toString().padStart(2, '0')}] ${header.substring(0, 60)}${header.length > 60 ? '...' : ''}`);
    console.log(`     → ${mappedField || 'UNMAPPED'}`);
    if (dbField) {
      console.log(`     → DB: ${dbField}`);
    }
    if (transformation) {
      console.log(`     → Transform: ${transformation}`);
    }
    if (!mappedField) {
      console.log(`     ⚠️  NO MAPPING DEFINED`);
    }
    console.log();
  });

  console.log('⚠️  Field Validation Issues:');
  console.log('============================');
  
  let issues = [];
  
  // Check for missing required fields
  const requiredDBFields = Object.keys(DATABASE_SCHEMA.agendamentos_obst).filter(field => {
    const dbType = DATABASE_SCHEMA.agendamentos_obst[field];
    return dbType.includes('NOT NULL') && !dbType.includes('DEFAULT');
  });
  
  const mappedFields = Object.values(CSV_TO_DB_MAPPING).filter(Boolean);
  
  requiredDBFields.forEach(requiredField => {
    if (!mappedFields.includes(requiredField)) {
      issues.push(`❌ Missing required field: ${requiredField}`);
    }
  });

  // Check for unmapped CSV columns
  headers.forEach((header, index) => {
    if (!CSV_TO_DB_MAPPING[index]) {
      issues.push(`⚠️  Unmapped CSV column [${index}]: ${header.substring(0, 40)}...`);
    }
  });

  if (issues.length === 0) {
    console.log('✅ No issues found!');
  } else {
    issues.forEach(issue => console.log(issue));
  }

  console.log('\n📋 Data Sample Analysis:');
  console.log('========================');
  
  if (sampleData.length > 0) {
    const firstRow = sampleData[0].split(',');
    
    console.log('Sample data transformations needed:');
    firstRow.forEach((value, index) => {
      const mappedField = CSV_TO_DB_MAPPING[index];
      const transformation = FIELD_TRANSFORMATIONS[mappedField];
      
      if (transformation && value.trim()) {
        console.log(`[${index}] ${mappedField}: "${value.trim()}" → ${transformation}`);
      }
    });
  }

  console.log('\n🚀 Import Recommendations:');
  console.log('===========================');
  console.log('1. ✅ Use ProcessarFormsParto.tsx page for CSV import');
  console.log('2. ✅ Validate data types before database insertion');
  console.log('3. ✅ Handle NULL values for optional fields (data_dum)');
  console.log('4. ✅ Convert procedures to TEXT[] array format');
  console.log('5. ✅ Set status="pendente" for all imported records');
  console.log('6. ✅ Parse dates using Brazilian format (DD/MM/YYYY)');
  console.log('7. ✅ Validate enum fields (dum_status, placenta_previa)');
  
  return {
    totalColumns: headers.length,
    totalRows: lines.length - 1,
    mappedFields: mappedFields.length,
    unmappedColumns: headers.length - mappedFields.length,
    issues: issues.length
  };
}

/**
 * Main execution
 */
function main() {
  const csvFiles = [
    '/workspaces/gestaforms-hub/public/csv-temp/forms_parto.csv',
    '/workspaces/gestaforms-hub/public/csv-temp/forms_parto_pending.csv'
  ];

  console.log('🏥 GestaForms Hub - CSV Import Analysis Tool');
  console.log('=============================================\n');

  csvFiles.forEach((filePath, index) => {
    if (index > 0) console.log('\n' + '='.repeat(80) + '\n');
    
    const result = analyzeCSV(filePath);
    
    if (result) {
      console.log('\n📈 Summary:');
      console.log(`• Total fields: ${result.totalColumns}`);
      console.log(`• Mapped fields: ${result.mappedFields}/${result.totalColumns}`);
      console.log(`• Data rows: ${result.totalRows}`);
      console.log(`• Issues found: ${result.issues}`);
      console.log(`• Status: ${result.issues === 0 ? '✅ Ready for import' : '⚠️  Needs attention'}`);
    }
  });

  console.log('\n🔧 Next Steps:');
  console.log('===============');
  console.log('1. Review /src/pages/ProcessarFormsParto.tsx for import logic');
  console.log('2. Check /src/lib/gestationalCalculations.ts for date calculations');
  console.log('3. Verify /src/lib/obstetricProtocols.ts for medical validations');
  console.log('4. Use /src/utils/importAgendamentos2025.ts for bulk import');
  console.log('5. Test with /criar-usuarios-padrao for authentication setup');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeCSV, CSV_TO_DB_MAPPING, DATABASE_SCHEMA };