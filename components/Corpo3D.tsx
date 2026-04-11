
import React, { useMemo } from 'react';

interface ExamMapping {
  orgao: string;
  status: 'normal' | 'alerta' | 'critico';
  exame_nome: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapeamento exame → regiões anatômicas afetadas (Mantido do original)
// ─────────────────────────────────────────────────────────────────────────────
function getRegionsForExam(examName: string): string[] {
  const n = examName.toUpperCase();

  if (n.includes('HEMOGRAMA') || n.includes('HEMÁCIAS') || n.includes('LEUCÓCIT') || n.includes('PLAQUETA')) return ['sangue'];
  if (n.includes('BIOQUIMICA') || n.includes('BIOQUÍMICA')) return ['figado', 'rins', 'pancreas', 'coracao'];
  if (n.includes('URIN') || n.includes('EAS') || n.includes('UROCULTURA')) return ['rins', 'bexiga'];
  if (n.includes('PARASIT') || n.includes('FEZES') || n.includes('COPRO') || n.includes('HELMINTO')) return ['intestinos'];
  if (n.includes('COLESTEROL') || n.includes('TRIGLICERI') || n.includes('CARDIO') || n.includes('ECG')) return ['coracao'];
  if (n.includes('GLICOSE') || n.includes('GLICEMIA') || n.includes('INSULINA') || n.includes('HBA1C')) return ['pancreas'];
  if (n.includes('TGO') || n.includes('TGP') || n.includes('AST') || n.includes('ALT') || n.includes('HEPAT') || n.includes('BILIRRUB')) return ['figado'];
  if (n.includes('CREATIN') || n.includes('UREIA') || n.includes('RENAL') || n.includes('FILTRAÇÃO')) return ['rins'];
  if (n.includes('TSH') || n.includes('T3') || n.includes('T4') || n.includes('TIREO')) return ['tireoide'];
  if (n.includes('PSA') || n.includes('PROSTAT')) return ['prostata'];
  if (n.includes('TESTOST') || n.includes('HORMÔ') || n.includes('LH') || n.includes('FSH')) return ['prostata'];
  if (n.includes('FERRO') || n.includes('FERRITIN') || n.includes('TRANSFERR')) return ['figado', 'sangue'];
  return ['corpo']; 
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuração Visual e de Dados dos Órgãos
// ─────────────────────────────────────────────────────────────────────────────
const ORGAN_INFO: Record<string, { label: string; image: string; care: string }> = {
  cerebro: {
    label: 'Cérebro',
    image: '/assets/organs/brain.png',
    care: 'Mantenha uma rotina de sono regular, evite estresse excessivo e mantenha-se hidratado para otimizar as funções cognitivas.'
  },
  coracao: {
    label: 'Coração',
    image: '/assets/organs/heart.png',
    care: 'Reduza o consumo de sal e gorduras saturadas. A prática de exercícios aeróbicos leves é fundamental para o fortalecimento cardíaco.'
  },
  figado: {
    label: 'Fígado',
    image: '/assets/organs/liver.png',
    care: 'Evite o consumo de bebidas alcoólicas e alimentos ultraprocessados. Priorize uma dieta rica em vegetais e fibras.'
  },
  rins: {
    label: 'Rins',
    image: '/assets/organs/kidneys.png',
    care: 'Beba pelo menos 2 litros de água por dia e controle a ingestão de sódio para facilitar a filtragem sanguínea.'
  },
  sangue: {
    label: 'Sistema Sanguíneo',
    image: '/assets/organs/blood.png',
    care: 'Consuma alimentos ricos em ferro e vitamina B12. Mantenha-se ativo para melhorar a circulação e oxigenação celular.'
  },
  pulmao: {
    label: 'Pulmão',
    image: '/assets/organs/lungs.png',
    care: 'Evite exposição a fumaças e poluentes. Pratique exercícios de respiração profunda para aumentar a capacidade pulmonar.'
  },
  pancreas: {
    label: 'Pâncreas',
    image: '/assets/organs/liver.png', // Usando liver como fallback visual próximo
    care: 'Controle rigorosamente a ingestão de açúcares e carboidratos simples para evitar sobrecarga na produção de insulina.'
  },
  tireoide: {
    label: 'Tireoide',
    image: '/assets/organs/brain.png', // Fallback visual
    care: 'Mantenha o consumo adequado de iodo (sal iodado) e monitore níveis de energia e peso corporal regularmente.'
  },
  corpo: {
    label: 'Saúde Geral',
    image: '/assets/organs/blood.png', // Fallback
    care: 'Mantenha um estilo de vida equilibrado com alimentação diversificada, hidratação e atividade física constante.'
  }
};

const getStatusDetails = (status: 'normal' | 'alerta' | 'critico') => {
  switch (status) {
    case 'critico':
      return {
        label: 'Estado Crítico',
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        desc: 'Alterações expressivas detectadas. Recomendamos consulta urgente com um especialista para avaliação detalhada.'
      };
    case 'alerta':
      return {
        label: 'Atenção / Alerta',
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        desc: 'Foram detectadas alterações moderadas. É importante monitorar e ajustar o estilo de vida conforme as orientações abaixo.'
      };
    default:
      return {
        label: 'Normal / Saudável',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        desc: 'O órgão apresenta funcionamento dentro dos padrões de referência. Continue mantendo seus hábitos saudáveis.'
      };
  }
};

export default function Corpo3D({ exames, selectedExam }: {
  exames: ExamMapping[];
  selectedExam?: ExamMapping | null;
}) {
  const sel = selectedExam ?? (exames.length > 0 ? exames[0] : null);
  
  const regions = useMemo(() => sel ? getRegionsForExam(sel.exame_nome) : ['corpo'], [sel]);
  const mainRegion = regions[0];
  const info = ORGAN_INFO[mainRegion] || ORGAN_INFO['corpo'];
  const status = getStatusDetails(sel?.status || 'normal');

  // Identificar exames alterados que afetam as mesmas regiões
  const examesAltered = useMemo(() => {
    if (!sel) return [];
    const currentRegions = getRegionsForExam(sel.exame_nome);
    return exames.filter(e => {
        const eRegions = getRegionsForExam(e.exame_nome);
        const hasOverlap = eRegions.some(r => currentRegions.includes(r));
        return hasOverlap && (e.status === 'alerta' || e.status === 'critico');
    });
  }, [exames, sel]);

  return (
    <div className="w-full h-[550px] bg-slate-900 rounded-[40px] overflow-hidden relative border border-white/10 shadow-2xl flex flex-col items-center justify-center p-8">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600 rounded-full blur-[120px]"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600 rounded-full blur-[120px]"></div>
      </div>

      {!sel ? (
        <div className="relative z-10 text-center space-y-4">
             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-microscope text-3xl text-blue-400"></i>
             </div>
             <h3 className="text-white font-black uppercase tracking-widest text-xl">Análise Biométrica</h3>
             <p className="text-slate-400 font-bold text-sm max-w-md">Selecione um exame na lista lateral para visualizar os detalhes do órgão afetado e recomendações de cuidados.</p>
        </div>
      ) : (
        <div className="relative z-10 w-full h-full flex flex-col md:flex-row items-center gap-8 animate-in fade-in zoom-in-95 duration-500">
            
            {/* Organ Image Section */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center relative">
                <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-[60px] scale-75"></div>
                <img 
                    src={info.image} 
                    alt={info.label}
                    className="w-64 h-64 md:w-80 md:h-80 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png'; // Fallback icon
                    }}
                />
                <div className="mt-6 text-center">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1 block">Sistema / Órgão Alvo</span>
                    <h4 className="text-3xl font-black text-white uppercase tracking-tight">{info.label}</h4>
                </div>
            </div>

            {/* Info Section */}
            <div className="w-full md:w-1/2 space-y-5 h-full flex flex-col justify-center">
                
                {/* Status Box */}
                <div className={`p-6 rounded-[32px] border ${status.border} ${status.bg} backdrop-blur-sm space-y-3`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full animate-pulse shadow-sm shadow-current ${status.color}`}></div>
                        <span className={`text-sm font-black uppercase tracking-widest ${status.color}`}>{status.label}</span>
                    </div>
                    <div>
                        <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">Situação Atual</p>
                        <p className="text-white/80 font-medium text-sm leading-relaxed">{status.desc}</p>
                    </div>

                    {/* Altered Exams List */}
                    {examesAltered.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-white/5 space-y-2">
                             <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">Exames Alterados:</p>
                             <div className="flex flex-wrap gap-2">
                                {examesAltered.map((e, idx) => (
                                    <div key={idx} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                                        e.status === 'critico' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                    }`}>
                                        {e.exame_nome}
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}
                </div>

                {/* Care Box */}
                <div className="p-6 rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-sm space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                            <i className="fas fa-hand-holding-heart text-sm"></i>
                        </div>
                        <span className="text-sm font-black text-white uppercase tracking-widest">Cuidados Recomendados</span>
                    </div>
                    <div>
                        <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">Dicas de Saúde</p>
                        <p className="text-white/80 font-medium text-sm leading-relaxed">{info.care}</p>
                    </div>
                </div>

                {/* Exam Context */}
                <div className="flex items-center gap-4 px-2">
                    <div className="flex-1 h-px bg-white/10"></div>
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] whitespace-nowrap">Visualizando: {sel.exame_nome}</span>
                    <div className="flex-1 h-px bg-white/10"></div>
                </div>
            </div>

        </div>
      )}

      {/* Footer Branding */}
      <div className="absolute bottom-6 left-8 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Biometria Inteligente v3.0</span>
      </div>

    </div>
  );
}
