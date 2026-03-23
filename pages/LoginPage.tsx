
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { maskCPF } from '../services/masks';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [identification, setIdentification] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const qrCardRef = useRef<HTMLDivElement>(null);

  // URL para o QR Code (usa a origem atual do app)
  // Configurado para cor branca (ffffff) e fundo azul (1e40af) para combinar com o estilo da imagem
  const appUrl = "https://laborat-rio-municipal26.vercel.app/";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(appUrl)}&color=ffffff&bgcolor=1e40af`;


  const validatePassword = (pass: string) => {
    const regex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6}$/;
    return regex.test(pass);
  };

  const { login } = useAuth();
  const { appLogo } = useSettings();

  const handleAuth = async (role: UserRole) => {
    if (role === UserRole.ADMIN) { navigate('/admin/login'); return; }
    if (role === UserRole.MEDICAL) { navigate('/medical/login'); return; }
    if (role === UserRole.RECEPTION) { navigate('/reception/login'); return; }

    if (!identification || !password) {
      alert('Preencha CPF e Senha.');
      return;
    }

    try {
      const cleanId = identification.replace(/\D/g, '');
      await login(cleanId, password, UserRole.PATIENT);
      navigate('/patient');
    } catch (err: any) {
      console.error('Login error:', err);
      alert(err.message || 'Erro ao realizar login. Verifique seus dados.');
    }
  };

  const captureCard = async () => {
    if (!qrCardRef.current) return null;
    return await html2canvas(qrCardRef.current, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      scale: 3,
      logging: false,
      onclone: (clonedDoc) => {
        // Garante que o elemento clonado esteja visível e com altura correta no processo de captura
        const el = clonedDoc.querySelector('[data-card-root]') as HTMLElement;
        if (el) {
          el.style.height = 'auto';
          el.style.aspectRatio = 'auto';
        }
      }
    });
  };

  const downloadPNG = async () => {
    const canvas = await captureCard();
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'Acesso_Laboratorio_Uarini.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const downloadPDF = async () => {
    const canvas = await captureCard();
    if (!canvas) return;

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = 140;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const x = (pdfWidth - imgWidth) / 2;
    const y = 40;

    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Cartão de Acesso Digital - Laboratório Municipal', pdfWidth / 2, 20, { align: 'center' });

    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

    pdf.setFontSize(8);
    pdf.text(`Emitido em: ${new Date().toLocaleString()}`, pdfWidth / 2, pdfHeight - 20, { align: 'center' });

    pdf.save('Acesso_Laboratorio_Uarini.pdf');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] relative overflow-hidden">
      {/* Background Decorativo Moderno */}
      {/* Top Banner Section: Filling the top of the screen */}
      <div className="w-full bg-gradient-to-br from-[#002147] via-[#002147] to-[#003366] pt-10 pb-20 md:pt-20 md:pb-32 px-4 flex flex-col items-center relative overflow-hidden shadow-2xl">
        {/* Decorative subtle logo background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <img src="/assets/logo-uarini.jpg" className="w-full h-full object-cover blur-3xl scale-150 md:scale-125" alt="" />
        </div>

        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[80%] md:w-[60%] h-[100%] bg-blue-400/10 blur-[80px] md:blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] md:w-[60%] h-[100%] bg-[#22c55e]/10 blur-[80px] md:blur-[120px] rounded-full"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="rounded-[40px] md:rounded-[60px] shadow-[0_30px_80px_rgba(0,0,0,0.5)] border border-white/30 mb-8 md:mb-12 transform hover:scale-110 transition-all duration-500 overflow-hidden w-48 h-48 md:w-96 md:h-96 flex items-center justify-center bg-white">
            <img
              src={appLogo || "/assets/logo-uarini.jpg"}
              alt="Logo Uarini"
              className="w-full h-full object-contain p-6"
            />
          </div>

          <h1 className="text-2xl md:text-5xl font-black text-white text-center leading-tight tracking-tighter drop-shadow-2xl px-4 md:px-6">
            Laboratório Municipal de Uarini
          </h1>

          <div className="flex items-center justify-center gap-2 md:gap-3 mt-3 md:mt-4 bg-white/5 backdrop-blur-md px-4 md:px-6 py-1.5 md:py-2 rounded-full border border-white/10">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#22c55e] rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
            <p className="text-[9px] md:text-xs text-[#22c55e] font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">Análises Clínicas</p>
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#22c55e] rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
          </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col items-center p-4 relative z-20 -mt-10 md:-mt-24 pb-12 md:pb-20">
        <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-[0_40px_80px_-15px_rgba(0,33,71,0.25)] w-full max-w-md p-6 md:p-10 flex flex-col items-center border border-white/80 backdrop-blur-xl relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 md:w-20 h-1 md:h-1.5 bg-gray-100 rounded-full"></div>

          <div className="w-full space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Identificação (CPF ou SUS)</label>
              <div className="relative group">
                <i className="fas fa-id-card absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors"></i>
                <input
                  type="text" placeholder="CPF ou Número SUS"
                  className="w-full pl-14 pr-4 py-4.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#002147]/5 focus:border-[#002147]/20 outline-none transition-all text-sm font-bold text-slate-700"
                  value={identification} onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d/.test(val) || val === '') {
                      // Se começar com número, tenta mascarar como CPF/SUS
                      setIdentification(maskCPF(val));
                    } else {
                      setIdentification(val);
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Senha de Acesso</label>
              <div className="relative group">
                <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors"></i>
                <input
                  type={showPassword ? "text" : "password"} maxLength={6} placeholder="••••••"
                  className="w-full pl-14 pr-14 py-4.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#002147]/5 focus:border-[#002147]/20 outline-none transition-all text-sm font-bold text-slate-700"
                  value={password} onChange={(e) => setPassword(e.target.value)}
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

            <div className="flex items-center justify-between px-2">
              <label className="flex items-center gap-2.5 text-[11px] text-slate-500 cursor-pointer font-semibold group">
                <div className="relative flex items-center">
                  <input type="checkbox" className="peer appearance-none w-4 h-4 rounded border-2 border-gray-200 checked:bg-[#002147] checked:border-[#002147] transition-all cursor-pointer" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  <i className="fas fa-check absolute scale-0 peer-checked:scale-100 text-white text-[8px] left-0.5 pointer-events-none transition-transform"></i>
                </div>
                Lembrar meus dados
              </label>
              <button
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] text-[#002147] hover:text-[#22c55e] transform hover:scale-105 transition-all font-bold uppercase tracking-tighter"
              >
                Esqueceu a senha?
              </button>
            </div>

            <button
              onClick={() => handleAuth(UserRole.PATIENT)}
              className="w-full bg-[#002147] text-white font-extrabold py-5 rounded-2xl shadow-[0_12px_24px_-8px_rgba(0,33,71,0.5)] hover:bg-[#001530] hover:-translate-y-0.5 transition-all mt-4 uppercase tracking-[0.1em] text-xs flex items-center justify-center gap-3 active:scale-95"
            >
              Iniciar Sessão
              <i className="fas fa-arrow-right text-[10px]"></i>
            </button>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button
                onClick={() => handleAuth(UserRole.RECEPTION)}
                className="w-full border border-gray-100 bg-white text-[#002147] font-bold py-4 rounded-xl flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest hover:border-[#002147]/20 hover:bg-gray-50 transition-all shadow-sm"
              >
                <i className="fas fa-id-card-clip"></i> Recepção
              </button>
              <button
                onClick={() => setShowQRModal(true)}
                className="w-full border border-gray-100 bg-white text-[#002147] font-bold py-4 rounded-xl flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest hover:border-[#002147]/20 hover:bg-gray-50 transition-all shadow-sm"
              >
                <i className="fas fa-qrcode"></i> QR CODE
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAuth(UserRole.MEDICAL)}
                className="w-full bg-[#22c55e]/5 text-[#15803d] font-bold py-4 rounded-xl flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest hover:bg-[#22c55e]/10 transition-all border border-[#22c55e]/10"
              >
                <i className="fas fa-stethoscope"></i> Médico
              </button>
              <button
                onClick={() => handleAuth(UserRole.ADMIN)}
                className="w-full bg-[#eab308]/5 text-[#a16207] font-bold py-4 rounded-xl flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest hover:bg-[#eab308]/10 transition-all border border-[#eab308]/10"
              >
                <i className="fas fa-user-shield"></i> Gestor
              </button>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-50 w-full text-center">
            <p className="text-xs text-slate-500 font-medium">
              Não possui acesso? <button onClick={() => navigate('/register')} className="text-[#002147] font-extrabold hover:text-[#22c55e] transition-colors">Solicitar Registro</button>
            </p>
          </div>

          <div className="mt-8 text-center text-[9px] text-black space-y-1">
            <p className="font-medium">Desenvolvedor: Biomédico Kaliton Goncalves Leite</p>
            <p className="font-bold uppercase tracking-widest">2026</p>
          </div>
        </div>
      </div>

      {/* QR CODE MODAL - ESTILIZADO CONFORME IMAGEM */}
      {showQRModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-sm flex flex-col items-center animate-in zoom-in-95 duration-300">


            {/* Cartão Estilizado */}
            <div
              ref={qrCardRef}
              data-card-root
              className="w-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col items-center p-10 pb-14 border border-white/20"
            >
              <button onClick={() => setShowQRModal(false)} className="absolute top-6 right-6 bg-white/10 hover:bg-red-500/80 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all border border-white/20 z-20">
                <i className="fas fa-times"></i>
              </button>
              <div className="absolute top-10 right-10 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute bottom-20 left-10 w-32 h-32 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="absolute top-20 left-12 opacity-30">
                <i className="fas fa-plus text-white text-3xl"></i>
              </div>
              <div className="absolute bottom-40 right-14 opacity-20">
                <i className="fas fa-plus text-white text-xl"></i>
              </div>

              <div className="relative z-10 flex flex-col items-center gap-4 mb-10 w-full">
                <div className="bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center w-14 h-14">
                  <i className="fas fa-microscope text-blue-800 text-2xl"></i>
                </div>
                <div className="text-center">
                  <h3 className="text-white text-lg font-black tracking-tight leading-none">Laboratório Municipal</h3>
                  <p className="text-blue-200 text-[8px] font-black uppercase tracking-[0.4em] mt-1">Análises Clínicas de Uarini</p>
                </div>
              </div>

              <div className="relative z-10 bg-white/5 p-4 rounded-[32px] border border-white/20 backdrop-blur-sm shadow-inner mb-10">
                <div className="bg-blue-700 p-2 rounded-2xl">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-48 h-48 rounded-lg"
                    crossOrigin="anonymous"
                  />
                </div>
              </div>

              <div className="relative z-10 mt-auto text-center w-full">
                <p className="text-white text-xs font-black uppercase tracking-widest mb-3 whitespace-nowrap">
                  ACESSO DIGITAL SEGURO
                </p>
                <div className="flex gap-2 justify-center opacity-40">
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 mt-8">
              <button
                onClick={downloadPNG}
                className="bg-white/10 hover:bg-white/20 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/10"
              >
                <i className="fas fa-image"></i> Baixar PNG
              </button>
              <button
                onClick={downloadPDF}
                className="bg-white text-blue-900 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-all shadow-xl"
              >
                <i className="fas fa-file-pdf"></i> Baixar PDF
              </button>
            </div>

            <p className="text-white/40 text-[9px] mt-6 text-center font-bold uppercase tracking-widest">
              Desenvolvido por Kaliton Gonçalves Leite
            </p>
          </div>
        </div>
      )}

      {/* MODAL ESQUECEU SENHA */}
      {showForgotModal && (
        <ForgotPasswordModal
          role={UserRole.PATIENT}
          onClose={() => setShowForgotModal(false)}
        />
      )}
    </div>
  );
};

export default LoginPage;
