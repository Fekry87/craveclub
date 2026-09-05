import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useIsMobile } from '../../components/CrudTable';
import { useTranslation } from 'react-i18next';

/* ───── Shared idiom tokens ───── */
const monoLabel = {
  fontFamily: 'var(--font-body)', fontSize: 12, color: '#6E6E73',
};
const displayHeading = {
  fontFamily: 'var(--font-display)', fontWeight: 600,
  letterSpacing: '-0.02em', lineHeight: 1,
};

/* ───── Welcome Hero ───── */
function WelcomeHero({ user, data }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = user?.name?.split(' ')[0] || 'Swimmer';

  return (
    <div style={{ borderRadius: 16,
      background: '#FFFFFF',
      padding: '36px 40px',
      border: '1px solid #E5E5EA',
      marginBottom: 28,
      animation: 'fadeInUp 0.4s ease-out',
    }}>
      <div style={{
        ...monoLabel, color: '#86868B', marginBottom: 14,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: '#0071E3', display: 'inline-block' }} />
        Swimmer Portal
      </div>
      <h1 style={{
        ...displayHeading, fontSize: 34, letterSpacing: '-0.02em',
        color: '#1D1D1F', margin: '0 0 12px',
      }}>
        {greeting}, <span style={{ color: '#0071E3' }}>{firstName}</span>
      </h1>
      <p style={{ color: '#6E6E73', fontSize: 14, margin: 0, fontFamily: 'var(--font-body)' }}>
        {data.upcoming_sessions?.length ? `You have ${data.upcoming_sessions.length} upcoming session${data.upcoming_sessions.length > 1 ? 's' : ''}` : 'No upcoming sessions scheduled'}
      </p>
    </div>
  );
}

/* ───── Stat Card ───── */
function StatCard({ title, value, subtitle, icon, color, delay = 0, isMobile, index }) {
  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        flex: isMobile ? '1 1 calc(50% - 8px)' : '1 1 180px',
        background: '#FFFFFF',
        padding: isMobile ? '20px 18px' : '22px 24px',
        border: '1px solid #E5E5EA',
        transition: 'border-color 0.15s ease',
        minWidth: 0,
        display: 'flex', flexDirection: 'column', gap: 18,
        animation: `fadeInUp 0.35s ease-out ${delay}s both`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ ...monoLabel, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {icon && <span style={{ display: 'inline-flex', color: '#1D1D1F' }}>{icon}</span>}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        </div>
        
      </div>
      <div>
        <div style={{
          color: color === 'accent' ? '#0071E3' : '#1D1D1F',
          fontSize: isMobile ? 30 : 34, fontWeight: 500, lineHeight: 1,
          fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
        }}>{value}</div>
        {subtitle && (
          <div style={{ ...monoLabel, fontSize: 10, color: '#86868B', marginTop: 8 }}>{subtitle}</div>
        )}
      </div>
    </div>
  );
}

/* ───── Session Card ───── */
function SessionCard({ session, index }) {
  const date = session.date?.split('T')[0];
  const dayName = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }) : '';
  const dayNum = date ? new Date(date + 'T00:00:00').getDate() : '';
  const month = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }) : '';

  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        display: 'flex', alignItems: 'center', gap: 18, padding: '16px 20px',
        background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        transition: 'border-color 0.15s ease',
        animation: `fadeInUp 0.3s ease-out ${index * 0.04}s both`,
      }}
    >
      <div style={{ borderRadius: 16,
        width: 56, height: 60, background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <div style={{ ...monoLabel, fontSize: 10 }}>{dayName}</div>
        <div style={{ color: '#1D1D1F', fontSize: 22, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{dayNum}</div>
        <div style={{ ...monoLabel, fontSize: 9, color: '#86868B' }}>{month}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          ...displayHeading, color: '#1D1D1F', fontSize: 16, marginBottom: 6,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {session.group?.name || 'Training Session'}
        </div>
        {session.plan?.title && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#515154', fontSize: 13 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6E6E73" strokeWidth="1.8" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            {session.plan.title}
          </div>
        )}
      </div>
      <div style={{ ...monoLabel, color: '#1D1D1F', fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>
        {session.start_time?.slice(0,5)} — {session.end_time?.slice(0,5)}
      </div>
    </div>
  );
}

/* ───── Radial Rating Ring ───── */
function RatingRing({ value, maxValue = 5, size = 56, color }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / maxValue) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke="#EDEDF0" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={color || '#1D1D1F'} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.02em',
        fontSize: size * 0.32, color: color || '#1D1D1F',
      }}>
        {Number(value).toFixed(1)}
      </div>
    </div>
  );
}

/* ───── Monthly Rating Card ───── */
function MonthlyRatingCard({ month, index, isMobile }) {
  const avgRating = Number(month.avg_rating).toFixed(1);
  const ratingPercent = (avgRating / 5) * 100;
  const barColor = avgRating >= 2.5 ? '#1D1D1F' : avgRating >= 1.5 ? '#FF9500' : '#FF3B30';
  const ratingLabel = avgRating >= 4.5 ? 'Excellent' : avgRating >= 3.5 ? 'Great' : avgRating >= 2.5 ? 'Good' : avgRating >= 1.5 ? 'Fair' : 'Needs Work';

  const labelPill = (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 8px',
      fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
      letterSpacing: '-0.02em', lineHeight: '14px',
      background: 'transparent', border: `1px solid ${barColor}`, color: barColor,
      whiteSpace: 'nowrap',
    }}>{ratingLabel}</span>
  );

  if (isMobile) {
    return (
      <div style={{
        padding: '18px 20px', background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        animation: `fadeInUp 0.3s ease-out ${index * 0.04}s both`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...displayHeading, color: '#1D1D1F', fontSize: 16, marginBottom: 8 }}>{month.month}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {labelPill}
              <span style={{ ...monoLabel, fontSize: 10, color: '#86868B' }}>{month.count} eval{month.count !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <RatingRing value={avgRating} color={barColor} size={50} />
        </div>
        <div style={{ height: 6, background: '#EDEDF0', overflow: 'hidden' }}>
          <div style={{
            width: `${ratingPercent}%`, height: '100%', background: barColor,
            transition: 'width 0.8s ease-out',
          }} />
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        display: 'flex', alignItems: 'center', gap: 20, padding: '18px 22px',
        background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        transition: 'border-color 0.15s ease',
        animation: `fadeInUp 0.3s ease-out ${index * 0.04}s both`,
      }}
    >
      <div style={{ minWidth: 110 }}>
        <div style={{ ...displayHeading, color: '#1D1D1F', fontSize: 16, marginBottom: 6 }}>{month.month}</div>
        <div style={{ ...monoLabel, fontSize: 10, color: '#86868B' }}>{month.count} evaluation{month.count !== 1 ? 's' : ''}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {labelPill}
          <span style={{ ...monoLabel, fontSize: 10, color: '#6E6E73' }}>{avgRating} / 5.0</span>
        </div>
        <div style={{ height: 8, background: '#EDEDF0', overflow: 'hidden' }}>
          <div style={{
            width: `${ratingPercent}%`, height: '100%', background: barColor,
            transition: 'width 0.8s ease-out',
          }} />
        </div>
      </div>
      <RatingRing value={avgRating} color={barColor} size={56} />
    </div>
  );
}

/* ───── Trend Arrow ───── */
function TrendIndicator({ current, previous }) {
  if (!current || !previous) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.1) return null;
  const isUp = diff > 0;
  const c = isUp ? '#34C759' : '#FF3B30';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px',
      fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
      letterSpacing: '-0.02em', lineHeight: '14px',
      background: 'transparent', border: `1px solid ${c}`, color: c,
    }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d={isUp ? 'M5 2L8 6H2L5 2Z' : 'M5 8L2 4h6L5 8Z'} fill="currentColor" />
      </svg>
      {isUp ? '+' : ''}{diff.toFixed(1)}
    </span>
  );
}

/* ───── Rating Dots (for evaluations) ───── */
function RatingDots({ value, size = 22 }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1,2,3,4,5].map(r => (
        <span key={r} style={{
          width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.45, fontWeight: 500,
          background: value >= r ? '#1D1D1F' : '#E5E5EA',
          color: value >= r ? '#F5F5F7' : '#86868B',
          fontFamily: 'var(--font-body)', letterSpacing: '-0.02em',
        }}>{r}</span>
      ))}
    </div>
  );
}

/* ───── Evaluation Card ───── */
function EvaluationCard({ evaluation, index }) {
  const date = evaluation.session?.date?.split('T')[0];
  const formattedDate = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
        background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        transition: 'border-color 0.15s ease',
        animation: `fadeInUp 0.3s ease-out ${index * 0.04}s both`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: evaluation.notes ? 6 : 0 }}>
          <span style={{ ...displayHeading, color: '#1D1D1F', fontSize: 14 }}>{evaluation.session?.group?.name}</span>
          <span style={{ ...monoLabel, fontSize: 10 }}>{formattedDate}</span>
        </div>
        {evaluation.notes && <div style={{ color: '#515154', fontSize: 13, lineHeight: 1.4 }}>{evaluation.notes}</div>}
      </div>
      <RatingDots value={evaluation.rating} size={24} />
    </div>
  );
}

/* ───── Section header ───── */
function SectionHeader({ title, subtitle, meta }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      paddingBottom: 14, marginBottom: 20, borderBottom: '1px solid #E5E5EA',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: '#0071E3', display: 'inline-block', flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <h2 style={{ ...displayHeading, margin: 0, color: '#1D1D1F', fontSize: 17 }}>{title}</h2>
        {subtitle && <div style={{ ...monoLabel, fontSize: 10, color: '#86868B', marginTop: 6 }}>{subtitle}</div>}
      </div>
      {meta && <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>{meta}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Dashboard (merged with Stats)
   ═══════════════════════════════════════════ */
export default function SwimmerDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  useEffect(() => { api.get('/swimmer/dashboard').then(r => setData(r.data)).catch(() => {}); }, []);

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 14 }}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5EA" strokeWidth="2" />
          <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#1D1D1F" strokeWidth="2" />
        </svg>
        <div style={{ ...monoLabel }}>{t('dashboard.loadingDashboard')}</div>
      </div>
    </div>
  );

  const monthlyRatings = data.monthly_ratings || [];
  const latestRating = monthlyRatings.length > 0 ? Number(monthlyRatings[0].avg_rating) : null;
  const previousRating = monthlyRatings.length > 1 ? Number(monthlyRatings[1].avg_rating) : null;

  const statIcon = (path, stroke = '#1D1D1F') => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round">{path}</svg>
  );

  return (
    <div>
      <WelcomeHero user={user} data={data} />

      {/* ── Stat Cards (5 cards from Stats page) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: isMobile ? 12 : 16, marginBottom: 28,
      }}>
        <StatCard title="Total Sessions" value={data.total_sessions} isMobile={isMobile} index={0} delay={0.02}
          icon={statIcon(<path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />)} />
        <StatCard title="Attended" value={data.sessions_attended} isMobile={isMobile} index={1} delay={0.06}
          icon={statIcon(<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />)} />
        <StatCard title="Attendance" value={`${data.attendance_rate}%`} isMobile={isMobile} index={2} delay={0.1} color="accent"
          subtitle={data.attendance_rate >= 90 ? 'Outstanding' : data.attendance_rate >= 75 ? 'Keep it up' : 'Room to grow'}
          icon={statIcon(<path d="M22 12h-4l-3 9L9 3l-3 9H2" />)} />
        <StatCard title="Avg Rating" value={data.average_rating || '—'} isMobile={isMobile} index={3} delay={0.14}
          icon={statIcon(<path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />)} />
        <StatCard title="Best Rating" value={data.best_rating || '—'} isMobile={isMobile} index={4} delay={0.18}
          subtitle={data.best_rating >= 5 ? 'Perfect score' : null}
          icon={statIcon(<path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />)} />
      </div>

      {/* ── Upcoming Sessions ── */}
      <div style={{ borderRadius: 16,
        background: '#FFFFFF',
        padding: '24px 26px', border: '1px solid #E5E5EA',
        marginBottom: 24, animation: 'fadeInUp 0.4s ease-out 0.2s both',
      }}>
        <SectionHeader
          title={t('dashboard.upcomingSessions')}
          meta={<span style={{ ...monoLabel, fontSize: 10 }}>{data.upcoming_sessions?.length || 0} scheduled</span>}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.upcoming_sessions?.length > 0 ? data.upcoming_sessions.map((s, i) => <SessionCard key={s.id} session={s} index={i} />) : (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 12 }}><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <div style={{ ...displayHeading, color: '#1D1D1F', fontSize: 15 }}>{t('dashboard.noUpcomingSessions')}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Monthly Progress + Recent Evaluations (side by side) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 20, alignItems: 'stretch',
      }}>
        {/* ── Monthly Progress ── */}
        {monthlyRatings.length > 0 && (
          <div style={{ borderRadius: 16,
            background: '#FFFFFF',
            padding: isMobile ? '22px 18px' : '24px 24px',
            border: '1px solid #E5E5EA',
            animation: 'fadeInUp 0.4s ease-out 0.25s both',
          }}>
            <SectionHeader
              title="Monthly Progress"
              subtitle="Rating trends over time"
              meta={
                <>
                  <TrendIndicator current={latestRating} previous={previousRating} />
                  <span style={{ ...monoLabel, fontSize: 10 }}>
                    {monthlyRatings.length} month{monthlyRatings.length !== 1 ? 's' : ''}
                  </span>
                </>
              }
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {monthlyRatings.map((m, i) => (
                <MonthlyRatingCard key={m.month} month={m} index={i} isMobile={isMobile} />
              ))}
            </div>
          </div>
        )}

        {/* ── Recent Evaluations ── */}
        <div style={{ borderRadius: 16,
          background: '#FFFFFF',
          padding: isMobile ? '22px 18px' : '24px 24px',
          border: '1px solid #E5E5EA',
          animation: 'fadeInUp 0.4s ease-out 0.3s both',
        }}>
          <SectionHeader
            title="Recent Evaluations"
            meta={<span style={{ ...monoLabel, fontSize: 10 }}>{data.recent_evaluations?.length || 0} recent</span>}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.recent_evaluations?.length > 0 ? data.recent_evaluations.map((e, i) => <EvaluationCard key={e.id} evaluation={e} index={i} />) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 12 }}><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                <div style={{ ...displayHeading, color: '#1D1D1F', fontSize: 15 }}>{t('empty.noData')}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
