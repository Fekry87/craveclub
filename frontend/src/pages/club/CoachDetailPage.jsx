import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCoachDetail } from '../../api/coachPerformance';
import { useIsMobile } from '../../components/CrudTable';

function StatCard({ label, value, color }) {
  return (
    <div style={{
      flex: 1, minWidth: 90,
      background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.3)',
      borderRadius: 14, padding: '16px 14px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 5 }}>{label}</div>
    </div>
  );
}

function Section({ title, badge, badgeColor, children }) {
  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(13,31,60,0.55) 0%, rgba(10,22,40,0.35) 100%)',
      borderRadius: 20, padding: '22px 24px',
      border: '1px solid rgba(34,211,238,0.06)',
      marginBottom: 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{title}</h3>
        {badge !== undefined && badge > 0 && (
          <span style={{
            padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: `${badgeColor || '#f87171'}15`, color: badgeColor || '#f87171',
          }}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ─── Attendance Trend Line Chart ─── */
function AttendanceChart({ data }) {
  if (!data?.length) return <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: 32 }}>No data</div>;
  const h = 160;
  const w = 100;
  const max = 100; // Percentage scale
  const refY = h - (80 / max) * (h - 10) - 5;

  const points = data.map((d, i) => {
    const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
    const y = h - (d.rate / max) * (h - 10) - 5;
    return { x, y, ...d };
  });
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const area = `0,${h} ${polyline} ${w},${h}`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: h }}>
        <defs>
          <linearGradient id="att-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* 80% reference line */}
        <line x1="0" y1={refY} x2={w} y2={refY} stroke="rgba(74,222,128,0.2)" strokeWidth="0.5" strokeDasharray="2,2" vectorEffect="non-scaling-stroke" />
        <polygon points={area} fill="url(#att-area)" />
        <polyline points={polyline} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.8" fill="#a78bfa" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, padding: '0 2px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>{d.rate}%</div>
            <div style={{ color: '#475569', fontSize: 9 }}>{d.week?.slice(-3)}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <div style={{ width: 16, height: 1, background: 'rgba(74,222,128,0.4)', borderStyle: 'dashed' }} />
        <span style={{ color: '#475569', fontSize: 10 }}>80% target</span>
      </div>
    </div>
  );
}

/* ─── Rating Distribution ─── */
function RatingDistribution({ dist }) {
  if (!dist) return null;
  const max = Math.max(...Object.values(dist), 1);
  const ratings = [5, 4, 3, 2, 1];
  const colors = { 5: '#4ade80', 4: '#2dd4bf', 3: '#fbbf24', 2: '#fb923c', 1: '#f87171' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {ratings.map(r => (
        <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#fbbf24', fontSize: 12, width: 26, textAlign: 'right' }}>{r}&#9733;</span>
          <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'rgba(51,65,85,0.2)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 5,
              width: `${(dist[r] / max) * 100}%`,
              background: colors[r],
              transition: 'width 0.6s ease-out',
              minWidth: dist[r] > 0 ? 4 : 0,
            }} />
          </div>
          <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, minWidth: 28, textAlign: 'right' }}>{dist[r]}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Top Swimmers ─── */
function TopSwimmers({ swimmers }) {
  if (!swimmers?.length) return <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: 24 }}>No evaluations yet</div>;

  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
      {swimmers.map((s, i) => (
        <div key={s.swimmer_id} style={{
          minWidth: 140, flex: '0 0 auto',
          background: 'rgba(6,13,31,0.3)', borderRadius: 14, padding: '14px 16px',
          border: '1px solid rgba(51,65,85,0.15)', textAlign: 'center',
        }}>
          <div style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>#{i + 1}</div>
          <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 4 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <span key={star} style={{ color: star <= Math.round(s.avg_rating) ? '#fbbf24' : '#334155', fontSize: 11 }}>&#9733;</span>
            ))}
          </div>
          <div style={{ color: '#94a3b8', fontSize: 11 }}>{s.avg_rating}/5 · {s.attendance_rate}%</div>
        </div>
      ))}
    </div>
  );
}

/* ─── At-Risk Swimmers ─── */
function AtRiskSwimmers({ swimmers, isMobile }) {
  if (!swimmers?.length) return <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: 24 }}>No at-risk swimmers</div>;

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {swimmers.map(s => (
          <div key={s.swimmer_id} style={{
            background: 'rgba(6,13,31,0.3)', borderRadius: 12, padding: '12px 14px',
            border: '1px solid rgba(248,113,113,0.1)',
          }}>
            <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{s.name}</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <span style={{ color: '#f87171', fontSize: 14, fontWeight: 700 }}>{s.attendance_rate}%</span>
                <span style={{ color: '#475569', fontSize: 10, marginLeft: 4 }}>attendance</span>
              </div>
              {s.last_seen && (
                <div style={{ color: '#475569', fontSize: 11 }}>Last: {s.last_seen}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(248,113,113,0.1)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Name', 'Attendance', 'Last Seen'].map(h => (
              <th key={h} style={{
                textAlign: 'start', padding: '8px 14px', color: '#64748b', fontSize: 10,
                textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600,
                borderBottom: '1px solid rgba(51,65,85,0.2)', background: 'rgba(6,13,31,0.4)',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {swimmers.map(s => (
            <tr key={s.swimmer_id}>
              <td style={{ padding: '10px 14px', color: '#e2e8f0', fontSize: 13, fontWeight: 500, borderBottom: '1px solid rgba(51,65,85,0.12)' }}>{s.name}</td>
              <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(51,65,85,0.12)' }}>
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>{s.attendance_rate}%</span>
              </td>
              <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 12, borderBottom: '1px solid rgba(51,65,85,0.12)' }}>{s.last_seen || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Main Page ─── */
export default function CoachDetailPage() {
  const { t } = useTranslation();
  const { coachId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    getCoachDetail(coachId)
      .then(setData)
      .catch(() => setError('Failed to load coach details'));
  }, [coachId]);

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <button type="button" onClick={() => navigate('/club/coaches/performance')} style={backBtnStyle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div style={{ textAlign: 'center', padding: 40, color: '#ef4444' }}>{error}</div>
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
          <div style={{ fontSize: 14, fontWeight: 500 }}>{t('loading.default')}</div>
        </div>
      </div>
    );
  }

  const { coach } = data;
  const initials = (coach.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Back button */}
      <button type="button" onClick={() => navigate('/club/coaches/performance')} style={backBtnStyle}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        Back to Performance
      </button>

      {/* Profile header */}
      <div style={{
        background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(51,65,85,0.3)',
        borderRadius: 18, padding: 24, marginBottom: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: '#22d3ee',
            flexShrink: 0,
          }}>{initials}</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#f1f5f9' }}>{coach.name}</h2>
            {coach.specialization && (
              <div style={{ color: '#22d3ee', fontSize: 12, fontWeight: 600, marginTop: 2 }}>{coach.specialization}</div>
            )}
            {coach.bio && (
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{coach.bio}</div>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <StatCard label="Groups" value={coach.groups_count} color="#22d3ee" />
          <StatCard label="Swimmers" value={coach.swimmers_count} color="#2dd4bf" />
          <StatCard label="Sessions (30d)" value={coach.sessions_completed_30d} color="#a78bfa" />
        </div>
      </div>

      {/* Charts grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 18, marginBottom: 18,
      }}>
        <Section title="Attendance Trend">
          <AttendanceChart data={data.attendance_by_week} />
        </Section>

        <Section title="Rating Distribution">
          <RatingDistribution dist={data.swimmer_rating_distribution} />
        </Section>
      </div>

      {/* Top Swimmers */}
      <Section title="Top Swimmers">
        <TopSwimmers swimmers={data.top_swimmers} />
      </Section>

      {/* At-Risk Swimmers */}
      <Section title="At-Risk Swimmers" badge={data.at_risk_swimmers?.length} badgeColor="#f87171">
        <AtRiskSwimmers swimmers={data.at_risk_swimmers} isMobile={isMobile} />
      </Section>
    </div>
  );
}

const backBtnStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'none', border: 'none', color: '#94a3b8',
  fontSize: 13, fontWeight: 500, cursor: 'pointer',
  padding: '8px 0', marginBottom: 16,
};
