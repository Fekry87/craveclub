import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useIsMobile } from '../../components/CrudTable';
import { StatCard } from '../../components/ui/Cards';
import { EmptyState } from '../../components/ui/EmptyState';
import { dateLocale } from '../../lib/dates';

/* ─────── Session Row ─────── */
function SessionRow({ session, index, t }) {
  const date = session.date?.split('T')[0];
  const dayName = date ? new Date(date + 'T00:00:00').toLocaleDateString(dateLocale(), { weekday: 'short' }) : '';
  const dayNum  = date ? new Date(date + 'T00:00:00').getDate() : '';
  const month   = date ? new Date(date + 'T00:00:00').toLocaleDateString(dateLocale(), { month: 'short' }) : '';

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '11px 14px',
        background: 'rgba(13,31,60,0.4)',
        borderRadius: 12,
        border: '1px solid rgba(34,211,238,0.06)',
        transition: 'all 0.2s ease',
        animation: `fadeInUp 0.4s ease-out ${0.1 + index * 0.05}s both`,
      }}
    >
      {/* Date badge */}
      <div style={{
        width: 48, height: 52, borderRadius: 10,
        background: 'rgba(34,211,238,0.06)',
        border: '1px solid rgba(34,211,238,0.08)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <div style={{ color: '#22d3ee', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{dayName}</div>
        <div style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.1 }}>{dayNum}</div>
        <div style={{ color: '#64748b', fontSize: 8, fontWeight: 600, textTransform: 'uppercase' }}>{month}</div>
      </div>

      {/* Session info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: '#f1f5f9', fontSize: 14, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{session.group?.name || t('sessions.trainingSession')}</div>
        {session.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: 12, marginTop: 2 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            {session.location}
          </div>
        )}
      </div>

      {/* Time badge */}
      <div style={{
        padding: '4px 10px', borderRadius: 8,
        background: 'rgba(34,211,238,0.06)',
        border: '1px solid rgba(34,211,238,0.1)',
        color: '#22d3ee', fontSize: 12, fontWeight: 600,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {session.start_time?.slice(0, 5)} – {session.end_time?.slice(0, 5)}
      </div>
    </div>
  );
}

/* ─────── Card Shell ─────── */
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

/* ─────── Section Header ─────── */
function SectionHeader({ icon, title, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'rgba(34,211,238,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#94a3b8',
        }}>{icon}</div>
        <h3 style={{
          margin: 0, color: '#f1f5f9', fontSize: 14, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.01em',
        }}>{title}</h3>
      </div>
      {badge !== undefined && (
        <span style={{
          padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 500,
          background: 'rgba(148,163,184,0.08)', color: '#94a3b8',
        }}>{badge}</span>
      )}
    </div>
  );
}

/* ─────── Main Dashboard ─────── */
export default function ClubDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/club/dashboard')
      .then(r => setData(r.data))
      .catch(err => console.error('[Dashboard] Load failed:', err.message));
  }, []);

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#94a3b8' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 10 }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{t('dashboard.loadingDashboard')}</div>
        </div>
      </div>
    );
  }

  /* ── Attendance ring maths ── */
  const attendanceRate = data.attendance_rate_7d || 0;
  const rateColor = attendanceRate >= 80 ? '#34d399' : attendanceRate >= 60 ? '#fbbf24' : '#f87171';
  const ringStrokeColor = attendanceRate >= 80 ? '#10B981' : attendanceRate >= 60 ? '#F59E0B' : '#EF4444';
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (attendanceRate / 100) * circumference;

  /* ── Greeting ── */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('dashboard.goodMorning') : hour < 17 ? t('dashboard.goodAfternoon') : t('dashboard.goodEvening');
  const firstName = user?.name?.split(' ')[0] || 'Manager';

  return (
    <div>
      {/* ── Page Header ── */}
      <div style={{
        marginBottom: 24, padding: '20px 24px', borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(6,13,31,0.3) 100%)',
        border: '1px solid rgba(34,211,238,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 120, height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div>
            <h1 style={{
              margin: '0 0 4px',
              fontFamily: "'DM Sans', sans-serif", fontSize: 24, fontWeight: 700,
              color: '#f1f5f9', letterSpacing: '-0.02em',
            }}>
              {greeting}, <span style={{ color: '#22d3ee' }}>{firstName}</span>
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>
              {t('dashboard.subtitle')}
            </p>
          </div>
          <button
            onClick={() => navigate('/club/analytics')}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.06)'; }}
            style={{
              background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)',
              color: '#22d3ee', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10,
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s ease', whiteSpace: 'nowrap',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {t('actions.viewFullAnalytics')}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Stat Cards Row ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: 14, marginBottom: 22,
      }}>
        <StatCard
          label={t('dashboard.swimmers')}
          value={data.swimmers_count}
          accentColor="#10B981"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 20C6.5 17 9 22 12 18C15 14 17 22 20 18"/><circle cx="12" cy="8" r="3" />
            </svg>
          }
        />
        <StatCard
          label={t('dashboard.coaches')}
          value={data.coaches_count}
          accentColor="#3B82F6"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <StatCard
          label={t('dashboard.groups')}
          value={data.groups_count}
          accentColor="#14B8A6"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label={t('dashboard.sessions')}
          value={data.sessions_count || 0}
          accentColor="#F59E0B"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
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
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title={t('dashboard.attendance')}
            badge={t('dashboard.days7')}
          />

          {/* Attendance ring */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 12px' }}>
            <div style={{ position: 'relative', width: 104, height: 104, marginBottom: 16 }}>
              <svg width="104" height="104" viewBox="0 0 104 104" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="52" cy="52" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                <circle
                  cx="52" cy="52" r={radius}
                  fill="none" stroke={ringStrokeColor} strokeWidth="7"
                  strokeDasharray={circumference} strokeDashoffset={offset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  fontSize: 26, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                  color: '#f1f5f9', lineHeight: 1,
                }}>{attendanceRate}%</div>
                <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{t('dashboard.rate')}</div>
              </div>
            </div>

            {/* Status badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 8,
              background: attendanceRate >= 80
                ? 'rgba(52,211,153,0.12)'
                : attendanceRate >= 60
                  ? 'rgba(251,191,36,0.12)'
                  : 'rgba(244,63,94,0.12)',
              color: rateColor,
              fontSize: 12, fontWeight: 600,
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                {attendanceRate >= 60 ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />}
              </svg>
              {attendanceRate >= 80 ? t('status.excellent') : attendanceRate >= 60 ? t('status.good') : t('status.needsWork')}
            </div>
          </div>

          {/* Quick counts strip */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 1, marginTop: 14,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 12, overflow: 'hidden',
            border: '1px solid rgba(34,211,238,0.06)',
          }}>
            {[
              { val: data.groups_count,   lbl: t('dashboard.groups'),   color: '#14B8A6' },
              { val: data.swimmers_count, lbl: t('dashboard.swimmers'),  color: '#10B981' },
              { val: data.coaches_count,  lbl: t('dashboard.coaches'),   color: '#3B82F6' },
            ].map((item, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '12px 8px',
                background: 'rgba(10,22,40,0.6)',
              }}>
                <div style={{
                  color: item.color, fontSize: 18, fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                }}>{item.val}</div>
                <div style={{
                  color: '#64748b', fontSize: 9, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2,
                }}>{item.lbl}</div>
              </div>
            ))}
          </div>
        </DashCard>

        {/* ── Col 2: Upcoming Sessions ── */}
        <DashCard delay={0.3}>
          <SectionHeader
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title={t('dashboard.upcomingSessions')}
            badge={t('dashboard.scheduled', { count: data.upcoming_sessions?.length || 0 })}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.upcoming_sessions?.length > 0 ? (
              data.upcoming_sessions.map((s, i) => (
                <SessionRow key={s.id} session={s} index={i} t={t} />
              ))
            ) : (
              <EmptyState
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                title={t('dashboard.noUpcomingSessions')}
                description={t('dashboard.scheduleSessionsHint')}
              />
            )}
          </div>
        </DashCard>

        {/* ── Col 3: Top Swimmers (Leaderboard) ── */}
        <DashCard delay={0.35}>
          <SectionHeader
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            }
            title={t('dashboard.topSwimmers')}
            badge={t('dashboard.xpLeaderboard')}
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
                    background: isMedal
                      ? `${medalColors[i]}10`
                      : 'rgba(13,31,60,0.4)',
                    borderRadius: 12,
                    border: `1px solid ${isMedal ? `${medalColors[i]}28` : 'rgba(34,211,238,0.06)'}`,
                    animation: `fadeInUp 0.3s ease-out ${0.15 + i * 0.05}s both`,
                  }}>
                    {/* Rank badge */}
                    <div style={{
                      width: 26, height: 26, borderRadius: 8,
                      background: isMedal ? `${medalColors[i]}18` : 'rgba(10,22,40,0.6)',
                      border: `1px solid ${isMedal ? `${medalColors[i]}30` : 'rgba(34,211,238,0.06)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isMedal ? medalColors[i] : '#94a3b8',
                      fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                      flexShrink: 0,
                    }}>{i + 1}</div>

                    {/* Level icon */}
                    <div style={{ fontSize: 18, flexShrink: 0, lineHeight: 1 }}>{swimmer.level_icon || '⭐'}</div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: '#f1f5f9', fontSize: 14, fontWeight: 600,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{swimmer.name}</div>
                      <div style={{ color: swimmer.level_color, fontSize: 10, fontWeight: 600 }}>{swimmer.level_name}</div>
                    </div>

                    {/* XP */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        color: '#f1f5f9', fontSize: 14, fontWeight: 700,
                        fontFamily: "'DM Sans', sans-serif", lineHeight: 1,
                      }}>{swimmer.total_xp}</div>
                      <div style={{ color: '#64748b', fontSize: 9, fontWeight: 600 }}>XP</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                }
                title={t('dashboard.noXpData')}
                description={t('dashboard.xpFromEvals')}
              />
            )}
          </div>
        </DashCard>
      </div>
    </div>
  );
}
