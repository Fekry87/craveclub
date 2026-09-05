import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const STATUS_COLORS = {
  Scheduled: '#515154',
  Live:      '#FF9500',
  Completed: '#34C759',
  Cancelled: '#86868B',
};

const labelMono = {
  fontFamily: 'var(--font-body)', fontSize: 12, color: '#6E6E73',
};

function WelcomeHero({ user, data }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = user?.name?.split(' ')[0] || 'Coach';
  const liveCount = data.stats?.live_count || data.live_sessions?.length || 0;

  return (
    <div className="welcome-hero" style={{ borderRadius: 16,
      background: '#FFFFFF',
      color: '#1D1D1F',
      padding: '36px 40px',
      border: '1px solid #E5E5EA',
      position: 'relative', marginBottom: 28,
      animation: 'fadeInUp 0.4s ease-out',
    }}>
      <div style={{
        ...labelMono, color: '#86868B', marginBottom: 14,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: '#0071E3', display: 'inline-block' }} />
        Coach Dashboard
      </div>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 600,
        color: '#1D1D1F', margin: '0 0 10px', letterSpacing: '-0.02em',
        lineHeight: 1,
      }}>
        {greeting}, <span style={{ color: '#0071E3' }}>{firstName}</span>
      </h1>
      <p style={{ color: '#6E6E73', fontSize: 14, margin: 0, fontFamily: 'var(--font-body)' }}>
        {liveCount > 0
          ? <span style={{ color: '#1D1D1F' }}>You have {liveCount} live session{liveCount > 1 ? 's' : ''} right now</span>
          : data.today_sessions?.length
            ? `You have ${data.today_sessions.length} session${data.today_sessions.length > 1 ? 's' : ''} today`
            : 'No sessions scheduled for today'
        }
      </p>
    </div>
  );
}

function StatCard({ title, value, icon, index }) {
  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{ borderRadius: 16,
        flex: '1 1 180px', minWidth: 0, background: '#FFFFFF', padding: '20px 22px',
        border: '1px solid #E5E5EA', transition: 'border-color 0.15s ease',
        position: 'relative', display: 'flex', flexDirection: 'column', gap: 18,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ ...labelMono, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {icon && <span style={{ display: 'inline-flex', color: '#1D1D1F' }}>{icon}</span>}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        </div>
        </div>
      <div style={{
        color: '#1D1D1F', fontSize: 34, fontWeight: 500, lineHeight: 1,
        fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
      }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.Scheduled;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px',
      background: 'transparent', border: `1px solid ${color}`, color,
      fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
      letterSpacing: '-0.02em', lineHeight: '14px',
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

function SessionCard({ session, index, navigate }) {
  const date = session.date?.split('T')[0];
  const dayName = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }) : '';
  const dayNum = date ? new Date(date + 'T00:00:00').getDate() : '';
  const month = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }) : '';
  const status = session.status || 'Scheduled';

  const handleAction = () => {
    if (status === 'Scheduled') {
      // Start session
      api.post(`/coach/sessions/${session.id}/start`).then(() => {
        navigate(`/coach/sessions/${session.id}/live`);
      });
    } else if (status === 'Live') {
      navigate(`/coach/sessions/${session.id}/live`);
    } else {
      navigate('/coach/sessions');
    }
  };

  const actionBtn = {
    Scheduled: { label: 'Start', cls: 'pl-btn pl-btn-accent pl-btn-sm' },
    Live:      { label: 'Continue', cls: 'pl-btn pl-btn-primary pl-btn-sm' },
    Completed: { label: 'View', cls: 'pl-btn pl-btn-ghost pl-btn-sm' },
  }[status] || null;

  return (
    <div className="session-card"
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        display: 'flex', alignItems: 'center', gap: 18, padding: '16px 20px',
        background: '#FFFFFF', border: '1px solid #E5E5EA',
        transition: 'border-color 0.15s ease',
        animation: `fadeInUp 0.3s ease-out ${0.05 + index * 0.04}s both`, flexWrap: 'wrap',
      }}>
      <div style={{
        width: 56, height: 60, background: '#F2F2F7', border: '1px solid #E5E5EA',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <div style={{ ...labelMono, fontSize: 10, color: '#6E6E73' }}>{dayName}</div>
        <div style={{ color: '#1D1D1F', fontSize: 20, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{dayNum}</div>
        <div style={{ ...labelMono, fontSize: 9, color: '#86868B' }}>{month}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          <div style={{
            color: '#1D1D1F', fontSize: 16, fontWeight: 500, fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em', lineHeight: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {session.title || session.group?.name || 'Training Session'}
          </div>
          <StatusBadge status={status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {session.group?.name && session.title && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#515154', fontSize: 13 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6E6E73" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
              {session.group.name}
            </div>
          )}
          {session.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#515154', fontSize: 13 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6E6E73" strokeWidth="1.8" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
              {session.location}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ ...labelMono, fontSize: 12, color: '#1D1D1F', whiteSpace: 'nowrap' }}>
          {session.start_time?.slice(0, 5)} — {session.end_time?.slice(0, 5)}
        </div>
        {actionBtn && (
          <button type="button" onClick={handleAction} className={actionBtn.cls}>
            {actionBtn.label}
          </button>
        )}
      </div>
    </div>
  );
}

function LiveSessionBanner({ sessions, navigate }) {
  if (!sessions || sessions.length === 0) return null;

  return (
    <div style={{ borderRadius: 16,
      background: '#F2F2F7',
      padding: '20px 24px', marginBottom: 20,
      border: '1px solid #FF9500',
      animation: 'fadeInUp 0.3s ease-out 0.05s both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: '#FF9500', display: 'inline-block' }} />
        <h3 style={{
          margin: 0, color: '#FF9500', fontSize: 16, fontWeight: 500,
          fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1,
        }}>
          Live Now
        </h3>
        <div style={{ ...labelMono, marginInlineStart: 'auto', color: '#FF9500' }}>
          {sessions.length} active
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sessions.map((s, i) => (
          <div key={s.id}
            onClick={() => navigate(`/coach/sessions/${s.id}/live`)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
            style={{ borderRadius: 16,
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
              background: '#FFFFFF', border: '1px solid #E5E5EA',
              transition: 'border-color 0.15s ease', cursor: 'pointer',
            }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: '#1D1D1F', fontSize: 15, fontWeight: 500, fontFamily: 'var(--font-display)',
                letterSpacing: '-0.02em', lineHeight: 1,
              }}>
                {s.title || s.group?.name || 'Live Session'}
              </div>
              {s.group?.name && s.title && (
                <div style={{ color: '#515154', fontSize: 12, marginTop: 4 }}>{s.group.name}</div>
              )}
            </div>
            <button type="button" className="pl-btn pl-btn-primary pl-btn-sm">
              Continue
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CoachDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { api.get('/coach/dashboard').then(r => setData(r.data)).catch(() => {}); }, []);

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#6E6E73' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}><circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5EA" strokeWidth="2" /><path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round" /></svg>
        <div style={{ ...labelMono }}>{t('dashboard.loadingDashboard')}</div>
      </div>
    </div>
  );

  const stats = data.stats || {};
  const liveCount = stats.live_count || data.live_sessions?.length || 0;
  const liveSessions = data.live_sessions || [];

  return (
    <div>
      <WelcomeHero user={user} data={data} />

      {/* Live Session Banner */}
      <LiveSessionBanner sessions={liveSessions} navigate={navigate} />

      {/* Stats */}
      <div className="quick-stats-bar" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard title="My Groups" value={stats.total_groups || data.groups?.length || 0} index={0}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        <StatCard title="Today's Sessions" value={stats.today_count || data.today_sessions?.length || 0} index={1}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
        <StatCard title="Live Now" value={liveCount} index={2}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" /></svg>} />
        <StatCard title="Upcoming" value={stats.upcoming_count || data.upcoming_sessions?.length || 0} index={3}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>

      {/* Upcoming Sessions */}
      <div style={{ borderRadius: 16, background: '#FFFFFF', padding: '24px 26px', border: '1px solid #E5E5EA', animation: 'fadeInUp 0.4s ease-out 0.15s both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #E5E5EA' }}>
          <h2 style={{
            margin: 0, color: '#1D1D1F', fontSize: 18, fontWeight: 500,
            fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1,
          }}>{t('dashboard.upcomingSessions')}</h2>
          <div style={{ ...labelMono, marginInlineStart: 'auto' }}>{data.upcoming_sessions?.length || 0} scheduled</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.upcoming_sessions?.length > 0 ? data.upcoming_sessions.map((s, i) => <SessionCard key={s.id} session={s} index={i} navigate={navigate} />) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#86868B' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 10 }}><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <div style={{ ...labelMono }}>{t('dashboard.noUpcomingSessions')}</div>
            </div>
          )}
        </div>

        {/* View All Sessions Link */}
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button type="button" onClick={() => navigate('/coach/sessions')} className="pl-btn pl-btn-ghost pl-btn-sm">
            {t('actions.view')} {t('nav.sessions')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
