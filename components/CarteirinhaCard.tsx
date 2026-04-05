import React from 'react';
import QRCode from 'react-qr-code'; 

interface CarteirinhaCardProps {
  paciente: {
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
  const qrValue = `https://app.com/paciente/${paciente.id || paciente.qr_token}?token=${paciente.qr_token}`;

  return (
    <div 
      className="relative w-full max-w-[400px] aspect-[1.6/1] rounded-[24px] overflow-hidden shadow-2xl transition-all hover:scale-[1.02] cursor-default font-sans text-white border border-white/10"
      style={{ 
        background: `linear-gradient(135deg, ${config.cor_primaria}, ${config.cor_secundaria})`,
      }}
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-[-50px] right-[-50px] w-48 h-48 rounded-full blur-[60px]" style={{ backgroundColor: config.cor_destaque + '33' }} />
      <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 rounded-full blur-[40px]" style={{ backgroundColor: config.cor_destaque + '1a' }} />

      {/* Header */}
      <div className="relative p-6 pb-2 flex justify-between items-start">
        <div className="flex items-center gap-3">
          {config.logo_url ? (
            <img src={config.logo_url} alt="Logo" className="h-10 w-auto object-contain" />
          ) : (
             <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl" style={{ backgroundColor: config.cor_destaque, color: config.cor_primaria }}>
               SUS
             </div>
          )}
          <div>
            <h1 className="text-[10px] uppercase tracking-[2px] opacity-70 font-black">Sistema Único de Saúde</h1>
            <h2 className="text-[14px] font-bold leading-tight">{config.nome_sistema}</h2>
          </div>
        </div>
        <div className="text-right">
          <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/10 border border-white/20 whitespace-nowrap">
            {paciente.status === 'ativo' ? (
               <span className="flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: config.cor_destaque }}></span>
                 Ativo
               </span>
            ) : 'Inativo'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative px-6 flex gap-6 items-center flex-1">
        {/* Photo Container */}
        <div className="relative group">
           <div className="w-24 h-24 rounded-full border-4 shadow-lg overflow-hidden relative z-10" style={{ borderColor: config.cor_destaque }}>
              {paciente.foto_url ? (
                <img src={paciente.foto_url} alt="Foto Paciente" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  <i className="fas fa-user text-3xl opacity-30"></i>
                </div>
              )}
           </div>
           {/* Glow Effect */}
           <div className="absolute inset-0 rounded-full blur-md opacity-50 z-0 scale-105" style={{ backgroundColor: config.cor_destaque }} />
        </div>

        {/* Patient Details */}
        <div className="flex-1 space-y-1">
          <div>
            <p className="text-[8px] uppercase tracking-widest opacity-60">Nome Completo</p>
            <p className="text-[13px] font-bold truncate max-w-[180px]">{paciente.nome}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[8px] uppercase tracking-widest opacity-60">CPF</p>
              <p className="text-[11px] font-mono">{paciente.cpf}</p>
            </div>
            <div>
               <p className="text-[8px] uppercase tracking-widest opacity-60">Nascimento</p>
               <p className="text-[11px]">{new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-widest opacity-60">Nº Cartão SUS</p>
            <p className="text-[12px] font-black tracking-widest" style={{ color: config.cor_destaque }}>{paciente.numero_sus}</p>
          </div>
        </div>
      </div>

      {/* Footer / QR / Technical Info */}
      <div className="relative flex justify-between items-end p-6 pt-0">
        <div className="space-y-1">
           <div className="flex gap-3">
              <div>
                <p className="text-[7px] uppercase tracking-widest opacity-60">Tipo Sanguíneo</p>
                <p className="text-[11px] font-bold text-red-500">{paciente.tipo_sanguineo || 'N/I'}</p>
              </div>
              <div>
                <p className="text-[7px] uppercase tracking-widest opacity-60">Unidade</p>
                <p className="text-[11px] font-bold">{paciente.unidade_saude || 'Geral'}</p>
              </div>
           </div>
           <p className="text-[8px] opacity-40 italic">{config.texto_rodape}</p>
        </div>

      </div>
      
      {/* QR Code - Absolute positioned for precise alignment and no clipping */}
      <div className="absolute bottom-5 right-5 p-1 bg-white rounded-xl shadow-2xl transition-transform hover:scale-110">
        <div className="bg-white p-1 rounded-lg">
           <QRCode value={qrValue} size={54} bgColor="#FFFFFF" fgColor="#000000" />
        </div>
      </div>
      
      {/* Decorative texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
    </div>
  );
};

export default CarteirinhaCard;
