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

/* ─────── Card Shell (same as Dashboard.jsx) ─────── */
function DashCard({ children, delay = 0, style: extraStyle }) {
  return (
    <div
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.15)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3), 0 0 20px rgba(34,211,238,0.04)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.06)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)';
      }}
      style={{
        background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
        borderRadius: 18,
        padding: '22px 24px',
        border: '1px solid rgba(34,211,238,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)',
        animation: `fadeInUp 0.4s ease-out ${delay}s both`,
        position: 'relative', overflow: 'hidden',
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
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
        setError('Failed to load sport modules');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleEnterSport = (mod) => {
    setSport(mod);
    navigate('/club/dashboard');
  };

  const handleLogout = async () => {
    const clubSlug = user?.club?.slug || getStoredClubSlug();
    await logout();
    navigate(clubSlug ? `/portal/${clubSlug}` : '/login');
  };

  /* ── Greeting ── */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = user?.name?.split(' ')[0] || 'Manager';
  const clubName = user?.club?.name || '';
  const clubLogo = user?.club?.logo_url;
  const clubInitials = clubName ? clubName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'CC';
  const clubColor = user?.club?.primary_color || user?.club?.theme_color || '#22d3ee';

  /* ── Loading state (full screen) ── */
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#060d1f', color: '#94a3b8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 10 }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  /* ── Error state (full screen) ── */
  if (error) {
    return (
      <div style={{
        minHeight: '100vh', background: '#060d1f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
            </svg>
          </div>
          <div style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{error}</div>
          <button
            onClick={loadData}
            style={{
              marginTop: 12, padding: '8px 20px', borderRadius: 10,
              background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)',
              color: '#22d3ee', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sportModules = modules || [];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 0% 0%, rgba(13,31,60,0.4) 0%, transparent 50%), #060d1f',
      color: '#e2e8f0',
    }}>
      {/* ═══ TOP BAR ═══ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'linear-gradient(180deg, rgba(10,22,40,0.97) 0%, rgba(10,22,40,0.92) 100%)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(34,211,238,0.08)',
        padding: isMobile ? '0 16px' : '0 32px',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Left: Club logo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {clubLogo ? (
            <img
              src={clubLogo} alt={clubName}
              style={{
                width: 38, height: 38, borderRadius: 12, objectFit: 'cover',
                border: '1px solid rgba(34,211,238,0.15)',
              }}
            />
          ) : (
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: `linear-gradient(135deg, ${clubColor}, ${clubColor}aa)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: '#fff',
              flexShrink: 0,
            }}>
              {clubInitials}
            </div>
          )}
          <div>
            <div style={{
              color: '#f1f5f9', fontSize: 16, fontWeight: 700,
              fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}>{clubName}</div>
            <div style={{
              color: '#475569', fontSize: 10, fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>Club Portal</div>
          </div>
        </div>

        {/* Right: Notification bell + Sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NotificationBell navigate={navigate} />
          <button
            type="button"
            onClick={handleLogout}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(244,63,94,0.15)';
              e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(244,63,94,0.06)';
              e.currentTarget.style.borderColor = 'rgba(244,63,94,0.15)';
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 10,
              background: 'rgba(244,63,94,0.06)',
              border: '1px solid rgba(244,63,94,0.15)',
              color: '#fda4af', fontSize: 13, fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            {!isMobile && 'Sign Out'}
          </button>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{
        padding: isMobile ? '20px 16px' : '24px 32px',
        maxWidth: 1280, margin: '0 auto',
      }}>
        {/* ═══ SECTION 1: Page Header ═══ */}
        <div style={{
          marginBottom: 24, padding: '20px 24px', borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(6,13,31,0.3) 100%)',
          border: '1px solid rgba(34,211,238,0.06)',
          position: 'relative', overflow: 'hidden',
          animation: 'fadeInUp 0.4s ease-out',
        }}>
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 120, height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{
                margin: '0 0 4px',
                fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 20 : 24, fontWeight: 700,
                color: '#f1f5f9', letterSpacing: '-0.02em',
              }}>
                {greeting}, <span style={{ color: '#22d3ee' }}>{firstName}</span>
              </h1>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>
                Here's your club overview
              </p>
            </div>
          </div>
        </div>

        {/* ═══ Sport Module Cards ═══ */}
        <div style={{ marginBottom: 22, animation: 'fadeInUp 0.4s ease-out 0.15s both' }}>
          {sportModules.length === 0 ? (
            <DashCard delay={0.2}>
              <EmptyState
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v8" />
                  </svg>
                }
                title="No sport modules activated"
                description="Contact management to activate sport modules"
              />
            </DashCard>
          ) : sportModules.length === 1 ? (
            <div style={{ maxWidth: 400 }}>
              <SportCard module={sportModules[0]} onEnter={() => handleEnterSport(sportModules[0])} />
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 20,
            }}>
              {sportModules.map(mod => (
                <SportCard key={mod.id} module={mod} onEnter={() => handleEnterSport(mod)} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
