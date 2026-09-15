
import React, { useState, useEffect, useMemo } from 'react';
import { User, ExamResult, Campaign, Appointment } from '../types';
import { analyzeLabResult } from '../services/geminiService';
import ProfileTab from '../components/ProfileTab';
import DashboardTabs from '../components/DashboardTabs';
import { dbService } from '../services/apiService';
import { jsPDF } from 'jspdf';
import { maskCPF, maskSUS, maskAge } from '../services/masks';

interface PatientDashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agendamento' | 'perfil'>('dashboard');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [dailyLimit, setDailyLimit] = useState<number>(20);
  const [specificLimits, setSpecificLimits] = useState<Record<string, number>>({});


  // REAL MODE: Carregar exames do Supabase
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [viewingExam, setViewingExam] = useState<ExamResult | null>(null);

  useEffect(() => {
    const fetchMyExams = async () => {
      const cleanCPF = (user.cpf || '').replace(/\D/g, '');
      try {
        const data = await dbService.from('exams').select({ patient_cpf: cleanCPF }, { column: 'created_at', ascending: false });
        const mappedExams = (data || []).map((e: any) => ({
          id: e.id,
          patientId: e.patient_id || user.id,
          patientName: e.patient_name,
          patientCpf: e.patient_cpf,
          examName: e.exam_name,
          date: e.date,
          status: e.status,
          resultData: e.result_data,
          aiAnalysis: e.ai_analysis,
          fileUrl: e.file_url
        }));
        setExams(mappedExams);
      } catch (error) {
        console.error('Error fetching patient exams:', error);
      }
    };

    if (user.cpf) {
      fetchMyExams();
    }
  }, [user.name, user.cpf, activeTab]);

  const [viewingSimulated, setViewingSimulated] = useState<ExamResult | null>(null);
  const [newApp, setNewApp] = useState({ 
    patientName: user.name, 
    patientCpf: user.cpf || '',
    patientAge: user.age || '',
    patientGender: user.gender || '',
    patientSusNumber: user.sus_number || '',
    date: '', 
    time: '' 
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const data = await dbService.from('campaigns').select({ active: true }, { column: 'created_at', ascending: false });
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
        setCampaigns(mappedCampaigns);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      }
    };
    fetchCampaigns();

    const fetchAppointments = async () => {
      try {
        const data = await dbService.from('appointments').select({}, { column: 'date', ascending: true });
        const mappedAppointments = (data || []).map((a: any) => ({
          id: a.id,
          patientId: a.patient_id,
          patientName: a.patient_name,
          patientCpf: a.patient_cpf,
          patientAge: a.patient_age,
          patientGender: a.patient_gender,
          patientSusNumber: a.patient_sus_number,
          date: a.date,
          time: a.time
        }));
        setAppointments(mappedAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };

    fetchAppointments();

    const loadCalendarSettings = async () => {
      try {
        const data = await dbService.from('lab_settings').select();
        data?.forEach((setting: any) => {
          if (setting.key === 'blocked_dates') setBlockedDates(Array.isArray(setting.value) ? setting.value : []);
          if (setting.key === 'daily_limit') setDailyLimit(Number(setting.value) || 20);
          if (setting.key === 'specific_limits') setSpecificLimits(setting.value && typeof setting.value === 'object' ? setting.value : {});
          localStorage.setItem(`lab_${setting.key}`, JSON.stringify(setting.value));
        });
      } catch (error) {
        console.error('Error fetching lab settings:', error);
      }
    };

    loadCalendarSettings();

    const handleCalendarUpdate = (e: CustomEvent) => {
      if (e.detail?.blockedDates) setBlockedDates(e.detail.blockedDates);
      if (e.detail?.dailyLimit !== undefined) setDailyLimit(e.detail.dailyLimit);
      if (e.detail?.specificLimits) setSpecificLimits(e.detail.specificLimits);
    };

    window.addEventListener('calendarUpdate', handleCalendarUpdate as EventListener);

    return () => {
      window.removeEventListener('calendarUpdate', handleCalendarUpdate as EventListener);
    };
  }, []); // Only once on mount


  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const handleAnalyzeWithAI = async (exam: ExamResult) => {
    if (!exam.resultData) return;
    setAnalyzingId(exam.id);
    const analysis = await analyzeLabResult(exam.resultData);
    setExams(prev => prev.map(e => e.id === exam.id ? { ...e, aiAnalysis: analysis, status: 'ANALYZED' as const } : e));
    setAnalyzingId(null);
  };

  const handleDownloadPDF = (exam: ExamResult) => {
    if (exam.fileUrl) {
      // Se já existe um arquivo PDF (upload), baixa diretamente
      const link = document.createElement('a');
      link.href = exam.fileUrl;
      link.target = '_blank';
      link.download = `Laudo_${exam.examName}_${exam.date.replace(/\//g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Gerar um PDF profissional simulado usando jsPDF
      const doc = new jsPDF();

      // Configurações visuais
      const primaryColor = [30, 64, 175]; // Azul Royal (#1e40af)

      // Cabeçalho
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Laboratório Municipal", 105, 20, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("UNIDADE MUNICIPAL DE ANÁLISES CLÍNICAS", 105, 30, { align: "center" });

      // Dados do Paciente e Exame
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("DADOS DO PACIENTE", 20, 55);
      doc.line(20, 57, 190, 57);

      doc.setFont("helvetica", "normal");
      doc.text(`Paciente: ${exam.patientName}`, 20, 65);
      doc.text(`CPF: ${exam.patientCpf || '---'}`, 20, 72);
      doc.text(`Data do Exame: ${exam.date}`, 140, 65);
      doc.text(`Protocolo: ${exam.id}`, 140, 72);

      // Conteúdo do Laudo
      doc.setFont("helvetica", "bold");
      doc.text("RESULTADOS ANALÍTICOS", 20, 90);
      doc.line(20, 92, 190, 92);

      doc.setFontSize(14);
      doc.text(exam.examName.toUpperCase(), 105, 105, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      if (exam.resultData) {
        // Divide o texto em linhas para caber no PDF
        const splitContent = doc.splitTextToSize(exam.resultData, 170);
        doc.text(splitContent, 20, 115);
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text("Resultados em processamento ou indisponíveis no momento.", 105, 130, { align: "center" });
      }

      // Rodapé e Assinatura
      const pageHeight = doc.internal.pageSize.height;
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.line(60, pageHeight - 40, 150, pageHeight - 40);
      doc.text("Dra. Maria Clara - Responsável Técnica", 105, pageHeight - 35, { align: "center" });
      doc.text("CRBM 1234", 105, pageHeight - 30, { align: "center" });

      doc.setFontSize(8);
      doc.text("Este documento é uma representação digital oficial do laudo laboratorial.", 105, pageHeight - 15, { align: "center" });

      doc.save(`Laudo_${exam.examName}_${exam.date.replace(/\//g, '-')}.pdf`);
    }
  };



  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const currentMonthDate = currentDate;
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  const remainingSlotsInfo = useMemo(() => {
    if (!newApp.date) return null;
    const count = appointments.filter(a => a.date === newApp.date).length;
    const limit = specificLimits[newApp.date] ?? dailyLimit;
    const remaining = Math.max(0, limit - count);
    const isFull = remaining === 0;
    const isBlocked = blockedDates.includes(newApp.date);
    return { remaining, isFull, isBlocked, isUnavailable: isFull || isBlocked };
  }, [newApp.date, appointments, dailyLimit, specificLimits, blockedDates]);

  const occupiedDates = useMemo(() => appointments.map(a => a.date), [appointments]);

  const handleConfirmAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApp.date || !newApp.time || !newApp.patientAge || !newApp.patientGender) return alert("Preencha todos os campos.");

    const cleanCPF = (user.cpf || '').replace(/\D/g, '');
    const hasActiveAppointment = appointments.some(a => (a.patientCpf || '').replace(/\D/g, '') === cleanCPF);
    if (hasActiveAppointment) {
      alert("Você já possui um agendamento ativo. Por favor, conclua seu atendimento atual antes de realizar um novo agendamento.");
      return;
    }

    if (blockedDates.includes(newApp.date)) {
      alert("Desculpe, esta data está bloqueada para novos agendamentos. Por favor, escolha outra data.");
      return;
    }

    const countForDate = appointments.filter(a => a.date === newApp.date).length;
    const currentLimit = specificLimits[newApp.date] ?? dailyLimit;

    if (countForDate >= currentLimit) {
      alert(`Desculpe, o limite de agendamentos para o dia ${newApp.date} foi atingido (${currentLimit}). Por favor, escolha outra data.`);
      return;
    }

    try {
      const data = await dbService.from('appointments').insert({
        patient_id: user.id,
        patient_name: newApp.patientName,
        patient_cpf: newApp.patientCpf,
        patient_age: newApp.patientAge,
        patient_gender: newApp.patientGender,
        patient_sus_number: newApp.patientSusNumber,
        date: newApp.date,
        time: newApp.time
      });

      const newAppointment = {
        id: data[0].id,
        patientId: data[0].patient_id,
        patientName: data[0].patient_name,
        patientCpf: data[0].patient_cpf,
        patientAge: data[0].patient_age,
        patientGender: data[0].patient_gender,
        patientSusNumber: data[0].patient_sus_number,
        date: data[0].date,
        time: data[0].time
      };
      setAppointments(prev => [...prev, newAppointment]);
      alert("Agendado com sucesso!");
      setActiveTab('dashboard');
    } catch (error: any) {
      alert('Erro ao agendar: ' + error.message);
    }
  };

  const handleDeleteAppointment = async (id: string | number) => {
    if (!window.confirm("Deseja realmente cancelar este agendamento?")) return;
    try {
      await dbService.from('appointments').delete({ id });
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (error: any) {
      alert("Erro ao cancelar agendamento: " + error.message);
    }
  };

  const monthYearLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div className="space-y-6">
      <DashboardTabs
        tabs={[
          { id: 'dashboard', label: 'INÍCIO', icon: 'fa-house-medical' },
          { id: 'agendamento', label: 'AGENDAMENTO', icon: 'fa-calendar-plus' },
          { id: 'perfil', label: 'PERFIL', icon: 'fa-circle-user' },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as any)}
      />

      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* BANNER CARTEIRINHA DIGITAL */}
          <div
            className="w-full md:w-[calc(50%-8px)] bg-gradient-to-r from-[#0f2a44] to-[#0a1f33] px-5 py-3 rounded-[24px] shadow-xl border border-white/5 relative overflow-hidden cursor-pointer group hover:scale-[1.01] transition-all"
            onClick={() => window.location.hash = '#/carteirinha'}
          >
            <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-[#00ff95]/10 rounded-full blur-3xl group-hover:bg-[#00ff95]/20 transition-all"></div>
            <div className="relative z-10 flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-lg text-[#00ff95] border border-white/10 backdrop-blur-md shadow-lg group-hover:rotate-12 transition-transform flex-shrink-0">
                  <i className="fas fa-id-card"></i>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-2 py-0.5 bg-[#00ff95]/20 text-[#00ff95] text-[9px] font-black uppercase tracking-widest rounded-md border border-[#00ff95]/30">Documento Ativo</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ff95] animate-pulse"></span>
                  </div>
                  <h2 className="text-base font-black text-white tracking-tight leading-tight">Minha Carteirinha Digital</h2>
                  <p className="text-white/40 font-medium text-[10px] uppercase tracking-wider">Acesse seu QR Code para atendimento rápido</p>
                </div>
              </div>
              <div className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center text-white/40 border border-white/10 hover:bg-white hover:text-black transition-all flex-shrink-0">
                <i className="fas fa-arrow-right text-xs"></i>
              </div>
            </div>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((camp, idx) => {
              const [y, m, d] = (camp.date || '').split('-');
              const formattedDate = d ? `${d}/${m}/${y}` : camp.date;

              return (
                <div key={camp.id} className={`p-6 rounded-[32px] shadow-sm relative overflow-hidden flex flex-col transition-all hover:shadow-md ${idx % 2 === 0 ? 'bg-blue-600 text-white' : 'bg-rose-500 text-white'}`}>
                  <div className="relative z-10 mb-4 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{formattedDate}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-white/20 text-[8px] font-black uppercase tracking-wider">{camp.type}</span>
                    </div>
                    <h3 className="text-lg font-black mb-2 leading-tight">{camp.title}</h3>
                    <p className="text-xs opacity-90 leading-relaxed italic line-clamp-2">"{camp.description}"</p>
                  </div>

                  {/* MEDIA CONTENT */}
                  {camp.mediaUrl && (
                    <div className="relative z-10 w-full rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 group">
                      {camp.mediaType === 'IMAGE' && (
                        <img src={camp.mediaUrl} alt={camp.title} className="w-full h-auto max-h-[400px] object-contain transition-transform duration-500 group-hover:scale-105" />
                      )}
                      {camp.mediaType === 'PDF' && (
                        <a href={camp.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white/20 hover:bg-white/30 transition-all">
                          <div className="flex items-center gap-3">
                            <i className="fas fa-file-pdf text-xl"></i>
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Ver Documento</span>
                          </div>
                          <i className="fas fa-external-link-alt text-[10px]"></i>
                        </a>
                      )}
                      {camp.mediaType === 'AUDIO' && (
                        <div className="p-3 bg-white/10">
                          <audio controls className="w-full h-8 scale-90 origin-left invert brightness-200">
                            <source src={camp.mediaUrl} />
                          </audio>
                        </div>
                      )}
                      {camp.mediaType === 'VIDEO' && (
                        <div className="w-full aspect-video">
                          {camp.mediaUrl.includes('youtube.com') || camp.mediaUrl.includes('youtu.be') || camp.mediaUrl.includes('vimeo.com') ? (
                            <iframe
                              className="w-full h-full rounded-2xl"
                              src={(() => {
                                let url = camp.mediaUrl;
                                if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
                                if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'www.youtube.com/embed/');
                                if (url.includes('vimeo.com/')) return url.replace('vimeo.com/', 'player.vimeo.com/video/');
                                return url;
                              })()}
                              title={camp.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          ) : (
                            <video controls className="w-full h-full rounded-2xl object-cover">
                              <source src={camp.mediaUrl} />
                            </video>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="absolute top-0 right-0 p-4 opacity-10 scale-[2] pointer-events-none">
                    <i className={`fas ${idx % 2 === 0 ? 'fa-droplet' : 'fa-star-of-life'}`}></i>
                  </div>
                </div>
              );
            })}


          </section>

          {/* SECTION: ORIENTAÇÕES AO PACIENTE */}
          <section className="bg-white p-5 md:p-8 rounded-[32px] shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-800">Orientações e Preparo</h2>
              <i className="fas fa-clipboard-list text-blue-500"></i>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <i className="fas fa-clock"></i>
                  </div>
                  <h3 className="font-black text-slate-700 text-sm uppercase">Jejum Obrigatório</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  <span className="font-bold">Glicose e Colesterol:</span> Jejum de 8 a 12 horas. Água é permitida.
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-wide">Evite: Álcool e fumo na véspera</p>
              </div>

              <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <i className="fas fa-vial"></i>
                  </div>
                  <h3 className="font-black text-slate-700 text-sm uppercase">Coleta de Urina</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  Realizar higiene local. Desprezar o primeiro jato e coletar o jato médio.
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-wide">Preferência: Primeira urina da manhã</p>
              </div>
            </div>
          </section>

          {/* NOVA SEÇÃO: MEUS AGENDAMENTOS */}
          <section className="bg-white p-5 md:p-8 rounded-[32px] shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-800">Meus Agendamentos</h2>
              <i className="fas fa-clock text-blue-500"></i>
            </div>

            <div className="space-y-3">
              {(() => {
                const cleanCPF = (user.cpf || '').replace(/\D/g, '');
                const myAppointments = appointments.filter(a => (a.patientCpf || '').replace(/\D/g, '') === cleanCPF);

                return myAppointments.length > 0 ? (
                  myAppointments.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 border border-blue-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <i className="fas fa-calendar-check text-blue-600"></i>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest text-ellipsis overflow-hidden">COLETA LABORATORIAL</p>
                          <h4 className="font-black text-slate-800 text-sm">Coleta agendada</h4>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-800">{app.date}</p>
                          <p className="text-[10px] font-bold text-blue-600">{app.time}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteAppointment(app.id)}
                          className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                          title="Cancelar Agendamento"
                        >
                          <i className="fas fa-trash-can text-sm"></i>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 font-medium italic py-4 text-center">Nenhum agendamento futuro encontrado.</p>
                );
              })()}
            </div>
          </section>

          <section className="bg-white p-5 md:p-8 rounded-[32px] shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6 px-1">
              <div className="flex items-center gap-3">
                <i className="fas fa-file-medical text-slate-700 text-lg"></i>
                <h2 className="text-xl font-black text-slate-800">Meus Exames Recentes</h2>
              </div>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-wide">
                TOTAL: {exams.length}
              </span>
            </div>

            <div className="space-y-4">
              {exams.map((exam) => {
                const isReady = exam.status === 'READY' || exam.status === 'ANALYZED';
                // Define colors based on status
                const iconBg = isReady ? 'bg-emerald-50' : 'bg-amber-50';
                const iconColor = isReady ? 'text-emerald-500' : 'text-amber-500';
                const statusBg = isReady ? 'bg-emerald-50' : 'bg-amber-50';
                const statusText = isReady ? 'text-emerald-500' : 'text-amber-600';
                const statusBorder = isReady ? 'border-emerald-100' : 'border-amber-100';
                const statusLabel = isReady ? 'PRONTO' : 'EM ANÁLISE';

                return (
                  <div key={exam.id} className="group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-[24px] border border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all gap-4">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform`}>
                        <i className="fas fa-microscope"></i>
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-base mb-1">{exam.examName}</h3>
                        <p className="text-xs font-bold text-gray-400">Coletado em {exam.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 mt-2 md:mt-0 pl-14 md:pl-0">
                      {/* Status Badge */}
                      <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg tracking-wide border ${statusBg} ${statusText} ${statusBorder}`}>
                        {statusLabel}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        {isReady ? (
                          <>
                            <button
                              onClick={() => exam.fileUrl ? setViewingExam(exam) : setViewingSimulated(exam)}
                              className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              title="Visualizar Detalhes"
                            >
                              <i className="fas fa-eye text-sm"></i>
                            </button>
                            <button
                              onClick={() => handleDownloadPDF(exam)}
                              className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                              title="Baixar Laudo PDF"
                            >
                              <i className="fas fa-download text-sm"></i>
                            </button>
                          </>
                        ) : (
                          <div className="w-9 h-9 flex items-center justify-center text-gray-300" title="Aguardando liberação">
                            <i className="far fa-clock text-lg opacity-50"></i>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )
      }

      {
        activeTab === 'agendamento' && (
          <div className="max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
              <div className="bg-emerald-600 p-6 md:p-8 text-white">
                <h2 className="text-2xl md:text-3xl font-black leading-tight">Novo Agendamento</h2>
                <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Preencha os dados da coleta</p>
              </div>

              <form onSubmit={handleConfirmAppointment} className="p-6 md:p-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">PACIENTE</label>
                    <input disabled type="text" className="w-full p-4 rounded-2xl bg-gray-100 border border-gray-100 text-sm font-black text-gray-400 opacity-60 cursor-not-allowed uppercase" value={user.name} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">IDADE</label>
                    <input
                      required type="text"
                      placeholder="Ex: 25"
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold disabled:opacity-50"
                      value={newApp.patientAge}
                      onChange={e => setNewApp({ ...newApp, patientAge: maskAge(e.target.value) })}
                      disabled={appointments.some(a => (a.patientCpf || '').replace(/\D/g, '') === (user.cpf || '').replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CARTÃO SUS</label>
                    <input
                      required type="text"
                      placeholder="000 0000 0000 0000"
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold disabled:opacity-50"
                      value={newApp.patientSusNumber}
                      onChange={e => setNewApp({ ...newApp, patientSusNumber: maskSUS(e.target.value) })}
                      disabled={appointments.some(a => (a.patientCpf || '').replace(/\D/g, '') === (user.cpf || '').replace(/\D/g, ''))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CPF</label>
                    <input
                      required type="text"
                      placeholder="888.888.888-88"
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold disabled:opacity-50 uppercase"
                      value={newApp.patientCpf}
                      onChange={e => setNewApp({ ...newApp, patientCpf: maskCPF(e.target.value) })}
                      disabled={appointments.some(a => (a.patientCpf || '').replace(/\D/g, '') === (user.cpf || '').replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SEXO</label>
                  <select
                    required
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold disabled:opacity-50"
                    value={newApp.patientGender}
                    onChange={e => setNewApp({ ...newApp, patientGender: e.target.value })}
                    disabled={appointments.some(a => (a.patientCpf || '').replace(/\D/g, '') === (user.cpf || '').replace(/\D/g, ''))}
                  >
                    <option value="">Selecione...</option>
                    <option value="MASCULINO">MASCULINO</option>
                    <option value="FEMININO">FEMININO</option>
                    <option value="OUTRO">OUTRO</option>
                  </select>
                </div>

                <div className="flex justify-start gap-4 px-1 mb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase">LIVRE</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase">BLOQUEADO</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase">LOTADO</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[8px] font-bold text-emerald-600 uppercase">Sincronizado</span>
                  </div>
                </div>

                {/* INDICADOR DE AGENDAMENTO EXISTENTE */}
                {appointments.some(a => (a.patientCpf || '').replace(/\D/g, '') === (user.cpf || '').replace(/\D/g, '')) && (
                  <div className="mb-4 p-5 rounded-3xl bg-amber-50 border border-amber-100 flex flex-col gap-3 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 text-xl shadow-inner">
                        <i className="fas fa-circle-exclamation"></i>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-amber-800 uppercase tracking-tight">Agendamento Ativo Detectado</h4>
                        <p className="text-[10px] font-bold text-amber-600/80 leading-tight">Você só pode ter um agendamento por vez em nosso sistema.</p>
                      </div>
                    </div>
                    <div className="bg-white/50 p-3 rounded-xl border border-amber-100/50">
                      {appointments.filter(a => (a.patientCpf || '').replace(/\D/g, '') === (user.cpf || '').replace(/\D/g, '')).map(a => (
                        <div key={a.id} className="flex justify-between items-center text-[10px] font-black text-slate-500">
                          <span className="uppercase">COLETA LABORATORIAL</span>
                          <span className="bg-amber-100 px-2 py-0.5 rounded-md text-amber-700">{a.date} às {a.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* INDICADOR DE VAGAS RESTANTES */}
                {newApp.date && !appointments.some(a => (a.patientCpf || '').replace(/\D/g, '') === (user.cpf || '').replace(/\D/g, '')) && (
                  <div className={`mb-4 p-4 rounded-2xl border flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300 ${remainingSlotsInfo?.isBlocked
                    ? 'bg-red-50 border-red-100 text-red-600'
                    : remainingSlotsInfo?.isFull
                      ? 'bg-orange-50 border-orange-100 text-orange-600'
                      : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {remainingSlotsInfo?.isBlocked ? '🚫' : remainingSlotsInfo?.isFull ? '🤪' : '😊'}
                      </div>
                      <div>
                        {remainingSlotsInfo?.isBlocked ? (
                          <>
                            <p className="text-[10px] font-black uppercase tracking-tight">Data Indisponível</p>
                            <p className="text-[9px] font-bold opacity-80 uppercase">Escolha outro dia no calendário</p>
                          </>
                        ) : remainingSlotsInfo?.isFull ? (
                          <>
                            <p className="text-[10px] font-black uppercase tracking-tight">Eita! Está Lotado</p>
                            <p className="text-[9px] font-bold opacity-80 uppercase">Não restam mais vagas para hoje</p>
                          </>
                        ) : (
                          <>
                            <p className="text-[10px] font-black uppercase tracking-tight">Ainda temos vagas!</p>
                            <p className="text-[9px] font-bold opacity-80 uppercase">Restam {remainingSlotsInfo?.remaining} pacientes para completar o dia</p>
                          </>
                        )}
                      </div>
                    </div>
                    {!remainingSlotsInfo?.isUnavailable && (
                      <div className="text-right">
                        <span className="text-[8px] font-black opacity-50 uppercase tracking-widest block">DATA</span>
                        <span className="text-xs font-black tracking-tight">{newApp.date}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Calendário com Cabeçalho de Mês/Ano e Dias da Semana */}
                <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-blue-600 transition-all"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>

                    <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">{monthYearLabel}</span>

                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-blue-600 transition-all"
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-2 text-center mb-2">
                    {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(day => (
                      <div key={day} className="text-center text-[10px] font-black text-slate-400">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {/* Empty cells for start of month */}
                    {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square"></div>
                    ))}

                    {daysInMonth.map((date, idx) => {
                      const ds = date.toLocaleDateString('pt-BR');
                      const isS = newApp.date === ds;
                      const isB = blockedDates.includes(ds);

                      const countForDay = appointments.filter(a => a.date === ds).length;
                      const currentLimit = specificLimits[ds] ?? dailyLimit;
                      const isFull = countForDay >= currentLimit;

                      const isUnavailable = isB || isFull;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => !isUnavailable && setNewApp({ ...newApp, date: ds })}
                          className={`aspect-square w-full rounded-xl text-[10px] font-black flex flex-col items-center justify-center transition-all border-2 relative ${isB
                            ? 'bg-red-100 text-red-600 border-red-200 cursor-not-allowed opacity-70'
                            : isFull
                              ? 'bg-orange-50 text-orange-600 border-orange-100 cursor-not-allowed opacity-70'
                              : isS
                                ? 'bg-blue-600 text-white shadow-lg border-blue-600'
                                : 'bg-white text-blue-600 border-transparent hover:border-blue-200 hover:bg-blue-50'
                            }`}
                        >
                          <span className="relative z-10 text-[8px] font-black opacity-80 mb-0.5 leading-none">{currentLimit - countForDay} Vagas</span>
                          <span className="relative z-10 text-xs">{date.getDate()}</span>
                          {isB && <span className="text-[6px] mt-0.5 font-bold uppercase tracking-tighter">BLOQ</span>}
                          {isFull && !isB && <span className="text-[6px] mt-0.5 font-bold uppercase tracking-tighter">LOTADO</span>}
                          {isS && !isUnavailable && <div className="w-1 h-1 rounded-full bg-white absolute top-1 right-1"></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">HORÁRIO</label>
                  <input
                    required type="time"
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold disabled:opacity-50"
                    value={newApp.time}
                    onChange={e => setNewApp({ ...newApp, time: e.target.value })}
                    disabled={appointments.some(a => (a.patientCpf || '').replace(/\D/g, '') === (user.cpf || '').replace(/\D/g, ''))}
                  />
                </div>

                <button
                  type="submit"
                  disabled={appointments.some(a => a.patientId === user.id)}
                  className="w-full bg-emerald-600 text-white font-black py-5 rounded-[24px] shadow-xl uppercase tracking-widest text-xs disabled:bg-gray-300 disabled:shadow-none transition-all"
                >
                  {appointments.some(a => a.patientId === user.id) ? 'Agendamento Restrito' : 'Confirmar Agendamento'}
                </button>
              </form>
            </div>
          </div>
        )
      }

      {/* END AGENDAMENTO TAB */}

      {
        activeTab === 'perfil' && (
          <ProfileTab user={user} onUpdateUser={onUpdateUser} />
        )
      }

      {/* MODAL LAUDO SIMULADO (TEXTO) */}
      {
        viewingSimulated && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-3xl max-h-[90vh] flex flex-col rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-[#1e40af] p-8 text-white relative">
                <h2 className="text-2xl font-black italic">Laboratório Municipal</h2>
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Laudo Digital de Análises Clínicas</p>
              </div>

              <div className="p-8 space-y-8 bg-slate-50 overflow-y-auto relative flex-1">
                <button onClick={() => setViewingSimulated(null)} className="absolute top-4 right-6 text-gray-400 hover:text-red-500 transition-all z-50">
                  <i className="fas fa-times text-xl"></i>
                </button>
                {/* CABEÇALHO DO LAUDO REALISTA */}
                <div className="flex flex-col md:flex-row justify-between gap-6 border-b-2 border-dashed border-gray-200 pb-8">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">DADOS DO PACIENTE</h3>
                      <p className="text-lg font-black text-slate-800 uppercase">{viewingSimulated.patientName}</p>
                      <p className="text-sm font-bold text-slate-500">CPF: {viewingSimulated.patientCpf || '---'}</p>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">CÓDIGO DO EXAME</h3>
                      <p className="text-sm font-black text-blue-600">{viewingSimulated.id}</p>
                    </div>
                  </div>
                  <div className="md:text-right space-y-4">
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">DATA DE REALIZAÇÃO</h3>
                      <p className="text-sm font-black text-slate-800">{viewingSimulated.date}</p>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">MÉDICO SOLICITANTE</h3>
                      <p className="text-sm font-black text-slate-800">UNIDADE MUNICIPAL DE SAÚDE</p>
                    </div>
                  </div>
                </div>

                {/* CONTEÚDO DO EXAME */}
                <div className="bg-white p-10 rounded-[32px] border border-gray-100 shadow-sm min-h-[400px]">
                  <div className="text-center mb-10">
                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{viewingSimulated.examName}</h4>
                    <div className="w-16 h-1.5 bg-blue-600 mx-auto mt-2 rounded-full"></div>
                  </div>

                  <div className="space-y-6">
                    {viewingSimulated.resultData ? (
                      <div className="whitespace-pre-wrap font-mono text-sm text-slate-700 leading-relaxed bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        {viewingSimulated.resultData}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                          <span className="text-[11px] font-black text-slate-400 uppercase">Parâmetro Analisado</span>
                          <span className="text-[11px] font-black text-slate-400 uppercase">Resultado Encontrado</span>
                          <span className="text-[11px] font-black text-slate-400 uppercase">Valor de Referência</span>
                        </div>

                        {/* Simulação genérica de linhas de laudo */}
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex justify-between items-center py-2">
                            <span className="text-sm font-bold text-slate-700 uppercase">Indicador {i}</span>
                            <span className="text-sm font-black text-blue-600">---</span>
                            <span className="text-xs font-medium text-slate-400">---</span>
                          </div>
                        ))}

                        <div className="mt-12 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4">
                          <i className="fas fa-circle-info text-amber-500 text-xl"></i>
                          <p className="text-[11px] text-amber-700 font-bold uppercase leading-relaxed">
                            Este é um laudo prévio gerado pelo sistema. O resultado oficial e as notas médicas ainda não foram inseridos para este registro.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RODAPÉ DO LAUDO */}
                <div className="pt-8 flex flex-col items-center gap-4 text-center">
                  <div className="w-48 h-px bg-gray-200"></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável Técnico: Dra. Maria Clara (CRBM 1234)</p>
                </div>
              </div>

              <div className="p-6 bg-slate-100 border-t border-gray-200">
                <button
                  onClick={() => setViewingSimulated(null)}
                  className="w-full bg-slate-900 text-white font-black py-5 rounded-[24px] shadow-xl hover:bg-black transition-all uppercase tracking-widest text-xs"
                >
                  Fechar Visualização
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* MODAL VISUALIZAR LAUDO PDF (UPLOADED) */}
      {
        viewingExam && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] flex flex-col rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-[#1e40af] p-8 text-white relative">
                <h2 className="text-2xl font-black">Meu Laudo Digital</h2>
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Arquivo Oficial Disponível</p>
              </div>

              <div className="p-8 space-y-6 relative overflow-y-auto flex-1">
                <button onClick={() => setViewingExam(null)} className="absolute top-4 right-6 text-gray-400 hover:text-red-500 transition-all z-10">
                  <i className="fas fa-times text-xl"></i>
                </button>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Exame</p>
                    <p className="text-sm font-black text-blue-600 uppercase tracking-tight">{viewingExam.examName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data do Exame</p>
                    <p className="text-sm font-black text-slate-800">{viewingExam.date}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Disponível</span>
                    </div>
                  </div>
                </div>

                {viewingExam.fileUrl && (
                  <div className="w-full h-[70vh] rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                    <iframe src={viewingExam.fileUrl} className="w-full h-full" title="Laudo do Exame"></iframe>
                  </div>
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
        )
      }
    </div >
  );
};

export default PatientDashboard;
