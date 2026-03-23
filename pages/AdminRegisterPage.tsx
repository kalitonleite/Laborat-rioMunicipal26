
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';

import { authService, dbService } from '../services/apiService';
import { useSettings } from '../contexts/SettingsContext';
import { maskCPF, maskPhone } from '../services/masks';

interface AdminRegisterPageProps {
  onLogin: (user: User) => void;
}

const AdminRegisterPage: React.FC<AdminRegisterPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { appLogo } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    accessCode: ''
  });
  const [showAccessCode, setShowAccessCode] = useState(false);

  const handleAdminRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const accessCode = formData.accessCode.trim().toUpperCase();
      const codeData = await dbService.from('authorization_codes').select({
        code: accessCode,
        role: UserRole.ADMIN
      });

      if (!codeData || codeData.length === 0) {
        alert('Código de autorização do laboratório inválido!');
        return;
      }

      const cleanCPF = formData.cpf.replace(/\D/g, '');

      await authService.register({
        cpf: cleanCPF,
        name: formData.name,
        role: UserRole.ADMIN,
        email: formData.email,
        phone: formData.phone.replace(/\D/g, '')
      });

      alert(`Cadastro administrativo realizado com sucesso! Sua senha de acesso inicial são os primeiros 6 dígitos do seu CPF (${cleanCPF.substring(0, 6)}). Você poderá alterá-la no seu painel.`);
      navigate('/admin/login');
    } catch (err: any) {
      console.error('Registration error:', err);
      alert(err.message || 'Erro inesperado ao realizar cadastro.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#002147] relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#eab308]/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="flex-grow flex items-center justify-center p-4 relative z-10 py-12">
        <div className="bg-white/95 backdrop-blur-xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full max-w-4xl p-8 md:p-12 flex flex-col md:flex-row gap-12 border border-white/20 modern-shadow">
          {/* Lado Esquerdo - Info */}
          <div className="md:w-1/3 flex flex-col">
            <div className="flex justify-between items-start mb-10">
              <button
                onClick={() => navigate('/admin/login')}
                className="text-slate-400 hover:text-[#002147] transition-all bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm"
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <div className="bg-white rounded-2xl shadow-xl border border-slate-50 overflow-hidden w-32 h-32">
                <img src={appLogo || ""} alt="Logo" className="w-full h-full object-contain p-4" />
              </div>
            </div>

            <div className="space-y-4 mb-10">
              <h1 className="text-4xl font-extrabold text-[#002147] tracking-tight leading-tight">Novo Gestor</h1>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Habilite seu acesso administrativo para gerenciar recursos e laudos do Laboratório Municipal.
              </p>
            </div>

            <div className="mt-auto bg-[#eab308]/10 p-6 rounded-[32px] border border-[#eab308]/20 relative overflow-hidden group">
              <div className="flex items-center gap-3 text-[#a16207] mb-2">
                <i className="fas fa-key text-lg"></i>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Senha Automática</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                Sua senha inicial será gerada com os <strong>6 primeiros dígitos do seu CPF</strong>.
              </p>
            </div>
          </div>

          {/* Lado Direito - Form */}
          <div className="md:w-2/3">
            <form onSubmit={handleAdminRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <div className="relative group">
                  <i className="fas fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors"></i>
                  <input
                    required type="text" placeholder="Seu nome completo"
                    className="w-full pl-14 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-[#002147]/10 outline-none text-sm font-bold text-slate-700 transition-all"
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                <div className="relative group">
                  <i className="fas fa-id-card absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors"></i>
                  <input
                    required type="text" placeholder="000.000.000-00"
                    className="w-full pl-14 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-[#002147]/10 outline-none text-sm font-bold text-slate-700 transition-all"
                    value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail Institucional</label>
                <div className="relative group">
                  <i className="fas fa-at absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors"></i>
                  <input
                    type="email" placeholder="nome@laboratorio.com"
                    className="w-full pl-14 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-[#002147]/10 outline-none text-sm font-bold text-slate-700 transition-all"
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                <div className="relative group">
                  <i className="fas fa-phone absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors"></i>
                  <input
                    type="tel" placeholder="(00) 00000-0000"
                    className="w-full pl-14 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-[#002147]/10 outline-none text-sm font-bold text-slate-700 transition-all"
                    value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5 mt-2">
                <label className="text-[10px] font-bold text-[#a16207] uppercase ml-1 tracking-[0.2em]">Código de Autorização do Laboratório</label>
                <div className="relative group">
                  <i className="fas fa-lock-open absolute left-5 top-1/2 -translate-y-1/2 text-[#eab308] transition-colors"></i>
                  <input
                    required type={showAccessCode ? "text" : "password"} placeholder="Digite o código mestre"
                    className="w-full pl-14 pr-12 py-5 rounded-2xl border border-[#eab308]/30 bg-[#eab308]/5 text-sm focus:ring-4 focus:ring-[#eab308]/10 outline-none font-bold text-[#a16207] transition-all"
                    value={formData.accessCode} onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowAccessCode(!showAccessCode)} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#eab308]">
                    <i className={`fas ${showAccessCode ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button type="submit" className="md:col-span-2 w-full bg-[#002147] text-white font-extrabold py-5 rounded-3xl shadow-2xl hover:bg-black hover:-translate-y-0.5 transition-all mt-6 uppercase tracking-widest text-xs flex items-center justify-center gap-4 active:scale-95">
                Confirmar Registro Administrativo
                <i className="fas fa-check-circle text-[10px]"></i>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterPage;
