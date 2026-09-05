import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCoachPerformance, compareCoaches } from '../../api/coachPerformance';
import { useIsMobile } from '../../components/CrudTable';
import { PageHeader, Button } from '../../components/CrudTable';
import { Modal, ModalActions } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { getAvatarColor } from '../../components/ui/Cards';
import { cardStyle, labelStyle } from '../../components/ui/styles';

// Tinted rank circles for the top three, neutral inset for the rest.
const MEDAL_TINTS = [
  { bg: 'rgba(255,149,0,0.16)', text: '#A35A00' },
  { bg: '#F2F2F7', text: '#515154' },
  { bg: 'rgba(162,132,94,0.16)', text: '#7A5F3C' },
];

function RateBar({ rate, height = 6 }) {
  const color = rate >= 80 ? '#1E7A3B' : rate >= 60 ? '#A35A00' : '#B12A20';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
      <div style={{ flex: 1, height, background: '#E5E5EA', borderRadius: height / 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${Math.max(rate, 2)}%`,
          background: '#0071E3', borderRadius: height / 2, transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{
        color, fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)',
        lineHeight: 1, minWidth: 40, textAlign: 'end',
      }}>{rate}%</span>
    </div>
  );
}

function Stars({ rating }) {
  if (!rating) return <span style={{ color: '#86868B', fontSize: 13 }}>—</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: '#FF9500', fontSize: 13 }}>&#9733;</span>
      <span style={{ color: '#1D1D1F', fontSize: 13, fontWeight: 600 }}>{rating}/5</span>
    </span>
  );
}

function CoachCard({ coach, index, selected, onToggle, onClick }) {
  const isMedal = index < 3;
  const rankTint = MEDAL_TINTS[index] || { bg: '#F2F2F7', text: '#86868B' };
  const avatar = getAvatarColor(coach.coach_name);
  const initials = (coach.coach_name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
      style={{
        ...cardStyle,
        padding: '20px 22px',
        border: selected ? '2px solid #0071E3' : '1px solid #E5E5EA',
        cursor: 'pointer', transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
        animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
        position: 'relative',
      }}
    >
      {/* Checkbox */}
      <div
        onClick={e => { e.stopPropagation(); onToggle(); }}
        style={{
          position: 'absolute', top: 14, insetInlineEnd: 14,
          width: 22, height: 22, borderRadius: 11,
          border: `1.5px solid ${selected ? '#0071E3' : '#D2D2D7'}`,
          background: selected ? '#0071E3' : '#FFFFFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'background 0.15s ease, border-color 0.15s ease',
        }}
      >
        {selected && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        )}
      </div>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        {/* Rank */}
        <div style={{
          width: 32, height: 32, borderRadius: 16,
          background: rankTint.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isMedal ? rankTint.text : '#86868B',
          fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)',
          lineHeight: 1,
          flexShrink: 0,
        }}>{coach.rank}</div>

        {/* Avatar */}
        <div style={{
          width: 48, height: 48, borderRadius: 24,
          background: avatar.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: avatar.text,
          flexShrink: 0,
        }}>{initials}</div>

        {/* Name + stats */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: '#1D1D1F', fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)',
            lineHeight: 1.25, marginBottom: 5,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {coach.coach_name}
          </div>
          <div style={{
            color: '#6E6E73', fontSize: 12,
            display: 'flex', flexWrap: 'wrap', gap: 6,
          }}>
            <span>{coach.groups_count} groups</span>
            <span>·</span>
            <span>{coach.swimmers_count} swimmers</span>
            <span>·</span>
            <span>{coach.sessions_30d} sessions</span>
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ ...labelStyle, marginBottom: 8 }}>Attendance</div>
          <RateBar rate={coach.avg_attendance} />
        </div>

        <div style={{ flexShrink: 0 }}>
          <div style={{ ...labelStyle, marginBottom: 8 }}>Rating</div>
          <Stars rating={coach.avg_rating} />
        </div>

        {coach.at_risk_count > 0 && (
          <div style={{ flexShrink: 0, alignSelf: 'flex-end', paddingBottom: 2 }}>
            <Badge variant="warning">{coach.at_risk_count} at risk</Badge>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Compare Modal ─── */
function CompareModal({ coaches, onClose }) {
  const { t } = useTranslation();
  const rows = [
    { label: 'Attendance %', key: 'avg_attendance', format: v => `${v}%`, best: 'max' },
    { label: 'Avg Rating', key: 'avg_rating', format: v => v ? `${v}/5` : '—', best: 'max' },
    { label: 'Sessions/mo', key: 'sessions_30d', format: v => v, best: 'max' },
    { label: 'At Risk', key: 'at_risk_count', format: v => v, best: 'min' },
    { label: 'Swimmers', key: 'swimmers_count', format: v => v, best: 'max' },
    { label: 'Groups', key: 'groups_count', format: v => v, best: 'max' },
  ];

  return (
    <Modal title="Compare Coaches" onClose={onClose}>
      <div style={{ overflowX: 'auto', border: '1px solid #E5E5EA', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: 'start' }}>Metric</th>
              {coaches.map(c => (
                <th key={c.coach_id} style={{ ...thStyle, textAlign: 'center' }}>{c.coach_name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const values = coaches.map(c => c[row.key] ?? 0);
              const bestVal = row.best === 'max' ? Math.max(...values) : Math.min(...values);
              return (
                <tr key={row.key}>
                  <td style={{
                    ...tdStyle,
                    borderBottom: ri < rows.length - 1 ? '1px solid #F2F2F7' : 'none',
                    color: '#6E6E73', fontSize: 13,
                  }}>{row.label}</td>
                  {coaches.map((c) => {
                    const val = c[row.key] ?? 0;
                    const isBest = val === bestVal && values.filter(v => v === bestVal).length < values.length;
                    return (
                      <td key={c.coach_id} style={{
                        ...tdStyle,
                        borderBottom: ri < rows.length - 1 ? '1px solid #F2F2F7' : 'none',
                        textAlign: 'center',
                        color: isBest ? '#1E7A3B' : '#1D1D1F',
                        fontWeight: isBest ? 600 : 400,
                      }}>
                        {row.format(c[row.key])}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ModalActions>
        <Button variant="secondary" onClick={onClose}>{t('actions.close')}</Button>
      </ModalActions>
    </Modal>
  );
}

const thStyle = {
  padding: '11px 16px',
  ...labelStyle,
  borderBottom: '1px solid #E5E5EA',
  background: '#FAFAFC',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '12px 16px', fontSize: 14,
  borderBottom: '1px solid #F2F2F7',
};

/* ─── Main Page ─── */
export default function CoachPerformancePage() {
  const { t } = useTranslation();
  const [coaches, setCoaches] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [compareData, setCompareData] = useState(null);
  const [comparing, setComparing] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    getCoachPerformance()
      .then(setCoaches)
      .catch(() => setError('Failed to load coach performance'));
  }, []);

  const toggleSelect = (userId) => {
    setSelected(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : prev.length < 5 ? [...prev, userId] : prev
    );
  };

  const handleCompare = async () => {
    if (selected.length < 2) return;
    setComparing(true);
    try {
      const data = await compareCoaches(selected);
      setCompareData(data);
    } catch {
      setError('Failed to load comparison');
    } finally {
      setComparing(false);
    }
  };

  if (error && !coaches) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#B12A20' }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{error}</div>
        <button type="button" className="pl-btn pl-btn-secondary pl-btn-sm" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!coaches) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#6E6E73' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 16,
            border: '2px solid #E5E5EA', borderTopColor: '#0071E3',
            animation: 'spin 1s linear infinite', margin: '0 auto 12px',
          }} />
          <div style={{ fontSize: 13, color: '#6E6E73' }}>{t('loading.default')}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Coach Performance">
        {selected.length >= 2 && (
          <Button onClick={handleCompare} disabled={comparing}>
            {comparing ? 'Comparing...' : `Compare Selected (${selected.length})`}
          </Button>
        )}
      </PageHeader>

      {coaches.length === 0 ? (
        <div style={{
          ...cardStyle,
          textAlign: 'center', padding: '60px 32px', color: '#6E6E73',
        }}>
          <div style={{
            width: 52, height: 52, margin: '0 auto 14px', borderRadius: 14,
            background: '#F2F2F7', color: '#86868B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div style={{
            fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600,
            letterSpacing: '-0.02em', lineHeight: 1.2,
            color: '#1D1D1F', marginBottom: 6,
          }}>No coaches found</div>
          <div style={{ fontSize: 13, color: '#6E6E73' }}>Add coaches to view their performance</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(420px, 1fr))', gap: 14 }}>
          {coaches.map((coach, i) => (
            <CoachCard
              key={coach.coach_id}
              coach={coach}
              index={i}
              selected={selected.includes(coach.user_id)}
              onToggle={() => toggleSelect(coach.user_id)}
              onClick={() => navigate(`/club/coaches/${coach.user_id}/performance`)}
            />
          ))}
        </div>
      )}

      {compareData && (
        <CompareModal coaches={compareData} onClose={() => setCompareData(null)} />
      )}
    </div>
  );
}
