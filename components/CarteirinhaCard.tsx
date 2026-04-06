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

  const accentColor = "#00ff95";
  const glassBorder = "rgba(255, 255, 255, 0.08)";

  return (
    <div 
      className="relative w-full max-w-[450px] aspect-[1/1.45] rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] font-sans text-white border transition-all duration-300"
      style={{ 
        background: "linear-gradient(135deg, #0b2a44, #071a2c)",
        borderColor: glassBorder
      }}
    >
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[50%] bg-[#00ff95]/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative p-6 pb-2 flex justify-between items-start z-10">
        <div className="bg-[#00ff95]/10 backdrop-blur-md border border-[#00ff95]/20 px-3 py-1 rounded-full flex items-center gap-2 shadow-sm">
           <CheckCircle size={10} color={accentColor} fill={accentColor} fillOpacity={0.2} />
           <span className="text-[9px] font-black uppercase tracking-[1px]" style={{ color: accentColor }}>SUS DIGITAL</span>
        </div>
        <div className="flex flex-col items-center">
           {config.logo_url ? (
              <img src={config.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
           ) : (
              <div className="flex flex-col items-center opacity-80">
                <ShieldCheck size={24} color={accentColor} />
                <span className="text-[7px] font-bold mt-0.5">PREFEITURA DE</span>
                <span className="text-[10px] font-black tracking-widest whitespace-nowrap">UARINI</span>
              </div>
           )}
        </div>
      </header>

      {/* Title */}
      <div className="relative px-6 mt-1 z-10">
         <h1 className="text-[20px] font-black tracking-tight leading-tight w-[70%]">{config.nome_sistema || "Laboratório Municipal de Uarini"}</h1>
         <div className="flex items-center gap-2 mt-1">
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: accentColor }}></span>
            <span className="text-[10px] font-black tracking-[3px]" style={{ color: accentColor }}>ANÁLISES CLÍNICAS</span>
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: accentColor }}></span>
         </div>
      </div>

      {/* Patient Info Section */}
      <div className="relative px-6 flex items-center gap-5 mt-8 z-10">
         <div className="relative flex-shrink-0">
            <div className="w-[100px] h-[100px] rounded-full border-2 border-[#00ff95]/40 shadow-2xl overflow-hidden bg-slate-800/80 flex items-center justify-center relative z-10">
               {paciente.foto_url ? (
                  <img src={paciente.foto_url} alt="Foto" className="w-full h-full object-cover" />
               ) : (
                  <User size={40} className="opacity-20" />
               )}
            </div>
            <div className="absolute inset-0 bg-[#00ff95]/20 blur-xl rounded-full z-0"></div>
            
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-xl border border-[#00ff95]/40 rounded-full px-3 py-0.5 flex items-center gap-1.5 shadow-lg z-20">
               <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }}></div>
               <span className="text-[9px] font-black tracking-wider" style={{ color: accentColor }}>ATIVA</span>
            </div>
         </div>

         <div className="flex-1 min-w-0">
            <div className="mb-3">
               <p className="text-[7px] font-bold uppercase tracking-widest opacity-40 mb-0.5">NOME DO PACIENTE</p>
               <h2 className="text-[18px] font-black leading-tight tracking-tight overflow-hidden text-ellipsis whitespace-nowrap">{paciente.nome}</h2>
            </div>
            
            <div className="space-y-2">
               <div className="flex items-center gap-2.5">
                  <CreditCard size={12} className="opacity-40" />
                  <div>
                     <p className="text-[7px] font-black opacity-30 tracking-widest uppercase mb-0.5">NÚMERO DO SUS</p>
                     <p className="text-[12px] font-bold tracking-[1px]">{paciente.numero_sus}</p>
                  </div>
               </div>
               <div className="flex items-center gap-2.5">
                  <Calendar size={12} className="opacity-40" />
                  <div>
                     <p className="text-[7px] font-black opacity-30 tracking-widest uppercase mb-0.5">DATA DE NASCIMENTO</p>
                     <p className="text-[12px] font-bold">{new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')}</p>
                  </div>
               </div>
               <div className="flex items-center gap-2.5">
                  <MapPin size={12} style={{ color: accentColor }} className="opacity-80" />
                  <div className="min-w-0">
                     <p className="text-[7px] font-black opacity-30 tracking-widest uppercase mb-0.5">UNIDADE DE REFERÊNCIA</p>
                     <p className="text-[10px] font-black text-white/90 truncate">{paciente.unidade_saude || "UBS Central de Uarini"}</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* QR Section */}
      <div className="relative px-6 mt-8 z-10">
         <div className="flex items-center justify-between gap-2">
            <p className="text-[8px] font-black text-center opacity-30 leading-tight w-20">ESCANEIE PARA VALIDAR A IDENTIDADE</p>
            
            <div className="bg-white p-2 rounded-[20px] shadow-2xl">
               <div className="bg-white p-1.5 rounded-[12px]">
                  <QRCode value={qrValue} size={100} bgColor="#FFFFFF" fgColor="#000000" level="Q" />
               </div>
            </div>

            <p className="text-[8px] font-black text-center opacity-30 leading-tight w-20">USO EXCLUSIVO EM UNIDADES DE SAÚDE</p>
         </div>

         <div className="mt-6 bg-white/5 backdrop-blur-md border border-white/5 rounded-xl p-2.5 flex items-center justify-center gap-2.5">
            <ShieldCheck size={12} style={{ color: accentColor }} />
            <p className="text-[8px] font-bold opacity-80">Carteirinha válida em todas as unidades de saúde do município.</p>
         </div>
      </div>

      {/* Footer Info Section */}
      <footer className="absolute bottom-0 left-0 w-full bg-slate-950/40 backdrop-blur-2xl border-t border-white/5 p-6 z-10">
         <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="flex flex-col items-center">
               <Droplet size={16} color="#60a5fa" className="mb-1" />
               <p className="text-[7px] font-black opacity-30 uppercase">SANGUE</p>
               <p className="text-[11px] font-black">{paciente.tipo_sanguineo || "O+"}</p>
            </div>
            <div className="flex flex-col items-center border-l border-white/5">
               <AlertTriangle size={16} color="#fbbf24" className="mb-1" />
               <p className="text-[7px] font-black opacity-30 uppercase">ALERGIAS</p>
               <p className="text-[9px] font-black text-center truncate w-full px-1">{paciente.alergias || "Dipirona"}</p>
            </div>
            <div className="flex flex-col items-center border-l border-white/5">
               <Phone size={16} color="#34d399" className="mb-1" />
               <p className="text-[7px] font-black opacity-30 uppercase">CONTATO</p>
               <p className="text-[8px] font-black text-center truncate w-full px-1">{paciente.contato_emergencia || "92 9999-9999"}</p>
            </div>
            <div className="flex flex-col items-center border-l border-white/5">
               <Calendar size={16} color="#60a5fa" className="mb-1" />
               <p className="text-[7px] font-black opacity-30 uppercase">EMISSÃO</p>
               <p className="text-[10px] font-black">{paciente.data_emissao ? new Date(paciente.data_emissao).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</p>
            </div>
         </div>

         <div className="text-center">
            <p className="text-[9px] font-bold uppercase tracking-[2px] opacity-20">Esta carteirinha é pessoal e intransferível.</p>
         </div>
      </footer>
    </div>
  );
};

export default CarteirinhaCard;
