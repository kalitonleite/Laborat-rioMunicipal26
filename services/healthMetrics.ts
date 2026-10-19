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
  'TRIGLICERIDEOS': {
    id: 'TRIGLICERIDEOS',
    name: 'Triglicerídeos',
    unit: 'mg/dL',
    organId: 'coracao',
    normalMin: 0,
    normalMax: 150,
    alertMax: 199,
    description: 'Gordura de reserva energética no sangue'
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
  'PCR': {
    id: 'PCR',
    name: 'Proteína C-Reativa (PCR)',
    unit: 'mg/L',
    organId: 'articulacoes',
    normalMin: 0,
    normalMax: 5.0,
    alertMax: 10.0,
    description: 'Marcador agudo de inflamação e dor corporal'
  }
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
  'SANGUE': 'cerebro',
  'ANEMIA': 'cerebro',
  'B12': 'cerebro',
  'FERRIT': 'cerebro',
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
  'PULMAO': 'pulmoes',
  'GASOM': 'pulmoes',
  'OXIM': 'pulmoes'
};

// Parser para extrair valores chave do texto do exame
export function parseExamMetrics(text: string): Record<string, number> {
  const result: Record<string, number> = {};
  if (!text) return result;

  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    // Procura por formatos: "GLICOSE: 95 mg/dL", "Glicemia de jejum - 105", "Creatinina: 1,2"
    const match = line.match(/([a-zA-ZÀ-ÿ0-9\s\-_/]+)[:=–-]\s*([\d]+(?:[.,]\d+)?)/);
    if (match) {
      const rawKey = match[1].trim().toUpperCase();
      const numStr = match[2].replace(',', '.');
      const val = parseFloat(numStr);
      if (!isNaN(val)) {
        // Encontrar chave canônica
        for (const refKey of Object.keys(PARAMETER_REFERENCES)) {
          if (rawKey.includes(refKey)) {
            result[refKey] = val;
            break;
          }
        }
      }
    }
  }

  // Tenta também busca direta no texto todo caso o formato não seja linha a linha
  const upper = text.toUpperCase();
  for (const [key] of Object.entries(PARAMETER_REFERENCES)) {
    if (!result[key]) {
      const regex = new RegExp(`${key}[^\\d]*?([\\d]+(?:[.,]\\d+)?)`, 'i');
      const directMatch = upper.match(regex);
      if (directMatch) {
        const val = parseFloat(directMatch[1].replace(',', '.'));
        if (!isNaN(val)) result[key] = val;
      }
    }
  }

  return result;
}

export function detectOrganForExam(examName: string): OrganId {
  const upper = (examName || '').toUpperCase();
  for (const [key, organ] of Object.entries(EXAM_NAME_TO_ORGAN)) {
    if (upper.includes(key)) return organ;
  }
  return 'cerebro'; // default
}

export function determineStatus(paramId: string, value: number): HealthStatus {
  const ref = PARAMETER_REFERENCES[paramId];
  if (!ref) return 'normal';

  if (paramId === 'HEMOGLOBINA') {
    // Para hemoglobina, valores baixos indicam anemia (cansaço)
    if (value < 10.0) return 'critico';
    if (value < 12.0) return 'alerta';
    if (value > 18.0) return 'alerta';
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
