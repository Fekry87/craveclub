import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarColor } from '../../components/CrudTable';
import { Badge } from '../../components/ui/Badge';
import { useTranslation } from 'react-i18next';

const labelStyle = {
  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, color: '#6E6E73',
};

const sectionTitleStyle = {
  margin: 0, color: '#1D1D1F', fontSize: 17, fontWeight: 600,
  fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', lineHeight: 1.2,
};

function WelcomeHero({ user, corporate }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = user?.name?.split(' ')[0] || 'Admin';
  const platformName = corporate?.platform_name || 'CraveClubs';

  return (
    <div style={{
      background: '#FFFFFF',
      color: '#1D1D1F',
      padding: '28px 32px',
      border: '1px solid #E5E5EA',
      borderRadius: 16,
      position: 'relative', overflow: 'hidden', marginBottom: 28,
      animation: 'fadeInUp 0.5s ease-out',
    }}>
      <div style={{ ...labelStyle, marginBottom: 10 }}>{platformName}</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: '#1D1D1F', margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
        {greeting}, <span style={{ color: '#0071E3' }}>{firstName}</span>
      </h1>
      <p style={{ color: '#6E6E73', fontSize: 15, margin: 0, fontFamily: 'var(--font-body)' }}>Manage your clubs, control features, and drive growth</p>
    </div>
  );
}

function MetricCard({ title, value, icon, index = 0, delay = 0 }) {
  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
      style={{ flex: '1 1 180px', background: '#FFFFFF', padding: '18px 20px', border: '1px solid #E5E5EA', borderRadius: 16, transition: 'box-shadow 0.2s ease', position: 'relative', display: 'flex', flexDirection: 'column', gap: 14, animation: `fadeInUp 0.5s ease-out ${delay}s both` }}
    >
      <div style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {icon && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, borderRadius: 8, background: '#F2F2F7', color: '#0071E3', flexShrink: 0,
          }}>{icon}</span>
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
      </div>
      <div style={{ color: '#1D1D1F', fontSize: 30, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function FeatureUsageBar({ label, count, total, index }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F2F2F7' }}>
      <div style={{ color: '#1D1D1F', fontSize: 13, width: 140, flexShrink: 0, fontFamily: 'var(--font-body)' }}>{label}</div>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#E5E5EA', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: '#0071E3', transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ ...labelStyle, color: '#515154', width: 60, textAlign: 'end' }}>{count}/{total}</div>
    </div>
  );
}

function ClubCard({ club, index, onClick }) {
  const ac = getAvatarColor(club.name);
  const initials = club.name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?';
  const features = club.features;
  const featureKeys = features ? Object.keys(features).filter(k => k.endsWith('_enabled')) : [];
  const enabledCount = featureKeys.filter(k => features[k] === true).length;
  const featureTotal = featureKeys.length || 8;

  return (
    <div
      onClick={() => onClick(club)}
      onMouseEnter={e => { e.currentTarget.style.background = '#F2F2F7'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; }}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 12, transition: 'background 0.15s ease', animation: `fadeInUp 0.4s ease-out ${0.1 + index * 0.06}s both`, cursor: 'pointer' }}
    >
      <div style={{ borderRadius: '50%', width: 40, height: 40, background: ac.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: ac.text, flexShrink: 0 }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#1D1D1F', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.name}</div>
        <div style={{ color: '#6E6E73', fontSize: 13, marginTop: 2 }}>{club.users_count || 0} users</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <Badge variant="neutral">{enabledCount}/{featureTotal} features</Badge>
        <svg className="rtl-flip" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
      </div>
    </div>
  );
}

export default function CorporateDashboard() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState(null);
  const { user, corporate } = useAuth();

  useEffect(() => {
    api.get('/corporate/metrics').then(r => setMetrics(r.data)).catch(() => {});
  }, []);

  if (!metrics) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#6E6E73' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}><circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5EA" strokeWidth="3" /><path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#1D1D1F" strokeWidth="3" strokeLinecap="round" /></svg>
        <div style={labelStyle}>{t('dashboard.loadingDashboard')}</div>
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
        <MetricCard title="Total Clubs" value={metrics.total_clubs} index={0} delay={0.05}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>} />
        <MetricCard title="Total Swimmers" value={metrics.total_swimmers} index={1} delay={0.1}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        <MetricCard title="Total Coaches" value={metrics.total_coaches} index={2} delay={0.15}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
        <MetricCard title="This Month" value={metrics.clubs_this_month} index={3} delay={0.2}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Feature Usage */}
        <div style={{ borderRadius: 16, background: '#FFFFFF', padding: '22px 24px', border: '1px solid #E5E5EA', animation: 'fadeInUp 0.5s ease-out 0.25s both' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, paddingBottom: 14, marginBottom: 6, borderBottom: '1px solid #E5E5EA' }}>
            <h2 style={sectionTitleStyle}>Feature Usage</h2>
            <span style={{ ...labelStyle, color: '#6E6E73' }}>001</span>
          </div>
          {metrics.feature_usage && Object.entries(metrics.feature_usage).map(([key, count], i) => (
            <FeatureUsageBar key={key} index={i} label={featureLabels[key] || key} count={count} total={metrics.total_clubs} />
          ))}
        </div>

        {/* Recent Clubs */}
        <div style={{ borderRadius: 16, background: '#FFFFFF', padding: '22px 24px', border: '1px solid #E5E5EA', animation: 'fadeInUp 0.5s ease-out 0.3s both' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, paddingBottom: 14, marginBottom: 16, borderBottom: '1px solid #E5E5EA' }}>
            <h2 style={sectionTitleStyle}>{t('corporate.clubs')}</h2>
            <span style={labelStyle}>{metrics.total_clubs} total</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {metrics.recent_clubs?.length > 0 ? metrics.recent_clubs.map((club, i) => (
              <ClubCard key={club.id} club={club} index={i} onClick={() => window.location.href = `/corporate/clubs`} />
            )) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#515154' }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{t('empty.noData')}</div>
                <div style={{ fontSize: 13, color: '#6E6E73', marginTop: 4 }}>{t('empty.itemsWillAppear')}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
