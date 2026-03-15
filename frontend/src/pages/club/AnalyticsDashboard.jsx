import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnalytics } from '../../api/analytics';
import { useIsMobile } from '../../components/CrudTable';

/* ─────── KPI Card ─────── */
function KpiCard({ label, value, sub, color, delay = 0 }) {
  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
      borderRadius: 18, padding: '20px 22px',
      border: `1px solid ${color}15`,
      position: 'relative', overflow: 'hidden',
      animation: `fadeInUp 0.4s ease-out ${delay}s both`,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}50, ${color}10)` }} />
      <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{label}</div>
      <div style={{ color: '#f1f5f9', fontSize: 28, fontWeight: 700, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: '#526280', fontSize: 12, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

/* ─────── Section Wrapper ─────── */
function Section({ title, icon, color = '#22d3ee', delay = 0, children }) {
  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(13,31,60,0.55) 0%, rgba(10,22,40,0.35) 100%)',
      borderRadius: 20, padding: '22px 24px',
      border: '1px solid rgba(34,211,238,0.06)',
      animation: `fadeInUp 0.4s ease-out ${delay}s both`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: `${color}0c`, border: `1px solid ${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</div>
        <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ─────── Bar Chart (CSS) ─────── */
function BarChart({ data, labelKey, valueKey, color = '#22d3ee', height = 180 }) {
  if (!data?.length) return <EmptyChart />;
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height, padding: '0 4px' }}>
      {data.map((d, i) => {
        const pct = (d[valueKey] / max) * 100;
        const label = d[labelKey]?.slice(-5) || '';
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>{d[valueKey]}</span>
            <div style={{
              width: '100%', maxWidth: 40, borderRadius: '6px 6px 2px 2px',
              height: `${Math.max(pct, 3)}%`,
              background: `linear-gradient(180deg, ${color} 0%, ${color}60 100%)`,
              transition: 'height 0.6s ease-out',
              minHeight: 4,
            }} />
            <span style={{ color: '#475569', fontSize: 9, fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────── Line Chart (CSS + SVG) ─────── */
function LineChart({ data, labelKey, valueKey, color = '#22d3ee', height = 180 }) {
  if (!data?.length) return <EmptyChart />;
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  const w = 100;
  const h = height - 40;
  const points = data.map((d, i) => {
    const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
    const y = h - (d[valueKey] / max) * (h - 10) - 5;
    return `${x},${y}`;
  });
  const polyline = points.join(' ');
  const areaPoints = `0,${h} ${polyline} ${w},${h}`;

  return (
    <div style={{ position: 'relative', height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: h }}>
        <defs>
          <linearGradient id={`area-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill={`url(#area-${color.replace('#', '')})`} />
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => {
          const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
          const y = h - (d[valueKey] / max) * (h - 10) - 5;
          return <circle key={i} cx={x} cy={y} r="1.5" fill={color} vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, padding: '0 2px' }}>
        {data.map((d, i) => (
          <span key={i} style={{ color: '#475569', fontSize: 9, fontWeight: 500 }}>{d[labelKey]?.slice(-5) || ''}</span>
        ))}
      </div>
    </div>
  );
}

/* ─────── Funnel ─────── */
function FunnelChart({ data }) {
  if (!data) return <EmptyChart />;
  const steps = [
    { label: 'Submitted', value: data.submitted, color: '#38bdf8' },
    { label: 'Approved', value: data.approved, color: '#4ade80' },
    { label: 'Rejected', value: data.rejected, color: '#f87171' },
    { label: 'Pending', value: data.pending, color: '#fbbf24' },
  ];
  const max = Math.max(...steps.map(s => s.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {steps.map((step, i) => {
        const pct = (step.value / max) * 100;
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>{step.label}</span>
              <span style={{ color: step.color, fontSize: 13, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{step.value}</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'rgba(51,65,85,0.2)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4, width: `${Math.max(pct, 2)}%`,
                background: `linear-gradient(90deg, ${step.color}, ${step.color}80)`,
                transition: 'width 0.8s ease-out',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────── At-Risk Swimmers Table ─────── */
function AtRiskTable({ data, isMobile }) {
  if (!data?.length) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px', color: '#475569' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 8 }}>
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div style={{ fontSize: 13, fontWeight: 500 }}>No at-risk swimmers</div>
        <div style={{ fontSize: 11, color: '#334155', marginTop: 3 }}>All coaches are performing well</div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((coach, i) => (
          <div key={i} style={{
            background: 'rgba(6,13,31,0.3)', borderRadius: 14, padding: '14px 16px',
            border: '1px solid rgba(51,65,85,0.15)',
          }}>
            <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{coach.coach_name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#22d3ee', fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{coach.sessions_count}</div>
                <div style={{ color: '#475569', fontSize: 9, textTransform: 'uppercase' }}>Sessions</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#4ade80', fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{coach.avg_attendance}%</div>
                <div style={{ color: '#475569', fontSize: 9, textTransform: 'uppercase' }}>Attendance</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#fbbf24', fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{coach.avg_rating}</div>
                <div style={{ color: '#475569', fontSize: 9, textTransform: 'uppercase' }}>Avg Rating</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid rgba(51,65,85,0.15)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Coach', 'Sessions', 'Avg Attendance', 'Avg Rating'].map(h => (
              <th key={h} style={{
                textAlign: 'left', padding: '10px 14px', color: '#64748b', fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600,
                borderBottom: '1px solid rgba(51,65,85,0.2)', background: 'rgba(6,13,31,0.4)',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((coach, i) => (
            <tr key={i} style={{ borderBottom: i < data.length - 1 ? '1px solid rgba(51,65,85,0.12)' : 'none' }}>
              <td style={{ padding: '10px 14px', color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>{coach.coach_name}</td>
              <td style={{ padding: '10px 14px', color: '#cbd5e1', fontSize: 13 }}>{coach.sessions_count}</td>
              <td style={{ padding: '10px 14px' }}>
                <span style={{
                  padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: coach.avg_attendance >= 80 ? 'rgba(74,222,128,0.12)' : coach.avg_attendance >= 60 ? 'rgba(251,191,36,0.12)' : 'rgba(248,113,113,0.12)',
                  color: coach.avg_attendance >= 80 ? '#4ade80' : coach.avg_attendance >= 60 ? '#fbbf24' : '#f87171',
                }}>{coach.avg_attendance}%</span>
              </td>
              <td style={{ padding: '10px 14px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#fbbf24', fontSize: 12 }}>&#9733;</span>
                  <span style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 600 }}>{coach.avg_rating}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyChart() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 16px', color: '#475569' }}>
      <div style={{ fontSize: 13, fontWeight: 500 }}>No data available yet</div>
    </div>
  );
}

/* ─────── Main Page ─────── */
export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(() => setError('Failed to load analytics'));
  }, []);

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#ef4444' }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{
          background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)',
          color: '#22d3ee', padding: '8px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#64748b' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 10 }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(34,211,238,0.2)" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Loading analytics...</div>
        </div>
      </div>
    );
  }

  const growth = data.membership_growth || [];
  const retention = data.retention || {};
  const trend = data.attendance_trend || [];
  const funnel = data.registration_funnel || {};
  const coaches = data.coach_performance || [];

  // KPI values
  const latestMembers = growth.length > 0 ? growth[growth.length - 1].count : 0;
  const prevMembers = growth.length > 1 ? growth[growth.length - 2].count : 0;
  const memberGrowth = prevMembers > 0 ? Math.round(((latestMembers - prevMembers) / prevMembers) * 100) : 0;

  const latestAttendance = trend.length > 0 ? trend[trend.length - 1].rate : 0;
  const retentionRate = retention.retention_rate ?? 0;
  const totalRegistrations = funnel.submitted ?? 0;

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
        animation: 'fadeInUp 0.3s ease-out',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/club/dashboard')} style={{
            background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', fontSize: 13, fontWeight: 500,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#f1f5f9' }}>Analytics</h1>
            <div style={{ color: '#526280', fontSize: 12, marginTop: 2 }}>Club performance overview</div>
          </div>
        </div>
        {data.generated_at && (
          <div style={{ color: '#475569', fontSize: 11 }}>
            Updated {new Date(data.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* KPI Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: 14, marginBottom: 22,
      }}>
        <KpiCard label="Total Members" value={latestMembers} sub={memberGrowth !== 0 ? `${memberGrowth > 0 ? '+' : ''}${memberGrowth}% vs last month` : null} color="#22d3ee" delay={0.05} />
        <KpiCard label="Retention Rate" value={`${retentionRate}%`} sub={`${retention.active_count ?? 0} active of ${retention.total_count ?? 0}`} color="#2dd4bf" delay={0.1} />
        <KpiCard label="Avg Attendance" value={`${latestAttendance}%`} sub="Latest week" color="#a78bfa" delay={0.15} />
        <KpiCard label="Registrations" value={totalRegistrations} sub={`${funnel.pending ?? 0} pending review`} color="#f59e0b" delay={0.2} />
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 18, marginBottom: 18,
      }}>
        {/* Membership Growth */}
        <Section title="Membership Growth" delay={0.25} color="#22d3ee"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>}>
          <BarChart data={growth} labelKey="month" valueKey="count" color="#22d3ee" />
        </Section>

        {/* Attendance Trend */}
        <Section title="Attendance Trend" delay={0.3} color="#a78bfa"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>}>
          <LineChart data={trend} labelKey="week" valueKey="rate" color="#a78bfa" />
        </Section>
      </div>

      {/* Bottom Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 18,
      }}>
        {/* Registration Funnel */}
        <Section title="Registration Funnel" delay={0.35} color="#f59e0b"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>}>
          <FunnelChart data={funnel} />
        </Section>

        {/* Coach Performance */}
        <Section title="Coach Performance" delay={0.4} color="#2dd4bf"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}>
          <AtRiskTable data={coaches} isMobile={isMobile} />
        </Section>
      </div>
    </div>
  );
}
