import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_COLORS = {
  Scheduled: { bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.15)', text: '#38bdf8' },
  Live:      { bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.15)', text: '#fb923c' },
  Completed: { bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.15)', text: '#4ade80' },
  Cancelled: { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
};

function WelcomeHero({ user, data }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = user?.name?.split(' ')[0] || 'Coach';
  const liveCount = data.stats?.live_count || data.live_sessions?.length || 0;

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(13,31,60,0.85) 0%, rgba(45,212,191,0.08) 50%, rgba(13,31,60,0.65) 100%)',
      borderRadius: 22, padding: '36px 40px',
      border: '1px solid rgba(45,212,191,0.1)',
      position: 'relative', overflow: 'hidden', marginBottom: 28,
      animation: 'fadeInUp 0.5s ease-out',
      boxShadow: '0 2px 12px rgba(0,0,0,0.15), 0 0 40px rgba(45,212,191,0.03)',
    }}>
      <div style={{ position: 'absolute', top: -40, right: -20, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -30, right: 80, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 10%, rgba(45,212,191,0.2) 50%, transparent 90%)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ color: '#2dd4bf', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          Coach Dashboard
        </div>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 30, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          {greeting}, <span style={{ background: 'linear-gradient(135deg, #2dd4bf 0%, #22d3ee 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{firstName}</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
          {liveCount > 0
            ? <span style={{ color: '#fb923c' }}>You have {liveCount} live session{liveCount > 1 ? 's' : ''} right now</span>
            : data.today_sessions?.length
              ? `You have ${data.today_sessions.length} session${data.today_sessions.length > 1 ? 's' : ''} today`
              : 'No sessions scheduled for today'
          }
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, delay = 0, pulse }) {
  const c = {
    teal:   { bg: 'rgba(45,212,191,0.08)', border: 'rgba(45,212,191,0.12)', glow: 'rgba(45,212,191,0.15)', gradient: 'linear-gradient(135deg, #2dd4bf, #14b8a6)' },
    cyan:   { bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.12)', glow: 'rgba(34,211,238,0.15)', gradient: 'linear-gradient(135deg, #22d3ee, #06b6d4)' },
    orange: { bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.12)', glow: 'rgba(251,146,60,0.15)', gradient: 'linear-gradient(135deg, #fb923c, #f97316)' },
    sky:    { bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.12)', glow: 'rgba(56,189,248,0.15)', gradient: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' },
  }[color] || { bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.12)', glow: 'rgba(34,211,238,0.15)', gradient: 'linear-gradient(135deg, #22d3ee, #06b6d4)' };

  return (
    <div onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${c.glow}, 0 4px 16px rgba(0,0,0,0.2)`; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)'; }}
      style={{ flex: '1 1 180px', background: 'linear-gradient(135deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)', borderRadius: 18, padding: '24px 26px', border: `1px solid ${c.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', overflow: 'hidden', animation: `fadeInUp 0.5s ease-out ${delay}s both` }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c.gradient, opacity: 0.6, borderRadius: '18px 18px 0 0' }} />
      {pulse && <style>{`@keyframes pulseGlow { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }`}</style>}
      {pulse && <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: '#fb923c', boxShadow: '0 0 8px rgba(251,146,60,0.5)', animation: 'pulseGlow 2s ease-in-out infinite' }} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{title}</div>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      </div>
      <div style={{ color: '#f1f5f9', fontSize: 34, fontWeight: 700, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const sc = STATUS_COLORS[status] || STATUS_COLORS.Scheduled;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 8,
      background: sc.bg, border: `1px solid ${sc.border}`,
      color: sc.text, fontSize: 11, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>
      {status === 'Live' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fb923c', animation: 'pulseGlow 2s ease-in-out infinite' }} />}
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
    Scheduled: { label: 'Start', bg: 'rgba(45,212,191,0.1)', border: 'rgba(45,212,191,0.2)', color: '#2dd4bf' },
    Live:      { label: 'Continue', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.2)', color: '#fb923c' },
    Completed: { label: 'View', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)', color: '#4ade80' },
  }[status] || null;

  return (
    <div onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(45,212,191,0.15)'; e.currentTarget.style.transform = 'translateX(4px)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.06)'; e.currentTarget.style.transform = 'translateX(0)'; }}
      style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px 20px', background: 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)', borderRadius: 14, border: '1px solid rgba(34,211,238,0.06)', transition: 'all 0.25s ease', animation: `fadeInUp 0.4s ease-out ${0.1 + index * 0.06}s both`, flexWrap: 'wrap' }}>
      <div style={{ width: 56, height: 60, borderRadius: 12, background: 'linear-gradient(135deg, rgba(45,212,191,0.1) 0%, rgba(45,212,191,0.05) 100%)', border: '1px solid rgba(45,212,191,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ color: '#2dd4bf', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{dayName}</div>
        <div style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif", lineHeight: 1.1 }}>{dayNum}</div>
        <div style={{ color: '#64748b', fontSize: 9, fontWeight: 500, textTransform: 'uppercase' }}>{month}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session.title || session.group?.name || 'Training Session'}
          </div>
          <StatusBadge status={status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {session.group?.name && session.title && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 13 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
              {session.group.name}
            </div>
          )}
          {session.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 13 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
              {session.location}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ padding: '7px 14px', borderRadius: 10, background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.12)', color: '#2dd4bf', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>
          {session.start_time?.slice(0,5)} - {session.end_time?.slice(0,5)}
        </div>
        {actionBtn && (
          <button onClick={handleAction}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            style={{
              padding: '7px 16px', borderRadius: 10,
              background: actionBtn.bg, border: `1px solid ${actionBtn.border}`,
              color: actionBtn.color, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s ease', whiteSpace: 'nowrap',
            }}>
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
    <div style={{
      background: 'linear-gradient(135deg, rgba(251,146,60,0.08) 0%, rgba(249,115,22,0.04) 100%)',
      borderRadius: 18, padding: '20px 24px', marginBottom: 20,
      border: '1px solid rgba(251,146,60,0.15)',
      animation: 'fadeInUp 0.4s ease-out 0.05s both',
    }}>
      <style>{`@keyframes pulseGlow { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fb923c', boxShadow: '0 0 12px rgba(251,146,60,0.5)', animation: 'pulseGlow 2s ease-in-out infinite' }} />
        <h3 style={{ margin: 0, color: '#fb923c', fontSize: 15, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
          Live Now
        </h3>
        <div style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 8, background: 'rgba(251,146,60,0.1)', color: '#fb923c', fontSize: 12, fontWeight: 600 }}>
          {sessions.length} active
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sessions.map((s, i) => (
          <div key={s.id}
            onClick={() => navigate(`/coach/sessions/${s.id}/live`)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(251,146,60,0.25)'; e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.cursor = 'pointer'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(251,146,60,0.1)'; e.currentTarget.style.transform = 'translateX(0)'; }}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
              background: 'rgba(13,31,60,0.5)', borderRadius: 12,
              border: '1px solid rgba(251,146,60,0.1)',
              transition: 'all 0.25s ease',
            }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                {s.title || s.group?.name || 'Live Session'}
              </div>
              {s.group?.name && s.title && (
                <div style={{ color: '#94a3b8', fontSize: 12 }}>{s.group.name}</div>
              )}
            </div>
            <button
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251,146,60,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(251,146,60,0.1)'; }}
              style={{
                padding: '6px 14px', borderRadius: 8,
                background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)',
                color: '#fb923c', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#fb923c" stroke="none"><polygon points="5,3 19,12 5,21" /></svg>
              Continue
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CoachDashboard() {
  const [data, setData] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { api.get('/coach/dashboard').then(r => setData(r.data)).catch(() => {}); }, []);

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#64748b' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}><circle cx="12" cy="12" r="10" fill="none" stroke="rgba(45,212,191,0.2)" strokeWidth="3" /><path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round" /></svg>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Loading dashboard...</div>
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
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard title="My Groups" value={stats.total_groups || data.groups?.length || 0} color="teal" delay={0.05}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        <StatCard title="Today's Sessions" value={stats.today_count || data.today_sessions?.length || 0} color="cyan" delay={0.1}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
        <StatCard title="Live Now" value={liveCount} color="orange" delay={0.15} pulse={liveCount > 0}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polygon points="10,8 16,12 10,16" fill="#fb923c" stroke="none" /></svg>} />
        <StatCard title="Upcoming" value={stats.upcoming_count || data.upcoming_sessions?.length || 0} color="sky" delay={0.2}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>

      {/* Upcoming Sessions */}
      <div style={{ background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)', borderRadius: 18, padding: '24px 26px', border: '1px solid rgba(34,211,238,0.06)', animation: 'fadeInUp 0.5s ease-out 0.25s both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: 18, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Upcoming Sessions</h2>
          <div style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 8, background: 'rgba(45,212,191,0.06)', color: '#64748b', fontSize: 12, fontWeight: 500 }}>{data.upcoming_sessions?.length || 0} scheduled</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.upcoming_sessions?.length > 0 ? data.upcoming_sessions.map((s, i) => <SessionCard key={s.id} session={s} index={i} navigate={navigate} />) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 10 }}><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <div style={{ fontSize: 14, fontWeight: 500 }}>No upcoming sessions</div>
            </div>
          )}
        </div>

        {/* View All Sessions Link */}
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button
            onClick={() => navigate('/coach/sessions')}
            onMouseEnter={e => { e.currentTarget.style.color = '#2dd4bf'; e.currentTarget.style.gap = '10px'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.gap = '6px'; }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748b', fontSize: 13, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              display: 'inline-flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s ease', padding: '8px 16px',
            }}>
            View All Sessions
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
