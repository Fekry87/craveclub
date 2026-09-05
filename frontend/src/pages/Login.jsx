import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const roleRedirects = {
  PLATFORM_ADMIN: '/corporate',
  CLUB_MANAGER: '/club',
  COACH: '/coach',
  SWIMMER: '/swimmer',
};

/** Normalize color — DB may store with or without '#' prefix */
function normalizeColor(raw, fallback) {
  if (!raw) return fallback;
  return raw.startsWith('#') ? raw : `#${raw}`;
}

export function LoginField({ id, type, label, value, onChange, placeholder, onEnter, accent, autoComplete }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label htmlFor={id} style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6E6E73', marginBottom: 6 }}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onEnter(e); }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        style={{
          width: '100%', height: 46, padding: '0 14px',
          background: '#FFFFFF', borderRadius: 12,
          border: `1px solid ${focused ? accent : '#D2D2D7'}`,
          boxShadow: focused ? `0 0 0 4px ${accent}26` : 'none',
          color: '#1D1D1F', fontSize: 15, fontFamily: 'var(--font-body)',
          outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      />
    </div>
  );
}

export function LoginError({ children }) {
  return (
    <div role="alert" style={{
      background: 'rgba(255,59,48,0.08)', color: '#B12A20', borderRadius: 12,
      padding: '10px 12px', marginBottom: 16, fontSize: 13,
      display: 'flex', alignItems: 'center', gap: 10,
      animation: 'fadeInUp 0.2s ease-out',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />
      </svg>
      {children}
    </div>
  );
}

export function LoginSubmit({ loading, accent, labelIdle, labelBusy }) {
  return (
    <button type="submit" disabled={loading}
      className="pl-btn"
      style={{
        width: '100%', height: 46, marginTop: 6, borderRadius: 12,
        background: accent, color: '#fff', borderColor: accent, fontSize: 15, fontWeight: 600,
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = 'brightness(0.92)'; }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}>
      {loading ? (
        <svg width="16" height="16" viewBox="0 0 18 18" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.35)" strokeWidth="2.2" fill="none" />
          <path d="M9 2a7 7 0 0 1 7 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </svg>
      ) : null}
      {loading ? labelBusy : labelIdle}
    </button>
  );
}

/** Shared page frame for the sign-in screens: soft grey canvas, centered white card. */
export function LoginFrame({ topLeft, children, footer }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>{topLeft}</div>
        <LanguageSwitcher compact />
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px 40px' }}>
        <div style={{
          width: '100%', maxWidth: 420, background: '#FFFFFF', borderRadius: 22,
          padding: '36px 32px 28px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 12px 40px rgba(0,0,0,0.08)',
          animation: 'fadeInUp 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}>
          {children}
        </div>
      </div>
      {footer && <div style={{ textAlign: 'center', padding: '0 16px 22px', fontSize: 12, color: '#86868B' }}>{footer}</div>}
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const platformName = branding?.platform_name || 'CraveClubs';
  const accent = normalizeColor(branding?.primary_color, '#0071E3');
  const tagline = branding?.tagline || 'Club Management Platform';

  useEffect(() => {
    document.title = 'CraveClubs';
    api.get('/public/branding').then(r => setBranding(r.data)).catch(() => {});
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

  return (
    <LoginFrame
      topLeft={<>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: accent }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>{platformName}</span>
        <span style={{ fontSize: 12, color: '#86868B' }}>· {tagline}</span>
      </>}
      footer={t('corporate.poweredBy', { name: platformName })}
    >
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px', background: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <path d="M4 20C6.5 17 9 22 12 18C15 14 17 22 20 18C23 14 25.5 20 28 17" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M4 25C6.5 22 9 27 12 23C15 19 17 27 20 23C23 19 25.5 25 28 22" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />
          </svg>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: '#1D1D1F', margin: 0 }}>
          {t('auth.corporateAdmin')}
        </h1>
        <p style={{ color: '#6E6E73', fontSize: 14, margin: '8px 0 0' }}>{t('auth.signInManagePlatform')}</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <LoginError>{error}</LoginError>}
        <LoginField id="email" type="email" label={t('auth.emailAddress')} value={email} onChange={setEmail}
          placeholder="email@example.com" onEnter={handleSubmit} accent={accent} autoComplete="email" />
        <LoginField id="password" type="password" label={t('auth.password')} value={password} onChange={setPassword}
          placeholder="Enter your password" onEnter={handleSubmit} accent={accent} autoComplete="current-password" />
        <LoginSubmit loading={loading} accent={accent} labelIdle={t('auth.signIn')} labelBusy={t('auth.signingIn')} />
      </form>
    </LoginFrame>
  );
}
