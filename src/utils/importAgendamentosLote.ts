import { supabase } from '@/lib/supabase';
import { calcularAgendamentoCompleto } from '@/lib/gestationalCalculations';
import { verificarDisponibilidade } from '@/lib/vagasValidation';

interface LoteRow {
  id: string;
  horaInicio: string;
  nomeCompleto: string;
  dataNascimento: string;
  carteirinha: string;
  numeroGestacoes: string;
  numeroCesareas: string;
  numeroPartosNormais: string;
  numeroAbortos: string;
  telefones: string;
  procedimentos: string;
  dumStatus: string;
  dataDum: string;
  dataPrimeiroUsg: string;
  semanasUsg: string;
  diasUsg: string;
  usgRecente: string;
  igPretendida: string;
  indicacaoProcedimento: string;
  medicacao: string;
  diagnosticosMaternos: string;
  placentaPrevia: string;
  diagnosticosFetais: string;
  historiaObstetrica: string;
  necessidadeUtiMaterna: string;
  necessidadeReservaSangue: string;
  maternidade: string;
  medicoResponsavel: string;
  emailPaciente: string;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  fields.push(currentField.trim());
  return fields;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === '-') return null;
  
  // Try DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  
  return null;
}

function extractProcedimentos(procedimentosStr: string): string[] {
  const procedimentos: string[] = [];
  const lower = procedimentosStr.toLowerCase();
  
  if (lower.includes('cesárea') || lower.includes('cesarea')) {
    procedimentos.push('Cesariana');
  }
  if (lower.includes('laqueadura')) {
    procedimentos.push('Laqueadura');
  }
  if (lower.includes('parto normal') || lower.includes('indução') || lower.includes('inducao')) {
    procedimentos.push('Parto Normal');
  }
  if (lower.includes('cerclagem')) {
    procedimentos.push('Cerclagem');
  }
  
  return procedimentos.length > 0 ? procedimentos : ['Cesariana'];
}

async function verificarDuplicado(carteirinha: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('agendamentos_obst')
    .select('id')
    .eq('carteirinha', carteirinha)
    .eq('status', 'pendente')
    .maybeSingle();
  
  if (error) {
    console.error('Erro ao verificar duplicado:', error);
    return false;
  }
  
  return !!data;
}

export async function importarAgendamentosLote(
  csvContent: string,
  createdBy: string
): Promise<{ 
  success: number; 
  failed: number; 
  skipped: number;
  errors: string[];
  warnings: string[];
}> {
  const lines = csvContent.split('\n');
  const errors: string[] = [];
  const warnings: string[] = [];
  let success = 0;
  let failed = 0;
  let skipped = 0;
  
  // Skip header (lines 1-3, data starts at line 4)
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const fields = parseCSVLine(line);
      if (fields.length < 33) {
        errors.push(`Linha ${i + 1}: Formato inválido - esperadas pelo menos 33 colunas, encontradas ${fields.length}`);
        failed++;
        continue;
      }
      
      // CSV column mapping (0-indexed)
      const id = fields[0];
      const horaInicio = fields[1];
      const nomeCompleto = fields[5]; // Nome completo da paciente
      const dataNascimento = fields[6];
      const carteirinha = fields[7];
      const numeroGestacoes = fields[8];
      const numeroCesareas = fields[9];
      const numeroPartosNormais = fields[10];
      const numeroAbortos = fields[11];
      const telefones = fields[12];
      const procedimentos = fields[13];
      const dumStatus = fields[14];
      const dataDum = fields[15];
      const dataPrimeiroUsg = fields[16];
      const semanasUsg = fields[17];
      const diasUsg = fields[18];
      const usgRecente = fields[19];
      const igPretendida = fields[20];
      const indicacaoProcedimento = fields[22];
      const medicacao = fields[23];
      const diagnosticosMaternos = fields[24];
      const placentaPrevia = fields[25];
      const diagnosticosFetais = fields[26];
      const historiaObstetrica = fields[27];
      const necessidadeUtiMaterna = fields[28];
      const necessidadeReservaSangue = fields[29];
      const maternidade = fields[30];
      const medicoResponsavel = fields[31];
      const emailPaciente = fields[32];
      
      // Validações básicas
      if (!carteirinha || !nomeCompleto) {
        errors.push(`Linha ${i + 1}: Carteirinha ou nome não informados`);
        failed++;
        continue;
      }
      
      // Verificar duplicado
      const isDuplicado = await verificarDuplicado(carteirinha);
      if (isDuplicado) {
        warnings.push(`Linha ${i + 1}: ${nomeCompleto} (${carteirinha}) já possui agendamento pendente`);
        skipped++;
        continue;
      }
      
      const dataNascParsed = parseDate(dataNascimento);
      if (!dataNascParsed) {
        errors.push(`Linha ${i + 1}: Data de nascimento inválida - ${dataNascimento}`);
        failed++;
        continue;
      }
      
      const dataDumParsed = parseDate(dataDum);
      const dataPrimeiroUsgParsed = parseDate(dataPrimeiroUsg);
      
      if (!dataPrimeiroUsgParsed) {
        errors.push(`Linha ${i + 1}: Data do primeiro USG é obrigatória`);
        failed++;
        continue;
      }
      
      const semanasUsgNum = parseInt(semanasUsg);
      const diasUsgNum = parseInt(diasUsg);
      
      if (isNaN(semanasUsgNum) || isNaN(diasUsgNum)) {
        errors.push(`Linha ${i + 1}: IG no USG inválida`);
        failed++;
        continue;
      }
      
      // Calcular agendamento usando a função existente
      const dadosCalculo = {
        dumStatus: dumStatus || 'Incerta',
        dataDum: dataDumParsed?.toISOString().split('T')[0],
        dataPrimeiroUsg: dataPrimeiroUsgParsed.toISOString().split('T')[0],
        semanasUsg: semanasUsgNum.toString(),
        diasUsg: diasUsgNum.toString(),
        procedimentos: extractProcedimentos(procedimentos),
        diagnosticosMaternos: diagnosticosMaternos ? [diagnosticosMaternos] : undefined,
        diagnosticosFetais: diagnosticosFetais ? [diagnosticosFetais] : undefined,
        placentaPrevia: placentaPrevia && placentaPrevia !== '-' && placentaPrevia.toLowerCase() !== 'não' 
          ? placentaPrevia 
          : undefined
      };
      
      const resultado = calcularAgendamentoCompleto(dadosCalculo);
      
      // Verificar disponibilidade na maternidade
      const dataAgendamento = new Date(resultado.dataAgendamento);
      const isUrgente = resultado.observacoes.toLowerCase().includes('urgente');
      
      const disponibilidade = await verificarDisponibilidade(
        maternidade,
        dataAgendamento,
        isUrgente
      );
      
      if (!disponibilidade.disponivel) {
        warnings.push(`Linha ${i + 1}: ${nomeCompleto} - ${disponibilidade.mensagem}`);
      }
      
      // Preparar dados para inserção
      const agendamentoData = {
        nome_completo: nomeCompleto,
        carteirinha: carteirinha,
        data_nascimento: dataNascParsed.toISOString().split('T')[0],
        telefones: telefones || 'Não informado',
        email_paciente: emailPaciente || 'nao.informado@email.com',
        maternidade: maternidade,
        centro_clinico: 'Importado em Lote',
        medico_responsavel: medicoResponsavel || 'Médico Importado',
        numero_gestacoes: parseInt(numeroGestacoes) || 1,
        numero_partos_normais: parseInt(numeroPartosNormais) || 0,
        numero_partos_cesareas: parseInt(numeroCesareas) || 0,
        numero_abortos: parseInt(numeroAbortos) || 0,
        procedimentos: dadosCalculo.procedimentos,
        diagnosticos_maternos: diagnosticosMaternos || 'Não informado',
        diagnosticos_fetais: diagnosticosFetais || undefined,
        placenta_previa: dadosCalculo.placentaPrevia,
        indicacao_procedimento: indicacaoProcedimento,
        medicacao: medicacao || undefined,
        historia_obstetrica: historiaObstetrica || undefined,
        necessidade_uti_materna: necessidadeUtiMaterna === 'Sim' ? 'Sim' : 'Não',
        necessidade_reserva_sangue: necessidadeReservaSangue === 'Sim' ? 'Sim' : 'Não',
        dum_status: dadosCalculo.dumStatus,
        data_dum: dadosCalculo.dataDum,
        data_primeiro_usg: dadosCalculo.dataPrimeiroUsg,
        semanas_usg: semanasUsgNum,
        dias_usg: diasUsgNum,
        usg_recente: usgRecente || 'Sim',
        ig_pretendida: resultado.igAgendamento,
        data_agendamento_calculada: resultado.dataAgendamento.toISOString().split('T')[0],
        idade_gestacional_calculada: resultado.igFinal.displayText,
        observacoes_agendamento: `${resultado.observacoes}\nProtocolo: ${resultado.protocoloAplicado || 'Padrão'}\nDisponibilidade: ${disponibilidade.mensagem}`,
        created_by: createdBy,
        status: 'pendente'
      };
      
      const { error: insertError } = await supabase
        .from('agendamentos_obst')
        .insert(agendamentoData);
      
      if (insertError) {
        errors.push(`Linha ${i + 1}: ${insertError.message}`);
        failed++;
      } else {
        success++;
      }
      
    } catch (error) {
      errors.push(`Linha ${i + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      failed++;
    }
  }
  
  return { success, failed, skipped, errors, warnings };
}
