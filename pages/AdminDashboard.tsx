
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, ExamResult, Campaign, UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ProfileTab from '../components/ProfileTab';
import QrDashboardTab from '../components/QrDashboardTab';
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
  const [activeTab, setActiveTab] = useState<'geral' | 'exames' | 'relatorios' | 'campanhas' | 'admins' | 'usuarios' | 'perfil' | 'configuracoes' | 'qr'>('geral');
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
    mediaType: 'NONE' as Campaign['mediaType'],
    externalVideoUrl: ''
  });

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileBlob, setSelectedFileBlob] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Carregar Exames do Banco (Neon)
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

        let growth = 0;
        if (previousTotal > 0) {
          growth = ((total - previousTotal) / previousTotal) * 100;
        } else if (total > 0) {
          growth = 100;
        }

        setPatientStats({ total, growth: Math.round(growth) });
      } catch (err) {
        console.error('Erro ao buscar estatísticas de pacientes:', err);
      }
    };

    const fetchCampaigns = async () => {
      try {
        const data = await dbService.from('campaigns').select({}, { column: 'created_at', ascending: false });
        const mappedCampaigns = (data || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          date: c.date,
          type: c.type,
          active: c.active,
          mediaUrl: c.media_url,
          mediaType: c.media_type
        }));
        setCampaignsList(mappedCampaigns);
      } catch (error) {
        console.error('Erro ao buscar campanhas:', error);
      }
    };

    const fetchUsers = async () => {
      try {
        const data = await dbService.from('profiles').select();
        const profiles = data || [];
        const staff = profiles.filter((p: any) => ['ADMIN', 'MEDICAL', 'RECEPTION', 'RECEPTIONIST', 'PENDING_MEDICAL', 'PENDING_RECEPTION'].includes(p.role));
        const patients = profiles.filter((p: any) => p.role === 'PATIENT');
        
        setAdminsList(staff);
        setPatientsList(patients);
        setPatientStats({ total: patients.length, growth: 0 }); 
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      }
    };

    fetchExams();
    fetchCampaigns();
    fetchUsers();
    fetchPatientStats();
  }, []);

  // Estado para controle de edição
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleRegisterExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCpf = newExam.patientCpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      alert("O CPF deve conter exatamente 11 dígitos.");
      return;
    }
    const dateFormatted = newExam.date.includes('-') ? newExam.date.split('-').reverse().join('/') : newExam.date;

    try {
      if (editingId) {
        // UPDATE existing exam
        const updatePayload: any = {
          patient_name: newExam.patientName,
          patient_cpf: cleanCpf,
          exam_name: newExam.examName,
          date: dateFormatted,
          status: newExam.status,
        };
        if (newExam.resultData) {
          updatePayload.result_data = newExam.resultData;
        }
        if (selectedFile) {
          updatePayload.file_url = selectedFile;
        }

        await dbService.from('exams').update(updatePayload, { id: editingId });
        
        setExamsList(prev => prev.map(item =>
          item.id === editingId ? {
            ...item,
            patientName: newExam.patientName,
            patientCpf: cleanCpf,
            examName: newExam.examName,
            date: dateFormatted,
            status: newExam.status,
            resultData: 'result_data' in updatePayload ? updatePayload.result_data : item.resultData,
            fileUrl: selectedFile || item.fileUrl
          } : item
        ));
        alert('Exame atualizado com sucesso!');
      } else {
        const payload: any = {
          patient_name: newExam.patientName,
          patient_cpf: cleanCpf,
          exam_name: newExam.examName,
          date: dateFormatted,
          status: newExam.status,
          result_data: newExam.resultData
        };
        if (selectedFile) {
          payload.file_url = selectedFile;
        }

        const data = await dbService.from('exams').insert(payload);

        if (data && data[0]) {
          const newMappedExam = {
            id: data[0].id,
            patientName: data[0].patient_name,
            patientCpf: data[0].patient_cpf,
            examName: data[0].exam_name,
            date: data[0].date,
            status: data[0].status,
            fileUrl: data[0].file_url,
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

  const handleRegisterCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let finalMediaUrl = campaignMediaFile;
      let finalMediaType = newCampaign.mediaType;

      if (campaignMediaBlob) {
        // Limite de 15MB para Base64
        if (campaignMediaBlob.size > 15 * 1024 * 1024) {
          alert('O arquivo é muito grande (máximo 15MB). Para vídeos longos, use a opção de link externo.');
          setUploading(false);
          return;
        }
      }

      // Se houver um link externo de vídeo, ele tem prioridade sobre o upload
      if (newCampaign.externalVideoUrl) {
        finalMediaUrl = newCampaign.externalVideoUrl;
        finalMediaType = 'VIDEO';
      }

      const data = await dbService.from('campaigns').insert({
        title: newCampaign.title,
        description: newCampaign.description,
        type: newCampaign.type,
        date: newCampaign.date,
        active: true,
        media_url: finalMediaUrl,
        media_type: finalMediaType
      });

      if (data && data[0]) {
        const newItem: Campaign = {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description,
          date: data[0].date,
          type: data[0].type,
          active: data[0].active,
          mediaUrl: data[0].media_url,
          mediaType: data[0].media_type
        };
        setCampaignsList(prev => [newItem, ...prev]);
      }

      setIsCampaignModalOpen(false);
      setNewCampaign({ title: '', description: '', type: 'CAMPANHA', date: new Date().toISOString().split('T')[0], mediaType: 'NONE', externalVideoUrl: '' });
      setCampaignMediaBlob(null);
      setCampaignMediaFile(null);
      alert('Campanha publicada com sucesso!');
    } catch (err: any) {
      alert('Erro ao publicar campanha: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleCampaignStatus = async (id: string, currentStatus: boolean) => {
    try {
      await dbService.from('campaigns').update({ active: !currentStatus }, { id });
      setCampaignsList(prev => prev.map(c => c.id === id ? { ...c, active: !currentStatus } : c));
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (window.confirm("Deseja excluir esta campanha permanentemente?")) {
      try {
        await dbService.from('campaigns').delete({ id });
        setCampaignsList(prev => prev.filter(c => c.id !== id));
      } catch (err: any) {
        alert('Erro ao excluir: ' + err.message);
      }
    }
  };

  const deleteAdmin = async (id: string) => {
    if (id === user.id) {
      alert("Você não pode excluir seu próprio acesso administrativo.");
      return;
    }
    if (window.confirm("Deseja excluir permanentemente este membro da equipe? Todos os dados dele serão removidos.")) {
      try {
        await dbService.from('profiles').delete({ id });
        setAdminsList(prev => prev.filter(a => a.id !== id));
        alert("Membro excluído com sucesso.");
      } catch (err: any) {
        alert("Erro ao excluir membro: " + err.message);
      }
    }
  };

  const deletePatient = async (id: string) => {
    if (window.confirm("Deseja excluir permanentemente este usuário/paciente? Todos os dados vinculados serão perdidos.")) {
      try {
        await dbService.from('profiles').delete({ id });
        setPatientsList(prev => prev.filter(p => p.id !== id));
        alert("Usuário excluído com sucesso.");
      } catch (err: any) {
        alert("Erro ao excluir usuário: " + err.message);
      }
    }
  };

  const approveAdmin = async (id: string, role: string) => {
    const newRole = role === 'PENDING_MEDICAL' ? UserRole.MEDICAL : UserRole.RECEPTION;
    if (window.confirm("Deseja aprovar e liberar o acesso deste membro?")) {
      try {
        await dbService.from('profiles').update({ role: newRole }, { id });
        setAdminsList(prev => prev.map(a => a.id === id ? { ...a, role: newRole } : a));
        alert("Acesso liberado com sucesso.");
      } catch (err: any) {
        alert("Erro ao liberar acesso: " + err.message);
      }
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este registro de exame?")) {
      try {
        await dbService.from('exams').delete({ id });
        setExamsList(prev => prev.filter(e => e.id !== id));
      } catch (err: any) {
        alert('Erro ao excluir exame: ' + err.message);
      }
    }
  };

  const handleImportLaudo = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileBlob(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile(reader.result as string);
        alert(`Laudo "${file.name}" preparado para upload. Processando leitura do PDF...`);
      };
      reader.readAsDataURL(file);

      if (file.type === 'application/pdf') {
        try {
          const text = await extractTextFromPDF(file);
          if (text) {
            setNewExam(prev => ({ ...prev, resultData: text }));
            console.log("Texto extraído com sucesso do PDF.");
          }
        } catch (err) {
          console.error("Falha ao processar OCR do PDF", err);
        }
      }
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

  const handleExportCSV = () => {
    const rows = filteredMonthlyTable.length > 0 ? filteredMonthlyTable : reportStats.monthlyTable;
    const header = ['Período', 'Exame', 'Quantidade'];
    const lines = rows.map(r => [r.period, r.exam, String(r.count)]);
    const csv = [header, ...lines].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_laboratorio_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const rows = filteredMonthlyTable.length > 0 ? filteredMonthlyTable : reportStats.monthlyTable;
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_laboratorio_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredExams = useMemo(() => {
    if (!searchTerm.trim()) return examsList;
    const term = searchTerm.toLowerCase().trim();
    const termDigits = searchTerm.replace(/\D/g, '');
    
    return examsList.filter(exam => {
      const pName = (exam.patientName || '').toLowerCase();
      const eName = (exam.examName || '').toLowerCase();
      const pCpfRaw = (exam.patientCpf || '').replace(/\D/g, '');
      const pCpfMasked = maskCPF(exam.patientCpf || '').toLowerCase();

      // Check for name or exam name match
      if (pName.includes(term)) return true;
      if (eName.includes(term)) return true;
      
      // Check for exact CPF match (masked or unmasked)
      if (termDigits && pCpfRaw.includes(termDigits)) return true;
      if (pCpfMasked.includes(term)) return true;
      
      return false;
    });
  }, [searchTerm, examsList]);

  const filteredAdmins = useMemo(() => {
    if (!adminSearchTerm.trim()) return adminsList;
    const term = adminSearchTerm.toLowerCase().trim();
    const termDigits = adminSearchTerm.replace(/\D/g, '');

    return adminsList.filter(a => {
      const nameMatch = (a.name || '').toLowerCase().includes(term);
      const rawCpfMatch = termDigits && (a.cpf || '').includes(termDigits);
      const maskedCpfMatch = (maskCPF(a.cpf || '')).toLowerCase().includes(term);
      return nameMatch || rawCpfMatch || maskedCpfMatch;
    });
  }, [adminSearchTerm, adminsList]);

  const filteredPatients = useMemo(() => {
    if (!patientSearchTerm.trim()) return patientsList;
    const term = patientSearchTerm.toLowerCase().trim();
    const termDigits = patientSearchTerm.replace(/\D/g, '');

    return patientsList.filter(p => {
      const nameMatch = (p.name || '').toLowerCase().includes(term);
      const rawCpfMatch = termDigits && (p.cpf || '').includes(termDigits);
      const maskedCpfMatch = (maskCPF(p.cpf || '')).toLowerCase().includes(term);
      return nameMatch || rawCpfMatch || maskedCpfMatch;
    });
  }, [patientSearchTerm, patientsList]);

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
          { id: 'geral', label: 'Início', icon: 'fa-chart-pie' },
          { id: 'exames', label: 'Registros', icon: 'fa-file-medical' },
          { id: 'relatorios', label: 'Relatórios', icon: 'fa-file-contract' },
          { id: 'campanhas', label: 'Campanhas', icon: 'fa-bullhorn' },
          { id: 'admins', label: 'Equipe', icon: 'fa-user-shield' },
          { id: 'usuarios', label: 'Usuários', icon: 'fa-users' },
          { id: 'qr', label: 'Scanner', icon: 'fa-qrcode' },
          { id: 'perfil', label: 'Perfil', icon: 'fa-circle-user' },
          { id: 'configuracoes', label: 'Configurações', icon: 'fa-cog' },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as any)}
      />

      {activeTab === 'geral' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pacientes Totais</p>
              <h3 className="text-3xl font-black text-slate-800">{patientStats.total.toLocaleString('pt-BR')}</h3>
              <div className={`flex items-center gap-1 mt-1 ${patientStats.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                <i className={`fas ${patientStats.growth >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} text-[10px]`}></i>
                <span className="text-[10px] font-black">{Math.abs(patientStats.growth)}% este mês</span>
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
                    // Se o usuário digitou apenas números ou números com caracteres do CPF, aplicamos a máscara
                    // para a visibilidade bonitinha na busca do CPF. Se contém letras, deixamos como está para pesquisar nomes.
                    if (v.length > 0 && /^[0-9.\- ]+$/.test(v)) {
                      setSearchTerm(maskCPF(v));
                    } else {
                      setSearchTerm(v);
                    }
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
                    <button onClick={() => toggleCampaignStatus(camp.id, camp.active)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${camp.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      <i className={`fas ${camp.active ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                    </button>
                    <button onClick={() => deleteCampaign(camp.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                      <i className="fas fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">{camp.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-bold mb-4 line-clamp-2">{camp.description}</p>

                {camp.mediaUrl && (
                  <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center relative">
                    {camp.mediaType === 'IMAGE' && <img src={camp.mediaUrl} className="w-full max-h-48 object-contain" alt="" />}
                    {camp.mediaType === 'VIDEO' && <video src={camp.mediaUrl} className="w-full h-full object-cover" />}
                    {(camp.mediaType === 'AUDIO' || camp.mediaType === 'PDF') && (
                      <div className="flex flex-col items-center gap-2 text-blue-500">
                        <i className={`fas ${camp.mediaType === 'AUDIO' ? 'fa-music' : 'fa-file-pdf'} text-2xl`}></i>
                        <span className="text-[8px] font-black uppercase tracking-widest">{camp.mediaType}</span>
                      </div>
                    )}
                    <a href={camp.mediaUrl} target="_blank" rel="noreferrer" className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                      <i className="fas fa-external-link-alt text-[10px]"></i>
                    </a>
                  </div>
                )}

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
            <h2 className="text-2xl font-black text-slate-800">Membros da Equipe</h2>
            <div className="bg-white p-5 md:p-6 rounded-[28px] shadow-sm border border-gray-100">
              <div className="relative">
                <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
                <input
                  type="text"
                  placeholder="Buscar membro por nome ou CPF..."
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none text-sm font-bold transition-all placeholder:text-gray-300"
                  value={adminSearchTerm}
                  onChange={e => {
                    const v = e.target.value;
                    if (v.length > 0 && /^[0-9.\- ]+$/.test(v)) {
                      setAdminSearchTerm(maskCPF(v));
                    } else {
                      setAdminSearchTerm(v);
                    }
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
                    <th className="px-8 py-5">Membro</th>
                    <th className="px-8 py-5">Cargo</th>
                    <th className="px-8 py-5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAdmins.length > 0 ? filteredAdmins.map(admin => (
                    <tr key={admin.id} className="hover:bg-purple-50/10 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 ${admin.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : admin.role === 'MEDICAL' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'} rounded-xl flex items-center justify-center font-black text-xs`}>
                            <i className={`fas ${admin.role === 'ADMIN' ? 'fa-user-tie' : admin.role === 'MEDICAL' ? 'fa-user-md' : 'fa-user-nurse'}`}></i>
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm">{admin.name} {admin.id === user.id && <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded ml-2">VOCÊ</span>}</p>
                            <p className="text-[10px] text-gray-400 font-bold">{maskCPF(admin.cpf || '')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${admin.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                          admin.role === 'MEDICAL' ? 'bg-blue-100 text-blue-700' :
                            admin.role === 'RECEPTION' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-amber-100 text-amber-700'
                          }`}>
                          {admin.role === 'ADMIN' ? 'Administrador' : admin.role === 'MEDICAL' ? 'Área Médica' : admin.role === 'RECEPTION' ? 'Recepção' : 'Aguardando Aprovação'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center gap-2 text-right">
                          {(admin.role === 'PENDING_MEDICAL' || admin.role === 'PENDING_RECEPTION') && (
                            <button
                              onClick={() => approveAdmin(admin.id, admin.role)}
                              className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-emerald-100"
                              title="Aprovar Acesso"
                            >
                              <i className="fas fa-check text-xs"></i>
                            </button>
                          )}
                          <button
                            disabled={admin.id === user.id}
                            onClick={() => deleteAdmin(admin.id)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm border ${admin.id === user.id ? 'bg-gray-50 text-gray-200 border-gray-100 cursor-not-allowed' : 'bg-red-50 text-red-500 border-red-100 hover:bg-red-500 hover:text-white'}`}
                            title="Deletar Membro"
                          >
                            <i className="fas fa-trash-can text-xs"></i>
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

      {activeTab === 'usuarios' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-black text-slate-800">Usuários Cadastrados</h2>
            <div className="bg-white p-5 md:p-6 rounded-[28px] shadow-sm border border-gray-100">
              <div className="relative">
                <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
                <input
                  type="text"
                  placeholder="Buscar usuário por nome ou CPF..."
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none text-sm font-bold transition-all placeholder:text-gray-300"
                  value={patientSearchTerm}
                  onChange={e => {
                    const v = e.target.value;
                    if (v.length > 0 && /^[0-9.\- ]+$/.test(v)) {
                      setPatientSearchTerm(maskCPF(v));
                    } else {
                      setPatientSearchTerm(v);
                    }
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
                    <th className="px-8 py-5">Nome / CPF</th>
                    <th className="px-8 py-5">Cartão SUS</th>
                    <th className="px-8 py-5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredPatients.length > 0 ? filteredPatients.map(p => (
                    <tr key={p.id} className="hover:bg-blue-50/10 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-xs">
                            <i className="fas fa-user"></i>
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm">{p.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold">{maskCPF(p.cpf || '')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[11px] font-bold text-slate-600">{p.sus_number || 'Não informado'}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center">
                          <button
                            onClick={() => deletePatient(p.id)}
                            className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                            title="Excluir Usuário"
                          >
                            <i className="fas fa-trash-can text-xs"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="py-16 text-center text-gray-400 font-bold text-sm">Nenhum usuário encontrado.</td>
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
          <div className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className={`p-8 text-white relative ${editingId ? 'bg-indigo-600' : 'bg-[#059669]'}`}>
              <h2 className="text-2xl font-black">{editingId ? 'Editar Exame' : 'Novo Registro'}</h2>
              <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Cadastro de Exame Laboratorial</p>
            </div>

            <div className="p-8 space-y-5 relative overflow-y-auto flex-1">
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

                {selectedFile ? (
                  <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <i className="fas fa-file-pdf"></i>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Laudo Anexado</p>
                        <p className="text-xs font-bold text-emerald-600">Arquivo pronto</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedFile(null); setSelectedFileBlob(null); setNewExam(prev => ({ ...prev, resultData: '' })) }}
                      className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest px-3 py-2 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleImportLaudo}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 border border-slate-200"
                  >
                    <i className="fas fa-cloud-arrow-up"></i> Importar Laudo
                  </button>
                )}

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
          <div className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#1e40af] p-8 text-white relative">
              <h2 className="text-2xl font-black">Nova Campanha</h2>
              <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Divulgação para o Portal do Paciente</p>
            </div>

            <div className="p-8 space-y-5 relative overflow-y-auto flex-1">
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
                  <textarea required className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold transition-all min-h-[100px]" value={newCampaign.description} onChange={e => setNewCampaign({ ...newCampaign, description: e.target.value })} placeholder="Ex: Traga seus filhos para vacinar contra a gripe..." />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL de Vídeo Externo (Opcional - YouTube/Vimeo)</label>
                  <input
                    type="text"
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold transition-all"
                    value={newCampaign.externalVideoUrl}
                    onChange={e => setNewCampaign({ ...newCampaign, externalVideoUrl: e.target.value, mediaType: e.target.value ? 'VIDEO' : newCampaign.mediaType })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-[9px] text-blue-500 font-bold ml-1 italic">* Links externos têm prioridade sobre o upload de arquivo.</p>
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

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Anexar Mídia (Opcional)</label>

                  <div
                    onClick={() => campaignFileRef.current?.click()}
                    className={`relative w-full min-h-[140px] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group overflow-hidden ${campaignMediaBlob ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-gray-50/50 hover:border-blue-300 hover:bg-blue-50/30'
                      }`}
                  >
                    {campaignMediaFile ? (
                      <div className="w-full h-full absolute inset-0 bg-gray-100">
                        {newCampaign.mediaType === 'IMAGE' && <img src={campaignMediaFile} className="w-full h-full object-contain" alt="" />}
                        {newCampaign.mediaType === 'VIDEO' && !newCampaign.externalVideoUrl && <video src={campaignMediaFile} className="w-full h-full object-cover" controls />}
                        {newCampaign.mediaType === 'VIDEO' && newCampaign.externalVideoUrl && (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50/50">
                            <i className="fab fa-youtube text-red-500 text-3xl mb-2"></i>
                            <span className="text-[10px] font-black text-blue-600">Link Externo Ativo</span>
                          </div>
                        )}
                        {newCampaign.mediaType === 'AUDIO' && (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50/50">
                            <i className="fas fa-volume-high text-indigo-400 text-3xl mb-2"></i>
                            <span className="text-[10px] font-black text-indigo-600">Áudio Selecionado</span>
                          </div>
                        )}
                        {newCampaign.mediaType === 'PDF' && (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-rose-50/50">
                            <i className="fas fa-file-pdf text-rose-400 text-3xl mb-2"></i>
                            <span className="text-[10px] font-black text-rose-600">PDF Selecionado</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <i className="fas fa-sync-alt text-xl"></i>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all shadow-sm">
                          <i className="fas fa-cloud-arrow-up text-xl"></i>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Clique para carregar</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">PDF, IMAGEM, ÁUDIO OU VÍDEO</p>
                        </div>
                      </>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={campaignFileRef}
                    className="hidden"
                    accept="image/*,video/*,audio/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCampaignMediaBlob(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setCampaignMediaFile(reader.result as string);

                          // Detecção automática do tipo para o preview
                          const mime = file.type;
                          let type: Campaign['mediaType'] = 'NONE';
                          if (mime.startsWith('image/')) type = 'IMAGE';
                          else if (mime === 'application/pdf') type = 'PDF';
                          else if (mime.startsWith('audio/')) type = 'AUDIO';
                          else if (mime.startsWith('video/')) type = 'VIDEO';

                          setNewCampaign(prev => ({ ...prev, mediaType: type }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {campaignMediaBlob && (
                    <div className="flex items-center justify-between px-2">
                      <p className="text-[9px] font-bold text-emerald-600 truncate italic">
                        <i className="fas fa-check-circle mr-1"></i> {campaignMediaBlob.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => { setCampaignMediaBlob(null); setCampaignMediaFile(null); setNewCampaign(p => ({ ...p, mediaType: 'NONE' })) }}
                        className="text-[9px] font-black text-rose-500 uppercase hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-[#1e40af] text-white font-black py-5 rounded-[24px] shadow-xl hover:bg-blue-900 disabled:bg-slate-300 disabled:shadow-none transition-all uppercase tracking-[0.2em] text-xs mt-4 flex items-center justify-center gap-3"
                >
                  {uploading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Publicando...
                    </>
                  ) : 'Publicar Campanha'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISUALIZAR REGISTRO EXAME */}
      {viewingExam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] flex flex-col rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#1e40af] p-8 text-white relative">
              <h2 className="text-2xl font-black">Detalhes do Registro</h2>
              <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Informações do Exame</p>
            </div>

            <div className="p-8 space-y-6 relative overflow-y-auto flex-1">
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
      {activeTab === 'configuracoes' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-black text-slate-800">Privacidade e Customização</h2>
            <p className="text-gray-500 font-medium text-sm">Gerencie a identidade visual e configurações globais do sistema.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <i className="fas fa-image text-xl"></i>
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg">Logotipo do Sistema</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Identidade Visual</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 group relative overflow-hidden h-72">
                  <img
                    src={appLogo || "/assets/logo-uarini.jpg"}
                    alt="Logo Atual"
                    className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
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
                          await updateLogo("");
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
      {activeTab === 'qr' && (
        <QrDashboardTab />
      )}
    </div>
  );
};

export default AdminDashboard;
