import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { Button, Modal, ModalActions, FormField, TextArea, useIsMobile, getAvatarColor } from '../../components/CrudTable';

const levelConfig = {
  'Beginner':     { color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.20)' },
  'Intermediate': { color: '#38bdf8', bg: 'rgba(56,189,248,0.10)', border: 'rgba(56,189,248,0.20)' },
  'Advanced':     { color: '#2dd4bf', bg: 'rgba(45,212,191,0.10)', border: 'rgba(45,212,191,0.20)' },
};

/* ───── Star Rating Input ───── */
function StarInput({ value, onChange, size = 36 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1,2,3,4,5].map(r => (
        <svg key={r} width={size} height={size} viewBox="0 0 24 24"
          style={{ cursor: 'pointer', transition: 'transform 0.15s', transform: (hover >= r || value >= r) ? 'scale(1.15)' : 'scale(1)' }}
          onMouseEnter={() => setHover(r)} onMouseLeave={() => setHover(0)} onClick={() => onChange(r)}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={(hover >= r || value >= r) ? '#fbbf24' : 'none'}
            stroke={(hover >= r || value >= r) ? '#fbbf24' : '#334155'}
            strokeWidth="1.5" strokeLinejoin="round"
          />
        </svg>
      ))}
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
            fill={value >= r ? '#fbbf24' : 'none'}
            stroke={value >= r ? '#fbbf24' : '#334155'}
            strokeWidth="1.5" strokeLinejoin="round"
            opacity={value >= r ? 1 : 0.4}
          />
        </svg>
      ))}
    </div>
  );
}

/* ───── Stat Card ───── */
function StatCard({ label, value, icon, color, delay = 0 }) {
  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = `${color}30`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = `${color}15`; }}
      style={{
        flex: '1 1 0', minWidth: 130,
        padding: '22px 18px', borderRadius: 18, textAlign: 'center',
        background: `linear-gradient(145deg, ${color}08, ${color}04)`,
        border: `1px solid ${color}15`,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: `fadeInUp 0.4s ease-out ${delay}s both`,
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 13,
        background: `${color}10`, border: `1px solid ${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 12px',
      }}>{icon}</div>
      <div style={{
        color, fontSize: 28, fontWeight: 800,
        fontFamily: "'Outfit', sans-serif", lineHeight: 1,
        marginBottom: 4,
      }}>{value}</div>
      <div style={{
        color: '#64748b', fontSize: 11, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>{label}</div>
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
      icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>}
    >
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 14 }}>How did this swimmer perform?</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <StarInput value={rating} onChange={setRating} size={40} />
        </div>
        {rating > 0 && (
          <div style={{
            marginTop: 10, fontSize: 14, fontWeight: 700,
            fontFamily: "'Outfit', sans-serif",
            color: rating >= 4 ? '#2dd4bf' : rating >= 3 ? '#38bdf8' : rating >= 2 ? '#fbbf24' : '#f87171',
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#64748b' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(45,212,191,0.2)" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Loading swimmer profile...</div>
      </div>
    </div>
  );

  if (!detail) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ color: '#64748b', fontSize: 15, marginBottom: 12 }}>Swimmer not found</div>
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
          position: 'fixed', top: 24, right: 24, zIndex: 1000,
          padding: '12px 20px', borderRadius: 12,
          background: 'rgba(45,212,191,0.15)', border: '1px solid rgba(45,212,191,0.3)',
          color: '#2dd4bf', fontSize: 13, fontWeight: 600, backdropFilter: 'blur(12px)',
          animation: 'fadeInUp 0.3s ease-out',
        }}>{toast}</div>
      )}

      {/* Back button */}
      <button
        onClick={() => navigate('/coach/swimmers')}
        onMouseEnter={e => { e.currentTarget.style.color = '#2dd4bf'; e.currentTarget.style.gap = '10px'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.gap = '6px'; }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#64748b', fontSize: 13, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.2s ease', padding: '4px 0', marginBottom: 20,
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Swimmers
      </button>

      {/* Hero Profile Card */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(13,31,60,0.85) 0%, rgba(45,212,191,0.06) 50%, rgba(13,31,60,0.65) 100%)',
        borderRadius: 24, padding: 0, overflow: 'hidden',
        border: '1px solid rgba(45,212,191,0.1)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15), 0 0 40px rgba(45,212,191,0.03)',
        marginBottom: 24,
        animation: 'fadeInUp 0.5s ease-out',
      }}>
        {/* Banner */}
        <div style={{
          height: isMobile ? 100 : 120, position: 'relative',
          background: `linear-gradient(135deg, rgba(13,31,60,0.9) 0%, ${lc.bg} 100%)`,
        }}>
          <svg viewBox="0 0 800 120" preserveAspectRatio="none" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, width: '100%', height: 50 }}>
            <path d="M0,60 C200,30 300,80 400,55 C500,30 600,70 800,50 L800,120 L0,120 Z" fill="rgba(13,31,60,0.85)" />
          </svg>
          {/* Decorative elements */}
          <div style={{ position: 'absolute', top: 20, right: 40, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${lc.bg} 0%, transparent 70%)` }} />
          <div style={{ position: 'absolute', top: 50, right: 120, width: 40, height: 40, borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent 10%, ${lc.color}40 50%, transparent 90%)` }} />
        </div>

        {/* Avatar + Info */}
        <div style={{
          padding: isMobile ? '0 20px 28px' : '0 36px 32px',
          marginTop: -50, position: 'relative', zIndex: 2,
        }}>
          <div style={{ display: 'flex', alignItems: isMobile ? 'center' : 'flex-end', gap: isMobile ? 16 : 24, flexDirection: isMobile ? 'column' : 'row' }}>
            {/* Avatar */}
            <div style={{
              width: 100, height: 100, borderRadius: 26, flexShrink: 0,
              background: ac.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 800,
              fontFamily: "'Outfit', sans-serif", color: ac.text,
              border: '4px solid rgba(13,31,60,0.85)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 50px rgba(45,212,191,0.05)',
            }}>{initials}</div>

            {/* Name & Meta */}
            <div style={{ flex: 1, minWidth: 0, textAlign: isMobile ? 'center' : 'left' }}>
              <h1 style={{
                margin: '0 0 6px', color: '#f1f5f9',
                fontSize: isMobile ? 24 : 28, fontWeight: 700,
                fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em',
              }}>{name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                {/* Level badge */}
                <span style={{
                  padding: '4px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: lc.bg, border: `1px solid ${lc.border}`, color: lc.color,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  {swimmer.level}
                </span>
                {/* Group badges */}
                {swimmer.groups?.map(g => (
                  <span key={g.id} style={{
                    padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 500,
                    background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.1)',
                    color: '#94a3b8',
                  }}>{g.name}</span>
                ))}
                {/* DOB */}
                {swimmer.date_of_birth && (
                  <span style={{
                    padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 500,
                    background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.1)',
                    color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {swimmer.date_of_birth?.split('T')[0]}
                  </span>
                )}
              </div>
            </div>

            {/* Rate & Comment button */}
            <div style={{ flexShrink: 0 }}>
              <button
                onClick={() => setEvalOpen(true)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(45,212,191,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                style={{
                  padding: '12px 24px', borderRadius: 14,
                  background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
                  border: 'none', cursor: 'pointer',
                  color: '#060d1f', fontSize: 14, fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.25s ease', whiteSpace: 'nowrap',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
          label="Total Sessions" value={stats.total_sessions} color="#38bdf8" delay={0.05}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard
          label="Attended" value={stats.sessions_attended} color="#22d3ee" delay={0.1}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Attendance" value={stats.attendance_rate ? `${stats.attendance_rate}%` : '—'} color="#2dd4bf" delay={0.15}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
        <StatCard
          label="Avg Rating" value={stats.average_rating || '—'} color="#fbbf24" delay={0.2}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>}
        />
      </div>

      {/* Evaluation History */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)',
        borderRadius: 20, padding: isMobile ? '22px 18px' : '28px',
        border: '1px solid rgba(45,212,191,0.06)',
        animation: 'fadeInUp 0.5s ease-out 0.25s both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: 18, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
            Evaluation History
          </h2>
          <span style={{
            padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: 'rgba(251,191,36,0.06)', color: '#64748b',
          }}>{stats.total_evaluations}</span>
        </div>

        {evaluations.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {evaluations.map((ev, i) => {
              const evalDate = ev.session?.date?.split('T')[0];
              const formatted = evalDate ? new Date(evalDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '';

              return (
                <div key={ev.id || i}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.15)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(45,212,191,0.04)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                  style={{
                    padding: isMobile ? '14px 16px' : '16px 20px', borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
                    border: '1px solid rgba(45,212,191,0.04)',
                    transition: 'all 0.25s ease',
                    animation: `fadeInUp 0.3s ease-out ${0.3 + i * 0.05}s both`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Date block */}
                      <div style={{
                        padding: '6px 12px', borderRadius: 10,
                        background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.08)',
                      }}>
                        <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{formatted}</span>
                      </div>
                      {/* Group name */}
                      {ev.session?.group?.name && (
                        <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>{ev.session.group.name}</span>
                      )}
                    </div>
                    <StarDisplay value={ev.rating} size={18} />
                  </div>
                  {ev.notes && (
                    <div style={{
                      color: '#94a3b8', fontSize: 13, lineHeight: 1.5,
                      marginTop: 10, paddingTop: 10,
                      borderTop: '1px solid rgba(51,65,85,0.15)',
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
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            background: 'rgba(6,13,31,0.3)', borderRadius: 14,
            border: '1px solid rgba(51,65,85,0.1)',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.08)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 14,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div style={{ color: '#64748b', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No evaluations yet</div>
            <div style={{ color: '#475569', fontSize: 13, marginBottom: 16 }}>Rate this swimmer to start building their evaluation history</div>
            <button
              onClick={() => setEvalOpen(true)}
              style={{
                padding: '8px 20px', borderRadius: 10,
                background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.2)',
                color: '#2dd4bf', fontSize: 13, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
              }}
            >
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
