import { useState, useEffect } from 'react';
import { getAnalytics } from '../../api/analytics';
import { PageHeader, useIsMobile } from '../../components/CrudTable';
import { StatCard } from '../../components/ui/Cards';
import { Badge } from '../../components/ui/Badge';
import { MiniChart } from '../../components/ui/MiniChart';
import { EmptyState } from '../../components/ui/EmptyState';

/* ─────── Section Wrapper ─────── */
function Section({ title, icon, children, delay = 0 }) {
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
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: `fadeInUp 0.4s ease-out ${delay}s both`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'rgba(34,211,238,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#94a3b8',
        }}>{icon}</div>
        <h3 style={{
          margin: 0, color: '#f1f5f9', fontSize: 15,
          fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
        }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ─────── Funnel ─────── */
function FunnelChart({ data }) {
  if (!data) return <EmptyState title="No data" description="No registration funnel data available yet." />;
  const steps = [
    { label: 'Submitted', value: data.submitted_30d ?? 0, color: '#22d3ee', colorText: '#22d3ee' },
    { label: 'Approved',  value: data.approved_30d ?? 0,  color: '#34d399', colorText: '#34d399' },
    { label: 'Rejected',  value: data.rejected_30d ?? 0,  color: '#f43f5e', colorText: '#f43f5e' },
    { label: 'Pending',   value: data.pending_now ?? 0,   color: '#fbbf24', colorText: '#fbbf24' },
  ];
  const max = Math.max(...steps.map(s => s.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {steps.map((step, i) => {
        const pct = (step.value / max) * 100;
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>{step.label}</span>
              <span style={{
                fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                color: step.colorText,
              }}>{step.value}</span>
            </div>
            <div style={{
              height: 8, borderRadius: 6,
              background: 'rgba(255,255,255,0.04)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 6,
                width: `${Math.max(pct, 2)}%`,
                background: step.color,
                transition: 'width 0.8s ease-out',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────── Coach Performance Table ─────── */
function CoachTable({ data, isMobile }) {
  if (!data?.length) {
    return (
      <EmptyState
        title="No coach data"
        description="Coach performance data will appear here once sessions are recorded."
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    );
  }

  const thStyle = {
    textAlign: 'left', padding: '10px 14px',
    color: '#64748b', fontSize: 11,
    textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600,
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    background: 'rgba(13,31,60,0.4)',
    fontFamily: "'DM Sans', sans-serif",
  };

  const tdBase = {
    padding: '10px 14px', fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  };

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((coach, i) => (
          <div key={i} style={{
            background: 'rgba(13,31,60,0.4)', borderRadius: 12, padding: '14px 16px',
            border: '1px solid rgba(34,211,238,0.06)',
          }}>
            <div style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{coach.coach_name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#22d3ee', fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{coach.sessions_30d}</div>
                <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Sessions</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#34d399', fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{coach.avg_attendance}%</div>
                <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Attendance</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#fbbf24', fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{coach.avg_rating}</div>
                <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Avg Rating</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Coach', 'Sessions', 'Avg Attendance', 'Avg Rating'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((coach, i) => (
            <tr key={i} className="data-table-row">
              <td style={{ ...tdBase, color: '#f1f5f9', fontWeight: 500 }}>{coach.coach_name}</td>
              <td style={{ ...tdBase, color: '#94a3b8' }}>{coach.sessions_30d}</td>
              <td style={tdBase}>
                <Badge
                  variant={coach.avg_attendance >= 80 ? 'success' : coach.avg_attendance >= 60 ? 'warning' : 'danger'}
                  label={`${coach.avg_attendance}%`}
                />
              </td>
              <td style={tdBase}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#fbbf24', fontSize: 11 }}>&#9733;</span>
                  <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>{coach.avg_rating}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────── Main Page ─────── */
export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(() => setError('Failed to load analytics'));
  }, []);

  if (error) {
    return (
      <div style={{
        background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
        borderRadius: 18, border: '1px solid rgba(34,211,238,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)',
      }}>
        <EmptyState
          title="Failed to load analytics"
          description={error}
          action={
            <button onClick={() => window.location.reload()} style={{
              background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)',
              color: '#22d3ee', padding: '8px 20px', borderRadius: 10,
              cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            }}>Retry</button>
          }
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.08)',
            borderTopColor: '#22d3ee',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 12px',
          }} />
          <div style={{ fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>Loading analytics...</div>
        </div>
      </div>
    );
  }

  const growth = data.membership_growth || [];
  const retention = data.retention || {};
  const trend = data.attendance_trend || [];
  const funnel = data.registration_funnel || {};
  const coaches = data.coach_performance || [];

  // KPI values — backend keys: total (not count), retention_rate_30d, submitted_30d, pending_now
  const latestMembers = growth.length > 0 ? growth[growth.length - 1].total : 0;
  const prevMembers = growth.length > 1 ? growth[growth.length - 2].total : 0;
  const memberGrowth = prevMembers > 0 ? Math.round(((latestMembers - prevMembers) / prevMembers) * 100) : 0;

  const latestAttendance = trend.length > 0 ? trend[trend.length - 1].rate : 0;
  const retentionRate = retention.retention_rate_30d ?? 0;
  const totalRegistrations = funnel.submitted_30d ?? 0;

  // Transform data for MiniChart ({ label, value } shape)
  const growthChartData = growth.map(d => ({ label: d.month?.slice(-5) || '', value: d.total }));
  const trendChartData = trend.map(d => ({ label: d.week?.slice(-5) || '', value: d.rate }));

  return (
    <div>
      <PageHeader title="Analytics">
        {data.generated_at && (
          <div style={{
            color: '#64748b', fontSize: 11,
            background: 'rgba(13,31,60,0.4)', padding: '4px 10px',
            borderRadius: 6, border: '1px solid rgba(34,211,238,0.06)',
          }}>
            Updated {new Date(data.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </PageHeader>

      {/* KPI Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: 14, marginBottom: 22,
        animation: 'fadeInUp 0.4s ease-out both',
      }}>
        <StatCard
          label="Total Members"
          value={latestMembers}
          delta={memberGrowth !== 0 ? `${memberGrowth > 0 ? '+' : ''}${memberGrowth}% vs last month` : undefined}
          deltaType={memberGrowth > 0 ? 'up' : memberGrowth < 0 ? 'down' : undefined}
          accentColor="#22d3ee"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" />
              <path d="M20 8v6M23 11h-6" />
            </svg>
          }
        />
        <StatCard
          label="Retention Rate"
          value={`${retentionRate}%`}
          accentColor="#06b6d4"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
        />
        <StatCard
          label="Avg Attendance"
          value={`${latestAttendance}%`}
          delta="Latest week"
          accentColor="#34d399"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          }
        />
        <StatCard
          label="Registrations"
          value={totalRegistrations}
          delta={`${funnel.pending_now ?? 0} pending review`}
          accentColor="#a78bfa"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 16, marginBottom: 16,
      }}>
        {/* Membership Growth */}
        <Section title="Membership Growth" delay={0.1}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>}>
          {growthChartData.length > 0
            ? <MiniChart data={growthChartData} type="bar" color="#22d3ee" height={180} />
            : <EmptyState title="No data" description="Membership growth data will appear here." />
          }
        </Section>

        {/* Attendance Trend */}
        <Section title="Attendance Trend" delay={0.15}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>}>
          {trendChartData.length > 0
            ? <MiniChart data={trendChartData} type="line" color="#34d399" height={180} />
            : <EmptyState title="No data" description="Attendance trend data will appear here." />
          }
        </Section>
      </div>

      {/* Bottom Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 16,
      }}>
        {/* Registration Funnel */}
        <Section title="Registration Funnel" delay={0.2}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>}>
          <FunnelChart data={funnel} />
        </Section>

        {/* Coach Performance */}
        <Section title="Coach Performance" delay={0.25}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}>
          <CoachTable data={coaches} isMobile={isMobile} />
        </Section>
      </div>
    </div>
  );
}
