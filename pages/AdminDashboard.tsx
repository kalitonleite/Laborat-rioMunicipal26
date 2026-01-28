
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, ExamResult, Campaign, UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ProfileTab from '../components/ProfileTab';
import DashboardTabs, { TabItem } from '../components/DashboardTabs';
import { maskCPF } from '../services/masks';
import { supabase } from '../services/supabase';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface AdminDashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'geral' | 'exames' | 'relatorios' | 'campanhas' | 'admins' | 'perfil'>('geral');
  const [searchTerm, setSearchTerm] = useState('');
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [viewingExam, setViewingExam] = useState<ExamResult | null>(null);
  const [examsList, setExamsList] = useState<ExamResult[]>([]);
  const [campaignsList, setCampaignsList] = useState<Campaign[]>([]);
  const [adminsList, setAdminsList] = useState<User[]>([]);

  // Estados para filtros de relatórios
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const [newExam, setNewExam] = useState({
    patientName: '',
    patientCpf: '',
    examName: '',
    date: new Date().toISOString().split('T')[0],
    status: 'READY' as ExamResult['status']
  });

  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    type: 'CAMPANHA' as Campaign['type'],
    date: new Date().toISOString().split('T')[0]
  });

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileBlob, setSelectedFileBlob] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Carregar Exames do Supabase
    const fetchExams = async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching exams:', error);
      } else {
        // Mapear snake_case (banco) para camelCase (frontend)
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
      }
    };
    fetchExams();

    // Carregar Campanhas
    const savedCampaigns = localStorage.getItem('lab_campaigns');
    if (savedCampaigns) {
      setCampaignsList(JSON.parse(savedCampaigns));
    } else {
      const initialCampaigns: Campaign[] = [
        { id: 'c1', title: 'Vacinação contra Gripe', description: 'Início da campanha para idosos e grupos de risco na unidade central.', date: '2026-05-10', type: 'SAUDE', active: true },
        { id: 'c2', title: 'Manutenção Preventiva', description: 'O laboratório passará por manutenção no dia 15/02. Atendimentos reduzidos.', date: '2026-02-15', type: 'AVISO', active: true },
      ];
      setCampaignsList(initialCampaigns);
      localStorage.setItem('lab_campaigns', JSON.stringify(initialCampaigns));
    }

    // Carregar Administradores
    const savedAdmins = localStorage.getItem('lab_admins_list');
    if (savedAdmins) {
      setAdminsList(JSON.parse(savedAdmins));
    } else {
      const initialAdmins: User[] = [
        { id: 'admin-1', name: 'Kaliton Gonçalves Leite', cpf: '000.000.000-00', role: UserRole.ADMIN },
        { id: 'admin-2', name: 'Sistema Central', cpf: '111.111.111-11', role: UserRole.ADMIN },
      ];
      setAdminsList(initialAdmins);
      localStorage.setItem('lab_admins_list', JSON.stringify(initialAdmins));
    }
  }, []);

  // Estado para controle de edição
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleRegisterExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCPF = newExam.patientCpf.replace(/\D/g, '');
    const dateFormatted = newExam.date.includes('-') ? newExam.date.split('-').reverse().join('/') : newExam.date;

    try {
      if (editingId) {
        // UPDATE existing exam
        const updatePayload: any = {
          patient_name: newExam.patientName,
          patient_cpf: cleanCPF,
          exam_name: newExam.examName,
          date: dateFormatted,
          status: newExam.status,
        };
        if (selectedFileBlob) {
          const { data: storageData, error: storageError } = await supabase.storage
            .from('lab-files')
            .upload(`${cleanCPF}/${editingId}_${Date.now()}.pdf`, selectedFileBlob);

          if (storageError) throw storageError;

          const { data: { publicUrl } } = supabase.storage
            .from('lab-files')
            .getPublicUrl(storageData.path);

          updatePayload.file_url = publicUrl;
        }

        const { error } = await supabase
          .from('exams')
          .update(updatePayload)
          .eq('id', editingId);

        if (error) throw error;

        // Atualizar estado local mantendo camelCase
        setExamsList(prev => prev.map(item =>
          item.id === editingId ? {
            ...item,
            patientName: newExam.patientName,
            patientCpf: cleanCPF,
            examName: newExam.examName,
            date: dateFormatted,
            status: newExam.status,
            fileUrl: updatePayload.file_url || item.fileUrl
          } : item
        ));
        alert('Exame atualizado com sucesso!');
      } else {
        // ID: INSERT new exam
        const { data, error } = await supabase
          .from('exams')
          .insert([
            {
              patient_name: newExam.patientName,
              patient_cpf: cleanCPF,  // Save clean CPF for matching
              exam_name: newExam.examName,
              date: dateFormatted,
              status: newExam.status
            }
          ])
          .select();

        if (error) throw error;

        if (data && data[0]) {
          let updatedUrl = undefined;
          if (selectedFileBlob) {
            const { data: storageData, error: storageError } = await supabase.storage
              .from('lab-files')
              .upload(`${cleanCPF}/${data[0].id}_${Date.now()}.pdf`, selectedFileBlob);

            if (storageError) throw storageError;

            const { data: { publicUrl } } = supabase.storage
              .from('lab-files')
              .getPublicUrl(storageData.path);

            updatedUrl = publicUrl;
            await supabase.from('exams').update({ file_url: updatedUrl }).eq('id', data[0].id);
          }

          const newMappedExam = {
            id: data[0].id,
            patientName: data[0].patient_name,
            patientCpf: data[0].patient_cpf,
            examName: data[0].exam_name,
            date: data[0].date,
            status: data[0].status,
            fileUrl: updatedUrl,
            resultData: data[0].result_data,
            aiAnalysis: data[0].ai_analysis
          };
          setExamsList(prev => [newMappedExam, ...prev]);
        }
        alert('Exame registrado com sucesso!');
      }

      setIsRegisterModalOpen(false);
      resetForm();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    }
  };

  const resetForm = () => {
    setNewExam({ patientName: '', patientCpf: '', examName: '', date: new Date().toISOString().split('T')[0], status: 'READY' });
    setSelectedFile(null);
    setEditingId(null);
  };

  const openEditModal = (exam: ExamResult) => {
    // Converter data DD/MM/YYYY para YYYY-MM-DD para o input date
    const [day, month, year] = exam.date.split('/');
    const safeDate = (day && month && year) ? `${year}-${month}-${day}` : new Date().toISOString().split('T')[0];

    setNewExam({
      patientName: exam.patientName,
      patientCpf: maskCPF(exam.patientCpf || ''),
      examName: exam.examName,
      date: safeDate,
      status: exam.status
    });
    setSelectedFile(exam.fileUrl || null);
    setEditingId(exam.id);
    setIsRegisterModalOpen(true);
  };

  const handleRegisterCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    const campaign: Campaign = {
      id: 'CAMP' + Math.floor(Math.random() * 10000),
      ...newCampaign,
      active: true
    };

    const updatedList = [campaign, ...campaignsList];
    setCampaignsList(updatedList);
    localStorage.setItem('lab_campaigns', JSON.stringify(updatedList));
    setIsCampaignModalOpen(false);
    setNewCampaign({ title: '', description: '', type: 'CAMPANHA', date: new Date().toISOString().split('T')[0] });
  };

  const toggleCampaignStatus = (id: string) => {
    const updated = campaignsList.map(c => c.id === id ? { ...c, active: !c.active } : c);
    setCampaignsList(updated);
    localStorage.setItem('lab_campaigns', JSON.stringify(updated));
  };

  const deleteCampaign = (id: string) => {
    if (window.confirm("Deseja excluir esta campanha permanentemente?")) {
      const updated = campaignsList.filter(c => c.id !== id);
      setCampaignsList(updated);
      localStorage.setItem('lab_campaigns', JSON.stringify(updated));
    }
  };

  const deleteAdmin = (id: string) => {
    if (id === user.id) {
      alert("Você não pode excluir seu próprio acesso administrativo.");
      return;
    }
    if (window.confirm("Deseja revogar o acesso deste administrador?")) {
      const updated = adminsList.filter(a => a.id !== id);
      setAdminsList(updated);
      localStorage.setItem('lab_admins_list', JSON.stringify(updated));
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este registro de exame?")) {
      const { error } = await supabase.from('exams').delete().eq('id', id);

      if (error) {
        alert('Erro ao excluir exame: ' + error.message);
      } else {
        setExamsList(prev => prev.filter(e => e.id !== id));
      }
    }
  };

  const handleImportLaudo = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileBlob(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile(reader.result as string);
        alert(`Laudo "${file.name}" preparado para upload.`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadReportPDF = async () => {
    if (!reportRef.current) return;

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#f8fafc'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.setFontSize(18);
    pdf.setTextColor(30, 64, 175);
    pdf.text('Relatório Consolidado de Exames', 10, 15);
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(`Laboratório Municipal de Uarini - Gerado em: ${new Date().toLocaleString()}`, 10, 22);

    pdf.addImage(imgData, 'PNG', 0, 30, pdfWidth, pdfHeight);
    pdf.save(`relatorio_laboratorio_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const filteredExams = useMemo(() => {
    const searchClean = searchTerm.replace(/\D/g, '');
    const filteredExams = examsList.filter(exam => {
      const term = searchTerm.toLowerCase();
      const pName = (exam.patientName || '').toLowerCase();
      const eName = (exam.examName || '').toLowerCase();
      const pCpf = (exam.patientCpf || '').replace(/\D/g, '');
      const sTermClean = searchTerm.replace(/\D/g, '');

      return pName.includes(term) ||
        eName.includes(term) ||
        (sTermClean && pCpf.includes(sTermClean));
    });
    return filteredExams;
  }, [searchTerm, examsList]);

  const filteredAdmins = useMemo(() => {
    return adminsList.filter(a =>
      (a.name || '').toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
      (a.cpf || '').includes(adminSearchTerm)
    );
  }, [adminSearchTerm, adminsList]);

  // Lógica de Relatórios
  const reportStats = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    const monthlyData: Record<string, Record<string, number>> = {};
    const lastPeriodByExam: Record<string, string> = {};

    examsList.forEach(exam => {
      const name = (exam.examName || '').toUpperCase().trim();
      if (!name) return; // Skip invalid records

      typeCounts[name] = (typeCounts[name] || 0) + 1;

      // Agrupamento mensal (Assume formato DD/MM/YYYY)
      const dateStr = exam.date || '';
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const key = `${parts[1]}/${parts[2]}`; // MM/YYYY
        if (!monthlyData[key]) monthlyData[key] = {};
        monthlyData[key][name] = (monthlyData[key][name] || 0) + 1;

        // Mantém track do período mais recente para exibição no gráfico
        lastPeriodByExam[name] = key;
      }
    });

    // Gráfico Top Exames incluindo o período no nome para visualização
    const topExamsChart = Object.entries(typeCounts)
      .map(([name, total]) => ({
        name: `${name} (${lastPeriodByExam[name] || 'N/A'})`,
        total,
        period: lastPeriodByExam[name] || 'Geral'
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const monthlyTable = Object.entries(monthlyData).flatMap(([period, exams]) =>
      Object.entries(exams).map(([exam, count]) => ({
        period,
        exam,
        count
      }))
    ).sort((a, b) => {
      const [mA, yA] = a.period.split('/').map(Number);
      const [mB, yB] = b.period.split('/').map(Number);
      return yB !== yA ? yB - yA : mB - mA;
    });

    return { topExamsChart, monthlyTable };
  }, [examsList]);

  // Filtro dinâmico para a tabela de relatórios
  const filteredMonthlyTable = useMemo(() => {
    return reportStats.monthlyTable.filter(row => {
      const [m, y] = row.period.split('/');
      const monthMatch = filterMonth === 'all' || m === filterMonth;
      const yearMatch = filterYear === 'all' || y === filterYear;
      return monthMatch && yearMatch;
    });
  }, [reportStats.monthlyTable, filterMonth, filterYear]);

  // Extrair anos únicos disponíveis nos exames para o seletor
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    examsList.forEach(e => {
      const parts = e.date.split('/');
      if (parts.length === 3) years.add(parts[2]);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [examsList]);


  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <div className="space-y-6">
      <DashboardTabs
        tabs={[
          { id: 'geral', label: 'Dashboard', icon: 'fa-chart-pie' },
          { id: 'exames', label: 'Registros', icon: 'fa-file-medical' },
          { id: 'relatorios', label: 'Relatórios', icon: 'fa-file-contract' },
          { id: 'campanhas', label: 'Campanhas', icon: 'fa-bullhorn' },
          { id: 'admins', label: 'Admins', icon: 'fa-user-shield' },
          { id: 'perfil', label: 'Perfil', icon: 'fa-circle-user' },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as any)}
      />

      {activeTab === 'geral' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pacientes Totais</p>
              <h3 className="text-3xl font-black text-slate-800">2.543</h3>
              <div className="flex items-center gap-1 text-emerald-500 mt-1">
                <i className="fas fa-arrow-up text-[10px]"></i>
                <span className="text-[10px] font-black">12% este mês</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Exames Concluídos</p>
              <h3 className="text-3xl font-black text-slate-800">{examsList.filter(e => e.status !== 'PENDING').length}</h3>
              <div className="flex items-center gap-1 text-blue-500 mt-1">
                <i className="fas fa-check-circle text-[10px]"></i>
                <span className="text-[10px] font-black">94% taxa de sucesso</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-[#1e3a8a] uppercase tracking-tighter">Volume de Exames Recentes</h2>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportStats.topExamsChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'exames' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-black text-slate-800">Registros de Exames</h2>

            <div className="bg-white p-5 md:p-6 rounded-[28px] shadow-sm border border-gray-100 space-y-4">
              <div className="relative">
                <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
                <input
                  type="text"
                  placeholder="Buscar paciente por nome ou CPF..."
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none text-sm font-bold transition-all placeholder:text-gray-300"
                  value={searchTerm}
                  onChange={e => {
                    const v = e.target.value;
                    if (/^\d/.test(v)) setSearchTerm(maskCPF(v));
                    else setSearchTerm(v);
                  }}
                />
              </div>
              <button
                onClick={() => { resetForm(); setIsRegisterModalOpen(true); }}
                className="w-full bg-[#059669] hover:bg-emerald-700 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <i className="fas fa-plus"></i> NOVO REGISTRO
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-gray-50/50 border-b border-gray-50">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5">Paciente</th>
                    <th className="px-8 py-5">Exame</th>
                    <th className="px-8 py-5">Data</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredExams.length > 0 ? filteredExams.map(exam => (
                    <tr key={exam.id} className="hover:bg-blue-50/10 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs">
                            {(exam.patientName || '?').charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm">{exam.patientName || 'Paciente Desconhecido'}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{maskCPF(exam.patientCpf || '')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-blue-600 font-black text-[11px] uppercase tracking-tight bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                          {exam.examName || 'Exame'}
                          {exam.fileUrl && <i className="fas fa-paperclip text-[10px] text-indigo-500"></i>}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[11px] font-bold text-gray-500">{exam.date || '--/--/----'}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${exam.status === 'READY' || exam.status === 'ANALYZED' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></div>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${exam.status === 'READY' || exam.status === 'ANALYZED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {exam.status === 'READY' || exam.status === 'ANALYZED' ? 'Concluído' : 'Processando'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEditModal(exam)}
                            className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"
                            title="Editar/Anexar Laudo"
                          >
                            <i className="fas fa-pen-to-square text-xs"></i>
                          </button>
                          <button
                            onClick={() => setViewingExam(exam)}
                            className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                            title="Visualizar Detalhes"
                          >
                            <i className="fas fa-eye text-xs"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteExam(exam.id)}
                            className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                            title="Deletar Registro"
                          >
                            <i className="fas fa-trash-can text-xs"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <i className="fas fa-search-minus text-4xl text-gray-100 mb-3"></i>
                        <p className="text-gray-400 text-xs font-bold">Nenhum registro encontrado para sua busca.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'relatorios' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-end">
            <button
              onClick={handleDownloadReportPDF}
              className="bg-[#1e40af] hover:bg-blue-800 text-white font-black px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <i className="fas fa-file-pdf"></i> Baixar Relatório PDF
            </button>
          </div>

          <div ref={reportRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <i className="fas fa-ranking-star text-blue-600"></i>
                Exames Mais Realizados (por Data)
              </h2>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={reportStats.topExamsChart} margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'black' }} width={120} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={20}>
                      {reportStats.topExamsChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-4 text-[9px] text-gray-400 font-bold uppercase text-center italic">Os valores entre parênteses indicam o período mais recente computado.</p>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <h2 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
                <i className="fas fa-calendar-days text-blue-600"></i>
                Totais por Mês e Ano
              </h2>

              {/* Filtros de Mês e Ano */}
              <div className="flex gap-4 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Mês</label>
                  <select
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                  >
                    <option value="all">Todos os Meses</option>
                    {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Ano</label>
                  <select
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                  >
                    <option value="all">Todos os Anos</option>
                    {availableYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[260px] no-scrollbar">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white border-b border-gray-50">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="py-4 px-2">Período</th>
                      <th className="py-4 px-2">Exame</th>
                      <th className="py-4 px-2 text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredMonthlyTable.length > 0 ? filteredMonthlyTable.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-2 text-[11px] font-black text-blue-600">{row.period}</td>
                        <td className="py-4 px-2 text-[11px] font-bold text-slate-600 uppercase">{row.exam}</td>
                        <td className="py-4 px-2 text-center">
                          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black">{row.count}</span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Nenhum dado para este filtro</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'campanhas' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-black text-slate-800">Gestão de Campanhas</h2>
            <button
              onClick={() => setIsCampaignModalOpen(true)}
              className="w-full bg-[#1e40af] hover:bg-blue-800 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-plus"></i> NOVA CAMPANHA / AVISO
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaignsList.map(camp => (
              <div key={camp.id} className={`bg-white rounded-[32px] p-6 border transition-all shadow-sm relative overflow-hidden ${!camp.active ? 'opacity-60 grayscale' : 'border-gray-100'}`}>
                <div className={`absolute top-0 left-0 w-2 h-full ${camp.type === 'AVISO' ? 'bg-amber-400' : camp.type === 'SAUDE' ? 'bg-rose-500' : 'bg-blue-600'}`}></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider ${camp.type === 'AVISO' ? 'bg-amber-100 text-amber-700' : camp.type === 'SAUDE' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                      {camp.type}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">{new Date(camp.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleCampaignStatus(camp.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${camp.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      <i className={`fas ${camp.active ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                    </button>
                    <button onClick={() => deleteCampaign(camp.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                      <i className="fas fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">{camp.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-medium mb-4">{camp.description}</p>

                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <div className={`w-2 h-2 rounded-full ${camp.active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  <span className={camp.active ? 'text-emerald-600' : 'text-gray-400'}>{camp.active ? 'Ativa no Portal' : 'Inativa'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'admins' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-black text-slate-800">Administradores do Sistema</h2>
            <div className="bg-white p-5 md:p-6 rounded-[28px] shadow-sm border border-gray-100">
              <div className="relative">
                <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
                <input
                  type="text"
                  placeholder="Buscar administrador por nome ou CPF..."
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none text-sm font-bold transition-all placeholder:text-gray-300"
                  value={adminSearchTerm}
                  onChange={e => {
                    const v = e.target.value;
                    if (/^\d/.test(v)) setAdminSearchTerm(maskCPF(v));
                    else setAdminSearchTerm(v);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-gray-50/50 border-b border-gray-50">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5">Administrador</th>
                    <th className="px-8 py-5">CPF</th>
                    <th className="px-8 py-5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAdmins.length > 0 ? filteredAdmins.map(admin => (
                    <tr key={admin.id} className="hover:bg-purple-50/10 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-black text-xs">
                            <i className="fas fa-user-tie"></i>
                          </div>
                          <p className="font-black text-slate-800 text-sm">{admin.name} {admin.id === user.id && <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded ml-2">VOCÊ</span>}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-bold text-gray-500 text-sm">{admin.cpf}</td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center gap-2">
                          <button
                            disabled={admin.id === user.id}
                            onClick={() => deleteAdmin(admin.id)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm border ${admin.id === user.id ? 'bg-gray-50 text-gray-200 border-gray-100 cursor-not-allowed' : 'bg-red-50 text-red-500 border-red-100 hover:bg-red-500 hover:text-white'}`}
                            title="Remover Administrador"
                          >
                            <i className="fas fa-user-minus text-xs"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="py-16 text-center text-gray-400 font-bold text-sm">Nenhum administrador encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'perfil' && <ProfileTab user={user} onUpdateUser={onUpdateUser} />}

      {/* MODAL NOVO REGISTRO EXAME */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className={`p-8 text-white relative ${editingId ? 'bg-indigo-600' : 'bg-[#059669]'}`}>
              <h2 className="text-2xl font-black">{editingId ? 'Editar Exame' : 'Novo Registro'}</h2>
              <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Cadastro de Exame Laboratorial</p>
            </div>

            <div className="p-8 space-y-5 relative">
              <button type="button" onClick={() => setIsRegisterModalOpen(false)} className="absolute top-4 right-6 text-gray-300 hover:text-red-500 transition-all z-10">
                <i className="fas fa-times text-xl"></i>
              </button>
              <form onSubmit={handleRegisterExam} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Paciente</label>
                  <div className="relative">
                    <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
                    <input required type="text" className="w-full pl-11 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold transition-all" value={newExam.patientName} onChange={e => setNewExam({ ...newExam, patientName: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CPF</label>
                  <div className="relative">
                    <i className="fas fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
                    <input required type="text" className="w-full pl-11 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold transition-all" value={newExam.patientCpf} onChange={e => setNewExam({ ...newExam, patientCpf: maskCPF(e.target.value) })} placeholder="000.000.000-00" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Exame</label>
                    <input required type="text" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold transition-all" value={newExam.examName} onChange={e => setNewExam({ ...newExam, examName: e.target.value })} placeholder="Ex: Hemograma" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data</label>
                    <input required type="date" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold transition-all" value={newExam.date} onChange={e => setNewExam({ ...newExam, date: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status Inicial</label>
                  <select
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-black text-slate-700 transition-all"
                    value={newExam.status}
                    onChange={e => setNewExam({ ...newExam, status: e.target.value as any })}
                  >
                    <option value="READY">CONCLUÍDO (Pronto para baixar)</option>
                    <option value="PENDING">PROCESSANDO (Aguardando laudo)</option>
                  </select>
                </div>

                <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" />
                <button
                  type="button"
                  onClick={handleImportLaudo}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 border border-slate-200"
                >
                  <i className="fas fa-cloud-arrow-up"></i> Importar Laudo
                </button>

                <button type="submit" className="w-full bg-[#059669] text-white font-black py-5 rounded-[24px] shadow-xl hover:bg-emerald-700 transition-all uppercase tracking-[0.2em] text-xs mt-2">
                  Confirmar Cadastro
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVA CAMPANHA */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#1e40af] p-8 text-white relative">
              <h2 className="text-2xl font-black">Nova Campanha</h2>
              <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Divulgação para o Portal do Paciente</p>
            </div>

            <div className="p-8 space-y-5 relative">
              <button type="button" onClick={() => setIsCampaignModalOpen(false)} className="absolute top-4 right-6 text-gray-300 hover:text-red-500 transition-all z-10">
                <i className="fas fa-times text-xl"></i>
              </button>
              <form onSubmit={handleRegisterCampaign} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título da Campanha</label>
                  <input required type="text" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold transition-all" value={newCampaign.title} onChange={e => setNewCampaign({ ...newCampaign, title: e.target.value })} placeholder="Ex: Campanha Multivacinação" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
                  <textarea required className="w-full p-4 h-32 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all resize-none" value={newCampaign.description} onChange={e => setNewCampaign({ ...newCampaign, description: e.target.value })} placeholder="Detalhes do aviso ou campanha..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo</label>
                    <select className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-black text-slate-700" value={newCampaign.type} onChange={e => setNewCampaign({ ...newCampaign, type: e.target.value as any })}>
                      <option value="AVISO">AVISO</option>
                      <option value="CAMPANHA">CAMPANHA</option>
                      <option value="SAUDE">SAÚDE</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data</label>
                    <input required type="date" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold transition-all" value={newCampaign.date} onChange={e => setNewCampaign({ ...newCampaign, date: e.target.value })} />
                  </div>
                </div>

                <button type="submit" className="w-full bg-[#1e40af] text-white font-black py-5 rounded-[24px] shadow-xl hover:bg-blue-900 transition-all uppercase tracking-[0.2em] text-xs mt-4">
                  Publicar Campanha
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISUALIZAR REGISTRO EXAME */}
      {viewingExam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#1e40af] p-8 text-white relative">
              <h2 className="text-2xl font-black">Detalhes do Registro</h2>
              <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Informações do Exame</p>
            </div>

            <div className="p-8 space-y-6 relative">
              <button onClick={() => setViewingExam(null)} className="absolute top-4 right-6 text-gray-300 hover:text-red-500 transition-all z-10">
                <i className="fas fa-times text-xl"></i>
              </button>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Paciente</p>
                  <p className="text-sm font-black text-slate-800">{viewingExam.patientName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CPF</p>
                  <p className="text-sm font-black text-slate-800">{viewingExam.patientCpf || '---'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Exame</p>
                  <p className="text-sm font-black text-blue-600 uppercase tracking-tight">{viewingExam.examName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data de Registro</p>
                  <p className="text-sm font-black text-slate-800">{viewingExam.date}</p>
                </div>
              </div>

              {viewingExam.fileUrl ? (
                <div className="w-full h-[70vh] rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                  <iframe src={viewingExam.fileUrl} className="w-full h-full" title="Laudo do Exame"></iframe>
                </div>
              ) : (
                <>
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status do Processamento</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${viewingExam.status === 'READY' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{viewingExam.status === 'READY' ? 'Laudo Disponível' : 'Aguardando Processamento'}</span>
                    </div>
                  </div>

                  {viewingExam.resultData && (
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Resumo dos Resultados</p>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed italic">"{viewingExam.resultData}"</p>
                    </div>
                  )}
                </>
              )}

              <button
                onClick={() => setViewingExam(null)}
                className="w-full bg-slate-900 text-white font-black py-5 rounded-[24px] shadow-xl hover:bg-black transition-all uppercase tracking-widest text-xs mt-4"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
