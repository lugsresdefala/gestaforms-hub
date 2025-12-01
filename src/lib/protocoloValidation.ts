// Validação de protocolo para agendamentos obstétricos
import { PROTOCOLS } from "./obstetricProtocols";

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
  
  // VALIDAÇÃO CRÍTICA: DMG com repercussão fetal (FETO GIG / Macrossomia)
  const temDMG = dados.diagnosticosMaternos.some(d => {
    const lower = d.toLowerCase();
    return lower.includes('dmg') || lower.includes('dm2') || lower.includes('dm 2') || 
           lower.includes('diabetes') || lower.includes('diabete');
  });
  
  const temRepercussaoFetal = [...dados.diagnosticosMaternos, ...dados.diagnosticosFetais].some(d => {
    const lower = d.toLowerCase();
    return lower.includes('macrossomia') || lower.includes('gig') || lower.includes('feto gig') ||
           lower.includes('grande para idade') || lower.includes('grande para a idade') ||
           lower.includes('repercussão fetal') || lower.includes('repercussao fetal') ||
           lower.includes('peso fetal elevado') || lower.includes('feto grande');
  });
  
  // DMG + Repercussão Fetal = protocolo DESCOMPENSADA (37-38 semanas MAX)
  if (temDMG && temRepercussaoFetal) {
    if (igTotal >= 39) {
      alertas.push('🚨 CRÍTICO: DMG com repercussão fetal (FETO GIG) - IG máxima recomendada: 37-38 semanas');
      alertas.push('⚠️ IG atual ('+dados.igSemanas+'s'+dados.igDias+'d = '+igTotal.toFixed(1)+' semanas) está ACIMA do protocolo');
      compativel = false;
    } else if (igTotal >= 38) {
      alertas.push('⚠️ ATENÇÃO: DMG com repercussão fetal - IG no limite superior (38 semanas)');
      recomendacoes.push('Considerar antecipação para 37 semanas se houver outras comorbidades');
    } else if (igTotal >= 37 && igTotal < 38) {
      recomendacoes.push('✓ DMG com repercussão fetal: IG dentro da janela recomendada (37-38 semanas)');
    } else {
      recomendacoes.push('ℹ️ DMG com repercussão fetal: IG abaixo da janela ideal (37-38 semanas)');
    }
  }
  
  // Validar protocolos específicos dos diagnósticos
  [...dados.diagnosticosMaternos, ...dados.diagnosticosFetais].forEach(diagnostico => {
    if (diagnostico === 'nenhum_materno' || diagnostico === 'nenhum_fetal') return;
    
    const protocolo = PROTOCOLS[diagnostico];
    if (protocolo) {
      const igIdealParts = protocolo.igIdeal.split('-');
      const igMin = parseInt(igIdealParts[0]);
      const igMax = igIdealParts.length > 1 ? parseInt(igIdealParts[1]) : igMin;
      const margemMax = igMax + (protocolo.margemDias / 7);
      
      if (igTotal < igMin) {
        if (protocolo.prioridade === 1) {
          alertas.push(`🚨 CRÍTICO: ${diagnostico.replace(/_/g, ' ')} - IG atual (${dados.igSemanas}+${dados.igDias}) abaixo do mínimo (${igMin} semanas)`);
          compativel = false;
        } else {
          recomendacoes.push(`⚠️ ${diagnostico.replace(/_/g, ' ')}: IG recomendada ${protocolo.igIdeal} semanas (${protocolo.observacoes})`);
        }
      } else if (igTotal > margemMax) {
        alertas.push(`⚠️ ATENÇÃO: ${diagnostico.replace(/_/g, ' ')} - IG atual ultrapassou janela ideal + margem (${protocolo.igIdeal} + ${protocolo.margemDias}d)`);
        compativel = false;
      } else if (igTotal >= igMin && igTotal <= margemMax) {
        recomendacoes.push(`✓ ${diagnostico.replace(/_/g, ' ')}: IG dentro da janela recomendada (${protocolo.igIdeal} ±${protocolo.margemDias}d)`);
      }
    }
  });

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

  // VALIDAÇÃO CRÍTICA: Múltiplas comorbidades de alta prioridade
  // Detectar comorbidades graves no texto livre
  const comorbidadesDetectadas: string[] = [];
  const todosOsDiagnosticos = [...dados.diagnosticosMaternos, ...dados.diagnosticosFetais];
  
  todosOsDiagnosticos.forEach(d => {
    const lower = d.toLowerCase();
    
    // Hipertensão grave
    if (lower.includes('pré-eclâmpsia grave') || lower.includes('pre-eclampsia grave') || 
        lower.includes('pe grave') || lower.includes('dheg') || lower.includes('eclâmpsia') ||
        lower.includes('eclampsia') || lower.includes('hellp')) {
      comorbidadesDetectadas.push('Distúrbio hipertensivo grave');
    }
    
    // Diabetes descompensada
    if ((lower.includes('dmg') || lower.includes('diabetes')) && 
        (lower.includes('descomp') || lower.includes('descontrole') || lower.includes('insulina'))) {
      comorbidadesDetectadas.push('Diabetes descompensada/insulinodependente');
    }
    
    // Placenta prévia/acretismo
    if (lower.includes('placenta') && (lower.includes('prévia') || lower.includes('previa') || 
        lower.includes('acreta') || lower.includes('percreta') || lower.includes('acretismo'))) {
      comorbidadesDetectadas.push('Patologia placentária grave');
    }
    
    // Restrição de crescimento grave
    if (lower.includes('rcf') || (lower.includes('restrição') && lower.includes('crescimento')) ||
        lower.includes('restricao') || lower.includes('doppler crítico') || lower.includes('doppler critico')) {
      comorbidadesDetectadas.push('Restrição de crescimento fetal');
    }
    
    // Gestação gemelar monocoriônica
    if ((lower.includes('gemelar') || lower.includes('gêmeos')) && 
        (lower.includes('mono') || lower.includes('monocoriônica'))) {
      comorbidadesDetectadas.push('Gestação gemelar monocoriônica');
    }
  });
  
  // Remover duplicadas
  const comorbidadesUnicas = [...new Set(comorbidadesDetectadas)];
  
  if (comorbidadesUnicas.length >= 2) {
    alertas.push(`🚨 ATENÇÃO: ${comorbidadesUnicas.length} comorbidades graves detectadas: ${comorbidadesUnicas.join(', ')}`);
    recomendacoes.push('⚠️ Múltiplas comorbidades requerem avaliação médica criteriosa da IG de interrupção');
    
    // Com múltiplas comorbidades graves, ser mais restritivo
    if (igTotal >= 38.5) {
      alertas.push('⚠️ Com múltiplas comorbidades graves, IG ≥38.5 semanas requer justificativa clínica detalhada');
      compativel = false;
    } else if (igTotal >= 38) {
      alertas.push('⚠️ Com múltiplas comorbidades graves, considerar antecipação para <38 semanas');
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

  // Validação para Cerclagem - janela ideal 12-16 semanas
  if (dados.procedimentos.includes('Cerclagem')) {
    if (igTotal > 16) {
      alertas.push('🚨 CRÍTICO: Cerclagem após 16 semanas - fora da janela ideal (12-16 semanas)');
      alertas.push(`⚠️ IG atual: ${dados.igSemanas}s${dados.igDias}d - Paciente já passou da janela ideal para cerclagem`);
      recomendacoes.push('Requer avaliação médica urgente para decidir conduta');
      compativel = false;
    } else if (igTotal > 14 && igTotal <= 16) {
      alertas.push('⚠️ ATENÇÃO: Cerclagem no limite superior da janela (14-16 semanas)');
      recomendacoes.push('Priorizar agendamento imediato - janela fechando');
    } else if (igTotal >= 12 && igTotal <= 14) {
      recomendacoes.push('✓ Cerclagem: IG dentro da janela ideal (12-14 semanas)');
    } else if (igTotal < 10) {
      // Paciente muito precoce - calcular quando entrará na janela
      const semanasAteJanela = 12 - igTotal;
      alertas.push(`ℹ️ IG atual: ${dados.igSemanas}s${dados.igDias}d - Paciente entrará na janela de cerclagem em ${semanasAteJanela.toFixed(1)} semanas`);
      recomendacoes.push('Agendar cerclagem para 12-14 semanas');
    } else if (igTotal >= 10 && igTotal < 12) {
      recomendacoes.push(`ℹ️ IG atual: ${dados.igSemanas}s${dados.igDias}d - Próxima à janela de cerclagem (12-16 semanas)`);
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
