import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { PageHeader, useIsMobile } from '../../components/CrudTable';

/* ───── Stat Card ───── */
function StatCard({ title, value, subtitle, icon, color, delay = 0, isMobile }) {
  const palette = {
    sky:     { base: '#38bdf8', dark: '#0ea5e9', rgb: '56,189,248' },
    cyan:    { base: '#22d3ee', dark: '#06b6d4', rgb: '34,211,238' },
    teal:    { base: '#2dd4bf', dark: '#14b8a6', rgb: '45,212,191' },
    amber:   { base: '#fbbf24', dark: '#f59e0b', rgb: '251,191,36' },
    emerald: { base: '#34d399', dark: '#10b981', rgb: '52,211,153' },
  }[color] || { base: '#38bdf8', dark: '#0ea5e9', rgb: '56,189,248' };

  return (
    <div
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
        e.currentTarget.style.boxShadow = `0 12px 40px rgba(${palette.rgb},0.2), 0 4px 16px rgba(0,0,0,0.3)`;
        e.currentTarget.style.borderColor = `rgba(${palette.rgb},0.25)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)';
        e.currentTarget.style.borderColor = `rgba(${palette.rgb},0.1)`;
      }}
      style={{
        flex: isMobile ? '1 1 calc(50% - 8px)' : '1 1 180px',
        background: 'linear-gradient(145deg, rgba(13,31,60,0.7) 0%, rgba(10,22,40,0.5) 100%)',
        borderRadius: 20, padding: isMobile ? '20px 18px' : '26px 28px',
        border: `1px solid rgba(${palette.rgb},0.1)`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)',
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative', overflow: 'hidden',
        animation: `fadeInUp 0.5s ease-out ${delay}s both`,
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: '15%', right: '15%', height: 2,
        background: `linear-gradient(90deg, transparent, ${palette.base}, transparent)`, opacity: 0.5,
        borderRadius: '0 0 2px 2px',
      }} />
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${palette.rgb},0.08) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: `linear-gradient(135deg, rgba(${palette.rgb},0.15) 0%, rgba(${palette.rgb},0.05) 100%)`,
        border: `1px solid rgba(${palette.rgb},0.15)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18,
      }}>{icon}</div>

      {/* Value */}
      <div style={{
        fontSize: isMobile ? 30 : 36, fontWeight: 800,
        fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.03em', lineHeight: 1,
        background: `linear-gradient(135deg, ${palette.base} 0%, #f1f5f9 100%)`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        marginBottom: 6,
      }}>{value}</div>

      {/* Title */}
      <div style={{
        color: '#94a3b8', fontSize: 12, fontWeight: 600,
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>{title}</div>

      {/* Subtitle */}
      {subtitle && (
        <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>{subtitle}</div>
      )}
    </div>
  );
}

/* ───── Radial Progress Ring ───── */
function RatingRing({ value, maxValue = 5, size = 56, color }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / maxValue) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke="rgba(51,65,85,0.25)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: size * 0.32,
        color: color,
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
  const barColor = avgRating >= 4 ? '#2dd4bf' : avgRating >= 3 ? '#38bdf8' : avgRating >= 2 ? '#fbbf24' : '#f87171';
  const barColorRgb = avgRating >= 4 ? '45,212,191' : avgRating >= 3 ? '56,189,248' : avgRating >= 2 ? '251,191,36' : '248,113,113';
  const ratingLabel = avgRating >= 4.5 ? 'Excellent' : avgRating >= 3.5 ? 'Great' : avgRating >= 2.5 ? 'Good' : avgRating >= 1.5 ? 'Fair' : 'Needs Work';

  if (isMobile) {
    return (
      <div style={{
        padding: '18px 20px', borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
        border: '1px solid rgba(34,211,238,0.06)',
        animation: `fadeInUp 0.4s ease-out ${0.05 + index * 0.04}s both`,
      }}>
        {/* Top row: month + ring */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 2 }}>{month.month}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                background: `${barColor}15`, color: barColor,
              }}>{ratingLabel}</span>
              <span style={{ color: '#475569', fontSize: 11 }}>{month.count} eval{month.count !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <RatingRing value={avgRating} color={barColor} size={50} />
        </div>
        {/* Progress bar */}
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(51,65,85,0.25)', overflow: 'hidden' }}>
          <div style={{
            width: `${ratingPercent}%`, height: '100%', borderRadius: 3,
            background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
            boxShadow: `0 0 12px rgba(${barColorRgb},0.3)`,
            transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
          }} />
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `rgba(${barColorRgb},0.2)`;
        e.currentTarget.style.transform = 'translateX(4px)';
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(13,31,60,0.7) 0%, rgba(10,22,40,0.5) 100%)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.06)';
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)';
      }}
      style={{
        display: 'flex', alignItems: 'center', gap: 20, padding: '18px 22px',
        background: 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
        borderRadius: 16, border: '1px solid rgba(34,211,238,0.06)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: `fadeInUp 0.4s ease-out ${0.05 + index * 0.04}s both`,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Left accent */}
      <div style={{
        position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3,
        background: `linear-gradient(180deg, transparent, ${barColor}, transparent)`, borderRadius: 3,
      }} />

      {/* Month name */}
      <div style={{ minWidth: 110 }}>
        <div style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 2 }}>{month.month}</div>
        <div style={{ color: '#475569', fontSize: 11, fontWeight: 500 }}>{month.count} evaluation{month.count !== 1 ? 's' : ''}</div>
      </div>

      {/* Progress bar section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            padding: '2px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
            background: `${barColor}12`, border: `1px solid ${barColor}20`,
            color: barColor, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>{ratingLabel}</span>
          <span style={{ color: '#475569', fontSize: 11 }}>{avgRating} / 5.0</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'rgba(51,65,85,0.25)', overflow: 'hidden' }}>
          <div style={{
            width: `${ratingPercent}%`, height: '100%', borderRadius: 4,
            background: `linear-gradient(90deg, ${barColor}99, ${barColor})`,
            boxShadow: `0 0 16px rgba(${barColorRgb},0.25)`,
            transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
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
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
      background: isUp ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
      color: isUp ? '#34d399' : '#f87171',
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#64748b' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(56,189,248,0.2)" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Loading stats...</div>
      </div>
    </div>
  );

  // Compute trend from monthly ratings
  const monthlyRatings = stats.monthly_ratings || [];
  const latestRating = monthlyRatings.length > 0 ? Number(monthlyRatings[0].avg_rating) : null;
  const previousRating = monthlyRatings.length > 1 ? Number(monthlyRatings[1].avg_rating) : null;

  return (
    <div>
      <PageHeader title="My Stats" />

      {/* Stat cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: isMobile ? 12 : 16, marginBottom: 28,
      }}>
        <StatCard title="Total Sessions" value={stats.total_sessions} isMobile={isMobile} color="sky" delay={0.05}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
        <StatCard title="Attended" value={stats.sessions_attended} isMobile={isMobile} color="cyan" delay={0.1}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="Attendance" value={`${stats.attendance_rate}%`} isMobile={isMobile} color="teal" delay={0.15}
          subtitle={stats.attendance_rate >= 90 ? 'Outstanding!' : stats.attendance_rate >= 75 ? 'Keep it up!' : 'Room to grow'}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>} />
        <StatCard title="Avg Rating" value={stats.average_rating || '—'} isMobile={isMobile} color="amber" delay={0.2}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>} />
        <StatCard title="Best Rating" value={stats.best_rating || '—'} isMobile={isMobile} color="emerald" delay={0.25}
          subtitle={stats.best_rating >= 5 ? 'Perfect score!' : null}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>} />
      </div>

      {/* Monthly Ratings Section */}
      {monthlyRatings.length > 0 && (
        <div style={{
          background: 'linear-gradient(145deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
          borderRadius: 22, padding: isMobile ? '22px 18px' : '28px 30px',
          border: '1px solid rgba(34,211,238,0.06)',
          animation: 'fadeInUp 0.5s ease-out 0.3s both',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Subtle bg glow */}
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56,189,248,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
            flexWrap: 'wrap',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.04) 100%)',
              border: '1px solid rgba(56,189,248,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round">
                <path d="M16 8v8m-4-5v5m-4-2v2m-2 4h16a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                Monthly Progress
              </h2>
              <div style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>
                Track your rating trends over time
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendIndicator current={latestRating} previous={previousRating} />
              <div style={{
                padding: '5px 14px', borderRadius: 10,
                background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.08)',
                color: '#64748b', fontSize: 12, fontWeight: 600,
              }}>
                {monthlyRatings.length} month{monthlyRatings.length !== 1 ? 's' : ''}
              </div>
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
        <div style={{
          background: 'linear-gradient(145deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
          borderRadius: 22, padding: '50px 20px', border: '1px solid rgba(34,211,238,0.06)',
          textAlign: 'center', animation: 'fadeInUp 0.5s ease-out 0.3s both',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.1)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round">
              <path d="M16 8v8m-4-5v5m-4-2v2m-2 4h16a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div style={{ color: '#64748b', fontSize: 15, fontWeight: 500, marginBottom: 4 }}>No monthly ratings yet</div>
          <div style={{ color: '#475569', fontSize: 13 }}>Ratings from evaluations will be aggregated here</div>
        </div>
      )}
    </div>
  );
}
