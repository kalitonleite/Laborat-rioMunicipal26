import React, { useState, useMemo } from 'react';
import { ExamResult, User } from '../types';
import {
  analyzePatientHealth,
  OrganId,
  OrganInfo
} from '../services/healthMetrics';
import HealthAvatar from './HealthAvatar';
import HealthHistoryChart from './HealthHistoryChart';
import HealthAlertsFeed from './HealthAlertsFeed';

interface HealthHistoryTabProps {
  exams: ExamResult[];
  user?: User;
  mode?: 'patient' | 'doctor';
  onOpenExam?: (exam: ExamResult) => void;
}

export const HealthHistoryTab: React.FC<HealthHistoryTabProps> = ({
  exams,
  user,
  mode = 'patient',
  onOpenExam
}) => {
  const analysis = useMemo(() => {
    return analyzePatientHealth(exams);
  }, [exams]);

  const [selectedOrganId, setSelectedOrganId] = useState<OrganId>(
    analysis.primaryAffectedOrgan || 'cerebro'
  );

  const currentOrgan: OrganInfo = analysis.organs[selectedOrganId] || analysis.organs['cerebro'];

  // Filtrar exames relacionados ao órgão selecionado
  const organExams = useMemo(() => {
    return exams.filter((exam) => {
      const name = (exam.examName || '').toUpperCase();
      const organName = currentOrgan.name.toUpperCase();
      if (selectedOrganId === 'coracao' && (name.includes('COLEST') || name.includes('TRIGLIC') || name.includes('LIPID'))) return true;
      if (selectedOrganId === 'pancreas' && (name.includes('GLICO') || name.includes('GLICEMIA') || name.includes('HBA1C'))) return true;
      if (selectedOrganId === 'cerebro' && (name.includes('HEMO') || name.includes('SANGUE') || name.includes('ANEMIA'))) return true;
      if (selectedOrganId === 'rins' && (name.includes('CREAT') || name.includes('UREIA') || name.includes('URINA') || name.includes('EAS'))) return true;
      if (selectedOrganId === 'figado' && (name.includes('TGO') || name.includes('TGP') || name.includes('AST') || name.includes('ALT') || name.includes('GAMA'))) return true;
      if (selectedOrganId === 'articulacoes' && (name.includes('PCR') || name.includes('REUMA') || name.includes('ACIDO'))) return true;
      return false;
    });
  }, [exams, selectedOrganId, currentOrgan]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Banner: Status Biométrico Holístico */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 md:p-8 rounded-[36px] text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <i className="fas fa-heart-pulse text-9xl text-blue-400"></i>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-blue-600/90 text-blue-100 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                Monitoramento Biométrico Inteligente
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-black uppercase text-amber-300">
                <i className="fas fa-circle-dot text-[8px] animate-ping"></i>
                {analysis.stateBadge}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {mode === 'doctor' ? `Histórico de Saúde do Paciente` : `Meu Histórico & Mapa Corporal`}
            </h2>
            <p className="text-slate-300 text-sm font-medium leading-relaxed">
              {analysis.stateDescription}
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-wider">Exames</p>
              <p className="text-2xl font-black text-white">{exams.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-wider">Alertas</p>
              <p className={`text-2xl font-black ${analysis.alerts.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {analysis.alerts.length}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[110px]">
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-wider">Sistemas</p>
              <p className="text-2xl font-black text-blue-300">7 Áreas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Avatar (Body) & Right Chart + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Body Avatar */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-6">
          <HealthAvatar
            organs={analysis.organs}
            avatarState={analysis.avatarState}
            selectedOrgan={selectedOrganId}
            onSelectOrgan={(id) => setSelectedOrganId(id)}
            interactive={true}
          />

          {/* Organ Detail Info Card */}
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                  <i className={`fas ${currentOrgan.icon}`}></i>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">{currentOrgan.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Região Selecionada</p>
                </div>
              </div>
              <span
                className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                  currentOrgan.status === 'critico'
                    ? 'bg-rose-100 text-rose-700'
                    : currentOrgan.status === 'alerta'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {currentOrgan.status}
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {currentOrgan.description}
            </p>

            {currentOrgan.symptoms && currentOrgan.symptoms.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Sinais / Sintomas Vinculados:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {currentOrgan.symptoms.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 text-[11px] font-bold"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <p className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                <i className="fas fa-notes-medical text-blue-600"></i>
                <span>Conduta / Orientação:</span>
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {currentOrgan.recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Chart + Alerts + Organ Exams */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Health Evolution Chart */}
          <HealthHistoryChart
            exams={exams}
            selectedOrgan={selectedOrganId}
            onSelectOrgan={(id) => setSelectedOrganId(id)}
          />

          {/* Health Alerts & Recommendations Feed */}
          <HealthAlertsFeed
            alerts={analysis.alerts}
            mode={mode}
            onSelectOrgan={(id) => setSelectedOrganId(id)}
          />

          {/* Recent Exams for the active organ */}
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <i className="fas fa-file-waveform text-blue-600"></i>
                <span>Exames Vinculados a {currentOrgan.name.split(' ')[0]}</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                {organExams.length} {organExams.length === 1 ? 'exame localizado' : 'exames localizados'}
              </span>
            </div>

            <div className="space-y-2.5">
              {organExams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 text-sm shadow-sm">
                      <i className="fas fa-microscope"></i>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase">{exam.examName}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{exam.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      Disponível
                    </span>
                    {onOpenExam && (
                      <button
                        type="button"
                        onClick={() => onOpenExam(exam)}
                        className="px-3 py-1 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        Ver Laudo
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {organExams.length === 0 && (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 italic font-medium">
                    Nenhum exame específico para {currentOrgan.name.split(' ')[0]} foi registrado ainda.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthHistoryTab;
