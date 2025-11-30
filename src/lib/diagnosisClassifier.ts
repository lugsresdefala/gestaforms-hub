// Auto-classification utility for free-text diagnoses
// Attempts to map free-text diagnoses to standardized protocol diagnoses

import { PROTOCOLS } from './obstetricProtocols';

export interface ClassificationResult {
  matched: boolean;
  standardizedDiagnosis?: string;
  confidence: 'high' | 'medium' | 'low';
  suggestions: string[];
  requiresReview: boolean;
}

// Keywords mapping for automatic classification
const DIAGNOSIS_KEYWORDS: Record<string, string[]> = {
  // Hypertension
  'hipertensao_gestacional': ['hipertensão gestacional', 'hipertensao gestacional', 'hg'],
  'hac': ['hipertensão crônica', 'hipertensao cronica', 'hac', 'has', 'hipertensão arterial sistemica'],
  'hac_dificil': ['hac difícil controle', 'hac dificil controle', 'hac 3 drogas', '3 anti-hipertensivos'],
  'pre_eclampsia_sem_deterioracao': ['pré-eclâmpsia sem deterioração', 'pre-eclampsia sem deterioracao', 'pe estável'],
  'pre_eclampsia_grave': ['pré-eclâmpsia grave', 'pre-eclampsia grave', 'pe grave', 'dheg'],
  'eclampsia': ['eclâmpsia', 'eclampsia', 'convulsão gestacional'],
  'sindrome_hellp': ['hellp', 'síndrome hellp', 'sindrome hellp'],
  
  // Diabetes
  'dmg_sem_insulina': ['dmg sem insulina', 'diabetes gestacional dieta', 'dmg controlado', 'dmg dieta'],
  'dmg_sem_insulina_descomp': ['dmg descompensado sem insulina', 'dmg descontrole dieta'],
  'dmg_insulina': ['dmg com insulina', 'diabetes gestacional insulina', 'dmg insulinodependente', 'dmg insulina'],
  'dmg_insulina_descomp': ['dmg insulina descompensado', 'dmg insulina descontrole'],
  'dm_pregestacional': ['diabetes tipo 1', 'diabetes tipo 2', 'dm tipo 1', 'dm tipo 2', 'dm pregestacional', 'dm pré-gestacional', 'mody', 'dm1', 'dm2'],
  'dm_pregestacional_descomp': ['dm pregestacional descompensado', 'dm descompensado', 'dm com complicações'],
  
  // Twin pregnancy
  'gestacao_gemelar_dicorionica': ['gemelar dicorionica', 'gemelar dicoriônica', 'gemeos dicorionicos', 'gêmeos dicoríonicos', 'bi corionico', 'bicorionico'],
  'gestacao_gemelar_monocorionica': ['gemelar monocorionica', 'gemelar monocoriônica', 'gemeos monocorionicos', 'mono corionico', 'monocorionico'],
  'gemelar_bicorionico': ['bicorionico', 'bicoriônico', 'bi'],
  'gemelar_monocorionico': ['monocorionico', 'monocoriônico', 'mono', 'stff'],
  'gemelar_monoamniotico': ['monoamniotico', 'monoamniôtico', 'mono mono'],
  
  // Placenta
  'placenta_previa_total': ['placenta prévia total', 'placenta previa total', 'pp total', 'pp centro total', 'pp central'],
  'placenta_previa_parcial': ['placenta prévia parcial', 'placenta previa parcial', 'pp parcial', 'pp marginal'],
  'placenta_baixa': ['placenta baixa', 'placenta de inserção baixa', 'pp baixa'],
  'placenta_previa_acretismo': ['placenta prévia acretismo', 'placenta previa acretismo', 'acretismo placentário', 'pp acretismo'],
  'placenta_acreta': ['placenta acreta', 'acretismo', 'acreta'],
  'placenta_percreta': ['placenta percreta', 'percreta', 'invasão vesical'],
  'dpp': ['descolamento placenta', 'descolamento prematuro', 'dpp', 'abruptio'],
  
  // Presentation
  'pelvico': ['apresentação pélvica', 'apresentacao pelvica', 'pélvica', 'pelvica', 'pódica', 'sentado'],
  'cormica': ['apresentação córmica', 'apresentacao cormica', 'situação transversa', 'transversa', 'oblíqua'],
  
  // Membranes rupture
  'rpmo_pretermo': ['rpmo pré-termo', 'rpmo pretermo', 'rotura prematura pretermo', 'bolsa rota prematuro'],
  'rpmo_termo': ['rpmo termo', 'rpmo a termo', 'rotura prematura termo', 'bolsa rota termo'],
  
  // Fetal growth
  'rcf': ['restrição crescimento', 'restricao crescimento', 'rcf', 'ciur', 'rciu', 'pig'],
  'rcf_grave': ['rcf grave', 'doppler crítico', 'doppler critico', 'diástole zero', 'diastole reversa', 'centralização fetal'],
  'macrossomia': ['macrossomia', 'macrossômico', 'feto grande', 'peso fetal >4000', 'feto gig', 'gig', '4000g', '4500g'],
  'macrossomia_severa': ['macrossomia severa', 'macrossomia grave', 'peso fetal >4500', '>4500g'],
  
  // Amniotic fluid
  'oligoamnio': ['oligoâmnio', 'oligoamnio', 'oligoidrâmnio', 'oligodramnia'],
  'oligodramnia': ['oligodrâmnio', 'oligodramnia', 'ila baixo', 'mbv baixo'],
  'oligodramnia_severa': ['oligodrâmnio severo', 'anidrâmnio', 'anidramnia', 'ila <2', 'mbv <1'],
  'polidramnio': ['polidrâmnio', 'polidramnio', 'polihidrâmnio', 'polidramnia', 'ila alto'],
  'polidramnia': ['polidrâmnio', 'polidramnia', 'líquido aumentado', 'ila >24'],
  
  // Previous surgeries
  'iteratividade_1cesarea': ['1 cesárea prévia', '1 cesarea previa', 'uma cesárea anterior'],
  'iteratividade_2cesarea': ['2 cesáreas prévias', '2 cesareas previas', 'iteratividade', 'múltiplas cesáreas'],
  'cesarea_corporal': ['cesárea corporal', 'cesarea corporal', 'incisão corporal', 'histerotomia corporal'],
  
  // Fetal malformations
  'malformacao_grave': ['malformação grave', 'malformacao grave', 'anomalia fetal', 'má formação', 'síndrome genética'],
  'cardiopatia_fetal': ['cardiopatia fetal', 'cardiopatia congênita', 'cardiopatia congenita', 'doença cardíaca fetal'],
  'hidrocefalia': ['hidrocefalia', 'hidrocéfalo', 'ventriculomegalia severa'],
  
  // Maternal diseases
  'cardiopatia_materna': ['cardiopatia materna', 'doença cardíaca', 'cardiopatia', 'valvopatia'],
  'cardiopatia_grave': ['cardiopatia grave', 'cf iii', 'cf iv', 'insuficiência cardíaca', 'ic descompensada'],
  'doenca_renal': ['doença renal', 'doenca renal', 'insuficiência renal', 'drc', 'nefropatia', 'creatinina alta'],
  'lupus': ['lúpus', 'lupus', 'les', 'lupus eritematoso'],
  'epilepsia': ['epilepsia', 'convulsões', 'convulsoes', 'síndrome epiléptica'],
  'trombofilia': ['trombofilia', 'trombofilias', 'saf', 'saaf', 'anticoagulação', 'tvp'],
  
  // Infections
  'hiv': ['hiv', 'aids', 'hiv positivo', 'soropositivo'],
  'hepatite_b': ['hepatite b', 'hbv', 'vhb'],
  'hepatite_c': ['hepatite c', 'hcv', 'vhc'],
  'herpes_ativo': ['herpes ativo', 'herpes genital ativo', 'lesão herpética'],
  
  // Uterine surgeries
  'miomatose': ['mioma', 'miomas', 'miomatose', 'leiomioma', 'fibroma uterino'],
  'miomectomia_previa': ['miomectomia prévia', 'miomectomia previa', 'cirurgia mioma', 'ressecção mioma'],
  
  // Special conditions
  'tpp_atual': ['trabalho parto prematuro', 'tpp', 'ameaça parto prematuro', 'app', 'contrações prematuras'],
  'obito_fetal_anterior': ['óbito fetal anterior', 'obito fetal anterior', 'óf anterior', 'oiu anterior', 'morte fetal anterior'],
  'gestacao_prolongada': ['gestação prolongada', 'gestacao prolongada', '41 semanas', 'pós-termo', 'pos-termo'],
  'idade_materna_avancada': ['idade materna avançada', 'idade materna avancada', 'ima', '>35 anos', 'idade avançada'],
  'obesidade_morbida': ['obesidade mórbida', 'obesidade morbida', 'imc >40', 'obesidade grau iii'],
  'aloimunizacao_rh': ['aloimunização', 'aloimunizacao', 'incompatibilidade rh', 'isoimunização', 'rh negativo sensibilizada'],
  
  // NOTE: desejo_materno and laqueadura removed - they are not clinical pathologies
  // and should not influence IG calculation (PT-AON-097)
};

export function classifyFreeDiagnosis(freeText: string): ClassificationResult {
  if (!freeText || freeText.trim().length === 0) {
    return {
      matched: false,
      confidence: 'low',
      suggestions: [],
      requiresReview: false,
    };
  }

  const normalizedText = freeText.toLowerCase().trim();
  const matches: { diagnosis: string; score: number }[] = [];

  // Try to match against keywords
  for (const [diagnosis, keywords] of Object.entries(DIAGNOSIS_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        // Give higher score for exact matches
        if (normalizedText === keyword.toLowerCase()) {
          score += 10;
        } else if (normalizedText.startsWith(keyword.toLowerCase())) {
          score += 5;
        } else {
          score += 2;
        }
      }
    }
    
    if (score > 0) {
      matches.push({ diagnosis, score });
    }
  }

  // Sort by score
  matches.sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    return {
      matched: false,
      confidence: 'low',
      suggestions: [],
      requiresReview: true,
    };
  }

  const topMatch = matches[0];
  const suggestions = matches.slice(0, 3).map(m => m.diagnosis);

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (topMatch.score >= 10) {
    confidence = 'high';
  } else if (topMatch.score >= 5) {
    confidence = 'medium';
  }

  return {
    matched: confidence === 'high',
    standardizedDiagnosis: topMatch.diagnosis,
    confidence,
    suggestions,
    requiresReview: confidence !== 'high',
  };
}

export function getDiagnosisLabel(diagnosisId: string): string {
  const labels: Record<string, string> = {
    'hipertensao_gestacional': 'Hipertensão gestacional',
    'hac': 'HAC - Hipertensão arterial crônica',
    'pre_eclampsia_grave': 'Pré-eclâmpsia grave / HELLP',
    'dmg_insulina': 'DMG com insulina',
    'dmg_sem_insulina': 'DMG sem insulina',
    'dm_pregestacional': 'DM pré-gestacional',
    'gestacao_gemelar_dicorionica': 'Gestação gemelar dicoriônica',
    'gestacao_gemelar_monocorionica': 'Gestação gemelar monocoriônica',
    'placenta_previa_acretismo': 'Placenta prévia com acretismo',
    'placenta_previa_sem_acretismo': 'Placenta prévia sem acretismo',
    'apresentacao_pelvica': 'Apresentação pélvica',
    'apresentacao_transversa': 'Apresentação transversa',
    'rcf': 'RCF - Restrição de crescimento fetal',
    'oligoamnio': 'Oligoâmnio',
    'polidramnio': 'Polidrâmnio',
    'macrossomia': 'Macrossomia fetal',
    'malformacao_fetal': 'Malformação fetal',
    'cardiopatia_fetal': 'Cardiopatia fetal',
    'obito_fetal': 'Óbito fetal',
    'tpp': 'TPP - Trabalho de parto prematuro',
    'rpmo': 'RPMO - Rotura prematura de membranas',
    'cardiopatia_materna': 'Cardiopatia materna',
    'trombofilias': 'Trombofilias',
    'obesidade': 'Obesidade (IMC >30)',
    'les': 'LES - Lúpus eritematoso sistêmico',
  };
  
  return labels[diagnosisId] || diagnosisId;
}

export async function logFreeDiagnosis(
  agendamentoId: string,
  diagnosticoLivre: string,
  classification: ClassificationResult
) {
  // This function will be called after saving the agendamento
  // to log the free diagnosis for audit purposes
  const logData = {
    agendamento_id: agendamentoId,
    diagnostico_livre: diagnosticoLivre,
    classificacao_automatica: classification.standardizedDiagnosis || null,
    requer_revisao: classification.requiresReview,
  };
  
  return logData;
}
