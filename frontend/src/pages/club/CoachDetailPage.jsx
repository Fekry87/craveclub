import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCoachDetail } from '../../api/coachPerformance';
import { useIsMobile } from '../../components/CrudTable';

function StatCard({ label, value, color }) {
  return (
    <div style={{ borderRadius: 16,
      flex: 1, minWidth: 90,
      background: '#FFFFFF', border: '1px solid #E5E5EA',
      padding: '16px 14px', textAlign: 'center',
    }}>
      <div style={{
        fontSize: 28, fontWeight: 500, fontFamily: 'var(--font-display)',
        letterSpacing: '-0.02em', color: color || '#1D1D1F', lineHeight: 1,
      }}>{value}</div>
      <div style={{
        fontSize: 11, fontFamily: 'var(--font-body)', color: '#6E6E73', marginTop: 8,
      }}>{label}</div>
    </div>
  );
}

function Section({ title, badge, badgeColor, children }) {
  return (
    <div style={{ borderRadius: 16,
      background: '#FFFFFF',
      padding: '22px 24px',
      border: '1px solid #E5E5EA',
      marginBottom: 18,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #E5E5EA',
      }}>
        <h3 style={{
          margin: 0, color: '#1D1D1F', fontSize: 16, fontWeight: 500,
          fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1,
        }}>{title}</h3>
        {badge !== undefined && badge > 0 && (
          <span style={{
            padding: '2px 8px', fontSize: 10, fontFamily: 'var(--font-body)',
            letterSpacing: '-0.02em',
            background: 'transparent', border: `1px solid ${badgeColor || '#FF3B30'}`,
            color: badgeColor || '#FF3B30',
          }}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ─── Attendance Trend Line Chart ─── */
function AttendanceChart({ data }) {
  if (!data?.length) return <div style={{ color: '#86868B', fontSize: 11, fontFamily: 'var(--font-body)', textAlign: 'center', padding: 32 }}>No data</div>;
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
        {/* 80% reference line */}
        <line x1="0" y1={refY} x2={w} y2={refY} stroke="#AEAEB2" strokeWidth="0.5" strokeDasharray="2,2" vectorEffect="non-scaling-stroke" />
        <polygon points={area} fill="rgba(29,29,31,0.04)" />
        <polyline points={polyline} fill="none" stroke="#1D1D1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <rect key={i} x={p.x - 0.9} y={p.y - 0.9} width="1.8" height="1.8" fill="#0071E3" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, padding: '0 2px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ color: '#1D1D1F', fontSize: 11, fontFamily: 'var(--font-body)',}}>{d.rate}%</div>
            <div style={{ color: '#86868B', fontSize: 10, fontFamily: 'var(--font-body)',}}>{d.week?.slice(-3)}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <div style={{ width: 16, height: 1, background: '#AEAEB2' }} />
        <span style={{
          color: '#6E6E73', fontSize: 10, fontFamily: 'var(--font-body)',
        }}>80% target</span>
      </div>
    </div>
  );
}

/* ─── Rating Distribution ─── */
function RatingDistribution({ dist }) {
  if (!dist) return null;
  const max = Math.max(...Object.values(dist), 1);
  const ratings = [5, 4, 3, 2, 1];
  const colors = { 5: '#34C759', 4: '#1D1D1F', 3: '#FF9500', 2: '#FF9500', 1: '#FF3B30' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {ratings.map(r => (
        <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#FF9500', fontSize: 12, width: 26, textAlign: 'end' }}>{r}&#9733;</span>
          <div style={{ flex: 1, height: 6, background: '#EDEDF0', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${(dist[r] / max) * 100}%`,
              background: colors[r],
              transition: 'width 0.6s ease-out',
              minWidth: dist[r] > 0 ? 4 : 0,
            }} />
          </div>
          <span style={{
            color: '#1D1D1F', fontSize: 12, fontFamily: 'var(--font-body)', minWidth: 28, textAlign: 'end',
          }}>{dist[r]}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Top Swimmers ─── */
function TopSwimmers({ swimmers }) {
  if (!swimmers?.length) return <div style={{ color: '#86868B', fontSize: 11, fontFamily: 'var(--font-body)', textAlign: 'center', padding: 24 }}>No evaluations yet</div>;

  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
      {swimmers.map((s, i) => (
        <div key={s.swimmer_id} style={{ borderRadius: 16,
          minWidth: 140, flex: '0 0 auto',
          background: '#FFFFFF', padding: '14px 16px',
          border: '1px solid #E5E5EA', textAlign: 'center',
        }}>
          <div style={{
            color: '#1D1D1F', fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600,
            letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{s.name}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 4 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <span key={star} style={{ color: star <= Math.round(s.avg_rating) ? '#FF9500' : '#AEAEB2', fontSize: 11 }}>&#9733;</span>
            ))}
          </div>
          <div style={{
            color: '#6E6E73', fontSize: 11, fontFamily: 'var(--font-body)',
          }}>{s.avg_rating}/5 · {s.attendance_rate}%</div>
        </div>
      ))}
    </div>
  );
}

/* ─── At-Risk Swimmers ─── */
function AtRiskSwimmers({ swimmers, isMobile }) {
  if (!swimmers?.length) return <div style={{ color: '#86868B', fontSize: 11, fontFamily: 'var(--font-body)', textAlign: 'center', padding: 24 }}>No at-risk swimmers</div>;

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {swimmers.map(s => (
          <div key={s.swimmer_id} style={{ borderRadius: 16,
            background: '#FFFFFF', padding: '12px 14px',
            border: '1px solid #E5E5EA', borderInlineStart: '3px solid #FF3B30',
          }}>
            <div style={{
              color: '#1D1D1F', fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600,
              letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8,
            }}>{s.name}</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
              <div>
                <span style={{
                  color: '#FF3B30', fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600,
                  letterSpacing: '-0.02em',
                }}>{s.attendance_rate}%</span>
                <span style={{
                  color: '#6E6E73', fontSize: 10, fontFamily: 'var(--font-body)', marginInlineStart: 6,
                }}>attendance</span>
              </div>
              {s.last_seen && (
                <div style={{
                  color: '#6E6E73', fontSize: 11, fontFamily: 'var(--font-body)',
                }}>Last: {s.last_seen}</div>
              )}
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
            {['Name', 'Attendance', 'Last Seen'].map(h => (
              <th key={h} style={{
                textAlign: 'start', padding: '10px 14px', color: '#6E6E73', fontSize: 11, fontWeight: 500,
                fontFamily: 'var(--font-body)',
                borderBottom: '1px solid #E5E5EA', background: '#FFFFFF',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {swimmers.map(s => (
            <tr key={s.swimmer_id}>
              <td style={{ padding: '10px 14px', color: '#1D1D1F', fontSize: 13, fontWeight: 500, borderBottom: '1px solid #E5E5EA' }}>{s.name}</td>
              <td style={{ padding: '10px 14px', borderBottom: '1px solid #E5E5EA' }}>
                <span style={{
                  padding: '2px 8px', fontSize: 10, fontFamily: 'var(--font-body)',
                  background: 'transparent', border: '1px solid #FF3B30', color: '#FF3B30',
                }}>{s.attendance_rate}%</span>
              </td>
              <td style={{ padding: '10px 14px', color: '#515154', fontSize: 12, borderBottom: '1px solid #E5E5EA' }}>{s.last_seen || '—'}</td>
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div style={{ textAlign: 'center', padding: 40, color: '#FF3B30' }}>{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#6E6E73' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 32, height: 32, border: '2px solid #E5E5EA', borderTopColor: '#1D1D1F',
            animation: 'spin 1s linear infinite', margin: '0 auto 12px',
          }} />
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 12, color: '#6E6E73',
          }}>{t('loading.default')}</div>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        Back to Performance
      </button>

      {/* Profile header */}
      <div style={{ borderRadius: 16,
        background: '#FFFFFF', border: '1px solid #E5E5EA',
        padding: 24, marginBottom: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          <div style={{ borderRadius: 14,
            width: 56, height: 56, background: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500, color: '#1D1D1F',
            letterSpacing: '-0.02em',
            flexShrink: 0,
          }}>{initials}</div>
          <div>
            <h2 style={{
              margin: 0, fontSize: 28, fontWeight: 500, fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em', lineHeight: 1, color: '#1D1D1F',
            }}>{coach.name}</h2>
            {coach.specialization && (
              <div style={{
                color: '#6E6E73', fontSize: 11, fontFamily: 'var(--font-body)', marginTop: 8,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: '#0071E3', display: 'inline-block' }} />
                {coach.specialization}
              </div>
            )}
            {coach.bio && (
              <div style={{ color: '#515154', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{coach.bio}</div>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <StatCard label="Groups" value={coach.groups_count} color="#1D1D1F" />
          <StatCard label="Swimmers" value={coach.swimmers_count} color="#1D1D1F" />
          <StatCard label="Sessions (30d)" value={coach.sessions_completed_30d} color="#1D1D1F" />
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
      <Section title="At-Risk Swimmers" badge={data.at_risk_swimmers?.length} badgeColor="#FF3B30">
        <AtRiskSwimmers swimmers={data.at_risk_swimmers} isMobile={isMobile} />
      </Section>
    </div>
  );
}

const backBtnStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: 'none', border: 'none', color: '#6E6E73',
  fontSize: 11, fontFamily: 'var(--font-body)', cursor: 'pointer',
  padding: '8px 0', marginBottom: 16,
};
