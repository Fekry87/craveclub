import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useIsMobile } from '../../components/CrudTable';

/* ─────── Welcome Hero ─────── */
function WelcomeHero({ user }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = user?.name?.split(' ')[0] || 'Manager';

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(13,31,60,0.85) 0%, rgba(6,182,212,0.06) 50%, rgba(13,31,60,0.65) 100%)',
      borderRadius: 22, padding: '32px 36px 28px',
      border: '1px solid rgba(34,211,238,0.1)',
      position: 'relative', overflow: 'hidden',
      marginBottom: 24,
      animation: 'fadeInUp 0.5s ease-out',
    }}>
      <div style={{
        position: 'absolute', top: -40, right: -20, width: 200, height: 200,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent 10%, rgba(34,211,238,0.2) 50%, transparent 90%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          color: '#22d3ee', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
            <path d="M4 20C6.5 17 9 22 12 18C15 14 17 22 20 18C23 14 25.5 20 28 17" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          Club Dashboard
        </div>
        <h1 style={{
          fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 700,
          color: '#f1f5f9', margin: '0 0 6px', letterSpacing: '-0.02em',
        }}>
          {greeting}, <span style={{
            background: 'linear-gradient(135deg, #22d3ee 0%, #2dd4bf 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>{firstName}</span>
        </h1>
        <p style={{ color: '#526280', fontSize: 13, margin: 0 }}>
          Here's what's happening in your swim club today
        </p>
      </div>
    </div>
  );
}

/* ─────── Stat Card (compact) ─────── */
function StatCard({ label, value, icon, color, delay = 0 }) {
  return (
    <div
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${color}30`;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 6px 24px ${color}12`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = `${color}15`;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      style={{
        background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
        borderRadius: 18, padding: '20px 22px',
        border: `1px solid ${color}15`,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative', overflow: 'hidden',
        animation: `fadeInUp 0.4s ease-out ${delay}s both`,
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}50, ${color}10)`,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          background: `${color}10`, border: `1px solid ${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</div>
      </div>
      <div style={{
        color: '#f1f5f9', fontSize: 30, fontWeight: 700,
        fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em', lineHeight: 1,
      }}>{value}</div>
    </div>
  );
}

/* ─────── Session Row ─────── */
function SessionRow({ session, index }) {
  const date = session.date?.split('T')[0];
  const dayName = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }) : '';
  const dayNum = date ? new Date(date + 'T00:00:00').getDate() : '';
  const month = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }) : '';

  return (
    <div
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.15)';
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(13,31,60,0.7) 0%, rgba(34,211,238,0.03) 100%)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.06)';
        e.currentTarget.style.background = 'rgba(6,13,31,0.3)';
      }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 16px',
        background: 'rgba(6,13,31,0.3)',
        borderRadius: 14,
        border: '1px solid rgba(34,211,238,0.06)',
        transition: 'all 0.2s ease',
        animation: `fadeInUp 0.4s ease-out ${0.1 + index * 0.05}s both`,
      }}
    >
      <div style={{
        width: 48, height: 52, borderRadius: 12,
        background: 'linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(6,182,212,0.04) 100%)',
        border: '1px solid rgba(34,211,238,0.1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <div style={{ color: '#22d3ee', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{dayName}</div>
        <div style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", lineHeight: 1.1 }}>{dayNum}</div>
        <div style={{ color: '#475569', fontSize: 8, fontWeight: 600, textTransform: 'uppercase' }}>{month}</div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: '#e2e8f0', fontSize: 14, fontWeight: 600,
          fontFamily: "'Outfit', sans-serif",
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{session.group?.name || 'Training Session'}</div>
        {session.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#526280', fontSize: 12, marginTop: 2 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            {session.location}
          </div>
        )}
      </div>

      <div style={{
        padding: '5px 12px', borderRadius: 8,
        background: 'rgba(34,211,238,0.06)',
        border: '1px solid rgba(34,211,238,0.1)',
        color: '#22d3ee', fontSize: 12, fontWeight: 600,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {session.start_time?.slice(0,5)} – {session.end_time?.slice(0,5)}
      </div>
    </div>
  );
}

/* ─────── Section Header ─────── */
function SectionHeader({ icon, title, badge, color = '#22d3ee' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: `${color}0c`, border: `1px solid ${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</div>
        <h3 style={{
          margin: 0, color: '#e2e8f0', fontSize: 15, fontWeight: 600,
          fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em',
        }}>{title}</h3>
      </div>
      {badge !== undefined && (
        <div style={{
          padding: '3px 10px', borderRadius: 7,
          background: `${color}08`, border: `1px solid ${color}12`,
          color: '#526280', fontSize: 11, fontWeight: 600,
        }}>{badge}</div>
      )}
    </div>
  );
}

/* ─────── Card Shell ─────── */
function DashCard({ children, delay = 0, style: extraStyle }) {
  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(13,31,60,0.55) 0%, rgba(10,22,40,0.35) 100%)',
      borderRadius: 20, padding: '22px 24px',
      border: '1px solid rgba(34,211,238,0.06)',
      animation: `fadeInUp 0.4s ease-out ${delay}s both`,
      position: 'relative', overflow: 'hidden',
      ...extraStyle,
    }}>
      {children}
    </div>
  );
}

/* ─────── Main Dashboard ─────── */
export default function ClubDashboard() {
  const [data, setData] = useState(null);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    api.get('/club/dashboard')
      .then(r => setData(r.data))
      .catch(err => console.error('[Dashboard] Load failed:', err.message));
  }, []);

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#64748b' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 10 }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(34,211,238,0.2)" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const attendanceRate = data.attendance_rate_7d || 0;
  const rateColor = attendanceRate >= 80 ? '#2dd4bf' : attendanceRate >= 60 ? '#fbbf24' : '#f43f5e';
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (attendanceRate / 100) * circumference;

  return (
    <div>
      <WelcomeHero user={user} />

      {/* ── Stat Cards Row ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: 14, marginBottom: 22,
      }}>
        <StatCard label="Swimmers" value={data.swimmers_count} color="#22d3ee" delay={0.05}
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M4 20C6.5 17 9 22 12 18C15 14 17 22 20 18"/><circle cx="12" cy="8" r="3" /></svg>} />
        <StatCard label="Coaches" value={data.coaches_count} color="#2dd4bf" delay={0.1}
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
        <StatCard label="Groups" value={data.groups_count} color="#38bdf8" delay={0.15}
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        <StatCard label="Sessions" value={data.sessions_count || 0} color="#a78bfa" delay={0.2}
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
      </div>

      {/* ── Main Grid: 3 columns ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
        gap: 18,
      }}>

        {/* ── Col 1: Attendance ── */}
        <DashCard delay={0.25}>
          <SectionHeader
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={rateColor} strokeWidth="2" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            title="Attendance"
            badge="7 days"
            color={rateColor}
          />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 12px' }}>
            {/* Ring */}
            <div style={{ position: 'relative', width: 104, height: 104, marginBottom: 16 }}>
              <svg width="104" height="104" viewBox="0 0 104 104" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="52" cy="52" r={radius} fill="none" stroke="rgba(51,65,85,0.25)" strokeWidth="7" />
                <circle cx="52" cy="52" r={radius} fill="none" stroke={rateColor} strokeWidth="7"
                  strokeDasharray={circumference} strokeDashoffset={offset}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#f1f5f9', lineHeight: 1 }}>{attendanceRate}%</div>
                <div style={{ fontSize: 9, color: '#526280', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>Rate</div>
              </div>
            </div>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 8,
              background: `${rateColor}0c`, border: `1px solid ${rateColor}18`,
              color: rateColor, fontSize: 12, fontWeight: 600,
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                {attendanceRate >= 60 ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />}
              </svg>
              {attendanceRate >= 80 ? 'Excellent' : attendanceRate >= 60 ? 'Good' : 'Needs Work'}
            </div>
          </div>

          {/* Quick counts */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 1, marginTop: 14,
            background: 'rgba(34,211,238,0.04)',
            borderRadius: 12, overflow: 'hidden',
            border: '1px solid rgba(34,211,238,0.06)',
          }}>
            {[
              { val: data.groups_count, lbl: 'Groups', color: '#2dd4bf' },
              { val: data.swimmers_count, lbl: 'Swimmers', color: '#22d3ee' },
              { val: data.coaches_count, lbl: 'Coaches', color: '#38bdf8' },
            ].map((item, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '12px 8px',
                background: 'linear-gradient(135deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
              }}>
                <div style={{ color: item.color, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{item.val}</div>
                <div style={{ color: '#475569', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{item.lbl}</div>
              </div>
            ))}
          </div>
        </DashCard>

        {/* ── Col 2: Upcoming Sessions ── */}
        <DashCard delay={0.3}>
          <SectionHeader
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            title="Upcoming Sessions"
            badge={`${data.upcoming_sessions?.length || 0} scheduled`}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.upcoming_sessions?.length > 0 ? (
              data.upcoming_sessions.map((s, i) => (
                <SessionRow key={s.id} session={s} index={i} />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#475569' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 8 }}>
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div style={{ fontSize: 13, fontWeight: 500 }}>No upcoming sessions</div>
                <div style={{ fontSize: 11, color: '#334155', marginTop: 3 }}>Schedule sessions to see them here</div>
              </div>
            )}
          </div>
        </DashCard>

        {/* ── Col 3: Top Swimmers (Leaderboard) ── */}
        <DashCard delay={0.35}>
          <SectionHeader
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
            title="Top Swimmers"
            badge="XP Leaderboard"
            color="#f59e0b"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.top_swimmers?.length > 0 ? (
              data.top_swimmers.map((swimmer, i) => {
                const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
                const isMedal = i < 3;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px',
                    background: isMedal ? `linear-gradient(135deg, ${medalColors[i]}06 0%, transparent 100%)` : 'rgba(6,13,31,0.3)',
                    borderRadius: 12,
                    border: `1px solid ${isMedal ? `${medalColors[i]}18` : 'rgba(51,65,85,0.15)'}`,
                    animation: `fadeInUp 0.3s ease-out ${0.15 + i * 0.05}s both`,
                  }}>
                    {/* Rank */}
                    <div style={{
                      width: 26, height: 26, borderRadius: 8,
                      background: isMedal ? `${medalColors[i]}14` : 'rgba(51,65,85,0.2)',
                      border: `1px solid ${isMedal ? `${medalColors[i]}25` : 'rgba(51,65,85,0.25)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isMedal ? medalColors[i] : '#526280',
                      fontSize: 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                      flexShrink: 0,
                    }}>{i + 1}</div>

                    {/* Level icon */}
                    <div style={{ fontSize: 18, flexShrink: 0, lineHeight: 1 }}>{swimmer.level_icon || '⭐'}</div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: '#e2e8f0', fontSize: 13, fontWeight: 600,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{swimmer.name}</div>
                      <div style={{ color: swimmer.level_color, fontSize: 10, fontWeight: 600 }}>{swimmer.level_name}</div>
                    </div>

                    {/* XP */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        color: '#f1f5f9', fontSize: 14, fontWeight: 700,
                        fontFamily: "'Outfit', sans-serif", lineHeight: 1,
                      }}>{swimmer.total_xp}</div>
                      <div style={{ color: '#475569', fontSize: 9, fontWeight: 600 }}>XP</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#475569' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 8 }}>
                  <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <div style={{ fontSize: 13, fontWeight: 500 }}>No XP data yet</div>
                <div style={{ fontSize: 11, color: '#334155', marginTop: 3 }}>Swimmers earn XP from evaluations</div>
              </div>
            )}
          </div>
        </DashCard>
      </div>
    </div>
  );
}
