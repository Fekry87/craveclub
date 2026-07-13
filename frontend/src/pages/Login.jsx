import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const roleRedirects = {
  PLATFORM_ADMIN: '/corporate',
  CLUB_MANAGER: '/club',
  COACH: '/coach',
  SWIMMER: '/swimmer',
};

/* ─── Animated Bubbles (violet theme) ─── */
function Bubbles({ count = 18, color = '#a78bfa' }) {
  const bubbles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 3 + Math.random() * 12,
      delay: Math.random() * 12,
      duration: 8 + Math.random() * 12,
      opacity: 0.06 + Math.random() * 0.15,
    })), [count]
  );

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {bubbles.map(b => (
        <div key={b.id} style={{
          position: 'absolute',
          left: `${b.left}%`,
          bottom: '-20px',
          width: b.size,
          height: b.size,
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${color}${Math.round((b.opacity + 0.12) * 255).toString(16).padStart(2,'0')}, ${color}${Math.round(b.opacity * 0.3 * 255).toString(16).padStart(2,'0')})`,
          border: `1px solid ${color}${Math.round(b.opacity * 0.4 * 255).toString(16).padStart(2,'0')}`,
          animation: `bubbleRise ${b.duration}s ${b.delay}s infinite ease-out`,
        }} />
      ))}
    </div>
  );
}

function WaveSVG({ color1 = 'rgba(139,92,246,0.1)', color2 = 'rgba(167,139,250,0.06)' }) {
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', pointerEvents: 'none', opacity: 0.7 }}>
      <svg viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="cw1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color1} />
            <stop offset="100%" stopColor={color2} />
          </linearGradient>
          <linearGradient id="cw2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color2} />
            <stop offset="100%" stopColor="rgba(139,92,246,0.03)" />
          </linearGradient>
        </defs>
        <path fill="url(#cw1)">
          <animate attributeName="d" dur="8s" repeatCount="indefinite" values="
            M0,180 C320,240 480,120 720,180 C960,240 1120,120 1440,180 L1440,320 L0,320 Z;
            M0,200 C320,140 480,240 720,160 C960,120 1120,240 1440,200 L1440,320 L0,320 Z;
            M0,180 C320,240 480,120 720,180 C960,240 1120,120 1440,180 L1440,320 L0,320 Z
          " />
        </path>
        <path fill="url(#cw2)">
          <animate attributeName="d" dur="11s" repeatCount="indefinite" values="
            M0,220 C320,180 480,280 720,220 C960,180 1120,280 1440,220 L1440,320 L0,320 Z;
            M0,240 C320,280 480,180 720,240 C960,280 1120,180 1440,240 L1440,320 L0,320 Z;
            M0,220 C320,180 480,280 720,220 C960,180 1120,280 1440,220 L1440,320 L0,320 Z
          " />
        </path>
      </svg>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 960);
  const [branding, setBranding] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const platformName = branding?.platform_name || 'CraveClubs';
  const primary = branding?.primary_color || '#8b5cf6';
  const secondary = branding?.secondary_color || '#a78bfa';
  const tagline = branding?.tagline || 'Club Management Platform';

  useEffect(() => {
    setMounted(true);
    document.title = 'CraveClubs';
    api.get('/public/branding').then(r => setBranding(r.data)).catch(() => {});
    const handleResize = () => setIsMobile(window.innerWidth < 960);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(roleRedirects[user.role] || '/login');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="1.8" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>, value: t('corporate.multi'), label: t('nav.clubs') },
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>, value: t('corporate.full'), label: t('corporate.control') },
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="1.8" strokeLinecap="round"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, value: t('corporate.smart'), label: t('corporate.features') },
  ];

  /* ─── MOBILE ─── */
  if (isMobile) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        background: `radial-gradient(ellipse at 50% 0%, #1a0a3e 0%, #0c0520 60%, #060312 100%)`,
        position: 'relative', overflow: 'hidden', padding: '24px 20px',
      }}>
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${primary}12 0%, transparent 70%)`, top: '-120px', right: '-80px', pointerEvents: 'none' }} />
        <Bubbles count={12} color={primary} />
        <WaveSVG />

        <div style={{
          position: 'relative', zIndex: 10, maxWidth: 400, width: '100%', margin: '0 auto',
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${primary}25, ${primary}14)`,
              border: `1px solid ${primary}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'float 4s ease-in-out infinite',
            }}>
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <path d="M4 20C6.5 17 9 22 12 18C15 14 17 22 20 18C23 14 25.5 20 28 17" stroke={primary} strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{platformName}</span>
          </div>

          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px', lineHeight: 1.2 }}>
            {t('auth.corporateAdmin')}
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 20px' }}>{t('auth.signInManagePlatform')}</p>

          {renderForm()}

        </div>
      </div>
    );
  }

  /* ═══ DESKTOP ═══ */
  return (
    <div style={{
      height: '100vh', display: 'flex',
      background: '#060312',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* ═══ LEFT SIDE — Branding ═══ */}
      <div style={{
        flex: '1 1 58%', height: '100vh', position: 'relative',
        background: `radial-gradient(ellipse at 20% 20%, #1a0a3e 0%, #0c0520 60%, #060312 100%)`,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '36px 52px', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${primary}12 0%, transparent 70%)`, top: '-150px', left: '-100px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${secondary}0a 0%, transparent 70%)`, bottom: '-120px', right: '-50px', pointerEvents: 'none' }} />

        <Bubbles count={16} color={primary} />
        <WaveSVG />

        {/* Top: Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 10,
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `linear-gradient(135deg, ${primary}25, ${primary}14)`,
            border: `1px solid ${primary}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'float 4s ease-in-out infinite',
          }}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d="M4 20C6.5 17 9 22 12 18C15 14 17 22 20 18C23 14 25.5 20 28 17" stroke={primary} strokeWidth="2.5" strokeLinecap="round">
                <animate attributeName="d" dur="3s" repeatCount="indefinite" values="
                  M4 20C6.5 17 9 22 12 18C15 14 17 22 20 18C23 14 25.5 20 28 17;
                  M4 18C6.5 21 9 16 12 20C15 24 17 16 20 20C23 24 25.5 18 28 21;
                  M4 20C6.5 17 9 22 12 18C15 14 17 22 20 18C23 14 25.5 20 28 17
                " />
              </path>
              <path d="M4 24C6.5 21 9 26 12 22C15 18 17 26 20 22C23 18 25.5 24 28 21" stroke={secondary} strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
            </svg>
          </div>
          <span style={{
            fontFamily: "'Outfit', sans-serif", fontSize: 21, fontWeight: 700,
            color: '#f1f5f9', letterSpacing: '-0.01em',
          }}>{platformName}</span>
        </div>

        {/* Middle: Hero */}
        <div style={{
          position: 'relative', zIndex: 10, maxWidth: 500,
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 8,
            background: `${primary}0f`,
            border: `1px solid ${primary}1a`,
            marginBottom: 22,
            animation: 'fadeInUp 0.5s ease-out 0.3s both',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>{tagline}</span>
          </div>

          <h1 style={{
            fontFamily: "'Outfit', sans-serif", fontSize: 44, fontWeight: 800,
            color: '#f1f5f9', margin: 0, lineHeight: 1.15, letterSpacing: '-0.03em',
          }}>
            {t('corporate.yourClubs')}{' '}
            <span style={{
              backgroundImage: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              {t('corporate.onePlatform')}
            </span>
          </h1>

          <p style={{
            color: '#94a3b8', fontSize: 15, lineHeight: 1.65, marginTop: 16, maxWidth: 420,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {t('corporate.heroDescription')}
          </p>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: 32, marginTop: 36,
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.6s ease 0.6s',
          }}>
            {stats.map((stat, i) => (
              <div key={stat.label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                animation: `fadeInUp 0.4s ease-out ${0.7 + i * 0.1}s both`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: `${primary}0f`,
                  border: `1px solid ${primary}14`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {stat.icon}
                </div>
                <div>
                  <div style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", lineHeight: 1.2 }}>{stat.value}</div>
                  <div style={{ color: '#64748b', fontSize: 11, fontWeight: 500 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          position: 'relative', zIndex: 10,
          color: '#334155', fontSize: 12, letterSpacing: '0.02em',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.5s ease 0.8s',
        }}>
          {t('corporate.poweredBy', { name: platformName })}
        </div>
      </div>

      {/* ═══ RIGHT SIDE — Login Form ═══ */}
      <div style={{
        flex: '0 0 42%', height: '100vh', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '36px 48px', overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(10,22,40,0.3) 0%, rgba(6,13,31,0.1) 100%)',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 1,
          background: `linear-gradient(180deg, transparent 10%, ${primary}14 50%, transparent 90%)`,
        }} />
        <div style={{ position: 'absolute', top: -80, right: -80, width: 250, height: 250, borderRadius: '50%', background: `radial-gradient(circle, ${primary}08 0%, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{
          width: '100%', maxWidth: 360,
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(20px)',
          transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.25s',
        }}>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 700,
            color: '#f1f5f9', margin: 0, letterSpacing: '-0.01em',
          }}>{t('auth.corporateAdmin')}</h2>
          <p style={{
            color: '#64748b', fontSize: 13, marginTop: 4, marginBottom: 28,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {t('auth.signInManagePlatform')}
          </p>

          {renderForm()}

        </div>
      </div>
    </div>
  );

  /* ─── Shared: Form ─── */
  function renderForm() {
    return (
      <>
        <form onSubmit={handleSubmit}>
        {error && (
          <div style={{
            background: 'rgba(244,63,94,0.08)', border: '1px solid #fda4af',
            color: '#fda4af', padding: '10px 14px', borderRadius: 10,
            marginBottom: 16, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 8,
            animation: 'fadeInUp 0.3s ease-out',
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {[
          {
            key: 'email',
            label: t('auth.emailAddress'),
            placeholder: 'email@example.com',
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke={focusedField === 'email' ? primary : '#94a3b8'}
                strokeWidth="1.8" strokeLinecap="round"
                style={{ transition: 'stroke 0.2s ease', flexShrink: 0 }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6c0-1.1.9-2 2-2z"/>
                <path d="M22 6l-10 7L2 6"/>
              </svg>
            ),
          },
          {
            key: 'password',
            label: t('auth.password'),
            placeholder: 'Enter your password',
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke={focusedField === 'password' ? primary : '#94a3b8'}
                strokeWidth="1.8" strokeLinecap="round"
                style={{ transition: 'stroke 0.2s ease', flexShrink: 0 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            ),
          },
        ].map(field => (
          <div key={field.key} style={{ marginBottom: field.key === 'email' ? 16 : 24 }}>
            <label style={{
              display: 'block',
              color: focusedField === field.key ? '#f1f5f9' : '#94a3b8',
              fontSize: 13, fontWeight: 500, marginBottom: 6,
              transition: 'color 0.2s ease',
              fontFamily: "'DM Sans', sans-serif",
            }}>{field.label}</label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              borderRadius: 10, padding: '0 14px',
              background: focusedField === field.key ? `${primary}1f` : 'rgba(6,13,31,0.4)',
              border: focusedField === field.key
                ? `1px solid ${primary}`
                : '1px solid rgba(51,65,85,0.4)',
              transition: 'all 0.2s ease',
              boxShadow: focusedField === field.key ? `0 0 0 3px ${primary}1f` : 'none',
            }}>
              {field.icon}
              <input
                type={field.key} value={field.key === 'email' ? email : password}
                onChange={e => field.key === 'email' ? setEmail(e.target.value) : setPassword(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(e); }}
                required
                onFocus={() => setFocusedField(field.key)}
                onBlur={() => setFocusedField(null)}
                placeholder={field.placeholder}
                style={{
                  width: '100%', padding: '12px 0', background: 'transparent',
                  border: 'none', borderRadius: 0, color: '#f1f5f9', fontSize: 13,
                  boxSizing: 'border-box', outline: 'none', fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </div>
          </div>
        ))}

        <button type="submit" disabled={loading}
          onMouseEnter={e => { if (!loading) { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = `0 8px 30px ${primary}59, 0 0 50px ${primary}14`; }}}
          onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = loading ? 'none' : `0 4px 20px ${primary}33`; }}
          style={{
            width: '100%', padding: '13px',
            background: loading ? `${primary}1f` : primary,
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif",
            letterSpacing: '0.01em', transition: 'all 0.2s ease',
            boxShadow: loading ? 'none' : `0 4px 20px ${primary}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          {loading ? (
            <>
              <svg width="16" height="16" viewBox="0 0 18 18" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" fill="none" />
                <path d="M9 2a7 7 0 0 1 7 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
              {t('auth.signingIn')}
            </>
          ) : (
            <>
              {t('auth.signIn')}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </>
          )}
        </button>
      </form>
      </>
    );
  }

}
