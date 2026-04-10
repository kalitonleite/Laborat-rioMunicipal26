
import React from 'react';

interface ExamMapping {
  id: string;
  orgao: string;
  status: 'normal' | 'alerta' | 'critico';
  exame_nome: string;
  data: string;
  valor: string;
}

interface ResumoExamesProps {
  exames: ExamMapping[];
  onSelect: (exame: ExamMapping) => void;
  selecionado: ExamMapping | null;
}

export default function ResumoExames({ exames, onSelect, selecionado }: ResumoExamesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Análise por Órgão</h3>
        <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-full uppercase">
          Sincronizado
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {exames.map((exame) => (
          <button
            key={exame.id}
            onClick={() => onSelect(exame)}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
              selecionado?.id === exame.id 
                ? 'bg-blue-50 border-blue-200 shadow-md scale-[1.02]' 
                : 'bg-white border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                exame.status === 'critico' ? 'bg-rose-50 text-rose-500' :
                exame.status === 'alerta' ? 'bg-amber-50 text-amber-500' :
                'bg-emerald-50 text-emerald-500'
              }`}>
                <i className={`fas ${
                  exame.orgao === 'cerebro' ? 'fa-brain' :
                  exame.orgao === 'figado' ? 'fa-lungs' : // Usando ícone similar para fígado se não houver específico
                  exame.orgao === 'rins' ? 'fa-kidneys' : 'fa-dna'
                }`}></i>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{exame.orgao}</p>
                <h4 className="font-black text-slate-800 text-sm">{exame.exame_nome}</h4>
              </div>
            </div>
            
            <div className="text-right">
              <p className={`text-xs font-black uppercase ${
                exame.status === 'critico' ? 'text-rose-500' :
                exame.status === 'alerta' ? 'text-amber-500' :
                'text-emerald-500'
              }`}>
                {exame.status}
              </p>
              <p className="text-[10px] font-bold text-gray-300">{exame.data}</p>
            </div>
          </button>
        ))}
        
        {exames.length === 0 && (
          <div className="p-8 text-center bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
            <p className="text-sm text-gray-400 italic font-medium">Nenhum exame biométrico encontrado para mapeamento 3D.</p>
          </div>
        )}
      </div>
    </div>
  );
}
