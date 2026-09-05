import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { PageHeader, useIsMobile } from '../../components/CrudTable';
import { useTranslation } from 'react-i18next';

/* ───── Shared idiom tokens ───── */
const monoLabel = {
  fontFamily: 'var(--font-body)', fontSize: 12, color: '#6E6E73',
};
const displayHeading = {
  fontFamily: 'var(--font-display)', fontWeight: 600,
  letterSpacing: '-0.02em', lineHeight: 1,
};

const STAR_PATH = 'M10 1.5l2.47 5.01L18 7.27l-4 3.9.94 5.5L10 14.14 5.06 16.67l.94-5.5-4-3.9 5.53-.76L10 1.5z';

function ratingTone(rating) {
  return rating >= 3 ? '#1D1D1F' : rating >= 2 ? '#FF9500' : '#FF3B30';
}
function ratingLabelFor(rating) {
  return rating >= 5 ? 'Excellent' : rating >= 4 ? 'Great' : rating >= 3 ? 'Good' : rating >= 2 ? 'Fair' : 'Needs Work';
}

function Pill({ color, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 8px',
      fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
      letterSpacing: '-0.02em', lineHeight: '14px',
      background: 'transparent', border: `1px solid ${color}`, color,
      whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

/* ───── Star Rating ───── */
function StarRating({ value, size = 18 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(r => {
        const filled = value >= r;
        const half = !filled && value >= r - 0.5;
        return (
          <svg key={r} width={size} height={size} viewBox="0 0 20 20">
            <path
              d={STAR_PATH}
              fill={filled ? '#1D1D1F' : half ? '#AEAEB2' : '#E5E5EA'}
              stroke={filled || half ? '#1D1D1F' : '#E5E5EA'}
              strokeWidth="1"
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

  const ratingLabel = ratingLabelFor(evaluation.rating);
  const ratingColor = ratingTone(evaluation.rating);

  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        display: 'flex', alignItems: 'center', gap: 20, padding: '18px 22px',
        background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        transition: 'border-color 0.15s ease',
        animation: `fadeInUp 0.3s ease-out ${index * 0.04}s both`,
      }}
    >
      {/* Date block */}
      <div style={{ borderRadius: 16,
        width: 60, height: 66, flexShrink: 0,
        background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ ...monoLabel, fontSize: 10 }}>{dayName}</div>
        <div style={{ color: '#1D1D1F', fontSize: 22, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{dayNum}</div>
        <div style={{ ...monoLabel, fontSize: 9, color: '#86868B' }}>{monthStr}</div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ ...displayHeading, color: '#1D1D1F', fontSize: 16 }}>
            {evaluation.session?.group?.name || 'Training Session'}
          </span>
          <Pill color={ratingColor}>{ratingLabel}</Pill>
        </div>
        {evaluation.notes ? (
          <div style={{
            color: '#515154', fontSize: 13, lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>{evaluation.notes}</div>
        ) : (
          <div style={{ ...monoLabel, fontSize: 10, color: '#6E6E73' }}>No notes from coach</div>
        )}
      </div>

      {/* Star rating + score */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <StarRating value={evaluation.rating} size={18} />
        <div style={{
          color: '#1D1D1F', fontSize: 22, fontWeight: 500,
          fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1,
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

  const ratingLabel = ratingLabelFor(evaluation.rating);
  const ratingColor = ratingTone(evaluation.rating);

  return (
    <div style={{
      padding: '18px 20px', background: '#FFFFFF',
      border: '1px solid #E5E5EA',
      borderInlineStart: '1px solid #E5E5EA',
      animation: `fadeInUp 0.3s ease-out ${index * 0.04}s both`,
    }}>
      {/* Top row: group name + rating */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ ...displayHeading, color: '#1D1D1F', fontSize: 16, marginBottom: 8 }}>
            {evaluation.session?.group?.name || 'Training Session'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ ...monoLabel, fontSize: 10, color: '#86868B' }}>{formattedDate}</span>
            <Pill color={ratingColor}>{ratingLabel}</Pill>
          </div>
        </div>
        <div style={{
          color: '#1D1D1F', fontSize: 26, fontWeight: 500,
          fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1, flexShrink: 0,
        }}>
          {evaluation.rating}.0
        </div>
      </div>

      {/* Stars */}
      <div style={{ marginBottom: evaluation.notes ? 12 : 0 }}>
        <StarRating value={evaluation.rating} size={16} />
      </div>

      {/* Notes */}
      {evaluation.notes && (
        <div style={{
          color: '#515154', fontSize: 13, lineHeight: 1.5, paddingTop: 12,
          borderTop: '1px solid #E5E5EA',
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
      animation: 'fadeIn 0.25s ease-out',
    }}>
      {/* Left: big rating */}
      <div style={{ borderRadius: 16,
        padding: isMobile ? '18px 20px' : '24px 30px', background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        display: 'flex', alignItems: 'center', gap: isMobile ? 16 : 20,
        flex: isMobile ? 'none' : '0 0 auto',
      }}>
        <div style={{
          fontSize: isMobile ? 42 : 48, fontWeight: 500, fontFamily: 'var(--font-display)',
          letterSpacing: '-0.02em', color: '#0071E3', lineHeight: 1,
        }}>{avgRating}</div>
        <div>
          <div style={{ ...monoLabel, color: '#86868B', marginBottom: 8 }}>Average Rating</div>
          <div style={{ ...monoLabel, fontSize: 10, color: '#6E6E73' }}>
            {count} evaluation{count !== 1 ? 's' : ''}{bestRating ? ` · Best ${bestRating}.0` : ''}
          </div>
        </div>
      </div>

      {/* Right: distribution bars */}
      <div style={{ borderRadius: 16,
        flex: 1, padding: isMobile ? '16px 18px' : '18px 24px', background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6,
      }}>
        {[5,4,3,2,1].map(rating => (
          <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ ...monoLabel, fontSize: 10, width: 12, textAlign: 'end' }}>{rating}</span>
            <svg width="12" height="12" viewBox="0 0 20 20">
              <path d={STAR_PATH}
                fill={distribution[rating-1] > 0 ? '#1D1D1F' : '#E5E5EA'}
                stroke={distribution[rating-1] > 0 ? '#1D1D1F' : '#E5E5EA'} strokeWidth="1"
              />
            </svg>
            <div style={{ flex: 1, height: 6, background: '#EDEDF0', overflow: 'hidden' }}>
              <div style={{
                width: `${(distribution[rating-1] / maxDist) * 100}%`, height: '100%', background: '#FFFFFF',
                transition: 'width 0.8s ease-out',
              }} />
            </div>
            <span style={{ ...monoLabel, fontSize: 10, color: '#86868B', width: 16, textAlign: 'end' }}>
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
  const { t } = useTranslation();
  const [evaluations, setEvaluations] = useState([]);
  const isMobile = useIsMobile();
  useEffect(() => { api.get('/swimmer/evaluations').then(r => setEvaluations(r.data.data || [])).catch(() => {}); }, []);

  return (
    <div>
      <PageHeader title={t('nav.myEvaluations')} />

      {/* Summary */}
      <EvaluationSummary evaluations={evaluations} isMobile={isMobile} />

      {/* Evaluation list */}
      <div style={{ borderRadius: 16,
        background: '#FFFFFF',
        padding: isMobile ? '22px 18px' : '28px 30px',
        border: '1px solid #E5E5EA',
        animation: 'fadeInUp 0.4s ease-out',
      }}>
        {/* Section header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          paddingBottom: 14, marginBottom: 20, borderBottom: '1px solid #E5E5EA',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: '#0071E3', display: 'inline-block', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ ...displayHeading, margin: 0, color: '#1D1D1F', fontSize: 18 }}>
              Evaluation History
            </h2>
            <div style={{ ...monoLabel, fontSize: 10, color: '#86868B', marginTop: 6 }}>
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
            <div style={{ textAlign: 'center', padding: '50px 20px' }}>
              <div style={{ borderRadius: 16,
                width: 72, height: 72, background: '#FFFFFF',
                border: '1px solid #E5E5EA',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div style={{ ...displayHeading, color: '#1D1D1F', fontSize: 16, marginBottom: 10 }}>{t('empty.noData')}</div>
              <div style={{ color: '#6E6E73', fontSize: 13, maxWidth: 280, margin: '0 auto' }}>{t('empty.itemsWillAppear')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
