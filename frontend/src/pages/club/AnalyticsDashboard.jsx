import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getAnalytics } from '../../api/analytics';
import { dateLocale } from '../../lib/dates';
import { PageHeader, useIsMobile } from '../../components/CrudTable';
import { StatCard } from '../../components/ui/Cards';
import { Badge } from '../../components/ui/Badge';
import { MiniChart } from '../../components/ui/MiniChart';
import { EmptyState } from '../../components/ui/EmptyState';

/* ─────── Section Wrapper ─────── */
function Section({ title, icon, children, delay = 0 }) {
  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        background: '#FFFFFF',
        padding: '22px 24px',
        border: '1px solid #E5E5EA',
        transition: 'border-color 0.15s ease',
        animation: `fadeInUp 0.4s ease-out ${delay}s both`,
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #E5E5EA',
      }}>
        {icon && <span style={{ display: 'inline-flex', color: '#1D1D1F' }}>{icon}</span>}
        <h3 style={{
          margin: 0, color: '#1D1D1F', fontSize: 16,
          fontFamily: 'var(--font-display)', fontWeight: 600,
          letterSpacing: '-0.02em', lineHeight: 1,
        }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ─────── Funnel ─────── */
function FunnelChart({ data }) {
  const { t } = useTranslation();
  if (!data) return <EmptyState title={t('empty.noData')} description={t('analytics.noFunnelData')} />;
  const steps = [
    { label: t('analytics.submitted'), value: data.submitted_30d ?? 0, color: '#1D1D1F', colorText: '#1D1D1F' },
    { label: t('status.approved'),     value: data.approved_30d ?? 0,  color: '#34C759', colorText: '#34C759' },
    { label: t('status.rejected'),     value: data.rejected_30d ?? 0,  color: '#FF3B30', colorText: '#FF3B30' },
    { label: t('status.pending'),      value: data.pending_now ?? 0,   color: '#FF9500', colorText: '#FF9500' },
  ];
  const max = Math.max(...steps.map(s => s.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {steps.map((step, i) => {
        const pct = (step.value / max) * 100;
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 10 }}>
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: 12, color: '#6E6E73',
              }}>
                {step.label}
              </span>
              <span style={{
                fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600,
                letterSpacing: '-0.02em', lineHeight: 1, color: step.colorText,
              }}>{step.value}</span>
            </div>
            <div style={{
              height: 6, background: '#EDEDF0', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${Math.max(pct, 2)}%`,
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
  const { t } = useTranslation();
  if (!data?.length) {
    return (
      <EmptyState
        title={t('analytics.noCoachData')}
        description={t('analytics.noCoachDataHint')}
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    );
  }

  const thStyle = {
    textAlign: 'start', padding: '10px 14px',
    color: '#6E6E73', fontSize: 11, fontWeight: 500,
    borderBottom: '1px solid #E5E5EA',
    background: '#FFFFFF',
    fontFamily: 'var(--font-body)',
  };

  const tdBase = {
    padding: '10px 14px', fontSize: 13,
    fontFamily: 'var(--font-body)',
    borderBottom: '1px solid #E5E5EA',
  };

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((coach, i) => (
          <div key={i} style={{ borderRadius: 16,
            background: '#FFFFFF', padding: '14px 16px',
            border: '1px solid #E5E5EA',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{
                color: '#1D1D1F', fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 600,
                letterSpacing: '-0.02em', lineHeight: 1,
              }}>{coach.coach_name}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#1D1D1F', fontSize: 22, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1 }}>{coach.sessions_30d}</div>
                <div style={{ color: '#6E6E73', fontSize: 11, fontFamily: 'var(--font-body)', marginTop: 4 }}>{t('analytics.sessions')}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#34C759', fontSize: 22, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1 }}>{coach.avg_attendance}%</div>
                <div style={{ color: '#6E6E73', fontSize: 11, fontFamily: 'var(--font-body)', marginTop: 4 }}>{t('analytics.attendance')}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#FF9500', fontSize: 22, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1 }}>{coach.avg_rating}</div>
                <div style={{ color: '#6E6E73', fontSize: 11, fontFamily: 'var(--font-body)', marginTop: 4 }}>{t('analytics.avgRating')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', border: '1px solid #E5E5EA' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {[t('analytics.coach'), t('analytics.sessions'), t('analytics.avgAttendance'), t('analytics.avgRating')].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((coach, i) => (
            <tr key={i} className="data-table-row">
              <td style={{ ...tdBase, color: '#1D1D1F', fontWeight: 500 }}>{coach.coach_name}</td>
              <td style={{ ...tdBase, color: '#515154' }}>{coach.sessions_30d}</td>
              <td style={tdBase}>
                <Badge
                  variant={coach.avg_attendance >= 80 ? 'success' : coach.avg_attendance >= 60 ? 'warning' : 'danger'}
                  label={`${coach.avg_attendance}%`}
                />
              </td>
              <td style={tdBase}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#FF9500', fontSize: 11 }}>&#9733;</span>
                  <span style={{ color: '#1D1D1F', fontSize: 13, fontWeight: 600 }}>{coach.avg_rating}</span>
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
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(() => setError(t('analytics.loadFailed')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div style={{ borderRadius: 16,
        background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        }}>
        <EmptyState
          title={t('analytics.loadFailed')}
          description={error}
          action={
            <button type="button" className="pl-btn pl-btn-secondary pl-btn-sm" onClick={() => window.location.reload()}>{t('actions.retry')}</button>
          }
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', color: '#515154' }}>
          <div style={{
            width: 32, height: 32, border: '2px solid #E5E5EA',
            borderTopColor: '#1D1D1F',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 12px',
          }} />
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 12, color: '#6E6E73',
          }}>{t('analytics.loading')}</div>
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
      <PageHeader title={t('analytics.title')}>
        {data.generated_at && (
          <div style={{
            color: '#6E6E73', fontSize: 11, fontFamily: 'var(--font-body)',
            padding: '4px 10px', border: '1px solid #E5E5EA',
          }}>
            {t('analytics.updated', { time: new Date(data.generated_at).toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' }) })}
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
          label={t('analytics.totalMembers')}
          value={latestMembers}
          delta={memberGrowth !== 0 ? t('analytics.vsLastMonth', { delta: `${memberGrowth > 0 ? '+' : ''}${memberGrowth}` }) : undefined}
          deltaType={memberGrowth > 0 ? 'up' : memberGrowth < 0 ? 'down' : undefined}
          accentColor="#0071E3"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" />
              <path d="M20 8v6M23 11h-6" />
            </svg>
          }
        />
        <StatCard
          label={t('analytics.retentionRate')}
          value={`${retentionRate}%`}
          accentColor="#0071E3"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
        />
        <StatCard
          label={t('analytics.avgAttendance')}
          value={`${latestAttendance}%`}
          delta={t('analytics.latestWeek')}
          accentColor="#34C759"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          }
        />
        <StatCard
          label={t('analytics.registrations')}
          value={totalRegistrations}
          delta={t('analytics.pendingReview', { count: funnel.pending_now ?? 0 })}
          accentColor="#0071E3"
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
        <Section title={t('analytics.membershipGrowth')} delay={0.1}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>}>
          {growthChartData.length > 0
            ? <MiniChart data={growthChartData} type="bar" color="#1D1D1F" height={180} />
            : <EmptyState title={t('empty.noData')} description={t('analytics.noGrowthData')} />
          }
        </Section>

        {/* Attendance Trend */}
        <Section title={t('analytics.attendanceTrend')} delay={0.15}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>}>
          {trendChartData.length > 0
            ? <MiniChart data={trendChartData} type="line" color="#0071E3" height={180} />
            : <EmptyState title={t('empty.noData')} description={t('analytics.noTrendData')} />
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
        <Section title={t('analytics.registrationFunnel')} delay={0.2}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>}>
          <FunnelChart data={funnel} />
        </Section>

        {/* Coach Performance */}
        <Section title={t('analytics.coachPerformance')} delay={0.25}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}>
          <CoachTable data={coaches} isMobile={isMobile} />
        </Section>
      </div>
    </div>
  );
}
