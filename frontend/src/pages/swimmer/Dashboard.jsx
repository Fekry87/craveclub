import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useIsMobile } from '../../components/CrudTable';
import { useTranslation } from 'react-i18next';

/* ───── Welcome Hero ───── */
function WelcomeHero({ user, data }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = user?.name?.split(' ')[0] || 'Swimmer';

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(13,31,60,0.85) 0%, rgba(14,165,233,0.08) 50%, rgba(13,31,60,0.65) 100%)',
      borderRadius: 22, padding: '36px 40px',
      border: '1px solid rgba(56,189,248,0.1)',
      position: 'relative', overflow: 'hidden', marginBottom: 28,
      animation: 'fadeInUp 0.5s ease-out',
      boxShadow: '0 2px 12px rgba(0,0,0,0.15), 0 0 40px rgba(56,189,248,0.03)',
    }}>
      <div style={{ position: 'absolute', top: -40, right: -20, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -30, right: 80, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 10%, rgba(56,189,248,0.2) 50%, transparent 90%)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ color: '#38bdf8', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round">
            <path d="M2 12c2-3 4 1 6-2s4 3 6 0 4-3 6 0" />
            <circle cx="8" cy="8" r="3" />
            <path d="M6 11l-2 6h8l-2-6" />
          </svg>
          Swimmer Portal
        </div>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 30, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          {greeting}, <span style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #22d3ee 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{firstName}</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
          {data.upcoming_sessions?.length ? `You have ${data.upcoming_sessions.length} upcoming session${data.upcoming_sessions.length > 1 ? 's' : ''}` : 'No upcoming sessions scheduled'}
        </p>
      </div>
    </div>
  );
}

/* ───── Stat Card (from Stats page — enhanced) ───── */
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
      <div style={{
        position: 'absolute', top: 0, left: '15%', right: '15%', height: 2,
        background: `linear-gradient(90deg, transparent, ${palette.base}, transparent)`, opacity: 0.5,
        borderRadius: '0 0 2px 2px',
      }} />
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${palette.rgb},0.08) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: `linear-gradient(135deg, rgba(${palette.rgb},0.15) 0%, rgba(${palette.rgb},0.05) 100%)`,
        border: `1px solid rgba(${palette.rgb},0.15)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18,
      }}>{icon}</div>
      <div style={{
        fontSize: isMobile ? 30 : 36, fontWeight: 800,
        fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.03em', lineHeight: 1,
        background: `linear-gradient(135deg, ${palette.base} 0%, #f1f5f9 100%)`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        marginBottom: 6,
      }}>{value}</div>
      <div style={{
        color: '#94a3b8', fontSize: 12, fontWeight: 600,
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>{title}</div>
      {subtitle && (
        <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>{subtitle}</div>
      )}
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
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(56,189,248,0.15)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.06)'; e.currentTarget.style.transform = 'translateX(0)'; }}
      style={{
        display: 'flex', alignItems: 'center', gap: 18, padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
        borderRadius: 14, border: '1px solid rgba(34,211,238,0.06)',
        transition: 'all 0.25s ease',
        animation: `fadeInUp 0.4s ease-out ${0.1 + index * 0.06}s both`,
      }}
    >
      <div style={{
        width: 56, height: 60, borderRadius: 12,
        background: 'linear-gradient(135deg, rgba(56,189,248,0.1) 0%, rgba(56,189,248,0.05) 100%)',
        border: '1px solid rgba(56,189,248,0.12)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <div style={{ color: '#38bdf8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{dayName}</div>
        <div style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif", lineHeight: 1.1 }}>{dayNum}</div>
        <div style={{ color: '#64748b', fontSize: 9, fontWeight: 500, textTransform: 'uppercase' }}>{month}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif", marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {session.group?.name || 'Training Session'}
        </div>
        {session.plan?.title && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8', fontSize: 13 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            {session.plan.title}
          </div>
        )}
      </div>
      <div style={{
        padding: '7px 14px', borderRadius: 10,
        background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.12)',
        color: '#38bdf8', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {session.start_time?.slice(0,5)} - {session.end_time?.slice(0,5)}
      </div>
    </div>
  );
}

/* ───── Radial Rating Ring ───── */
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
      <div style={{
        position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3,
        background: `linear-gradient(180deg, transparent, ${barColor}, transparent)`, borderRadius: 3,
      }} />
      <div style={{ minWidth: 110 }}>
        <div style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 2 }}>{month.month}</div>
        <div style={{ color: '#475569', fontSize: 11, fontWeight: 500 }}>{month.count} evaluation{month.count !== 1 ? 's' : ''}</div>
      </div>
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

/* ───── Rating Dots (for evaluations) ───── */
function RatingDots({ value, size = 22 }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1,2,3,4,5].map(r => (
        <span key={r} style={{
          width: size, height: size, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.5, fontWeight: 700,
          background: value >= r ? 'linear-gradient(135deg, #38bdf8, #0ea5e9)' : 'rgba(51,65,85,0.3)',
          color: value >= r ? '#060d1f' : '#64748b',
          fontFamily: "'Outfit', sans-serif",
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
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(45,212,191,0.15)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.06)'; e.currentTarget.style.transform = 'translateX(0)'; }}
      style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
        background: 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
        borderRadius: 14, border: '1px solid rgba(34,211,238,0.06)',
        transition: 'all 0.25s ease',
        animation: `fadeInUp 0.4s ease-out ${0.1 + index * 0.06}s both`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: evaluation.notes ? 6 : 0 }}>
          <span style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{evaluation.session?.group?.name}</span>
          <span style={{ color: '#64748b', fontSize: 12 }}>{formattedDate}</span>
        </div>
        {evaluation.notes && <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.4 }}>{evaluation.notes}</div>}
      </div>
      <RatingDots value={evaluation.rating} size={24} />
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#64748b' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(56,189,248,0.2)" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{t('dashboard.loadingDashboard')}</div>
      </div>
    </div>
  );

  const monthlyRatings = data.monthly_ratings || [];
  const latestRating = monthlyRatings.length > 0 ? Number(monthlyRatings[0].avg_rating) : null;
  const previousRating = monthlyRatings.length > 1 ? Number(monthlyRatings[1].avg_rating) : null;

  return (
    <div>
      <WelcomeHero user={user} data={data} />

      {/* ── Stat Cards (5 cards from Stats page) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: isMobile ? 12 : 16, marginBottom: 28,
      }}>
        <StatCard title="Total Sessions" value={data.total_sessions} isMobile={isMobile} color="sky" delay={0.05}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
        <StatCard title="Attended" value={data.sessions_attended} isMobile={isMobile} color="cyan" delay={0.1}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="Attendance" value={`${data.attendance_rate}%`} isMobile={isMobile} color="teal" delay={0.15}
          subtitle={data.attendance_rate >= 90 ? 'Outstanding!' : data.attendance_rate >= 75 ? 'Keep it up!' : 'Room to grow'}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>} />
        <StatCard title="Avg Rating" value={data.average_rating || '—'} isMobile={isMobile} color="amber" delay={0.2}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>} />
        <StatCard title="Best Rating" value={data.best_rating || '—'} isMobile={isMobile} color="emerald" delay={0.25}
          subtitle={data.best_rating >= 5 ? 'Perfect score!' : null}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>} />
      </div>

      {/* ── Upcoming Sessions ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)',
        borderRadius: 18, padding: '24px 26px', border: '1px solid rgba(34,211,238,0.06)',
        marginBottom: 24, animation: 'fadeInUp 0.5s ease-out 0.3s both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: 18, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{t('dashboard.upcomingSessions')}</h2>
          <div style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 8, background: 'rgba(56,189,248,0.06)', color: '#64748b', fontSize: 12, fontWeight: 500 }}>{data.upcoming_sessions?.length || 0} scheduled</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.upcoming_sessions?.length > 0 ? data.upcoming_sessions.map((s, i) => <SessionCard key={s.id} session={s} index={i} />) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 10 }}><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{t('dashboard.noUpcomingSessions')}</div>
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
          <div style={{
            background: 'linear-gradient(145deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
            borderRadius: 22, padding: isMobile ? '22px 18px' : '24px 24px',
            border: '1px solid rgba(34,211,238,0.06)',
            animation: 'fadeInUp 0.5s ease-out 0.35s both',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(56,189,248,0.04) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
              flexWrap: 'wrap',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.04) 100%)',
                border: '1px solid rgba(56,189,248,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round">
                  <path d="M16 8v8m-4-5v5m-4-2v2m-2 4h16a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: 17, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                  Monthly Progress
                </h2>
                <div style={{ color: '#475569', fontSize: 11, marginTop: 1 }}>
                  Rating trends over time
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendIndicator current={latestRating} previous={previousRating} />
                <div style={{
                  padding: '4px 10px', borderRadius: 8,
                  background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.08)',
                  color: '#64748b', fontSize: 11, fontWeight: 600,
                }}>
                  {monthlyRatings.length} month{monthlyRatings.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {monthlyRatings.map((m, i) => (
                <MonthlyRatingCard key={m.month} month={m} index={i} isMobile={isMobile} />
              ))}
            </div>
          </div>
        )}

        {/* ── Recent Evaluations ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)',
          borderRadius: 18, padding: isMobile ? '22px 18px' : '24px 24px',
          border: '1px solid rgba(34,211,238,0.06)',
          animation: 'fadeInUp 0.5s ease-out 0.4s both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            </div>
            <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: 17, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Recent Evaluations</h2>
            <div style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 8, background: 'rgba(45,212,191,0.06)', color: '#64748b', fontSize: 11, fontWeight: 500 }}>{data.recent_evaluations?.length || 0} recent</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.recent_evaluations?.length > 0 ? data.recent_evaluations.map((e, i) => <EvaluationCard key={e.id} evaluation={e} index={i} />) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 10 }}><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{t('empty.noData')}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
