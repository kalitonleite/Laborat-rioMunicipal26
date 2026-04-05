import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { dbService } from '../services/apiService';
import CarteirinhaCard from '../components/CarteirinhaCard';

const ValidacaoQR: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [paciente, setPaciente] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validateToken();
  }, [id, token]);

  const validateToken = async () => {
    try {
      setLoading(true);
      
      // Public validation logic: search by id or token?
      // Usually, if we have a token, we should verify it.
      // Since this is a public page, the API must allow 'select' on 'pacientes' for this specific filter.
      // We already added 'pacientes' to allowedTables.
      
      const filter: any = {};
      if (token) filter.qr_token = token;
      else if (id) filter.id = id;

      const results = await dbService.from('pacientes').select('*', filter);
      
      if (results && results.length > 0) {
        setPaciente(results[0]);
        setIsValid(results[0].status === 'ativo');
      } else {
        setIsValid(false);
      }

      // Fetch config for visual
      const configs = await dbService.from('configuracoes_carteirinha').select('*');
      if (configs && configs.length > 0) setConfig(configs[0]);

    } catch (err) {
      console.error('Validation error:', err);
      setIsValid(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
     <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
           <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
           <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Validando Identidade Digital...</p>
        </div>
     </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
       <div className="w-full max-w-md bg-white rounded-[48px] shadow-2xl overflow-hidden border border-slate-100 p-8 md:p-12 text-center animate-in zoom-in duration-500">
          
          <header className="mb-12">
             <div className="w-20 h-20 bg-slate-50 rounded-3xl mx-auto flex items-center justify-center mb-6">
                 {isValid ? (
                    <i className="fas fa-check-circle text-4xl text-green-500 animate-bounce"></i>
                 ) : (
                    <i className="fas fa-times-circle text-4xl text-red-500"></i>
                 )}
             </div>
             <h1 className={`text-4xl font-black tracking-tighter ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                {isValid ? 'Documento Válido' : 'Documento Inválido'}
             </h1>
             <p className="text-slate-400 font-medium mt-2">
                Consulta de autenticidade realizada em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
             </p>
          </header>

          {isValid && paciente ? (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <div className="flex flex-col items-center">
                   <div className="w-32 h-32 rounded-full border-4 border-green-100 overflow-hidden shadow-lg mb-4">
                      {paciente.foto_url ? (
                        <img src={paciente.foto_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                           <i className="fas fa-user text-4xl"></i>
                        </div>
                      )}
                   </div>
                   <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{paciente.nome}</h2>
                   <p className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mt-2">
                      ID: {paciente.numero_sus}
                   </p>
                </div>

                <div className="grid grid-cols-1 gap-4 text-left">
                   <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                      <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Unidade de Saúde</p>
                      <p className="font-bold text-slate-700">{paciente.unidade_saude || 'Aguardando Atribuição'}</p>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                      <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Status da Credencial</p>
                      <p className={`font-bold ${paciente.status === 'ativo' ? 'text-green-600' : 'text-red-600'}`}>
                         {paciente.status === 'ativo' ? 'ATIVA E VALIDADA' : 'INATIVA OU BLOQUEADA'}
                      </p>
                   </div>
                </div>

                <div className="pt-8 border-t border-dashed">
                   <p className="text-[10px] text-slate-400 font-medium italic">
                      Este sistema valida tokens únicos gerados pelo software LabLaudo para identificação segura do paciente.
                   </p>
                </div>
             </div>
          ) : (
             <div className="py-12">
                <div className="bg-red-50 p-8 rounded-[32px] border border-red-100 text-red-600 font-bold mb-8">
                   A credencial apresentada não foi encontrada em nossos registros ou expirou.
                </div>
                <p className="text-slate-400 text-sm font-medium">Se você é o portador desta carteirinha, procure a unidade de saúde mais próxima para regularizar sua situação.</p>
             </div>
          )}

          <footer className="mt-12 pt-8 border-t">
             <div className="flex items-center justify-center gap-2 opacity-30 grayscale">
                <i className="fas fa-lock text-xs"></i>
                <span className="text-[10px] font-black uppercase tracking-[3px]">LabLaudo Secure Cloud</span>
             </div>
             <button 
               onClick={() => navigate('/')} 
               className="mt-8 text-blue-600 font-bold text-sm hover:underline"
             >
               Ir para página inicial
             </button>
          </footer>
       </div>
    </div>
  );
};

export default ValidacaoQR;
