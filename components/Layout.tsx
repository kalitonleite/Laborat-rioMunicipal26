
import React from 'react';
import { User, UserRole } from '../types';
import { useSettings } from '../contexts/SettingsContext';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  const { appLogo } = useSettings();
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'PAINEL ADMINISTRADOR';
      case UserRole.MEDICAL: return 'MÉDICO';
      case UserRole.RECEPTION: return 'RECEPÇÃO';
      default: return 'PACIENTE';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col relative overflow-x-hidden">
      {/* Efeito de Brilho no Topo - Sutil e Moderno */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Header Premium */}
      <header className="bg-gradient-to-br from-[#002147] via-[#002147] to-[#003366] text-white px-4 py-6 md:px-8 md:py-7 pt-8 shadow-[0_10px_40px_rgba(0,33,71,0.2)] rounded-b-[40px] md:rounded-b-[50px] z-50 relative border-b border-white/5">
        <div className="container mx-auto flex justify-between items-center max-w-7xl">
          <div className="flex items-center gap-4 md:gap-6">
            {/* Logo Relocado no lugar do Microscópio */}
            <div className="bg-white p-1.5 md:p-2 rounded-2xl shadow-2xl shadow-black/20 border border-white/10 hover:scale-105 transition-transform duration-300">
              <img
                src={appLogo || "/assets/logo-uarini.jpg"}
                alt="Uarini"
                className="w-12 h-12 md:w-16 md:h-16 object-contain rounded-lg"
              />
            </div>

            <div className="flex flex-col">
              <h1 className="font-extrabold text-lg md:text-3xl leading-none tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-blue-200 truncate max-w-[180px] md:max-w-none">
                Laboratório Municipal de Uarini
              </h1>
              <p className="text-[8px] md:text-[11px] font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] mt-1.5 md:mt-2 flex items-center gap-1.5 md:gap-2">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#22c55e] rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                <span className="text-[#22c55e]">Análises Clínicas</span>
                <span className="text-white/40">|</span>
                <span className="text-[#eab308]">AM</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold leading-none mb-1.5 text-white/90">{user?.name}</p>
              <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#eab308]">
                  {getRoleLabel(user?.role || UserRole.PATIENT)}
                </p>
              </div>
            </div>

            <div className="w-12 h-12 rounded-2xl border border-white/20 overflow-hidden shadow-2xl hidden md:block group cursor-pointer">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                  <i className="fas fa-user text-white/40 text-sm"></i>
                </div>
              )}
            </div>

            <button
              onClick={onLogout}
              className="bg-white/5 hover:bg-red-500/90 w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border border-white/10 group shadow-lg"
              title="Encerrar Sessão"
            >
              <i className="fas fa-power-off text-sm md:text-base group-hover:rotate-90 transition-transform duration-500"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto px-4 py-6 md:p-8 mt-2 relative pb-32 max-w-6xl">
        {children}
      </main>

      {/* Footer Fundo */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[180%] h-[200px] bg-[#1e40af]/5 rounded-t-[100%] z-0 pointer-events-none translate-y-24"></div>

      {/* Footer Flutuante */}
      <footer className="relative z-10 py-8 text-center flex flex-col items-center gap-2">
        <div className="bg-white/60 backdrop-blur-md px-5 py-2 rounded-full border border-white/20 shadow-sm flex flex-col items-center">
          <p className="text-black text-[8px] md:text-[10px] uppercase tracking-[0.25em] font-black">
            Desenvolvedor: <span className="text-black">Biomédico Kaliton Goncalves Leite</span>
          </p>
          <p className="text-black text-[8px] md:text-[9px] font-bold mt-0.5">2026</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
