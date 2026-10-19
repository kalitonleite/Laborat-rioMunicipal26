import React from 'react';
import { HealthAlert, OrganId } from '../services/healthMetrics';

interface HealthAlertsFeedProps {
  alerts: HealthAlert[];
  mode?: 'patient' | 'doctor';
  onSelectOrgan?: (organId: OrganId) => void;
}

export const HealthAlertsFeed: React.FC<HealthAlertsFeedProps> = ({
  alerts,
  mode = 'patient',
  onSelectOrgan
}) => {
  return (
    <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
            <i className="fas fa-bell"></i>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
              Alertas de Saúde & Recomendações
            </h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              {alerts.length} {alerts.length === 1 ? 'notificação ativa' : 'notificações ativas'}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">
          {mode === 'doctor' ? 'Modo Clínico' : 'Modo Cidadão'}
        </span>
      </div>

      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {alerts.map((alert) => {
          const isCritical = alert.severity === 'critico';
          const isAlert = alert.severity === 'alerta';

          return (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border transition-all ${
                isCritical
                  ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                  : isAlert
                  ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                  : 'bg-emerald-50/50 border-emerald-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white ${
                      isCritical ? 'bg-rose-500' : isAlert ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  >
                    <i className={`fas ${isCritical ? 'fa-triangle-exclamation' : 'fa-info'}`}></i>
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 leading-snug">{alert.title}</h4>
                    <button
                      type="button"
                      onClick={() => onSelectOrgan && onSelectOrgan(alert.organId)}
                      className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1 mt-0.5"
                    >
                      <span>{alert.organName}</span>
                      <i className="fas fa-arrow-up-right-from-square text-[9px]"></i>
                    </button>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    isCritical
                      ? 'bg-rose-100 text-rose-700'
                      : isAlert
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {alert.severity}
                </span>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-2.5">
                {alert.message}
              </p>

              {/* Recomendação de Ação */}
              <div className="p-3 bg-white/80 rounded-xl border border-slate-100/80 text-xs">
                <p className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                  <i className="fas fa-lightbulb text-amber-500"></i>
                  <span>Recomendação Preventiva:</span>
                </p>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  {alert.recommendation}
                </p>

                {mode === 'doctor' && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">
                      Nota Clínica para Conduta:
                    </p>
                    <p className="text-slate-600 text-[11px] font-semibold mt-0.5">
                      {alert.clinicalNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {alerts.length === 0 && (
          <div className="p-8 text-center bg-emerald-50/60 rounded-2xl border border-dashed border-emerald-200">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl mb-3 shadow-sm">
              <i className="fas fa-circle-check"></i>
            </div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
              Nenhum Alerta Crítico Detectado
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Parabéns! Seus exames e parâmetros avaliados estão dentro da normalidade esperada. Continue mantendo seus hábitos saudáveis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthAlertsFeed;
