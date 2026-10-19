import React from 'react';
import { OrganId, OrganInfo, AvatarAnimationState, HealthStatus } from '../services/healthMetrics';

interface HealthAvatarProps {
  organs: Record<OrganId, OrganInfo>;
  avatarState: AvatarAnimationState;
  selectedOrgan: OrganId | null;
  onSelectOrgan: (organId: OrganId) => void;
  interactive?: boolean;
}

export const HealthAvatar: React.FC<HealthAvatarProps> = ({
  organs,
  avatarState,
  selectedOrgan,
  onSelectOrgan,
  interactive = true
}) => {
  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'critico':
        return { stroke: '#ef4444', fill: '#f87171', glow: 'rgba(239, 68, 68, 0.6)', badge: 'bg-rose-500' };
      case 'alerta':
        return { stroke: '#f59e0b', fill: '#fbbf24', glow: 'rgba(245, 158, 11, 0.6)', badge: 'bg-amber-500' };
      case 'normal':
      default:
        return { stroke: '#10b981', fill: '#34d399', glow: 'rgba(16, 185, 129, 0.4)', badge: 'bg-emerald-500' };
    }
  };

  const getAvatarBadge = () => {
    switch (avatarState) {
      case 'cansado':
        return {
          icon: 'fa-bed',
          label: 'Fadiga & Cansaço Detectado',
          bg: 'bg-blue-600',
          textColor: 'text-blue-100',
          sub: 'Hemograma / Nutrientes reduzidos'
        };
      case 'com_dor':
        return {
          icon: 'fa-bolt',
          label: 'Alerta de Inflamação / Dor',
          bg: 'bg-rose-600',
          textColor: 'text-rose-100',
          sub: 'Marcadores inflamatórios ativos'
        };
      case 'palpitacao':
        return {
          icon: 'fa-heart-pulse',
          label: 'Alerta Cardiovascular',
          bg: 'bg-amber-600',
          textColor: 'text-amber-100',
          sub: 'Perfil lipídico ou circulação sobrecarregada'
        };
      case 'vigoroso':
      default:
        return {
          icon: 'fa-shield-heart',
          label: 'Biometria em Equilíbrio',
          bg: 'bg-emerald-600',
          textColor: 'text-emerald-100',
          sub: 'Todos os parâmetros saudáveis'
        };
    }
  };

  const badge = getAvatarBadge();
  const isTired = avatarState === 'cansado';
  const hasPain = avatarState === 'com_dor';
  const isCardio = avatarState === 'palpitacao';
  const isHealthy = avatarState === 'vigoroso';

  return (
    <div className="relative flex flex-col items-center justify-between w-full h-full p-4 md:p-6 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 rounded-[32px] text-white shadow-2xl border border-slate-700/60 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      {isCardio && <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/15 rounded-full blur-2xl pointer-events-none"></div>}
      {isTired && <div className="absolute top-10 left-1/2 -translate-x-1/2 w-56 h-56 bg-blue-500/15 rounded-full blur-2xl pointer-events-none"></div>}
      {isHealthy && <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-56 h-56 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none"></div>}

      {/* Top Status Bar */}
      <div className="relative z-10 w-full flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl ${badge.bg} flex items-center justify-center text-white shadow-lg shadow-black/20 text-lg`}>
            <i className={`fas ${badge.icon} ${isCardio ? 'animate-bounce' : ''}`}></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-white">{badge.label}</span>
              <span className={`w-2 h-2 rounded-full ${getStatusColor(organs.cerebro.status).badge} animate-ping`}></span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">{badge.sub}</p>
          </div>
        </div>

        {/* Animation status indicator */}
        <div className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-300">
          Biometria Viva
        </div>
      </div>

      {/* SVG Humanoid Interactive Body */}
      <div className="relative z-10 w-full max-w-[280px] h-[380px] flex items-center justify-center my-2">
        {/* Floating sleepy Zzz particles for fatigue mode */}
        {isTired && (
          <div className="absolute top-6 right-10 pointer-events-none select-none z-20">
            <span className="anim-zzz absolute text-blue-300 font-black text-xl" style={{ animationDelay: '0s' }}>Z</span>
            <span className="anim-zzz absolute text-blue-400 font-black text-sm" style={{ animationDelay: '1.1s' }}>z</span>
            <span className="anim-zzz absolute text-blue-200 font-bold text-xs" style={{ animationDelay: '2.2s' }}>z</span>
          </div>
        )}

        <svg
          viewBox="0 0 240 400"
          className={`w-full h-full max-h-[360px] filter drop-shadow-xl transition-all duration-500 ${
            isTired ? 'anim-tired-body' : hasPain ? 'anim-pain-tremor' : isHealthy ? 'anim-vitality' : ''
          }`}
        >
          <defs>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#1e293b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </linearGradient>

            <filter id="organGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Body Silhouette */}
          <g id="bodySilhouette" stroke="#475569" strokeWidth="1.5" fill="url(#bodyGradient)">
            {/* Head */}
            <circle cx="120" cy="50" r="26" />
            
            {/* Neck */}
            <path d="M 112 76 L 112 90 L 128 90 L 128 76 Z" />

            {/* Torso & Pelvis */}
            <path d="M 80 95 C 75 95, 60 110, 52 145 C 48 165, 42 205, 44 220 C 45 225, 52 230, 58 220 C 65 200, 70 170, 72 165 L 72 230 C 72 250, 80 260, 95 265 L 120 270 L 145 265 C 160 260, 168 250, 168 230 L 168 165 C 170 170, 175 200, 182 220 C 188 230, 195 225, 196 220 C 198 205, 192 165, 188 145 C 180 110, 165 95, 160 95 Z" />

            {/* Legs */}
            <path d="M 95 265 L 90 330 C 88 345, 85 365, 82 385 C 80 390, 92 392, 98 390 C 105 385, 108 340, 110 320 L 115 270 Z" />
            <path d="M 145 265 L 150 330 C 152 345, 155 365, 158 385 C 160 390, 148 392, 142 390 C 135 385, 132 340, 130 320 L 125 270 Z" />
          </g>

          {/* Internal Skeleton / Neural Lines for High-Tech feel */}
          <g stroke="#3b82f6" strokeWidth="0.8" opacity="0.35" fill="none">
            <line x1="120" y1="76" x2="120" y2="265" strokeDasharray="2,3" />
            <path d="M 80 115 Q 120 135 160 115" />
            <path d="M 85 140 Q 120 160 155 140" />
            <path d="M 88 165 Q 120 185 152 165" />
          </g>

          {/* --- ORGAN 1: CÉREBRO / CABEÇA --- */}
          <g
            className={`cursor-pointer transition-transform duration-300 ${interactive ? 'hover:scale-110' : ''}`}
            onClick={() => onSelectOrgan('cerebro')}
            filter="url(#organGlow)"
          >
            {selectedOrgan === 'cerebro' && (
              <circle cx="120" cy="50" r="28" fill="none" stroke="#60a5fa" strokeWidth="1.5" className="anim-organ-active" />
            )}
            <circle
              cx="120"
              cy="50"
              r="14"
              fill={getStatusColor(organs.cerebro.status).fill}
              stroke={getStatusColor(organs.cerebro.status).stroke}
              strokeWidth="2"
              fillOpacity="0.85"
            />
            {/* Brain icon path */}
            <path
              d="M 115 47 Q 120 44 125 47 M 114 52 Q 120 54 126 52 M 120 44 L 120 56"
              stroke="#ffffff"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* --- ORGAN 2: PULMÕES --- */}
          <g
            className={`cursor-pointer transition-transform duration-300 ${interactive ? 'hover:scale-110' : ''}`}
            onClick={() => onSelectOrgan('pulmoes')}
            filter="url(#organGlow)"
          >
            {selectedOrgan === 'pulmoes' && (
              <ellipse cx="120" cy="120" rx="36" ry="24" fill="none" stroke="#60a5fa" strokeWidth="1.5" className="anim-organ-active" />
            )}
            {/* Left lung */}
            <path
              d="M 98 105 C 92 110, 88 125, 96 138 C 104 142, 110 135, 110 120 Z"
              fill={getStatusColor(organs.pulmoes.status).fill}
              stroke={getStatusColor(organs.pulmoes.status).stroke}
              strokeWidth="1.8"
              fillOpacity="0.8"
            />
            {/* Right lung */}
            <path
              d="M 142 105 C 148 110, 152 125, 144 138 C 136 142, 130 135, 130 120 Z"
              fill={getStatusColor(organs.pulmoes.status).fill}
              stroke={getStatusColor(organs.pulmoes.status).stroke}
              strokeWidth="1.8"
              fillOpacity="0.8"
            />
          </g>

          {/* --- ORGAN 3: CORAÇÃO --- */}
          <g
            className={`cursor-pointer transition-transform duration-300 ${
              isCardio ? 'anim-heartbeat-fast' : interactive ? 'hover:scale-115' : ''
            }`}
            onClick={() => onSelectOrgan('coracao')}
            filter="url(#organGlow)"
          >
            {/* Pain / Alert shockwave ring if in critical state */}
            {organs.coracao.status === 'critico' && (
              <circle cx="122" cy="126" r="22" stroke="#ef4444" fill="none" className="anim-pain-pulse" />
            )}
            {selectedOrgan === 'coracao' && (
              <circle cx="122" cy="126" r="18" fill="none" stroke="#f43f5e" strokeWidth="2" className="anim-organ-active" />
            )}
            <circle
              cx="122"
              cy="126"
              r="11"
              fill={getStatusColor(organs.coracao.status).fill}
              stroke={getStatusColor(organs.coracao.status).stroke}
              strokeWidth="2"
              fillOpacity="0.9"
            />
            <path
              d="M 122 122 C 122 120, 118 118, 117 122 C 117 125, 122 129, 122 129 C 122 129, 127 125, 127 122 C 127 118, 122 120, 122 122 Z"
              fill="#ffffff"
            />
          </g>

          {/* --- ORGAN 4: FÍGADO --- */}
          <g
            className={`cursor-pointer transition-transform duration-300 ${interactive ? 'hover:scale-110' : ''}`}
            onClick={() => onSelectOrgan('figado')}
            filter="url(#organGlow)"
          >
            {selectedOrgan === 'figado' && (
              <ellipse cx="104" cy="158" rx="20" ry="14" fill="none" stroke="#60a5fa" strokeWidth="1.5" className="anim-organ-active" />
            )}
            <path
              d="M 94 150 C 108 146, 116 150, 114 162 C 112 168, 96 168, 92 160 Z"
              fill={getStatusColor(organs.figado.status).fill}
              stroke={getStatusColor(organs.figado.status).stroke}
              strokeWidth="1.8"
              fillOpacity="0.85"
            />
          </g>

          {/* --- ORGAN 5: PÂNCREAS --- */}
          <g
            className={`cursor-pointer transition-transform duration-300 ${interactive ? 'hover:scale-110' : ''}`}
            onClick={() => onSelectOrgan('pancreas')}
            filter="url(#organGlow)"
          >
            {selectedOrgan === 'pancreas' && (
              <ellipse cx="128" cy="165" rx="16" ry="9" fill="none" stroke="#60a5fa" strokeWidth="1.5" className="anim-organ-active" />
            )}
            <path
              d="M 118 163 Q 128 160 138 166 Q 128 170 118 163"
              fill={getStatusColor(organs.pancreas.status).fill}
              stroke={getStatusColor(organs.pancreas.status).stroke}
              strokeWidth="1.8"
              fillOpacity="0.9"
            />
          </g>

          {/* --- ORGAN 6: RINS --- */}
          <g
            className={`cursor-pointer transition-transform duration-300 ${interactive ? 'hover:scale-110' : ''}`}
            onClick={() => onSelectOrgan('rins')}
            filter="url(#organGlow)"
          >
            {selectedOrgan === 'rins' && (
              <circle cx="120" cy="186" r="30" fill="none" stroke="#60a5fa" strokeWidth="1.5" className="anim-organ-active" />
            )}
            {/* Left kidney */}
            <ellipse
              cx="98"
              cy="186"
              rx="7"
              ry="10"
              fill={getStatusColor(organs.rins.status).fill}
              stroke={getStatusColor(organs.rins.status).stroke}
              strokeWidth="1.8"
              fillOpacity="0.85"
            />
            {/* Right kidney */}
            <ellipse
              cx="142"
              cy="186"
              rx="7"
              ry="10"
              fill={getStatusColor(organs.rins.status).fill}
              stroke={getStatusColor(organs.rins.status).stroke}
              strokeWidth="1.8"
              fillOpacity="0.85"
            />
          </g>

          {/* --- ORGAN 7: ARTICULAÇÕES / DOR (JOELHOS & OMBROS) --- */}
          <g
            className={`cursor-pointer transition-transform duration-300 ${interactive ? 'hover:scale-110' : ''}`}
            onClick={() => onSelectOrgan('articulacoes')}
            filter="url(#organGlow)"
          >
            {hasPain && (
              <>
                <circle cx="95" cy="325" r="14" stroke="#ef4444" fill="none" className="anim-pain-pulse" />
                <circle cx="145" cy="325" r="14" stroke="#ef4444" fill="none" className="anim-pain-pulse" />
              </>
            )}
            {/* Left Knee */}
            <circle
              cx="95"
              cy="325"
              r="7"
              fill={getStatusColor(organs.articulacoes.status).fill}
              stroke={getStatusColor(organs.articulacoes.status).stroke}
              strokeWidth="1.8"
              fillOpacity="0.85"
            />
            {/* Right Knee */}
            <circle
              cx="145"
              cy="325"
              r="7"
              fill={getStatusColor(organs.articulacoes.status).fill}
              stroke={getStatusColor(organs.articulacoes.status).stroke}
              strokeWidth="1.8"
              fillOpacity="0.85"
            />
          </g>
        </svg>
      </div>

      {/* Interactive Quick Organ Switcher Pills */}
      <div className="relative z-10 w-full mt-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 text-center">
          Clique no órgão para detalhar exames:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
          {(Object.keys(organs) as OrganId[]).map((key) => {
            const org = organs[key];
            const isSelected = selectedOrgan === key;
            const statusDot = org.status === 'critico' ? 'bg-rose-500' : org.status === 'alerta' ? 'bg-amber-500' : 'bg-emerald-500';

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectOrgan(key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
                <i className={`fas ${org.icon} text-[10px]`}></i>
                <span>{org.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HealthAvatar;
