// Protocolos Obstétricos - Hapvida NotreDame Intermédica
// Baseado em PT-AON-097 (Rev. 4 - 27/09/2024) e PR-GNDI-PPS-27 (21/05/2020)
// Refatorado com checklists padronizadas e cálculo automático da IG pretendida

export interface ProtocolConfig {
  igIdeal: string;
  igIdealMax?: string; // Para protocolos com faixa (ex: 39-40 semanas)
  margemDias: number;
  prioridade: number;
  viaPreferencial: string;
  observacoes: string;
  categoria: string;
}

// Categorias de diagnósticos para organização da UI
export type DiagnosticCategory = 
  | 'hipertensao'
  | 'diabetes'
  | 'outras_maternas'
  | 'liquido_amniotico'
  | 'crescimento_fetal'
  | 'gemelaridade'
  | 'placentarias'
  | 'rotura_membranas'
  | 'apresentacao'
  | 'iteratividade'
  | 'malformacoes'
  | 'infeccoes'
  | 'eletivos';

export interface DiagnosticOption {
  id: string;
  label: string;
  igIdeal: string;
  igIdealMax?: string;
  categoria: DiagnosticCategory;
  observacoes: string;
}

// CHECKLIST PADRONIZADA DE DIAGNÓSTICOS - Baseada nos protocolos Hapvida/NotreDame
export const DIAGNOSTIC_CHECKLIST: DiagnosticOption[] = [
  // ===== 1. CONDIÇÕES MATERNAS =====
  
  // 1.1. Hipertensão
  { id: "hac_compensada", label: "Hipertensão crônica compensada", igIdeal: "39", igIdealMax: "40", categoria: "hipertensao", observacoes: "HAC compensada sem medicação ou dose estável" },
  { id: "hac_dificil", label: "Hipertensão crônica difícil controle (≥3 drogas)", igIdeal: "37", categoria: "hipertensao", observacoes: "HAC com 3 ou mais anti-hipertensivos" },
  { id: "hipertensao_gestacional", label: "Hipertensão gestacional", igIdeal: "37", categoria: "hipertensao", observacoes: "Hipertensão diagnosticada após 20 semanas" },
  { id: "pre_eclampsia_sem_deterioracao", label: "Pré-eclâmpsia SEM deterioração clínica", igIdeal: "37", categoria: "hipertensao", observacoes: "Pré-eclâmpsia sem sinais de gravidade" },
  { id: "pre_eclampsia_com_deterioracao", label: "Pré-eclâmpsia COM deterioração clínica", igIdeal: "28", categoria: "hipertensao", observacoes: "Protocolo SHEG >28sem - prioridade crítica" },
  
  // 1.2. Diabetes na Gestação
  { id: "dmg_sem_insulina_bom_controle", label: "DMG sem insulina, bom controle, sem repercussão fetal", igIdeal: "39", igIdealMax: "40", categoria: "diabetes", observacoes: "Diabetes gestacional controlada com dieta" },
  { id: "dmg_sem_insulina_descontrole", label: "DMG sem insulina, com descontrole ou repercussão fetal", igIdeal: "37", igIdealMax: "38", categoria: "diabetes", observacoes: "DMG dieta com alteração de crescimento ou controle glicêmico" },
  { id: "dmg_insulina_bom_controle", label: "DMG com insulina, bom controle, sem repercussão fetal", igIdeal: "38", categoria: "diabetes", observacoes: "DMG insulinizada com bom controle" },
  { id: "dmg_insulina_descontrole", label: "DMG com insulina, com descontrole ou repercussão fetal", igIdeal: "37", categoria: "diabetes", observacoes: "DMG insulinizada com descontrole" },
  { id: "dm_pregestacional_bom_controle", label: "DM1/DM2 com bom controle, sem complicações", igIdeal: "38", categoria: "diabetes", observacoes: "Diabetes pré-gestacional controlada" },
  { id: "dm_pregestacional_descontrole", label: "DM1/DM2 com descontrole ou complicações", igIdeal: "36", igIdealMax: "37", categoria: "diabetes", observacoes: "DM com vasculopatia, nefropatia ou retinopatia" },
  
  // 1.3. Outras Condições Maternas
  { id: "desejo_materno", label: "Parto cesárea por desejo materno", igIdeal: "39", categoria: "eletivos", observacoes: "Cesárea eletiva ≥39 semanas" },
  { id: "laqueadura", label: "Cesárea com laqueadura tubária", igIdeal: "39", categoria: "eletivos", observacoes: "39 semanas - verificar termo de consentimento 60 dias" },
  { id: "rpmo", label: "Rotura prematura de membranas", igIdeal: "34", categoria: "rotura_membranas", observacoes: "RPMO pré-termo - corticoide + antibiótico" },
  { id: "natimorto_anterior", label: "Natimorto em gestação anterior", igIdeal: "38", igIdealMax: "39", categoria: "outras_maternas", observacoes: "História de óbito fetal prévio" },
  { id: "obesidade_imc35", label: "Obesidade (IMC ≥35)", igIdeal: "39", igIdealMax: "40", categoria: "outras_maternas", observacoes: "Obesidade grau II ou superior" },
  { id: "les_atividade", label: "Lúpus Eritematoso Sistêmico em atividade", igIdeal: "37", categoria: "outras_maternas", observacoes: "LES com atividade de doença" },
  { id: "les_sem_atividade", label: "Lúpus Eritematoso Sistêmico sem atividade", igIdeal: "38", igIdealMax: "39", categoria: "outras_maternas", observacoes: "LES em remissão" },
  { id: "trombofilia", label: "Trombofilias ou Antecedente de Trombose (profilaxia)", igIdeal: "38", igIdealMax: "39", categoria: "outras_maternas", observacoes: "Anticoagulação profilática" },
  { id: "anemia_falciforme", label: "Anemia Falciforme", igIdeal: "38", igIdealMax: "39", categoria: "outras_maternas", observacoes: "Doença falciforme" },
  { id: "iic", label: "Incompetência Istmo Cervical (IIC)", igIdeal: "37", categoria: "outras_maternas", observacoes: "IIC com ou sem cerclagem prévia" },
  
  // ===== 2. INTERCORRÊNCIAS FETAIS =====
  
  // 2.1. Alterações do Líquido Amniótico
  { id: "polidramnia_leve_moderado", label: "Polidrâmnio leve-moderado (80mm < MB < 160mm)", igIdeal: "38", igIdealMax: "39", categoria: "liquido_amniotico", observacoes: "ILA 25-32 ou MBV 80-160mm" },
  { id: "polidramnia_severo", label: "Polidrâmnio severo (MB ≥160mm)", igIdeal: "35", igIdealMax: "37", categoria: "liquido_amniotico", observacoes: "ILA >32 ou MBV ≥160mm" },
  { id: "oligoamnio_isolado", label: "Oligoâmnio ISOLADO (MBV <20mm)", igIdeal: "36", igIdealMax: "37", categoria: "liquido_amniotico", observacoes: "MBV <20mm sem outras alterações" },
  { id: "liquido_limitrofe", label: "Líquido amniótico limítrofe (20mm < MBV < 50mm)", igIdeal: "37", igIdealMax: "39", categoria: "liquido_amniotico", observacoes: "LA reduzido mas não oligoâmnio" },
  
  // 2.2. Restrição de Crescimento Fetal (RCF/RCIU)
  { id: "rcf_pig_sem_comorbidade", label: "RCF p3-p10 (PIG) - Feto PIG sem comorbidade materna", igIdeal: "38", igIdealMax: "39", categoria: "crescimento_fetal", observacoes: "PIG isolado - preferencial 39 semanas" },
  { id: "rcf_menor_p3", label: "RCF <p3 - Restrição severa", igIdeal: "37", categoria: "crescimento_fetal", observacoes: "Peso fetal <percentil 3" },
  { id: "rcf_p3_p10_comorbidade", label: "RCF p3-p10 COM comorbidade materna", igIdeal: "37", categoria: "crescimento_fetal", observacoes: "PIG + HAC, DM ou outra condição" },
  { id: "rcf_doppler_alterado", label: "RCF com Doppler alterado (IP AU >p95)", igIdeal: "37", categoria: "crescimento_fetal", observacoes: "RCF com alteração de Doppler umbilical" },
  { id: "rcf_doppler_critico", label: "RCF com Doppler crítico (diástole zero/reversa)", igIdeal: "32", categoria: "crescimento_fetal", observacoes: "Prioridade crítica - corticoide se <34sem" },
  
  // 2.3. Macrossomia
  { id: "macrossomia_4000g", label: "Macrossomia fetal (PFE 4000-4500g)", igIdeal: "38", igIdealMax: "39", categoria: "crescimento_fetal", observacoes: "Peso estimado entre 4000-4500g" },
  { id: "macrossomia_4500g", label: "Macrossomia fetal severa (PFE >4500g)", igIdeal: "38", categoria: "crescimento_fetal", observacoes: "Peso estimado >4500g - cesárea recomendada" },
  
  // 2.4. Gemelaridade
  { id: "gemelar_bicorionico", label: "Gestação gemelar dicoriônica diamniótica", igIdeal: "37", igIdealMax: "38", categoria: "gemelaridade", observacoes: "Gemelares dicoriônicos - preferencial 37-38sem" },
  { id: "gemelar_monocorionico_diamniotico", label: "Gestação gemelar monocoriônica diamniótica", igIdeal: "36", igIdealMax: "37", categoria: "gemelaridade", observacoes: "Vigilância STFF - Doppler semanal" },
  { id: "gemelar_monocorionico_monoamniotico", label: "Gestação gemelar monocoriônica monoamniótica", igIdeal: "32", igIdealMax: "34", categoria: "gemelaridade", observacoes: "Alto risco entrelaçamento - cesárea obrigatória" },
  
  // 2.5. Placentárias
  { id: "placenta_previa_marginal", label: "Placenta prévia marginal (2-20mm do OCI)", igIdeal: "37", igIdealMax: "38", categoria: "placentarias", observacoes: "Placenta próxima ao OCI" },
  { id: "placenta_previa_total", label: "Placenta prévia centro-total", igIdeal: "36", igIdealMax: "37", categoria: "placentarias", observacoes: "Cesárea obrigatória" },
  { id: "placenta_acreta", label: "Acretismo placentário", igIdeal: "34", igIdealMax: "36", categoria: "placentarias", observacoes: "Equipe especializada - risco histerectomia" },
  
  // 2.6. Apresentação
  { id: "pelvico", label: "Apresentação pélvica persistente", igIdeal: "39", categoria: "apresentacao", observacoes: "VCE até 37sem - cesárea se falha/recusa" },
  { id: "transversa", label: "Situação transversa/córmica", igIdeal: "39", categoria: "apresentacao", observacoes: "Cesárea obrigatória" },
  
  // 2.7. Iteratividade
  { id: "iteratividade_1cesarea", label: "Uma cesárea anterior (iteratividade 1)", igIdeal: "39", igIdealMax: "40", categoria: "iteratividade", observacoes: "VBAC possível após avaliação" },
  { id: "iteratividade_2cesarea", label: "Duas ou mais cesáreas anteriores (iteratividade ≥2)", igIdeal: "38", igIdealMax: "39", categoria: "iteratividade", observacoes: "Cesárea eletiva recomendada" },
  { id: "cesarea_classica", label: "Cesárea clássica anterior (corporal)", igIdeal: "36", igIdealMax: "37", categoria: "iteratividade", observacoes: "Risco de rotura - cesárea obrigatória" },
  
  // 2.8. Malformações Fetais
  { id: "malformacao_nao_letal", label: "Malformação fetal não letal", igIdeal: "39", categoria: "malformacoes", observacoes: "Equipe neonatal especializada" },
  { id: "cardiopatia_fetal", label: "Cardiopatia fetal", igIdeal: "38", igIdealMax: "39", categoria: "malformacoes", observacoes: "Centro com cardiologia pediátrica" },
  { id: "hidrocefalia", label: "Hidrocefalia fetal", igIdeal: "37", igIdealMax: "38", categoria: "malformacoes", observacoes: "PC aumentado - avaliar via de parto" },
  { id: "gastrosquise", label: "Gastrosquise", igIdeal: "37", categoria: "malformacoes", observacoes: "Parto em centro especializado" },
  { id: "onfalocele", label: "Onfalocele", igIdeal: "38", igIdealMax: "39", categoria: "malformacoes", observacoes: "Avaliar conteúdo e associações" },
  { id: "hernia_diafragmatica", label: "Hérnia diafragmática congênita", igIdeal: "38", igIdealMax: "39", categoria: "malformacoes", observacoes: "Centro com ECMO neonatal" },
  
  // 2.9. Infecções
  { id: "hiv_cv_indetectavel", label: "HIV com CV indetectável", igIdeal: "38", igIdealMax: "39", categoria: "infeccoes", observacoes: "CV indetectável - parto vaginal possível" },
  { id: "hiv_cv_detectavel", label: "HIV com CV detectável (>1000 cópias)", igIdeal: "38", categoria: "infeccoes", observacoes: "CV >1000 cópias - cesárea eletiva" },
  { id: "hepatite_b", label: "Hepatite B", igIdeal: "39", igIdealMax: "40", categoria: "infeccoes", observacoes: "Imunoglobulina + vacina RN 12h" },
  { id: "hepatite_c", label: "Hepatite C", igIdeal: "39", igIdealMax: "40", categoria: "infeccoes", observacoes: "Sem indicação de cesárea profilática" },
  { id: "herpes_ativo", label: "Herpes genital ativo", igIdeal: "38", igIdealMax: "39", categoria: "infeccoes", observacoes: "Lesões ativas - cesárea obrigatória" },
  { id: "sifilis_tratada", label: "Sífilis tratada adequadamente", igIdeal: "39", igIdealMax: "40", categoria: "infeccoes", observacoes: "Sem alteração de conduta obstétrica" },
  { id: "toxoplasmose", label: "Toxoplasmose na gestação", igIdeal: "39", categoria: "infeccoes", observacoes: "Vigilância fetal - espiramicina/sulfadiazina" },
];

// Mapeamento rápido de ID para configuração
export const PROTOCOLS: Record<string, ProtocolConfig> = DIAGNOSTIC_CHECKLIST.reduce((acc, item) => {
  acc[item.id] = {
    igIdeal: item.igIdeal,
    igIdealMax: item.igIdealMax,
    margemDias: 7,
    prioridade: getPriorityForCategory(item.categoria, item.igIdeal),
    viaPreferencial: getPreferredRoute(item.id, item.categoria),
    observacoes: item.observacoes,
    categoria: item.categoria
  };
  return acc;
}, {} as Record<string, ProtocolConfig>);

// Adicionar protocolos de emergência
PROTOCOLS.eclampsia = { igIdeal: "Imediato", margemDias: 0, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Emergência obstétrica - interrupção imediata", categoria: "hipertensao" };
PROTOCOLS.sindrome_hellp = { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Após estabilização materna", categoria: "hipertensao" };
PROTOCOLS.dpp = { igIdeal: "Imediato", margemDias: 0, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Emergência obstétrica - descolamento prematuro de placenta", categoria: "placentarias" };
PROTOCOLS.prolapso_cordao = { igIdeal: "Imediato", margemDias: 0, prioridade: 1, viaPreferencial: "Cesárea", observacoes: "Emergência obstétrica - prolapso de cordão", categoria: "outras_maternas" };

// Manter compatibilidade com IDs antigos
PROTOCOLS.hac = PROTOCOLS.hac_compensada;
PROTOCOLS.dmg_sem_insulina = PROTOCOLS.dmg_sem_insulina_bom_controle;
PROTOCOLS.dmg_sem_insulina_descomp = PROTOCOLS.dmg_sem_insulina_descontrole;
PROTOCOLS.dmg_insulina = PROTOCOLS.dmg_insulina_bom_controle;
PROTOCOLS.dmg_insulina_descomp = PROTOCOLS.dmg_insulina_descontrole;
PROTOCOLS.dm_pregestacional = PROTOCOLS.dm_pregestacional_bom_controle;
PROTOCOLS.dm_pregestacional_descomp = PROTOCOLS.dm_pregestacional_descontrole;
PROTOCOLS.rcf = PROTOCOLS.rcf_pig_sem_comorbidade;
PROTOCOLS.rcf_grave = PROTOCOLS.rcf_doppler_critico;
PROTOCOLS.macrossomia = PROTOCOLS.macrossomia_4000g;
PROTOCOLS.macrossomia_severa = PROTOCOLS.macrossomia_4500g;
PROTOCOLS.oligodramnia = PROTOCOLS.oligoamnio_isolado;
PROTOCOLS.oligodramnia_severa = { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Anidramnia - interrupção indicada", categoria: "liquido_amniotico" };
PROTOCOLS.polidramnia = PROTOCOLS.polidramnia_leve_moderado;
PROTOCOLS.gemelar_monocorionico = PROTOCOLS.gemelar_monocorionico_diamniotico;
PROTOCOLS.gemelar_monoamniotico = PROTOCOLS.gemelar_monocorionico_monoamniotico;
PROTOCOLS.lupus = PROTOCOLS.les_atividade;
PROTOCOLS.obito_fetal_anterior = PROTOCOLS.natimorto_anterior;
PROTOCOLS.obesidade_morbida = PROTOCOLS.obesidade_imc35;
PROTOCOLS.cerclagem = PROTOCOLS.iic;
PROTOCOLS.hiv = PROTOCOLS.hiv_cv_indetectavel;
PROTOCOLS.cormica = PROTOCOLS.transversa;
PROTOCOLS.cesarea_corporal = PROTOCOLS.cesarea_classica;
PROTOCOLS.pre_eclampsia_grave = PROTOCOLS.pre_eclampsia_com_deterioracao;
PROTOCOLS.rpmo_pretermo = PROTOCOLS.rpmo;
PROTOCOLS.rpmo_termo = { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Indução trabalho parto até 24h", categoria: "rotura_membranas" };
PROTOCOLS.tpp_atual = { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Corticoide - tocólise - antibiótico", categoria: "outras_maternas" };
PROTOCOLS.placenta_previa_parcial = PROTOCOLS.placenta_previa_marginal;
PROTOCOLS.placenta_baixa = { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Vigilância por sangramento", categoria: "placentarias" };
PROTOCOLS.placenta_percreta = PROTOCOLS.placenta_acreta;
PROTOCOLS.idade_materna_avancada = { igIdeal: "39", margemDias: 7, prioridade: 3, viaPreferencial: "Via obstétrica", observacoes: ">35 anos - vigilância fetal", categoria: "outras_maternas" };
PROTOCOLS.aloimunizacao_rh = { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Vigilância anemia fetal - MCA Doppler", categoria: "outras_maternas" };
PROTOCOLS.cardiopatia_materna = { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Classe funcional III/IV - parto assistido", categoria: "outras_maternas" };
PROTOCOLS.cardiopatia_grave = { igIdeal: "36", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "UTI - equipe cardiologia", categoria: "outras_maternas" };
PROTOCOLS.doenca_renal = { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Creatinina >1.5 - vigilância materna-fetal", categoria: "outras_maternas" };
PROTOCOLS.epilepsia = { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Controle medicamentoso", categoria: "outras_maternas" };
PROTOCOLS.miomatose = { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "Miomas grandes ou múltiplos - avaliar via", categoria: "outras_maternas" };
PROTOCOLS.miomectomia_previa = { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "Miomectomia com abertura cavidade - cesárea", categoria: "outras_maternas" };
PROTOCOLS.gestacao_prolongada = { igIdeal: "41", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Indução 41sem - vigilância fetal", categoria: "outras_maternas" };
PROTOCOLS.malformacao_grave = PROTOCOLS.malformacao_nao_letal;

// Função auxiliar para determinar prioridade baseada na categoria e IG
function getPriorityForCategory(categoria: DiagnosticCategory, igIdeal: string): number {
  const ig = parseInt(igIdeal);
  if (isNaN(ig)) return 1; // Imediato = prioridade 1
  if (ig <= 34) return 1;  // Crítico
  if (ig <= 37) return 2;  // Alto risco
  return 3;                 // Baixo risco
}

// Função auxiliar para determinar via preferencial
function getPreferredRoute(id: string, categoria: DiagnosticCategory): string {
  // IDs que requerem cesárea
  const cesareanIds = [
    'placenta_previa_total', 'placenta_acreta', 'gemelar_monocorionico_monoamniotico',
    'pelvico', 'transversa', 'cesarea_classica', 'iteratividade_2cesarea',
    'hiv_cv_detectavel', 'herpes_ativo', 'hidrocefalia', 'macrossomia_4500g',
    'desejo_materno', 'laqueadura'
  ];
  
  if (cesareanIds.includes(id)) return 'Cesárea';
  
  // Categorias com tendência a cesárea
  if (categoria === 'apresentacao') return 'Cesárea';
  
  return 'Via obstétrica';
}

// Função para obter opções de diagnóstico por categoria (para UI)
export function getDiagnosticsByCategory(categoria: DiagnosticCategory): DiagnosticOption[] {
  return DIAGNOSTIC_CHECKLIST.filter(d => d.categoria === categoria);
}

// Função para obter todas as categorias disponíveis
export function getAllCategories(): { id: DiagnosticCategory; label: string }[] {
  return [
    { id: 'hipertensao', label: 'Hipertensão' },
    { id: 'diabetes', label: 'Diabetes na Gestação' },
    { id: 'outras_maternas', label: 'Outras Condições Maternas' },
    { id: 'liquido_amniotico', label: 'Alterações do Líquido Amniótico' },
    { id: 'crescimento_fetal', label: 'Crescimento Fetal' },
    { id: 'gemelaridade', label: 'Gemelaridade' },
    { id: 'placentarias', label: 'Alterações Placentárias' },
    { id: 'rotura_membranas', label: 'Rotura de Membranas' },
    { id: 'apresentacao', label: 'Apresentação Fetal' },
    { id: 'iteratividade', label: 'Iteratividade / Cesáreas Prévias' },
    { id: 'malformacoes', label: 'Malformações Fetais' },
    { id: 'infeccoes', label: 'Infecções' },
    { id: 'eletivos', label: 'Procedimentos Eletivos' },
  ];
}

// Função para calcular IG pretendida automaticamente baseada nos diagnósticos selecionados
export function calculateAutomaticIG(selectedDiagnostics: string[]): {
  igPretendida: string;
  igPretendidaMax?: string;
  protocoloAplicado: string;
  observacoes: string;
  prioridade: number;
} {
  if (selectedDiagnostics.length === 0) {
    return {
      igPretendida: "39",
      protocoloAplicado: "baixo_risco",
      observacoes: "Gestação de baixo risco - resolução às 39 semanas",
      prioridade: 3
    };
  }
  
  // Encontrar o protocolo mais restritivo (menor IG e maior prioridade)
  let mostRestrictive: {
    id: string;
    igIdeal: number;
    igIdealMax?: number;
    prioridade: number;
    observacoes: string;
  } | null = null;
  
  for (const diagId of selectedDiagnostics) {
    const protocol = PROTOCOLS[diagId];
    if (!protocol) continue;
    
    const igIdeal = parseInt(protocol.igIdeal);
    if (isNaN(igIdeal)) {
      // "Imediato" - prioridade máxima
      return {
        igPretendida: protocol.igIdeal,
        protocoloAplicado: diagId,
        observacoes: protocol.observacoes,
        prioridade: 1
      };
    }
    
    if (!mostRestrictive ||
        protocol.prioridade < mostRestrictive.prioridade ||
        (protocol.prioridade === mostRestrictive.prioridade && igIdeal < mostRestrictive.igIdeal)) {
      mostRestrictive = {
        id: diagId,
        igIdeal,
        igIdealMax: protocol.igIdealMax ? parseInt(protocol.igIdealMax) : undefined,
        prioridade: protocol.prioridade,
        observacoes: protocol.observacoes
      };
    }
  }
  
  if (!mostRestrictive) {
    return {
      igPretendida: "39",
      protocoloAplicado: "baixo_risco",
      observacoes: "Gestação de baixo risco",
      prioridade: 3
    };
  }
  
  return {
    igPretendida: mostRestrictive.igIdeal.toString(),
    igPretendidaMax: mostRestrictive.igIdealMax?.toString(),
    protocoloAplicado: mostRestrictive.id,
    observacoes: mostRestrictive.observacoes,
    prioridade: mostRestrictive.prioridade
  };
}

export const mapDiagnosisToProtocol = (diagnosticos: string[]): string[] => {
  const mapped: string[] = [];
  
  diagnosticos.forEach(d => {
    // Se for um ID de protocolo válido, usar diretamente
    if (PROTOCOLS[d]) {
      mapped.push(d);
      return;
    }
    
    const diag = d.toLowerCase().trim();
    
    // PRIORIDADE CRÍTICA: CERCLAGEM / IIC (verificar primeiro)
    if (diag.includes('cerclagem') || diag.includes('iic') || 
        diag.includes('incompetencia') || diag.includes('incompetência') || 
        diag.includes('istmo')) {
      mapped.push('cerclagem');
      return; // Retornar imediatamente - protocolo crítico
    }
    
    // HIPERTENSÃO
    if (diag.includes('eclampsia') && !diag.includes('pré')) {
      mapped.push('eclampsia');
    } else if (diag.includes('hellp')) {
      mapped.push('sindrome_hellp');
    } else if (diag.includes('pré-eclâmpsia grave') || diag.includes('pre-eclampsia grave') || diag.includes('dheg')) {
      mapped.push('pre_eclampsia_grave');
    } else if (diag.includes('pré-eclâmpsia') || diag.includes('pre-eclampsia')) {
      mapped.push('pre_eclampsia_sem_deterioracao');
    } else if (diag.includes('hipertensão gestacional') || diag.includes('hipertensao gestacional')) {
      mapped.push('hipertensao_gestacional');
    } else if (diag.includes('hac') && (diag.includes('difícil') || diag.includes('dificil') || diag.includes('3 drogas'))) {
      mapped.push('hac_dificil');
    } else if (diag.includes('hac') || diag.includes('hipertensão arterial crônica') || diag.includes('hipertensao arterial cronica')) {
      mapped.push('hac');
    }
    
    // DIABETES
    if (diag.includes('dm2') || diag.includes('dm 2') || diag.includes('dm pregestacional') || diag.includes('dm pré-gestacional')) {
      if (diag.includes('descomp') || diag.includes('descontrole') || diag.includes('complicação') || diag.includes('complicacao')) {
        mapped.push('dm_pregestacional_descomp');
      } else {
        mapped.push('dm_pregestacional');
      }
    } else if (diag.includes('dmg') || diag.includes('diabetes gestacional')) {
      const temInsulina = diag.includes('insulina');
      const temDescontrole = diag.includes('descomp') || diag.includes('descontrole') || diag.includes('feto gig') || diag.includes('macrossomia');
      
      if (temInsulina && temDescontrole) {
        mapped.push('dmg_insulina_descomp');
      } else if (temInsulina) {
        mapped.push('dmg_insulina');
      } else if (temDescontrole) {
        mapped.push('dmg_sem_insulina_descomp');
      } else {
        mapped.push('dmg_sem_insulina');
      }
    }
    
    // PLACENTA
    if (diag.includes('placenta percreta')) {
      mapped.push('placenta_percreta');
    } else if (diag.includes('placenta acreta') || diag.includes('acretismo')) {
      mapped.push('placenta_acreta');
    } else if (diag.includes('placenta prévia total') || diag.includes('placenta previa total') || diag.includes('pp centro total')) {
      mapped.push('placenta_previa_total');
    } else if (diag.includes('placenta prévia parcial') || diag.includes('placenta previa parcial')) {
      mapped.push('placenta_previa_parcial');
    } else if (diag.includes('placenta prévia') || diag.includes('placenta previa') || diag.includes('placenta baixa')) {
      mapped.push('placenta_baixa');
    } else if (diag.includes('dpp') || diag.includes('descolamento prematuro')) {
      mapped.push('dpp');
    }
    
    // GEMELARIDADE
    if (diag.includes('gemelar') || diag.includes('gêmeos')) {
      if (diag.includes('monoamniótico') || diag.includes('monoamniotico')) {
        mapped.push('gemelar_monoamniotico');
      } else if (diag.includes('monocoriônic') || diag.includes('monocorionic') || diag.includes('mono')) {
        mapped.push('gemelar_monocorionico');
      } else if (diag.includes('bicoriônic') || diag.includes('bicorionic') || diag.includes('bi')) {
        mapped.push('gemelar_bicorionico');
      }
    }
    
    // APRESENTAÇÃO
    if (diag.includes('pélvic') || diag.includes('pelvic') || diag.includes('sentado')) {
      mapped.push('pelvico');
    } else if (diag.includes('córmica') || diag.includes('cormica') || diag.includes('transversa')) {
      mapped.push('cormica');
    }
    
    // ROTURA MEMBRANAS
    if (diag.includes('rpmo') || diag.includes('rotura prematura') || diag.includes('bolsa rota')) {
      if (diag.includes('pretermo') || diag.includes('pré-termo') || diag.includes('prematuro')) {
        mapped.push('rpmo_pretermo');
      } else {
        mapped.push('rpmo_termo');
      }
    }
    
    // CRESCIMENTO FETAL
    if (diag.includes('rcf') || diag.includes('restrição de crescimento') || diag.includes('restricao de crescimento') || diag.includes('pig')) {
      if (diag.includes('grave') || diag.includes('doppler crítico') || diag.includes('diastole') || diag.includes('centralização')) {
        mapped.push('rcf_grave');
      } else {
        mapped.push('rcf');
      }
    } else if (diag.includes('macrossomia') || diag.includes('feto gig') || diag.includes('gig')) {
      const peso = diag.match(/(\d{4,5})\s*g/);
      if (peso && parseInt(peso[1]) > 4500) {
        mapped.push('macrossomia_severa');
      } else {
        mapped.push('macrossomia');
      }
    }
    
    // LÍQUIDO AMNIÓTICO
    if (diag.includes('oligoâmnio') || diag.includes('oligoamnio') || diag.includes('oligodrâmnio') || diag.includes('oligodramnia')) {
      if (diag.includes('severo') || diag.includes('anidrâmnio') || diag.includes('anidramnia')) {
        mapped.push('oligodramnia_severa');
      } else {
        mapped.push('oligodramnia');
      }
    } else if (diag.includes('polidrâmnio') || diag.includes('polidramnia') || diag.includes('poliâmnio')) {
      mapped.push('polidramnia');
    }
    
    // ITERATIVIDADE
    if (diag.includes('iteratividade') || diag.includes('cesárea prévia') || diag.includes('cesarea previa')) {
      if (diag.includes('corporal')) {
        mapped.push('cesarea_corporal');
      } else if (diag.includes('2 cesárea') || diag.includes('duas cesarea') || diag.includes('múltiplas')) {
        mapped.push('iteratividade_2cesarea');
      } else if (diag.includes('1 cesárea') || diag.includes('uma cesarea')) {
        mapped.push('iteratividade_1cesarea');
      }
    }
    
    // MALFORMAÇÕES FETAIS
    if (diag.includes('hidrocefalia')) {
      mapped.push('hidrocefalia');
    } else if (diag.includes('cardiopatia fetal')) {
      mapped.push('cardiopatia_fetal');
    } else if (diag.includes('malformação') || diag.includes('malformacao')) {
      mapped.push('malformacao_grave');
    }
    
    // DOENÇAS MATERNAS
    if (diag.includes('cardiopatia materna') || diag.includes('cardiopatia') && !diag.includes('fetal')) {
      if (diag.includes('grave') || diag.includes('cf iii') || diag.includes('cf iv')) {
        mapped.push('cardiopatia_grave');
      } else {
        mapped.push('cardiopatia_materna');
      }
    } else if (diag.includes('doença renal') || diag.includes('doenca renal') || diag.includes('insuficiência renal')) {
      mapped.push('doenca_renal');
    } else if (diag.includes('lúpus') || diag.includes('lupus') || diag.includes('les')) {
      mapped.push('lupus');
    } else if (diag.includes('epilepsia')) {
      mapped.push('epilepsia');
    } else if (diag.includes('trombofilia')) {
      mapped.push('trombofilia');
    }
    
    // INFECÇÕES
    if (diag.includes('hiv') || diag.includes('aids')) {
      mapped.push('hiv');
    } else if (diag.includes('hepatite b')) {
      mapped.push('hepatite_b');
    } else if (diag.includes('hepatite c')) {
      mapped.push('hepatite_c');
    } else if (diag.includes('herpes') && diag.includes('ativo')) {
      mapped.push('herpes_ativo');
    }
    
    // CIRURGIAS UTERINAS
    if (diag.includes('miomectomia')) {
      mapped.push('miomectomia_previa');
    } else if (diag.includes('mioma') || diag.includes('miomatose')) {
      mapped.push('miomatose');
    }
    
    // ESPECIAIS
    if (diag.includes('tpp') || diag.includes('trabalho de parto prematuro')) {
      mapped.push('tpp_atual');
    } else if (diag.includes('óbito fetal anterior') || diag.includes('obito fetal anterior') || diag.includes('ofu')) {
      mapped.push('obito_fetal_anterior');
    } else if (diag.includes('gestação prolongada') || diag.includes('gestacao prolongada') || diag.includes('41 semanas')) {
      mapped.push('gestacao_prolongada');
    } else if (diag.includes('idade materna avançada') || diag.includes('idade materna avancada') || diag.includes('ima')) {
      mapped.push('idade_materna_avancada');
    } else if (diag.includes('obesidade mórbida') || diag.includes('obesidade morbida') || diag.includes('imc > 40') || diag.includes('imc >40')) {
      mapped.push('obesidade_morbida');
    } else if (diag.includes('aloimunização') || diag.includes('aloimunizacao') || diag.includes('incompatibilidade rh')) {
      mapped.push('aloimunizacao_rh');
    }
    
    // ELETIVOS
    if (diag.includes('desejo materno') || diag.includes('a pedido')) {
      mapped.push('desejo_materno');
    } else if (diag.includes('laqueadura')) {
      mapped.push('laqueadura');
    }
  });
  
  // Remover duplicatas mantendo ordem
  return [...new Set(mapped)];
};
