import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api, { getStoredToken } from '../api/axios';

const roleRedirects = {
  PLATFORM_ADMIN: '/corporate',
  CLUB_MANAGER: '/club',
  COACH: '/coach',
  SWIMMER: '/swimmer',
};

/* ─── Animated Bubbles (dynamic color) ─── */
function Bubbles({ count = 18, color = '#22d3ee' }) {
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
          position: 'absolute', left: `${b.left}%`, bottom: '-20px',
          width: b.size, height: b.size, borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${color}${Math.round((b.opacity + 0.12) * 255).toString(16).padStart(2,'0')}, ${color}${Math.round(b.opacity * 0.3 * 255).toString(16).padStart(2,'0')})`,
          border: `1px solid ${color}${Math.round(b.opacity * 0.4 * 255).toString(16).padStart(2,'0')}`,
          animation: `bubbleRise ${b.duration}s ${b.delay}s infinite ease-out`,
        }} />
      ))}
    </div>
  );
}

function WaveSVG({ color }) {
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', pointerEvents: 'none', opacity: 0.7 }}>
      <svg viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="clw1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`${color}1a`} />
            <stop offset="100%" stopColor={`${color}0d`} />
          </linearGradient>
          <linearGradient id="clw2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`${color}0f`} />
            <stop offset="100%" stopColor={`${color}08`} />
          </linearGradient>
        </defs>
        <path fill="url(#clw1)">
          <animate attributeName="d" dur="8s" repeatCount="indefinite" values="
            M0,180 C320,240 480,120 720,180 C960,240 1120,120 1440,180 L1440,320 L0,320 Z;
            M0,200 C320,140 480,240 720,160 C960,120 1120,240 1440,200 L1440,320 L0,320 Z;
            M0,180 C320,240 480,120 720,180 C960,240 1120,120 1440,180 L1440,320 L0,320 Z
          " />
        </path>
        <path fill="url(#clw2)">
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

/* ─── Club initials avatar ─── */
function ClubAvatar({ name, color, size = 48 }) {
  const initials = (name || 'C').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3,
      background: `linear-gradient(135deg, ${color}, ${color}aa)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 4px 16px ${color}30`,
      fontFamily: "'Outfit', sans-serif", fontSize: size * 0.38, fontWeight: 700, color: '#fff',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

export default function ClubLogin() {
  const params = useParams();
  // Support both /portal/:slug and /:clubSlug routes
  const slug = params.slug || params.clubSlug;
  const [club, setClub] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 960);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  /** Normalize color — DB may store with or without '#' prefix */
  const normalizeColor = (raw, fallback) => {
    if (!raw) return fallback;
    return raw.startsWith('#') ? raw : `#${raw}`;
  };

  const primary = normalizeColor(club?.primary_color || club?.theme_color, '#22d3ee');
  const secondary = normalizeColor(club?.secondary_color, '#06b6d4');

  // Check if already logged in for club scope (no auto-logout!)
  useEffect(() => {
    const token = getStoredToken('club');
    if (token) setAlreadyLoggedIn(true);
  }, []);

  useEffect(() => {
    setMounted(true);
    // Use /branding/:slug for richer data (features, social links, favicon); fall back to /clubs/:slug
    api.get(`/branding/${slug}`)
      .then(r => {
        const b = r.data;
        setClub({
          name: b.club_name,
          display_name: b.display_name,
          logo_url: b.logo_url,
          cover_url: b.cover_url,
          favicon_url: b.favicon_url,
          primary_color: b.primary_color,
          secondary_color: b.secondary_color,
          accent_color: b.accent_color,
          support_email: b.support_email,
          support_phone: b.support_phone,
          social_links: b.social_links,
          app_name: b.app_name,
          features: b.features,
        });
        // Set favicon dynamically if available
        if (b.favicon_url) {
          const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
          link.rel = 'icon';
          link.href = b.favicon_url;
          document.head.appendChild(link);
        }
        // Set page title to club name
        document.title = b.display_name || b.club_name || 'Club Portal';
      })
      .catch(() => {
        // Fallback to /clubs/:slug if branding endpoint fails
        api.get(`/clubs/${slug}`)
          .then(r => setClub(r.data))
          .catch(() => setNotFound(true));
      });
    const handleResize = () => setIsMobile(window.innerWidth < 960);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password, slug);
      setAlreadyLoggedIn(false);
      navigate(roleRedirects[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  /* ─── Not Found ─── */
  if (notFound) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 30%, #0c2340, #060d1f)',
        flexDirection: 'column', gap: 16,
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01" />
        </svg>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", color: '#f1f5f9', margin: 0, fontSize: 24 }}>{t('club.notFound')}</h2>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
          {t('club.notFoundDesc', { slug })}
        </p>
        <Link to="/login" style={{
          marginTop: 8, padding: '10px 24px', background: 'rgba(139,92,246,0.15)',
          border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10,
          color: '#a78bfa', textDecoration: 'none', fontSize: 14, fontWeight: 600,
          transition: 'all 0.2s',
        }}>
          {t('actions.goCorporateLogin')}
        </Link>
      </div>
    );
  }

  /* ─── Loading ─── */
  if (!club) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#060d1f', flexDirection: 'column', gap: 12,
      }}>
        <svg width="32" height="32" viewBox="0 0 18 18" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" fill="none" />
          <path d="M9 2a7 7 0 0 1 7 7" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
        <span style={{ color: '#64748b', fontSize: 13 }}>{t('club.loadingClub')}</span>
      </div>
    );
  }

  /* ─── MOBILE ─── */
  if (isMobile) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        background: `radial-gradient(ellipse at 50% 0%, #0c2340 0%, #060d1f 60%, #030812 100%)`,
        position: 'relative', overflow: 'hidden', padding: '24px 20px',
      }}>
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${primary}12 0%, transparent 70%)`, top: '-120px', right: '-80px', pointerEvents: 'none' }} />
        <Bubbles count={12} color={primary} />
        <WaveSVG color={primary} />

        <div style={{
          position: 'relative', zIndex: 10, maxWidth: 400, width: '100%', margin: '0 auto',
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Club branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            {club.logo_url ? (
              <img src={club.logo_url} alt={club.name} style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover' }} />
            ) : (
              <ClubAvatar name={club.name} color={primary} size={40} />
            )}
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{club.name}</span>
          </div>

          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px', lineHeight: 1.2 }}>
            {t('auth.welcomeBack')}
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 20px' }}>{t('auth.signInClubPortal')}</p>

          {renderForm()}

          {renderFooter()}
        </div>
      </div>
    );
  }

  /* ═══ DESKTOP ═══ */
  return (
    <div style={{
      height: '100vh', display: 'flex',
      background: '#060d1f',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* ═══ LEFT SIDE — Club Branding ═══ */}
      <div style={{
        flex: '1 1 58%', height: '100vh', position: 'relative',
        background: `radial-gradient(ellipse at 20% 20%, #0c2340 0%, #060d1f 60%, #040a16 100%)`,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '36px 52px', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${primary}12 0%, transparent 70%)`, top: '-150px', left: '-100px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${secondary}0a 0%, transparent 70%)`, bottom: '-120px', right: '-50px', pointerEvents: 'none' }} />

        <Bubbles count={16} color={primary} />
        <WaveSVG color={primary} />

        {/* Top: Club logo + name */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 10,
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {club.logo_url ? (
            <img src={club.logo_url} alt={club.name} style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: `2px solid ${primary}33` }} />
          ) : (
            <ClubAvatar name={club.name} color={primary} size={44} />
          )}
          <span style={{
            fontFamily: "'Outfit', sans-serif", fontSize: 21, fontWeight: 700,
            color: '#f1f5f9', letterSpacing: '-0.01em',
          }}>{club.name}</span>
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
              <path d="M4 20C6.5 17 9 22 12 18C15 14 17 22 20 18C23 14 25.5 20 28 17" />
            </svg>
            <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>{t('club.clubPortal')}</span>
          </div>

          <h1 style={{
            fontFamily: "'Outfit', sans-serif", fontSize: 44, fontWeight: 800,
            color: '#f1f5f9', margin: 0, lineHeight: 1.15, letterSpacing: '-0.03em',
          }}>
            {t('club.welcomeTo')}{' '}
            <span style={{
              background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              {club.display_name || club.name}
            </span>
          </h1>

          {club.about && (
            <p style={{
              color: '#94a3b8', fontSize: 15, lineHeight: 1.65, marginTop: 16, maxWidth: 420,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {club.about.length > 150 ? club.about.slice(0, 150) + '...' : club.about}
            </p>
          )}

          {/* Contact info */}
          <div style={{
            display: 'flex', gap: 24, marginTop: 36,
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.6s ease 0.6s',
          }}>
            {club.support_email || club.contact_email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeInUp 0.4s ease-out 0.7s both' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: `${primary}0f`, border: `1px solid ${primary}14`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="1.8" strokeLinecap="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/>
                  </svg>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11, fontWeight: 500 }}>{t('auth.emailAddress')}</div>
                  <div style={{ color: '#e2e8f0', fontSize: 13 }}>{club.support_email || club.contact_email}</div>
                </div>
              </div>
            )}
            {club.support_phone || club.contact_phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeInUp 0.4s ease-out 0.8s both' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: `${primary}0f`, border: `1px solid ${primary}14`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="1.8" strokeLinecap="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11, fontWeight: 500 }}>{t('coaches.phone')}</div>
                  <div style={{ color: '#e2e8f0', fontSize: 13 }}>{club.support_phone || club.contact_phone}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {renderFooter()}
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
          }}>{t('auth.welcomeBack')}</h2>
          <p style={{
            color: '#64748b', fontSize: 13, marginTop: 4, marginBottom: 28,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {t('auth.signInToPortal', { name: club.name })}
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
        {alreadyLoggedIn && (
          <div style={{
            background: `${primary}12`, border: `1px solid ${primary}2a`,
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            animation: 'fadeInUp 0.3s ease-out',
          }}>
            <span style={{ color: '#94dbea', fontSize: 12, fontWeight: 500 }}>{t('auth.activeSession')}</span>
            <button type="button" onClick={() => navigate('/club')}
              style={{
                background: `${primary}20`, border: `1px solid ${primary}33`,
                color: primary, borderRadius: 7, padding: '5px 12px', fontSize: 11,
                fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                fontFamily: "'DM Sans', sans-serif",
              }}>
              {t('actions.goToDashboard')}
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit}>
        {error && (
          <div style={{
            background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
            color: '#fda4af', padding: '10px 14px', borderRadius: 10, marginBottom: 16,
            fontSize: 12, display: 'flex', alignItems: 'center', gap: 8,
            animation: 'fadeInUp 0.3s ease-out',
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="#f43f5e" strokeWidth="1.5"/>
              <path d="M8 5v3M8 10.5v.5" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {[
          { key: 'email', label: t('auth.emailAddress'), placeholder: 'you@example.com', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={focusedField === 'email' ? primary : '#475569'} strokeWidth="1.8" strokeLinecap="round" style={{ transition: 'stroke 0.2s', flexShrink: 0 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg> },
          { key: 'password', label: t('auth.password'), placeholder: t('auth.enterPassword'), icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={focusedField === 'password' ? primary : '#475569'} strokeWidth="1.8" strokeLinecap="round" style={{ transition: 'stroke 0.2s', flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
        ].map(field => (
          <div key={field.key} style={{ marginBottom: field.key === 'email' ? 16 : 24 }}>
            <label style={{
              display: 'block', color: focusedField === field.key ? '#c9d1d9' : '#94a3b8',
              fontSize: 13, fontWeight: 500, marginBottom: 6,
              transition: 'color 0.2s ease',
              fontFamily: "'DM Sans', sans-serif",
            }}>{field.label}</label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              borderRadius: 10, padding: '0 14px',
              background: focusedField === field.key ? `${primary}0a` : 'rgba(6,13,31,0.4)',
              border: focusedField === field.key ? `1px solid ${primary}4d` : '1px solid rgba(51,65,85,0.4)',
              transition: 'all 0.25s ease',
              boxShadow: focusedField === field.key ? `0 0 0 3px ${primary}0f` : 'none',
            }}>
              {field.icon}
              <input
                type={field.key} value={field.key === 'email' ? email : password}
                onChange={e => field.key === 'email' ? setEmail(e.target.value) : setPassword(e.target.value)}
                required
                onFocus={() => setFocusedField(field.key)}
                onBlur={() => setFocusedField(null)}
                placeholder={field.placeholder}
                style={{
                  width: '100%', padding: '12px 0', background: 'transparent',
                  border: 'none', borderRadius: 0, color: '#e2e8f0', fontSize: 14,
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
            background: loading ? `${primary}40` : `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
            color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Outfit', sans-serif",
            letterSpacing: '0.01em', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
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


  /* ─── Footer ─── */
  function renderFooter() {
    return (
      <div style={{
        position: 'relative', zIndex: 10,
        color: '#334155', fontSize: 12, letterSpacing: '0.02em',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.5s ease 0.8s',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        Powered by{' '}
        <Link to="/login" style={{ color: '#475569', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }}
          onMouseEnter={e => e.target.style.color = '#8b5cf6'}
          onMouseLeave={e => e.target.style.color = '#475569'}
        >
          CraveClubs
        </Link>
      </div>
    );
  }
}
