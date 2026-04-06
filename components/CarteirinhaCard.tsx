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

const CarteirinhaCard: React.FC<CarteirinhaCardProps> = ({ paciente, config }) => {
  const qrValue = `https://laborat-rio-municipal26.vercel.app/#/validacao/${paciente.id || paciente.qr_token}?token=${paciente.qr_token}`;

  const formatDate = (dateString: string) => {
    if (!dateString) return '--/--/----';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return '--/--/----';
    }
  };

  return (
    <div
      id="carteirinha-digital"
      style={{
        width: '100%',
        maxWidth: '420px',
        background: 'linear-gradient(180deg, #0d2d4a 0%, #071c30 50%, #091e35 100%)',
        borderRadius: '28px',
        overflow: 'hidden',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        color: 'white',
        boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
        border: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
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
          bottom: '38%',
          left: '-20%',
          width: '140%',
          height: '60%',
          background: 'radial-gradient(ellipse, rgba(0,120,200,0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          transform: 'rotate(-5deg)',
        }} />
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '60%',
          height: '40%',
          background: 'radial-gradient(ellipse, rgba(0,200,150,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        {/* Wave separator between patient info and QR */}
        <svg
          style={{ position: 'absolute', top: '42%', left: 0, width: '100%' }}
          viewBox="0 0 420 60"
          preserveAspectRatio="none"
        >
          <path
            d="M0,30 C80,60 180,0 280,30 C350,50 400,20 420,30 L420,60 L0,60 Z"
            fill="rgba(0,100,180,0.12)"
          />
          <path
            d="M0,40 C100,20 200,60 320,35 C370,25 400,40 420,40 L420,60 L0,60 Z"
            fill="rgba(0,80,160,0.08)"
          />
        </svg>
      </div>

      {/* ═══════════ HEADER ═══════════ */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '20px 22px 12px 22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        {/* SUS DIGITAL badge */}
        <div style={{
          background: 'rgba(0, 200, 120, 0.15)',
          border: '1.5px solid rgba(0, 200, 120, 0.5)',
          borderRadius: '20px',
          padding: '5px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <CheckCircle size={13} color="#00e896" fill="rgba(0,200,120,0.3)" />
          <span style={{
            fontSize: '10px',
            fontWeight: 900,
            letterSpacing: '1.5px',
            color: '#00e896',
            textTransform: 'uppercase',
          }}>SUS DIGITAL</span>
        </div>

        {/* Logo Prefeitura */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {config.logo_url ? (
            <img src={config.logo_url} alt="Logo" style={{ height: '52px', width: 'auto', objectFit: 'contain' }} />
          ) : (
            <div style={{ textAlign: 'center' }}>
              {/* Prefeitura icon placeholder */}
              <svg width="44" height="32" viewBox="0 0 88 64" fill="none">
                <circle cx="44" cy="12" r="9" fill="white" opacity="0.9" />
                <circle cx="24" cy="28" r="7" fill="white" opacity="0.6" />
                <circle cx="64" cy="28" r="7" fill="white" opacity="0.6" />
                <path d="M10,55 Q44,28 78,55" stroke="white" strokeWidth="3.5" fill="none" opacity="0.8" strokeLinecap="round" />
              </svg>
              <div style={{ marginTop: '2px' }}>
                <div style={{ fontSize: '7px', fontWeight: 700, opacity: 0.6, letterSpacing: '1px', lineHeight: 1 }}>PREFEITURA DE</div>
                <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '2px', lineHeight: 1, marginTop: '2px' }}>UARINI</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ TITLE ═══════════ */}
      <div style={{ position: 'relative', zIndex: 1, padding: '0 22px 0 22px' }}>
        <h1 style={{
          fontSize: '26px',
          fontWeight: 900,
          lineHeight: 1.15,
          margin: 0,
          letterSpacing: '-0.5px',
        }}>
          {config.nome_sistema || 'Laboratório Municipal de Uarini'}
        </h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '6px',
        }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00e896', display: 'inline-block' }} />
          <span style={{
            fontSize: '11px',
            fontWeight: 900,
            color: '#00e896',
            letterSpacing: '3.5px',
            textTransform: 'uppercase',
          }}>ANÁLISES CLÍNICAS</span>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00e896', display: 'inline-block' }} />
        </div>
      </div>

      {/* ═══════════ PATIENT INFO ═══════════ */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '18px 22px 0 22px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '18px',
      }}>
        {/* Photo column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Photo circle */}
          <div style={{
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a4a6e, #0d2d4a)',
            border: '3px solid rgba(100,180,255,0.25)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4), 0 0 0 6px rgba(100,160,255,0.08)',
          }}>
            {paciente.foto_url ? (
              <img src={paciente.foto_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={52} color="rgba(255,255,255,0.15)" />
            )}
          </div>

          {/* ATIVA badge */}
          <div style={{
            background: '#00b87a',
            borderRadius: '20px',
            padding: '5px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 4px 15px rgba(0,184,122,0.35)',
          }}>
            <ShieldCheck size={11} color="white" fill="rgba(255,255,255,0.3)" />
            <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '1px', color: 'white' }}>ATIVA</span>
          </div>
        </div>

        {/* Details column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '8.5px', fontWeight: 700, opacity: 0.4, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '2px' }}>
              NOME DO PACIENTE
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.3px', lineHeight: 1.1 }}>
              {paciente.nome || 'João da Silva'}
            </div>
          </div>

          {/* SUS + Nascimento in a row */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '8px', fontWeight: 700, opacity: 0.35, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '3px' }}>
                NÚMERO DO SUS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CreditCard size={13} color="rgba(255,255,255,0.5)" />
                <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  {paciente.numero_sus || '123 4567 8901'}
                </span>
              </div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '16px' }}>
              <div style={{ fontSize: '8px', fontWeight: 700, opacity: 0.35, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '3px' }}>
                DATA DE NASCIMENTO
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={13} color="rgba(255,255,255,0.5)" />
                <span style={{ fontSize: '13px', fontWeight: 700 }}>
                  {formatDate(paciente.data_nascimento)}
                </span>
              </div>
            </div>
          </div>

          {/* Unidade */}
          <div>
            <div style={{ fontSize: '8px', fontWeight: 700, opacity: 0.35, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '3px' }}>
              UNIDADE DE REFERÊNCIA
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={13} color="#00e896" />
              <span style={{ fontSize: '13px', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {paciente.unidade_saude || 'UBS Central de Uarini'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ QR CODE SECTION ═══════════ */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '22px 22px 0 22px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}>
          {/* Left label */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            width: '80px',
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              border: '1.5px solid rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShieldCheck size={20} color="rgba(255,255,255,0.25)" />
            </div>
            <span style={{
              fontSize: '8px',
              fontWeight: 700,
              textAlign: 'center',
              opacity: 0.35,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              lineHeight: 1.4,
            }}>
              ESCANEIE PARA VALIDAR A IDENTIDADE
            </span>
          </div>

          {/* QR Code - centered and large */}
          <div style={{
            background: 'white',
            borderRadius: '22px',
            padding: '14px',
            boxShadow: '0 15px 50px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <QRCode
              value={qrValue}
              size={148}
              level="Q"
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>

          {/* Right label */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            width: '80px',
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              border: '1.5px solid rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShieldCheck size={20} color="rgba(255,255,255,0.25)" />
            </div>
            <span style={{
              fontSize: '8px',
              fontWeight: 700,
              textAlign: 'center',
              opacity: 0.35,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              lineHeight: 1.4,
            }}>
              USO EXCLUSIVO EM UNIDADES DE SAÚDE
            </span>
          </div>
        </div>

        {/* Valid banner */}
        <div style={{
          marginTop: '16px',
          background: 'rgba(30, 90, 160, 0.25)',
          border: '1px solid rgba(80, 140, 220, 0.2)',
          borderRadius: '14px',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <ShieldCheck size={16} color="#5ab0ff" />
          <span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.8, lineHeight: 1.4 }}>
            Carteirinha válida em todas as unidades de saúde do município.
          </span>
        </div>
      </div>

      {/* ═══════════ FOOTER ═══════════ */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        marginTop: '18px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(0,0,0,0.2)',
        backdropFilter: 'blur(10px)',
        padding: '16px 22px 18px 22px',
      }}>
        {/* 4-column grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: '4px',
          marginBottom: '14px',
        }}>
          {/* Sangue */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <Droplet size={20} color="#5ab0ff" fill="rgba(90,176,255,0.15)" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '7.5px', fontWeight: 700, opacity: 0.35, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                TIPO SANGUÍNEO
              </div>
              <div style={{ fontSize: '16px', fontWeight: 900 }}>
                {paciente.tipo_sanguineo || 'O+'}
              </div>
            </div>
          </div>

          {/* Alergias */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            borderLeft: '1px solid rgba(255,255,255,0.07)',
          }}>
            <AlertTriangle size={20} color="#f59e0b" fill="rgba(245,158,11,0.15)" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '7.5px', fontWeight: 700, opacity: 0.35, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                ALERGIAS
              </div>
              <div style={{ fontSize: '13px', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70px' }}>
                {paciente.alergias || 'Dipirona'}
              </div>
            </div>
          </div>

          {/* Contato */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            borderLeft: '1px solid rgba(255,255,255,0.07)',
          }}>
            <Phone size={20} color="#34d399" fill="rgba(52,211,153,0.1)" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '7.5px', fontWeight: 700, opacity: 0.35, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                CONTATO
              </div>
              <div style={{ fontSize: '10px', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70px' }}>
                {paciente.contato_emergencia || '(92) 99999-9999'}
              </div>
            </div>
          </div>

          {/* Emissão */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            borderLeft: '1px solid rgba(255,255,255,0.07)',
          }}>
            <Calendar size={20} color="#818cf8" fill="rgba(129,140,248,0.1)" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '7.5px', fontWeight: 700, opacity: 0.35, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                EMISSÃO
              </div>
              <div style={{ fontSize: '12px', fontWeight: 900 }}>
                {paciente.data_emissao ? formatDate(paciente.data_emissao) : '10/05/2024'}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom disclaimer */}
        <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
          <span style={{ fontSize: '9.5px', fontWeight: 600, opacity: 0.25, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Esta carteirinha é pessoal e intransferível.
          </span>
        </div>
      </div>
    </div>
  );
};

export default CarteirinhaCard;
