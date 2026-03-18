import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoachPerformance, compareCoaches } from '../../api/coachPerformance';
import { useIsMobile } from '../../components/CrudTable';
import { PageHeader, Button } from '../../components/CrudTable';
import { Modal, ModalActions } from '../../components/ui/Modal';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

function getAvatarColor(name) {
  const colors = [
    { bg: 'rgba(34,211,238,0.15)', text: '#22d3ee' },
    { bg: 'rgba(45,212,191,0.15)', text: '#2dd4bf' },
    { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa' },
    { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' },
    { bg: 'rgba(248,113,113,0.15)', text: '#f87171' },
  ];
  const idx = (name || '').charCodeAt(0) % colors.length;
  return colors[idx];
}

function RateBar({ rate, height = 8 }) {
  const color = rate >= 80 ? '#4ade80' : rate >= 60 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
      <div style={{ flex: 1, height, borderRadius: height / 2, background: 'rgba(51,65,85,0.25)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(rate, 2)}%`, borderRadius: height / 2, background: `linear-gradient(90deg, ${color}, ${color}90)`, transition: 'width 0.6s ease-out' }} />
      </div>
      <span style={{ color, fontSize: 13, fontWeight: 700, fontFamily: "'Outfit', sans-serif", minWidth: 40, textAlign: 'right' }}>{rate}%</span>
    </div>
  );
}

function Stars({ rating }) {
  if (!rating) return <span style={{ color: '#475569', fontSize: 12 }}>—</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: '#fbbf24', fontSize: 13 }}>&#9733;</span>
      <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{rating}/5</span>
    </span>
  );
}

function CoachCard({ coach, index, selected, onToggle, onClick }) {
  const isMedal = index < 3;
  const medalColor = MEDAL_COLORS[index] || '#526280';
  const avatar = getAvatarColor(coach.coach_name);
  const initials = (coach.coach_name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = selected ? 'rgba(34,211,238,0.3)' : 'rgba(34,211,238,0.06)'; e.currentTarget.style.transform = 'none'; }}
      style={{
        background: selected
          ? 'linear-gradient(145deg, rgba(34,211,238,0.08) 0%, rgba(13,31,60,0.5) 100%)'
          : 'linear-gradient(145deg, rgba(13,31,60,0.55) 0%, rgba(10,22,40,0.35) 100%)',
        borderRadius: 18, padding: '20px 22px',
        border: `1px solid ${selected ? 'rgba(34,211,238,0.3)' : 'rgba(34,211,238,0.06)'}`,
        cursor: 'pointer', transition: 'all 0.2s ease',
        animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
        position: 'relative',
      }}
    >
      {/* Checkbox */}
      <div
        onClick={e => { e.stopPropagation(); onToggle(); }}
        style={{
          position: 'absolute', top: 14, right: 14,
          width: 22, height: 22, borderRadius: 6,
          border: `2px solid ${selected ? '#22d3ee' : 'rgba(51,65,85,0.4)'}`,
          background: selected ? 'rgba(34,211,238,0.15)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s ease',
        }}
      >
        {selected && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
        )}
      </div>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        {/* Rank */}
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: isMedal ? `${medalColor}18` : 'rgba(51,65,85,0.2)',
          border: `1px solid ${isMedal ? `${medalColor}30` : 'rgba(51,65,85,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isMedal ? medalColor : '#526280',
          fontSize: 13, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
          flexShrink: 0,
        }}>#{coach.rank}</div>

        {/* Avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: 13,
          background: avatar.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: avatar.text,
          flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>{initials}</div>

        {/* Name + stats */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif", marginBottom: 3 }}>
            {coach.coach_name}
          </div>
          <div style={{ color: '#526280', fontSize: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
          <div style={{ color: '#64748b', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Attendance</div>
          <RateBar rate={coach.avg_attendance} />
        </div>

        <div style={{ flexShrink: 0 }}>
          <div style={{ color: '#64748b', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Rating</div>
          <Stars rating={coach.avg_rating} />
        </div>

        {coach.at_risk_count > 0 && (
          <div style={{
            padding: '4px 10px', borderRadius: 8,
            background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
            color: '#fbbf24', fontSize: 11, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            {coach.at_risk_count} at risk
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Compare Modal ─── */
function CompareModal({ coaches, onClose }) {
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
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: 'left' }}>Metric</th>
              {coaches.map(c => (
                <th key={c.coach_id} style={{ ...thStyle, textAlign: 'center' }}>{c.coach_name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const values = coaches.map(c => c[row.key] ?? 0);
              const bestVal = row.best === 'max' ? Math.max(...values) : Math.min(...values);
              return (
                <tr key={row.key}>
                  <td style={{ ...tdStyle, color: '#94a3b8', fontWeight: 600 }}>{row.label}</td>
                  {coaches.map((c, i) => {
                    const val = c[row.key] ?? 0;
                    const isBest = val === bestVal && values.filter(v => v === bestVal).length < values.length;
                    return (
                      <td key={c.coach_id} style={{
                        ...tdStyle, textAlign: 'center',
                        color: isBest ? '#4ade80' : '#e2e8f0',
                        fontWeight: isBest ? 700 : 400,
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
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </ModalActions>
    </Modal>
  );
}

const thStyle = {
  padding: '10px 14px', color: '#64748b', fontSize: 11,
  textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600,
  borderBottom: '1px solid rgba(51,65,85,0.2)', background: 'rgba(6,13,31,0.4)',
};

const tdStyle = {
  padding: '12px 14px', fontSize: 13,
  borderBottom: '1px solid rgba(51,65,85,0.12)',
};

/* ─── Main Page ─── */
export default function CoachPerformancePage() {
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
      <div style={{ textAlign: 'center', padding: 60, color: '#ef4444' }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{
          background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)',
          color: '#22d3ee', padding: '8px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>Retry</button>
      </div>
    );
  }

  if (!coaches) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#64748b' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 10 }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(34,211,238,0.2)" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Loading...</div>
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
          textAlign: 'center', padding: '60px 32px', color: '#475569',
          background: 'linear-gradient(135deg, rgba(13,31,60,0.35) 0%, rgba(10,22,40,0.2) 100%)',
          borderRadius: 20, border: '1px solid rgba(34,211,238,0.05)',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 12 }}>
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>No coaches found</div>
          <div style={{ fontSize: 13 }}>Add coaches to view their performance</div>
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
