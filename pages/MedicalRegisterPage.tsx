
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';

import { authService, dbService } from '../services/apiService';
import { maskCPF, maskPhone } from '../services/masks';

interface MedicalRegisterPageProps {
  onLogin: (user: User) => void;
}

const MedicalRegisterPage: React.FC<MedicalRegisterPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    unitCode: '',
    email: '',
    phone: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const unitCode = formData.unitCode.trim().toUpperCase();
      const codeData = await dbService.from('authorization_codes').select({
        code: unitCode,
        role: UserRole.MEDICAL
      });

      if (!codeData || codeData.length === 0) {
        alert('Código de autorização da unidade inválido!');
        return;
      }

      const cleanCPF = formData.cpf.replace(/\D/g, '');

      await authService.register({
        cpf: cleanCPF,
        name: formData.name,
        role: UserRole.PENDING_MEDICAL
      });

      alert(`Cadastro médico realizado com sucesso! Sua senha de acesso inicial são os primeiros 6 dígitos do seu CPF (${cleanCPF.substring(0, 6)}). Você poderá alterá-la no seu painel.`);
      navigate('/medical/login');
    } catch (err: any) {
      console.error('Registration error:', err);
      alert(err.message || 'Erro inesperado ao realizar cadastro.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f9ff] relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="flex-grow flex items-center justify-center p-4 relative z-10 py-12">
        <div className="bg-white/90 backdrop-blur-2xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(30,58,138,0.15)] w-full max-w-4xl p-8 md:p-12 flex flex-col md:flex-row gap-12 border border-white/50 modern-shadow">
          {/* Lado Esquerdo - Info */}
          <div className="md:w-1/3 flex flex-col">
            <div className="flex justify-between items-start mb-10">
              <button
                onClick={() => navigate('/medical/login')}
                className="text-slate-400 hover:text-[#1e3a8a] transition-all bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm"
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <div className="bg-white p-2 rounded-2xl shadow-xl border border-blue-50">
                <img src="/assets/logo-uarini.jpg" alt="Logo" className="w-12 h-12 object-contain" />
              </div>
            </div>

            <div className="space-y-4 mb-8 md:mb-10">
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#1e3a8a] tracking-tight leading-tight">Cadastro Médico</h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
                Solicite seu acesso ao Portal Médico para gerenciar laudos e históricos do Laboratório Municipal.
              </p>
            </div>

            <div className="mt-auto bg-blue-50 p-6 rounded-[32px] border border-blue-100 relative overflow-hidden group">
              <div className="flex items-center gap-3 text-blue-600 mb-2">
                <i className="fas fa-key text-lg"></i>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Senha Automática</span>
              </div>
              <p className="text-[11px] text-blue-900/70 leading-relaxed font-semibold">
                Sua senha inicial será gerada com os <strong>6 primeiros dígitos do seu CPF</strong>.
              </p>
            </div>
          </div>

          {/* Lado Direito - Form */}
          <div className="md:w-2/3">
            <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <div className="relative group">
                  <i className="fas fa-user-md absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors"></i>
                  <input
                    required type="text" placeholder="Como no seu registro profissional"
                    className="w-full pl-14 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-bold text-slate-700 transition-all"
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">CPF (Identificação)</label>
                <div className="relative group">
                  <i className="fas fa-id-card absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors"></i>
                  <input
                    required type="text" placeholder="000.000.000-00"
                    className="w-full pl-14 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-bold text-slate-700 transition-all"
                    value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail Profissional</label>
                <div className="relative group">
                  <i className="fas fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors"></i>
                  <input
                    required type="email" placeholder="nome@saude.gov.br"
                    className="w-full pl-14 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-bold text-slate-700 transition-all"
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                <div className="relative group">
                  <i className="fas fa-phone absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors"></i>
                  <input
                    type="tel" placeholder="(00) 00000-0000"
                    className="w-full pl-14 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-bold text-slate-700 transition-all"
                    value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5 mt-2">
                <label className="text-[10px] font-bold text-blue-600 uppercase ml-1 tracking-[0.2em]">Código de Autorização da Unidade</label>
                <div className="relative group">
                  <i className="fas fa-hospital-symbol absolute left-5 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 transition-colors"></i>
                  <input
                    required type="text" placeholder="Solicite à administração"
                    className="w-full pl-14 pr-4 py-5 rounded-2xl border border-blue-100 bg-blue-50/30 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-blue-900 transition-all"
                    value={formData.unitCode} onChange={(e) => setFormData({ ...formData, unitCode: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="md:col-span-2 w-full bg-[#1e3a8a] text-white font-extrabold py-5 rounded-3xl shadow-2xl hover:bg-blue-900 hover:-translate-y-0.5 transition-all mt-6 uppercase tracking-widest text-xs flex items-center justify-center gap-4 active:scale-95">
                Confirmar Registro Médico
                <i className="fas fa-check-circle text-[10px]"></i>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalRegisterPage;
