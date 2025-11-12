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

function parseTSVLine(line: string): string[] {
  return line.split('\t').map(field => field.trim());
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
  tsvContent: string,
  createdBy: string
): Promise<{ 
  success: number; 
  failed: number; 
  skipped: number;
  errors: string[];
  warnings: string[];
}> {
  const lines = tsvContent.split('\n');
  const errors: string[] = [];
  const warnings: string[] = [];
  let success = 0;
  let failed = 0;
  let skipped = 0;
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const fields = parseTSVLine(line);
      if (fields.length < 39) {
        errors.push(`Linha ${i + 1}: Formato inválido - esperadas 39 colunas, encontradas ${fields.length}`);
        failed++;
        continue;
      }
      
      const [
        id, horaInicio, nomeCompleto, dataNascimento, carteirinha,
        numeroGestacoes, numeroCesareas, numeroPartosNormais, numeroAbortos,
        telefones, procedimentos, dumStatus, dataDum, dataPrimeiroUsg,
        semanasUsg, diasUsg, usgRecente, igPretendida, , // coluna vazia
        indicacaoProcedimento, medicacao, diagnosticosMaternos, placentaPrevia,
        diagnosticosFetais, historiaObstetrica, necessidadeUtiMaterna,
        necessidadeReservaSangue, maternidade, medicoResponsavel, emailPaciente
      ] = fields;
      
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
