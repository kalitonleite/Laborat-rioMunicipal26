import React, { useState, useEffect } from 'react';
import Corpo3D from './Corpo3D';
import ResumoExames from './ResumoExames';
import ChatExame from './ChatExame';
import { User } from '../types';
import { extractTextFromPDFUrl } from '../services/pdfOcr';

interface Saude3DTabProps {
  user: User;
}

export default function Saude3DTab({ user }: Saude3DTabProps) {
  const [dados, setDados] = useState<any[]>([]);
  const [selecionado, setSelecionado] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const carregarDados3D = async () => {
      setLoading(true);
      try {
        if (!user || !user.id) {
            setLoading(false);
            return;
        }
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/saude3d?usuario_id=${user.id}&cpf=${user.cpf}`, { headers });
        if (!res.ok) {
           console.error('API Saude3D falhou:', res.status);
           setDados([]);
           setLoading(false);
           return;
        }
        
        const data = await res.json();
        
        if (Array.isArray(data)) {
          // Extrair texto de PDFs caso o valor não exista, processar localmente
          const dadosCompletos = await Promise.all(data.map(async (exam) => {
             if (exam && exam.file_url && (exam.valor === 'Pendente' || !exam.valor || (typeof exam.valor === 'string' && exam.valor.trim() === ''))) {
                 try {
                     const text = await extractTextFromPDFUrl(exam.file_url);
                     if (text && text.trim().length > 0) {
                         const resultText = text.toUpperCase();
                         let status = exam.status;
                         // re-avaliar o status com base no texto
                         if (resultText.includes('CRITICO') || resultText.includes('MUITO ALTO') || resultText.includes('MUITO BAIXO')) {
                             status = 'critico';
                         } else if (resultText.includes('ALTERADO') || resultText.includes('ALERTA') || resultText.includes('ALTO') || resultText.includes('BAIXO')) {
                             status = 'alerta';
                         } else {
                             status = 'normal';
                         }
                         return { ...exam, valor: text, status };
                     }
                 } catch (e) {
                     console.error("Erro OCR PDF no 3D Tab:", e);
                 }
             }
             return exam;
          }));

          setDados(dadosCompletos);
          if (dadosCompletos.length > 0) setSelecionado(dadosCompletos[0]);
        } else {
          console.error('API retornou erro ou formato inválido:', data);
          setDados([]);
        }
      } catch (error) {
        console.error('Erro ao carregar dados 3D:', error);
        setDados([]);
      } finally {
        setLoading(false);
      }
    };

    if (user.id) carregarDados3D();
  }, [user.id, user.cpf]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Sincronizando Biometria 3D...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <i className="fas fa-microscope text-8xl text-blue-600"></i>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-lg shadow-blue-200">
                Inovação LabLaudo
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Análise de Saúde Inteligente</h2>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-wide">Relatórios detalhados dos seus órgãos e recomendações personalizadas</p>
        </div>
        
        <div className="relative z-10 bg-slate-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
                <i className="fas fa-shield-heart text-xl"></i>
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Geral</p>
                <p className="text-sm font-black text-slate-800 uppercase">
                    {dados.some(d => d.status === 'critico') ? 'Atenção Necessária' : 
                     dados.some(d => d.status === 'alerta') ? 'Observação' : 'Excelente'}
                </p>
            </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ORGAN INFO */}
        <div className="lg:col-span-8 space-y-6">
          <Corpo3D exames={dados} selectedExam={selecionado} />
          
          <div className="bg-blue-600 p-8 rounded-[40px] text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                    <h3 className="text-xl font-black mb-2 uppercase tracking-wide">Como funciona a análise?</h3>
                    <p className="text-sm text-blue-100 font-medium leading-relaxed opacity-90">
                        Nossa IA interpreta os resultados dos seus exames laboratoriais e identifica os órgãos que requerem maior atenção. 
                        Apresentamos orientações de <span className="text-emerald-300 font-bold">Cuidados</span> preventivos e informamos a 
                        <span className="text-amber-300 font-bold"> Situação</span> atual de cada sistema do seu corpo com base nos valores técnicos coletados.
                    </p>
                </div>
                <div className="w-px h-16 bg-white/20 hidden md:block"></div>
                <div className="text-center md:text-left">
                    <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Tecnologia Utilizada</p>
                    <p className="text-sm font-black text-white uppercase tracking-widest">Saúde Preventiva AI</p>
                </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIST & CHAT */}
        <div className="lg:col-span-4 space-y-6">
          <ResumoExames 
            exames={dados} 
            onSelect={setSelecionado} 
            selecionado={selecionado} 
          />
          
          <ChatExame 
            exameSelecionado={selecionado} 
            usuarioId={user.id} 
          />
        </div>

      </div>

    </div>
  );
}
