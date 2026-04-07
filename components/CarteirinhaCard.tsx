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
  CheckCircle,
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

const CarteirinhaCard: React.FC<CarteirinhaCardProps> = ({ paciente: pacienteRaw, config: configRaw }) => {
  // Safe defaults so card never crashes on null/undefined props
  const paciente = pacienteRaw || {} as CarteirinhaCardProps['paciente'];
  const config = configRaw || {} as CarteirinhaCardProps['config'];

  const qrToken = paciente.qr_token || '';
  const pacienteId = paciente.id || qrToken;
  const qrValue = 'https://laborat-rio-municipal26.vercel.app/';

  const formatDate = (dateString: string) => {
    if (!dateString) return '--/--/----';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '--/--/----';
      return d.toLocaleDateString('pt-BR');
    } catch {
      return '--/--/----';
    }
  };

  const formatSUS = (sus: string) => {
    if (!sus) return '--- ---- ---- ----';
    const clean = sus.replace(/\D/g, '').substring(0, 15);
    // Standard format for 15 digits: 000 4444 4444 4444 (with 15 total)
    // Most SUS cards are 15 digits. 
    // Format: 123 4567 8901 2345
    return clean.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4').trim();
  };

  return (
    <div
      id="carteirinha-digital"
      style={{
        width: '560px',
        height: '354px',
        background: 'linear-gradient(180deg, #0d2d4a 0%, #071c30 50%, #091e35 100%)',
        borderRadius: '24px',
        overflow: 'hidden',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        color: 'white',
        boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
        border: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Background wave decoration */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '-20%',
          width: '140%',
          height: '80%',
          background: 'radial-gradient(ellipse at center, rgba(0,120,200,0.15) 0%, transparent 80%)',
          borderRadius: '50%',
          transform: 'rotate(-5deg)',
        }} />
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '70%',
          height: '70%',
          background: 'radial-gradient(ellipse at center, rgba(0,200,150,0.08) 0%, transparent 80%)',
          borderRadius: '50%',
        }} />
      </div>

      {/* ═══════════ CONTENT GRID ═══════════ */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        display: 'grid', 
        gridTemplateColumns: 'minmax(110px, auto) 1fr minmax(100px, auto)',
        flex: 1, 
        padding: '24px 20px 0 24px', 
        gap: '20px' 
      }}>
        
        {/* LEFT COLUMN: Photo & Status */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', alignSelf: 'start' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #1a4a6e, #0d2d4a)',
            border: '2.5px solid rgba(100,180,255,0.3)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}>
            {paciente.foto_url ? (
              <img src={paciente.foto_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={50} color="rgba(255,255,255,0.15)" />
            )}
          </div>

          <div style={{
            background: '#00b87a',
            borderRadius: '10px',
            padding: '5px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 6px 20px rgba(0,184,122,0.4)',
          }}>
            <ShieldCheck size={13} color="white" fill="rgba(255,255,255,0.3)" />
            <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '1px' }}>ATIVA</span>
          </div>
        </div>

        {/* MIDDLE COLUMN: Patient Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
          <div style={{ marginBottom: '2px' }}>
            <div style={{ fontSize: '8px', fontWeight: 700, opacity: 0.5, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '4px' }}>
              NOME DO PACIENTE
            </div>
            <div style={{ fontSize: '17px', fontWeight: 900, letterSpacing: '-0.3px', lineHeight: 1.1, color: '#fff' }}>
              {paciente.nome || 'João da Silva'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '7.5px', fontWeight: 700, opacity: 0.5, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '4px' }}>
                NÚMERO DO SUS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={14} color="#00e896" />
                <span style={{ fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                  {formatSUS(paciente.numero_sus)}
                </span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '7.5px', fontWeight: 700, opacity: 0.5, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '4px' }}>
                NASCIMENTO
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} color="#5ab0ff" />
                <span style={{ fontSize: '13px', fontWeight: 800 }}>
                  {formatDate(paciente.data_nascimento)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '7.5px', fontWeight: 700, opacity: 0.5, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '4px' }}>
              UNIDADE DE REFERÊNCIA
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} color="#00e896" />
              <span style={{ fontSize: '12px', fontWeight: 700, opacity: 0.9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {paciente.unidade_saude || 'UBS Central de Uarini'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Logo & QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {config.logo_url ? (
                <img src={config.logo_url} alt="Logo" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ fontSize: '14px', fontWeight: 900 }}>UARINI</div>
              )}
            </div>
            <div style={{ fontSize: '8px', fontWeight: 900, color: '#00e896', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '6px' }}>
              ANÁLISES CLÍNICAS
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '14px',
            padding: '8px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
            marginTop: '10px',
            marginBottom: 'auto',
          }}>
            <QRCode value={qrValue} size={70} level="Q" />
          </div>
        </div>
      </div>

      {/* ═══════════ FOOTER GRID ═══════════ */}
      <div style={{ position: 'relative', zIndex: 1, padding: '12px 24px 18px 24px', background: 'rgba(0,0,0,0.25)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Droplet size={18} color="#5ab0ff" fill="rgba(90,176,255,0.1)" />
            <div>
              <div style={{ fontSize: '7px', opacity: 0.5, fontWeight: 700 }}>SANGUE</div>
              <div style={{ fontSize: '13px', fontWeight: 900 }}>{paciente.tipo_sanguineo || 'O+'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '10px' }}>
            <AlertTriangle size={18} color="#f59e0b" fill="rgba(245,158,11,0.1)" />
            <div>
              <div style={{ fontSize: '7px', opacity: 0.5, fontWeight: 700 }}>ALERGIAS</div>
              <div style={{ fontSize: '11px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75px' }}>{paciente.alergias || 'Nenhuma'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '10px' }}>
            <Phone size={18} color="#34d399" fill="rgba(52,211,153,0.1)" />
            <div>
              <div style={{ fontSize: '7px', opacity: 0.5, fontWeight: 700 }}>CONTATO</div>
              <div style={{ fontSize: '10px', fontWeight: 900 }}>{paciente.contato_emergencia || 'N/A'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '10px' }}>
            <Calendar size={18} color="#818cf8" fill="rgba(129,140,248,0.1)" />
            <div>
              <div style={{ fontSize: '7px', opacity: 0.5, fontWeight: 700 }}>EMISSÃO</div>
              <div style={{ fontSize: '11px', fontWeight: 900 }}>{paciente.data_emissao ? formatDate(paciente.data_emissao) : '05/04/2026'}</div>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '8px', fontWeight: 600, opacity: 0.3, letterSpacing: '0.8px' }}>
          ESTA CARTEIRINHA É PESSOAL E INTRANSFERÍVEL.
        </div>
      </div>
    </div>
  );
};

export default CarteirinhaCard;

