import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { Button, Modal, ModalActions, FormField, TextArea, useIsMobile, getAvatarColor } from '../../components/CrudTable';

const levelConfig = {
  'Beginner':     { color: '#FF9500' },
  'Intermediate': { color: '#515154' },
  'Advanced':     { color: '#1D1D1F' },
};

const labelMono = {
  fontFamily: 'var(--font-body)', fontSize: 12, color: '#6E6E73',
};

/* ───── Star Rating Input ───── */
function StarInput({ value, onChange, size = 36 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1,2,3,4,5].map(r => {
        const on = hover >= r || value >= r;
        const hot = hover >= r && hover > 0;
        return (
          <svg key={r} width={size} height={size} viewBox="0 0 24 24"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHover(r)} onMouseLeave={() => setHover(0)} onClick={() => onChange(r)}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={on ? (hot ? '#0071E3' : '#1D1D1F') : 'none'}
              stroke={on ? (hot ? '#0071E3' : '#1D1D1F') : '#AEAEB2'}
              strokeWidth="1.5" strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </div>
  );
}

/* ───── Star Display ───── */
function StarDisplay({ value, size = 16 }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1,2,3,4,5].map(r => (
        <svg key={r} width={size} height={size} viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={value >= r ? '#1D1D1F' : 'none'}
            stroke={value >= r ? '#1D1D1F' : '#AEAEB2'}
            strokeWidth="1.5" strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

/* ───── Stat Card ───── */
function StatCard({ label, value, icon, color, delay = 0, index }) {
  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        flex: '1 1 0', minWidth: 130,
        padding: '20px 22px',
        background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        transition: 'border-color 0.15s ease',
        display: 'flex', flexDirection: 'column', gap: 18,
        animation: `fadeInUp 0.3s ease-out ${delay}s both`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ ...labelMono, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ display: 'inline-flex', color: '#1D1D1F' }}>{icon}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        </div>
        
      </div>
      <div style={{
        color: color || '#1D1D1F', fontSize: 32, fontWeight: 500,
        fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1,
      }}>{value}</div>
    </div>
  );
}

/* ───── Evaluate Modal ───── */
function EvaluateModal({ swimmer, open, onClose, onSaved }) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setRating(0); setNotes(''); } }, [open]);

  const handleSave = async () => {
    if (rating < 1) return;
    setSaving(true);
    try {
      await api.post(`/coach/swimmers/${swimmer.id}/evaluate`, { rating, notes: notes || null });
      onSaved();
      onClose();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      title={`Evaluate ${swimmer.full_name || `${swimmer.first_name} ${swimmer.last_name}`}`}
      onClose={onClose}
      icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>}
    >
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ ...labelMono, marginBottom: 14 }}>How did this swimmer perform?</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <StarInput value={rating} onChange={setRating} size={40} />
        </div>
        {rating > 0 && (
          <div style={{
            marginTop: 12, fontSize: 18, fontWeight: 500,
            fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1,
            color: rating >= 4 ? '#34C759' : rating >= 2 ? '#FF9500' : '#FF3B30',
          }}>
            {['', 'Needs Work', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
          </div>
        )}
      </div>
      <FormField label="Coach Notes (optional)">
        <TextArea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any feedback for this swimmer..." rows={3} />
      </FormField>
      <ModalActions>
        <Button variant="secondary" onClick={onClose}>{t('actions.cancel')}</Button>
        <Button variant="primary" onClick={handleSave} disabled={rating < 1 || saving}>
          {saving ? t('loading.saving') : 'Save Evaluation'}
        </Button>
      </ModalActions>
    </Modal>
  );
}

/* ───── Main Page ───── */
export default function SwimmerDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evalOpen, setEvalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const load = () => {
    setLoading(true);
    api.get(`/coach/swimmers/${id}`).then(r => {
      setDetail(r.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#6E6E73' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5EA" strokeWidth="2" />
          <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <div style={labelMono}>Loading swimmer profile...</div>
      </div>
    </div>
  );

  if (!detail) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ ...labelMono, marginBottom: 12 }}>Swimmer not found</div>
      <Button onClick={() => navigate('/coach/swimmers')}>Back to Swimmers</Button>
    </div>
  );

  const { swimmer, stats, evaluations } = detail;
  const name = swimmer.full_name || `${swimmer.first_name} ${swimmer.last_name}`;
  const ac = getAvatarColor(name);
  const initials = `${swimmer.first_name?.[0] || ''}${swimmer.last_name?.[0] || ''}`.toUpperCase();
  const lc = levelConfig[swimmer.level] || levelConfig['Beginner'];

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, insetInlineEnd: 24, zIndex: 1000,
          padding: '12px 20px', background: '#FFFFFF', border: '1px solid #34C759',
          color: '#34C759', fontFamily: 'var(--font-body)', fontSize: 12,
          animation: 'fadeInUp 0.3s ease-out',
        }}>{toast}</div>
      )}

      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/coach/swimmers')}
        onMouseEnter={e => { e.currentTarget.style.color = '#1D1D1F'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#6E6E73'; }}
        style={{
          ...labelMono, background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'color 0.15s ease', padding: '4px 0', marginBottom: 20,
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Swimmers
      </button>

      {/* Hero Profile Card */}
      <div style={{ borderRadius: 16,
        background: '#FFFFFF',
        padding: 0,
        border: '1px solid #E5E5EA',
        marginBottom: 24,
        animation: 'fadeInUp 0.4s ease-out',
      }}>
        {/* Banner */}
        <div style={{
          height: isMobile ? 100 : 120, position: 'relative',
          background: '#FFFFFF',
        }} />

        {/* Avatar + Info */}
        <div style={{
          padding: isMobile ? '0 20px 28px' : '0 36px 32px',
          marginTop: -50, position: 'relative', zIndex: 2,
        }}>
          <div style={{ display: 'flex', alignItems: isMobile ? 'center' : 'flex-end', gap: isMobile ? 16 : 24, flexDirection: isMobile ? 'column' : 'row' }}>
            {/* Avatar */}
            <div style={{
              width: 100, height: 100, flexShrink: 0,
              background: ac.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 500,
              fontFamily: 'var(--font-body)', letterSpacing: '-0.02em', color: ac.text,
              border: '1px solid #E5E5EA',
              }}>{initials}</div>

            {/* Name & Meta */}
            <div style={{ flex: 1, minWidth: 0, textAlign: isMobile ? 'center' : 'start' }}>
              <h1 style={{
                margin: '0 0 10px', color: '#1D1D1F',
                fontSize: isMobile ? 26 : 32, fontWeight: 500,
                fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1,
              }}>{name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                {/* Level badge */}
                <span style={{
                  padding: '3px 8px', background: 'transparent',
                  border: `1px solid ${lc.color}`, color: lc.color,
                  fontFamily: 'var(--font-body)', fontSize: 12, letterSpacing: '-0.02em', lineHeight: '14px',
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                }}>
                  {swimmer.level}
                </span>
                {/* Group badges */}
                {swimmer.groups?.map(g => (
                  <span key={g.id} style={{
                    padding: '3px 8px', background: 'transparent',
                    border: '1px solid #AEAEB2', color: '#6E6E73',
                    fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: '14px',
                  }}>{g.name}</span>
                ))}
                {/* DOB */}
                {swimmer.date_of_birth && (
                  <span style={{
                    padding: '3px 8px', background: 'transparent',
                    border: '1px solid #AEAEB2', color: '#6E6E73',
                    fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: '14px',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#86868B" strokeWidth="1.8" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {swimmer.date_of_birth?.split('T')[0]}
                  </span>
                )}
              </div>
            </div>

            {/* Rate & Comment button */}
            <div style={{ flexShrink: 0 }}>
              <button type="button" onClick={() => setEvalOpen(true)} className="pl-btn pl-btn-accent">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Rate & Comment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap',
      }}>
        <StatCard
          label="Total Sessions" value={stats.total_sessions} index={0} delay={0.04}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard
          label="Attended" value={stats.sessions_attended} index={1} delay={0.08}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Attendance" value={stats.attendance_rate ? `${stats.attendance_rate}%` : '—'} color="#0071E3" index={2} delay={0.12}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
        <StatCard
          label="Avg Rating" value={stats.average_rating || '—'} index={3} delay={0.16}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>}
        />
      </div>

      {/* Evaluation History */}
      <div style={{ borderRadius: 16,
        background: '#FFFFFF',
        padding: isMobile ? '22px 18px' : '28px',
        border: '1px solid #E5E5EA',
        animation: 'fadeInUp 0.4s ease-out 0.2s both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, paddingBottom: 14, borderBottom: '1px solid #E5E5EA' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <h2 style={{ margin: 0, color: '#1D1D1F', fontSize: 18, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1 }}>
            Evaluation History
          </h2>
          <span style={{ ...labelMono, marginInlineStart: 'auto' }}>{stats.total_evaluations}</span>
        </div>

        {evaluations.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {evaluations.map((ev, i) => {
              const evalDate = ev.session?.date?.split('T')[0];
              const formatted = evalDate ? new Date(evalDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '';

              return (
                <div key={ev.id || i}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
                  style={{
                    padding: isMobile ? '14px 16px' : '16px 20px', background: '#FFFFFF',
                    border: '1px solid #E5E5EA',
                    transition: 'border-color 0.15s ease',
                    animation: `fadeInUp 0.25s ease-out ${0.2 + i * 0.04}s both`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Date block */}
                      <span style={{ ...labelMono, color: '#1D1D1F' }}>{formatted}</span>
                      {/* Group name */}
                      {ev.session?.group?.name && (
                        <span style={{ ...labelMono, color: '#86868B' }}>{ev.session.group.name}</span>
                      )}
                    </div>
                    <StarDisplay value={ev.rating} size={18} />
                  </div>
                  {ev.notes && (
                    <div style={{
                      color: '#515154', fontSize: 13, lineHeight: 1.5,
                      marginTop: 10, paddingTop: 10,
                      borderTop: '1px solid #E5E5EA',
                      fontStyle: 'italic',
                    }}>
                      "{ev.notes}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ borderRadius: 16,
            textAlign: 'center', padding: '40px 20px',
            background: '#FFFFFF', border: '1px solid #E5E5EA',
          }}>
            <div style={{ borderRadius: 14,
              width: 52, height: 52, background: '#F2F2F7', border: '1px solid #E5E5EA',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 14,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.5" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div style={{ color: '#1D1D1F', fontSize: 18, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8 }}>No evaluations yet</div>
            <div style={{ ...labelMono, marginBottom: 16 }}>Rate this swimmer to start building their evaluation history</div>
            <button type="button" onClick={() => setEvalOpen(true)} className="pl-btn pl-btn-secondary pl-btn-sm">
              Write First Evaluation
            </button>
          </div>
        )}
      </div>

      {/* Evaluate Modal */}
      <EvaluateModal
        swimmer={swimmer}
        open={evalOpen}
        onClose={() => setEvalOpen(false)}
        onSaved={() => {
          load();
          setToast('Evaluation saved successfully!');
          setTimeout(() => setToast(null), 3000);
        }}
      />
    </div>
  );
}
