import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarColor } from '../../components/CrudTable';

const labelStyle = {
  fontFamily: 'var(--font-body)', fontSize: 12, color: '#6E6E73',
};

function WelcomeHero({ user }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = user?.name?.split(' ')[0] || 'Admin';

  return (
    <div style={{ borderRadius: 16,
      background: '#FFFFFF',
      color: '#1D1D1F',
      padding: '36px 40px',
      border: '1px solid #E5E5EA',
      marginBottom: 28,
      animation: 'fadeInUp 0.5s ease-out',
    }}>
      <div style={{ ...labelStyle, color: '#86868B', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: '#0071E3', display: 'inline-block' }} />
        Platform Admin
      </div>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600, color: '#1D1D1F',
        margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.1,
      }}>
        {greeting}, {firstName}
      </h1>
      <p style={{ color: '#86868B', fontSize: 14, margin: 0, fontFamily: 'var(--font-body)' }}>Overview of all clubs and platform metrics</p>
    </div>
  );
}

function MetricCard({ title, value, icon, index = 0, delay = 0 }) {
  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        flex: '1 1 200px', background: '#FFFFFF', padding: '20px 22px',
        border: '1px solid #E5E5EA', transition: 'border-color 0.15s ease',
        display: 'flex', flexDirection: 'column', gap: 18,
        animation: `fadeInUp 0.5s ease-out ${delay}s both`,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {icon && <span style={{ display: 'inline-flex', color: '#1D1D1F' }}>{icon}</span>}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        </div>
        </div>
      <div style={{
        color: '#1D1D1F', fontSize: 34, fontWeight: 500, fontFamily: 'var(--font-display)',
        letterSpacing: '-0.02em', lineHeight: 1,
      }}>{value}</div>
    </div>
  );
}

function ClubCard({ club, index }) {
  const ac = getAvatarColor(club.name);
  const initials = club.name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?';
  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
        background: '#FFFFFF', border: '1px solid #E5E5EA',
        transition: 'border-color 0.15s ease',
        animation: `fadeInUp 0.4s ease-out ${0.1 + index * 0.06}s both`,
      }}>
      <div style={{ borderRadius: 10,
        width: 42, height: 42, background: ac.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: ac.text, flexShrink: 0,
      }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: '#1D1D1F', fontSize: 15, fontWeight: 500, fontFamily: 'var(--font-display)',
          letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{club.name}</div>
        <div style={{ ...labelStyle, marginTop: 3 }}>{club.slug}</div>
      </div>
      {club.contact_email && (
        <div style={{
          color: '#515154', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', maxWidth: 200,
        }}>{club.contact_email}</div>
      )}
    </div>
  );
}

export default function PlatformDashboard() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState(null);
  const { user } = useAuth();
  useEffect(() => { api.get('/platform/metrics').then(r => setMetrics(r.data)).catch(() => {}); }, []);

  if (!metrics) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#6E6E73' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}><circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5EA" strokeWidth="3" /><path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#1D1D1F" strokeWidth="3" strokeLinecap="round" /></svg>
        <div style={labelStyle}>{t('loading.default')}</div>
      </div>
    </div>
  );

  return (
    <div>
      <WelcomeHero user={user} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <MetricCard title="Total Clubs" value={metrics.total_clubs} index={0} delay={0.05} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
        <MetricCard title="Total Users" value={metrics.total_users} index={1} delay={0.1} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        <MetricCard title="Club Managers" value={metrics.total_managers} index={2} delay={0.15} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
      </div>

      <div style={{ borderRadius: 16, background: '#FFFFFF', padding: '22px 24px', border: '1px solid #E5E5EA', animation: 'fadeInUp 0.5s ease-out 0.25s both' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10,
          paddingBottom: 14, marginBottom: 16, borderBottom: '1px solid #E5E5EA',
        }}>
          <h2 style={{
            margin: 0, color: '#1D1D1F', fontSize: 18, fontWeight: 500, fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em', lineHeight: 1,
          }}>Recent Clubs</h2>
          <span style={labelStyle}>{metrics.recent_clubs?.length || 0} clubs</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {metrics.recent_clubs?.length > 0 ? metrics.recent_clubs.map((club, i) => <ClubCard key={club.id} club={club} index={i} />) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#515154' }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>No clubs yet</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
