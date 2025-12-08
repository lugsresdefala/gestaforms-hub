/**
 * Sistema Inteligente de Normalização e Detecção de Diagnósticos
 * 
 * Este módulo detecta diagnósticos em texto livre e os normaliza para
 * os códigos de protocolo correspondentes, permitindo identificar a IG ideal.
 */

import { PROTOCOLS } from './obstetricProtocols';

// Mapeamento de termos/sinônimos para códigos de protocolo
interface DiagnosticPattern {
  protocolId: string;
  keywords: string[];
  priority: number; // Maior = mais específico/prioritário
  requiresAll?: boolean; // Se true, requer todas as keywords
}

/**
 * Padrões de diagnósticos com sinônimos e variações
 * Ordenados por prioridade (mais específicos primeiro)
 */
const DIAGNOSTIC_PATTERNS: DiagnosticPattern[] = [
  // ===== EMERGÊNCIAS (Prioridade máxima) =====
  {
    protocolId: 'eclampsia',
    keywords: ['eclampsia', 'eclâmpsia', 'convulsão', 'convulsao'],
    priority: 100
  },
  {
    protocolId: 'sindrome_hellp',
    keywords: ['hellp', 'hemolise', 'hemólise', 'plaquetopenia'],
    priority: 100
  },
  {
    protocolId: 'dpp',
    keywords: ['dpp', 'descolamento', 'placenta', 'prematuro'],
    priority: 100,
    requiresAll: true
  },
  
  // ===== HIPERTENSÃO (Prioridade alta) =====
  {
    protocolId: 'pre_eclampsia_com_deterioracao',
    keywords: ['pre-eclampsia grave', 'pré-eclâmpsia grave', 'pe grave', 'deterioracao', 'deterioração'],
    priority: 90
  },
  {
    protocolId: 'pre_eclampsia_sem_deterioracao',
    keywords: ['pre-eclampsia', 'pré-eclâmpsia', 'pe ', 'proteinuria', 'proteinúria'],
    priority: 85
  },
  {
    protocolId: 'hac_dificil',
    keywords: ['hac', 'hipertensao cronica', 'hipertensão crônica', 'dificil controle', 'difícil controle', '3 drogas', 'tres drogas'],
    priority: 85
  },
  {
    protocolId: 'hac_compensada',
    keywords: ['hac', 'hipertensao cronica', 'hipertensão crônica', 'compensada', 'controlada'],
    priority: 80
  },
  {
    protocolId: 'hipertensao_gestacional',
    keywords: ['hipertensao gestacional', 'hipertensão gestacional', 'dheg', 'hg '],
    priority: 80
  },
  
  // ===== DIABETES (Prioridade alta) =====
  {
    protocolId: 'dm_pregestacional_descontrole',
    keywords: ['dm1', 'dm2', 'diabetes tipo', 'pregestacional', 'descontrole', 'descompensada', 'vasculopatia', 'nefropatia', 'retinopatia'],
    priority: 90
  },
  {
    protocolId: 'dm_pregestacional_bom_controle',
    keywords: ['dm1', 'dm2', 'diabetes tipo', 'pregestacional', 'controlada', 'compensada'],
    priority: 85
  },
  {
    protocolId: 'dmg_insulina_descontrole',
    keywords: ['dmg', 'diabetes gestacional', 'insulina', 'descontrole', 'descompensada', 'macrossomia'],
    priority: 85
  },
  {
    protocolId: 'dmg_insulina_bom_controle',
    keywords: ['dmg', 'diabetes gestacional', 'insulina', 'controlada', 'compensada'],
    priority: 80
  },
  {
    protocolId: 'dmg_sem_insulina_descontrole',
    keywords: ['dmg', 'diabetes gestacional', 'dieta', 'descontrole', 'descompensada'],
    priority: 75
  },
  {
    protocolId: 'dmg_sem_insulina_bom_controle',
    keywords: ['dmg', 'diabetes gestacional', 'dieta', 'controlada', 'compensada'],
    priority: 70
  },
  {
    protocolId: 'dmg_sem_insulina_bom_controle',
    keywords: ['dmg', 'diabetes gestacional'],
    priority: 65
  },
  
  // ===== PLACENTA (Prioridade alta) =====
  {
    protocolId: 'placenta_acreta',
    keywords: ['acreta', 'acretismo', 'increta', 'percreta'],
    priority: 95
  },
  {
    protocolId: 'placenta_previa_total',
    keywords: ['placenta previa total', 'placenta prévia total', 'pp total', 'centro-total', 'centro total'],
    priority: 90
  },
  {
    protocolId: 'placenta_previa_marginal',
    keywords: ['placenta previa', 'placenta prévia', 'pp ', 'marginal', 'baixa'],
    priority: 85
  },
  
  // ===== LÍQUIDO AMNIÓTICO =====
  {
    protocolId: 'oligodramnia_severa',
    keywords: ['anidramnia', 'anidrâmnio', 'oligodramnia severa', 'oligodrâmnio severo'],
    priority: 90
  },
  {
    protocolId: 'oligoamnio_isolado',
    keywords: ['oligodramnia', 'oligodrâmnio', 'oligoamnio', 'oligoâmnio', 'la reduzido', 'líquido reduzido'],
    priority: 80
  },
  {
    protocolId: 'liquido_limitrofe',
    keywords: ['la limitrofe', 'líquido limítrofe', 'la borderline'],
    priority: 75
  },
  {
    protocolId: 'polidramnia_severo',
    keywords: ['polidramnia severo', 'polidrâmnio severo', 'polidramnia grave'],
    priority: 85
  },
  {
    protocolId: 'polidramnia_leve_moderado',
    keywords: ['polidramnia', 'polidrâmnio', 'la aumentado', 'líquido aumentado'],
    priority: 80
  },
  
  // ===== CRESCIMENTO FETAL =====
  {
    protocolId: 'rcf_doppler_critico',
    keywords: ['rcf', 'rciu', 'restricao', 'restrição', 'doppler', 'diastole zero', 'diástole zero', 'reversa'],
    priority: 95,
    requiresAll: true
  },
  {
    protocolId: 'rcf_doppler_alterado',
    keywords: ['rcf', 'rciu', 'restricao', 'restrição', 'doppler alterado', 'ip au'],
    priority: 90
  },
  {
    protocolId: 'rcf_menor_p3',
    keywords: ['rcf', 'rciu', 'restricao', 'restrição', 'p3', 'percentil 3', '<p3'],
    priority: 85
  },
  {
    protocolId: 'rcf_p3_p10_comorbidade',
    keywords: ['rcf', 'rciu', 'restricao', 'restrição', 'pig', 'p10', 'comorbidade'],
    priority: 80
  },
  {
    protocolId: 'rcf_pig_sem_comorbidade',
    keywords: ['rcf', 'rciu', 'restricao', 'restrição', 'pig', 'pequeno'],
    priority: 75
  },
  {
    protocolId: 'macrossomia_4500g',
    keywords: ['macrossomia', 'macrossômico', '4500', '4,5kg', '>4500'],
    priority: 85
  },
  {
    protocolId: 'macrossomia_4000g',
    keywords: ['macrossomia', 'macrossômico', '4000', '4kg', 'gig', 'grande'],
    priority: 80
  },
  
  // ===== GEMELARIDADE =====
  {
    protocolId: 'gemelar_monocorionico_monoamniotico',
    keywords: ['gemelar', 'gemeos', 'gêmeos', 'monocorionico', 'monocoriônico', 'monoamniotico', 'monoamniótico'],
    priority: 95,
    requiresAll: true
  },
  {
    protocolId: 'gemelar_monocorionico_diamniotico',
    keywords: ['gemelar', 'gemeos', 'gêmeos', 'monocorionico', 'monocoriônico', 'diamniotico', 'diamniótico'],
    priority: 90,
    requiresAll: true
  },
  {
    protocolId: 'gemelar_bicorionico',
    keywords: ['gemelar', 'gemeos', 'gêmeos', 'bicorionico', 'bicoriônico', 'dicorionico', 'dicoriônico'],
    priority: 85
  },
  {
    protocolId: 'gemelar_bicorionico',
    keywords: ['gemelar', 'gemeos', 'gêmeos', 'dupla'],
    priority: 75
  },
  
  // ===== APRESENTAÇÃO =====
  {
    protocolId: 'transversa',
    keywords: ['transversa', 'situacao transversa', 'situação transversa', 'cormica'],
    priority: 85
  },
  {
    protocolId: 'pelvica',
    keywords: ['pelvica', 'pélvica', 'podalica', 'podálica', 'sentado', 'breech'],
    priority: 85
  },
  
  // ===== ITERATIVIDADE =====
  {
    protocolId: 'cesarea_classica',
    keywords: ['cesarea classica', 'cesárea clássica', 'corporal', 'segmento superior'],
    priority: 95
  },
  {
    protocolId: 'iteratividade_3_ou_mais',
    keywords: ['3 cesareas', '3 cesáreas', 'tres cesareas', 'três cesáreas', '4 cesareas', 'quatro cesareas'],
    priority: 90
  },
  {
    protocolId: 'iteratividade_2',
    keywords: ['2 cesareas', '2 cesáreas', 'duas cesareas', 'duas cesáreas', 'iteratividade'],
    priority: 85
  },
  
  // ===== OUTRAS CONDIÇÕES MATERNAS =====
  {
    protocolId: 'les_atividade',
    keywords: ['les', 'lupus', 'atividade', 'ativo'],
    priority: 85
  },
  {
    protocolId: 'les_sem_atividade',
    keywords: ['les', 'lupus', 'remissao', 'remissão', 'inativo'],
    priority: 80
  },
  {
    protocolId: 'les_sem_atividade',
    keywords: ['les', 'lupus'],
    priority: 75
  },
  {
    protocolId: 'trombofilia',
    keywords: ['trombofilia', 'trombose', 'anticoagulacao', 'anticoagulação', 'saf', 'antifosfolipide'],
    priority: 85
  },
  {
    protocolId: 'anemia_falciforme',
    keywords: ['falciforme', 'anemia falciforme', 'doenca falciforme', 'doença falciforme'],
    priority: 85
  },
  {
    protocolId: 'iic',
    keywords: ['iic', 'incompetencia', 'incompetência', 'istmo', 'cervical', 'cerclagem'],
    priority: 85
  },
  {
    protocolId: 'natimorto_anterior',
    keywords: ['natimorto', 'obito fetal', 'óbito fetal', 'morte fetal', 'anterior', 'previo', 'prévio'],
    priority: 85
  },
  {
    protocolId: 'obesidade_imc35',
    keywords: ['obesidade', 'imc', 'obesa', 'morbida', 'mórbida', '35'],
    priority: 80
  },
  {
    protocolId: 'rpmo',
    keywords: ['rpmo', 'rotura', 'ruptura', 'membranas', 'bolsa rota'],
    priority: 90
  },
  
  // ===== INFECÇÕES =====
  {
    protocolId: 'hiv_cv_detectavel',
    keywords: ['hiv', 'aids', 'carga viral', 'detectavel', 'detectável', '>1000'],
    priority: 85
  },
  {
    protocolId: 'hiv_cv_indetectavel',
    keywords: ['hiv', 'aids', 'indetectavel', 'indetectável', 'controlado'],
    priority: 80
  },
  {
    protocolId: 'hiv_cv_indetectavel',
    keywords: ['hiv', 'aids'],
    priority: 75
  },
  {
    protocolId: 'hepatite_b_alta_carga',
    keywords: ['hepatite b', 'hbv', 'alta carga', '>200000'],
    priority: 85
  },
  {
    protocolId: 'hepatite_b_baixa_carga',
    keywords: ['hepatite b', 'hbv', 'baixa carga', 'controlada'],
    priority: 80
  },
  {
    protocolId: 'hepatite_b_baixa_carga',
    keywords: ['hepatite b', 'hbv'],
    priority: 75
  },
  {
    protocolId: 'hepatite_c',
    keywords: ['hepatite c', 'hcv'],
    priority: 80
  },
  {
    protocolId: 'sifilis_tratada',
    keywords: ['sifilis', 'sífilis', 'tratada', 'vdrl negativo'],
    priority: 80
  },
  {
    protocolId: 'sifilis_nao_tratada',
    keywords: ['sifilis', 'sífilis', 'nao tratada', 'não tratada', 'vdrl positivo'],
    priority: 85
  },
  
  // ===== MALFORMAÇÕES =====
  {
    protocolId: 'malformacao_grave',
    keywords: ['malformacao grave', 'malformação grave', 'anomalia grave', 'incompativel', 'incompatível'],
    priority: 90
  },
  {
    protocolId: 'malformacao_corrigivel',
    keywords: ['malformacao', 'malformação', 'anomalia', 'corrigivel', 'corrigível'],
    priority: 85
  },
  
  // ===== DESEJO MATERNO (Prioridade baixa - padrão) =====
  {
    protocolId: 'desejo_materno',
    keywords: ['desejo materno', 'eletiva', 'eletivo', 'opcao', 'opção'],
    priority: 50
  },
  {
    protocolId: 'laqueadura',
    keywords: ['laqueadura', 'ligadura', 'esterilizacao', 'esterilização'],
    priority: 55
  },
];

/**
 * Normaliza texto para comparação
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, ' ') // Remove pontuação
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
}

/**
 * Verifica se um texto contém todas as keywords de um padrão
 */
function matchesPattern(text: string, pattern: DiagnosticPattern): boolean {
  const normalizedText = normalizeText(text);
  
  if (pattern.requiresAll) {
    // Requer TODAS as keywords
    return pattern.keywords.every(keyword => 
      normalizedText.includes(normalizeText(keyword))
    );
  } else {
    // Requer QUALQUER keyword
    return pattern.keywords.some(keyword => 
      normalizedText.includes(normalizeText(keyword))
    );
  }
}

/**
 * Detecta diagnósticos em múltiplas colunas de texto
 */
export function detectDiagnostics(
  diagnosticosMaternos: string,
  diagnosticosFetais: string,
  indicacao: string
): string[] {
  // Combinar todos os textos
  const combinedText = [
    diagnosticosMaternos || '',
    diagnosticosFetais || '',
    indicacao || ''
  ].join(' ');
  
  if (!combinedText.trim()) {
    return ['desejo_materno']; // Padrão se não houver diagnósticos
  }
  
  // Encontrar todos os padrões que correspondem
  const matches: Array<{ protocolId: string; priority: number }> = [];
  
  for (const pattern of DIAGNOSTIC_PATTERNS) {
    if (matchesPattern(combinedText, pattern)) {
      matches.push({
        protocolId: pattern.protocolId,
        priority: pattern.priority
      });
    }
  }
  
  if (matches.length === 0) {
    return ['desejo_materno']; // Padrão se nenhum diagnóstico detectado
  }
  
  // Ordenar por prioridade (maior primeiro)
  matches.sort((a, b) => b.priority - a.priority);
  
  // Retornar IDs únicos
  const uniqueIds = [...new Set(matches.map(m => m.protocolId))];
  
  return uniqueIds;
}

/**
 * Seleciona o protocolo mais prioritário entre os detectados
 */
export function selectPrimaryProtocol(detectedProtocols: string[]): string {
  if (detectedProtocols.length === 0) {
    return 'desejo_materno';
  }
  
  // Encontrar o protocolo com maior prioridade
  let highestPriority = -1;
  let primaryProtocol = 'desejo_materno';
  
  for (const protocolId of detectedProtocols) {
    const protocol = PROTOCOLS[protocolId];
    if (protocol && protocol.prioridade > highestPriority) {
      highestPriority = protocol.prioridade;
      primaryProtocol = protocolId;
    }
  }
  
  return primaryProtocol;
}

/**
 * Função principal: detecta e retorna o protocolo primário
 */
export function detectAndSelectProtocol(
  diagnosticosMaternos: string,
  diagnosticosFetais: string,
  indicacao: string
): {
  primaryProtocol: string;
  allDetected: string[];
  confidence: 'high' | 'medium' | 'low';
} {
  const detected = detectDiagnostics(diagnosticosMaternos, diagnosticosFetais, indicacao);
  const primary = selectPrimaryProtocol(detected);
  
  // Determinar confiança baseado no número de detecções
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (detected.length > 0 && primary !== 'desejo_materno') {
    confidence = detected.length >= 2 ? 'high' : 'medium';
  }
  
  return {
    primaryProtocol: primary,
    allDetected: detected,
    confidence
  };
}

/**
 * Função auxiliar para debug: mostra quais keywords foram encontradas
 */
export function debugDiagnosticDetection(
  diagnosticosMaternos: string,
  diagnosticosFetais: string,
  indicacao: string
): Array<{ protocolId: string; matchedKeywords: string[]; priority: number }> {
  const combinedText = [
    diagnosticosMaternos || '',
    diagnosticosFetais || '',
    indicacao || ''
  ].join(' ');
  
  const normalizedText = normalizeText(combinedText);
  const results: Array<{ protocolId: string; matchedKeywords: string[]; priority: number }> = [];
  
  for (const pattern of DIAGNOSTIC_PATTERNS) {
    const matchedKeywords = pattern.keywords.filter(keyword =>
      normalizedText.includes(normalizeText(keyword))
    );
    
    if (matchedKeywords.length > 0) {
      const matches = pattern.requiresAll 
        ? matchedKeywords.length === pattern.keywords.length
        : matchedKeywords.length > 0;
      
      if (matches) {
        results.push({
          protocolId: pattern.protocolId,
          matchedKeywords,
          priority: pattern.priority
        });
      }
    }
  }
  
  return results.sort((a, b) => b.priority - a.priority);
}
