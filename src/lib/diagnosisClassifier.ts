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
  'hipertensao_gestacional': ['hipertensão gestacional', 'hipertensao gestacional', 'hg', 'dheg'],
  'hac': ['hipertensão crônica', 'hipertensao cronica', 'hac', 'has', 'hipertensão arterial sistemica'],
  'pre_eclampsia_grave': ['pré-eclâmpsia', 'pre-eclampsia', 'hellp', 'eclampsia', 'pe grave'],
  
  // Diabetes
  'dmg_insulina': ['dmg com insulina', 'diabetes gestacional insulina', 'dmg insulinodependente'],
  'dmg_sem_insulina': ['dmg sem insulina', 'diabetes gestacional dieta', 'dmg controlado'],
  'dm_pregestacional': ['diabetes tipo 1', 'diabetes tipo 2', 'dm tipo 1', 'dm tipo 2', 'dm pregestacional', 'mody'],
  
  // Twin pregnancy
  'gestacao_gemelar_dicorionica': ['gemelar dicorionica', 'gemelar dicoriónica', 'gemeos dicorionicos', 'gêmeos dicoríonicos'],
  'gestacao_gemelar_monocorionica': ['gemelar monocorionica', 'gemelar monocoriônica', 'gemeos monocorionicos'],
  
  // Placenta
  'placenta_previa_acretismo': ['placenta prévia acretismo', 'placenta previa acretismo', 'acretismo placentário'],
  'placenta_previa_sem_acretismo': ['placenta prévia', 'placenta previa', 'pp'],
  
  // Presentation
  'apresentacao_pelvica': ['apresentação pélvica', 'apresentacao pelvica', 'pélvica', 'pelvica', 'pódica'],
  'apresentacao_transversa': ['apresentação transversa', 'apresentacao transversa', 'situação transversa'],
  
  // Fetal
  'rcf': ['restrição crescimento', 'restricao crescimento', 'rcf', 'ciur', 'rciu'],
  'oligoamnio': ['oligoâmnio', 'oligoamnio', 'oligoidrâmnio'],
  'polidramnio': ['polidrâmnio', 'polidramnio', 'polihidrâmnio'],
  'macrossomia': ['macrossomia', 'macrossômico', 'feto grande', 'peso fetal >4000'],
  'malformacao_fetal': ['malformação', 'malformacao', 'anomalia fetal', 'má formação'],
  'cardiopatia_fetal': ['cardiopatia fetal', 'cardiopatia congênita', 'doença cardíaca fetal'],
  'obito_fetal': ['óbito fetal', 'obito fetal', 'óf', 'morte fetal'],
  
  // Other maternal
  'tpp': ['trabalho parto prematuro', 'tpp', 'ameaça parto prematuro', 'app'],
  'rpmo': ['rotura prematura membranas', 'rpmo', 'amniorrexe prematura'],
  'cardiopatia_materna': ['cardiopatia materna', 'doença cardíaca', 'insuficiência cardíaca'],
  'trombofilias': ['trombofilia', 'trombofilias', 'saf', 'saaf'],
  'obesidade': ['obesidade', 'imc >30', 'imc maior 30', 'imc acima 30'],
  'les': ['lúpus', 'lupus', 'les'],
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
