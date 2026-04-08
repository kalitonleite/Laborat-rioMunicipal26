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
    background_url?: string;
    cor_primaria: string;
    cor_secundaria: string;
    cor_destaque: string;
    nome_sistema: string;
    texto_rodape: string;
    unidade_padrao?: string;
  };
}

const CarteirinhaCard: React.FC<CarteirinhaCardProps> = ({ paciente: pacienteRaw, config: configRaw }) => {
  // Safe defaults
  const paciente = pacienteRaw || {} as CarteirinhaCardProps['paciente'];
  const config = configRaw || {} as CarteirinhaCardProps['config'];

  const qrToken = paciente.qr_token || '';
  const qrValue = 'https://laborat-rio-municipal26.vercel.app/';

  const formatDate = (dateString: string) => {
    if (!dateString) return '--/--/----';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '--/--/----';
      return d.toLocaleDateString('pt-BR');
    } catch { return '--/--/----'; }
  };

  const formatSUS = (sus: string) => {
    if (!sus) return '--- ---- ---- ----';
    const clean = sus.replace(/\D/g, '').substring(0, 15);
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
        fontFamily: "'Inter', sans-serif",
        color: 'white',
        boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
        border: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* CONTENT GRID */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        display: 'grid', 
        gridTemplateColumns: '130px 1fr 130px',
        flex: 1, 
        padding: '28px 24px 0 24px', 
        gap: '20px' 
      }}>
        
        {/* LEFT COLUMN: Photo & Status */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '110px',
            height: '110px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)',
            padding: '4px',
            boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
            border: '2px solid #bfc0c2',
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
                <i className="fas fa-user" style={{ fontSize: '40px', color: 'rgba(255,255,255,0.4)' }}></i>
              )}
            </div>
          </div>

          <div style={{
            background: '#00b87a',
            borderRadius: '30px',
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid #00ff95',
            boxShadow: '0 0 15px rgba(0,184,122,0.6)',
          }}>
            <i className="fas fa-shield-alt" style={{ fontSize: '12px', color: 'white' }}></i>
            <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '1px' }}>ATIVA</span>
          </div>
        </div>

        {/* MIDDLE COLUMN: Details with Glassmorphism (Centered) */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '12px', 
          minWidth: 0, 
          padding: '20px 15px',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          flex: 1.2, /* Slightly more space for the middle info */
          overflow: 'hidden'
        }}>
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '7.5px', fontWeight: 800, opacity: 0.6, color: '#fff', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '2px' }}>
              NOME DO PACIENTE
            </div>
            <div style={{ 
              fontSize: '15px', 
              fontWeight: 900, 
              lineHeight: '1.2', 
              color: '#fff', 
              textShadow: '0 2px 4px rgba(0,0,0,0.5)', 
              textTransform: 'uppercase',
              width: '100%'
            }}>
              {paciente.nome || 'João da Silva'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', width: '100%', marginTop: '4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '6.5px', fontWeight: 800, opacity: 0.6, color: '#fff', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                NÚMERO DO SUS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                <i className="fas fa-id-card" style={{ fontSize: '11px', color: config.cor_destaque || "#00ff95" }}></i>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>
                  {formatSUS(paciente.numero_sus)}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '6.5px', fontWeight: 800, opacity: 0.6, color: '#fff', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                NASCIMENTO
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                <i className="fas fa-calendar-alt" style={{ fontSize: '11px', color: config.cor_destaque || "#00ff95" }}></i>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>
                  {formatDate(paciente.data_nascimento)}
                </span>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', marginTop: '4px' }}>
            <div style={{ fontSize: '6.5px', fontWeight: 800, opacity: 0.6, color: '#fff', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
              UNIDADE DE REFERÊNCIA
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', width: '100%' }}>
              <i className="fas fa-map-marker-alt" style={{ fontSize: '11px', color: config.cor_destaque || "#00ff95" }}></i>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: '#fff', 
                maxWidth: '180px',
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }}>
                {paciente.unidade_saude || config.unidade_padrao || 'UBS Central de Uarini'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Logo & QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {config.logo_url ? (
                <img src={config.logo_url} alt="Logo" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ fontSize: '16px', fontWeight: 900 }}>UARINI</div>
              )}
            </div>
            <div style={{ fontSize: '9px', fontWeight: 900, color: '#00e896', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '6px' }}>
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

      {/* FOOTER */}
      <div style={{ padding: '0 24px 20px 24px', zIndex: 2 }}>
        <div style={{ 
          background: 'rgba(0,0,0,0.45)', 
          backdropFilter: 'blur(15px)', 
          borderRadius: '20px', 
          padding: '14px 18px', 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-tint" style={{ fontSize: '18px', color: '#5ab0ff' }}></i>
              <div>
                <div style={{ fontSize: '7px', opacity: 0.4, fontWeight: 700 }}>SANGUE</div>
                <div style={{ fontSize: '13px', fontWeight: 900 }}>{paciente.tipo_sanguineo || 'O+'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '10px' }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '18px', color: '#f59e0b' }}></i>
              <div>
                <div style={{ fontSize: '7px', opacity: 0.4, fontWeight: 700 }}>ALERGIAS</div>
                <div style={{ fontSize: '11px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75px' }}>{paciente.alergias || 'Sem'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '10px' }}>
              <i className="fas fa-phone" style={{ fontSize: '18px', color: '#34d399' }}></i>
              <div>
                <div style={{ fontSize: '7px', opacity: 0.4, fontWeight: 700 }}>CONTATO</div>
                <div style={{ fontSize: '10px', fontWeight: 900 }}>{paciente.contato_emergencia || 'N/A'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '10px' }}>
              <i className="fas fa-calendar-day" style={{ fontSize: '18px', color: '#818cf8' }}></i>
              <div>
                <div style={{ fontSize: '7px', opacity: 0.4, fontWeight: 700 }}>EMISSÃO</div>
                <div style={{ fontSize: '11px', fontWeight: 900 }}>{paciente.data_emissao ? formatDate(paciente.data_emissao) : '05/04/2026'}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '9px', fontWeight: 700, opacity: 0.5, letterSpacing: '1px' }}>
          ESTA CARTEIRINHA É PESSOAL E INTRANSFERÍVEL.
        </div>
      </div>
    </div>
  );
};

export default CarteirinhaCard;
