
import React, { useState, useMemo, useEffect } from 'react';
import { User, Appointment } from '../types';
import { jsPDF } from 'jspdf';
import ProfileTab from '../components/ProfileTab';
import DashboardTabs from '../components/DashboardTabs';
import { maskCPF, maskSUS, maskAge } from '../services/masks';
import { dbService } from '../services/apiService';
import { useSettings } from '../contexts/SettingsContext';

interface ReceptionDashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({ user, onUpdateUser }) => {
  const { appLogo } = useSettings();
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
  const [isListViewOpen, setIsListViewOpen] = useState(false);
  const [newApp, setNewApp] = useState({ 
    patientName: '', 
    patientBirthDate: '', 
    patientGender: '', 
    patientSusNumber: '', 
    patientAddress: '',
    patientAge: '',
    date: '', 
    time: '' 
  });

  useEffect(() => {
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
          patientBirthDate: a.patient_birth_date,
          patientAddress: a.patient_address,
          date: a.date,
          time: a.time
        }));
        setAppointments(mappedAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };
    fetchAppointments();

    const loadSettings = async () => {
      try {
        const data = await dbService.from('lab_settings').select();
        data?.forEach((setting: any) => {
          if (setting.key === 'blocked_dates') setBlockedDates(setting.value);
          if (setting.key === 'daily_limit') setDailyLimit(Number(setting.value));
          if (setting.key === 'specific_limits') setSpecificLimits(setting.value);
          localStorage.setItem(`lab_${setting.key}`, JSON.stringify(setting.value));
        });
      } catch (error) {
        console.error('Error fetching lab settings:', error);
      }
    };
    loadSettings();
  }, []); // Only once on mount

  const handleSaveLimit = async (limit: number) => {
    setDailyLimit(limit);
    try {
      await dbService.from('lab_settings').update({ value: limit }, { key: 'daily_limit' });
    } catch (error) {
      console.error('Error updating limit:', error);
    }

    localStorage.setItem('lab_daily_limit', limit.toString());
    window.dispatchEvent(new CustomEvent('calendarUpdate', { detail: { dailyLimit: limit } }));
    alert("Limite global atualizado com sucesso!");
  };

  const handleSaveSpecificLimit = async (date: string, limit: number) => {
    const updated = { ...specificLimits, [date]: limit };
    setSpecificLimits(updated);

    try {
      await dbService.from('lab_settings').update({ value: updated }, { key: 'specific_limits' });
    } catch (error) {
      console.error('Error updating specific limit:', error);
    }

    localStorage.setItem('lab_specific_limits', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('calendarUpdate', { detail: { specificLimits: updated } }));
    setSelectedDateForLimit(null);
    alert(`Limite para o dia ${date} atualizado para ${limit}!`);
  };

  const handleRemoveSpecificLimit = async (date: string) => {
    const updated = { ...specificLimits };
    delete updated[date];
    setSpecificLimits(updated);

    try {
      await dbService.from('lab_settings').update({ value: updated }, { key: 'specific_limits' });
    } catch (error) {
      console.error('Error removing specific limit:', error);
    }

    localStorage.setItem('lab_specific_limits', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('calendarUpdate', { detail: { specificLimits: updated } }));
    setSelectedDateForLimit(null);
    alert(`Limite específico de ${date} removido.`);
  };

  const saveBlockedDates = async (dates: string[]) => {
    setBlockedDates(dates);

    try {
      await dbService.from('lab_settings').update({ value: dates }, { key: 'blocked_dates' });
    } catch (error) {
      console.error('Error updating blocked dates:', error);
    }

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
      (a.patientBirthDate && a.patientBirthDate.includes(search));
  });

  const handleDownloadList = () => {
    const doc = new jsPDF();

    // Configurações visuais
    const primaryColor = [30, 58, 138]; // Blue 900 (#1e3a8a)
    const secondaryColor = [59, 130, 246]; // Blue 500 (#3b82f6)

    // Cabeçalho
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 55, 'F'); // Aumentado para 55mm

    if (appLogo) {
      try {
        // Tentar manter proporção quadrada 25x25
        doc.addImage(appLogo, 'JPEG', 105 - 12.5, 5, 25, 25);
      } catch (e) {
        console.error('Erro ao adicionar logo ao PDF:', e);
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Laboratório Municipal de Uarini", 105, 42, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Lista de Atendimentos Agendados", 105, 48, { align: "center" });

    // Metadados
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 65);
    doc.text(`Total de agendamentos: ${filtered.length}`, 14, 70);

    // Tabela
    let yPos = 80;

    // Cabeçalho da Tabela
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(14, yPos - 5, 182, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("HORA", 14, yPos + 1);
    doc.text("PACIENTE", 28, yPos + 1);
    doc.text("NASCIMENTO", 63, yPos + 1);
    doc.text("IDADE", 88, yPos + 1);
    doc.text("SUS", 102, yPos + 1);
    doc.text("ENDEREÇO", 132, yPos + 1);
    doc.text("DATA", 182, yPos + 1);

    yPos += 10;

    // Linhas
    doc.setTextColor(50, 50, 50); // Slate 700
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    filtered.forEach((app, index) => {
      // Alternar cor de fundo
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.rect(14, yPos - 5, 182, 10, 'F');
      }

      doc.text(app.time, 14, yPos + 1);
      doc.text(app.patientName.substring(0, 18), 28, yPos + 1); 
      doc.text(app.patientBirthDate?.split('-').reverse().join('/') || '-', 63, yPos + 1);
      doc.text(String(app.patientAge || '-'), 88, yPos + 1);
      doc.text(String(app.patientSusNumber || '-').substring(0, 15), 102, yPos + 1);
      doc.text(app.patientAddress?.substring(0, 30) || '-', 132, yPos + 1);
      doc.text(app.date, 182, yPos + 1);

      yPos += 10;

      // Nova página se necessário
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
    });

    doc.save(`lista_agendados_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
  };

  const handleDeleteAppointment = async (id: string, name: string) => {
    if (window.confirm(`Deseja realmente excluir o agendamento de ${name}?`)) {
      try {
        await dbService.from('appointments').delete({ id });
        setAppointments(prev => prev.filter(a => a.id !== id));
        alert('Agendamento excluído com sucesso!');
      } catch (error: any) {
        console.error('[ReceptionDashboard] Error deleting appointment:', error);
        alert('Erro ao excluir agendamento: ' + error.message);
      }
    }
  };

  const [isAdding, setIsAdding] = useState(false);
  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdding) return;
    setIsAdding(true);
    if (!newApp.patientName || !newApp.date || !newApp.time) {
      alert("Por favor, preencha todos os campos e selecione uma data.");
      return;
    }

    if (!newApp.patientBirthDate) {
      alert("Por favor, informe a data de nascimento.");
      return;
    }

    if (newApp.patientAddress && newApp.patientAddress.length < 5) {
      alert("O endereço deve ser mais detalhado.");
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

    console.log('[ReceptionDashboard] Attempting to add appointment:', newApp);
    try {
      const age = parseInt(newApp.patientAge);
      const data = await dbService.from('appointments').insert({
        patient_id: 'P-' + Math.floor(Math.random() * 1000),
        patient_name: newApp.patientName,
        patient_birth_date: newApp.patientBirthDate,
        patient_age: !isNaN(age) ? age : null,
        patient_gender: newApp.patientGender,
        patient_sus_number: newApp.patientSusNumber,
        patient_address: newApp.patientAddress,
        date: formattedDate,
        time: newApp.time
      });

      console.log('[ReceptionDashboard] Insert result:', data);

      if (!data || data.length === 0) {
          throw new Error('Nenhum dado retornado do servidor.');
      }

      const newFormatted = {
        id: data[0].id,
        patientId: data[0].patient_id,
        patientName: data[0].patient_name,
        patientBirthDate: data[0].patient_birth_date,
        patientAge: data[0].patient_age,
        patientGender: data[0].patient_gender,
        patientSusNumber: data[0].patient_sus_number,
        patientAddress: data[0].patient_address,
        date: data[0].date,
        time: data[0].time
      };
      setAppointments(prev => {
        const updated = [...prev, newFormatted].sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.time.localeCompare(b.time);
        });
        return updated;
      });
      setIsModalOpen(false);
      setNewApp({ 
        patientName: '', 
        patientBirthDate: '', 
        patientAge: '', 
        patientGender: '', 
        patientSusNumber: '', 
        patientAddress: '',
        date: '', 
        time: '' 
      });
      alert('Agendamento criado com sucesso!');
    } catch (error: any) {
      console.error('[ReceptionDashboard] Error adding appointment:', error);
      alert('Erro ao agendar: ' + error.message);
    } finally {
      setIsAdding(false);
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
              <button onClick={() => setIsListViewOpen(true)} className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-xl hover:bg-emerald-100 transition-all flex items-center gap-2">
                <i className="fas fa-eye"></i>
                <span className="text-xs font-bold">Visualizar Lista</span>
              </button>
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
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{app.patientBirthDate ? `NASC: ${app.patientBirthDate.split('-').reverse().join('/')}` : 'DATA NASC. NÃO INFORMADA'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4 mt-4 md:mt-0">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-blue-500 uppercase">COLETA LABORATORIAL</p>
                    <p className="text-[10px] text-gray-400 font-bold">{app.date}</p>
                  </div>
                  <button 
                      onClick={() => handleDeleteAppointment(app.id, app.patientName)} 
                      className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center transition-all hover:bg-red-500 hover:text-white"
                      title="Excluir agendamento"
                  >
                    <i className="fas fa-trash-can text-sm"></i>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                    <input required type="date" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold" value={newApp.patientBirthDate} onChange={e => setNewApp({ ...newApp, patientBirthDate: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cartão SUS</label>
                    <input 
                      type="text" 
                      placeholder="000 0000 0000 0000"
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold" 
                      value={newApp.patientSusNumber} 
                      onChange={e => setNewApp({ ...newApp, patientSusNumber: maskSUS(e.target.value) })} 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Idade</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 25"
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold" 
                      value={newApp.patientAge} 
                      onChange={e => setNewApp({ ...newApp, patientAge: maskAge(e.target.value) })} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sexo</label>
                    <select className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold" value={newApp.patientGender} onChange={e => setNewApp({ ...newApp, patientGender: e.target.value })}>
                      <option value="">Selecione</option>
                      <option value="MASCULINO">MASCULINO</option>
                      <option value="FEMININO">FEMININO</option>
                      <option value="OUTRO">OUTRO</option>
                    </select>
                  </div>
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
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Endereço Completo</label>
                  <textarea 
                    placeholder="Rua, Número, Bairro, Ponto de Referência..."
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold min-h-[100px]" 
                    value={newApp.patientAddress} 
                    onChange={e => setNewApp({ ...newApp, patientAddress: e.target.value })} 
                  />
                </div>
                <button 
                   type="submit" 
                   disabled={isAdding}
                   className={`w-full text-white font-black py-5 rounded-[24px] shadow-xl transition-all uppercase tracking-widest text-xs mt-4 flex items-center justify-center gap-2 ${
                     isAdding ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                   }`}
                >
                  {isAdding ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      PROCESSANDO...
                    </>
                  ) : 'Confirmar Agendamento'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* MODAL VISUALIZAR LISTA */}
      {isListViewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="bg-[#1e3a8a] p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">Lista de Atendimentos</h3>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Conferência de agendamentos filtrados</p>
              </div>
              <button onClick={() => setIsListViewOpen(false)} className="text-white/60 hover:text-white transition-all">
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-7 gap-4 mb-4 pb-4 border-b border-gray-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Horário</span>
                <span>Paciente</span>
                <span>Nascimento</span>
                <span>Idade</span>
                <span>Sexo</span>
                <span>SUS</span>
                <span>Endereço</span>
                <span>Data</span>
              </div>

              <div className="space-y-4">
                {filtered.length > 0 ? filtered.map(app => (
                  <div key={app.id} className="grid grid-cols-7 gap-4 py-3 items-center border-b border-gray-50 last:border-0">
                    <span className="text-sm font-black text-blue-600 bg-blue-50 w-fit px-3 py-1 rounded-lg">{app.time}</span>
                    <span className="text-sm font-bold text-slate-700">{app.patientName}</span>
                    <span className="text-xs font-medium text-slate-500">{app.patientBirthDate?.split('-').reverse().join('/') || '-'}</span>
                    <span className="text-xs font-medium text-slate-500">{app.patientAge || '-'}</span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 w-fit px-2 py-1 rounded-md">{app.patientGender || '-'}</span>
                    <span className="text-xs font-medium text-slate-500">{app.patientSusNumber || '-'}</span>
                    <span className="text-xs font-medium text-slate-400 truncate max-w-[150px]" title={app.patientAddress}>{app.patientAddress || '-'}</span>
                    <span className="text-xs font-bold text-slate-800">{app.date}</span>
                  </div>
                )) : (
                  <div className="py-12 text-center text-gray-400 italic">
                    Nenhum agendamento para exibir com os filtros atuais.
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 border-t border-gray-50 flex justify-between items-center bg-gray-50/30">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de registros: {filtered.length}</p>
              <button
                onClick={() => setIsListViewOpen(false)}
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
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

export default ReceptionDashboard;
