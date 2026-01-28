
import React, { useState, useMemo, useEffect } from 'react';
import { User, Appointment } from '../types';
import { jsPDF } from 'jspdf';
import ProfileTab from '../components/ProfileTab';
import DashboardTabs from '../components/DashboardTabs';
import { maskCPF } from '../services/masks';
import { supabase } from '../services/supabase';

interface ReceptionDashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'fila' | 'agenda' | 'perfil' | 'config'>('fila');
  const [dailyLimit, setDailyLimit] = useState<number>(20);
  const [specificLimits, setSpecificLimits] = useState<Record<string, number>>({});
  const [selectedDateForLimit, setSelectedDateForLimit] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: 'a1', patientId: 'p10', patientName: 'Carlos Mendonça', patientCpf: '123.456.789-00', date: '20/10/2024', time: '07:30', examType: 'Hemograma' },
    { id: 'a2', patientId: 'p11', patientName: 'Lucia Ferraz', patientCpf: '987.654.321-11', date: '20/10/2024', time: '08:00', examType: 'EAS + EPF' },
    { id: 'a3', patientId: 'p12', patientName: 'Rafael Souza', patientCpf: '456.789.123-22', date: '20/10/2024', time: '08:30', examType: 'PSA' },
    { id: 'a4', patientId: 'p13', patientName: 'Aline Oliveira', patientCpf: '321.654.987-33', date: '20/10/2024', time: '09:00', examType: 'Glicemia' },
  ]);

  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newApp, setNewApp] = useState({ patientName: '', patientCpf: '', date: '', time: '' });

  useEffect(() => {
    const fetchAppointments = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
      } else {
        const mappedAppointments = (data || []).map((a: any) => ({
          id: a.id,
          patientId: a.patient_id,
          patientName: a.patient_name,
          patientCpf: a.patient_cpf,
          date: a.date,
          time: a.time,
          examType: a.exam_type
        }));
        setAppointments(mappedAppointments);
      }
    };
    fetchAppointments();

    const loadSettings = async () => {
      const { data, error } = await supabase
        .from('lab_settings')
        .select('*');

      if (error) {
        console.error('Error fetching lab settings:', error);
        // Fallback to localStorage if offline or error
        const savedBlocked = localStorage.getItem('lab_blocked_dates');
        if (savedBlocked) setBlockedDates(JSON.parse(savedBlocked));
        const savedLimit = localStorage.getItem('lab_daily_limit');
        if (savedLimit) setDailyLimit(parseInt(savedLimit));
        const savedSpecific = localStorage.getItem('lab_specific_limits');
        if (savedSpecific) setSpecificLimits(JSON.parse(savedSpecific));
      } else {
        data?.forEach(setting => {
          if (setting.key === 'blocked_dates') setBlockedDates(setting.value);
          if (setting.key === 'daily_limit') setDailyLimit(Number(setting.value));
          if (setting.key === 'specific_limits') setSpecificLimits(setting.value);

          // Sync local storage as cache
          localStorage.setItem(`lab_${setting.key}`, JSON.stringify(setting.value));
        });
      }
    };
    loadSettings();

    // Subscribe to changes in lab_settings
    const channel = supabase
      .channel('lab_settings_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lab_settings' }, payload => {
        const { key, value } = payload.new;
        if (key === 'blocked_dates') setBlockedDates(value);
        if (key === 'daily_limit') setDailyLimit(Number(value));
        if (key === 'specific_limits') setSpecificLimits(value);
        localStorage.setItem(`lab_${key}`, JSON.stringify(value));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Only once on mount

  const handleSaveLimit = async (limit: number) => {
    setDailyLimit(limit);
    const { error } = await supabase
      .from('lab_settings')
      .update({ value: limit })
      .eq('key', 'daily_limit');

    if (error) console.error('Error updating limit:', error);

    localStorage.setItem('lab_daily_limit', limit.toString());
    window.dispatchEvent(new CustomEvent('calendarUpdate', { detail: { dailyLimit: limit } }));
    alert("Limite global atualizado com sucesso!");
  };

  const handleSaveSpecificLimit = async (date: string, limit: number) => {
    const updated = { ...specificLimits, [date]: limit };
    setSpecificLimits(updated);

    const { error } = await supabase
      .from('lab_settings')
      .update({ value: updated })
      .eq('key', 'specific_limits');

    if (error) console.error('Error updating specific limit:', error);

    localStorage.setItem('lab_specific_limits', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('calendarUpdate', { detail: { specificLimits: updated } }));
    setSelectedDateForLimit(null);
    alert(`Limite para o dia ${date} atualizado para ${limit}!`);
  };

  const handleRemoveSpecificLimit = async (date: string) => {
    const updated = { ...specificLimits };
    delete updated[date];
    setSpecificLimits(updated);

    const { error } = await supabase
      .from('lab_settings')
      .update({ value: updated })
      .eq('key', 'specific_limits');

    if (error) console.error('Error removing specific limit:', error);

    localStorage.setItem('lab_specific_limits', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('calendarUpdate', { detail: { specificLimits: updated } }));
    setSelectedDateForLimit(null);
    alert(`Limite específico de ${date} removido.`);
  };

  const saveBlockedDates = async (dates: string[]) => {
    setBlockedDates(dates);

    const { error } = await supabase
      .from('lab_settings')
      .update({ value: dates })
      .eq('key', 'blocked_dates');

    if (error) console.error('Error updating blocked dates:', error);

    localStorage.setItem('lab_blocked_dates', JSON.stringify(dates));
    window.dispatchEvent(new CustomEvent('calendarUpdate', { detail: { blockedDates: dates } }));
  };

  const toggleDateBlock = (dateStr: string) => {
    const updated = blockedDates.includes(dateStr)
      ? blockedDates.filter(d => d !== dateStr)
      : [...blockedDates, dateStr];
    console.log('[ReceptionDashboard] Toggling date:', dateStr, 'New state:', updated);
    saveBlockedDates(updated);
  };

  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthYearLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();

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

  const occupiedDates = useMemo(() => appointments.map(a => a.date), [appointments]);
  const filtered = appointments.filter(a => {
    const searchClean = search.replace(/\D/g, '');
    return a.patientName.toLowerCase().includes(search.toLowerCase()) ||
      (searchClean && a.patientCpf?.replace(/\D/g, '').includes(searchClean));
  });

  const handleDownloadList = () => {
    const doc = new jsPDF();

    // Configurações visuais
    const primaryColor = [30, 58, 138]; // Blue 900 (#1e3a8a)
    const secondaryColor = [59, 130, 246]; // Blue 500 (#3b82f6)

    // Cabeçalho
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Laboratório Municipal de Uarini", 105, 18, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("Lista de Atendimentos Agendados", 105, 30, { align: "center" });

    // Metadados
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 50);
    doc.text(`Total de agendamentos: ${filtered.length}`, 14, 55);

    // Tabela
    let yPos = 65;

    // Cabeçalho da Tabela
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(14, yPos - 5, 182, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("HORÁRIO", 18, yPos + 1);
    doc.text("PACIENTE", 50, yPos + 1);
    doc.text("CPF", 130, yPos + 1);
    doc.text("DATA", 170, yPos + 1);

    yPos += 10;

    // Linhas
    doc.setTextColor(50, 50, 50); // Slate 700
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    filtered.forEach((app, index) => {
      // Alternar cor de fundo
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.rect(14, yPos - 5, 182, 10, 'F');
      }

      doc.text(app.time, 18, yPos + 1);
      doc.text(app.patientName.substring(0, 35), 50, yPos + 1); // Limitar tamanho do nome
      doc.text(app.patientCpf || '-', 130, yPos + 1);
      doc.text(app.date, 170, yPos + 1);

      yPos += 10;

      // Nova página se necessário
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
    });

    doc.save(`lista_agendados_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
  };

  const handleDeleteAppointment = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este agendamento?")) {
      const { error } = await supabase.from('appointments').delete().eq('id', id);

      if (error) {
        alert('Erro ao excluir agendamento: ' + error.message);
      } else {
        setAppointments(prev => prev.filter(a => a.id !== id));
      }
    }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApp.patientName || !newApp.date || !newApp.time) {
      alert("Por favor, preencha todos os campos e selecione uma data.");
      return;
    }

    const formattedDate = newApp.date.split('-').reverse().join('/');
    const countForDate = appointments.filter(a => a.date === formattedDate).length;

    // Prioritize specific limit over global limit
    const currentLimit = specificLimits[formattedDate] ?? dailyLimit;

    if (countForDate >= currentLimit) {
      alert(`Limite diário atingido! O limite para este dia é de ${currentLimit} pacientes.`);
      return;
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert([
        {
          patient_id: 'P-' + Math.floor(Math.random() * 1000), // In real usage, this should be real ID if possible, but Reception creates for anyone
          patient_name: newApp.patientName,
          patient_cpf: newApp.patientCpf || '000.000.000-00',
          date: formattedDate,
          time: newApp.time,
          exam_type: 'N/A'
        }
      ])
      .select();

    if (error) {
      alert('Erro ao agendar: ' + error.message);
    } else {
      setAppointments(prev => {
        const newFormatted = {
          id: data[0].id,
          patientId: data[0].patient_id,
          patientName: data[0].patient_name,
          patientCpf: data[0].patient_cpf,
          date: data[0].date,
          time: data[0].time,
          examType: data[0].exam_type
        };
        const updated = [...prev, newFormatted].sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.time.localeCompare(b.time);
        });
        return updated;
      });
      setIsModalOpen(false);
      setNewApp({ patientName: '', patientCpf: '', date: '', time: '' });
      alert('Agendamento criado com sucesso!');
    }
  };

  const formatDateForDisplay = (date: Date) => date.toLocaleDateString('pt-BR');


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <DashboardTabs
          tabs={[
            { id: 'fila', label: 'FILA DE ATENDIMENTO', icon: 'fa-users-viewfinder' },
            { id: 'agenda', label: 'GESTÃO DE AGENDA', icon: 'fa-calendar-check' },
            { id: 'perfil', label: 'PERFIL', icon: 'fa-circle-user' },
            { id: 'config', label: 'LIMITE DE PACIENTE', icon: 'fa-gears' },
          ]}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as any)}
        />

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setIsModalOpen(true);
          }}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
        >
          <i className="fas fa-calendar-plus text-base"></i>
          NOVO AGENDAMENTO
        </button>
      </div>

      {activeTab === 'fila' && (
        <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-xl font-black text-slate-800">Próximos Atendimentos</h2>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-grow">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text" placeholder="Buscar por nome ou CPF..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  value={search} onChange={e => {
                    const v = e.target.value;
                    if (/^\d/.test(v)) setSearch(maskCPF(v));
                    else setSearch(v);
                  }}
                />
              </div>
              <button onClick={handleDownloadList} className="bg-blue-50 text-blue-600 px-4 py-3 rounded-xl hover:bg-blue-100 transition-all flex items-center gap-2">
                <i className="fas fa-download"></i>
                <span className="text-xs font-bold">Baixar Lista</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filtered.length > 0 ? filtered.map(app => (
              <div key={app.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border border-gray-50 hover:border-blue-100 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-xs">
                    {app.time}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm">{app.patientName}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{app.patientCpf || 'CPF NÃO INFORMADO'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4 mt-4 md:mt-0">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-blue-500 uppercase">{app.examType}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{app.date}</p>
                  </div>
                  <button onClick={() => handleDeleteAppointment(app.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white">
                    <i className="fas fa-trash-can text-xs"></i>
                  </button>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center">
                <i className="fas fa-calendar-xmark text-3xl text-gray-100 mb-2"></i>
                <p className="text-gray-400 text-xs font-bold">Nenhum agendamento encontrado.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'agenda' && (
        <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 animate-in fade-in duration-500">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-black text-slate-800 mb-1">Configurações de Datas</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Clique em um dia para bloquear ou desbloquear a agenda</p>
            </div>
            {blockedDates.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm(`Deseja desbloquear todas as ${blockedDates.length} datas bloqueadas?`)) {
                    saveBlockedDates([]);
                    alert('Todas as datas foram desbloqueadas!');
                  }
                }}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
              >
                <i className="fas fa-unlock"></i>
                Desbloquear Todas ({blockedDates.length})
              </button>
            )}
          </div>

          <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-blue-600 transition-all"
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              <span className="text-sm font-black text-blue-600 uppercase tracking-widest">{monthYearLabel}</span>

              <button
                onClick={handleNextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-blue-600 transition-all"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>

            <div className="flex justify-end gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <span className="text-[9px] font-black text-gray-400">NORMAL</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <span className="text-[9px] font-black text-gray-400">BLOQUEADO</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(day => (
                <div key={day} className="text-center text-[10px] font-black text-slate-400">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square"></div>
              ))}
              {daysInMonth.map((date, idx) => {
                const ds = date.toLocaleDateString('pt-BR');
                const isB = blockedDates.includes(ds);
                const isO = occupiedDates.includes(ds);

                return (
                  <button
                    key={idx}
                    onClick={() => toggleDateBlock(ds)}
                    className={`aspect-square rounded-xl text-[11px] font-black border-2 transition-all flex flex-col items-center justify-center ${isB
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : isO
                        ? 'bg-blue-50 border-blue-100 text-blue-600 shadow-sm'
                        : 'bg-white border-transparent text-slate-400 hover:border-blue-200'
                      }`}
                  >
                    <span>{date.getDate()}</span>
                    {isO && !isB && <div className="w-1 h-1 rounded-full bg-blue-500 mt-0.5"></div>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'perfil' && <ProfileTab user={user} onUpdateUser={onUpdateUser} />}

      {activeTab === 'config' && (
        <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h2 className="text-xl font-black text-slate-800 mb-1">Limite de Atendimentos</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Ajuste o teto diário e acompanhe a ocupação</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-4">
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">Limite Global</label>
                <input
                  type="number"
                  min="1"
                  className="w-20 p-2 rounded-xl bg-white border border-blue-200 outline-none text-sm font-black text-blue-600 focus:ring-2 focus:ring-blue-500 transition-all"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(parseInt(e.target.value) || 0)}
                />
              </div>
              <button
                onClick={() => handleSaveLimit(dailyLimit)}
                className="mt-4 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-blue-600/20"
              >
                Salvar
              </button>
            </div>
          </div>

          <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-blue-600 transition-all"
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              <span className="text-sm font-black text-blue-600 uppercase tracking-widest">{monthYearLabel}</span>

              <button
                onClick={handleNextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-blue-600 transition-all"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(day => (
                <div key={day} className="text-center text-[10px] font-black text-slate-400">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square"></div>
              ))}
              {daysInMonth.map((date, idx) => {
                const ds = formatDateForDisplay(date);
                const count = appointments.filter(a => a.date === ds).length;
                const currentLimit = specificLimits[ds] ?? dailyLimit;
                const isFull = count >= currentLimit;
                const hasOverride = specificLimits[ds] !== undefined;
                const percent = Math.min((count / currentLimit) * 100, 100);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDateForLimit(ds)}
                    className={`aspect-square rounded-xl text-[11px] font-black border-2 transition-all flex flex-col items-center justify-center relative overflow-hidden group ${isFull
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : count > 0
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm'
                        : 'bg-white border-transparent text-slate-400 hover:border-blue-200'
                      }`}
                  >
                    <span className="relative z-10 text-[8px] font-black opacity-80 mb-0.5 leading-none">{currentLimit - count} vagas</span>
                    <span className="relative z-10 text-xs">{date.getDate()}</span>
                    {hasOverride && (
                      <i className="fas fa-star text-[6px] absolute top-1 right-1 text-blue-500"></i>
                    )}
                    <div
                      className="absolute bottom-0 left-0 h-1 bg-current opacity-20 transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </button>
                );
              })}
            </div>

            {selectedDateForLimit && (
              <div className="mt-8 p-6 bg-white rounded-[24px] border-2 border-blue-100 animate-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Definir Limite para {selectedDateForLimit}</h4>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">O padrão global é {dailyLimit}</p>
                  </div>
                  <button onClick={() => setSelectedDateForLimit(null)} className="text-gray-300 hover:text-red-500 transition-all p-1">
                    <i className="fas fa-times text-lg"></i>
                  </button>
                </div>

                <div className="flex gap-4">
                  <input
                    type="number"
                    min="1"
                    autoFocus
                    className="flex-1 p-3 rounded-xl bg-gray-50 border border-gray-100 outline-none text-sm font-black focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder={`Ex: ${dailyLimit}`}
                    value={specificLimits[selectedDateForLimit] ?? dailyLimit}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setSpecificLimits(prev => ({ ...prev, [selectedDateForLimit]: val }));
                    }}
                  />
                  <button
                    onClick={() => handleSaveSpecificLimit(selectedDateForLimit, specificLimits[selectedDateForLimit] ?? dailyLimit)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                  >
                    Definir
                  </button>
                  {specificLimits[selectedDateForLimit] !== undefined && (
                    <button
                      onClick={() => handleRemoveSpecificLimit(selectedDateForLimit)}
                      className="px-6 py-3 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                    >
                      Resetar
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-4 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white border border-gray-200"></div>
                <span className="text-[9px] font-black text-gray-400 uppercase">VAZIO</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] font-black text-gray-400 uppercase">EM USO</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <span className="text-[9px] font-black text-gray-400 uppercase">LOTADO</span>
              </div>
              <div className="flex items-center gap-1.5">
                <i className="fas fa-star text-[8px] text-blue-500"></i>
                <span className="text-[9px] font-black text-gray-400 uppercase">LIMITE ESPECÍFICO</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AGENDAMENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-emerald-600 p-8 text-white">
              <h3 className="text-2xl font-black">Nova Coleta</h3>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Inserir paciente na agenda</p>
            </div>

            <div className="p-8 space-y-4 relative">
              <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-4 right-6 text-gray-400 hover:text-red-500 transition-all z-10">
                <i className="fas fa-times text-xl"></i>
              </button>
              <form onSubmit={handleAddAppointment} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Paciente</label>
                  <input required type="text" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold" value={newApp.patientName} onChange={e => setNewApp({ ...newApp, patientName: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CPF</label>
                  <input type="text" placeholder="000.000.000-00" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold" value={newApp.patientCpf} onChange={e => setNewApp({ ...newApp, patientCpf: maskCPF(e.target.value) })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data</label>
                    <input required type="date" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-xs font-bold" value={newApp.date} onChange={e => setNewApp({ ...newApp, date: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Horário</label>
                    <input required type="time" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-xs font-bold" value={newApp.time} onChange={e => setNewApp({ ...newApp, time: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white font-black py-5 rounded-[24px] shadow-xl hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs mt-4">Confirmar Agendamento</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionDashboard;
