import React from 'react';
import QRCode from 'react-qr-code';
import { 
  Droplet, 
  AlertTriangle, 
  Phone, 
  Calendar, 
  CheckCircle, 
  ShieldCheck, 
  MapPin, 
  User,
  CreditCard
} from 'lucide-react';

interface CarteirinhaCardProps {
  paciente: {
    id: string;
    nome: string;
    cpf: string;
    numero_sus: string;
    data_nascimento: string;
    foto_url: string;
    tipo_sanguineo: string;
    alergias: string;
    contato_emergencia: string;
    unidade_saude: string;
    status: string;
    qr_token: string;
    data_emissao?: string;
  };
  config: {
    logo_url: string;
    cor_primaria: string;
    cor_secundaria: string;
    cor_destaque: string;
    nome_sistema: string;
    texto_rodape: string;
  };
}

const CarteirinhaCard: React.FC<CarteirinhaCardProps> = ({ paciente, config }) => {
  const qrValue = `https://laborat-rio-municipal26.vercel.app/#/validacao/${paciente.id || paciente.qr_token}?token=${paciente.qr_token}`;

  // Use values from JSON spec primarily
  const accentColor = "#00ff95";
  const glassBackground = "rgba(255, 255, 255, 0.03)";
  const glassBorder = "rgba(255, 255, 255, 0.08)";

  return (
    <div 
      className="relative w-full max-w-[450px] aspect-[1/1.6] rounded-[28px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.4)] font-sans text-white border transition-all duration-300 hover:scale-[1.02]"
      style={{ 
        background: "linear-gradient(135deg, #0b2a44, #071a2c)",
        borderColor: glassBorder
      }}
    >
      {/* Background Decorative Waves/Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,rgba(0,255,149,0.05)_0%,transparent_70%)]" />
        {/* Subtle Wave Effect */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <svg className="absolute top-[40%] left-0 w-full opacity-10" viewBox="0 0 1440 320" fill="none">
          <path fill={accentColor} fillOpacity="0.2" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,149.3C672,149,768,203,864,202.7C960,203,1056,149,1152,122.7C1248,96,1344,96,1392,96L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* 1. Header Section */}
      <header className="relative p-6 pt-8 flex justify-between items-start z-10">
        <div className="bg-[#00ff95]/10 backdrop-blur-md border border-[#00ff95]/20 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
           <CheckCircle size={12} color={accentColor} fill={accentColor} fillOpacity={0.2} />
           <span className="text-[10px] font-black uppercase tracking-[1.5px]" style={{ color: accentColor }}>SUS DIGITAL</span>
        </div>
        <div className="flex flex-col items-center">
           {config.logo_url ? (
              <img src={config.logo_url} alt="Logo" className="h-12 w-auto object-contain drop-shadow-md" />
           ) : (
              <div className="flex flex-col items-center">
                <ShieldCheck size={28} color={accentColor} />
                <span className="text-[8px] font-bold mt-1 opacity-60">PREFEITURA DE</span>
                <span className="text-[12px] font-black tracking-widest text-center leading-none">UARINI</span>
              </div>
           )}
        </div>
      </header>

      {/* Title Section */}
      <div className="relative text-center px-6 mt-2 z-10">
         <h1 className="text-[22px] font-black tracking-tight leading-tight">{config.nome_sistema || "Laboratório Municipal de Uarini"}</h1>
         <div className="flex items-center justify-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }}></span>
            <span className="text-[11px] font-black tracking-[4px]" style={{ color: accentColor }}>ANÁLISES CLÍNICAS</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }}></span>
         </div>
      </div>

      {/* 2. Patient Section */}
      <div className="relative px-8 flex flex-col items-center mt-10 z-10">
         <div className="flex w-full items-center gap-6">
            <div className="relative">
               <div className="w-[110px] h-[110px] rounded-full border-2 border-white/20 shadow-2xl overflow-hidden bg-slate-800/50 flex items-center justify-center">
                  {paciente.foto_url ? (
                     <img src={paciente.foto_url} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                     <User size={48} className="opacity-20" />
                  )}
               </div>
               {/* Ativa Badge */}
               <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#00ff95]/10 backdrop-blur-xl border border-[#00ff95]/30 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg shadow-black/20">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }}></div>
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: accentColor }}>ATIVA</span>
               </div>
            </div>

            <div className="flex-1 space-y-4">
               <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">NOME DO PACIENTE</p>
                  <h2 className="text-[20px] font-black leading-tight tracking-tight">{paciente.nome}</h2>
               </div>
               
               <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-3">
                     <CreditCard size={14} className="opacity-50" style={{ color: accentColor }} />
                     <div>
                        <p className="text-[8px] font-black opacity-30 tracking-widest uppercase">NÚMERO DO SUS</p>
                        <p className="text-[13px] font-bold tracking-[1.5px]">{paciente.numero_sus}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <Calendar size={14} className="opacity-50" style={{ color: accentColor }} />
                     <div>
                        <p className="text-[8px] font-black opacity-30 tracking-widest uppercase">DATA DE NASCIMENTO</p>
                        <p className="text-[13px] font-bold">{new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')}</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <div className="w-full mt-6 flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
            <MapPin size={14} style={{ color: accentColor }} />
            <div>
               <p className="text-[8px] font-black opacity-30 tracking-widest uppercase">UNIDADE DE REFERÊNCIA</p>
               <p className="text-[12px] font-black text-white/90">{paciente.unidade_saude || "UBS Central de Uarini"}</p>
            </div>
         </div>
      </div>

      {/* 3. QR Section */}
      <div className="relative px-8 mt-10 z-10">
         <div className="flex items-center justify-between gap-4">
            <p className="text-[8px] font-black text-center opacity-40 leading-tight w-20">ESCANEIE PARA VALIDAR A IDENTIDADE</p>
            
            <div className="bg-white p-3 rounded-[24px] shadow-[0_15px_30px_rgba(0,0,0,0.5)] transform transition-transform hover:scale-105">
               <div className="bg-white p-2 rounded-[16px]">
                  <QRCode value={qrValue} size={110} bgColor="#FFFFFF" fgColor="#000000" level="H" />
               </div>
            </div>

            <p className="text-[8px] font-black text-center opacity-40 leading-tight w-20">USO EXCLUSIVO EM UNIDADES DE SAÚDE</p>
         </div>

         {/* Valid Banner */}
         <div className="mt-8 bg-blue-600/10 backdrop-blur-md border border-blue-400/20 rounded-2xl p-3 flex items-center justify-center gap-3">
            <ShieldCheck size={14} style={{ color: accentColor }} />
            <p className="text-[9px] font-bold text-center opacity-90">Carteirinha válida em todas as unidades de saúde do município.</p>
         </div>
      </div>

      {/* 4. Footer Icons Section */}
      <footer className="absolute bottom-0 left-0 w-full bg-[#0a1f33]/60 backdrop-blur-xl border-t border-white/5 p-8 pt-6 z-10 flex flex-col gap-6">
         <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col items-center">
               <Droplet size={18} color="#60a5fa" className="mb-2" />
               <p className="text-[8px] font-black opacity-30 tracking-widest uppercase text-center">SANGUE</p>
               <p className="text-[12px] font-black">{paciente.tipo_sanguineo || "O+"}</p>
            </div>
            <div className="flex flex-col items-center border-l border-white/10">
               <AlertTriangle size={18} color="#fbbf24" className="mb-2" />
               <p className="text-[8px] font-black opacity-30 tracking-widest uppercase text-center">ALERGIAS</p>
               <p className="text-[10px] font-black text-center truncate w-full px-1">{paciente.alergias || "Dipirona"}</p>
            </div>
            <div className="flex flex-col items-center border-l border-white/10">
               <Phone size={18} color="#34d399" className="mb-2" />
               <p className="text-[8px] font-black opacity-30 tracking-widest uppercase text-center">CONTATO</p>
               <p className="text-[9px] font-black text-center truncate w-full px-1">{paciente.contato_emergencia || "(92) 99999-9999"}</p>
            </div>
            <div className="flex flex-col items-center border-l border-white/10">
               <Calendar size={18} color="#60a5fa" className="mb-2" />
               <p className="text-[8px] font-black opacity-30 tracking-widest uppercase text-center">EMISSÃO</p>
               <p className="text-[11px] font-black">{paciente.data_emissao ? new Date(paciente.data_emissao).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</p>
            </div>
         </div>

         <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[3px] opacity-30">Esta carteirinha é pessoal e intransferível.</p>
         </div>
      </footer>
      
      {/* Glossy Overlay Reflect */}
      <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-[28px] m-1 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]"></div>
    </div>
  );
};

export default CarteirinhaCard;
