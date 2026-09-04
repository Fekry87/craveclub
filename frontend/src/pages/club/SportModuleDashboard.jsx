import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useSportModule } from '../../contexts/SportModuleContext';
import { getClubSportModules } from '../../api/clubSportModules';
import { EmptyState } from '../../components/ui/EmptyState';

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: 'var(--color-text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="var(--color-primary-dim)" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{t('loading.default')}</div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!modules || modules.length === 0) {
    return (
      <EmptyState
        icon={
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
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
    <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 700,
          color: 'var(--color-text)', margin: 0, letterSpacing: '-0.02em',
        }}>
          {clubName}
        </h1>
        <div style={{ color: 'var(--color-text-muted)', fontSize: 15, marginTop: 6, fontWeight: 500 }}>
          {t('sportModules.selectModule')}
        </div>
      </div>

      {/* Card Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {modules.map((mod) => (
          <SportCard key={mod.id} module={mod} onEnter={() => handleEnterSport(mod)} />
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

export function SportCard({ module, onEnter }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const color = module.color || '#8b5cf6';
  const stats = module.stats || {};

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid var(--color-border)`,
        borderTop: `4px solid ${color}`,
        padding: '28px 24px 22px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? `var(--shadow-card), 0 8px 30px ${color}15` : 'var(--shadow-card)',
      }}
      onClick={onEnter}
    >
      {/* Icon + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: `${color}15`,
          border: `1px solid ${color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700, color,
          flexShrink: 0,
        }}>
          {sportGlyph(module)}
        </div>
        <div>
          <div style={{
            color: 'var(--color-text)', fontSize: 20, fontWeight: 700,
            fontFamily: "'Outfit', sans-serif",
          }}>
            {module.name}
          </div>
          {module.description && (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 12, marginTop: 2 }}>{module.description}</div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {[
          { label: t('sportModules.branches'), value: stats.branches_count || 0 },
          { label: t('sportModules.newRegistrations'), value: stats.new_registrations_count || 0 },
          { label: t('sportModules.activeSwimmers'), value: stats.active_swimmers_count || 0 },
        ].map((stat) => (
          <div key={stat.label} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              color: 'var(--color-text)', fontSize: 18, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
            }}>{stat.value}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 11, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onEnter(); }}
        style={{
          width: '100%',
          padding: '10px 0',
          borderRadius: 10,
          background: `${color}12`,
          border: `1px solid ${color}30`,
          color,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontFamily: "'DM Sans', sans-serif",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = `${color}22`; }}
        onMouseLeave={e => { e.currentTarget.style.background = `${color}12`; }}
      >
        {t('sportModules.manageActivity')}
      </button>
    </div>
  );
}
