
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { authService } from '../services/apiService';
import { useSettings } from '../contexts/SettingsContext';
import { maskCPF, maskSUS, maskPhone } from '../services/masks';

interface RegisterPageProps {
  onLogin: (user: User) => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { appLogo } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    sus_number: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCPF = formData.cpf.replace(/\D/g, '');
    const cleanSUS = formData.sus_number.replace(/\D/g, '');

    if (cleanCPF.length !== 11) {
      alert("O CPF deve conter exatamente 11 dígitos.");
      return;
    }

    if (cleanSUS.length > 0 && cleanSUS.length !== 15) {
      alert("O Cartão SUS deve conter exatamente 15 dígitos.");
      return;
    }

    try {
      console.log('Registering user with CPF/SUS:', cleanCPF, cleanSUS);

      await authService.register({
        cpf: cleanCPF,
        name: formData.name,
        role: UserRole.PATIENT,
        sus_number: cleanSUS,
        email: formData.email,
        phone: formData.phone.replace(/\D/g, '')
      });

      alert(`Cadastro realizado com sucesso! Sua senha de acesso inicial são os primeiros 6 dígitos do seu CPF (${cleanCPF.substring(0, 6)}). Você poderá alterá-la no seu painel.`);
      navigate('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      alert(err.message || 'Erro inesperado ao realizar cadastro.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] relative overflow-hidden">
      {/* Background Decorativo Moderno */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#002147]/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#22c55e]/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="flex-grow flex items-center justify-center p-4 relative z-10 py-12 md:py-20">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,33,71,0.15)] w-full max-w-4xl p-8 md:p-12 flex flex-col md:flex-row gap-12 border border-white/50 modern-shadow">
          {/* Lado Esquerdo - Boas Vindas */}
          <div className="md:w-1/3 flex flex-col">
            <div className="flex justify-between items-start mb-10">
              <button
                onClick={() => navigate('/')}
                className="text-slate-400 hover:text-[#002147] transition-all bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm"
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <div className="bg-white rounded-2xl shadow-xl border border-slate-50 overflow-hidden w-20 h-20">
                <img src={appLogo || "/assets/logo-uarini.jpg"} alt="Logo" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="space-y-4 mb-8 md:mb-10">
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#002147] tracking-tight leading-tight">Novo Registro</h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
                Crie sua conta para acessar seus exames e acompanhar sua saúde no Laboratório Municipal.
              </p>
            </div>

            <div className="mt-auto bg-[#002147]/10 p-6 rounded-[32px] border border-[#002147]/10 relative overflow-hidden group">
              <div className="flex items-center gap-3 text-[#002147] mb-2">
                <i className="fas fa-key text-lg"></i>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Senha Automática</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                Sua senha inicial será gerada automaticamente com os <strong>6 primeiros dígitos do seu CPF</strong>.
              </p>
            </div>
          </div>

          {/* Lado Direito - Formulário */}
          <div className="md:w-2/3">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <div className="relative group">
                  <i className="fas fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors"></i>
                  <input
                    required type="text" placeholder="Como no seu documento"
                    className="w-full pl-14 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-[#002147]/5 outline-none text-sm font-bold text-slate-700 transition-all"
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
                    className="w-full pl-14 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-[#002147]/5 outline-none text-sm font-bold text-slate-700 transition-all"
                    value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Número do Cartão SUS</label>
                <div className="relative group">
                  <i className="fas fa-address-card absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#22c55e] transition-colors"></i>
                  <input
                    type="text" placeholder="15 dígitos numéricos"
                    className="w-full pl-14 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-[#22c55e]/5 outline-none text-sm font-bold text-slate-700 transition-all"
                    value={formData.sus_number} onChange={(e) => setFormData({ ...formData, sus_number: maskSUS(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail Pessoal</label>
                <div className="relative group">
                  <i className="fas fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors"></i>
                  <input
                    type="email" placeholder="seu@email.com"
                    className="w-full pl-14 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-[#002147]/5 outline-none text-sm font-bold text-slate-700 transition-all"
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
                    className="w-full pl-14 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-[#002147]/5 outline-none text-sm font-bold text-slate-700 transition-all"
                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                  />
                </div>
              </div>

              <div className="md:col-span-2 bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 mt-4">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/20">
                    <i className="fas fa-info-circle text-white"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">Nota de Segurança</h4>
                    <p className="text-[11px] text-blue-800/70 font-medium leading-relaxed">
                      Sua senha será gerada automaticamente. Após o primeiro acesso, você poderá alterá-la na aba "Perfil" do seu painel.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="md:col-span-2 w-full bg-[#002147] text-white font-extrabold py-5 rounded-3xl shadow-2xl hover:bg-black hover:-translate-y-0.5 transition-all mt-6 uppercase tracking-widest text-xs flex items-center justify-center gap-4 active:scale-95"
              >
                Finalizar Cadastro Institucional
                <i className="fas fa-check-circle text-[10px]"></i>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
