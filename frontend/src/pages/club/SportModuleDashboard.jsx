import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useSportModule } from '../../contexts/SportModuleContext';
import { getClubSportModules } from '../../api/clubSportModules';
import { EmptyState } from '../../components/ui/EmptyState';
import { labelStyle } from '../../components/ui/styles';

export default function SportModuleDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { setSport } = useSportModule();
  const navigate = useNavigate();
  const location = useLocation();
  const [modules, setModules] = useState(null);
  const [error, setError] = useState(null);
  // Skip auto-redirect when user explicitly navigated back via breadcrumb
  const forceShow = location.state?.forceShow;

  useEffect(() => {
    getClubSportModules()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setModules(list);
        // Auto-redirect if only 1 sport module (unless user explicitly came back)
        if (list.length === 1 && !forceShow) {
          setSport(list[0]);
          navigate('/club/dashboard', { replace: true });
        }
      })
      .catch(() => setError(t('sportModules.loadFailed')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loading
  if (modules === null && !error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#6E6E73' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5EA" strokeWidth="2" />
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#0071E3" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div style={{ ...labelStyle }}>{t('loading.default')}</div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!modules || modules.length === 0) {
    return (
      <EmptyState
        icon={
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v8" />
          </svg>
        }
        title={t('sportModules.noActive')}
        description={error || t('sportModules.contactManagement')}
      />
    );
  }

  // Single sport auto-redirected above; this is the multi-sport card grid
  const clubName = user?.club?.name || '';

  const handleEnterSport = (mod) => {
    setSport(mod);
    navigate('/club/dashboard');
  };

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ ...labelStyle, marginBottom: 8 }}>
          {t('sportModules.selectModule')}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700,
          color: '#1D1D1F', margin: 0, letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}>
          {clubName}
        </h1>
      </div>

      {/* Card Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {modules.map((mod, i) => (
          <SportCard key={mod.id} module={mod} index={i} onEnter={() => handleEnterSport(mod)} />
        ))}
      </div>
    </div>
  );
}

// Map RemixIcon sport names → emoji (web has no RemixIcon font loaded).
// Falls back to the sport name's initial so new sports still show something sensible.
const SPORT_EMOJI = {
  'drop-fill': '🏊', 'water-flash-fill': '🏊', 'football-fill': '⚽',
  'basketball-fill': '🏀', 'tennis-fill': '🎾', 'ping-pong-fill': '🏓',
  'run-fill': '🏃', 'boxing-fill': '🥊', 'bike-fill': '🚴', 'football-line': '⚽',
};

function sportGlyph(module) {
  if (SPORT_EMOJI[module.icon]) return SPORT_EMOJI[module.icon];
  return module.name ? module.name.charAt(0).toUpperCase() : '?';
}

export function SportCard({ module, onEnter, index }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const stats = module.stats || {};

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        borderRadius: 16,
        padding: '22px 24px 20px',
        cursor: 'pointer',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.06)' : 'none',
        transition: 'box-shadow 0.2s ease',
        animation: `fadeInUp 0.3s ease-out ${(index || 0) * 0.05}s both`,
      }}
      onClick={onEnter}
    >
      {/* Icon + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: 'rgba(0,113,227,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: '#0071E3', fontWeight: 600,
          flexShrink: 0,
        }}>
          {sportGlyph(module)}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            color: '#1D1D1F', fontSize: 17, fontWeight: 600,
            fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', lineHeight: 1.2,
          }}>
            {module.name}
          </div>
          {module.description && (
            <div style={{ color: '#6E6E73', fontSize: 13, marginTop: 4 }}>{module.description}</div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex', marginBottom: 18,
        background: '#F2F2F7', borderRadius: 12, padding: '4px 0',
      }}>
        {[
          { label: t('sportModules.branches'), value: stats.branches_count || 0 },
          { label: t('sportModules.newRegistrations'), value: stats.new_registrations_count || 0 },
          { label: t('sportModules.activeSwimmers'), value: stats.active_swimmers_count || 0 },
        ].map((stat, si) => (
          <div key={stat.label} style={{
            flex: 1, padding: '10px 8px', minWidth: 0, textAlign: 'center',
            borderInlineStart: si > 0 ? '1px solid #E5E5EA' : 'none',
          }}>
            <div style={{
              color: si === 1 && stat.value > 0 ? '#0071E3' : '#1D1D1F', fontSize: 24, fontWeight: 700,
              fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.1,
            }}>{stat.value}</div>
            <div style={{ ...labelStyle, marginTop: 5, lineHeight: 1.3 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        type="button"
        className="pl-btn pl-btn-primary"
        onClick={(e) => { e.stopPropagation(); onEnter(); }}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {t('sportModules.manageActivity')}
      </button>
    </div>
  );
}
