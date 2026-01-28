
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';

import { supabase } from '../services/supabase';

interface AdminRegisterPageProps {
  onLogin: (user: User) => void;
}

const AdminRegisterPage: React.FC<AdminRegisterPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    accessCode: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1 $2')
      .replace(/(\d{5})(\d)/, '$1 $2')
      .slice(0, 13);
  };

  const handleAdminRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }
    try {
      // Validar código via banco de dados
      const { data: codeData, error: codeError } = await supabase
        .from('authorization_codes')
        .select('code')
        .eq('code', formData.accessCode.trim().toUpperCase())
        .eq('role', UserRole.ADMIN)
        .maybeSingle();

      if (codeError || !codeData) {
        alert('Código de autorização do laboratório inválido!');
        return;
      }

      const cleanCPF = formData.cpf.replace(/\D/g, '');

      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            cpf: cleanCPF,
            role: UserRole.ADMIN
          }
        }
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert('Cadastro administrativo realizado com sucesso! Você já pode acessar sua conta.');
      navigate('/admin/login');
    } catch (err) {
      console.error('Registration error:', err);
      alert('Erro inesperado ao realizar cadastro.');
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
              <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-50">
                <img src="/assets/logo-uarini.jpg" alt="Logo" className="w-12 h-12 object-contain" />
              </div>
            </div>

            <div className="space-y-4 mb-10">
              <h1 className="text-4xl font-extrabold text-[#002147] tracking-tight leading-tight">Novo Gestor</h1>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Habilite seu acesso administrativo para gerenciar recursos e laudos do Laboratório Municipal.
              </p>
            </div>

            <div className="mt-auto bg-[#eab308]/5 p-8 rounded-[32px] border border-[#eab308]/20 relative overflow-hidden">
              <div className="flex items-center gap-3 text-[#a16207] mb-3">
                <i className="fas fa-user-shield text-lg"></i>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Acesso Restrito</span>
              </div>
              <p className="text-[12px] text-slate-600 leading-relaxed font-semibold">
                Este cadastro requer um código de autorização mestre fornecido pela diretoria.
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
                    required type="email" placeholder="nome@laboratorio.com"
                    className="w-full pl-14 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-[#002147]/10 outline-none text-sm font-bold text-slate-700 transition-all"
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Senha (6 dígitos)</label>
                <div className="relative group">
                  <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors"></i>
                  <input
                    required type={showPassword ? "text" : "password"} maxLength={6} placeholder="••••••"
                    className="w-full pl-14 pr-12 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-[#002147]/10 outline-none text-sm font-bold text-slate-700 transition-all"
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#002147]">
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirmar Senha</label>
                <div className="relative group">
                  <i className="fas fa-check-double absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors"></i>
                  <input
                    required type={showConfirmPassword ? "text" : "password"} maxLength={6} placeholder="••••••"
                    className="w-full pl-14 pr-12 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-[#002147]/10 outline-none text-sm font-bold text-slate-700 transition-all"
                    value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#002147]">
                    <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5 mt-2">
                <label className="text-[10px] font-bold text-[#a16207] uppercase ml-1 tracking-[0.2em]">Código de Autorização do Laboratório</label>
                <div className="relative group">
                  <i className="fas fa-key absolute left-5 top-1/2 -translate-y-1/2 text-[#eab308] transition-colors"></i>
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
                Confirmar Acesso Administrativo
                <i className="fas fa-shield-halved text-[10px]"></i>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterPage;
