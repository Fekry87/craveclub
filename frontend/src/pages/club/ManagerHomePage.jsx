import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredClubSlug } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useSportModule } from '../../contexts/SportModuleContext';
import { getClubSportModules } from '../../api/clubSportModules';
import { useIsMobile } from '../../components/ui/hooks';
import { EmptyState } from '../../components/ui/EmptyState';
import { SportCard } from './SportModuleDashboard';
import { NotificationBell } from '../../components/Layout';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { labelStyle } from '../../components/ui/styles';
import { useTranslation } from 'react-i18next';

/* ─────── Card Shell (same as Dashboard.jsx) ─────── */
function DashCard({ children, delay = 0, style: extraStyle }) {
  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        background: '#FFFFFF',
        padding: '22px 24px',
        border: '1px solid #E5E5EA',
        borderRadius: 16,
        animation: `fadeInUp 0.3s ease-out ${delay}s both`,
        position: 'relative',
        transition: 'border-color 0.15s ease',
        ...extraStyle,
      }}
    >
      {children}
    </div>
  );
}

/* ═════════════════════════════════════════════════ */
/*   Manager Home Page — Full Screen (No Sidebar)   */
/* ═════════════════════════════════════════════════ */
export default function ManagerHomePage() {
  const { t } = useTranslation();
  const [modules, setModules] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const { setSport } = useSportModule();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    setError(null);
    getClubSportModules()
      .then(data => setModules(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('[ManagerHome] Load failed:', err.message);
        setError(t('errors.generic'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (user?.club?.name) document.title = user.club.name; }, [user?.club?.name]);

  const handleEnterSport = (mod) => {
    setSport(mod);
    navigate('/club/dashboard');
  };

  const handleLogout = async () => {
    const clubSlug = user?.club?.slug || getStoredClubSlug();
    await logout();
    navigate(clubSlug ? `/${clubSlug}` : '/login');
  };

  /* ── Greeting ── */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('dashboard.goodMorning') : hour < 17 ? t('dashboard.goodAfternoon') : t('dashboard.goodEvening');
  const firstName = user?.name?.split(' ')[0] || 'Manager';
  const clubName = user?.club?.name || '';
  const clubLogo = user?.club?.logo_url;
  const clubInitials = clubName ? clubName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'CC';
  const rawColor = user?.club?.primary_color || user?.club?.theme_color || '#0071E3';
  const clubColor = rawColor.startsWith('#') ? rawColor : `#${rawColor}`;

  /* ── Loading state (full screen) ── */
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F5F5F7', color: '#515154',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5EA" strokeWidth="2" />
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#0071E3" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div style={{ ...labelStyle }}>{t('dashboard.loadingDashboard')}</div>
        </div>
      </div>
    );
  }

  /* ── Error state (full screen) ── */
  if (error) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F5F5F7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderRadius: 14,
            width: 56, height: 56, margin: '0 auto 18px',
            background: 'rgba(255,59,48,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
            </svg>
          </div>
          <div style={{
            color: '#1D1D1F', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
            letterSpacing: '-0.02em', marginBottom: 16,
          }}>{error}</div>
          <button type="button" onClick={loadData} className="pl-btn pl-btn-secondary">
            {t('actions.back')}
          </button>
        </div>
      </div>
    );
  }

  const sportModules = modules || [];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F5F7',
      color: '#1D1D1F',
    }}>
      {/* ═══ TOP BAR ═══ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(246,246,248,0.86)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: isMobile ? '0 16px' : '0 32px',
        height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Left: Club logo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          {clubLogo ? (
            <img
              src={clubLogo} alt={clubName}
              style={{ borderRadius: 8, width: 30, height: 30, objectFit: 'cover', flexShrink: 0, background: '#FFFFFF' }}
            />
          ) : (
            <div style={{ borderRadius: 8,
              width: 30, height: 30, background: clubColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600,
              color: '#1D1D1F',
              flexShrink: 0,
            }}>
              {clubInitials}
            </div>
          )}
          <span style={{
            color: '#1D1D1F', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{clubName}</span>
        </div>

        {/* Right: Language + Notification bell + Sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <LanguageSwitcher compact />
          <NotificationBell navigate={navigate} />
          <button
            type="button"
            onClick={handleLogout}
            className="pl-btn pl-btn-secondary pl-btn-sm"
          >
            <svg className="rtl-flip" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            {!isMobile && t('nav.signOut')}
          </button>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{
        padding: isMobile ? '24px 16px 40px' : '36px 32px 56px',
        maxWidth: 1280, margin: '0 auto',
      }}>
        {/* ═══ SECTION 1: Greeting ═══ */}
        <div style={{
          marginBottom: 28,
          animation: 'fadeIn 0.25s ease-out',
        }}>
          <h1 style={{
            margin: 0,
            fontFamily: 'var(--font-display)', fontSize: isMobile ? 26 : 32, fontWeight: 700,
            color: '#1D1D1F', letterSpacing: '-0.02em', lineHeight: 1.15,
          }}>
            {greeting}, <span style={{ color: '#0071E3' }}>{firstName}</span>
          </h1>
          <div style={{ color: '#6E6E73', fontSize: 15, marginTop: 6 }}>
            {t('dashboard.subtitle')}
          </div>
        </div>

        {/* ═══ Sport Module Cards ═══ */}
        <div style={{ marginBottom: 22, animation: 'fadeInUp 0.3s ease-out 0.1s both' }}>
          {sportModules.length === 0 ? (
            <DashCard delay={0.15}>
              <EmptyState
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v8" />
                  </svg>
                }
                title={t('empty.noData')}
                description={t('empty.itemsWillAppear')}
              />
            </DashCard>
          ) : sportModules.length === 1 ? (
            <div style={{ maxWidth: 400 }}>
              <SportCard module={sportModules[0]} index={0} onEnter={() => handleEnterSport(sportModules[0])} />
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}>
              {sportModules.map((mod, i) => (
                <SportCard key={mod.id} module={mod} index={i} onEnter={() => handleEnterSport(mod)} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
