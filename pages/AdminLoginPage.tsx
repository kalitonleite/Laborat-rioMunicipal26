
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { maskCPF } from '../services/masks';

import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

interface AdminLoginPageProps {
  onLogin: (user: User) => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const { appLogo } = useSettings();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanCPF = cpf.replace(/\D/g, '');
      await login(cleanCPF, password, UserRole.ADMIN);
      navigate('/admin');
    } catch (err: any) {
      console.error('Login error:', err);
      alert(err.message || 'Erro ao realizar login. Verifique seus dados.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#002147] relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#eab308]/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="flex-grow flex items-center justify-center p-4 relative z-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full max-w-md p-10 z-10 border border-white/20 modern-shadow">
          <div className="flex justify-between items-start mb-8">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-[#002147] transition-all bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center border border-slate-100">
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden w-32 h-32">
              <img src={appLogo || "/assets/logo-uarini.jpg"} alt="Logo" className="w-full h-full object-contain p-4" />
            </div>
          </div>

          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-[#002147] tracking-tight mb-2">Painel Gestor</h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">Acesso exclusivo para a administração do Laboratório de Uarini.</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Identificação CPF</label>
              <div className="relative group">
                <i className="fas fa-id-card absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors"></i>
                <input
                  required type="text" placeholder="000.000.000-00"
                  className="w-full pl-14 pr-4 py-4.5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-[#002147]/10 outline-none text-sm font-bold text-slate-700 transition-all"
                  value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Senha de Acesso</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-bold text-[#002147] hover:text-[#eab308] hover:underline uppercase tracking-tighter transition-all"
                >
                  Esqueceu?
                </button>
              </div>
              <div className="relative group">
                <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors"></i>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  maxLength={6}
                  placeholder="••••••"
                  className="w-full pl-14 pr-14 py-4.5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-[#002147]/10 outline-none text-sm font-bold text-slate-700 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#002147] transition-colors"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-[#002147] text-white font-extrabold py-5 rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 group uppercase tracking-widest text-xs mt-6">
              Acessar Sistema Administrativo
              <i className="fas fa-shield-halved text-[10px] group-hover:scale-125 transition-transform"></i>
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              Ainda não possui credenciais? <button onClick={() => navigate('/admin/register')} className="text-[#002147] font-extrabold hover:text-[#eab308] transition-colors">Solicitar Registro</button>
            </p>
          </div>
        </div>
      </div>

      {showForgotModal && (
        <ForgotPasswordModal
          role={UserRole.ADMIN}
          onClose={() => setShowForgotModal(false)}
        />
      )}
    </div>
  );
};

export default AdminLoginPage;
