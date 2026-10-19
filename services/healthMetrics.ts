import { ExamResult } from '../types';

export type OrganId = 'cerebro' | 'coracao' | 'pulmoes' | 'figado' | 'rins' | 'pancreas' | 'articulacoes';
export type HealthStatus = 'normal' | 'alerta' | 'critico';
export type AvatarAnimationState = 'cansado' | 'com_dor' | 'palpitacao' | 'vigoroso';

export interface OrganMetric {
  name: string;
  value: number | string;
  unit?: string;
  status: HealthStatus;
  date: string;
}

export interface OrganInfo {
  id: OrganId;
  name: string;
  description: string;
  icon: string;
  status: HealthStatus;
  metrics: OrganMetric[];
  recommendation: string;
  symptoms: string[];
}

export interface HealthAlert {
  id: string;
  organId: OrganId;
  organName: string;
  examName: string;
  severity: HealthStatus;
  title: string;
  message: string;
  recommendation: string;
  clinicalNote: string;
  date: string;
}

export interface ParameterReference {
  id: string;
  name: string;
  unit: string;
  organId: OrganId;
  normalMin: number;
  normalMax: number;
  alertMax: number;
  description: string;
}

export const PARAMETER_REFERENCES: Record<string, ParameterReference> = {
  'GLICOSE': {
    id: 'GLICOSE',
    name: 'Glicemia de Jejum',
    unit: 'mg/dL',
    organId: 'pancreas',
    normalMin: 70,
    normalMax: 99,
    alertMax: 125,
    description: 'Nível de glicose em jejum no sangue'
  },
  'TRIGLICERIDEOS': {
    id: 'TRIGLICERIDEOS',
    name: 'Triglicerídeos (Triglicérides)',
    unit: 'mg/dL',
    organId: 'coracao',
    normalMin: 0,
    normalMax: 150,
    alertMax: 199,
    description: 'Gordura de reserva energética circulante no sangue'
  },
  'COLESTEROL TOTAL': {
    id: 'COLESTEROL TOTAL',
    name: 'Colesterol Total',
    unit: 'mg/dL',
    organId: 'coracao',
    normalMin: 0,
    normalMax: 190,
    alertMax: 239,
    description: 'Nível global de lipídios no sangue'
  },
  'COLESTEROL LDL': {
    id: 'COLESTEROL LDL',
    name: 'Colesterol LDL',
    unit: 'mg/dL',
    organId: 'coracao',
    normalMin: 0,
    normalMax: 100,
    alertMax: 159,
    description: 'Fração de colesterol de baixa densidade (aterogênico)'
  },
  'COLESTEROL HDL': {
    id: 'COLESTEROL HDL',
    name: 'Colesterol HDL',
    unit: 'mg/dL',
    organId: 'coracao',
    normalMin: 40,
    normalMax: 999,
    alertMax: 35,
    description: 'Fração protetora cardiovascular de alta densidade'
  },
  'HEMOGLOBINA': {
    id: 'HEMOGLOBINA',
    name: 'Hemoglobina',
    unit: 'g/dL',
    organId: 'cerebro',
    normalMin: 12.0,
    normalMax: 16.5,
    alertMax: 18.0,
    description: 'Transportador de oxigênio no sangue (relação com anemia e cansaço)'
  },
  'HEMATOCRITO': {
    id: 'HEMATOCRITO',
    name: 'Hematócrito',
    unit: '%',
    organId: 'cerebro',
    normalMin: 36.0,
    normalMax: 50.0,
    alertMax: 55.0,
    description: 'Porcentagem do volume sanguíneo ocupado por hemácias'
  },
  'LEUCOCITOS': {
    id: 'LEUCOCITOS',
    name: 'Leucócitos Totais',
    unit: '/mm³',
    organId: 'cerebro',
    normalMin: 4000,
    normalMax: 10000,
    alertMax: 14000,
    description: 'Células de defesa do sistema imunológico'
  },
  'PLAQUETAS': {
    id: 'PLAQUETAS',
    name: 'Plaquetas',
    unit: '/mm³',
    organId: 'cerebro',
    normalMin: 150000,
    normalMax: 450000,
    alertMax: 550000,
    description: 'Elementos celulares fundamentais para coagulação sanguínea'
  },
  'CREATININA': {
    id: 'CREATININA',
    name: 'Creatinina Sérica',
    unit: 'mg/dL',
    organId: 'rins',
    normalMin: 0.6,
    normalMax: 1.2,
    alertMax: 1.6,
    description: 'Marcador fundamental da taxa de filtração renal'
  },
  'UREIA': {
    id: 'UREIA',
    name: 'Ureia',
    unit: 'mg/dL',
    organId: 'rins',
    normalMin: 15,
    normalMax: 45,
    alertMax: 70,
    description: 'Composto nitrogenado eliminado pelos rins'
  },
  'ACIDO URICO': {
    id: 'ACIDO URICO',
    name: 'Ácido Úrico',
    unit: 'mg/dL',
    organId: 'articulacoes',
    normalMin: 2.5,
    normalMax: 7.0,
    alertMax: 8.5,
    description: 'Metabólito de purinas associado a crises de gota e dor articular'
  },
  'TGO': {
    id: 'TGO',
    name: 'TGO / AST',
    unit: 'U/L',
    organId: 'figado',
    normalMin: 0,
    normalMax: 35,
    alertMax: 65,
    description: 'Enzima de integridade hepatocelular e muscular'
  },
  'TGP': {
    id: 'TGP',
    name: 'TGP / ALT',
    unit: 'U/L',
    organId: 'figado',
    normalMin: 0,
    normalMax: 40,
    alertMax: 80,
    description: 'Enzima hepática de alta especificidade'
  },
  'GAMA GT': {
    id: 'GAMA GT',
    name: 'Gama-GT',
    unit: 'U/L',
    organId: 'figado',
    normalMin: 0,
    normalMax: 50,
    alertMax: 90,
    description: 'Marcador de colestase e sobrecarga enzimática hepática'
  },
  'PCR': {
    id: 'PCR',
    name: 'Proteína C-Reativa (PCR)',
    unit: 'mg/L',
    organId: 'articulacoes',
    normalMin: 0,
    normalMax: 5.0,
    alertMax: 10.0,
    description: 'Marcador agudo de inflamação e dor corporal'
  },
  'HBA1C': {
    id: 'HBA1C',
    name: 'Hemoglobina Glicada (HbA1c)',
    unit: '%',
    organId: 'pancreas',
    normalMin: 4.0,
    normalMax: 5.6,
    alertMax: 6.4,
    description: 'Média da glicemia dos últimos 90 dias'
  }
};

// Aliases clínicos abrangentes para cada parâmetro (com e sem acentos, abreviações)
export const PARAM_ALIASES: Record<string, string[]> = {
  'TRIGLICERIDEOS': [
    'triglicerides', 'triglicerideos', 'trigliceride', 'triglicerideo',
    'trigliceridemia', 'triglicerid', 'triglic'
  ],
  'GLICOSE': [
    'glicose', 'glicemia de jejum', 'glicose de jejum', 'glicemia', 'dextrose'
  ],
  'COLESTEROL TOTAL': [
    'colesterol total', 'colesterol-total', 'colesterolemia total', 'colesterol soro', 'colesterol'
  ],
  'COLESTEROL LDL': [
    'colesterol ldl', 'ldl colesterol', 'ldl-colesterol', 'ldl - colesterol',
    'colesterol da ldl', 'ldl-c', 'ldl c', 'ldl calculado', 'ldl'
  ],
  'COLESTEROL HDL': [
    'colesterol hdl', 'hdl colesterol', 'hdl-colesterol', 'hdl - colesterol',
    'colesterol da hdl', 'hdl-c', 'hdl c', 'hdl'
  ],
  'HEMOGLOBINA': [
    'hemoglobina', 'hg', 'hb', 'hemoglobina total'
  ],
  'HEMATOCRITO': [
    'hematocrito', 'ht', 'hto'
  ],
  'LEUCOCITOS': [
    'leucocitos', 'leucocitos totais', 'globulos brancos', 'wbc'
  ],
  'PLAQUETAS': [
    'plaquetas', 'contagem de plaquetas', 'plaquetometria', 'plt'
  ],
  'CREATININA': [
    'creatinina', 'creatinina serica', 'creatinina no soro', 'cr'
  ],
  'UREIA': [
    'ureia', 'ureia serica', 'bun'
  ],
  'ACIDO URICO': [
    'acido urico', 'acido-urico', 'urato serico', 'uricemia'
  ],
  'TGO': [
    'tgo', 'ast', 'tgo/ast', 'tgo (ast)', 'transaminase oxalacetica', 'transaminase glutamico-oxalacetica', 'aspartato aminotransferase'
  ],
  'TGP': [
    'tgp', 'alt', 'tgp/alt', 'tgp (alt)', 'transaminase piruvica', 'transaminase glutamico-piruvica', 'alanina aminotransferase'
  ],
  'GAMA GT': [
    'gama gt', 'gama-gt', 'ggt', 'gama glutamil transferase', 'gama glutamiltransferase'
  ],
  'PCR': [
    'pcr', 'proteina c reativa', 'proteina c-reativa', 'proteina c reativa (pcr)', 'pcr ultra-sensivel', 'pcr ultrassensivel'
  ],
  'HBA1C': [
    'hba1c', 'hemoglobina glicada', 'hemoglobina a1c', 'a1c', 'glicohemoglobina', 'glico-hemoglobina'
  ]
};

// Mapeamento de termos de exames para órgãos
export const EXAM_NAME_TO_ORGAN: Record<string, OrganId> = {
  'GLICO': 'pancreas',
  'GLICEMIA': 'pancreas',
  'HBA1C': 'pancreas',
  'COLEST': 'coracao',
  'TRIGLIC': 'coracao',
  'LIPID': 'coracao',
  'CORACAO': 'coracao',
  'HEMO': 'cerebro',
  'HEMATO': 'cerebro',
  'LEUCO': 'cerebro',
  'PLAQUET': 'cerebro',
  'SANGUE': 'cerebro',
  'ANEMIA': 'cerebro',
  'B12': 'cerebro',
  'FERRIT': 'cerebro',
  'VITAMINA': 'cerebro',
  'CREAT': 'rins',
  'UREIA': 'rins',
  'URINA': 'rins',
  'EAS': 'rins',
  'TGO': 'figado',
  'TGP': 'figado',
  'AST': 'figado',
  'ALT': 'figado',
  'GAMA': 'figado',
  'HEPAT': 'figado',
  'BILIR': 'figado',
  'PCR': 'articulacoes',
  'REUMA': 'articulacoes',
  'ACIDO URICO': 'articulacoes',
  'URIC': 'articulacoes',
  'PULMAO': 'pulmoes',
  'GASOM': 'pulmoes',
  'OXIM': 'pulmoes'
};

// Remove acentos e converte para minúsculas
export function normalizeText(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function cleanNumber(str: string, paramId: string): number | null {
  if (!str) return null;
  // Trata separador de milhar (ex: 6.800 ou 245.000 para Leucócitos e Plaquetas)
  if ((paramId === 'LEUCOCITOS' || paramId === 'PLAQUETAS') && /^\d{1,3}\.\d{3}$/.test(str)) {
    return parseFloat(str.replace('.', ''));
  }

  const clean = str.replace(',', '.');
  const val = parseFloat(clean);
  return isNaN(val) ? null : val;
}

// Extrai o valor numérico de um parâmetro específico no laudo de forma inteligente e segura
export function extractParameterValue(rawText: string, paramId: string): number | null {
  if (!rawText) return null;

  const normalized = normalizeText(rawText);
  const aliases = PARAM_ALIASES[paramId] || [normalizeText(paramId)];

  const allHeaderKeywords = [
    'glicose', 'glicemia', 'colesterol', 'triglicerides', 'triglicerideos',
    'ureia', 'creatinina', 'hemoglobina', 'hematocrito', 'leucocitos',
    'plaquetas', 'acido urico', 'ast', 'alt', 'tgo', 'tgp', 'bilirrubina',
    'gama gt', 'ggt', 'proteina c', 'pcr', 'hba1c', 'ferritina', 'vitamina',
    'tsh', 't4', 'urina', 'eas', 'fezes', 'parasitologico'
  ];

  for (const alias of aliases) {
    const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-z0-9])${escapedAlias}(?:[^a-z0-9]|$)`, 'i');
    const match = normalized.match(regex);
    if (!match || match.index === undefined) continue;

    const aliasIndex = match.index + (match[0].startsWith(' ') || /[^a-z0-9]/i.test(match[0][0]) ? 1 : 0);

    // Evitar falsos positivos de colesterol / glicose
    if (paramId === 'COLESTEROL TOTAL' && alias === 'colesterol') {
      const peek = normalized.slice(aliasIndex, aliasIndex + 25);
      if (peek.includes('ldl') || peek.includes('hdl') || peek.includes('vldl') || peek.includes('fracionado')) {
        continue;
      }
    }
    if (paramId === 'GLICOSE' && (alias === 'glicose' || alias === 'glicemia')) {
      const peekBehind = normalized.slice(Math.max(0, aliasIndex - 15), aliasIndex);
      if (peekBehind.includes('hemoglobina') || peekBehind.includes('hb')) {
        continue;
      }
    }

    // Delimitar a seção até o próximo cabeçalho ou ~350 caracteres
    let sectionEnd = Math.min(normalized.length, aliasIndex + 350);
    for (const h of allHeaderKeywords) {
      if (alias.includes(h)) continue;
      const nextIdx = normalized.indexOf(h, aliasIndex + alias.length + 3);
      if (nextIdx !== -1 && nextIdx < sectionEnd) {
        sectionEnd = nextIdx;
      }
    }

    const section = normalized.slice(aliasIndex, sectionEnd);

    // Estratégia A: Se houver a palavra "resultado" ou "valor", extrair número após ela e antes de valores de referência
    const resIdx = section.search(/\b(?:resultado|valor|obtido|dosagem)\b/);
    if (resIdx !== -1) {
      const afterRes = section.slice(resIdx);
      const refIdx = afterRes.search(/\b(?:referencia|val\.?\s*ref|desejavel|limite|normal|inferior|superior)\b/);
      const targetSub = refIdx !== -1 ? afterRes.slice(0, refIdx) : afterRes;

      const numMatch = targetSub.match(/[:=\s–-]*([\d]+(?:[.,]\d+)?)/);
      if (numMatch && numMatch[1]) {
        const val = cleanNumber(numMatch[1], paramId);
        if (val !== null) return val;
      }
    }

    // Estratégia B: Formato direto na linha "PARAMETRO: VALOR" ou "PARAMETRO ... VALOR"
    const refIdx2 = section.search(/\b(?:referencia|val\.?\s*ref|desejavel|valores\s+de|inferior\s+a|ate\s+\d)\b/);
    const textBeforeRef = refIdx2 !== -1 ? section.slice(0, refIdx2) : section;

    const directMatch = textBeforeRef.match(/(?:[:=–-]|(?:\.{2,}))\s*([\d]+(?:[.,]\d+)?)/);
    if (directMatch && directMatch[1]) {
      const val = cleanNumber(directMatch[1], paramId);
      if (val !== null) return val;
    }

    // Estratégia C: Primeiro número na seção antes de referência
    const firstNumMatch = textBeforeRef.match(/\b([\d]+(?:[.,]\d+)?)\s*(?:mg\/dl|g\/dl|u\/l|ug\/dl|ng\/ml|ui\/l|mm3|mil\/mm3|%|\b)/);
    if (firstNumMatch && firstNumMatch[1]) {
      const val = cleanNumber(firstNumMatch[1], paramId);
      if (val !== null) return val;
    }
  }

  return null;
}

// Parser universal que extrai todos os parâmetros laboratoriais mapeados do laudo
export function parseExamMetrics(text: string): Record<string, number> {
  const result: Record<string, number> = {};
  if (!text) return result;

  for (const paramKey of Object.keys(PARAMETER_REFERENCES)) {
    const val = extractParameterValue(text, paramKey);
    if (val !== null && !isNaN(val)) {
      result[paramKey] = val;
    }
  }

  return result;
}

export function detectOrganForExam(examName: string): OrganId {
  const norm = normalizeText(examName || '');
  for (const [key, organ] of Object.entries(EXAM_NAME_TO_ORGAN)) {
    const normKey = normalizeText(key);
    if (norm.includes(normKey)) return organ;
  }
  return 'cerebro'; // default
}

export function determineStatus(paramId: string, value: number): HealthStatus {
  const ref = PARAMETER_REFERENCES[paramId];
  if (!ref) return 'normal';

  if (paramId === 'HEMOGLOBINA') {
    if (value < 10.0) return 'critico';
    if (value < 12.0) return 'alerta';
    if (value > 18.0) return 'alerta';
    return 'normal';
  }

  if (paramId === 'COLESTEROL HDL') {
    if (value < 35.0) return 'critico';
    if (value < 40.0) return 'alerta';
    return 'normal';
  }

  if (paramId === 'PLAQUETAS') {
    if (value < 100000) return 'critico';
    if (value < 150000) return 'alerta';
    if (value > 500000) return 'alerta';
    return 'normal';
  }

  if (value > ref.alertMax) return 'critico';
  if (value > ref.normalMax) return 'alerta';
  if (ref.normalMin > 0 && value < ref.normalMin) return 'alerta';
  return 'normal';
}

export interface HealthAnalysisSummary {
  organs: Record<OrganId, OrganInfo>;
  avatarState: AvatarAnimationState;
  stateDescription: string;
  stateBadge: string;
  alerts: HealthAlert[];
  overallStatus: HealthStatus;
  primaryAffectedOrgan: OrganId | null;
}

// Analisa todos os exames do paciente e produz um diagnóstico visual integrado
export function analyzePatientHealth(exams: ExamResult[]): HealthAnalysisSummary {
  const organMap: Record<OrganId, OrganInfo> = {
    cerebro: {
      id: 'cerebro',
      name: 'Cabeça & Oxigenação',
      description: 'Hemograma, reservas de ferro e vitalidade neural',
      icon: 'fa-brain',
      status: 'normal',
      metrics: [],
      recommendation: 'Mantenha sono regular e alimentação rica em ferro e vitaminas.',
      symptoms: []
    },
    coracao: {
      id: 'coracao',
      name: 'Coração & Circulação',
      description: 'Perfil lipídico, colesterol e sistema cardiovascular',
      icon: 'fa-heart-pulse',
      status: 'normal',
      metrics: [],
      recommendation: 'Pratique atividades aeróbicas e mantenha dieta balanceada com baixo teor de gorduras saturadas.',
      symptoms: []
    },
    pulmoes: {
      id: 'pulmoes',
      name: 'Pulmões & Respiração',
      description: 'Função respiratória e trocas gasosas',
      icon: 'fa-lungs',
      status: 'normal',
      metrics: [],
      recommendation: 'Evite ambientes poluídos e pratique exercícios respiratórios.',
      symptoms: []
    },
    figado: {
      id: 'figado',
      name: 'Fígado & Metabolismo',
      description: 'Enzimas hepáticas (TGO/TGP) e metabolização de substâncias',
      icon: 'fa-dna',
      status: 'normal',
      metrics: [],
      recommendation: 'Reduza o consumo de álcool e alimentos ultraprocessados; hidrate-se com frequência.',
      symptoms: []
    },
    rins: {
      id: 'rins',
      name: 'Rins & Excreção',
      description: 'Filtração renal, creatinina, ureia e equilíbrio hídrico',
      icon: 'fa-droplet',
      status: 'normal',
      metrics: [],
      recommendation: 'Aumente o consumo de água para pelo menos 2 litros ao dia e controle a ingestão de sódio.',
      symptoms: []
    },
    pancreas: {
      id: 'pancreas',
      name: 'Pâncreas & Glicose',
      description: 'Glicemia de jejum e controle de açúcar no sangue',
      icon: 'fa-cube',
      status: 'normal',
      metrics: [],
      recommendation: 'Monitore açúcares refinados e carboidratos simples; priorize alimentos de baixo índice glicêmico.',
      symptoms: []
    },
    articulacoes: {
      id: 'articulacoes',
      name: 'Músculos & Articulações',
      description: 'Marcadores de inflamação sistêmica (PCR) e dor corporal',
      icon: 'fa-bone',
      status: 'normal',
      metrics: [],
      recommendation: 'Faça alongamentos diários e consulte o médico se as dores ou inchaços persistirem.',
      symptoms: []
    }
  };

  const alerts: HealthAlert[] = [];
  let foundFatigue = false;
  let foundPain = false;
  let foundCardio = false;
  let criticalCount = 0;
  let alertCount = 0;
  let primaryAffectedOrgan: OrganId | null = null;

  // Se não houver exames ou todos vazios, criar mock pedagógico inicial com base no primeiro exame
  const sortedExams = [...exams].sort((a, b) => {
    return (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0);
  });

  sortedExams.forEach((exam) => {
    const organId = detectOrganForExam(exam.examName);
    const parsedMetrics = parseExamMetrics(exam.resultData || '');
    const textUpper = (exam.resultData || '').toUpperCase();

    // Check textual flags
    let examStatus: HealthStatus = 'normal';
    if (textUpper.includes('CRÍTICO') || textUpper.includes('CRITICO') || textUpper.includes('MUITO ALTO') || textUpper.includes('MUITO BAIXO')) {
      examStatus = 'critico';
    } else if (textUpper.includes('ALTERADO') || textUpper.includes('ALERTA') || textUpper.includes('ALTO') || textUpper.includes('BAIXO')) {
      examStatus = 'alerta';
    }

    // Processar métricas numéricas
    for (const [paramId, val] of Object.entries(parsedMetrics)) {
      const metricStatus = determineStatus(paramId, val);
      const ref = PARAMETER_REFERENCES[paramId];
      const metricOrgan = ref ? ref.organId : organId;

      organMap[metricOrgan].metrics.push({
        name: ref ? ref.name : paramId,
        value: val,
        unit: ref ? ref.unit : '',
        status: metricStatus,
        date: exam.date
      });

      if (metricStatus === 'critico' || metricStatus === 'alerta') {
        if (metricStatus === 'critico') criticalCount++;
        else alertCount++;

        // Atualiza status do órgão
        if (metricStatus === 'critico' || organMap[metricOrgan].status === 'normal') {
          organMap[metricOrgan].status = metricStatus;
          if (!primaryAffectedOrgan) primaryAffectedOrgan = metricOrgan;
        }

        // Sintomas e alertas específicos
        if (paramId === 'HEMOGLOBINA' && val < 12.0) {
          foundFatigue = true;
          organMap[metricOrgan].symptoms.push('Cansaço', 'Fraqueza', 'Sono excessivo');
          alerts.push({
            id: `alert-${exam.id}-${paramId}`,
            organId: metricOrgan,
            organName: organMap[metricOrgan].name,
            examName: exam.examName,
            severity: metricStatus,
            title: 'Sinal de Fadiga & Anemia',
            message: `Hemoglobina em ${val} ${ref.unit} está abaixo da faixa recomendada. O transporte de oxigênio no corpo fica reduzido, gerando cansaço constante.`,
            recommendation: 'Consulte seu médico para avaliar suplementação de ferro/vitaminas e alimentação.',
            clinicalNote: 'Hipocromia / redução de hemoglobina sérica com fadiga crônica clínica.',
            date: exam.date
          });
        } else if (paramId === 'PCR' && val > 5.0) {
          foundPain = true;
          organMap[metricOrgan].symptoms.push('Dor muscular/articular', 'Inflamação ativa');
          alerts.push({
            id: `alert-${exam.id}-${paramId}`,
            organId: metricOrgan,
            organName: organMap[metricOrgan].name,
            examName: exam.examName,
            severity: metricStatus,
            title: 'Inflamação & Possível Dor Corporal',
            message: `PCR elevado (${val} mg/L) indica processo inflamatório em curso nas articulações ou tecidos do corpo.`,
            recommendation: 'Repouse a região afetada e relate eventuais dores ou inchaços na sua próxima consulta.',
            clinicalNote: 'Marcador inflamatório de fase aguda positivo. Investigar artralgia/mialgia.',
            date: exam.date
          });
        } else if ((paramId === 'COLESTEROL LDL' && val > 130) || (paramId === 'COLESTEROL TOTAL' && val > 200)) {
          foundCardio = true;
          organMap[metricOrgan].symptoms.push('Alerta circulatório', 'Sensação de peso torácico');
          alerts.push({
            id: `alert-${exam.id}-${paramId}`,
            organId: metricOrgan,
            organName: organMap[metricOrgan].name,
            examName: exam.examName,
            severity: metricStatus,
            title: 'Alerta Cardiovascular',
            message: `Nível lipídico (${val} mg/dL) acima da meta. Atenção aos vasos sanguíneos e circulação.`,
            recommendation: 'Adote alimentação pobre em frituras e caminhe regularmente.',
            clinicalNote: 'Dislipidemia aterogênica em acompanhamento.',
            date: exam.date
          });
        } else if (paramId === 'GLICOSE' && val > 100) {
          organMap[metricOrgan].symptoms.push('Metabolismo glicêmico alterado', 'Sede/Fadiga');
          alerts.push({
            id: `alert-${exam.id}-${paramId}`,
            organId: metricOrgan,
            organName: organMap[metricOrgan].name,
            examName: exam.examName,
            severity: metricStatus,
            title: val > 125 ? 'Alerta de Hiperglicemia' : 'Glicemia em Atenção',
            message: `Glicose em jejum registrada em ${val} mg/dL.`,
            recommendation: 'Evite doces, refrigerantes e massas brancas; refaça o exame conforme orientação médica.',
            clinicalNote: val > 125 ? 'Critério laboratorial compatível com DM. Solicitar HbA1c.' : 'Glicemia de jejum alterada / pré-diabetes.',
            date: exam.date
          });
        } else if (paramId === 'CREATININA' && val > 1.2) {
          organMap[metricOrgan].symptoms.push('Sobrecarga renal', 'Retenção');
          alerts.push({
            id: `alert-${exam.id}-${paramId}`,
            organId: metricOrgan,
            organName: organMap[metricOrgan].name,
            examName: exam.examName,
            severity: metricStatus,
            title: 'Atenção à Função Renal',
            message: `Creatinina sérica elevada em ${val} mg/dL.`,
            recommendation: 'Aumente imediatamente a ingestão de água e reduza o consumo de sal.',
            clinicalNote: 'Possível redução da taxa de filtração glomerular. Checar clearance.',
            date: exam.date
          });
        } else if (paramId === 'TRIGLICERIDEOS' && val > 150) {
          foundCardio = true;
          organMap[metricOrgan].symptoms.push('Triglicerídeos elevados', 'Sobrecarga lipídica');
          alerts.push({
            id: `alert-${exam.id}-${paramId}`,
            organId: metricOrgan,
            organName: organMap[metricOrgan].name,
            examName: exam.examName,
            severity: metricStatus,
            title: val > 199 ? 'Triglicerídeos em Nível Crítico' : 'Triglicerídeos em Alerta',
            message: `Triglicerídeos em ${val} mg/dL (valor desejável é inferior a 150 mg/dL). Níveis elevados demandam controle alimentar e aumentam o risco cardiovascular.`,
            recommendation: 'Reduza o consumo de açúcares simples, massas, frituras e bebidas alcoólicas. Aumente a ingestão de fibras e pratique caminhadas.',
            clinicalNote: val > 400 ? 'Hipertrigliceridemia grave. Risco de pancreatite aguda e aterosclerose acelerada.' : 'Hipertrigliceridemia em acompanhamento.',
            date: exam.date
          });
        } else if (paramId === 'ACIDO URICO' && val > 7.0) {
          foundPain = true;
          organMap[metricOrgan].symptoms.push('Ácido Úrico elevado', 'Risco de dor articular / crise de gota');
          alerts.push({
            id: `alert-${exam.id}-${paramId}`,
            organId: metricOrgan,
            organName: organMap[metricOrgan].name,
            examName: exam.examName,
            severity: metricStatus,
            title: 'Ácido Úrico Elevado (Hiperuricemia)',
            message: `Ácido Úrico sérico registrado em ${val} mg/dL. O acúmulo de cristais pode provocar crises de dor e inflamação articular.`,
            recommendation: 'Beba mais de 2 litros de água ao dia, evite embutidos, carnes vermelhas e cerveja.',
            clinicalNote: 'Hiperuricemia com risco de nefrolitíase e artrite gotosa.',
            date: exam.date
          });
        } else if ((paramId === 'TGO' || paramId === 'TGP' || paramId === 'GAMA GT') && val > 40) {
          organMap[metricOrgan].symptoms.push('Enzimas hepáticas alteradas', 'Metabolismo hepático sobrecarregado');
          alerts.push({
            id: `alert-${exam.id}-${paramId}`,
            organId: metricOrgan,
            organName: organMap[metricOrgan].name,
            examName: exam.examName,
            severity: metricStatus,
            title: 'Enzimas Hepáticas em Atenção',
            message: `${ref ? ref.name : paramId} elevado em ${val} U/L. O fígado pode estar sob sobrecarga metabólica ou medicamentosa.`,
            recommendation: 'Evite bebidas alcoólicas, alimentos ultraprocessados e consulte seu médico.',
            clinicalNote: 'Transaminases / enzimas canaliculares alteradas. Investigar esteatose hepática ou fármacos.',
            date: exam.date
          });
        } else if (paramId === 'LEUCOCITOS' && (val > 11000 || val < 4000)) {
          if (val > 11000) foundPain = true;
          else foundFatigue = true;
          alerts.push({
            id: `alert-${exam.id}-${paramId}`,
            organId: metricOrgan,
            organName: organMap[metricOrgan].name,
            examName: exam.examName,
            severity: metricStatus,
            title: val > 11000 ? 'Leucocitose (Defesa Ativa / Infecção)' : 'Leucopenia (Imunidade Reduzida)',
            message: `Leucócitos totais em ${val} /mm³. ${val > 11000 ? 'Indica reação inflamatória ou infecciosa em curso.' : 'Contagem baixa de células de defesa.'}`,
            recommendation: 'Monitore eventuais febres, dores ou sinais de infecção e consulte seu médico.',
            clinicalNote: val > 11000 ? 'Leucocitose com desvio a investigar.' : 'Leucopenia transitória ou crônica.',
            date: exam.date
          });
        }
      }
    }

    // Se o exame tinha status geral crítico/alerta sem parâmetros numéricos individuais
    if (examStatus !== 'normal' && organMap[organId].status === 'normal') {
      organMap[organId].status = examStatus;
      if (!primaryAffectedOrgan) primaryAffectedOrgan = organId;
      if (examStatus === 'critico') criticalCount++;
      else alertCount++;
    }
  });

  // Determinar a animação global do Avatar
  let avatarState: AvatarAnimationState = 'vigoroso';
  let stateDescription = 'Todos os parâmetros avaliados estão normais e equilibrados!';
  let stateBadge = 'Vitalidade 100%';

  if (foundPain) {
    avatarState = 'com_dor';
    stateDescription = 'Identificamos marcadores inflamatórios compatíveis com dor ou desconforto físico.';
    stateBadge = 'Sintoma: Com Dor / Inflamação';
  } else if (foundFatigue) {
    avatarState = 'cansado';
    stateDescription = 'Seus exames mostram índices que provocam cansaço, lentidão e sensação de exaustão.';
    stateBadge = 'Sintoma: Cansaço / Fadiga';
  } else if (foundCardio) {
    avatarState = 'palpitacao';
    stateDescription = 'Parâmetros circulatórios demandam cuidado; coração em ritmo de sobrecarga.';
    stateBadge = 'Atenção: Cardiovascular';
  } else if (criticalCount > 0) {
    avatarState = 'com_dor';
    stateDescription = 'Há resultados em nível crítico que necessitam de intervenção médica ágil.';
    stateBadge = 'Alerta Crítico Ativo';
  } else if (alertCount > 0) {
    avatarState = 'cansado';
    stateDescription = 'Observamos parâmetros limítrofes requerendo ajustes no seu bem-estar diário.';
    stateBadge = 'Estado de Observação';
  }

  const overallStatus: HealthStatus = criticalCount > 0 ? 'critico' : alertCount > 0 ? 'alerta' : 'normal';

  return {
    organs: organMap,
    avatarState,
    stateDescription,
    stateBadge,
    alerts,
    overallStatus,
    primaryAffectedOrgan: primaryAffectedOrgan || 'cerebro'
  };
}
