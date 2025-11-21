import { supabase } from '@/integrations/supabase/client';
import { calcularAgendamentoCompleto } from '@/lib/gestationalCalculations';
import { verificarDisponibilidade } from '@/lib/vagasValidation';

interface FormsPartoRow {
  id: string;
  horaInicio: string;
  nomeCompleto: string;
  dataNascimento: string;
  carteirinha: string;
  numeroGestacoes: number;
  numeroCesareas: number;
  numeroPartosNormais: number;
  numeroAbortos: number;
  telefones: string;
  procedimentos: string;
  dumStatus: string;
  dataDum: string | null;
  dataPrimeiroUsg: string;
  semanasUsg: number;
  diasUsg: number;
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

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === '-' || dateStr === '' || dateStr === '#VALUE!' || dateStr === '06/10/1900') return null;
  
  // Tenta formato M/D/YY ou M/D/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0]);
    const day = parseInt(parts[1]);
    let year = parseInt(parts[2]);
    
    // Se ano está em formato de 2 dígitos, converter para 4 dígitos
    if (year < 100) {
      year = year < 50 ? 2000 + year : 1900 + year;
    }
    
    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day);
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
  if (lower.includes('indução') || lower.includes('inducao') || lower.includes('programada')) {
    procedimentos.push('Parto Normal');
  }
  if (lower.includes('cerclagem')) {
    procedimentos.push('Cerclagem');
  }
  if (lower.includes('diu')) {
    procedimentos.push('DIU');
  }
  
  return procedimentos.length > 0 ? procedimentos : ['Cesariana'];
}

async function verificarSeJaExiste(carteirinha: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('agendamentos_obst')
    .select('id')
    .eq('carteirinha', carteirinha)
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Erro ao verificar existência:', error);
    return false;
  }
  
  return !!data;
}

export async function processarFormsPartoFluxoNovo(
  rows: FormsPartoRow[],
  createdBy: string
): Promise<{
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let success = 0;
  let failed = 0;
  let skipped = 0;

  console.log(`Processando ${rows.length} pacientes...`);

  for (const row of rows) {
    try {
      // Validações básicas
      if (!row.carteirinha || !row.nomeCompleto) {
        errors.push(`ID ${row.id}: Carteirinha ou nome não informados`);
        failed++;
        continue;
      }

      // Verificar se já existe
      const jaExiste = await verificarSeJaExiste(row.carteirinha);
      if (jaExiste) {
        warnings.push(`ID ${row.id}: ${row.nomeCompleto} (${row.carteirinha}) já está no banco de dados`);
        skipped++;
        continue;
      }

      // Parse de datas
      const dataNascParsed = parseDate(row.dataNascimento);
      if (!dataNascParsed) {
        errors.push(`ID ${row.id}: Data de nascimento inválida - ${row.dataNascimento}`);
        failed++;
        continue;
      }

      const dataDumParsed = parseDate(row.dataDum || '');
      const dataPrimeiroUsgParsed = parseDate(row.dataPrimeiroUsg);

      if (!dataPrimeiroUsgParsed) {
        errors.push(`ID ${row.id}: Data do primeiro USG é obrigatória`);
        failed++;
        continue;
      }

      if (isNaN(row.semanasUsg) || isNaN(row.diasUsg)) {
        errors.push(`ID ${row.id}: IG no USG inválida`);
        failed++;
        continue;
      }

      // Preparar dados para cálculo
      const dadosCalculo = {
        dumStatus: row.dumStatus || 'Incerta',
        dataDum: dataDumParsed?.toISOString().split('T')[0],
        dataPrimeiroUsg: dataPrimeiroUsgParsed.toISOString().split('T')[0],
        semanasUsg: row.semanasUsg.toString(),
        diasUsg: row.diasUsg.toString(),
        procedimentos: extractProcedimentos(row.procedimentos),
        diagnosticosMaternos: row.diagnosticosMaternos ? [row.diagnosticosMaternos] : undefined,
        diagnosticosFetais: row.diagnosticosFetais && row.diagnosticosFetais !== '-' ? [row.diagnosticosFetais] : undefined,
        placentaPrevia: row.placentaPrevia && row.placentaPrevia !== '-' && row.placentaPrevia.toLowerCase() !== 'não'
          ? row.placentaPrevia
          : undefined
      };

      // Calcular agendamento
      const resultado = calcularAgendamentoCompleto(dadosCalculo);

      // Garantir data em 2025
      let dataAgendamento = new Date(resultado.dataAgendamento);
      if (dataAgendamento.getFullYear() < 2025) {
        dataAgendamento.setFullYear(2025);
      }

      // Verificar disponibilidade
      const isUrgente = resultado.observacoes.toLowerCase().includes('urgente');
      const disponibilidade = await verificarDisponibilidade(
        row.maternidade,
        dataAgendamento,
        isUrgente
      );

      if (!disponibilidade.disponivel) {
        warnings.push(`ID ${row.id}: ${row.nomeCompleto} - ${disponibilidade.mensagem}`);
      }

      // Preparar dados para inserção
      const agendamentoData = {
        nome_completo: row.nomeCompleto.trim(),
        carteirinha: row.carteirinha.trim(),
        data_nascimento: dataNascParsed.toISOString().split('T')[0],
        telefones: row.telefones || 'Não informado',
        email_paciente: row.emailPaciente || 'nao.informado@email.com',
        maternidade: row.maternidade,
        centro_clinico: 'Forms de Parto - Fluxo Novo 2025',
        medico_responsavel: row.medicoResponsavel || 'Médico Importado',
        numero_gestacoes: row.numeroGestacoes || 1,
        numero_partos_normais: row.numeroPartosNormais || 0,
        numero_partos_cesareas: row.numeroCesareas || 0,
        numero_abortos: row.numeroAbortos || 0,
        procedimentos: dadosCalculo.procedimentos,
        diagnosticos_maternos: row.diagnosticosMaternos || 'Não informado',
        diagnosticos_fetais: row.diagnosticosFetais && row.diagnosticosFetais !== '-' ? row.diagnosticosFetais : null,
        placenta_previa: dadosCalculo.placentaPrevia || null,
        indicacao_procedimento: row.indicacaoProcedimento,
        medicacao: row.medicacao && row.medicacao !== '-' ? row.medicacao : null,
        historia_obstetrica: row.historiaObstetrica && row.historiaObstetrica !== '-' ? row.historiaObstetrica : null,
        necessidade_uti_materna: row.necessidadeUtiMaterna === 'Sim' ? 'Sim' : 'Não',
        necessidade_reserva_sangue: row.necessidadeReservaSangue === 'Sim' ? 'Sim' : 'Não',
        dum_status: dadosCalculo.dumStatus,
        data_dum: dadosCalculo.dataDum || null,
        data_primeiro_usg: dadosCalculo.dataPrimeiroUsg,
        semanas_usg: row.semanasUsg,
        dias_usg: row.diasUsg,
        usg_recente: row.usgRecente || 'Sim',
        ig_pretendida: resultado.igAgendamento,
        data_agendamento_calculada: dataAgendamento.toISOString().split('T')[0],
        idade_gestacional_calculada: resultado.igFinal.displayText,
        observacoes_agendamento: `${resultado.observacoes}\nProtocolo: ${resultado.protocoloAplicado || 'Padrão'}\nDisponibilidade: ${disponibilidade.mensagem}`,
        created_by: createdBy,
        status: 'pendente'
      };

      // Inserir no banco
      const { error: insertError } = await supabase
        .from('agendamentos_obst')
        .insert(agendamentoData);

      if (insertError) {
        errors.push(`ID ${row.id}: ${insertError.message}`);
        failed++;
      } else {
        console.log(`✓ Inserido: ${row.nomeCompleto} (${row.carteirinha})`);
        success++;
      }

    } catch (error) {
      errors.push(`ID ${row.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      failed++;
    }
  }

  return { success, failed, skipped, errors, warnings };
}
