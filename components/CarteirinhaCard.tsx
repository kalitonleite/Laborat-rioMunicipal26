import React from 'react';
import QRCode from 'react-qr-code';
import { 
  Droplet, 
  AlertTriangle, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  MapPin, 
  User,
  CreditCard,
  Check
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

  const accentColor = "#00ff95";
  const darkBlue = "#0b2a44";
  const deepBlue = "#051320";

  // Formato da data para exibição
  const formatDate = (dateString: string) => {
    if (!dateString) return "--/--/----";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return "--/--/----";
    }
  };

  return (
    <div 
      id="carteirinha-digital"
      className="relative w-full max-w-[440px] aspect-[1/1.65] rounded-[50px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] font-sans text-white border border-white/5 transition-all duration-500 select-none"
      style={{ 
        background: `linear-gradient(180deg, ${darkBlue} 0%, ${deepBlue} 100%)`,
      }}
    >
      {/* Premium Background Waves & Refraction */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep background gradients */}
        <div className="absolute top-[-10%] right-[-15%] w-[100%] h-[50%] bg-cyan-400/10 blur-[120px] rounded-full rotate-[-15deg] transition-all duration-1000" />
        <div className="absolute bottom-[20%] left-[-20%] w-[100%] h-[60%] bg-blue-600/10 blur-[130px] rounded-full" />
        
        {/* Subtle Wave Shapes */}
        <div className="absolute inset-0 transition-opacity duration-1000">
          <svg className="absolute top-0 left-0 w-full h-full opacity-[0.07]" viewBox="0 0 400 800" preserveAspectRatio="none">
            <path d="M0,150 C120,200 280,100 400,150 L400,0 L0,0 Z" fill="white" />
            <path d="M0,350 C150,450 250,250 400,350 L400,800 L0,800 Z" fill="rgba(64, 150, 255, 0.2)" />
            <path d="M0,500 C100,550 300,450 400,550 L400,800 L0,800 Z" fill="rgba(0, 255, 149, 0.1)" />
          </svg>
        </div>
        
        {/* Glass glare */}
        <div className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-white/5 to-transparent skew-y-[-10deg] translate-y-[-50%]" />
      </div>

      {/* Header Area */}
      <header className="relative px-8 pt-10 pb-4 flex justify-between items-start z-30">
        {/* SUS DIGITAL Badge */}
        <div className="bg-[#00c978] shadow-[0_8px_20px_rgba(0,201,120,0.3)] px-5 py-2.5 rounded-2xl flex items-center gap-2 border border-white/20">
           <div className="bg-white rounded-md p-1 flex items-center justify-center shadow-lg w-4 h-4">
             <Check size={10} strokeWidth={4} className="text-[#00c978]" />
           </div>
           <span className="text-[12px] font-black uppercase tracking-[1.5px] text-white">SUS DIGITAL</span>
        </div>
        
        {/* Prefeitura Logo */}
        <div className="flex flex-col items-end">
           {config.logo_url ? (
             <img src={config.logo_url} alt="Logo" className="h-[60px] w-auto object-contain drop-shadow-xl" />
           ) : (
             <div className="flex flex-col items-center">
                <svg width="40" height="30" viewBox="0 0 100 80" className="mb-1 drop-shadow-lg">
                  <circle cx="50" cy="20" r="10" fill="white" />
                  <circle cx="30" cy="40" r="8" fill="white" opacity="0.7" />
                  <circle cx="70" cy="40" r="8" fill="white" opacity="0.7" />
                  <path d="M20,70 Q50,40 80,70" stroke="white" strokeWidth="4" fill="none" />
                </svg>
                <div className="text-center leading-[1.1]">
                   <p className="text-[7px] font-bold opacity-70 tracking-widest leading-none">PREFEITURA DE</p>
                   <p className="text-[20px] font-black tracking-tight leading-none text-white">UARINI</p>
                </div>
             </div>
           )}
        </div>
      </header>

      {/* Main Title Area */}
      <div className="relative px-8 mt-2 z-30 text-center">
         <h1 className="text-[28px] font-black tracking-tight leading-[1.05] text-white drop-shadow-lg mb-2">
           {config.nome_sistema || "Laboratório Municipal de Uarini"}
         </h1>
         <div className="flex items-center justify-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff95] shadow-[0_0_10px_#00ff95]"></span>
            <span className="text-[13px] font-black tracking-[5px] text-[#00ff95] uppercase drop-shadow-md">ANÁLISES CLÍNICAS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff95] shadow-[0_0_10px_#00ff95]"></span>
         </div>
      </div>

      {/* Patient Section */}
      <div className="relative px-8 flex items-center gap-8 mt-10 z-30">
         {/* Photo Frame */}
         <div className="relative flex-shrink-0">
            <div className="w-[140px] h-[140px] rounded-full p-1.5 bg-gradient-to-br from-white/20 to-transparent shadow-2xl overflow-hidden backdrop-blur-sm">
               <div className="w-full h-full rounded-full border-[1px] border-white/10 overflow-hidden bg-[#1a3a5a]/80 flex items-center justify-center relative">
                  {paciente.foto_url ? (
                     <img src={paciente.foto_url} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                     <User size={70} className="text-white/5" />
                  )}
                  {/* Subtle inner shadow for depth */}
                  <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] rounded-full"></div>
               </div>
            </div>
            
            {/* ATIVA Badge */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#00c978] shadow-[0_10px_25px_rgba(0,201,120,0.4)] rounded-full px-6 py-2 flex items-center gap-2.5 z-40 border border-white/20">
               <div className="bg-white rounded-full p-0.5 flex items-center justify-center w-3 h-3">
                  <Check size={8} strokeWidth={5} className="text-[#00c978]" />
               </div>
               <span className="text-[12px] font-black tracking-[1.5px] text-white">ATIVA</span>
            </div>
         </div>

         {/* Patient Details */}
         <div className="flex-1 min-w-0">
            <div className="mb-6">
               <p className="text-[10px] font-bold uppercase tracking-[2px] text-white/40 mb-1">NOME DO PACIENTE</p>
               <h2 className="text-[26px] font-black leading-tight tracking-tight text-white drop-shadow-lg">{paciente.nome || "João da Silva"}</h2>
            </div>
            
            <div className="flex items-center gap-0 relative">
               <div className="flex-1 pr-4 border-r border-white/10">
                  <p className="text-[9px] font-black text-white/20 tracking-[2px] uppercase mb-1.5">NÚMERO DO SUS</p>
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-[#00ff95]/80" />
                    <p className="text-[14px] font-black tracking-[1px] leading-none">{paciente.numero_sus || "123 4567 8901"}</p>
                  </div>
               </div>
               <div className="flex-1 pl-4">
                  <p className="text-[9px] font-black text-white/20 tracking-[2px] uppercase mb-1.5">DATA NASC.</p>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-[#00ff95]/80" />
                    <p className="text-[14px] font-black leading-none">{formatDate(paciente.data_nascimento)}</p>
                  </div>
               </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
               <p className="text-[9px] font-black text-white/20 tracking-[2px] uppercase mb-1.5">UNIDADE DE REFERÊNCIA</p>
               <div className="flex items-center gap-2">
                 <MapPin size={16} className="text-[#00ff95]" />
                 <p className="text-[13px] font-black text-white/90 truncate leading-none">{paciente.unidade_saude || "UBS Central de Uarini"}</p>
               </div>
            </div>
         </div>
      </div>

      {/* QR Code & Identity Validation Section */}
      <div className="relative px-8 mt-14 z-30">
         <div className="flex items-center justify-between gap-6">
            <div className="flex flex-col items-center gap-3 w-[100px]">
               <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
                  <ShieldCheck size={28} className="text-white/30" />
               </div>
               <p className="text-[8px] font-black text-center text-white/30 uppercase leading-snug tracking-wider">ESCANEIE PARA VALIDAR A IDENTIDADE</p>
            </div>
            
            <div className="relative group">
              {/* Animated Glow behind QR */}
              <div className="absolute -inset-6 bg-[#00ff95]/5 blur-[40px] rounded-full animate-pulse"></div>
              <div className="relative bg-white p-6 rounded-[35px] shadow-[0_25px_60px_rgba(0,0,0,0.7)] group-hover:scale-[1.02] transition-transform duration-500">
                 <div className="bg-white">
                    <QRCode 
                      value={qrValue} 
                      size={120} 
                      level="Q" 
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                 </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 w-[100px]">
               <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
                  <ShieldCheck size={28} className="text-white/30" />
               </div>
               <p className="text-[8px] font-black text-center text-white/30 uppercase leading-snug tracking-wider">USO EXCLUSIVO EM UNIDADES DE SAÚDE</p>
            </div>
         </div>

         {/* Valid Banner - Premium Glassmorphism */}
         <div className="mt-10 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 backdrop-blur-xl border border-white/10 rounded-[24px] py-4 px-8 flex items-center justify-center gap-4 shadow-xl">
            <div className="bg-[#00ff95]/20 p-1.5 rounded-full ring-4 ring-[#00ff95]/5">
              <ShieldCheck size={18} className="text-[#00ff95]" />
            </div>
            <p className="text-[11px] font-bold text-white/70 leading-tight">Carteirinha válida em todas as unidades de saúde do município.</p>
         </div>
      </div>

      {/* Footer Metadata Grid */}
      <footer className="absolute bottom-0 left-0 w-full bg-[#051320]/70 backdrop-blur-3xl border-t border-white/10 p-10 z-40">
         <div className="grid grid-cols-4 gap-0 mb-8 border-b border-white/5 pb-8">
            <div className="flex flex-col items-center gap-3 border-r border-white/5 pr-2">
               <Droplet size={22} className="text-[#60a5fa] drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]" strokeWidth={2.5} />
               <div className="text-center">
                  <p className="text-[8px] font-black text-white/30 uppercase mb-1 tracking-widest">SANGUE</p>
                  <p className="text-[18px] font-black text-white">{paciente.tipo_sanguineo || "O+"}</p>
               </div>
            </div>
            <div className="flex flex-col items-center gap-3 border-r border-white/5 px-2">
               <AlertTriangle size={22} className="text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" strokeWidth={2.5} />
               <div className="text-center max-w-full">
                  <p className="text-[8px] font-black text-white/30 uppercase mb-1 tracking-widest">ALERGIAS</p>
                  <p className="text-[13px] font-black text-white truncate w-full px-1">{paciente.alergias || "Dipirona"}</p>
               </div>
            </div>
            <div className="flex flex-col items-center gap-3 border-r border-white/5 px-2">
               <Phone size={22} className="text-[#34d399] drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" strokeWidth={2.5} />
               <div className="text-center">
                  <p className="text-[8px] font-black text-white/30 uppercase mb-1 tracking-widest">CONTATO</p>
                  <p className="text-[11px] font-black text-white leading-tight">{(paciente.contato_emergencia || "92 9999-9999").replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3")}</p>
               </div>
            </div>
            <div className="flex flex-col items-center gap-3 pl-2">
               <Calendar size={22} className="text-[#60a5fa] drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]" strokeWidth={2.5} />
               <div className="text-center">
                  <p className="text-[8px] font-black text-white/30 uppercase mb-1 tracking-widest">EMISSÃO</p>
                  <p className="text-[14px] font-black text-white">{paciente.data_emissao ? formatDate(paciente.data_emissao) : "10/05/2024"}</p>
               </div>
            </div>
         </div>

         <div className="text-center pt-2">
            <p className="text-[11px] font-bold uppercase tracking-[4px] text-white/20 whitespace-nowrap">Esta carteirinha é pessoal e intransferível.</p>
         </div>
      </footer>
    </div>
  );
};

export default CarteirinhaCard;
