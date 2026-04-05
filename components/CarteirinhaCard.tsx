import React from 'react';
import QRCode from 'react-qr-code';

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

  // Default deep blue theme if config colors are not provided or default
  const baseColor = config.cor_primaria || '#0f2a44';
  const secondaryColor = config.cor_secundaria || '#0a1f33';
  const accentColor = config.cor_destaque || '#00ff95';

  return (
    <div 
      className="relative w-full max-w-[450px] aspect-[1/1.6] rounded-[40px] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] font-sans text-white border border-white/10"
      style={{ 
        background: `linear-gradient(180deg, ${baseColor}, ${secondaryColor})`,
      }}
    >
      {/* Background Gloss Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
         <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] rounded-full blur-[80px]" style={{ backgroundColor: accentColor }} />
         <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] rounded-full blur-[80px]" style={{ backgroundColor: accentColor + '33' }} />
      </div>

      {/* Decorative Waves/Texture */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/graphy-dark.png')]"></div>

      {/* 1. Header Section */}
      <header className="relative p-8 pb-4 flex justify-between items-start">
         <div className="flex flex-col gap-1">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full flex items-center gap-2 w-fit shadow-sm">
               <i className="fas fa-check-circle text-[10px]" style={{ color: accentColor }}></i>
               <span className="text-[9px] font-black uppercase tracking-[1px]">SUS DIGITAL</span>
            </div>
            <h1 className="text-[20px] font-black leading-tight mt-4 tracking-[-1px]">{config.nome_sistema}</h1>
            <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }}></span>
               <p className="text-[10px] font-black uppercase tracking-[3px] opacity-80" style={{ color: accentColor }}>ANÁLISES CLÍNICAS</p>
               <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }}></span>
            </div>
         </div>
         <div className="flex flex-col items-center">
            {config.logo_url ? (
               <img src={config.logo_url} alt="Logo Prefeitura" className="h-16 w-auto object-contain drop-shadow-lg" />
            ) : (
               <div className="text-[12px] font-bold text-center opacity-70">
                  <i className="fas fa-landmark text-2xl mb-1"></i>
                  <br/>PREFEITURA DE UARINI
               </div>
            )}
         </div>
      </header>

      {/* 2. Patient Profile Section */}
      <div className="relative px-8 flex gap-8 items-center mt-6">
         <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 shadow-2xl overflow-hidden relative z-10" style={{ borderColor: accentColor }}>
               {paciente.foto_url ? (
                  <img src={paciente.foto_url} alt="Foto" className="w-full h-full object-cover" />
               ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                     <i className="fas fa-user text-4xl opacity-20 text-white"></i>
                  </div>
               )}
            </div>
            {/* Glow backing */}
            <div className="absolute inset-0 rounded-full blur-[20px] opacity-30 z-0 scale-110" style={{ backgroundColor: accentColor }} />
            
            {/* Ativa Badge */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-4 py-1 flex items-center gap-2 shadow-lg">
               <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }}></span>
               <span className="text-[9px] font-black uppercase tracking-wider">ATIVA</span>
            </div>
         </div>

         <div className="flex-1">
            <div className="mb-4">
               <p className="text-[8px] uppercase tracking-widest opacity-50 mb-0.5">NOME DO PACIENTE</p>
               <h3 className="text-[20px] font-black leading-tight truncate">{paciente.nome}</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
               <div className="flex items-center gap-3">
                  <div className="w-6 flex justify-center opacity-70"><i className="fas fa-id-card text-xs"></i></div>
                  <div>
                     <p className="text-[7px] uppercase tracking-widest opacity-40">NÚMERO DO SUS</p>
                     <p className="text-[12px] font-bold tracking-[1px]">{paciente.numero_sus}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-6 flex justify-center opacity-70"><i className="fas fa-calendar-alt text-xs"></i></div>
                  <div>
                     <p className="text-[7px] uppercase tracking-widest opacity-40">DATA DE NASCIMENTO</p>
                     <p className="text-[12px] font-bold">{new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-6 flex justify-center opacity-70" style={{ color: accentColor }}><i className="fas fa-map-marker-alt text-xs"></i></div>
                  <div>
                     <p className="text-[7px] uppercase tracking-widest opacity-40">UNIDADE DE REFERÊNCIA</p>
                     <p className="text-[11px] font-black text-white/90">{paciente.unidade_saude || 'UBS Central de Uarini'}</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 3. QR Code Central Section */}
      <div className="relative mt-12 px-8">
         <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col items-center gap-2 text-center max-w-[80px]">
               <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <i className="fas fa-check text-[10px] opacity-70"></i>
               </div>
               <p className="text-[7px] font-black uppercase opacity-60 leading-tight">ESCANEIE PARA VALIDAR A IDENTIDADE</p>
            </div>

            <div className="bg-white p-2.5 rounded-[32px] shadow-2xl transform rotate-[0deg] transition-transform hover:rotate-1">
               <div className="bg-white p-2 rounded-[20px]">
                  <QRCode value={qrValue} size={130} bgColor="#FFFFFF" fgColor="#000000" level="H" />
               </div>
            </div>

            <div className="flex flex-col items-center gap-2 text-center max-w-[80px]">
               <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <i className="fas fa-shield-alt text-[10px] opacity-70"></i>
               </div>
               <p className="text-[7px] font-black uppercase opacity-60 leading-tight">USO EXCLUSIVO EM UNIDADES DE SAÚDE</p>
            </div>
         </div>

         {/* Validation Banner */}
         <div className="mt-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex items-center justify-center gap-3 shadow-inner">
            <i className="fas fa-certificate text-xs" style={{ color: accentColor }}></i>
            <p className="text-[9px] font-bold text-center opacity-90">Carteirinha válida em todas as unidades de saúde do município.</p>
         </div>
      </div>

      {/* 4. Footer Information Section */}
      <footer className="absolute bottom-0 left-0 w-full bg-black/20 backdrop-blur-md border-t border-white/10 p-8 pt-6">
         <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="text-center">
               <i className="fas fa-tint text-blue-400 text-lg mb-2"></i>
               <p className="text-[8px] uppercase tracking-widest opacity-40">TIPO SANGUÍNEO</p>
               <p className="text-[11px] font-black">{paciente.tipo_sanguineo || 'O+'}</p>
            </div>
            <div className="text-center border-l border-white/10">
               <i className="fas fa-exclamation-triangle text-amber-500 text-lg mb-2"></i>
               <p className="text-[8px] uppercase tracking-widest opacity-40">ALERGIAS</p>
               <p className="text-[10px] font-black truncate px-1">{paciente.alergias || 'Nenhuma'}</p>
            </div>
            <div className="text-center border-l border-white/10">
               <i className="fas fa-phone-alt text-green-400 text-lg mb-2"></i>
               <p className="text-[8px] uppercase tracking-widest opacity-40">CONTATO</p>
               <p className="text-[9px] font-black truncate px-1">{paciente.contato_emergencia || '-'}</p>
            </div>
            <div className="text-center border-l border-white/10">
               <i className="fas fa-calendar-check text-blue-300 text-lg mb-2"></i>
               <p className="text-[8px] uppercase tracking-widest opacity-40">EMISSÃO</p>
               <p className="text-[10px] font-black">{paciente.data_emissao ? new Date(paciente.data_emissao).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</p>
            </div>
         </div>
         
         <div className="text-center">
            <p className="text-[9px] font-medium opacity-40 italic">Esta carteirinha é pessoal e intransferível.</p>
         </div>
      </footer>
      
      {/* Gloss overlay highlight */}
      <div className="absolute inset-0 pointer-events-none border-[1px] border-white/20 rounded-[40px] m-1"></div>
    </div>
  );
};

export default CarteirinhaCard;
