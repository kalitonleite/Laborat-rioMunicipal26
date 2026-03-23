
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, ExamResult, Campaign, UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ProfileTab from '../components/ProfileTab';
import DashboardTabs, { TabItem } from '../components/DashboardTabs';
import { maskCPF } from '../services/masks';
import { dbService } from '../services/apiService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { extractTextFromPDF } from '../services/pdfOcr';
import { useSettings } from '../contexts/SettingsContext';

interface AdminDashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'geral' | 'exames' | 'relatorios' | 'campanhas' | 'admins' | 'usuarios' | 'perfil' | 'configuracoes'>('geral');
  const { appLogo, updateLogo } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [viewingExam, setViewingExam] = useState<ExamResult | null>(null);
  const [examsList, setExamsList] = useState<ExamResult[]>([]);
  const [campaignsList, setCampaignsList] = useState<Campaign[]>([]);
  const [adminsList, setAdminsList] = useState<User[]>([]);
  const [patientsList, setPatientsList] = useState<User[]>([]);

  // Novos estados para mídia de campanha
  const [campaignMediaFile, setCampaignMediaFile] = useState<string | null>(null);
  const [campaignMediaBlob, setCampaignMediaBlob] = useState<File | null>(null);
  const campaignFileRef = useRef<HTMLInputElement>(null);

  // Estados para filtros de relatórios
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');

  // Estados para estatísticas reais
  const [patientStats, setPatientStats] = useState({ total: 0, growth: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const [newExam, setNewExam] = useState({
    patientName: '',
    patientCpf: '',
    examName: '',
    date: new Date().toISOString().split('T')[0],
    status: 'READY' as ExamResult['status'],
    resultData: ''
  });

  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    type: 'CAMPANHA' as Campaign['type'],
    date: new Date().toISOString().split('T')[0],
    mediaType: 'NONE' as Campaign['mediaType']
  });

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileBlob, setSelectedFileBlob] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Carregar Exames do Supabase
    const fetchExams = async () => {
      try {
        const data = await dbService.from('exams').select({}, { column: 'created_at', ascending: false });
        const mappedExams = (data || []).map((item: any) => ({
          id: item.id,
          patientName: item.patient_name,
          patientCpf: item.patient_cpf,
          examName: item.exam_name,
          date: item.date,
          status: item.status,
          fileUrl: item.file_url,
          resultData: item.result_data,
          aiAnalysis: item.ai_analysis
        }));
        setExamsList(mappedExams);
      } catch (error) {
        console.error('Error fetching exams:', error);
      }
    };

    const fetchPatientStats = async () => {
      try {
        const patients = await dbService.from('profiles').select({ role: 'PATIENT' });
        const total = patients.length;
        
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const previousTotal = patients.filter((p: any) => new Date(p.created_at) < startOfMonth).length;
        const growth = previousTotal === 0 ? 0 : Math.round(((total - previousTotal) / previousTotal) * 100);
        
        setPatientStats({ total, growth });
      } catch (error) {
        console.error('Error fetching patient stats:', error);
      }
    };

    const fetchCampaigns = async () => {
      try {
        const data = await dbService.from('campaigns').select({}, { column: 'date', ascending: false });
        setCampaignsList(data || []);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      }
    };

    const fetchAdmins = async () => {
      try {
        const data = await dbService.from('profiles').select({ role: 'ADMIN' });
        setAdminsList(data || []);
      } catch (error) {
        console.error('Error fetching admins:', error);
      }
    };

    const fetchPatients = async () => {
      try {
        const data = await dbService.from('profiles').select({ role: 'PATIENT' });
        setPatientsList(data || []);
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };

    fetchExams();
    fetchPatientStats();
    fetchCampaigns();
    fetchAdmins();
    fetchPatients();
  }, []);

  // Dados para o Gráfico (Exames por mês)
  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = months.map(m => ({ name: m, exames: 0 }));
    
    examsList.forEach(ex => {
      const d = new Date(ex.date);
      if (!isNaN(d.getTime())) {
        data[d.getMonth()].exames++;
      }
    });

    return data;
  }, [examsList]);

  // Filtrar exames por pesquisa
  const filteredExams = examsList.filter(ex => 
    ex.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.patientCpf.includes(searchTerm) ||
    ex.examName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrar usuários por pesquisa
  const filteredAdmins = adminsList.filter(adm => 
    adm.name.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
    adm.cpf.includes(adminSearchTerm)
  );

  const filteredPatients = patientsList.filter(pt => 
    pt.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    pt.cpf.includes(patientSearchTerm)
  );

  // Filtrar para Relatórios
  const reportData = useMemo(() => {
    return examsList.filter(ex => {
        const d = new Date(ex.date);
        const m = (d.getMonth() + 1).toString();
        const y = d.getFullYear().toString();
        
        const matchMonth = filterMonth === 'all' || m === filterMonth;
        const matchYear = filterYear === 'all' || y === filterYear;
        
        return matchMonth && matchYear;
    });
  }, [examsList, filterMonth, filterYear]);

  const handleRegisterExam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
        // Mock do upload se houver arquivo
        let fileUrl = '';
        if (selectedFile) {
             fileUrl = 'https://example.com/laudo-gerado.pdf';
             alert('Upload de arquivos desativado. O registro foi criado sem o laudo digital.');
        }

        const dataToSave = {
            patient_name: newExam.patientName,
            patient_cpf: newExam.patientCpf,
            exam_name: newExam.examName,
            date: newExam.date,
            status: newExam.status,
            result_data: newExam.resultData,
            file_url: fileUrl
        };

        await dbService.from('exams').insert(dataToSave);
        
        alert('Exame registrado com sucesso!');
        setIsRegisterModalOpen(false);
        setNewExam({
            patientName: '',
            patientCpf: '',
            examName: '',
            date: new Date().toISOString().split('T')[0],
            status: 'READY',
            resultData: ''
        });
        window.location.reload();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    }
  };

  const handleCampaignAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const data = {
            title: newCampaign.title,
            description: newCampaign.description,
            type: newCampaign.type,
            date: newCampaign.date,
            media_type: newCampaign.mediaType,
            media_url: campaignMediaFile || ''
        };

        if (campaignMediaFile) {
            alert('Upload de mídia para campanhas está temporariamente desativado.');
        }

        await dbService.from('campaigns').insert(data);
        alert('Campanha publicada com sucesso!');
        setIsCampaignModalOpen(false);
        window.location.reload();
    } catch (error) {
        console.error(error);
    }
  };

  const deleteExam = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
      try {
        await dbService.from('exams').delete({ id });
        setExamsList(examsList.filter(e => e.id !== id));
      } catch (error) {
        console.error('Error deleting exam:', error);
      }
    }
  };

  const deleteCampaign = async (id: string) => {
    if (window.confirm('Excluir esta campanha?')) {
      try {
        await dbService.from('campaigns').delete({ id });
        setCampaignsList(campaignsList.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting campaign:', error);
      }
    }
  };

  const generateReportPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`relatorio-laboratorio-${filterMonth}-${filterYear}.pdf`);
  };

  const tabs: TabItem[] = [
    { id: 'geral', label: 'Dashboard', icon: 'fa-chart-pie' },
    { id: 'exames', label: 'Registros', icon: 'fa-file-medical' },
    { id: 'relatorios', label: 'Relatórios', icon: 'fa-file-pdf' },
    { id: 'campanhas', label: 'Campanhas', icon: 'fa-bullhorn' },
    { id: 'equipe', label: 'Equipe', icon: 'fa-user-nurse' },
    { id: 'usuarios', label: 'Usuários', icon: 'fa-users' },
    { id: 'perfil', label: 'Perfil', icon: 'fa-user-circle' },
    { id: 'configuracoes', label: 'Configurações', icon: 'fa-cog' },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="container mx-auto px-4">
          <DashboardTabs 
            tabs={tabs as any} 
            activeTab={activeTab} 
            onChange={(id) => setActiveTab(id as any)} 
          />
        </div>
      </div>

      {activeTab === 'geral' && (
        <div className="container mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all hover:-translate-y-1">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pacientes Totais</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{patientStats.total}</h3>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">+{patientStats.growth}% este mês</span>
              </div>
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <i className="fas fa-users text-xl"></i>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all hover:-translate-y-1">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Exames Realizados</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{examsList.length}</h3>
                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full mt-2 inline-block">Histórico total</span>
              </div>
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <i className="fas fa-microscope text-xl"></i>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all hover:-translate-y-1">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Campanhas Ativas</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{campaignsList.length}</h3>
                <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full mt-2 inline-block">Publicações</span>
              </div>
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <i className="fas fa-bullhorn text-xl"></i>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all hover:-translate-y-1">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pendentes</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{examsList.filter(e => e.status === 'PENDING').length}</h3>
                <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full mt-2 inline-block">Aguardando</span>
              </div>
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <i className="fas fa-clock text-xl"></i>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-slate-800">Volume de Atendimentos</h3>
                  <i className="fas fa-ellipsis-h text-gray-300"></i>
               </div>
               <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
                        cursor={{fill: '#f8fafc'}}
                      />
                      <Bar dataKey="exames" radius={[10, 10, 10, 10]} barSize={20}>
                        {chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={index === new Date().getMonth() ? '#1e40af' : '#cbd5e1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-slate-800">Últimos Registros</h3>
                  <button onClick={() => setActiveTab('exames')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Ver Todos</button>
               </div>
               <div className="space-y-4">
                  {examsList.slice(0, 5).map(ex => (
                    <div key={ex.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">
                           {ex.patientName.charAt(0)}
                        </div>
                        <div>
                           <h4 className="text-sm font-black text-slate-700 leading-none mb-1">{ex.patientName}</h4>
                           <p className="text-[10px] font-bold text-gray-400">{ex.examName} • {ex.date}</p>
                        </div>
                      </div>
                      <div className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${ex.status === 'READY' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {ex.status === 'READY' ? 'Pronto' : 'Pendente'}
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'exames' && (
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
             <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Gerenciar Exames</h2>
                <p className="text-sm text-gray-500 font-medium">Controle total sobre os laudos e registros de pacientes.</p>
             </div>
             <button 
                onClick={() => setIsRegisterModalOpen(true)}
                className="bg-[#002147] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
             >
                <i className="fas fa-plus-circle"></i> Novo Registro
             </button>
          </div>

          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                <div className="relative max-w-md">
                   <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
                   <input 
                      type="text" 
                      placeholder="Pesquisar por nome ou CPF..." 
                      className="w-full pl-14 pr-6 py-4 rounded-2xl border-none bg-white shadow-inner text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-white text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                         <th className="px-8 py-6">Paciente</th>
                         <th className="px-8 py-6">Exame</th>
                         <th className="px-8 py-6">Data</th>
                         <th className="px-8 py-6">Status</th>
                         <th className="px-8 py-6 text-right">Ações</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {filteredExams.map(ex => (
                         <tr key={ex.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px]">
                                     {ex.patientName.split(' ').map(n => n[0]).join('').substring(0,2)}
                                  </div>
                                  <div>
                                     <p className="text-sm font-black text-slate-700 leading-none mb-1">{ex.patientName}</p>
                                     <p className="text-[10px] text-gray-400 font-bold">{ex.patientCpf}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <p className="text-sm font-black text-slate-600 uppercase tracking-tight">{ex.examName}</p>
                            </td>
                            <td className="px-8 py-6">
                               <p className="text-sm font-bold text-slate-500">{ex.date}</p>
                            </td>
                            <td className="px-8 py-6">
                               <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${ex.status === 'READY' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                  {ex.status === 'READY' ? 'Pronto' : 'Pendente'}
                               </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => setViewingExam(ex)} className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center">
                                     <i className="fas fa-eye text-xs"></i>
                                  </button>
                                  <button onClick={() => deleteExam(ex.id)} className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center">
                                     <i className="fas fa-trash-alt text-xs"></i>
                                  </button>
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
                {filteredExams.length === 0 && (
                   <div className="py-20 text-center">
                      <i className="fas fa-folder-open text-4xl text-gray-200 mb-4"></i>
                      <p className="text-sm font-bold text-gray-400">Nenhum registro encontrado para sua pesquisa.</p>
                   </div>
                )}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'configuracoes' && (
        <div className="container mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Privacidade e Customização</h2>
              <p className="text-sm text-gray-500 font-medium">Gerencie a identidade visual e configurações globais do sistema.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <i className="fas fa-image text-xl"></i>
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg">Logotipo do Sistema</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Identidade Visual</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex flex-col items-center justify-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 group relative overflow-hidden h-48">
                  <img
                    src={appLogo || "/assets/logo-uarini.jpg"}
                    alt="Logo Atual"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 scale-[1.3]"
                  />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] text-gray-400 font-bold leading-relaxed px-2">
                    <i className="fas fa-info-circle mr-1 text-blue-500"></i>
                    Para melhores resultados, use uma imagem quadrada (PNG ou JPG) com fundo transparente ou branco. Tamanho recomendado: 512x512px.
                  </p>

                  <label className="block">
                    <span className="sr-only">Escolher arquivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            alert('A imagem é muito grande. O limite é 10MB.');
                            return;
                          }

                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const img = new Image();
                            img.onload = async () => {
                              // Redimensionamento Inteligente (Max 800px)
                              const canvas = document.createElement('canvas');
                              let width = img.width;
                              let height = img.height;
                              const maxDim = 800;

                              if (width > height && width > maxDim) {
                                height = (height * maxDim) / width;
                                width = maxDim;
                              } else if (height > maxDim) {
                                width = (width * maxDim) / height;
                                height = maxDim;
                              }

                              canvas.width = width;
                              canvas.height = height;
                              const ctx = canvas.getContext('2d');
                              ctx?.drawImage(img, 0, 0, width, height);

                              // Converter para format comprimido (WebP ou JPEG)
                              const processedBase64 = canvas.toDataURL('image/jpeg', 0.82);

                              if (window.confirm('Deseja atualizar o logotipo do sistema? A imagem será otimizada para melhor desempenho.')) {
                                try {
                                  await updateLogo(processedBase64);
                                  alert('Logotipo atualizado e otimizado com sucesso!');
                                } catch (err) {
                                  alert('Erro ao atualizar logotipo. Verifique sua conexão.');
                                }
                              }
                            };
                            img.src = reader.result as string;
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-xs text-slate-500
                        file:mr-4 file:py-3 file:px-6
                        file:rounded-full file:border-0
                        file:text-[10px] file:font-black file:uppercase file:tracking-widest
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100 cursor-pointer
                      "
                    />
                  </label>
                  
                  <button 
                    onClick={async () => {
                      if (window.confirm('Deseja restaurar o logotipo original do sistema?')) {
                        try {
                          await updateLogo('/assets/logo-uarini.jpg');
                          alert('Logotipo restaurado com sucesso!');
                        } catch (err) {
                          alert('Erro ao restaurar logotipo.');
                        }
                      }
                    }}
                    className="w-full text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest py-2 transition-all"
                  >
                    Restaurar Padrão
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                  <i className="fas fa-paint-brush text-xl"></i>
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg">Cores do Tema</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Personalização Pro</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 font-bold text-center py-12">Esta funcionalidade estará disponível em futuras atualizações.</p>
            </div>
          </div>
        </div>
      )}

      {/* Outras abas permanecem com seus conteúdos anteriores ... */}
      
      {/* MODAL VIEW EXAME */}
      {viewingExam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                     <i className="fas fa-file-medical text-lg"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 leading-none mb-1">Visualizar Registro</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID: {viewingExam.id.substring(0,8)}</p>
                  </div>
               </div>
               <button onClick={() => setViewingExam(null)} className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all">
                  <i className="fas fa-times"></i>
               </button>
            </div>
            <div className="p-8 overflow-y-auto flex-grow">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <div className="bg-blue-50/30 p-6 rounded-3xl border border-blue-100/50">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2">Informações do Paciente</label>
                        <p className="text-xl font-black text-slate-800 mb-1">{viewingExam.patientName}</p>
                        <p className="text-sm font-bold text-slate-500">CPF: {viewingExam.patientCpf}</p>
                     </div>
                     <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Detalhes do Exame</label>
                        <p className="text-lg font-black text-slate-700 mb-1">{viewingExam.examName}</p>
                        <p className="text-sm font-bold text-slate-500">Realizado em: {viewingExam.date}</p>
                     </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100/50">
                        <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-2">Status do Laudo</label>
                        <div className="flex items-center gap-3">
                           <span className={`w-3 h-3 rounded-full ${viewingExam.status === 'READY' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse shadow-sm`}></span>
                           <span className="text-sm font-black text-slate-700 uppercase tracking-widest">{viewingExam.status === 'READY' ? 'Disponível' : 'Em Processamento'}</span>
                        </div>
                    </div>
                    {viewingExam.resultData && (
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Resultado / Observações</label>
                           <div className="text-sm font-bold text-slate-600 bg-gray-50 p-4 rounded-xl whitespace-pre-wrap">{viewingExam.resultData}</div>
                        </div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO EXAME */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Registrar Novo Exame</h3>
                    <button onClick={() => setIsRegisterModalOpen(false)} className="text-gray-400 hover:text-rose-500 transition-colors">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
                <form onSubmit={handleRegisterExam} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Paciente</label>
                        <input 
                            required type="text" placeholder="Nome completo"
                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                            value={newExam.patientName} onChange={(e) => setNewExam({...newExam, patientName: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CPF</label>
                            <input 
                                required type="text" placeholder="000.000.000-00"
                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                                value={newExam.patientCpf} onChange={(e) => setNewExam({...newExam, patientCpf: maskCPF(e.target.value)})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data</label>
                            <input 
                                required type="date"
                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                                value={newExam.date} onChange={(e) => setNewExam({...newExam, date: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Exame</label>
                        <input 
                            required type="text" placeholder="Ex: Hemograma Completo"
                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                            value={newExam.examName} onChange={(e) => setNewExam({...newExam, examName: e.target.value})}
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                        Salvar Registro <i className="fas fa-check-circle"></i>
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
