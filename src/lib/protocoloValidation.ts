// Validação de protocolo para agendamentos obstétricos

export interface ValidacaoProtocolo {
  compativel: boolean;
  alertas: string[];
  recomendacoes: string[];
}

export const validarProtocolo = (dados: {
  procedimentos: string[];
  diagnosticosMaternos: string[];
  diagnosticosFetais: string[];
  placentaPrevia?: string;
  igSemanas: number;
  igDias: number;
}): ValidacaoProtocolo => {
  const alertas: string[] = [];
  const recomendacoes: string[] = [];
  let compativel = true;

  const igTotal = dados.igSemanas + (dados.igDias / 7);

  // Validação para Cesárea Eletiva
  if (dados.procedimentos.includes('Cesárea Eletiva')) {
    if (igTotal < 37) {
      alertas.push('⚠️ PROTOCOLO: Cesárea eletiva recomendada apenas após 37 semanas completas');
      compativel = false;
    }
    
    if (igTotal > 39) {
      alertas.push('⚠️ ATENÇÃO: IG acima de 39 semanas - avaliar necessidade de indução');
    }

    // Verificar indicações específicas para cesárea antes de 39 semanas
    const indicacoesPrecoces = [
      'Placenta prévia total',
      'Descolamento prematuro de placenta',
      'Vasa prévia',
      'Apresentação pélvica'
    ];

    const temIndicacaoPrecoce = 
      dados.diagnosticosMaternos.some(d => indicacoesPrecoces.includes(d)) ||
      dados.diagnosticosFetais.some(d => indicacoesPrecoces.includes(d)) ||
      (dados.placentaPrevia && dados.placentaPrevia !== 'Não');

    if (!temIndicacaoPrecoce && igTotal < 39) {
      alertas.push('⚠️ PROTOCOLO: Cesárea eletiva sem indicação específica deve ser realizada com 39 semanas completas');
      recomendacoes.push('Considerar reagendar para 39 semanas ou documentar indicação específica');
    }
  }

  // Validação para Parto Normal/Indução
  if (dados.procedimentos.includes('Parto Normal') || dados.procedimentos.includes('Indução do Parto')) {
    if (igTotal < 37) {
      alertas.push('⚠️ PROTOCOLO: Indução eletiva não recomendada antes de 37 semanas');
      compativel = false;
    }

    if (igTotal >= 41) {
      recomendacoes.push('✓ IG ≥ 41 semanas: Indução está indicada conforme protocolo');
    }
  }

  // Validação para Cerclagem
  if (dados.procedimentos.includes('Cerclagem')) {
    if (igTotal > 24) {
      alertas.push('⚠️ PROTOCOLO: Cerclagem geralmente realizada entre 12-24 semanas');
      recomendacoes.push('Verificar indicação para cerclagem tardia');
    }
    
    if (igTotal < 12) {
      alertas.push('⚠️ ATENÇÃO: IG muito precoce para cerclagem - avaliar riscos');
    }
  }

  // Validação para Amniocentese
  if (dados.procedimentos.includes('Amniocentese')) {
    if (igTotal < 15) {
      alertas.push('⚠️ PROTOCOLO: Amniocentese geralmente realizada após 15 semanas');
      compativel = false;
    }
  }

  // Validação para Placenta Prévia
  if (dados.placentaPrevia === 'Total' || dados.placentaPrevia === 'Marginal') {
    if (!dados.procedimentos.includes('Cesárea Eletiva')) {
      alertas.push('⚠️ CRÍTICO: Placenta prévia requer cesárea eletiva');
      compativel = false;
    }
    
    if (igTotal < 36) {
      recomendacoes.push('Placenta prévia: Avaliar maturidade pulmonar fetal antes de 37 semanas');
    }
  }

  // Validações de diagnósticos maternos críticos
  const diagnosticosCriticos = [
    'Pré-eclâmpsia grave',
    'Eclâmpsia',
    'Síndrome HELLP',
    'Descolamento prematuro de placenta'
  ];

  const temDiagnosticoCritico = dados.diagnosticosMaternos.some(d => 
    diagnosticosCriticos.includes(d)
  );

  if (temDiagnosticoCritico) {
    alertas.push('⚠️ URGENTE: Diagnóstico materno crítico detectado - avaliar necessidade de antecipação');
    if (igTotal >= 34) {
      recomendacoes.push('✓ IG ≥ 34 semanas: Considerar antecipação do parto');
    }
  }

  // Validações de diagnósticos fetais
  const diagnosticosFetaisCriticos = [
    'Restrição de crescimento fetal grave',
    'Sofrimento fetal',
    'Oligoâmnio grave'
  ];

  const temDiagnosticoFetalCritico = dados.diagnosticosFetais.some(d => 
    diagnosticosFetaisCriticos.includes(d)
  );

  if (temDiagnosticoFetalCritico) {
    alertas.push('⚠️ URGENTE: Diagnóstico fetal crítico - avaliar bem-estar fetal e necessidade de antecipação');
  }

  // Gestação gemelar
  if (dados.diagnosticosMaternos.includes('Gestação gemelar') || 
      dados.diagnosticosFetais.includes('Gestação gemelar')) {
    if (igTotal >= 38) {
      recomendacoes.push('✓ Gestação gemelar com ≥ 38 semanas: Considerar antecipação conforme protocolo');
    }
  }

  return {
    compativel,
    alertas,
    recomendacoes
  };
};
