import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { PageHeader, useIsMobile } from '../../components/CrudTable';

/* ───── Shared idiom tokens ───── */
const monoLabel = {
  fontFamily: 'var(--font-body)', fontSize: 12, color: '#6E6E73',
};
const displayHeading = {
  fontFamily: 'var(--font-display)', fontWeight: 600,
  letterSpacing: '-0.02em', lineHeight: 1,
};

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

/* ───── Radial Progress Ring ───── */
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
        {/* Top row: month + ring */}
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
        {/* Progress bar */}
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
      {/* Month name */}
      <div style={{ minWidth: 110 }}>
        <div style={{ ...displayHeading, color: '#1D1D1F', fontSize: 16, marginBottom: 6 }}>{month.month}</div>
        <div style={{ ...monoLabel, fontSize: 10, color: '#86868B' }}>{month.count} evaluation{month.count !== 1 ? 's' : ''}</div>
      </div>

      {/* Progress bar section */}
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

      {/* Rating ring */}
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

/* ───── Main Page ───── */
export default function SwimmerStats() {
  const [stats, setStats] = useState(null);
  const isMobile = useIsMobile();
  useEffect(() => { api.get('/swimmer/stats').then(r => setStats(r.data)); }, []);

  if (!stats) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 14 }}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5EA" strokeWidth="2" />
          <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#1D1D1F" strokeWidth="2" />
        </svg>
        <div style={{ ...monoLabel }}>Loading stats...</div>
      </div>
    </div>
  );

  // Compute trend from monthly ratings
  const monthlyRatings = stats.monthly_ratings || [];
  const latestRating = monthlyRatings.length > 0 ? Number(monthlyRatings[0].avg_rating) : null;
  const previousRating = monthlyRatings.length > 1 ? Number(monthlyRatings[1].avg_rating) : null;

  const statIcon = (path) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round">{path}</svg>
  );

  return (
    <div>
      <PageHeader title="My Stats" />

      {/* Stat cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: isMobile ? 12 : 16, marginBottom: 28,
      }}>
        <StatCard title="Total Sessions" value={stats.total_sessions} isMobile={isMobile} index={0} delay={0.02}
          icon={statIcon(<path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />)} />
        <StatCard title="Attended" value={stats.sessions_attended} isMobile={isMobile} index={1} delay={0.06}
          icon={statIcon(<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />)} />
        <StatCard title="Attendance" value={`${stats.attendance_rate}%`} isMobile={isMobile} index={2} delay={0.1} color="accent"
          subtitle={stats.attendance_rate >= 90 ? 'Outstanding' : stats.attendance_rate >= 75 ? 'Keep it up' : 'Room to grow'}
          icon={statIcon(<path d="M22 12h-4l-3 9L9 3l-3 9H2" />)} />
        <StatCard title="Avg Rating" value={stats.average_rating || '—'} isMobile={isMobile} index={3} delay={0.14}
          icon={statIcon(<path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />)} />
        <StatCard title="Best Rating" value={stats.best_rating || '—'} isMobile={isMobile} index={4} delay={0.18}
          subtitle={stats.best_rating >= 5 ? 'Perfect score' : null}
          icon={statIcon(<path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />)} />
      </div>

      {/* Monthly Ratings Section */}
      {monthlyRatings.length > 0 && (
        <div style={{ borderRadius: 16,
          background: '#FFFFFF',
          padding: isMobile ? '22px 18px' : '28px 30px',
          border: '1px solid #E5E5EA',
          animation: 'fadeInUp 0.4s ease-out 0.2s both',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            paddingBottom: 16, marginBottom: 24, borderBottom: '1px solid #E5E5EA',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: '#0071E3', display: 'inline-block', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <h2 style={{ ...displayHeading, margin: 0, color: '#1D1D1F', fontSize: 18 }}>
                Monthly Progress
              </h2>
              <div style={{ ...monoLabel, fontSize: 10, color: '#86868B', marginTop: 6 }}>
                Track your rating trends over time
              </div>
            </div>
            <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendIndicator current={latestRating} previous={previousRating} />
              <span style={{ ...monoLabel, fontSize: 10 }}>
                {monthlyRatings.length} month{monthlyRatings.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Monthly rating rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {monthlyRatings.map((m, i) => (
              <MonthlyRatingCard key={m.month} month={m} index={i} isMobile={isMobile} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!monthlyRatings || monthlyRatings.length === 0) && stats.total_sessions > 0 && (
        <div style={{ borderRadius: 16,
          background: '#FFFFFF',
          padding: '50px 20px', border: '1px solid #E5E5EA',
          textAlign: 'center', animation: 'fadeInUp 0.4s ease-out 0.2s both',
        }}>
          <div style={{ borderRadius: 16,
            width: 64, height: 64, background: '#FFFFFF', border: '1px solid #E5E5EA',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round">
              <path d="M16 8v8m-4-5v5m-4-2v2m-2 4h16a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div style={{ ...displayHeading, color: '#1D1D1F', fontSize: 16, marginBottom: 10 }}>No monthly ratings yet</div>
          <div style={{ color: '#6E6E73', fontSize: 13 }}>Ratings from evaluations will be aggregated here</div>
        </div>
      )}
    </div>
  );
}
