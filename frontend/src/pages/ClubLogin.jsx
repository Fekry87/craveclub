import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { LoginField, LoginError, LoginSubmit, LoginFrame } from './Login';

const roleRedirects = {
  PLATFORM_ADMIN: '/corporate',
  CLUB_MANAGER: '/club',
  COACH: '/coach',
  SWIMMER: '/swimmer',
};

function ClubMark({ logo, name, color, size = 36 }) {
  const r = Math.round(size * 0.28);
  if (logo) {
    return <img src={logo} alt={name} style={{ width: size, height: size, borderRadius: r, objectFit: 'cover', background: '#F5F5F7', flexShrink: 0 }} />;
  }
  const initials = (name || 'C').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: r, background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      fontFamily: 'var(--font-display)', fontSize: size * 0.38, fontWeight: 600, letterSpacing: '-0.02em',
    }}>{initials}</div>
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
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  /** Normalize color — DB may store with or without '#' prefix */
  const normalizeColor = (raw, fallback) => {
    if (!raw) return fallback;
    return raw.startsWith('#') ? raw : `#${raw}`;
  };

  const accent = normalizeColor(club?.primary_color || club?.theme_color, '#0071E3');
  const clubName = club?.display_name || club?.name;

  useEffect(() => {
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
          about: b.about,
        });
        if (b.favicon_url) {
          const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
          link.rel = 'icon';
          link.href = b.favicon_url;
          document.head.appendChild(link);
        }
        document.title = b.display_name || b.club_name || 'Club Portal';
      })
      .catch(() => {
        api.get(`/clubs/${slug}`)
          .then(r => setClub(r.data))
          .catch(() => setNotFound(true));
      });
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password, slug);
      navigate(roleRedirects[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <span>
      Powered by{' '}
      <Link to="/login" style={{ color: '#0071E3', textDecoration: 'none', fontWeight: 500 }}>CraveClubs</Link>
    </span>
  );

  /* ─── Not Found ─── */
  if (notFound) {
    return (
      <LoginFrame topLeft={null} footer={footer}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px', background: '#F2F2F7', color: '#86868B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M9.5 15.5c.8-.8 1.6-1 2.5-1s1.7.2 2.5 1M9 9.5h.01M15 9.5h.01" /></svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: '#1D1D1F', margin: 0 }}>{t('club.notFound')}</h2>
          <p style={{ color: '#6E6E73', fontSize: 14, margin: '8px 0 22px' }}>{t('club.notFoundDesc', { slug })}</p>
          <Link to="/login" className="pl-btn pl-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            {t('actions.goCorporateLogin')}
          </Link>
        </div>
      </LoginFrame>
    );
  }

  /* ─── Loading ─── */
  if (!club) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F7', flexDirection: 'column', gap: 14 }}>
        <svg width="28" height="28" viewBox="0 0 18 18" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="9" cy="9" r="7" stroke="#E5E5EA" strokeWidth="2.2" fill="none" />
          <path d="M9 2a7 7 0 0 1 7 7" stroke="#0071E3" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </svg>
        <span style={{ fontSize: 13, color: '#6E6E73' }}>{t('club.loadingClub')}</span>
      </div>
    );
  }

  const contacts = [
    { label: t('auth.emailAddress'), value: club.support_email || club.contact_email },
    { label: t('coaches.phone'), value: club.support_phone || club.contact_phone },
  ].filter(c => c.value);

  return (
    <LoginFrame
      topLeft={<>
        <ClubMark logo={club.logo_url} name={clubName} color={accent} size={26} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clubName}</span>
        <span style={{ fontSize: 12, color: '#86868B' }}>· {t('club.clubPortal')}</span>
      </>}
      footer={footer}
    >
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <ClubMark logo={club.logo_url} name={clubName} color={accent} size={64} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: '#1D1D1F', margin: 0 }}>
          {t('auth.welcomeBack')}
        </h1>
        <p style={{ color: '#6E6E73', fontSize: 14, margin: '8px 0 0' }}>{t('auth.signInToPortal', { name: clubName })}</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <LoginError>{error}</LoginError>}
        <LoginField id="email" type="email" label={t('auth.emailAddress')} value={email} onChange={setEmail}
          placeholder="you@example.com" onEnter={handleSubmit} accent={accent} autoComplete="email" />
        <LoginField id="password" type="password" label={t('auth.password')} value={password} onChange={setPassword}
          placeholder={t('auth.enterPassword')} onEnter={handleSubmit} accent={accent} autoComplete="current-password" />
        <LoginSubmit loading={loading} accent={accent} labelIdle={t('auth.signIn')} labelBusy={t('auth.signingIn')} />
      </form>

      {contacts.length > 0 && (
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #F2F2F7', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {contacts.map(c => (
            <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12 }}>
              <span style={{ color: '#86868B' }}>{c.label}</span>
              <span style={{ color: '#1D1D1F', fontWeight: 500 }}>{c.value}</span>
            </div>
          ))}
        </div>
      )}
    </LoginFrame>
  );
}
