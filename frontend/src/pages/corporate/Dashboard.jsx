import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarColor } from '../../components/CrudTable';

function WelcomeHero({ user, corporate }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = user?.name?.split(' ')[0] || 'Admin';
  const platformName = corporate?.platform_name || 'CraveClubs';

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(13,31,60,0.85) 0%, rgba(139,92,246,0.08) 50%, rgba(13,31,60,0.65) 100%)',
      borderRadius: 22, padding: '36px 40px',
      border: '1px solid rgba(139,92,246,0.1)',
      position: 'relative', overflow: 'hidden', marginBottom: 28,
      animation: 'fadeInUp 0.5s ease-out',
      boxShadow: '0 2px 12px rgba(0,0,0,0.15), 0 0 40px rgba(139,92,246,0.03)',
    }}>
      <div style={{ position: 'absolute', top: -40, right: -20, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -30, right: 80, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 10%, rgba(139,92,246,0.2) 50%, transparent 90%)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ color: '#a78bfa', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          {platformName}
        </div>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 30, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          {greeting}, <span style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{firstName}</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Manage your clubs, control features, and drive growth</p>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, delay = 0 }) {
  const colorMap = {
    violet: { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.12)', glow: 'rgba(139,92,246,0.15)', gradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' },
    cyan: { bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.12)', glow: 'rgba(34,211,238,0.15)', gradient: 'linear-gradient(135deg, #22d3ee, #06b6d4)' },
    teal: { bg: 'rgba(45,212,191,0.08)', border: 'rgba(45,212,191,0.12)', glow: 'rgba(45,212,191,0.15)', gradient: 'linear-gradient(135deg, #2dd4bf, #14b8a6)' },
    sky: { bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.12)', glow: 'rgba(56,189,248,0.15)', gradient: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' },
    amber: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.12)', glow: 'rgba(251,191,36,0.15)', gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)' },
  };
  const c = colorMap[color] || colorMap.violet;
  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${c.glow}, 0 4px 16px rgba(0,0,0,0.2)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)'; }}
      style={{ flex: '1 1 180px', background: 'linear-gradient(135deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)', borderRadius: 18, padding: '24px 26px', border: `1px solid ${c.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', overflow: 'hidden', animation: `fadeInUp 0.5s ease-out ${delay}s both` }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c.gradient, opacity: 0.6, borderRadius: '18px 18px 0 0' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{title}</div>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      </div>
      <div style={{ color: '#f1f5f9', fontSize: 34, fontWeight: 700, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function FeatureUsageBar({ label, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
      <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500, width: 140, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(51,65,85,0.3)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ color: '#64748b', fontSize: 12, fontWeight: 500, width: 60, textAlign: 'right' }}>{count}/{total}</div>
    </div>
  );
}

function ClubCard({ club, index, onClick }) {
  const ac = getAvatarColor(club.name);
  const initials = club.name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?';
  const features = club.features;
  const enabledCount = features ? Object.values(features).filter(v => v === true).length : 0;

  return (
    <div
      onClick={() => onClick(club)}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.06)'; e.currentTarget.style.transform = 'translateX(0)'; }}
      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)', borderRadius: 14, border: '1px solid rgba(34,211,238,0.06)', transition: 'all 0.25s ease', animation: `fadeInUp 0.4s ease-out ${0.1 + index * 0.06}s both`, cursor: 'pointer' }}
    >
      <div style={{ width: 46, height: 46, borderRadius: 13, background: ac.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: ac.text, flexShrink: 0, boxShadow: '0 3px 10px rgba(0,0,0,0.25)' }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.name}</div>
        <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{club.users_count || 0} users</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)', color: '#a78bfa', fontSize: 12, fontWeight: 500 }}>
          {enabledCount}/7 features
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
      </div>
    </div>
  );
}

export default function CorporateDashboard() {
  const [metrics, setMetrics] = useState(null);
  const { user, corporate } = useAuth();

  useEffect(() => {
    api.get('/corporate/metrics').then(r => setMetrics(r.data)).catch(() => {});
  }, []);

  if (!metrics) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#64748b' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}><circle cx="12" cy="12" r="10" fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="3" /><path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" /></svg>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Loading dashboard...</div>
      </div>
    </div>
  );

  const featureLabels = {
    leaderboard_enabled: 'Leaderboard',
    evaluations_enabled: 'Evaluations',
    skills_enabled: 'Skills',
    training_plans_enabled: 'Training Plans',
    attendance_tracking_enabled: 'Attendance',
    swimmer_accounts_enabled: 'Swimmer Accounts',
    coach_portal_enabled: 'Coach Portal',
    subscription_plans_enabled: 'Subscription Plans',
  };

  return (
    <div>
      <WelcomeHero user={user} corporate={corporate} />

      {/* Metrics */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <MetricCard title="Total Clubs" value={metrics.total_clubs} color="violet" delay={0.05}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>} />
        <MetricCard title="Total Swimmers" value={metrics.total_swimmers} color="cyan" delay={0.1}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        <MetricCard title="Total Coaches" value={metrics.total_coaches} color="teal" delay={0.15}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
        <MetricCard title="This Month" value={metrics.clubs_this_month} color="amber" delay={0.2}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Feature Usage */}
        <div style={{ background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)', borderRadius: 18, padding: '24px 26px', border: '1px solid rgba(139,92,246,0.08)', animation: 'fadeInUp 0.5s ease-out 0.25s both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: 18, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Feature Usage</h2>
          </div>
          {metrics.feature_usage && Object.entries(metrics.feature_usage).map(([key, count]) => (
            <FeatureUsageBar key={key} label={featureLabels[key] || key} count={count} total={metrics.total_clubs} />
          ))}
        </div>

        {/* Recent Clubs */}
        <div style={{ background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)', borderRadius: 18, padding: '24px 26px', border: '1px solid rgba(34,211,238,0.06)', animation: 'fadeInUp 0.5s ease-out 0.3s both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>
            </div>
            <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: 18, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Recent Clubs</h2>
            <div style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 8, background: 'rgba(34,211,238,0.06)', color: '#64748b', fontSize: 12, fontWeight: 500 }}>{metrics.total_clubs} total</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {metrics.recent_clubs?.length > 0 ? metrics.recent_clubs.map((club, i) => (
              <ClubCard key={club.id} club={club} index={i} onClick={() => window.location.href = `/corporate/clubs`} />
            )) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>No clubs yet</div>
                <div style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>Create your first club to get started</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
