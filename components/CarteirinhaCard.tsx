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
    background_url?: string;
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
    return clean.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4').trim();
  };

  const hasBackground = !!config.background_url;

  return (
    <div
      id="carteirinha-digital"
      style={{
        width: '560px',
        height: '354px',
        backgroundColor: '#0d2d4a',
        backgroundImage: hasBackground ? `url(${config.background_url})` : 'linear-gradient(180deg, #0d2d4a 0%, #071c30 50%, #091e35 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
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
      {/* Background decoration (only show if NO custom background is set) */}
      {!hasBackground && (
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
        </div>
      )}

      {/* ═══════════ CONTENT GRID ═══════════ */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        display: 'grid', 
        gridTemplateColumns: 'minmax(130px, auto) 1fr minmax(130px, auto)',
        flex: 1, 
        padding: '28px 24px 0 24px', 
        gap: '20px' 
      }}>
        
        {/* LEFT COLUMN: Photo & Status */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', alignSelf: 'start' }}>
          <div style={{
            width: '110px',
            height: '110px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)',
            padding: '4px',
            boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
            border: '2px solid #bfc0c2', // Metallic border color
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '20px',
              overflow: 'hidden',
              background: '#333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {paciente.foto_url ? (
                <img src={paciente.foto_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={55} color="rgba(255,255,255,0.1)" />
              )}
            </div>
          </div>

          <div style={{
            background: '#00b87a',
            borderRadius: '30px',
            padding: '6px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid #00ff95',
            boxShadow: '0 0 15px rgba(0,184,122,0.6)', // Neon glow
          }}>
            <ShieldCheck size={14} color="white" fill="rgba(255,255,255,0.3)" />
            <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '1px' }}>ATIVA</span>
          </div>
        </div>

        {/* MIDDLE COLUMN: Patient Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, paddingTop: '4px' }}>
          <div style={{ marginBottom: '2px' }}>
            <div style={{ fontSize: '8px', fontWeight: 600, opacity: 0.4, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '6px' }}>
              NOME DO PACIENTE
            </div>
            <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.3px', lineHeight: '1.2', color: '#fff' }}>
              {paciente.nome || 'João da Silva'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '7.5px', fontWeight: 600, opacity: 0.4, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '6px' }}>
                NÚMERO DO SUS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={15} color="#00e896" />
                <span style={{ fontSize: '14px', fontWeight: 800, whiteSpace: 'nowrap', lineHeight: '1.4' }}>
                  {formatSUS(paciente.numero_sus)}
                </span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '7.5px', fontWeight: 600, opacity: 0.4, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '6px' }}>
                NASCIMENTO
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={15} color="#5ab0ff" />
                <span style={{ fontSize: '14px', fontWeight: 800, lineHeight: '1.4' }}>
                  {formatDate(paciente.data_nascimento)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '7.5px', fontWeight: 600, opacity: 0.4, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '6px' }}>
              UNIDADE DE REFERÊNCIA
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={15} color="#00e896" />
              <span style={{ fontSize: '14px', fontWeight: 700, opacity: 0.9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.4' }}>
                {paciente.unidade_saude || 'UBS Central de Uarini'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Logo & QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {config.logo_url ? (
                <img src={config.logo_url} alt="Logo" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ fontSize: '16px', fontWeight: 900 }}>UARINI</div>
              )}
            </div>
            <div style={{ fontSize: '9px', fontWeight: 900, color: '#00e896', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '8px' }}>
              ANÁLISES CLÍNICAS
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '10px',
            boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
            marginTop: 'auto',
            marginBottom: '10px',
          }}>
            <QRCode value={qrValue} size={75} level="Q" />
          </div>
        </div>
      </div>

      {/* ═══════════ FLOATING GLASS FOOTER ═══════════ */}
      <div style={{ padding: '0 24px 20px 24px', zIndex: 2 }}>
        <div style={{ 
          background: 'rgba(0,0,0,0.4)', 
          backdropFilter: 'blur(12px)', 
          borderRadius: '20px', 
          padding: '16px 20px', 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Droplet size={20} color="#5ab0ff" fill="rgba(90,176,255,0.1)" />
              <div>
                <div style={{ fontSize: '7px', opacity: 0.4, fontWeight: 700 }}>SANGUE</div>
                <div style={{ fontSize: '14px', fontWeight: 900 }}>{paciente.tipo_sanguineo || 'O+'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '12px' }}>
              <AlertTriangle size={20} color="#f59e0b" fill="rgba(245,158,11,0.1)" />
              <div>
                <div style={{ fontSize: '7px', opacity: 0.4, fontWeight: 700 }}>ALERGIAS</div>
                <div style={{ fontSize: '12px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '85px' }}>{paciente.alergias || 'Sem'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '12px' }}>
              <Phone size={20} color="#34d399" fill="rgba(52,211,153,0.1)" />
              <div>
                <div style={{ fontSize: '7px', opacity: 0.4, fontWeight: 700 }}>CONTATO</div>
                <div style={{ fontSize: '11px', fontWeight: 900 }}>{paciente.contato_emergencia || 'N/A'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '12px' }}>
              <Calendar size={20} color="#818cf8" fill="rgba(129,140,248,0.1)" />
              <div>
                <div style={{ fontSize: '7px', opacity: 0.4, fontWeight: 700 }}>EMISSÃO</div>
                <div style={{ fontSize: '12px', fontWeight: 900 }}>{paciente.data_emissao ? formatDate(paciente.data_emissao) : '05/04/2026'}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '9px', fontWeight: 700, opacity: 0.4, letterSpacing: '1px' }}>
          ESTA CARTEIRINHA É PESSOAL E INTRANSFERÍVEL.
        </div>
      </div>
    </div>
  );
};

export default CarteirinhaCard;
