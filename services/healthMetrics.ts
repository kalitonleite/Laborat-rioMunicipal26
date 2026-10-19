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

function isNextHeaderLine(normLine: string): boolean {
  const headers = [
    'colesterol', 'triglic', 'ureia', 'creatinina', 'hemoglobina',
    'hematocrito', 'leucocitos', 'plaquetas', 'acido urico', 'tgo',
    'tgp', 'gama gt', 'pcr', 'hba1c', 'ferritina', 'exame:', 'paciente:'
  ];
  return headers.some(h => normLine.startsWith(h) || normLine.includes(h + ':'));
}

export function isParamMatchingExamName(paramId: string, examName?: string): boolean {
  if (!examName) return false;
  const normExam = normalizeText(examName);
  const aliases = PARAM_ALIASES[paramId] || [normalizeText(paramId)];
  for (const alias of aliases) {
    if (normExam.includes(alias)) return true;
  }
  return false;
}

// Verifica se uma linha contém texto de referência (não é um valor do paciente)
function isReferenceLine(normLine: string): boolean {
  return /\b(?:referencia|val\.?\s*ref|desejavel|valores?\s+de\s+refer|inferior\s+a|vp\s*[:=]|vr\s*[:=])\b/.test(normLine);
}

// Encontra o índice real do alias em normLine respeitando limites de palavra
function findAliasWordStart(normLine: string, alias: string): number {
  let from = 0;
  while (from < normLine.length) {
    const idx = normLine.indexOf(alias, from);
    if (idx === -1) return -1;
    const before = idx > 0 ? normLine[idx - 1] : ' ';
    const afterChar = (idx + alias.length < normLine.length) ? normLine[idx + alias.length] : ' ';
    if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(afterChar)) return idx;
    from = idx + 1;
  }
  return -1;
}

// Extrai o valor numérico de um parâmetro específico no laudo de forma inteligente, segura e contextual
export function extractParameterValue(
  rawText: string,
  paramId: string,
  examName?: string
): number | null {
  if (!rawText && !examName) return null;

  const text = rawText || '';
  const normalized = normalizeText(text);
  const aliases = PARAM_ALIASES[paramId] || [normalizeText(paramId)];
  const parseNum = (str: string): number | null => cleanNumber(str, paramId);

  // ESTRATÉGIA 1: Se o nome do próprio exame identifica este parâmetro
  // (Exemplo: Exame = "Glicose" ou "Glicemia de Jejum" e no texto o médico digitou apenas "95", "95 mg/dL" ou "Resultado: 95")
  if (examName && isParamMatchingExamName(paramId, examName)) {
    // 1.1 Se o texto tem "resultado: X" ou "valor: X"
    const resDirect = normalized.match(/(?:resultado|valor\s*(?:encontrado|obtido)?|dosagem)[:\s=–-]*([\d]+(?:[.,]\d+)?)/i);
    if (resDirect && resDirect[1]) {
      const val = parseNum(resDirect[1]);
      if (val !== null) return val;
    }

    // 1.2 Se o texto começa diretamente com o número ou é apenas o valor (ex: "95 mg/dL", "95", "104.5")
    const shortDirect = normalized.match(/(?:^|[^\d.,])([\d]+(?:[.,]\d+)?)\s*(?:mg\/dl|g\/dl|u\/l|%|\b)/i);
    if (shortDirect && shortDirect[1]) {
      // Evitar pegar ano se for data (ex: 2026)
      const numCandidate = shortDirect[1];
      if (!text.includes(`/${numCandidate}`) && !text.includes(`-${numCandidate}`)) {
        const val = parseNum(numCandidate);
        if (val !== null && val < 1900) return val;
      }
    }
  }

  // ESTRATÉGIA 2: Extração linha a linha – alias e valor na MESMA linha
  // Ex: "Glicose: 95 mg/dL", "Triglicérides .........: 160", "Glicemia - 98"
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const normLine = normalizeText(line);
    if (isReferenceLine(normLine)) continue;

    for (const alias of aliases) {
      const aliasIdx = findAliasWordStart(normLine, alias);
      if (aliasIdx === -1) continue;

      // Proteção contra colisões de sub-palavras
      if (paramId === 'COLESTEROL TOTAL' && alias === 'colesterol') {
        if (normLine.includes('ldl') || normLine.includes('hdl') || normLine.includes('vldl') || normLine.includes('fracionado')) continue;
      }
      if (paramId === 'GLICOSE' && (alias === 'glicose' || alias === 'glicemia')) {
        if (normLine.includes('hemoglobina') || normLine.includes('hb a1c') || normLine.includes('hba1c')) continue;
      }

      // Trecho da linha APÓS o alias (índice correto sem deslocamento)
      const afterAlias = normLine.slice(aliasIdx + alias.length);

      // Cortar antes de texto de referência
      const refIdx = afterAlias.search(/\b(?:referencia|val\.?\s*ref|desejavel|valores?\s+de|inferior\s+a|ate\s+\d)\b/);
      const targetText = refIdx !== -1 ? afterAlias.slice(0, refIdx) : afterAlias;

      // 2a) Separador explícito seguido de número
      const sepMatch = targetText.match(/(?:[:=\u2013\-]|(?:\.{2,}))\s*([\d]+(?:[.,]\d+)?)/);
      if (sepMatch && sepMatch[1]) {
        const val = parseNum(sepMatch[1]);
        if (val !== null && val < 100000) return val;
      }

      // 2b) Número seguido de unidade laboratorial reconhecida (sem \b como alternativa)
      const unitMatch = targetText.match(/([\d]+(?:[.,]\d+)?)\s*(?:mg\/dl|g\/dl|u\/l|iu\/l|ui\/l|ug\/dl|ng\/ml|pg\/ml|mil\/mm3|\/mm3|%)\b/i);
      if (unitMatch && unitMatch[1]) {
        const val = parseNum(unitMatch[1]);
        if (val !== null && val < 100000) return val;
      }

      // 2c) Número isolado no final da linha (sem texto alfa após o número)
      const endNum = targetText.match(/\s+([\d]+(?:[.,]\d+)?)\s*$/);
      if (endNum && endNum[1]) {
        const val = parseNum(endNum[1]);
        if (val !== null && val < 100000) return val;
      }
    }
  }

  // ESTRATÉGIA 3: Bloco multi-linhas (Exame na linha X e "Resultado: Y" na linha X+1 ou X+2)
  for (let i = 0; i < lines.length; i++) {
    const normLine = normalizeText(lines[i]);
    let hasAlias = false;

    for (const alias of aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i');
      if (regex.test(normLine)) {
        if (paramId === 'COLESTEROL TOTAL' && alias === 'colesterol') {
          if (normLine.includes('ldl') || normLine.includes('hdl') || normLine.includes('vldl')) continue;
        }
        if (paramId === 'GLICOSE' && (alias === 'glicose' || alias === 'glicemia')) {
          if (normLine.includes('hemoglobina') || normLine.includes('hb')) continue;
        }
        hasAlias = true;
        break;
      }
    }

    if (hasAlias) {
      // Olhar as próximas 4 linhas
      for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
        const nextNorm = normalizeText(lines[j]);
        if (isNextHeaderLine(nextNorm)) break;
        if (isReferenceLine(nextNorm)) continue;

        // Preferir linhas com label "resultado:" ou "valor:"
        const labeled = nextNorm.match(/(?:resultado|valor\s*(?:encontrado|obtido)?|dosagem)\s*[:\s=\u2013\-]+\s*([\d]+(?:[.,]\d+)?)/i);
        if (labeled && labeled[1]) {
          const val = parseNum(labeled[1]);
          if (val !== null && val < 100000) return val;
        }

        // Número com unidade na próxima linha
        const withUnit = nextNorm.match(/([\d]+(?:[.,]\d+)?)\s*(?:mg\/dl|g\/dl|u\/l|iu\/l|ui\/l|ug\/dl|ng\/ml|%)\b/i);
        if (withUnit && withUnit[1]) {
          const val = parseNum(withUnit[1]);
          if (val !== null && val < 100000) return val;
        }

        // Número isolado na próxima linha
        const onlyNum = nextNorm.trim().match(/^([\d]+(?:[.,]\d+)?)\s*(?:mg\/dl|g\/dl|u\/l|ui\/l|%)?$/i);
        if (onlyNum && onlyNum[1]) {
          const val = parseNum(onlyNum[1]);
          if (val !== null && val < 100000) return val;
        }
      }
    }
  }

  // ESTRATÉGIA 4: Varredura de texto contínuo / OCR de PDF (sem quebras de linha)
  for (const alias of aliases) {
    let from = 0;
    while (from < normalized.length) {
      const idx = normalized.indexOf(alias, from);
      if (idx === -1) break;
      from = idx + 1;

      const before = idx > 0 ? normalized[idx - 1] : ' ';
      const after = (idx + alias.length < normalized.length) ? normalized[idx + alias.length] : ' ';
      if (/[a-z0-9]/.test(before) || /[a-z0-9]/.test(after)) continue;

      // Trecho após o alias (até 200 chars)
      const section = normalized.slice(idx + alias.length, Math.min(normalized.length, idx + alias.length + 200));

      // Cortar antes de referência
      const refIdx = section.search(/\b(?:referencia|val\.?\s*ref|desejavel|valores?\s+de)\b/);
      const targetSub = refIdx !== -1 ? section.slice(0, refIdx) : section;

      // Separador explícito
      const sepMatch = targetSub.match(/(?:resultado|valor|dosagem|[:=\u2013\-])[:\s=\u2013\-]*([\d]+(?:[.,]\d+)?)/i);
      if (sepMatch && sepMatch[1]) {
        const val = parseNum(sepMatch[1]);
        if (val !== null && val < 100000) return val;
      }

      // Número com unidade
      const unitMatch = targetSub.match(/([\d]+(?:[.,]\d+)?)\s*(?:mg\/dl|g\/dl|u\/l|iu\/l|ui\/l|ug\/dl|ng\/ml|%)\b/i);
      if (unitMatch && unitMatch[1]) {
        const val = parseNum(unitMatch[1]);
        if (val !== null && val < 100000) return val;
      }
    }
  }

  // ESTRATÉGIA 5: Fallback quando o exame tem o nome do parâmetro e o texto contém qualquer número válido isolado
  if (examName && isParamMatchingExamName(paramId, examName)) {
    const textWithoutDates = normalized.replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, '');
    const fallbackNum = textWithoutDates.match(/\b([\d]+(?:[.,]\d+)?)\b/);
    if (fallbackNum && fallbackNum[1]) {
      const val = parseNum(fallbackNum[1]);
      if (val !== null && val < 2000) return val;
    }
  }

  return null;
}

// Parser universal que extrai todos os parâmetros laboratoriais mapeados do laudo
export function parseExamMetrics(text: string, examName?: string): Record<string, number> {
  const result: Record<string, number> = {};
  if (!text && !examName) return result;

  for (const paramKey of Object.keys(PARAMETER_REFERENCES)) {
    const val = extractParameterValue(text, paramKey, examName);
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
    const parsedMetrics = parseExamMetrics(exam.resultData || '', exam.examName);
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
