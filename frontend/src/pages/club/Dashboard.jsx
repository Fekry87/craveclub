import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useIsMobile } from '../../components/CrudTable';
import { StatCard } from '../../components/ui/Cards';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { labelStyle } from '../../components/ui/styles';
import { dateLocale } from '../../lib/dates';

const DISPLAY = {
  fontFamily: 'var(--font-display)', fontWeight: 700,
  letterSpacing: '-0.02em', lineHeight: 1.1,
};

/* ─────── Session Row ─────── */
function SessionRow({ session, index, t }) {
  const date = session.date?.split('T')[0];
  const dayName = date ? new Date(date + 'T00:00:00').toLocaleDateString(dateLocale(), { weekday: 'short' }) : '';
  const dayNum  = date ? new Date(date + 'T00:00:00').getDate() : '';
  const month   = date ? new Date(date + 'T00:00:00').toLocaleDateString(dateLocale(), { month: 'short' }) : '';

  return (
    <div
      className="session-card"
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '11px 14px',
        background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        borderRadius: 12,
        animation: `fadeInUp 0.3s ease-out ${0.05 + index * 0.04}s both`,
      }}
    >
      {/* Date badge */}
      <div style={{
        width: 48, height: 52, borderRadius: 10,
        background: '#F2F2F7',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <div style={{ ...labelStyle, fontSize: 11, color: '#0071E3' }}>{dayName}</div>
        <div style={{ ...DISPLAY, color: '#1D1D1F', fontSize: 18, margin: '1px 0' }}>{dayNum}</div>
        <div style={{ ...labelStyle, fontSize: 11, color: '#86868B' }}>{month}</div>
      </div>

      {/* Session info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: '#1D1D1F', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{session.group?.name || t('sessions.trainingSession')}</div>
        {session.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6E6E73', fontSize: 12, marginTop: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            {session.location}
          </div>
        )}
      </div>

      {/* Time */}
      <div style={{
        color: '#515154', fontSize: 13, fontWeight: 500,
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
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
      style={{
        background: '#FFFFFF',
        padding: '22px 24px',
        border: '1px solid #E5E5EA',
        borderRadius: 16,
        animation: `fadeInUp 0.3s ease-out ${delay}s both`,
        position: 'relative',
        transition: 'box-shadow 0.2s ease',
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
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #F2F2F7',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 26, height: 26, borderRadius: 8,
          background: 'rgba(0,113,227,0.1)', color: '#0071E3', flexShrink: 0,
        }}>{icon}</span>
        <h3 style={{
          margin: 0, fontFamily: 'var(--font-display)', fontWeight: 600,
          color: '#1D1D1F', fontSize: 16, letterSpacing: '-0.01em',
        }}>{title}</h3>
      </div>
      {badge !== undefined && (
        <span style={{ ...labelStyle, flexShrink: 0, whiteSpace: 'nowrap' }}>{badge}</span>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#6E6E73' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5EA" strokeWidth="2" />
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#0071E3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ ...labelStyle }}>{t('dashboard.loadingDashboard')}</div>
        </div>
      </div>
    );
  }

  /* ── Attendance ring maths ── */
  const attendanceRate = data.attendance_rate_7d || 0;
  const rateColor = attendanceRate >= 80 ? '#34C759' : attendanceRate >= 60 ? '#FF9500' : '#FF3B30';
  const ringStrokeColor = rateColor;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (attendanceRate / 100) * circumference;

  /* ── Greeting ── */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('dashboard.goodMorning') : hour < 17 ? t('dashboard.goodAfternoon') : t('dashboard.goodEvening');
  const firstName = user?.name?.split(' ')[0] || 'Manager';

  return (
    <div>
      {/* ── Welcome hero ── */}
      <div className="welcome-hero" style={{
        marginBottom: 22, padding: '24px 28px',
        background: '#FFFFFF', color: '#1D1D1F',
        border: '1px solid #E5E5EA',
        borderRadius: 16,
        display: 'flex', alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: 'space-between', gap: 18,
        flexDirection: isMobile ? 'column' : 'row',
        animation: 'fadeIn 0.25s ease-out',
      }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{
            margin: 0, ...DISPLAY, fontSize: isMobile ? 26 : 32,
            color: '#1D1D1F', lineHeight: 1.15,
          }}>
            {greeting}, <span style={{ color: '#0071E3' }}>{firstName}</span>
          </h1>
          <div style={{ color: '#6E6E73', fontSize: 15, marginTop: 6 }}>
            {t('dashboard.subtitle')}
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/club/analytics')}
          className="pl-btn pl-btn-primary"
          style={{ flexShrink: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {t('actions.viewFullAnalytics')}
        </button>
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
          index={0}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20C6.5 17 9 22 12 18C15 14 17 22 20 18"/><circle cx="12" cy="8" r="3" />
            </svg>
          }
        />
        <StatCard
          label={t('dashboard.coaches')}
          value={data.coaches_count}
          index={1}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <StatCard
          label={t('dashboard.groups')}
          value={data.groups_count}
          index={2}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label={t('dashboard.sessions')}
          value={data.sessions_count || 0}
          index={3}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* ── Main Grid: 3 columns ── */}
      <div className="dashboard-bottom-grid" style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
        gap: 18,
      }}>

        {/* ── Col 1: Attendance ── */}
        <DashCard delay={0.05}>
          <SectionHeader
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title={t('dashboard.attendance')}
            badge={t('dashboard.days7')}
          />

          {/* Attendance ring */}
          <div className="attendance-ring" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 12px' }}>
            <div style={{ position: 'relative', width: 104, height: 104, marginBottom: 16 }}>
              <svg width="104" height="104" viewBox="0 0 104 104" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="52" cy="52" r={radius} fill="none" stroke="#E5E5EA" strokeWidth="6" />
                <circle
                  cx="52" cy="52" r={radius}
                  fill="none" stroke={ringStrokeColor} strokeWidth="6"
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
                  ...DISPLAY, fontSize: 30, color: '#1D1D1F',
                }}>{attendanceRate}%</div>
                <div style={{ ...labelStyle, marginTop: 5 }}>{t('dashboard.rate')}</div>
              </div>
            </div>

            {/* Status badge */}
            <Badge variant={attendanceRate >= 80 ? 'success' : attendanceRate >= 60 ? 'warning' : 'danger'}>
              {attendanceRate >= 80 ? t('status.excellent') : attendanceRate >= 60 ? t('status.good') : t('status.needsWork')}
            </Badge>
          </div>

          {/* Quick counts strip */}
          <div className="quick-stats-bar" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            marginTop: 14,
            borderRadius: 12,
            background: '#F2F2F7',
          }}>
            {[
              { val: data.groups_count,   lbl: t('dashboard.groups') },
              { val: data.swimmers_count, lbl: t('dashboard.swimmers') },
              { val: data.coaches_count,  lbl: t('dashboard.coaches') },
            ].map((item, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '14px 8px', minWidth: 0,
                borderInlineStart: i > 0 ? '1px solid #E5E5EA' : 'none',
              }}>
                <div style={{ ...DISPLAY, color: '#1D1D1F', fontSize: 22 }}>{item.val}</div>
                <div style={{ ...labelStyle, marginTop: 6 }}>{item.lbl}</div>
              </div>
            ))}
          </div>
        </DashCard>

        {/* ── Col 2: Upcoming Sessions ── */}
        <DashCard delay={0.1}>
          <SectionHeader
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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
        <DashCard delay={0.15}>
          <SectionHeader
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            }
            title={t('dashboard.topSwimmers')}
            badge={t('dashboard.xpLeaderboard')}
          />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data.top_swimmers?.length > 0 ? (
              data.top_swimmers.map((swimmer, i) => {
                const isLead = i === 0;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 0',
                    borderTop: i > 0 ? '1px solid #F2F2F7' : 'none',
                    animation: `fadeInUp 0.3s ease-out ${0.1 + i * 0.04}s both`,
                  }}>
                    {/* Rank */}
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isLead ? 'rgba(0,113,227,0.1)' : '#F2F2F7',
                      color: isLead ? '#0071E3' : '#6E6E73',
                      fontSize: 12, fontWeight: 600,
                    }}>{i + 1}</div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: '#1D1D1F', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{swimmer.name}</div>
                      {swimmer.level_name && (
                        <div style={{ ...labelStyle, marginTop: 3 }}>{swimmer.level_name}</div>
                      )}
                    </div>

                    {/* XP */}
                    <div style={{ textAlign: 'end', flexShrink: 0 }}>
                      <div style={{
                        ...DISPLAY, color: isLead ? '#0071E3' : '#1D1D1F', fontSize: 20,
                      }}>{swimmer.total_xp}</div>
                      <div style={{ ...labelStyle, marginTop: 3 }}>XP</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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
