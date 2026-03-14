import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSportModule } from '../../contexts/SportModuleContext';
import { getClubSportModules } from '../../api/clubSportModules';

export default function SportModuleDashboard() {
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
      .catch(() => setError('فشل في تحميل الأنشطة الرياضية'));
  }, []);

  // Loading
  if (modules === null && !error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#64748b' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 14, fontWeight: 500 }}>جارٍ التحميل...</div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!modules || modules.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(51,65,85,0.15)', border: '1px solid rgba(51,65,85,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v8" />
            </svg>
          </div>
          <div style={{ color: '#94a3b8', fontSize: 18, fontWeight: 600, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>
            لا توجد أنشطة رياضية مفعّلة لهذا النادي
          </div>
          <div style={{ color: '#475569', fontSize: 14 }}>
            تواصل مع الإدارة لتفعيل الأنشطة
          </div>
          {error && <div style={{ color: '#fc8181', fontSize: 13, marginTop: 12 }}>{error}</div>}
        </div>
      </div>
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
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 700, color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>
          {clubName}
        </h1>
        <div style={{ color: '#64748b', fontSize: 15, marginTop: 6, fontWeight: 500 }}>
          اختر النشاط الرياضي
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

function SportCard({ module, onEnter }) {
  const [hovered, setHovered] = useState(false);
  const color = module.color || '#8b5cf6';
  const stats = module.stats || {};

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: `linear-gradient(135deg, ${color}0A 0%, rgba(6,13,31,0.4) 100%)`,
        borderRadius: 18,
        border: `1px solid ${color}20`,
        borderTop: `4px solid ${color}`,
        padding: '28px 24px 22px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? `0 8px 30px ${color}15` : 'none',
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
          {module.icon ? module.icon.charAt(0).toUpperCase() : '?'}
        </div>
        <div>
          <div style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
            {module.name}
          </div>
          {module.description && (
            <div style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>{module.description}</div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        <div style={{ color: '#94a3b8', fontSize: 13 }}>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{stats.members_count || 0}</span> أعضاء
          <span style={{ margin: '0 8px', color: '#334155' }}>&middot;</span>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{stats.coaches_count || 0}</span> مدربين
        </div>
        <div style={{ color: '#94a3b8', fontSize: 13 }}>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{stats.groups_count || 0}</span> مجموعات
          <span style={{ margin: '0 8px', color: '#334155' }}>&middot;</span>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{stats.sessions_this_week || 0}</span> جلسات/أسبوع
        </div>
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
        إدارة النشاط →
      </button>
    </div>
  );
}
