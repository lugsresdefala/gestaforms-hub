/**
 * PT-AON-097: Mapeamento Completo de Diagnósticos para IG Ideal
 * 
 * Este arquivo contém os mapeamentos EXATOS conforme especificação PT-AON-097 Rev.4
 * e PR-DIMEP-PGS-01 para cálculo de Idade Gestacional ideal por patologia.
 */

// ========== DIAGNÓSTICOS MATERNOS (PT-AON-097) ==========
export const DIAGNOSTICOS_MATERNOS: Record<string, number> = {
  // Hipertensão
  'hac dificil controle': 37,
  'hac 3 drogas': 37,
  'hipertensao dificil controle': 37,
  'hac compensada': 39,
  'hipertensao gestacional': 37,
  'dheg': 37,
  'pre-eclampsia': 37,
  'pre eclampsia': 37,
  'pe sem deterioracao': 37,
  'pe com deterioracao': 34,
  'sheg': 34,
  'eclampsia': 34,
  'hellp': 34,
  
  // Diabetes
  'dm1 descompensado': 36,
  'dm2 descompensado': 36,
  'dm1 controlado': 38,
  'dm2 controlado': 38,
  'dmg insulina descompensado': 37,
  'dmg com insulina descompensado': 37,
  'dmg insulina controlado': 38,
  'dmg com insulina controlado': 38,
  'dmg sem insulina descompensado': 37,
  'dmg sem insulina controlado': 39,
  'dmg dieta': 39,
  'diabetes gestacional': 39,
  'dmg': 39,
  
  // Cervicais
  'iic': 37,
  'cerclagem': 37,
  'incompetencia istmo': 37,
  
  // Rotura de Membranas
  'rpm': 34,
  'rpmo': 34,
  'rotura prematura': 34,
  'amniorrexe': 34,
  
  // Histórico Obstétrico
  'natimorto anterior': 38,
  'obito fetal anterior': 38,
  
  // Obesidade
  'obesidade': 39,
  'imc 35': 39,
  'imc 40': 39,
  
  // Doenças Autoimunes
  'les atividade': 37,
  'lupus atividade': 37,
  'les sem atividade': 38,
  'lupus sem atividade': 38,
  'les': 38,
  'lupus': 38,
  
  // Coagulopatias
  'trombofilia': 38,
  'saf': 38,
  'sindrome antifosfolipide': 38,
  'anemia falciforme': 38,
  'falciforme': 38,
  'talassemia': 38,
  
  // Doenças Sistêmicas
  'cardiopatia': 37,
  'nefropatia': 37,
  'hepatopatia': 37,
  'hipotireoidismo': 39,
  'hipertireoidismo': 37,
  'colestase': 37,
};

// ========== DIAGNÓSTICOS FETAIS (PT-AON-097) ==========
export const DIAGNOSTICOS_FETAIS: Record<string, number> = {
  // Líquido Amniótico
  'polidramnio severo': 36,
  'polidramnio grave': 36,
  'polidramnio leve': 38,
  'polidramnio moderado': 38,
  'polidramnio': 38,
  'oligoamnio': 36,
  'oligodramnia': 36,
  'anidramnio': 34,
  
  // Restrição de Crescimento
  'rcf p3 com doenca': 37,
  'rciu p3 com doenca': 37,
  'rcf p3 sem doenca': 37,
  'rciu p3 sem doenca': 37,
  'rcf p3': 37,
  'rciu p3': 37,
  'rcf doppler alterado': 36,
  'rciu doppler alterado': 36,
  'doppler alterado': 36,
  'rciu oligoamnio': 34,
  'rcf oligoamnio': 34,
  'rcf p10': 38,
  'rciu p10': 38,
  'pig': 38,
  'peg': 38,
  
  // Gemelaridade
  'gemelar mono mono': 33,
  'monoamniotico': 33,
  'gemelar mono di': 35,
  'monocorionico diamniotico': 35,
  'gemelar di di rcf': 37,
  'gemelar di di': 37,
  'dicorionico': 37,
  'gemelar': 37,
  'trigemelar di': 33,
  'trigemelar tri': 35,
  'trigemelar': 34,
  
  // Malformações
  'gastrosquise': 37,
  'mielomeningocele': 37,
  'espinha bifida': 37,
  'onfalocele': 38,
  'hernia diafragmatica': 38,
  'aneuploidia': 38,
  't21': 38,
  't18': 37,
  't13': 37,
  'down': 38,
  
  // Aloimunização
  'aloimunizacao tiu': 34,
  'aloimunizacao sem anemia': 38,
  'aloimunizacao': 37,
  'isoimunizacao': 37,
  'hidropsia': 34,
  
  // Macrossomia
  'macrossomia': 39,
  'gig': 39,
  
  // Apresentação
  'apresentacao pelvica': 39,
  'pelvico': 39,
  'transversa': 39,
  
  // Placentárias
  'vasa previa': 36,
  'placenta previa acretismo': 34,
  'acretismo': 34,
  'placenta previa': 36,
  'placenta marginal': 40,
  'placenta baixa': 38,
  'rotura uterina previa': 36,
  'miomectomia': 38,
  'insercao velamentosa': 39,
};

// ========== INDICAÇÕES ELETIVAS ==========
export const INDICACOES_ELETIVAS: Record<string, number> = {
  'cesarea laqueadura': 39,
  'laqueadura': 39,
  'cesarea iterativa': 39,
  'iteratividade': 39,
  '2 cesareas': 39,
  '3 cesareas': 38,
  'cesarea anterior': 39,
  'desejo materno': 39,
  'eletiva': 39,
  'sem indicacao': 39,
  'a pedido': 39,
};

// ========== PROCEDIMENTOS ESPECIAIS ==========
export const PROCEDIMENTOS_ESPECIAIS: Record<string, number> = {
  'cerclagem': 37,
  'iic': 37,
  'incompetencia istmo': 37,
  'incompetencia istmo cervical': 37,
  'colo curto': 37,
  'pessario': 37,
};

/**
 * Normaliza texto removendo acentos, convertendo para minúsculas e unificando espaços
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' '); // Unifica espaços
}

/**
 * Busca IG ideal baseado em texto de diagnóstico
 * Retorna o MENOR valor encontrado (resolução mais precoce)
 */
export function findIGFromDiagnosis(
  diagnostico: string,
  mappings: Record<string, number>
): { ig: number; termo: string } | null {
  const normalized = normalizeText(diagnostico);
  let result: { ig: number; termo: string } | null = null;
  
  for (const [termo, ig] of Object.entries(mappings)) {
    const termoNormalized = normalizeText(termo);
    if (normalized.includes(termoNormalized)) {
      if (!result || ig < result.ig) {
        result = { ig, termo };
      }
    }
  }
  
  return result;
}

/**
 * Busca em TODOS os mapeamentos e retorna o menor IG encontrado
 */
export function findMinIGFromAllDiagnoses(
  diagnosticoMaterno?: string,
  diagnosticoFetal?: string,
  indicacao?: string,
  procedimento?: string
): { ig: number; termo: string; fonte: string } | null {
  const results: Array<{ ig: number; termo: string; fonte: string }> = [];
  
  if (diagnosticoMaterno) {
    const found = findIGFromDiagnosis(diagnosticoMaterno, DIAGNOSTICOS_MATERNOS);
    if (found) results.push({ ...found, fonte: 'materno' });
  }
  
  if (diagnosticoFetal) {
    const found = findIGFromDiagnosis(diagnosticoFetal, DIAGNOSTICOS_FETAIS);
    if (found) results.push({ ...found, fonte: 'fetal' });
  }
  
  if (indicacao) {
    const found = findIGFromDiagnosis(indicacao, INDICACOES_ELETIVAS);
    if (found) results.push({ ...found, fonte: 'indicacao' });
  }
  
  if (procedimento) {
    const found = findIGFromDiagnosis(procedimento, PROCEDIMENTOS_ESPECIAIS);
    if (found) results.push({ ...found, fonte: 'procedimento' });
  }
  
  if (results.length === 0) return null;
  
  // Retorna o menor IG (resolução mais precoce)
  return results.reduce((min, curr) => curr.ig < min.ig ? curr : min);
}

/**
 * IG padrão quando nenhum diagnóstico específico é encontrado
 */
export const IG_PADRAO = 39;
