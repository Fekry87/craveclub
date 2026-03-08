import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { PageHeader, useIsMobile } from '../../components/CrudTable';

/* ───── Star Rating ───── */
function StarRating({ value, size = 18 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(r => {
        const filled = value >= r;
        const half = !filled && value >= r - 0.5;
        return (
          <svg key={r} width={size} height={size} viewBox="0 0 20 20" style={{ transition: 'transform 0.2s', transform: filled ? 'scale(1)' : 'scale(0.9)' }}>
            <defs>
              <linearGradient id={`star-grad-${r}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.5l2.47 5.01L18 7.27l-4 3.9.94 5.5L10 14.14 5.06 16.67l.94-5.5-4-3.9 5.53-.76L10 1.5z"
              fill={filled ? `url(#star-grad-${r})` : half ? `url(#star-grad-${r})` : 'none'}
              stroke={filled || half ? '#fbbf24' : '#334155'}
              strokeWidth="1.2"
              opacity={filled ? 1 : half ? 0.5 : 0.35}
            />
          </svg>
        );
      })}
    </div>
  );
}

/* ───── Evaluation Card — Desktop ───── */
function EvaluationCardDesktop({ evaluation, index }) {
  const date = evaluation.session?.date?.split('T')[0];
  const dayName = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }) : '';
  const dayNum = date ? new Date(date + 'T00:00:00').getDate() : '';
  const monthStr = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }) : '';

  const ratingLabel = evaluation.rating >= 5 ? 'Excellent' : evaluation.rating >= 4 ? 'Great' : evaluation.rating >= 3 ? 'Good' : evaluation.rating >= 2 ? 'Fair' : 'Needs Work';
  const ratingColor = evaluation.rating >= 4 ? '#2dd4bf' : evaluation.rating >= 3 ? '#38bdf8' : evaluation.rating >= 2 ? '#fbbf24' : '#f87171';
  const ratingColorRgb = evaluation.rating >= 4 ? '45,212,191' : evaluation.rating >= 3 ? '56,189,248' : evaluation.rating >= 2 ? '251,191,36' : '248,113,113';

  return (
    <div
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `rgba(${ratingColorRgb},0.2)`;
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
        background: `linear-gradient(180deg, transparent, ${ratingColor}, transparent)`, borderRadius: 3,
      }} />

      {/* Date block */}
      <div style={{
        width: 60, height: 66, borderRadius: 14, flexShrink: 0,
        background: `linear-gradient(145deg, rgba(${ratingColorRgb},0.1) 0%, rgba(${ratingColorRgb},0.03) 100%)`,
        border: `1px solid rgba(${ratingColorRgb},0.12)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ color: ratingColor, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{dayName}</div>
        <div style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 800, fontFamily: "'Outfit', sans-serif", lineHeight: 1.1 }}>{dayNum}</div>
        <div style={{ color: '#64748b', fontSize: 9, fontWeight: 500, textTransform: 'uppercase' }}>{monthStr}</div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
            {evaluation.session?.group?.name || 'Training Session'}
          </span>
          <span style={{
            padding: '2px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
            background: `${ratingColor}12`, border: `1px solid ${ratingColor}20`,
            color: ratingColor, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>{ratingLabel}</span>
        </div>
        {evaluation.notes && (
          <div style={{
            color: '#94a3b8', fontSize: 13, lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>{evaluation.notes}</div>
        )}
        {!evaluation.notes && (
          <div style={{ color: '#475569', fontSize: 12, fontStyle: 'italic' }}>No notes from coach</div>
        )}
      </div>

      {/* Star rating + score */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <StarRating value={evaluation.rating} size={18} />
        <div style={{
          padding: '4px 14px', borderRadius: 10,
          background: `${ratingColor}10`, border: `1px solid ${ratingColor}18`,
          color: ratingColor, fontSize: 20, fontWeight: 800,
          fontFamily: "'Outfit', sans-serif",
        }}>
          {evaluation.rating}.0
        </div>
      </div>
    </div>
  );
}

/* ───── Evaluation Card — Mobile ───── */
function EvaluationCardMobile({ evaluation, index }) {
  const date = evaluation.session?.date?.split('T')[0];
  const formattedDate = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '';

  const ratingLabel = evaluation.rating >= 5 ? 'Excellent' : evaluation.rating >= 4 ? 'Great' : evaluation.rating >= 3 ? 'Good' : evaluation.rating >= 2 ? 'Fair' : 'Needs Work';
  const ratingColor = evaluation.rating >= 4 ? '#2dd4bf' : evaluation.rating >= 3 ? '#38bdf8' : evaluation.rating >= 2 ? '#fbbf24' : '#f87171';

  return (
    <div style={{
      padding: '18px 20px', borderRadius: 16,
      background: 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
      border: '1px solid rgba(34,211,238,0.06)',
      animation: `fadeInUp 0.4s ease-out ${0.05 + index * 0.04}s both`,
    }}>
      {/* Top row: group name + rating */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 3 }}>
            {evaluation.session?.group?.name || 'Training Session'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#475569', fontSize: 11 }}>{formattedDate}</span>
            <span style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
              background: `${ratingColor}15`, color: ratingColor,
            }}>{ratingLabel}</span>
          </div>
        </div>
        <div style={{
          padding: '6px 14px', borderRadius: 12,
          background: `${ratingColor}10`, border: `1px solid ${ratingColor}18`,
          color: ratingColor, fontSize: 22, fontWeight: 800,
          fontFamily: "'Outfit', sans-serif",
        }}>
          {evaluation.rating}.0
        </div>
      </div>

      {/* Stars */}
      <div style={{ marginBottom: evaluation.notes ? 10 : 0 }}>
        <StarRating value={evaluation.rating} size={16} />
      </div>

      {/* Notes */}
      {evaluation.notes && (
        <div style={{
          color: '#94a3b8', fontSize: 13, lineHeight: 1.5, paddingTop: 10,
          borderTop: '1px solid rgba(34,211,238,0.06)',
        }}>{evaluation.notes}</div>
      )}
    </div>
  );
}

/* ───── Summary Bar ───── */
function EvaluationSummary({ evaluations, isMobile }) {
  const count = evaluations.length;
  const avgRating = count > 0 ? (evaluations.reduce((sum, e) => sum + (e.rating || 0), 0) / count).toFixed(1) : null;
  const bestRating = count > 0 ? Math.max(...evaluations.map(e => e.rating || 0)) : null;
  const distribution = [0,0,0,0,0];
  evaluations.forEach(e => { if (e.rating >= 1 && e.rating <= 5) distribution[e.rating - 1]++; });
  const maxDist = Math.max(...distribution, 1);

  if (count === 0) return null;

  return (
    <div style={{
      display: 'flex', gap: isMobile ? 12 : 16, marginBottom: 24,
      flexDirection: isMobile ? 'column' : 'row',
      animation: 'fadeIn 0.3s ease-out',
    }}>
      {/* Left: big rating */}
      <div style={{
        padding: isMobile ? '18px 20px' : '24px 30px', borderRadius: 18,
        background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
        border: '1px solid rgba(45,212,191,0.1)',
        display: 'flex', alignItems: 'center', gap: isMobile ? 16 : 20,
        flex: isMobile ? 'none' : '0 0 auto',
      }}>
        <div style={{
          fontSize: isMobile ? 42 : 48, fontWeight: 800, fontFamily: "'Outfit', sans-serif",
          background: 'linear-gradient(135deg, #2dd4bf 0%, #38bdf8 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          lineHeight: 1,
        }}>{avgRating}</div>
        <div>
          <StarRating value={Number(avgRating)} size={16} />
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
            {count} evaluation{count !== 1 ? 's' : ''} {bestRating ? `· Best: ${bestRating}.0` : ''}
          </div>
        </div>
      </div>

      {/* Right: distribution bars */}
      <div style={{
        flex: 1, padding: isMobile ? '16px 18px' : '18px 24px', borderRadius: 18,
        background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
        border: '1px solid rgba(34,211,238,0.06)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5,
      }}>
        {[5,4,3,2,1].map(rating => (
          <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, width: 12, textAlign: 'right' }}>{rating}</span>
            <svg width="12" height="12" viewBox="0 0 20 20">
              <path d="M10 1.5l2.47 5.01L18 7.27l-4 3.9.94 5.5L10 14.14 5.06 16.67l.94-5.5-4-3.9 5.53-.76L10 1.5z"
                fill={distribution[rating-1] > 0 ? '#fbbf24' : 'none'} stroke={distribution[rating-1] > 0 ? '#fbbf24' : '#334155'} strokeWidth="1.2"
                opacity={distribution[rating-1] > 0 ? 0.8 : 0.3}
              />
            </svg>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(51,65,85,0.25)', overflow: 'hidden' }}>
              <div style={{
                width: `${(distribution[rating-1] / maxDist) * 100}%`, height: '100%', borderRadius: 3,
                background: 'linear-gradient(90deg, #fbbf24cc, #fbbf24)',
                transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              }} />
            </div>
            <span style={{ color: '#475569', fontSize: 10, fontWeight: 500, width: 16, textAlign: 'right' }}>
              {distribution[rating-1]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───── Main Page ───── */
export default function SwimmerEvaluations() {
  const [evaluations, setEvaluations] = useState([]);
  const isMobile = useIsMobile();
  useEffect(() => { api.get('/swimmer/evaluations').then(r => setEvaluations(r.data.data || [])).catch(() => {}); }, []);

  return (
    <div>
      <PageHeader title="My Evaluations" />

      {/* Summary */}
      <EvaluationSummary evaluations={evaluations} isMobile={isMobile} />

      {/* Evaluation list */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
        borderRadius: 22, padding: isMobile ? '22px 18px' : '28px 30px',
        border: '1px solid rgba(34,211,238,0.06)',
        animation: 'fadeInUp 0.5s ease-out',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.04) 100%)',
            border: '1px solid rgba(56,189,248,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
              Evaluation History
            </h2>
            <div style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>
              Your performance assessments from coaches
            </div>
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {evaluations.length > 0 ? evaluations.map((e, i) => (
            isMobile
              ? <EvaluationCardMobile key={e.id} evaluation={e} index={i} />
              : <EvaluationCardDesktop key={e.id} evaluation={e} index={i} />
          )) : (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#475569' }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(56,189,248,0.03) 100%)',
                border: '1px solid rgba(56,189,248,0.1)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div style={{ color: '#64748b', fontSize: 16, fontWeight: 600, fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>No evaluations yet</div>
              <div style={{ color: '#475569', fontSize: 13, maxWidth: 280, margin: '0 auto' }}>Your performance evaluations from coaches will appear here after sessions</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
