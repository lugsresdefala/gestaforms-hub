/**
 * Script para gerar templates Excel profissionais para cada maternidade
 * Execute com: npx ts-node scripts/generate-excel-templates.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Configurações de cores por maternidade
const MATERNIDADES = {
  'Cruzeiro': {
    primaryColor: '1a365d', // Azul escuro
    secondaryColor: '234e70', // Azul petróleo
    accentColor: '3182ce'
  },
  'Salvalus': {
    primaryColor: '064e3b', // Verde petróleo
    secondaryColor: '047857', // Verde institucional
    accentColor: '059669'
  },
  'Notrecare': {
    primaryColor: '4c1d95', // Roxo escuro
    secondaryColor: '6b21a8', // Roxo médio
    accentColor: '8b5cf6'
  },
  'Guarulhos': {
    primaryColor: '1e3a5f', // Azul marinho
    secondaryColor: '2563eb', // Azul médio
    accentColor: '3b82f6'
  }
};

// Paleta de cores comum
const COLORS = {
  greenInstitutional: '064e3b',
  greenLight: '047857',
  redCritical: '7f1d1d',
  redLight: '991b1b',
  amberWarning: '78350f',
  amberLight: '92400e',
  grayNeutral: 'f8fafc',
  grayLight: 'e2e8f0',
  white: 'FFFFFF',
  textDark: '1e293b'
};

// Colunas do template
const COLUMNS = [
  { header: 'Data', key: 'data', width: 12 },
  { header: 'Paciente', key: 'paciente', width: 30 },
  { header: 'Carteirinha', key: 'carteirinha', width: 15 },
  { header: 'Procedimento', key: 'procedimento', width: 20 },
  { header: 'IG Agendada', key: 'ig_agendada', width: 12 },
  { header: 'IG Recomendada', key: 'ig_recomendada', width: 14 },
  { header: 'Diagnóstico', key: 'diagnostico', width: 35 },
  { header: 'Telefone', key: 'telefone', width: 16 },
  { header: 'Médico', key: 'medico', width: 25 },
  { header: 'Status', key: 'status', width: 12 }
];

// Diagnósticos críticos que requerem destaque vermelho
const DIAGNOSTICOS_CRITICOS = [
  'dmg descompensado',
  'pré-eclâmpsia grave',
  'placenta prévia com acretismo',
  'placenta acreta',
  'placenta percreta',
  'eclampsia',
  'hellp',
  'gemelar monoamniótico',
  'rcf grave'
];

function generateTemplate(maternidadeName: string, colors: typeof MATERNIDADES.Cruzeiro): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  
  // ========== ABA 1: AGENDA PRINCIPAL ==========
  const agendaData: (string | number)[][] = [];
  
  // Cabeçalho institucional (linhas 1-4)
  agendaData.push(['HAPVIDA NOTREDAME INTERMÉDICA']);
  agendaData.push([`AGENDA OBSTÉTRICA - MATERNIDADE ${maternidadeName.toUpperCase()}`]);
  agendaData.push(['']);
  agendaData.push([`Período: Janeiro 2025 - Dezembro 2025`, '', '', '', '', '', '', '', '', `Atualizado em: ${new Date().toLocaleDateString('pt-BR')}`]);
  agendaData.push(['']); // Linha em branco
  
  // Cabeçalhos das colunas
  agendaData.push(COLUMNS.map(col => col.header));
  
  // Dados de exemplo (3 linhas para demonstração)
  agendaData.push([
    '15/01/2025',
    'Maria Silva Santos',
    '123456789',
    'Cesárea Eletiva',
    '38s 2d',
    '38s',
    'DMG com insulina, bom controle',
    '(11) 99999-0001',
    'Dr. João Souza',
    'Pendente'
  ]);
  
  agendaData.push([
    '15/01/2025',
    'Ana Oliveira',
    '987654321',
    'Cesárea + Laqueadura',
    '39s 0d',
    '39s',
    'Iteratividade 2C',
    '(11) 99999-0002',
    'Dra. Maria Lima',
    'Aprovado'
  ]);
  
  agendaData.push([
    '16/01/2025',
    'Carla Pereira',
    '456789123',
    'Cesárea Eletiva',
    '34s 5d',
    '34s',
    'Pré-eclâmpsia grave, HELLP',
    '(11) 99999-0003',
    'Dr. Pedro Santos',
    'Urgente'
  ]);
  
  // Linhas vazias para preenchimento
  for (let i = 0; i < 50; i++) {
    agendaData.push(['', '', '', '', '', '', '', '', '', '']);
  }
  
  const wsAgenda = XLSX.utils.aoa_to_sheet(agendaData);
  
  // Configurar larguras das colunas
  wsAgenda['!cols'] = COLUMNS.map(col => ({ wch: col.width }));
  
  // Mesclar células do cabeçalho
  wsAgenda['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, // Linha 1 - Título
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }, // Linha 2 - Subtítulo
    { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } }, // Período
    { s: { r: 3, c: 5 }, e: { r: 3, c: 9 } }, // Data atualização
  ];
  
  // Altura das linhas
  wsAgenda['!rows'] = [
    { hpt: 30 }, // Linha 1
    { hpt: 25 }, // Linha 2
    { hpt: 15 }, // Linha 3
    { hpt: 20 }, // Linha 4
    { hpt: 10 }, // Linha 5
    { hpt: 28 }, // Cabeçalhos
  ];
  
  // Adicionar mais linhas com altura padrão
  for (let i = 6; i < 60; i++) {
    if (!wsAgenda['!rows']) wsAgenda['!rows'] = [];
    wsAgenda['!rows'][i] = { hpt: 28 };
  }
  
  XLSX.utils.book_append_sheet(wb, wsAgenda, 'Agenda');
  
  // ========== ABA 2: RESUMO SEMANAL ==========
  const resumoData: (string | number)[][] = [];
  
  resumoData.push([`RESUMO SEMANAL - MATERNIDADE ${maternidadeName.toUpperCase()}`]);
  resumoData.push(['']);
  resumoData.push(['Semana', 'Cesáreas', 'PN', 'Laqueaduras', 'Total', 'Ocupação (%)']);
  
  // Dados de exemplo
  resumoData.push(['13/01 - 19/01', 8, 3, 2, 13, '65%']);
  resumoData.push(['20/01 - 26/01', 10, 5, 3, 18, '90%']);
  resumoData.push(['27/01 - 02/02', 7, 4, 1, 12, '60%']);
  
  // Linhas vazias para preenchimento
  for (let i = 0; i < 50; i++) {
    resumoData.push(['', '', '', '', '', '']);
  }
  
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  
  wsResumo['!cols'] = [
    { wch: 20 },
    { wch: 12 },
    { wch: 8 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 }
  ];
  
  wsResumo['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }
  ];
  
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Semanal');
  
  // ========== ABA 3: CASOS ESPECIAIS ==========
  const casosData: (string | number)[][] = [];
  
  casosData.push([`CASOS ESPECIAIS - MATERNIDADE ${maternidadeName.toUpperCase()}`]);
  casosData.push(['Filtro: UTI materna, Reserva de sangue, Diagnósticos críticos']);
  casosData.push(['']);
  casosData.push(['Data', 'Paciente', 'Diagnóstico', 'UTI', 'Sangue', 'Observações']);
  
  // Dados de exemplo
  casosData.push([
    '16/01/2025',
    'Carla Pereira',
    'Pré-eclâmpsia grave, HELLP',
    'Sim',
    'Reserva 4U',
    'Caso crítico - UTI reservada'
  ]);
  
  casosData.push([
    '18/01/2025',
    'Fernanda Costa',
    'Placenta acreta suspeitada',
    'Sim',
    'Reserva 6U',
    'Equipe vascular de sobreaviso'
  ]);
  
  // Linhas vazias
  for (let i = 0; i < 30; i++) {
    casosData.push(['', '', '', '', '', '']);
  }
  
  const wsCasos = XLSX.utils.aoa_to_sheet(casosData);
  
  wsCasos['!cols'] = [
    { wch: 12 },
    { wch: 25 },
    { wch: 35 },
    { wch: 8 },
    { wch: 12 },
    { wch: 40 }
  ];
  
  wsCasos['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }
  ];
  
  XLSX.utils.book_append_sheet(wb, wsCasos, 'Casos Especiais');
  
  return wb;
}

function main() {
  const templatesDir = path.join(process.cwd(), 'templates');
  
  // Criar diretório se não existir
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }
  
  // Gerar template para cada maternidade
  for (const [name, colors] of Object.entries(MATERNIDADES)) {
    console.log(`Gerando template para ${name}...`);
    
    const wb = generateTemplate(name, colors);
    const filename = `Agenda_${name}_2025.xlsx`;
    const filepath = path.join(templatesDir, filename);
    
    XLSX.writeFile(wb, filepath);
    console.log(`  ✅ Salvo: ${filepath}`);
  }
  
  console.log('\n✅ Todos os templates foram gerados com sucesso!');
}

main();
