
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { maskCPF } from '../services/masks';

import { useAuth } from '../contexts/AuthContext';

interface ReceptionLoginPageProps {
  onLogin: (user: User) => void;
}

const ReceptionLoginPage: React.FC<ReceptionLoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanCPF = cpf.replace(/\D/g, '');
      await login(cleanCPF, password);
      navigate('/reception');
    } catch (err: any) {
      console.error('Login error:', err);
      alert(err.message || 'Erro ao realizar login. Verifique seus dados.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0fdf4] relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-emerald-400/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="flex-grow flex items-center justify-center p-4 relative z-10">
        <div className="bg-white/95 backdrop-blur-2xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(21,128,61,0.15)] w-full max-w-md p-10 flex flex-col items-center border border-white/50 modern-shadow">
          <div className="w-full flex justify-between items-start mb-10">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-emerald-600 transition-all bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center border border-slate-100">
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="bg-white p-2 rounded-2xl shadow-xl border border-emerald-50">
              <img src="/assets/logo-uarini.jpg" alt="Logo" className="w-12 h-12 object-contain" />
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-[#15803d] tracking-tight">Atendimento</h1>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-[0.3em] mt-2">Portal da Recepção</p>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Identificação CPF</label>
              <div className="relative group">
                <i className="fas fa-id-card absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors"></i>
                <input required type="text" placeholder="000.000.000-00" className="w-full pl-14 pr-4 py-4.5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none text-sm font-bold text-slate-700 transition-all border-b-2 focus:border-emerald-600/50" value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Senha de Acesso</label>
                <button type="button" onClick={() => setShowForgotModal(true)} className="text-[10px] font-bold text-emerald-600 hover:underline uppercase tracking-tighter">Esqueceu?</button>
              </div>
              <div className="relative group">
                <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors"></i>
                <input required type={showPassword ? "text" : "password"} maxLength={6} placeholder="••••••" className="w-full pl-14 pr-14 py-4.5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none text-sm font-bold text-slate-700 transition-all border-b-2 focus:border-emerald-600/50" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-600 transition-colors">
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-[#15803d] text-white font-extrabold py-5 rounded-2xl shadow-[0_12px_24px_-8px_rgba(21,128,61,0.4)] hover:bg-emerald-800 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 group uppercase tracking-widest text-xs mt-4">
              Iniciar Atendimento
              <i className="fas fa-id-badge text-[10px] group-hover:scale-110 transition-transform"></i>
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              Novo colaborador? <button onClick={() => navigate('/reception/register')} className="text-emerald-600 font-extrabold hover:text-emerald-800 transition-colors">Solicitar Registro</button>
            </p>
          </div>
        </div>
      </div>

      {showForgotModal && <ForgotPasswordModal role={UserRole.RECEPTION} onClose={() => setShowForgotModal(false)} />}
    </div>
  );
};

export default ReceptionLoginPage;
