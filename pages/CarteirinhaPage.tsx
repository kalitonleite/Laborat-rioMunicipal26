import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/apiService';
import CarteirinhaCard from '../components/CarteirinhaCard';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const CarteirinhaPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paciente, setPaciente] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Resilient CPF matching (try clean and masked to overcome data format drift)
      const rawCpf = user?.cpf || '';
      const cleanCpf = rawCpf.replace(/\D/g, '');
      const maskedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      
      let pacientes = await dbService.from('pacientes').select({ cpf: cleanCpf });
      
      // If not found with clean CPF, try with masked CPF
      if (!pacientes || pacientes.length === 0) {
        pacientes = await dbService.from('pacientes').select({ cpf: maskedCpf });
        
        // Also try original user.cpf as fallback
        if (!pacientes || pacientes.length === 0) {
          pacientes = await dbService.from('pacientes').select({ cpf: rawCpf });
        }
      }
      
      if (pacientes && pacientes.length > 0) {
        setPaciente(pacientes[0]);
      } else {
        setError('Carteirinha não encontrada para este usuário. Entre em contato com a administração para vincular seu prontuário digital.');
      }

      // Fetch config
      const configs = await dbService.from('configuracoes_carteirinha').select({}, { column: 'updated_at', ascending: false });
      if (configs && configs.length > 0) {
        setConfig(configs[0]);
      }
    } catch (err: any) {
      setError('Erro ao carregar sua carteirinha: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadPDF = async () => {
    if (!cardRef.current || !paciente) return;
    
    try {
      setDownloading(true);
      const canvas = await html2canvas(cardRef.current, {
        scale: 4, // High quality
        useCORS: true, 
        backgroundColor: null,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [90, 130] // Adjusted vertical card size
      });
      
      pdf.setProperties({
        title: `Carteirinha - ${paciente.nome}`,
        subject: 'Carteirinha Digital SUS - LabLaudo',
        author: 'LabLaudo System'
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, 90, 130);
      pdf.save(`carteirinha_${paciente.nome.replace(/\s+/g, '_').toLowerCase()}.pdf`);
      
    } catch (err: any) {
      console.error('PDF error:', err);
      alert('Erro ao gerar PDF: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest"><i className="fas fa-spinner fa-spin mr-3"></i>Gerando sua carteirinha...</div>;

  if (error) return (
     <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-6">
           <i className="fas fa-exclamation-triangle text-3xl"></i>
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Ops! Algo deu errado</h2>
        <p className="text-slate-400 font-medium max-w-md">{error}</p>
        <div className="flex gap-4 mt-8">
           <button onClick={() => navigate(-1)} className="bg-slate-100 text-slate-600 px-8 py-3 rounded-2xl font-bold transition-all hover:bg-slate-200">Voltar</button>
           <button onClick={fetchData} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold transition-transform active:scale-95">Tentar Novamente</button>
        </div>
     </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 min-h-screen animate-in fade-in slide-in-from-bottom-8 duration-700">
      <button 
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold text-sm transition-colors group"
      >
        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-slate-100 transition-all">
           <i className="fas fa-arrow-left"></i>
        </div>
        Voltar para o Início
      </button>
      <header className="mb-12 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
         <div>
            <span className="px-4 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100">Documento Oficial Digital</span>
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter mt-4">Minha Carteirinha SUS</h1>
            <p className="text-slate-400 font-medium text-lg max-w-xl mt-2">Acesse sua identificação digital validada para atendimentos e exames.</p>
         </div>
         <div className="flex gap-4">
            <button 
               onClick={() => window.print()}
               className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95"
            >
               <i className="fas fa-print text-xl"></i>
            </button>
            <button 
               onClick={handleDownloadPDF}
               disabled={downloading}
               className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
            >
               <i className={downloading ? "fas fa-spinner fa-spin" : "fas fa-download"}></i>
               <span>{downloading ? "Gerando..." : "Baixar Digital"}</span>
            </button>
         </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
         {/* Card Section */}
         <div className="lg:col-span-6 flex justify-center">
            <div ref={cardRef} className="w-full max-w-[420px] transition-all duration-500">
               <CarteirinhaCard paciente={paciente} config={config || { logo_url: '', cor_primaria: '', cor_secundaria: '', cor_destaque: '', nome_sistema: 'Laboratório Municipal de Uarini', texto_rodape: '' }} />
            </div>
         </div>

         {/* Instructions Section */}
         <div className="lg:col-span-6 space-y-8">
            <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100">
               <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm"><i className="fas fa-info-circle"></i></div>
                  Como utilizar?
               </h3>
               <ul className="space-y-6">
                  <li className="flex gap-4">
                     <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-slate-400 flex-shrink-0">01</div>
                     <div>
                        <h4 className="font-bold text-slate-700">Apresente o QR Code</h4>
                        <p className="text-sm text-slate-500 font-medium mt-1">Ao chegar na recepção, abra sua carteirinha e mostre o QR Code para validação instantânea.</p>
                     </div>
                  </li>
                  <li className="flex gap-4">
                     <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-slate-400 flex-shrink-0">02</div>
                     <div>
                        <h4 className="font-bold text-slate-700">Dados sempre atualizados</h4>
                        <p className="text-sm text-slate-500 font-medium mt-1">Qualquer alteração em seus dados será refletida automaticamente aqui sem necessidade de uma nova via física.</p>
                     </div>
                  </li>
               </ul>
            </div>

            <div className="bg-slate-900 p-8 rounded-[40px] text-white">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg opacity-80">Segurança do Documento</h3>
                  <i className="fas fa-shield-alt text-2xl text-blue-400"></i>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                     <p className="text-[10px] uppercase font-black opacity-40 mb-1">Data de Emissão</p>
                     <p className="font-bold text-sm">{new Date(paciente.data_emissao).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                     <p className="text-[10px] uppercase font-black opacity-40 mb-1">Chave Digital</p>
                     <p className="font-mono text-xs opacity-60 truncate">{paciente.qr_token}</p>
                  </div>
               </div>
               <p className="text-[10px] opacity-40 text-center mt-6">ESTA CARTEIRINHA É DE USO PESSOAL E INTRANSFERÍVEL. O USO INDEVIDO É CRIME PREVISTO EM LEI.</p>
            </div>
         </div>
      </main>
    </div>
  );
};

export default CarteirinhaPage;
