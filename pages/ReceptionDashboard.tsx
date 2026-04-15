
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Appointment } from '../types';
import { jsPDF } from 'jspdf';
import ProfileTab from '../components/ProfileTab';
import DashboardTabs from '../components/DashboardTabs';
import { maskCPF, maskSUS, maskAge, maskPhone } from '../services/masks';
import { dbService } from '../services/apiService';
import { useSettings } from '../contexts/SettingsContext';

interface ReceptionDashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

import html2canvas from 'html2canvas';

const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({ user, onUpdateUser }) => {
  const urgencyRef = useRef<HTMLDivElement>(null);
  const { appLogo } = useSettings();
  const [activeTab, setActiveTab] = useState<'fila' | 'agenda' | 'perfil' | 'config' | 'urgencia'>('fila');
  const [dailyLimit, setDailyLimit] = useState<number>(20);
  const [specificLimits, setSpecificLimits] = useState<Record<string, number>>({});
  const [selectedDateForLimit, setSelectedDateForLimit] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListViewOpen, setIsListViewOpen] = useState(false);
  
  const [newApp, setNewApp] = useState({ 
    patientName: '', 
    patientBirthDate: '', 
    patientGender: '', 
    patientSusNumber: '', 
    patientPhone: '',
    patientAddress: '',
    patientAddressNumber: '',
    patientAge: '',
    date: '', 
    time: '' 
  });

  const [urgenciaForm, setUrgenciaForm] = useState({
    nomeCompleto: '',
    cpf: '',
    sus: '',
    dataNascimento: '',
    idade: '',
    sexo: '',
    mae: '',
    pai: '',
    resideUarini: true,
    estadoCivil: '',
    naturalidade: 'BRASILEIRO(A)',
    raca: '',
    logradouro: '',
    numero: '',
    bairro: '',
    telefone: '',
    responsavel: '',
    parentesco: '',
    tipoSanguineo: '',
    alergias: '',
    arrivalMode: '',
    vitalsPa: '',
    vitalsFc: '',
    vitalsFr: '',
    vitalsSat: '',
    vitalsGlicemia: '',
    vitalsTemp: '',
    vitalsBcf: '',
    vitalsPeso: '',
    vitalsAltura: '',
    hasHypertension: false,
    hasSmoking: false,
    hasDiabetes: false,
    hasDrugAllergy: false,
    drugAllergiesList: '',
    previousHospitalization: false,
    hospitalizationReasonLocal: '',
    riskClassification: '',
    painScale: 0,
    signsSymptoms: '',
    clinicalHistoryExam: '',
    proceduresDone: '',
    probableDiagnosis: '',
    cid10: '',
    dataAtendimento: new Date().toISOString().split('T')[0],
    horaAtendimento: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
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
          patientPhone: a.patient_phone,
          patientAddress: a.patient_address,
          patientAddressNumber: a.patient_address_number,
          patientMotherName: a.patient_mother_name,
          patientFatherName: a.patient_father_name,
          residesInUarini: a.resides_in_uarini,
          patientCivilStatus: a.patient_civil_status,
          patientNaturalness: a.patient_naturalness,
          patientRaceColor: a.patient_race_color,
          patientNeighborhood: a.patient_neighborhood,
          patientResponsibleName: a.patient_responsible_name,
          patientResponsibleRelationship: a.patient_responsible_relationship,
          isUrgency: a.is_urgency,
          arrivalMode: a.arrival_mode,
          vitalsPa: a.vitals_pa,
          vitalsFc: a.vitals_fc,
          vitalsFr: a.vitals_fr,
          vitalsSat: a.vitals_sat,
          vitalsGlicemia: a.vitals_glicemia,
          vitalsTemp: a.vitals_temp,
          vitalsBcf: a.vitals_bcf,
          vitalsPeso: a.vitals_peso,
          vitalsAltura: a.vitals_altura,
          hasHypertension: a.has_hypertension,
          hasSmoking: a.has_smoking,
          hasDiabetes: a.has_diabetes,
          hasDrugAllergy: a.has_drug_allergy,
          drugAllergiesList: a.drug_allergies_list,
          previousHospitalization: a.previous_hospitalization,
          hospitalizationReasonLocal: a.hospitalization_reason_local,
          riskClassification: a.risk_classification,
          painScale: a.pain_scale,
          signsSymptoms: a.signs_symptoms,
          clinicalHistoryExam: a.clinical_history_exam,
          proceduresDone: a.procedures_done,
          probableDiagnosis: a.probable_diagnosis,
          cid10: a.cid_10,
          status: a.status,
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
    const doc = new jsPDF({
      orientation: 'l',
      unit: 'mm',
      format: 'a4'
    });

    // Configurações visuais
    const primaryColor = [30, 58, 138]; // Blue 900 (#1e3a8a)
    const secondaryColor = [59, 130, 246]; // Blue 500 (#3b82f6)

    // Cabeçalho
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 297, 55, 'F'); 

    if (appLogo) {
      try {
        doc.addImage(appLogo, 'JPEG', 148.5 - 12.5, 5, 25, 25);
      } catch (e) {
        console.error('Erro ao adicionar logo ao PDF:', e);
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Laboratório Municipal de Uarini", 148.5, 42, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Lista de Atendimentos Agendados", 148.5, 48, { align: "center" });

    // Metadados
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 65);
    doc.text(`Total de agendamentos: ${filtered.length}`, 14, 70);

    // Tabela
    let yPos = 80;

    // Cabeçalho da Tabela
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(14, yPos - 5, 269, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9); 
    doc.text("HORA", 14, yPos + 1);
    doc.text("PACIENTE", 30, yPos + 1);
    doc.text("CONTATO", 80, yPos + 1);
    doc.text("NASCIMENTO", 115, yPos + 1);
    doc.text("IDADE", 145, yPos + 1);
    doc.text("SUS", 165, yPos + 1);
    doc.text("ENDEREÇO", 205, yPos + 1);
    doc.text("DATA", 265, yPos + 1);

    yPos += 10;

    // Linhas
    doc.setTextColor(50, 50, 50); // Slate 700
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    filtered.forEach((app, index) => {
      const patientLines = doc.splitTextToSize(app.patientName, 50);
      const fullAddress = `${app.patientAddress || '-'}${app.patientAddressNumber ? `, ${app.patientAddressNumber}` : ''}`;
      const addressLines = doc.splitTextToSize(fullAddress, 55);
      
      const maxLines = Math.max(patientLines.length, addressLines.length, 1);
      const rowHeight = Math.max(maxLines * 5, 10);

      // Nova página se não couber
      if (yPos + rowHeight > 190) {
        doc.addPage('a4', 'l');
        yPos = 20;
        
        doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.rect(14, yPos - 5, 269, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("HORA", 14, yPos + 1);
        doc.text("PACIENTE", 30, yPos + 1);
        doc.text("CONTATO", 80, yPos + 1);
        doc.text("NASCIMENTO", 115, yPos + 1);
        doc.text("IDADE", 145, yPos + 1);
        doc.text("SUS", 165, yPos + 1);
        doc.text("ENDEREÇO", 205, yPos + 1);
        doc.text("DATA", 265, yPos + 1);
        yPos += 10;
        doc.setTextColor(50, 50, 50);
        doc.setFont("helvetica", "normal");
      }

      // Alternar cor de fundo
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, yPos - 5, 269, rowHeight, 'F');
      }

      doc.text(app.time, 14, yPos + 1);
      doc.text(patientLines, 30, yPos + 1); 
      doc.text(app.patientPhone || '-', 80, yPos + 1);
      doc.text(app.patientBirthDate?.split('-').reverse().join('/') || '-', 115, yPos + 1);
      doc.text(String(app.patientAge || '-'), 145, yPos + 1);
      doc.text(String(app.patientSusNumber || '-').substring(0, 15), 165, yPos + 1);
      doc.text(addressLines, 205, yPos + 1);
      doc.text(app.date, 265, yPos + 1);

      yPos += rowHeight;
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
        patient_phone: newApp.patientPhone,
        patient_address: newApp.patientAddress,
        patient_address_number: newApp.patientAddressNumber,
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
        patientPhone: data[0].patient_phone,
        patientAddress: data[0].patient_address,
        patientAddressNumber: data[0].patient_address_number,
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
        patientPhone: '',
        patientAddress: '',
        patientAddressNumber: '',
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

  const syncPatientWithCarteirinha = async (value: string, type: 'cpf' | 'sus') => {
    if (!value) return;
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length < 5) return;

    try {
      const filter = type === 'cpf' ? { cpf: value } : { sus_number: value };
      console.log('[ReceptionDashboard] Syncing patient with filter:', filter);
      const data = await dbService.from('profiles').select(filter);
      
      if (data && data.length > 0) {
        const p = data[0];
        setUrgenciaForm(prev => ({
          ...prev,
          nomeCompleto: p.name || prev.nomeCompleto,
          cpf: p.cpf || prev.cpf,
          sus: p.sus_number || prev.sus,
          dataNascimento: p.birth_date || prev.dataNascimento,
          idade: p.age?.toString() || prev.idade,
          sexo: p.gender || prev.sexo,
          mae: p.mother_name || prev.mae,
          pai: p.father_name || prev.pai,
          resideUarini: p.resides_in_uarini !== undefined ? p.resides_in_uarini : prev.resideUarini,
          estadoCivil: p.civil_status || prev.estadoCivil,
          naturalidade: p.naturalness || prev.naturalidade,
          raca: p.race_color || prev.raca,
          tipoSanguineo: p.blood_type || prev.tipoSanguineo,
          alergias: p.allergies || prev.alergias,
          logradouro: p.address || prev.logradouro,
          numero: p.address_number || prev.numero,
          neighborhood: p.neighborhood || prev.bairro,
          telefone: p.phone || prev.telefone
        }));
        // alert('Dados do paciente sincronizados com a Carteirinha!');
      }
    } catch (error) {
      console.error('[ReceptionDashboard] Sync error:', error);
    }
  };

  const handleUrgencyPDF = async (action: 'view' | 'download') => {
    if (!urgencyRef.current) return;
    
    setIsAdding(true);
    
    try {
      const canvas = await html2canvas(urgencyRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      if (action === 'download') {
        pdf.save(`ficha_urgencia_${urgenciaForm.nomeCompleto.replace(/\s+/g, '_')}.pdf`);
      } else {
        const blob = pdf.output('bloburl');
        window.open(blob, '_blank');
      }
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Falha ao gerar o PDF. Tente novamente.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUrgencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdding) return;
    setIsAdding(true);

    try {
      if (!urgenciaForm.nomeCompleto || (!urgenciaForm.cpf && !urgenciaForm.sus)) {
        throw new Error('Nome Completo e CPF ou SUS são obrigatórios.');
      }

      const formattedDate = urgenciaForm.dataAtendimento.split('-').reverse().join('/');

      // 1. Save Appointment (the Service Record)
      const appData = await dbService.from('appointments').insert({
        patient_id: 'U-' + Math.floor(Math.random() * 10000),
        patient_name: urgenciaForm.nomeCompleto,
        patient_cpf: urgenciaForm.cpf,
        patient_sus_number: urgenciaForm.sus,
        patient_birth_date: urgenciaForm.dataNascimento,
        patient_age: parseInt(urgenciaForm.idade) || null,
        patient_gender: urgenciaForm.sexo,
        patient_phone: urgenciaForm.telefone,
        patient_address: urgenciaForm.logradouro,
        patient_address_number: urgenciaForm.numero,
        patient_neighborhood: urgenciaForm.bairro,
        patient_mother_name: urgenciaForm.mae,
        patient_father_name: urgenciaForm.pai,
        patient_civil_status: urgenciaForm.estadoCivil,
        patient_naturalness: urgenciaForm.naturalidade,
        patient_race_color: urgenciaForm.raca,
        patient_responsible_name: urgenciaForm.responsavel,
        patient_responsible_relationship: urgenciaForm.parentesco,
        resides_in_uarini: urgenciaForm.resideUarini,
        is_urgency: true,
        arrival_mode: urgenciaForm.arrivalMode,
        vitals_pa: urgenciaForm.vitalsPa,
        vitals_fc: urgenciaForm.vitalsFc,
        vitals_fr: urgenciaForm.vitalsFr,
        vitals_sat: urgenciaForm.vitalsSat,
        vitals_glicemia: urgenciaForm.vitalsGlicemia,
        vitals_temp: urgenciaForm.vitalsTemp,
        vitals_bcf: urgenciaForm.vitalsBcf,
        vitals_peso: urgenciaForm.vitalsPeso,
        vitals_altura: urgenciaForm.vitalsAltura,
        has_hypertension: urgenciaForm.hasHypertension,
        has_smoking: urgenciaForm.hasSmoking,
        has_diabetes: urgenciaForm.hasDiabetes,
        has_drug_allergy: urgenciaForm.hasDrugAllergy,
        drug_allergies_list: urgenciaForm.drugAllergiesList,
        previous_hospitalization: urgenciaForm.previousHospitalization,
        hospitalization_reason_local: urgenciaForm.hospitalizationReasonLocal,
        risk_classification: urgenciaForm.riskClassification,
        pain_scale: urgenciaForm.painScale,
        signs_symptoms: urgenciaForm.signsSymptoms,
        clinical_history_exam: urgenciaForm.clinicalHistoryExam,
        procedures_done: urgenciaForm.proceduresDone,
        probable_diagnosis: urgenciaForm.probableDiagnosis,
        cid_10: urgenciaForm.cid10,
        status: 'URGÊNCIA',
        setor: 'RECEPCAO',
        date: formattedDate,
        time: urgenciaForm.horaAtendimento
      });

      // 2. Sync back to Profile (Carteirinha)
      await dbService.from('profiles').upsert({
        name: urgenciaForm.nomeCompleto,
        cpf: urgenciaForm.cpf,
        sus_number: urgenciaForm.sus,
        birth_date: urgenciaForm.dataNascimento,
        age: parseInt(urgenciaForm.idade) || null,
        gender: urgenciaForm.sexo,
        mother_name: urgenciaForm.mae,
        father_name: urgenciaForm.pai,
        resides_in_uarini: urgenciaForm.resideUarini,
        civil_status: urgenciaForm.estadoCivil,
        naturalness: urgenciaForm.naturalidade,
        race_color: urgenciaForm.raca,
        blood_type: urgenciaForm.tipoSanguineo,
        allergies: urgenciaForm.alergias,
        address: urgenciaForm.logradouro,
        address_number: urgenciaForm.numero,
        neighborhood: urgenciaForm.bairro,
        phone: urgenciaForm.telefone,
        role: 'PATIENT'
      }, ['cpf']); // Conflict key = CPF

      alert('Cadastro de urgência realizado e Carteirinha atualizada!');
      
      // Update local appointments list for the queue
      if (appData && appData[0]) {
        const item = appData[0];
        setAppointments(prev => [...prev, {
            id: item.id,
            patientId: item.patient_id,
            patientName: item.patient_name,
            patientCpf: item.patient_cpf,
            patientAge: item.patient_age,
            patientGender: item.patient_gender,
            patientSusNumber: item.patient_sus_number,
            patientBirthDate: item.patient_birth_date,
            patientPhone: item.patient_phone,
            patientAddress: item.patient_address,
            patientAddressNumber: item.patient_address_number,
            date: item.date,
            time: item.time,
            status: item.status
        }]);
      }

      setActiveTab('fila');
      setUrgenciaForm({
        nomeCompleto: '',
        cpf: '',
        sus: '',
        dataNascimento: '',
        idade: '',
        sexo: '',
        mae: '',
        pai: '',
        resideUarini: true,
        estadoCivil: '',
        naturalidade: 'BRASILEIRO(A)',
        raca: '',
        logradouro: '',
        numero: '',
        bairro: '',
        telefone: '',
        responsavel: '',
        parentesco: '',
        dataAtendimento: new Date().toISOString().split('T')[0],
        horaAtendimento: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });

    } catch (error: any) {
      console.error('[ReceptionDashboard] Error in urgency registration:', error);
      alert('Erro ao realizar cadastro: ' + error.message);
    } finally {
      setIsAdding(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <DashboardTabs
          tabs={[
            { id: 'fila', label: 'FILA DE ATENDIMENTO', icon: 'fa-users-viewfinder' },
            { id: 'urgencia', label: 'CADASTRO DE URGÊNCIA', icon: 'fa-truck-medical' },
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

      {activeTab === 'urgencia' && (
        <div className="bg-white p-6 md:p-10 rounded-[40px] shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b border-gray-50">
            <div>
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <i className="fas fa-truck-medical"></i>
                </div>
                Ficha de Atendimento de Urgência
              </h2>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1 ml-15">Cadastro completo sincronizado com a Carteirinha</p>
            </div>
            
            <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
               <div className="text-right">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Unidade</p>
                  <p className="text-xs font-bold text-emerald-800">Uarini / AM</p>
               </div>
               <div className="w-px h-8 bg-emerald-200"></div>
               <i className="fas fa-hospital-user text-2xl text-emerald-600"></i>
            </div>
          </div>

          <form onSubmit={handleUrgencySubmit} className="space-y-10">
            {/* SECTION: IDENTIFICAÇÃO */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center text-[10px]">01</span>
                Identificação do Paciente
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo (sem abreviações)</label>
                  <input 
                    required type="text" 
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all uppercase" 
                    value={urgenciaForm.nomeCompleto} 
                    onChange={e => setUrgenciaForm({ ...urgenciaForm, nomeCompleto: e.target.value.toUpperCase() })} 
                    placeholder="DIGITE O NOME COMPLETO"
                  />
                </div>
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CPF (Sincroniza Carteirinha)</label>
                  <input 
                    type="text" 
                    className="w-full p-4 rounded-2xl bg-blue-50/30 border border-blue-100 outline-none text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all" 
                    value={urgenciaForm.cpf} 
                    onChange={e => {
                      const v = maskCPF(e.target.value);
                      setUrgenciaForm({ ...urgenciaForm, cpf: v });
                      if (v.length === 14) syncPatientWithCarteirinha(v, 'cpf');
                    }}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cartão SUS (CNS)</label>
                  <input 
                    type="text" 
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all" 
                    value={urgenciaForm.sus} 
                    onChange={e => {
                      const v = maskSUS(e.target.value);
                      setUrgenciaForm({ ...urgenciaForm, sus: v });
                      if (v.length === 15) syncPatientWithCarteirinha(v, 'sus');
                    }}
                    placeholder="000 0000 0000 0000"
                  />
                </div>
                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                  <input 
                    required type="date" 
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all" 
                    value={urgenciaForm.dataNascimento} 
                    onChange={e => {
                      const date = e.target.value;
                      let age = '';
                      if (date) {
                        const birth = new Date(date);
                        const today = new Date();
                        age = (today.getFullYear() - birth.getFullYear()).toString();
                      }
                      setUrgenciaForm({ ...urgenciaForm, dataNascimento: date, idade: age });
                    }} 
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Idade</label>
                  <input 
                    type="text" 
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all" 
                    value={urgenciaForm.idade} 
                    onChange={e => setUrgenciaForm({ ...urgenciaForm, idade: maskAge(e.target.value) })}
                    placeholder="EX: 25"
                  />
                </div>
                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sexo</label>
                  <select 
                    required
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all" 
                    value={urgenciaForm.sexo} 
                    onChange={e => setUrgenciaForm({ ...urgenciaForm, sexo: e.target.value })}
                  >
                    <option value="">SELECIONE</option>
                    <option value="MASCULINO">MASCULINO</option>
                    <option value="FEMININO">FEMININO</option>
                    <option value="NÃO INFORMADO">NÃO INFORMADO</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION: FILIAÇÃO */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center text-[10px]">02</span>
                Filiação
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome da Mãe (completo)</label>
                  <input 
                    type="text" 
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all uppercase" 
                    value={urgenciaForm.mae} 
                    onChange={e => setUrgenciaForm({ ...urgenciaForm, mae: e.target.value.toUpperCase() })} 
                    placeholder="NOME DA MÃE"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Pai (completo)</label>
                  <input 
                    type="text" 
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all uppercase" 
                    value={urgenciaForm.pai} 
                    onChange={e => setUrgenciaForm({ ...urgenciaForm, pai: e.target.value.toUpperCase() })} 
                    placeholder="NOME DO PAI"
                  />
                </div>
              </div>
            </div>

            {/* SECTION: DADOS COMPLEMENTARES */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center text-[10px]">03</span>
                Dados Complementares
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reside em Uarini?</label>
                  <div className="flex gap-4 p-1 bg-gray-50 rounded-2xl border border-gray-100 h-[52px] items-center px-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="reside" checked={urgenciaForm.resideUarini} onChange={() => setUrgenciaForm({...urgenciaForm, resideUarini: true})} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-xs font-bold text-slate-600">SIM</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="reside" checked={!urgenciaForm.resideUarini} onChange={() => setUrgenciaForm({...urgenciaForm, resideUarini: false})} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-xs font-bold text-slate-600">NÃO</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado Civil</label>
                  <select className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold h-[52px]" value={urgenciaForm.estadoCivil} onChange={e => setUrgenciaForm({...urgenciaForm, estadoCivil: e.target.value})}>
                    <option value="">SELECIONE</option>
                    <option value="SOLTEIRO(A)">SOLTEIRO(A)</option>
                    <option value="CASADO(A)">CASADO(A)</option>
                    <option value="DIVORCIADO(A)">DIVORCIADO(A)</option>
                    <option value="VIÚVO(A)">VIÚVO(A)</option>
                    <option value="UNIÃO ESTÁVEL">UNIÃO ESTÁVEL</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Raça / Cor</label>
                  <select className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold h-[52px]" value={urgenciaForm.raca} onChange={e => setUrgenciaForm({...urgenciaForm, raca: e.target.value})}>
                    <option value="">SELECIONE</option>
                    <option value="BRANCA">BRANCA</option>
                    <option value="AMARELA">AMARELA</option>
                    <option value="PARDA">PARDA</option>
                    <option value="NEGRA">NEGRA</option>
                    <option value="INDÍGENA">INDÍGENA</option>
                    <option value="OUTROS">OUTROS</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo Sanguíneo</label>
                  <select className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold h-[52px]" value={urgenciaForm.tipoSanguineo} onChange={e => setUrgenciaForm({...urgenciaForm, tipoSanguineo: e.target.value})}>
                    <option value="">SELECIONE</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alergias</label>
                  <input type="text" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold h-[52px] uppercase" value={urgenciaForm.alergias} onChange={e => setUrgenciaForm({...urgenciaForm, alergias: e.target.value.toUpperCase()})} placeholder="EX: PENICILINA, NENHUMA" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Telefone de Contato</label>
                  <input type="text" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold h-[52px]" value={urgenciaForm.telefone} onChange={e => setUrgenciaForm({...urgenciaForm, telefone: maskPhone(e.target.value)})} placeholder="(00) 00000-0000" />
                </div>
              </div>
            </div>

            {/* SECTION: ENDEREÇO */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center text-[10px]">04</span>
                Endereço de Residência
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logradouro (Rua/Avenida)</label>
                  <input type="text" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold uppercase" value={urgenciaForm.logradouro} onChange={e => setUrgenciaForm({...urgenciaForm, logradouro: e.target.value.toUpperCase()})} placeholder="EX: RUA DAS FLORES" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Número</label>
                  <input type="text" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold" value={urgenciaForm.numero} onChange={e => setUrgenciaForm({...urgenciaForm, numero: e.target.value})} placeholder="S/N" />
                </div>
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bairro</label>
                  <input type="text" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold uppercase" value={urgenciaForm.bairro} onChange={e => setUrgenciaForm({...urgenciaForm, bairro: e.target.value.toUpperCase()})} placeholder="EX: CENTRO" />
                </div>
              </div>
            </div>

            {/* SECTION: RESPONSÁVEL & LOGÍSTICA */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] border-l-4 border-amber-400 pl-4 py-1">
                Responsável & Logística
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Responsável</label>
                  <input type="text" className="w-full p-4 rounded-2xl bg-amber-50/20 border border-amber-100 outline-none text-sm font-bold uppercase" value={urgenciaForm.responsavel} onChange={e => setUrgenciaForm({...urgenciaForm, responsavel: e.target.value.toUpperCase()})} placeholder="NOME DO RESPONSÁVEL" />
                </div>
                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Grau de Parentesco</label>
                  <input type="text" className="w-full p-4 rounded-2xl bg-amber-50/20 border border-amber-100 outline-none text-sm font-bold uppercase" value={urgenciaForm.parentesco} onChange={e => setUrgenciaForm({...urgenciaForm, parentesco: e.target.value.toUpperCase()})} placeholder="EX: MÃE, PAI, TIO" />
                </div>
                <div className="md:col-span-5 space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Como o Paciente chegou?</label>
                   <div className="flex flex-wrap gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                      {['ANDANDO', 'AMBULÂNCIA', 'AUTOMÓVEL', 'MOTOCICLETA', 'OUTROS'].map(mode => (
                        <button 
                          key={mode} type="button" 
                          onClick={() => setUrgenciaForm({...urgenciaForm, arrivalMode: mode})}
                          className={`px-3 py-2 rounded-xl text-[9px] font-black transition-all ${urgenciaForm.arrivalMode === mode ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                          {mode}
                        </button>
                      ))}
                   </div>
                </div>
              </div>
            </div>

            {/* SECTION: ACOLHIMENTO (SINAIS VITAIS) */}
            <div className="space-y-6 bg-slate-50/50 p-6 md:p-8 rounded-[40px] border border-slate-100">
              <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-xs">
                  <i className="fas fa-heart-pulse"></i>
                </div>
                Acolhimento - Sinais Vitais
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'PA (mmHg)', key: 'vitalsPa', placeholder: '120/80' },
                  { label: 'FC (bpm)', key: 'vitalsFc', placeholder: '80' },
                  { label: 'FR (rpm)', key: 'vitalsFr', placeholder: '16' },
                  { label: 'SAT (SpO2)', key: 'vitalsSat', placeholder: '98%' },
                  { label: 'Glicemia (mg/dL)', key: 'vitalsGlicemia', placeholder: '90' },
                  { label: 'Temp (°C)', key: 'vitalsTemp', placeholder: '36.5' },
                  { label: 'BCF (bpm)', key: 'vitalsBcf', placeholder: '---' },
                  { label: 'Peso (Kg)', key: 'vitalsPeso', placeholder: '70' },
                  { label: 'Altura (m)', key: 'vitalsAltura', placeholder: '1.70' },
                ].map(field => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{field.label}</label>
                    <input 
                      type="text" 
                      className="w-full p-3 rounded-xl bg-white border border-gray-100 outline-none text-xs font-bold focus:ring-2 focus:ring-emerald-500 transition-all" 
                      value={(urgenciaForm as any)[field.key]} 
                      onChange={e => setUrgenciaForm({ ...urgenciaForm, [field.key]: e.target.value })} 
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION: HISTÓRICO E RISCO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               {/* HISTORICO */}
               <div className="space-y-6">
                 <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">Histórico Clínico</h3>
                 <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Hipertensão', key: 'hasHypertension' },
                      { label: 'Tabagismo', key: 'hasSmoking' },
                      { label: 'Diabetes', key: 'hasDiabetes' },
                      { label: 'Alergia Med.', key: 'hasDrugAllergy' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                        <span className="text-[10px] font-bold text-slate-600 uppercase">{item.label}</span>
                        <button 
                          type="button"
                          onClick={() => setUrgenciaForm({...urgenciaForm, [item.key]: !(urgenciaForm as any)[item.key]})}
                          className={`w-10 h-6 rounded-full transition-all relative ${ (urgenciaForm as any)[item.key] ? 'bg-emerald-500' : 'bg-gray-300' }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${ (urgenciaForm as any)[item.key] ? 'left-5' : 'left-1' }`}></div>
                        </button>
                      </div>
                    ))}
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quais Alergias?</label>
                    <input type="text" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold uppercase" value={urgenciaForm.drugAllergiesList} onChange={e => setUrgenciaForm({...urgenciaForm, drugAllergiesList: e.target.value.toUpperCase()})} placeholder="EX: DIPIRONA, PENICILINA" />
                 </div>
                 <div className="space-y-1.5">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Internação Anterior?</label>
                      <button 
                        type="button"
                        onClick={() => setUrgenciaForm({...urgenciaForm, previousHospitalization: !urgenciaForm.previousHospitalization})}
                        className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${ urgenciaForm.previousHospitalization ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500' }`}
                      >
                        {urgenciaForm.previousHospitalization ? 'SIM' : 'NÃO'}
                      </button>
                    </div>
                    {urgenciaForm.previousHospitalization && (
                      <input type="text" className="w-full p-4 rounded-2xl bg-blue-50 border border-blue-100 outline-none text-sm font-bold uppercase animate-in slide-in-from-top-2" value={urgenciaForm.hospitalizationReasonLocal} onChange={e => setUrgenciaForm({...urgenciaForm, hospitalizationReasonLocal: e.target.value.toUpperCase()})} placeholder="MOTIVO E LOCAL" />
                    )}
                 </div>
               </div>

               {/* CLASSIFICAÇÃO E DOR */}
               <div className="space-y-8">
                 <div className="space-y-4">
                    <h3 className="text-xs font-black text-rose-600 uppercase tracking-[0.2em] flex items-center gap-2">
                       Classificação de Risco
                       <i className="fas fa-triangle-exclamation"></i>
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { id: 'VERMELHO', color: 'bg-red-500', label: 'EMERGÊNCIA' },
                        { id: 'LARANJA', color: 'bg-orange-500', label: 'MUITO URGENTE' },
                        { id: 'AMARELO', color: 'bg-yellow-400', label: 'URGENTE' },
                        { id: 'VERDE', color: 'bg-emerald-500', label: 'POUCO URGENTE' },
                        { id: 'AZUL', color: 'bg-blue-500', label: 'NÃO URGENTE' },
                      ].map(risk => (
                        <button 
                          key={risk.id} type="button"
                          onClick={() => setUrgenciaForm({...urgenciaForm, riskClassification: risk.id})}
                          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all border-2 ${urgenciaForm.riskClassification === risk.id ? 'border-slate-800 scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                          <div className={`w-8 h-8 rounded-full ${risk.color}`}></div>
                          <span className="text-[7px] font-black text-center leading-tight uppercase">{risk.label}</span>
                        </button>
                      ))}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center justify-between">
                       Escala de Dor 
                       <span className="text-lg font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">{urgenciaForm.painScale}</span>
                    </h3>
                    <div className="relative px-2">
                       <input 
                         type="range" min="0" max="10" 
                         className="w-full h-2 bg-gradient-to-r from-emerald-400 via-yellow-400 to-red-500 rounded-lg appearance-none cursor-pointer accent-blue-600"
                         value={urgenciaForm.painScale} 
                         onChange={e => setUrgenciaForm({...urgenciaForm, painScale: parseInt(e.target.value)})}
                       />
                       <div className="flex justify-between mt-2">
                          {[0, 2, 4, 6, 8, 10].map(n => (
                            <span key={n} className="text-[10px] font-black text-gray-300">{n}</span>
                          ))}
                       </div>
                    </div>
                 </div>
               </div>
            </div>

            {/* SECTION: AVALIAÇÃO CLÍNICA */}
            <div className="space-y-6 pt-6 border-t border-gray-100">
               <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">Avaliação Clínica e Procedimentos</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sinais e Sintomas</label>
                    <textarea 
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold uppercase min-h-[100px]" 
                      value={urgenciaForm.signsSymptoms} onChange={e => setUrgenciaForm({...urgenciaForm, signsSymptoms: e.target.value.toUpperCase()})}
                      placeholder="DESCREVA OS SINTOMAS APRESENTADOS"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">História Clínica / Exame Físico</label>
                    <textarea 
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold uppercase min-h-[100px]" 
                      value={urgenciaForm.clinicalHistoryExam} onChange={e => setUrgenciaForm({...urgenciaForm, clinicalHistoryExam: e.target.value.toUpperCase()})}
                      placeholder="BREVE HISTÓRICO E RESULTADO DO EXAME FÍSICO"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Procedimentos Realizados</label>
                    <textarea 
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold uppercase min-h-[100px]" 
                      value={urgenciaForm.proceduresDone} onChange={e => setUrgenciaForm({...urgenciaForm, proceduresDone: e.target.value.toUpperCase()})}
                      placeholder="PROCEDIMENTOS E CONDUTAS"
                    />
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Diagnóstico Provável</label>
                      <input type="text" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold uppercase" value={urgenciaForm.probableDiagnosis} onChange={e => setUrgenciaForm({...urgenciaForm, probableDiagnosis: e.target.value.toUpperCase()})} placeholder="DIAGNÓSTICO HIPOTÉTICO" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CID 10</label>
                      <input type="text" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold uppercase" value={urgenciaForm.cid10} onChange={e => setUrgenciaForm({...urgenciaForm, cid10: e.target.value.toUpperCase()})} placeholder="CÓDIGO CID 10" />
                    </div>
                  </div>
               </div>
            </div>

            {/* ACTION BUTTONS: PREVIEW, DOWNLOAD, FINISH */}
            <div className="pt-10 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => handleUrgencyPDF('view')}
                  className="flex-1 bg-blue-50 text-blue-600 font-black py-4 rounded-2xl hover:bg-blue-100 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                >
                  <i className="fas fa-eye"></i> Visualizar Ficha
                </button>
                <button 
                  type="button"
                  onClick={() => handleUrgencyPDF('download')}
                  className="flex-1 bg-amber-50 text-amber-600 font-black py-4 rounded-2xl hover:bg-amber-100 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                >
                  <i className="fas fa-download"></i> Baixar PDF
                </button>
              </div>

              <button 
                type="submit" 
                disabled={isAdding}
                className={`w-full text-white font-black py-6 rounded-[32px] shadow-2xl transition-all uppercase tracking-[0.3em] text-sm flex items-center justify-center gap-4 ${
                  isAdding ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-1 active:translate-y-0'
                }`}
              >
                {isAdding ? (
                  <>
                    <i className="fas fa-spinner fa-spin text-xl"></i>
                    EFETUANDO CADASTRO...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-double text-xl"></i>
                    Finalizar Cadastro de Urgência
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-6">
                AO FINALIZAR, O PACIENTE SERÁ INCLUÍDO NA FILA DE ATENDIMENTO COM STATUS DE URGÊNCIA
              </p>
            </div>
          </form>
        </div>
      )}

      {/* HIDDEN PDF TEMPLATE */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
        <div ref={urgencyRef} style={{ width: '210mm', padding: '15mm', backgroundColor: '#fff', color: '#000', fontFamily: 'Arial, sans-serif' }}>
          {/* PDF HEADER */}
          <div style={{ border: '2px solid #000', padding: '10px', marginBottom: '15px', position: 'relative' }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 5px 0' }}>REGISTRO DE ATENDIMENTO HOSPITALAR</h1>
              <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #000', paddingTop: '5px' }}>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: '0', fontSize: '12px', fontWeight: 'bold' }}>RECEPÇÃO</p>
                </div>
                <div>
                  <p style={{ margin: '0', fontSize: '10px' }}>Data de Atendimento: {urgenciaForm.dataAtendimento.split('-').reverse().join('/')}</p>
                  <p style={{ margin: '0', fontSize: '10px' }}>Hora: {urgenciaForm.horaAtendimento}</p>
                </div>
                <div style={{ borderLeft: '1px solid #000', paddingLeft: '10px' }}>
                  <p style={{ margin: '0', fontSize: '9px' }}>UARINI / AM</p>
                  <p style={{ margin: '0', fontSize: '9px' }}>Laboratório Municipal de Uarini</p>
                </div>
              </div>
            </div>
          </div>

          {/* PATIENT INFO */}
          <div style={{ border: '1px solid #000', marginBottom: '10px' }}>
            <div style={{ borderBottom: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0' }}>
              <p style={{ margin: '0', fontSize: '10px', fontWeight: 'bold' }}>01. IDENTIFICAÇÃO DO PACIENTE</p>
            </div>
            <div style={{ padding: '8px', fontSize: '10px' }}>
              <p style={{ marginBottom: '6px' }}><strong>Nome:</strong> {urgenciaForm.nomeCompleto}</p>
              <div style={{ display: 'flex', gap: '30px', marginBottom: '6px' }}>
                <p><strong>Mãe:</strong> {urgenciaForm.mae}</p>
                <p><strong>Pai:</strong> {urgenciaForm.pai}</p>
              </div>
              <div style={{ display: 'flex', gap: '30px', marginBottom: '6px' }}>
                <p><strong>CPF:</strong> {urgenciaForm.cpf}</p>
                <p><strong>SUS:</strong> {urgenciaForm.sus}</p>
                <p><strong>Reside Urini:</strong> {urgenciaForm.resideUarini ? 'SIM' : 'NÃO'}</p>
              </div>
              <div style={{ display: 'flex', gap: '30px', marginBottom: '6px' }}>
                <p><strong>Nasc.:</strong> {urgenciaForm.dataNascimento?.split('-').reverse().join('/')}</p>
                <p><strong>Idade:</strong> {urgenciaForm.idade}</p>
                <p><strong>Sexo:</strong> {urgenciaForm.sexo}</p>
                <p><strong>Estado Civil:</strong> {urgenciaForm.estadoCivil}</p>
              </div>
              <div style={{ display: 'flex', gap: '30px' }}>
                <p><strong>Naturalidade:</strong> {urgenciaForm.naturalidade}</p>
                <p><strong>Raça/Cor:</strong> {urgenciaForm.raca}</p>
                <p><strong>Tipo Sanguíneo:</strong> {urgenciaForm.tipoSanguineo}</p>
              </div>
            </div>
          </div>

          {/* ADDRESS & LOGISTICS */}
          <div style={{ border: '1px solid #000', marginBottom: '10px' }}>
            <div style={{ padding: '8px', fontSize: '10px' }}>
              <p style={{ marginBottom: '6px' }}><strong>Endereço:</strong> {urgenciaForm.logradouro}, Nº {urgenciaForm.numero} - Bairro: {urgenciaForm.bairro}</p>
              <div style={{ display: 'flex', gap: '30px', marginBottom: '6px' }}>
                <p><strong>Telefone:</strong> {urgenciaForm.telefone}</p>
                <p><strong>Como chegou:</strong> {urgenciaForm.arrivalMode}</p>
              </div>
              <p><strong>Responsável:</strong> {urgenciaForm.responsavel} ({urgenciaForm.parentesco})</p>
            </div>
          </div>

          {/* ACOLHIMENTO / VITALS */}
          <div style={{ border: '1px solid #000', marginBottom: '10px' }}>
            <div style={{ borderBottom: '1px solid #000', padding: '4px 8px', backgroundColor: '#f0f0f0', textAlign: 'center' }}>
              <p style={{ margin: '0', fontSize: '10px', fontWeight: 'bold' }}>ACOLHIMENTO / TRIAGEM</p>
            </div>
            <div style={{ display: 'flex', fontSize: '9px' }}>
              <div style={{ flex: '1', padding: '8px', borderRight: '1px solid #000' }}>
                <p style={{ marginBottom: '4px' }}><strong>PA:</strong> {urgenciaForm.vitalsPa} mmHg</p>
                <p style={{ marginBottom: '4px' }}><strong>FC:</strong> {urgenciaForm.vitalsFc} bpm</p>
                <p style={{ marginBottom: '4px' }}><strong>FR:</strong> {urgenciaForm.vitalsFr} rpm</p>
                <p style={{ marginBottom: '4px' }}><strong>SAT:</strong> {urgenciaForm.vitalsSat}</p>
                <p style={{ marginBottom: '4px' }}><strong>Temp:</strong> {urgenciaForm.vitalsTemp} °C</p>
              </div>
              <div style={{ flex: '1', padding: '8px', borderRight: '1px solid #000' }}>
                <p style={{ marginBottom: '4px' }}><strong>Hipotensão:</strong> {urgenciaForm.hasHypertension ? 'SIM' : 'NÃO'}</p>
                <p style={{ marginBottom: '4px' }}><strong>Diabetes:</strong> {urgenciaForm.hasDiabetes ? 'SIM' : 'NÃO'}</p>
                <p style={{ marginBottom: '4px' }}><strong>Tabagismo:</strong> {urgenciaForm.hasSmoking ? 'SIM' : 'NÃO'}</p>
                <p style={{ marginBottom: '4px' }}><strong>Glicemia:</strong> {urgenciaForm.vitalsGlicemia} mg/dL</p>
                <p style={{ marginBottom: '4px' }}><strong>Alergias:</strong> {urgenciaForm.hasDrugAllergy ? `SIM (${urgenciaForm.drugAllergiesList})` : 'NÃO'}</p>
              </div>
              <div style={{ flex: '1', padding: '8px', backgroundColor: urgenciaForm.riskClassification === 'VERMELHO' ? '#fee2e2' : '' }}>
                <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px', marginBottom: '10px' }}>RISCO CLÍNICO</p>
                <div style={{ 
                  backgroundColor: urgenciaForm.riskClassification === 'VERMELHO' ? '#ef4444' : 
                                   urgenciaForm.riskClassification === 'LARANJA' ? '#f97316' :
                                   urgenciaForm.riskClassification === 'AMARELO' ? '#facc15' :
                                   urgenciaForm.riskClassification === 'VERDE' ? '#10b981' :
                                   urgenciaForm.riskClassification === 'AZUL' ? '#3b82f6' : '#eee',
                  color: urgenciaForm.riskClassification === 'AMARELO' ? '#000' : '#fff',
                  padding: '10px', textAlign: 'center', fontWeight: 'black', borderRadius: '8px'
                }}>
                  {urgenciaForm.riskClassification || 'NÃO DEFINIDO'}
                </div>
                <p style={{ textAlign: 'center', marginTop: '10px' }}><strong>Escala de Dor:</strong> {urgenciaForm.painScale}/10</p>
              </div>
            </div>
          </div>

          {/* CLINICAL EVALUATION */}
          <div style={{ border: '1px solid #000', marginBottom: '10px' }}>
            <div style={{ padding: '8px', fontSize: '10px' }}>
              <p style={{ marginBottom: '10px' }}><strong>Sinais e Sintomas:</strong><br />{urgenciaForm.signsSymptoms}</p>
              <p style={{ marginBottom: '10px' }}><strong>História Clínica:</strong><br />{urgenciaForm.clinicalHistoryExam}</p>
              <p style={{ marginBottom: '10px' }}><strong>Procedimentos:</strong><br />{urgenciaForm.proceduresDone}</p>
              <div style={{ display: 'flex', gap: '30px', borderTop: '1px solid #000', paddingTop: '8px' }}>
                 <p style={{ flex: '1' }}><strong>Diag. Provável:</strong> {urgenciaForm.probableDiagnosis}</p>
                 <p style={{ width: '120px' }}><strong>CID 10:</strong> {urgenciaForm.cid10}</p>
              </div>
            </div>
          </div>

          {/* FOOTER / SIGNATURE */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', fontSize: '10px' }}>
            <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid #000', paddingTop: '5px' }}>
              <p>Assinatura do Paciente ou Responsável</p>
            </div>
            <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid #000', paddingTop: '5px' }}>
              <p>Carimbo e Assinatura Profissional</p>
            </div>
          </div>
          <p style={{ fontSize: '8px', color: '#888', textAlign: 'right', marginTop: '20px' }}>Gerado digitalmente via Sistema do Laboratório Municipal de Uarini</p>
        </div>
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
                    <div className="flex flex-wrap gap-2 mt-1">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{app.patientBirthDate ? `NASC: ${app.patientBirthDate.split('-').reverse().join('/')}` : 'DATA NASC. NÃO INFORMADA'}</p>
                      {app.patientPhone && <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest flex items-center gap-1"><i className="fas fa-phone text-[8px]"></i> {app.patientPhone}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4 mt-4 md:mt-0">
                  <div className="text-right">
                    <p className={`text-[9px] font-black uppercase tracking-widest ${app.status === 'URGÊNCIA' ? 'text-red-500' : 'text-blue-500'}`}>
                      {app.status === 'URGÊNCIA' ? (
                        <span className="flex items-center gap-1 justify-end animate-pulse">
                          <i className="fas fa-triangle-exclamation"></i>
                          URGÊNCIA
                        </span>
                      ) : 'COLETA LABORATORIAL'}
                    </p>
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
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Telefone / Celular</label>
                    <input 
                      type="text" 
                      placeholder="(00) 00000-0000"
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold" 
                      value={newApp.patientPhone} 
                      onChange={e => setNewApp({ ...newApp, patientPhone: maskPhone(e.target.value) })} 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cartão SUS</label>
                    <input 
                      type="text" 
                      placeholder="000 0000 0000 0000"
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold" 
                      value={newApp.patientSusNumber} 
                      onChange={e => setNewApp({ ...newApp, patientSusNumber: maskSUS(e.target.value) })} 
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Idade</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 25"
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold" 
                      value={newApp.patientAge} 
                      onChange={e => setNewApp({ ...newApp, patientAge: maskAge(e.target.value) })} 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sexo</label>
                    <select className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-xs font-bold" value={newApp.patientGender} onChange={e => setNewApp({ ...newApp, patientGender: e.target.value })}>
                      <option value="">Selecione</option>
                      <option value="MASCULINO">MASC</option>
                      <option value="FEMININO">FEM</option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data</label>
                    <input required type="date" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-xs font-bold" value={newApp.date} onChange={e => setNewApp({ ...newApp, date: e.target.value })} />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hora</label>
                    <input required type="time" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-xs font-bold px-2" value={newApp.time} onChange={e => setNewApp({ ...newApp, time: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Endereço (Rua/Bairro)</label>
                    <input 
                      type="text"
                      placeholder="Ex: Rua das Flores, Bairro Centro"
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold" 
                      value={newApp.patientAddress} 
                      onChange={e => setNewApp({ ...newApp, patientAddress: e.target.value })} 
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Número</label>
                    <input 
                      type="text"
                      placeholder="Nº"
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none text-sm font-bold" 
                      value={newApp.patientAddressNumber} 
                      onChange={e => setNewApp({ ...newApp, patientAddressNumber: e.target.value })} 
                    />
                  </div>
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
              <div className="grid grid-cols-8 gap-4 mb-4 pb-4 border-b border-gray-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Horário</span>
                <span>Paciente</span>
                <span>Contato</span>
                <span>Nascimento</span>
                <span>Idade</span>
                <span>SUS</span>
                <span>Endereço</span>
                <span>Data</span>
              </div>

              <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
                {filtered.length > 0 ? filtered.map(app => (
                  <div key={app.id} className="grid grid-cols-8 gap-4 py-3 items-center border-b border-gray-50 last:border-0">
                    <span className="text-sm font-black text-blue-600 bg-blue-50 w-fit px-3 py-1 rounded-lg">{app.time}</span>
                    <span className="text-sm font-bold text-slate-700">{app.patientName}</span>
                    <span className="text-[10px] font-medium text-blue-600">{app.patientPhone || '-'}</span>
                    <span className="text-xs font-medium text-slate-500">{app.patientBirthDate?.split('-').reverse().join('/') || '-'}</span>
                    <span className="text-xs font-medium text-slate-500">{app.patientAge || '-'}</span>
                    <span className="text-xs font-medium text-slate-500 truncate">{app.patientSusNumber || '-'}</span>
                    <span className="text-[10px] font-medium text-slate-400 truncate max-w-[150px]" title={`${app.patientAddress}, ${app.patientAddressNumber}`}>{app.patientAddress}{app.patientAddressNumber ? `, ${app.patientAddressNumber}` : ''}</span>
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
