
import React, { useState, useMemo, useEffect } from 'react';
import { User, ExamResult } from '../types';
import { suggestMedicalDiagnosis } from '../services/geminiService';
import ProfileTab from '../components/ProfileTab';
import DashboardTabs from '../components/DashboardTabs';
import { maskCPF } from '../services/masks';
import { dbService } from '../services/apiService';
import { extractTextFromPDF } from '../services/pdfOcr';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

interface MedicalDashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const MedicalDashboard: React.FC<MedicalDashboardProps> = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'trabalho' | 'perfil'>('trabalho');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<'text' | 'calendar'>('text');
  const [selectedDay, setSelectedDay] = useState<number>(0); // 0 = Todos
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0 = Todos
  const [selectedWeekday, setSelectedWeekday] = useState<number>(-1); // -1 = Todos
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const weekdays = [
    { value: -1, label: 'Todos' },
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' },
  ];

  const months = [
    { value: 0, label: 'Todos' },
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Estado para armazenar exames carregados do Supabase
  const [allExams, setAllExams] = useState<ExamResult[]>([]);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await dbService.from('exams').select({}, { column: 'created_at', ascending: false });
        const mappedExams = (data || []).map((e: any) => ({
          id: e.id,
          patientId: e.patient_id,
          patientName: e.patient_name,
          patientCpf: e.patient_cpf,
          examName: e.exam_name,
          date: e.date,
          status: e.status,
          resultData: e.result_data,
          aiAnalysis: e.ai_analysis,
          fileUrl: e.file_url,
          category: e.category || 'Geral',
          requestingUnit: e.requesting_unit,
          previousValue: e.previous_value
        }));
        setAllExams(mappedExams);
      } catch (error) {
        console.error('Error fetching medical exams:', error);
      }
    };
    fetchExams();
  }, [activeTab]);

  const [selectedExam, setSelectedExam] = useState<ExamResult | null>(null);
  const [viewingExam, setViewingExam] = useState<ExamResult | null>(null);
  const [resultInput, setResultInput] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (selectedExam) {
      fetchPatientData(selectedExam.patientCpf);
      fetchPatientHistory(selectedExam.patientCpf);
    } else {
      setPatientProfile(null);
      setDoctorNote('');
      setPatientHistory([]);
    }
  }, [selectedExam]);

  // Estados para Histórico e Gráficos
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [graphModalOpen, setGraphModalOpen] = useState(false);
  const [patientHistory, setPatientHistory] = useState<ExamResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [graphTimeRange, setGraphTimeRange] = useState<30 | 90 | 180>(90);
  const [selectedParam, setSelectedParam] = useState<string>('');

  // Novos Estados
  const [patientProfile, setPatientProfile] = useState<User | null>(null);
  const [doctorNote, setDoctorNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const fetchPatientData = async (cpf: string) => {
    if (!cpf) return;

    try {
      const profileData = await dbService.from('profiles').select({ cpf }).then(res => res[0]);
      if (profileData) {
        setPatientProfile({
          id: profileData.id,
          name: profileData.name,
          cpf: profileData.cpf,
          sus_number: profileData.sus_number,
          role: profileData.role,
          avatar: profileData.avatar,
          age: profileData.age,
          gender: profileData.gender
        });
      }

      const noteData = await dbService.from('doctor_notes').select({
        doctor_id: user.id,
        patient_cpf: cpf
      }).then(res => res[0]);

      setDoctorNote(noteData?.content || '');
    } catch (err) {
      console.error('Error fetching patient data:', err);
    }
  };

  const saveDoctorNote = async (content: string) => {
    if (!selectedExam) return;
    setIsSavingNote(true);
    try {
      await dbService.from('doctor_notes').upsert({
        doctor_id: user.id,
        patient_cpf: selectedExam.patientCpf,
        content: content,
        updated_at: new Date().toISOString()
      }, ['doctor_id', 'patient_cpf']);
    } catch (error) {
      console.error('Error saving note:', error);
    }
    setIsSavingNote(false);
  };

  const fetchPatientHistory = async (cpf: string) => {
    if (!cpf) return;
    setLoadingHistory(true);
    try {
      const data = await dbService.from('exams').select({
        patient_cpf: cpf,
        status: 'READY'
      }, { column: 'date', ascending: true });

      // mapped logic follows
      const mapped = (data || []).map((e: any) => ({
        id: e.id,
        patientId: e.patient_id,
        patientName: e.patient_name,
        patientCpf: e.patient_cpf,
        examName: e.exam_name,
        date: e.date,
        status: e.status,
        resultData: e.result_data,
        aiAnalysis: e.ai_analysis,
        fileUrl: e.file_url,
        category: e.category || 'Geral',
        requestingUnit: e.requesting_unit,
        previousValue: e.previous_value
      }));
      setPatientHistory(mapped);
      // Auto-selecionar o primeiro parâmetro disponível para o gráfico
      if (mapped.length > 0) {
        const firstValues = parseExamValues(mapped[0].resultData || '');
        const params = Object.keys(firstValues);
        if (params.length > 0 && !selectedParam) {
          setSelectedParam(params[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching patient history:', err);
    }
    setLoadingHistory(false);
  };

  const parseExamValues = (text: string) => {
    const values: Record<string, number> = {};
    if (!text) return values;
    const lines = text.split('\n');
    lines.forEach(line => {
      // Procura por "Nome: Valor" ou "Nome: Valor Unidade"
      const match = line.match(/^([^:]+):\s*([\d.,]+)/);
      if (match) {
        const param = match[1].trim().toUpperCase();
        const valStr = match[2].replace(',', '.');
        const val = parseFloat(valStr);
        if (!isNaN(val)) {
          values[param] = val;
        }
      }
    });
    return values;
  };

  const graphData = useMemo(() => {
    if (!selectedParam || patientHistory.length === 0) return [];

    // Calcular data de corte baseada no graphTimeRange (30, 90, 180 dias)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - graphTimeRange);

    return patientHistory.map(exam => {
      const parts = exam.date.split('/');
      if (parts.length !== 3) return null;
      // Assume DD/MM/YYYY
      const examDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));

      const values = parseExamValues(exam.resultData || '');
      return {
        date: exam.date,
        timestamp: examDate.getTime(),
        value: values[selectedParam] || null,
        examName: exam.examName
      };
    })
      .filter(d => d !== null && d.value !== null && d.timestamp >= cutoffDate.getTime())
      .sort((a, b) => a!.timestamp - b!.timestamp);
  }, [patientHistory, selectedParam, graphTimeRange]);

  const availableParams = useMemo(() => {
    const params = new Set<string>();
    patientHistory.forEach(exam => {
      const values = parseExamValues(exam.resultData || '');
      Object.keys(values).forEach(p => params.add(p));
    });
    return Array.from(params);
  }, [patientHistory]);

  // Filtro por Nome ou CPF ou Dia da Semana/Ano
  const filteredExams = useMemo(() => {
    if (searchMode === 'text') {
      const searchClean = searchTerm.replace(/\D/g, '');
      return allExams.filter(exam =>
        exam.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (searchClean && exam.patientCpf?.replace(/\D/g, '').includes(searchClean))
      );
    } else {
      return allExams.filter(exam => {
        // exam.date is in DD/MM/YYYY
        const parts = exam.date.split('/');
        if (parts.length !== 3) return false;
        const d = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        const y = parseInt(parts[2]);
        const date = new Date(y, m - 1, d);

        const matchDay = selectedDay === 0 || d === selectedDay;
        const matchMonth = selectedMonth === 0 || m === selectedMonth;
        const matchYear = selectedYear === 0 || y === selectedYear;
        const matchWeekday = selectedWeekday === -1 || date.getDay() === selectedWeekday;

        return matchDay && matchMonth && matchYear && matchWeekday;
      });
    }
  }, [searchTerm, allExams, searchMode, selectedDay, selectedMonth, selectedWeekday, selectedYear]);

  const handleSaveResult = async () => {
    if (!selectedExam) return;

    try {
      await dbService.from('exams').update({
        status: 'READY',
        result_data: resultInput
      }, { id: selectedExam.id });

      setAllExams(prev => prev.map(e =>
        e.id === selectedExam.id ? { ...e, status: 'READY', resultData: resultInput } : e
      ));
      setSelectedExam(null);
      setResultInput('');
      setAiSuggestion(null);
      alert('Resultado liberado com sucesso!');
    } catch (error: any) {
      alert('Erro ao salvar resultado: ' + error.message);
    }
  };

  const getAiHelp = async () => {
    if (!resultInput) return;
    setLoadingAi(true);
    const suggestion = await suggestMedicalDiagnosis(resultInput);
    setAiSuggestion(suggestion);
    setLoadingAi(false);
  };

  const compareWithPrevious = (current: string, previous?: string) => {
    if (!previous) return { status: 'Estável', diff: '0%', icon: 'fa-minus' };
    const curVal = parseFloat(current.replace(',', '.'));
    const preVal = parseFloat(previous.replace(',', '.'));
    if (isNaN(curVal) || isNaN(preVal)) return { status: 'Estável', diff: '---', icon: 'fa-minus' };

    const diff = ((curVal - preVal) / preVal) * 100;
    const diffAbs = curVal - preVal;

    if (diff > 5) return { status: 'Aumento', diff: `${diff.toFixed(1)}%`, icon: 'fa-arrow-trend-up', color: 'text-red-500' };
    if (diff < -5) return { status: 'Queda', diff: `${diff.toFixed(1)}%`, icon: 'fa-arrow-trend-down', color: 'text-blue-500' };
    return { status: 'Estável', diff: `${diff.toFixed(1)}%`, icon: 'fa-minus', color: 'text-gray-400' };
  };

  const examsByCategory = useMemo(() => {
    const groups: Record<string, ExamResult[]> = {};
    filteredExams.forEach(ex => {
      const cat = ex.category || 'Outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ex);
    });
    return groups;
  }, [filteredExams]);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedExam) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    setUploading(true);
    try {
      // TODO: Implement Neon-compatible storage (e.g. Vercel Blob)
      alert('O armazenamento via Supabase está desativado devido à migração para o Neon. Configure um novo serviço de arquivos (ex: Vercel Blob).');
    } catch (err: any) {
      console.error('Upload error:', err);
      alert('Erro no upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!selectedExam || !selectedExam.fileUrl) return;
    if (!confirm('Deseja realmente remover este laudo anexado?')) return;

    setUploading(true);
    try {
      // TODO: Implement Neon-compatible storage cleanup
      alert('Ação desativada devido à migração do Storage.');
    } catch (err: any) {
      alert('Erro ao remover: ' + err.message);
    } finally {
      setUploading(false);
    }
  };


  const handleDownloadPatientPDF = (exam: ExamResult) => {
    if (exam.fileUrl) {
      const link = document.createElement("a");
      link.href = exam.fileUrl;
      link.download = `Exame_${exam.patientName.replace(/\s+/g, '_')}_${exam.examName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Simulação de geração de PDF para o paciente específico
      const content = `LABORATÓRIO MUNICIPAL DE UARINI\n\nEXAME: ${exam.examName}\nPACIENTE: ${exam.patientName}\nDATA: ${exam.date}\nSTATUS: ${exam.status}\n\nRESULTADO:\n${exam.resultData || 'Pendente de processamento.'}`;
      const blob = new Blob([content], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Exame_${exam.patientName.replace(/\s+/g, '_')}_${exam.examName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const getExamAlerts = (exam: ExamResult) => {
    const alerts: React.ReactNode[] = [];

    if (exam.resultData) {
      const text = exam.resultData;
      const lower = text.toLowerCase();

      /**
       * Section-aware value extraction.
       * Splits the text into parameter sections and locates a numeric value
       * immediately following "resultado" within the correct section.
       * This prevents false matches from reference range numbers
       * (e.g. "Desejável < 150") that come after the parameter keyword.
       *
       * Strategy:
       * 1. Find the section that starts with the parameter keyword.
       * 2. Within that section, find "resultado" and the first number after it.
       * 3. Return null if no valid number is found.
       *
       * Fallback: if "resultado" is not present (manual text entry), use the
       * first number after the keyword.
       */
      const extractResultValue = (keyword: string): number | null => {
        // Known subsequent section headers – used to bound the current section
        const headers = [
          'glicose', 'glicemia', 'colesterol', 'triglicérides', 'triglicerideos',
          'ureia', 'uréia', 'creatinina', 'hemoglobina', 'hematócrito', 'leucócitos',
          'plaquetas', 'ácido úrico', 'ast', 'alt', 'tgo', 'tgp', 'bilirrubina',
          'proteínas', 'albumina', 'ferritina', 'ferro', 'psa', 'tsh', 't4'
        ];

        const keywordRegex = new RegExp(`(?:${keyword})`);
        const kwMatch = lower.match(keywordRegex);
        if (!kwMatch || kwMatch.index === undefined) return null;

        const sectionStart = kwMatch.index;

        // Find end of section (start of next parameter)
        let sectionEnd = lower.length;
        for (const h of headers) {
          if (h === keyword.split('|')[0]) continue; // skip self
          const idx = lower.indexOf(h, sectionStart + keyword.split('|')[0].length);
          if (idx !== -1 && idx < sectionEnd) sectionEnd = idx;
        }

        const section = lower.slice(sectionStart, sectionEnd);

        // Try: find "resultado" then first number after it in this section
        const resultadoIdx = section.indexOf('resultado');
        if (resultadoIdx !== -1) {
          const afterResultado = section.slice(resultadoIdx + 9); // after "resultado"
          // skip dots, dashes, spaces, ellipsis (but NOT digits)
          const numMatch = afterResultado.match(/[^\d]*?([\d]+[.,]?[\d]*)/);
          if (numMatch && numMatch[1]) {
            const val = parseFloat(numMatch[1].replace(',', '.'));
            if (!isNaN(val)) return val;
          }
        }

        // Fallback: No "resultado" found (manual text). Take first number in section.
        const fallbackMatch = section.match(/[\d]+[.,]?[\d]*/);
        if (fallbackMatch) {
          const val = parseFloat(fallbackMatch[0].replace(',', '.'));
          if (!isNaN(val)) return val;
        }

        return null;
      };

      const hg = extractResultValue('hemoglobina|hg\\b');
      if (hg !== null && hg < 10 && hg > 0) {
        alerts.push(
          <div key="hg" className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 animate-pulse">
            <i className="fas fa-triangle-exclamation text-red-500 text-lg"></i>
            <div>
              <p className="text-[10px] font-black text-red-800 uppercase tracking-widest">Alerta: Hemoglobina</p>
              <p className="text-xs font-bold text-red-600">Anemia severa detectada ({hg}g/dL).</p>
            </div>
          </div>
        );
      }

      const glic = extractResultValue('glicose|glicemia|glic');
      if (glic !== null && glic > 125) {
        alerts.push(
          <div key="glic" className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
            <i className="fas fa-circle-exclamation text-amber-500 text-lg"></i>
            <div>
              <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Alerta: Glicemia</p>
              <p className="text-xs font-bold text-amber-600">Glicemia elevada ({glic}mg/dL).</p>
            </div>
          </div>
        );
      }

      const col = extractResultValue('colesterol total|colesterol');
      if (col !== null && col >= 200) {
        alerts.push(
          <div key="col" className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
            <i className="fas fa-heart-pulse text-amber-500 text-lg"></i>
            <div>
              <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Alerta: Colesterol</p>
              <p className="text-xs font-bold text-amber-600">Colesterol Total elevado ({col}mg/dL).</p>
            </div>
          </div>
        );
      }

      const tri = extractResultValue('triglicérides|triglicerideos|triglic');
      if (tri !== null && tri >= 150) {
        alerts.push(
          <div key="tri" className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
            <i className="fas fa-flask text-amber-500 text-lg"></i>
            <div>
              <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Alerta: Triglicérides</p>
              <p className="text-xs font-bold text-amber-600">Triglicérides elevado ({tri}mg/dL).</p>
            </div>
          </div>
        );
      }

      const urico = extractResultValue('ácido úrico|acido urico|urico');
      if (urico !== null && urico >= 7) {
        alerts.push(
          <div key="urico" className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
            <i className="fas fa-vial text-amber-500 text-lg"></i>
            <div>
              <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Alerta: Ácido Úrico</p>
              <p className="text-xs font-bold text-amber-600">Ácido Úrico elevado ({urico}mg/dL).</p>
            </div>
          </div>
        );
      }

      const creat = extractResultValue('creatinina');
      if (creat !== null && creat > 1.2) {
        alerts.push(
          <div key="creat" className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
            <i className="fas fa-kidneys text-amber-500 text-lg"></i>
            <div>
              <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Alerta: Creatinina</p>
              <p className="text-xs font-bold text-amber-600">Creatinina elevada ({creat}mg/dL).</p>
            </div>
          </div>
        );
      }

      if (lower.includes('crítico') || lower.includes('critico')) {
        alerts.push(
          <div key="crit" className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
            <i className="fas fa-radiation text-red-500 text-lg"></i>
            <div>
              <p className="text-[10px] font-black text-red-800 uppercase tracking-widest">Alerta Sistêmico</p>
              <p className="text-xs font-bold text-red-600">Valor de pânico reportado.</p>
            </div>
          </div>
        );
      }
    }

    if (alerts.length === 0) {
      if (!exam.resultData) {
        alerts.push(
          <div key="nodata" className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
            <i className="fas fa-file-pdf text-slate-400 text-lg"></i>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Análise por PDF</p>
              <p className="text-xs font-bold text-slate-400">Verifique o documento original abaixo.</p>
            </div>
          </div>
        );
      } else {
        alerts.push(
          <div key="stable" className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
            <i className="fas fa-shield-check text-emerald-500 text-lg"></i>
            <div>
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Parâmetros Estáveis</p>
              <p className="text-xs font-bold text-emerald-600">Sem alterações detectadas.</p>
            </div>
          </div>
        );
      }
    }

    return <>{alerts}</>;
  };

  return (
    <div className="space-y-6">
      <div className="w-fit">
        <DashboardTabs
          tabs={[
            { id: 'trabalho', label: 'Área de Trabalho', icon: 'fa-stethoscope' },
            { id: 'perfil', label: 'Perfil Médico', icon: 'fa-circle-user' },
          ]}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as any)}
        />
      </div>

      {activeTab === 'trabalho' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Coluna de Busca */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
              <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                <i className="fas fa-magnifying-glass text-blue-600"></i>
                Buscar Paciente
              </h2>

              <div className="flex gap-2 mb-6 p-1 bg-gray-50 rounded-xl border border-gray-100">
                <button
                  onClick={() => setSearchMode('text')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${searchMode === 'text' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <i className="fas fa-font mr-2"></i> Busca
                </button>
                <button
                  onClick={() => setSearchMode('calendar')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${searchMode === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <i className="fas fa-calendar-days mr-2"></i> Cronograma
                </button>
              </div>

              {searchMode === 'text' ? (
                <div className="relative mb-6">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input
                    type="text"
                    placeholder="Nome ou CPF..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^\d/.test(v)) setSearchTerm(maskCPF(v));
                      else setSearchTerm(v);
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Dia</label>
                      <select
                        className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                      >
                        <option value={0}>Todos</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Mês</label>
                      <select
                        className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      >
                        {months.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Dia da Semana</label>
                      <select
                        className={`w-full p-3 rounded-xl border border-gray-100 bg-gray-50 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer ${selectedWeekday !== -1 ? 'text-blue-600' : ''}`}
                        value={selectedWeekday}
                        onChange={(e) => setSelectedWeekday(parseInt(e.target.value))}
                      >
                        {weekdays.map(wd => (
                          <option key={wd.value} value={wd.value}>{wd.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Ano</label>
                      <select
                        className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      >
                        <option value={0}>Todos</option>
                        {years.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Resultados da Busca</p>
                {filteredExams.length > 0 ? filteredExams.map(exam => (
                  <div
                    key={exam.id}
                    className={`group w-full flex items-center justify-between p-4 rounded-2xl border transition-all relative overflow-hidden bg-white ${selectedExam?.id === exam.id ? 'border-blue-500 bg-blue-50/50 shadow-md' : 'border-gray-100 hover:border-blue-200'
                      }`}
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full ${exam.status === 'READY' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>

                    <div className="flex-grow">
                      <h3 className="font-black text-slate-800 text-sm truncate max-w-[140px]">{exam.patientName}</h3>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[9px] text-blue-600 font-black uppercase tracking-tight flex items-center gap-1.5">
                          {exam.examName}
                          {exam.fileUrl && <i className="fas fa-paperclip text-[10px] text-indigo-500"></i>}
                        </p>
                        <span className="text-[8px] text-gray-400 font-bold">{exam.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => handleDownloadPatientPDF(exam)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="Baixar PDF do Exame"
                      >
                        <i className="fas fa-file-pdf text-xs"></i>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedExam(exam);
                          if (exam.fileUrl) {
                            setViewingExam(exam);
                          } else {
                            setResultInput(exam.resultData || '');
                            setAiSuggestion(null);
                          }
                        }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm ${selectedExam?.id === exam.id ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                          }`}
                        title="Visualizar Detalhes/Laudo"
                      >
                        <i className="fas fa-eye text-xs"></i>
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="py-10 text-center">
                    <i className="fas fa-user-slash text-3xl text-gray-100 mb-2"></i>
                    <p className="text-gray-400 text-xs font-bold">Nenhum paciente encontrado.</p>
                  </div>
                )}
              </div>


            </div>
          </div>

          {/* Área de Laudo/Processamento */}
          <div className="lg:col-span-2">
            {selectedExam ? (
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 min-h-[600px] space-y-8 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center border-b border-gray-50 pb-6">
                  <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <i className="fas fa-user text-blue-600"></i> {selectedExam.patientName}
                  </h2>
                  <button onClick={() => setSelectedExam(null)} className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all">
                    <i className="fas fa-times"></i>
                  </button>
                </div>



                <div className="space-y-3">
                  {/* Visualização do PDF do Laudo se existir */}
                  {selectedExam.fileUrl && (
                    <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-slate-700 mb-6 flex flex-col items-center">
                      <div className="w-full bg-slate-900 px-4 py-3 flex justify-between items-center border-b border-slate-700">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visualização Expandida</span>
                      </div>
                      <iframe
                        src={`${selectedExam.fileUrl}#view=FitH`}
                        className="bg-white w-full"
                        style={{ height: '800px' }}
                        title="Visualização do Laudo"
                      ></iframe>
                    </div>
                  )}

                  {!selectedExam.fileUrl && (
                    <>
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lançamento de Resultados e Notas Clínicas</label>
                        {selectedExam.status === 'READY' && (
                          <span className="text-[10px] text-emerald-600 font-black flex items-center gap-1">
                            <i className="fas fa-circle-check"></i> RESULTADO JÁ LIBERADO
                          </span>
                        )}
                      </div>
                      <textarea
                        className="w-full h-56 p-6 rounded-[32px] border border-gray-100 bg-gray-50/50 focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none text-sm font-medium text-slate-700 transition-all leading-relaxed"
                        placeholder="Digite os valores observados, referências e observações médicas..."
                        value={resultInput}
                        onChange={(e) => setResultInput(e.target.value)}
                      ></textarea>
                    </>
                  )}
                </div>

                {/* Botões de Ação para Laudo (Apenas se não houver PDF externo) */}
                {!selectedExam.fileUrl && (
                  <div className="flex flex-wrap gap-4 pt-4">
                    <button
                      onClick={handleSaveResult}
                      className="bg-emerald-600 text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all uppercase tracking-widest text-[11px] flex items-center gap-2"
                    >
                      <i className="fas fa-check-double text-sm"></i>
                      {selectedExam.status === 'READY' ? 'Atualizar Laudo' : 'Liberar Resultado'}
                    </button>

                    <label className="cursor-pointer group flex-1 min-w-[200px]">
                      <div className="h-full bg-indigo-600 text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-3">
                        {uploading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-arrow-up text-lg"></i>}
                        {uploading ? 'Enviando...' : 'Anexar Laudo PDF'}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,image/*"
                        onChange={handleUploadFile}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                )}



                {/* Notas do Médico (Campo Subestimado mas Essencial) */}
                <div className="mt-8 space-y-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <i className="fas fa-pen-nib text-indigo-500"></i> Anotações Clínicas
                    </h3>
                    {isSavingNote && <span className="text-[8px] font-black text-indigo-600 animate-pulse">SALVANDO...</span>}
                  </div>
                  <textarea
                    className="w-full h-32 p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-medium text-slate-700 leading-relaxed placeholder:text-slate-300"
                    placeholder="Insira anotações privadas sobre este paciente. Estas notas são visíveis apenas para você."
                    value={doctorNote}
                    onChange={(e) => setDoctorNote(e.target.value)}
                    onBlur={() => saveDoctorNote(doctorNote)}
                  />
                  <p className="text-[8px] text-slate-400 font-bold italic">
                    <i className="fas fa-info-circle mr-1"></i>
                    Anotações salvas automaticamente ao sair do campo. Visível apenas para o médico.
                  </p>

                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-[40px] h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12">
                <div className="w-24 h-24 rounded-[32px] bg-gray-50 flex items-center justify-center text-gray-200 mb-6 border border-gray-100">
                  <i className="fas fa-id-card-clip text-5xl"></i>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Aguardando Seleção</h3>
                <p className="text-gray-400 text-sm max-w-xs leading-relaxed font-medium">
                  Use a barra lateral para buscar um paciente e escolha entre visualizar o laudo ou baixar o arquivo PDF.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'perfil' && (
        <ProfileTab user={user} onUpdateUser={onUpdateUser} />
      )}

      {viewingExam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#1e40af] p-8 text-white relative">
              <h2 className="text-2xl font-black">Visualização do Laudo</h2>
              <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Documento Oficial</p>
            </div>

            <div className="p-8 space-y-6 relative">
              <button
                onClick={() => setViewingExam(null)}
                className="absolute top-4 right-4 p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all z-10"
              >
                <i className="fas fa-times"></i>
              </button>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pr-12">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Paciente</p>
                  <p className="text-sm font-black text-slate-800">{viewingExam.patientName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CPF</p>
                  <p className="text-sm font-black text-slate-800">{viewingExam.patientCpf || '---'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Exame</p>
                  <p className="text-sm font-black text-blue-600 uppercase tracking-tight">{viewingExam.examName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</p>
                  <p className="text-sm font-black text-slate-800">{viewingExam.date}</p>
                </div>
              </div>

              {viewingExam.fileUrl && (
                <div className="w-full h-[70vh] rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                  <iframe src={viewingExam.fileUrl} className="w-full h-full" title="Laudo do Exame"></iframe>
                </div>
              )}

              {/* Removed buttons */}

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

      {historyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-800 p-8 text-white flex justify-between items-center relative">
              <div>
                <h2 className="text-2xl font-black">Histórico do Paciente</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{selectedExam?.patientName}</p>
              </div>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar relative">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="absolute top-4 right-4 p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all z-10"
              >
                <i className="fas fa-times"></i>
              </button>
              {loadingHistory ? (
                <div className="py-20 text-center">
                  <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
                  <p className="font-bold text-gray-400">Carregando histórico...</p>
                </div>
              ) : patientHistory.length > 0 ? (
                <div className="space-y-4">
                  {patientHistory.slice().reverse().map(exam => (
                    <div key={exam.id} className="p-6 rounded-3xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{exam.examName}</span>
                          <h4 className="text-lg font-black text-slate-800">{exam.date}</h4>
                        </div>
                        <button
                          onClick={() => handleDownloadPatientPDF(exam)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <i className="fas fa-file-pdf"></i>
                        </button>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                        {exam.resultData || 'Sem dados de resultado registrados.'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <i className="fas fa-folder-open text-4xl text-gray-100 mb-4"></i>
                  <p className="text-gray-400 font-bold">Nenhum exame anterior encontrado.</p>
                </div>
              )}
            </div>
            <div className="p-8 bg-gray-50 border-t border-gray-100 text-center">
              <button onClick={() => setHistoryModalOpen(false)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl">Fechar Histórico</button>
            </div>
          </div>
        </div>
      )}

      {graphModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black">Evolução de Exames</h2>
                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{selectedExam?.patientName}</p>
              </div>
            </div>

            <div className="p-8 relative">
              <button
                onClick={() => setGraphModalOpen(false)}
                className="absolute top-4 right-4 p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all z-10"
              >
                <i className="fas fa-times"></i>
              </button>
              <div className="flex flex-wrap items-center justify-between gap-6 mb-8 pr-16">
                <div className="flex items-center gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Parâmetro Analisado</label>
                    <select
                      className="block w-64 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                      value={selectedParam}
                      onChange={(e) => setSelectedParam(e.target.value)}
                    >
                      {availableParams.length > 0 ? availableParams.map(p => (
                        <option key={p} value={p}>{p}</option>
                      )) : <option value="">Nenhum dado numérico encontrado</option>}
                    </select>
                  </div>
                </div>

                <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                  {[30, 90, 180].map(days => (
                    <button
                      key={days}
                      onClick={() => setGraphTimeRange(days as any)}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${graphTimeRange === days ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {days} Dias
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[400px] w-full bg-slate-50 rounded-3xl p-6 border border-gray-100 shadow-inner">
                {graphData.length >= 2 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={graphData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                        dx={-10}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '16px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name={selectedParam}
                        stroke="#4f46e5"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 8, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center px-12">
                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-indigo-200 mb-4 shadow-sm">
                      <i className="fas fa-chart-area text-3xl"></i>
                    </div>
                    <h4 className="text-slate-800 font-black mb-1">Dados Insuficientes</h4>
                    <p className="text-gray-400 text-xs font-medium leading-relaxed">
                      São necessários pelo menos 2 exames com resultados numéricos para gerar o gráfico de evolução.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-start gap-3 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <i className="fas fa-lightbulb text-blue-500 mt-0.5"></i>
                <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
                  DICA: O sistema extrai automaticamente o primeiro valor numérico de cada linha do resultado.
                  Certifique-se de manter o formato "Parâmetro: Valor" para melhor precisão.
                </p>
              </div>
            </div>
            <div className="p-8 bg-gray-50 border-t border-gray-100 text-center">
              <button onClick={() => setGraphModalOpen(false)} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-xl">Concluído</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalDashboard;
