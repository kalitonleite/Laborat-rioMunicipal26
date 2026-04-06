import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/apiService';
import CarteirinhaCard from '../components/CarteirinhaCard';
import { maskCPF } from '../services/masks';
import { User, UserRole } from '../types';

interface Paciente {
  id: string;
  nome: string;
  cpf: string;
  numero_sus: string;
  data_nascimento: string;
  foto_url: string;
  tipo_sanguineo: string;
  alergias: string;
  contato_emergencia: string;
  unidade_saude: string;
  status: string;
  qr_token: string;
  data_emissao?: string;
}

interface Config {
  id?: string;
  logo_url: string;
  cor_primaria: string;
  cor_secundaria: string;
  cor_destaque: string;
  nome_sistema: string;
  texto_rodape: string;
}

const AdminCarteirinha: React.FC = () => {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [config, setConfig] = useState<Config>({
    logo_url: '',
    cor_primaria: '#0f2a44',
    cor_secundaria: '#0a1f33',
    cor_destaque: '#00ff95',
    nome_sistema: 'LabLaudo - Carteirinha Digital SUS',
    texto_rodape: 'Válido em todo território nacional'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPaciente, setEditingPaciente] = useState<Partial<Paciente> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pacientes' | 'layout'>('pacientes');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch patients
      const pacientesData = await dbService.from('pacientes').select({}, { column: 'nome', ascending: true });
      setPacientes(pacientesData || []);

      // Fetch config
      const configs = await dbService.from('configuracoes_carteirinha').select('*');
      if (configs && configs.length > 0) {
        setConfig(configs[0]);
      }
    } catch (err: any) {
      setError('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setUploading(true);
      if (config.id) {
        await dbService.from('configuracoes_carteirinha').update(config, { id: config.id });
      } else {
        await dbService.from('configuracoes_carteirinha').insert(config);
      }
      alert('Configurações salvas com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar configurações: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSavePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPaciente) return;

    try {
      setUploading(true);
      const data = {
        ...editingPaciente,
        qr_token: editingPaciente.qr_token || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      };

      if (editingPaciente.id) {
        await dbService.from('pacientes').update(data, { id: editingPaciente.id });
      } else {
        await dbService.from('pacientes').insert(data);
      }
      
      setIsModalOpen(false);
      setEditingPaciente(null);
      fetchData();
      alert('Paciente salvo com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar paciente: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePaciente = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este paciente?')) return;
    try {
      await dbService.from('pacientes').delete({ id });
      fetchData();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'foto_url' | 'logo_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (field === 'foto_url') {
          setEditingPaciente(prev => ({ ...prev, [field]: base64String }) as Partial<Paciente>);
        } else {
          setConfig(prev => ({ ...prev, [field]: base64String }));
        }
        setUploading(false);
      };
      
      reader.onerror = () => {
        alert('Erro ao ler a imagem.');
        setUploading(false);
      };
      
      reader.readAsDataURL(file);

    } catch (err: any) {
      alert('Erro no upload: ' + err.message);
      setUploading(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest"><i className="fas fa-spinner fa-spin mr-3"></i>Carregando...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen animate-in fade-in duration-700">
      <button 
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold text-sm transition-colors group"
      >
        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-slate-100 transition-all">
           <i className="fas fa-arrow-left"></i>
        </div>
        Voltar para o Dashboard
      </button>
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestão de Carteirinhas</h1>
          <p className="text-slate-400 font-medium mt-1">Administre pacientes e personalize o layout digital.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setActiveTab('pacientes')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'pacientes' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <i className="fas fa-users mr-2"></i> Pacientes
          </button>
          <button 
            onClick={() => setActiveTab('layout')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'layout' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <i className="fas fa-paint-brush mr-2"></i> Customização
          </button>
        </div>
      </header>

      {activeTab === 'pacientes' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-4">
             <h2 className="text-xl font-bold text-slate-700">{pacientes.length} Pacientes Registrados</h2>
             <button 
               onClick={() => { setEditingPaciente({ status: 'ativo' }); setIsModalOpen(true); }}
               className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 transition-all active:scale-95"
             >
               <i className="fas fa-plus mr-2"></i> Novo Paciente
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pacientes.map(p => (
              <div key={p.id} className="group relative">
                <CarteirinhaCard paciente={p} config={config} />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-[-10px] group-hover:translate-y-0">
                  <button 
                    onClick={() => { setEditingPaciente(p); setIsModalOpen(true); }}
                    className="bg-white/90 backdrop-blur text-blue-600 p-3 rounded-xl shadow-xl hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    onClick={() => handleDeletePaciente(p.id)}
                    className="bg-white/90 backdrop-blur text-red-600 p-3 rounded-xl shadow-xl hover:bg-red-600 hover:text-white transition-all"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
           <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
              <h3 className="text-xl font-bold text-slate-800 border-b pb-4">Aparência da Carteirinha</h3>
              
              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Cor Primária</label>
                    <div className="flex gap-2 items-center">
                       <input 
                         type="color" 
                         value={config.cor_primaria} 
                         onChange={e => setConfig({...config, cor_primaria: e.target.value})}
                         className="w-12 h-12 rounded-xl overflow-hidden border-none cursor-pointer"
                       />
                       <input type="text" value={config.cor_primaria} onChange={e => setConfig({...config, cor_primaria: e.target.value})} className="bg-slate-50 border-none rounded-xl p-2 text-sm font-mono w-full" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Cor Secundária</label>
                    <div className="flex gap-2 items-center">
                       <input 
                         type="color" 
                         value={config.cor_secundaria} 
                         onChange={e => setConfig({...config, cor_secundaria: e.target.value})}
                         className="w-12 h-12 rounded-xl overflow-hidden border-none cursor-pointer"
                       />
                       <input type="text" value={config.cor_secundaria} onChange={e => setConfig({...config, cor_secundaria: e.target.value})} className="bg-slate-50 border-none rounded-xl p-2 text-sm font-mono w-full" />
                    </div>
                 </div>
              </div>

              <div>
                 <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Cor de Destaque</label>
                 <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={config.cor_destaque} 
                      onChange={e => setConfig({...config, cor_destaque: e.target.value})}
                      className="w-12 h-12 rounded-xl overflow-hidden border-none cursor-pointer"
                    />
                    <input type="text" value={config.cor_destaque} onChange={e => setConfig({...config, cor_destaque: e.target.value})} className="bg-slate-50 border-none rounded-xl p-2 text-sm font-mono w-full" />
                 </div>
              </div>

              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nome do Sistema</label>
                    <input 
                      type="text" 
                      value={config.nome_sistema} 
                      onChange={e => setConfig({...config, nome_sistema: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Texto do Rodapé</label>
                    <input 
                      type="text" 
                      value={config.texto_rodape} 
                      onChange={e => setConfig({...config, texto_rodape: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Logo da Unidade</label>
                    <div className="flex items-center gap-4">
                       {config.logo_url && <img src={config.logo_url} className="h-12 w-auto object-contain" />}
                       <input 
                         type="file" 
                         accept="image/*"
                         onChange={e => handleFileUpload(e, 'logo_url')}
                         className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                       />
                    </div>
                 </div>
              </div>

              <button 
                onClick={handleSaveConfig}
                disabled={uploading}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
              >
                {uploading ? 'Salvando...' : 'Salvar Personalização'}
              </button>
           </div>

           <div className="flex flex-col items-center justify-center space-y-8">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-[4px]">Pré-visualização em Tempo Real</h3>
              <CarteirinhaCard 
                paciente={{
                  nome: 'NOME DO PACIENTE EXEMPLO',
                  cpf: '000.000.000-00',
                  numero_sus: '1234 5678 9012 3456',
                  data_nascimento: '1990-01-01',
                  foto_url: '',
                  tipo_sanguineo: 'O+',
                  alergias: 'Nenhuma',
                  contato_emergencia: '(92) 99999-9999',
                  unidade_saude: 'Hospital Municipal de Uarini',
                  status: 'ativo',
                  qr_token: 'PREVIEW_TOKEN'
                }}
                config={config}
              />
              <p className="max-w-[300px] text-center text-xs text-slate-400 font-medium italic">
                * As alterações de cores e textos serão refletidas instantaneamente em todas as carteirinhas digitais emitidas pelo sistema.
              </p>
           </div>
        </div>
      )}

      {/* Modal Paciente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <header className="p-8 border-b flex justify-between items-center bg-slate-50">
                 <h2 className="text-2xl font-black text-slate-800">
                    {editingPaciente?.id ? 'Editar Paciente' : 'Novo Paciente'}
                 </h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"><i className="fas fa-times text-xl"></i></button>
              </header>

              <form onSubmit={handleSavePaciente} className="p-8 overflow-y-auto space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome Completo</label>
                          <input 
                            required
                            type="text" 
                            value={editingPaciente?.nome || ''} 
                            onChange={e => setEditingPaciente({...editingPaciente, nome: e.target.value})}
                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-blue-100"
                          />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">CPF</label>
                          <input 
                            required
                            type="text" 
                            maxLength={14}
                            value={editingPaciente?.cpf || ''} 
                            onChange={e => setEditingPaciente({...editingPaciente, cpf: maskCPF(e.target.value)})}
                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-blue-100 placeholder:opacity-30"
                            placeholder="000.000.000-00"
                          />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Número do SUS</label>
                          <input 
                            required
                            type="text" 
                            value={editingPaciente?.numero_sus || ''} 
                            onChange={e => setEditingPaciente({...editingPaciente, numero_sus: e.target.value})}
                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold"
                          />
                       </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Foto de Perfil</label>
                          <div className="flex items-center gap-4">
                             <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden border-4 border-white shadow-md">
                                {editingPaciente?.foto_url ? <img src={editingPaciente.foto_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><i className="fas fa-user-plus text-slate-300"></i></div>}
                             </div>
                             <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'foto_url')} className="text-[10px]" />
                          </div>
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data de Nascimento</label>
                          <input 
                            required
                            type="date" 
                            value={editingPaciente?.data_nascimento || ''} 
                            onChange={e => setEditingPaciente({...editingPaciente, data_nascimento: e.target.value})}
                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold"
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo Sanguíneo</label>
                            <select 
                              value={editingPaciente?.tipo_sanguineo || ''} 
                              onChange={e => setEditingPaciente({...editingPaciente, tipo_sanguineo: e.target.value})}
                              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold"
                            >
                              <option value="">Selecione</option>
                              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                             <select 
                               value={editingPaciente?.status || 'ativo'} 
                               onChange={e => setEditingPaciente({...editingPaciente, status: e.target.value})}
                               className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold"
                             >
                               <option value="ativo">Ativo</option>
                               <option value="inativo">Inativo</option>
                             </select>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Alergias</label>
                        <textarea 
                          value={editingPaciente?.alergias || ''} 
                          onChange={e => setEditingPaciente({...editingPaciente, alergias: e.target.value})}
                          placeholder="Ex: Penicilina, Corantes..."
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold min-h-[100px]"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contato de Emergência</label>
                        <input 
                          type="text" 
                          value={editingPaciente?.contato_emergencia || ''} 
                          onChange={e => setEditingPaciente({...editingPaciente, contato_emergencia: e.target.value})}
                          placeholder="Nome / Telefone"
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold"
                        />
                    </div>
                 </div>

                 <footer className="pt-8 border-t flex justify-end gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 rounded-2xl text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancelar</button>
                    <button 
                      type="submit" 
                      disabled={uploading}
                      className="px-12 py-4 rounded-2xl bg-blue-600 text-white font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all disabled:opacity-50"
                    >
                       {uploading ? 'Salvando...' : 'Confirmar Registro'}
                    </button>
                 </footer>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminCarteirinha;
