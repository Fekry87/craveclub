import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { useIsMobile, getAvatarColor } from '../../components/CrudTable';
import { Badge } from '../../components/ui/Badge';

const caption = {
  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, color: '#6E6E73',
};

const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E5E5EA',
  borderRadius: 16,
};

const cardHeadStyle = {
  margin: '0 0 14px', paddingBottom: 12, borderBottom: '1px solid #F2F2F7',
  color: '#1D1D1F', fontSize: 16, fontWeight: 600,
  fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', lineHeight: 1.3,
  display: 'flex', alignItems: 'center', gap: 10,
};

const fieldStyle = {
  width: '100%', padding: '0 14px', height: 42, fontSize: 14,
  background: '#FFFFFF', border: '1px solid #D2D2D7', borderRadius: 12,
  color: '#1D1D1F', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'var(--font-body)',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
};

const focusInk = {
  onFocus: e => { e.target.style.borderColor = '#0071E3'; e.target.style.boxShadow = '0 0 0 4px rgba(0,113,227,0.15)'; },
  onBlur: e => { e.target.style.borderColor = '#D2D2D7'; e.target.style.boxShadow = 'none'; },
};

// iOS-style segmented control for attendance. The session model stores a boolean
// `present`, so the control has two segments — Present (green) / Absent (red).
function AttendanceSegments({ present, onChange, compact = false }) {
  const segments = [
    { key: true, label: 'Present', on: '#34C759' },
    { key: false, label: 'Absent', on: '#FF3B30' },
  ];
  return (
    <div style={{
      display: 'inline-flex', padding: 2, gap: 2,
      background: '#F2F2F7', borderRadius: 10, flexShrink: 0,
    }}>
      {segments.map(seg => {
        const selected = present === seg.key;
        return (
          <button
            key={String(seg.key)}
            type="button"
            onClick={() => { if (!selected) onChange(seg.key); }}
            style={{
              border: 'none', cursor: 'pointer',
              padding: compact ? '0 10px' : '0 14px',
              height: compact ? 26 : 30,
              borderRadius: 8,
              fontFamily: 'var(--font-body)',
              fontSize: compact ? 12 : 13, fontWeight: 500,
              background: selected ? seg.on : 'transparent',
              color: selected ? '#FFFFFF' : '#6E6E73',
              boxShadow: selected ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
          >{seg.label}</button>
        );
      })}
    </div>
  );
}

// Five round segments — filled blue up to the selected rating.
function RatingDots({ value, onChange, size = 26 }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(r => {
        const filled = value >= r;
        return (
          <button key={r} type="button" onClick={() => onChange(value === r ? 0 : r)}
            aria-label={`${r}`}
            style={{
              width: size, height: size, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: Math.round(size * 0.46), fontWeight: 600,
              borderRadius: '50%',
              background: filled ? '#0071E3' : '#F2F2F7',
              border: 'none',
              color: filled ? '#FFFFFF' : '#86868B',
              fontFamily: 'var(--font-body)',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
          >{r}</button>
        );
      })}
    </div>
  );
}

function ElapsedTimer({ startedAt }) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(`${h > 0 ? h + ':' : ''}${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  return <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#FF3B30', fontVariantNumeric: 'tabular-nums' }}>{elapsed}</span>;
}

export default function SessionLive() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [attendance, setAttendance] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [groupEval, setGroupEval] = useState({ rating: 0, notes: '' });
  const [summaryNotes, setSummaryNotes] = useState('');
  const [expandedSwimmer, setExpandedSwimmer] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadSession();
  }, [id]);

  const loadSession = async () => {
    try {
      const res = await api.get(`/coach/sessions/${id}`);
      const data = res.data;
      setSession(data);

      // Init attendance from existing data
      const att = {};
      (data.effective_roster || []).forEach(sw => { att[sw.id] = true; });
      (data.attendances || []).forEach(a => { att[a.swimmer_id] = a.present; });
      setAttendance(att);

      // Init evaluations
      const evs = {};
      (data.evaluations || []).forEach(e => {
        evs[e.swimmer_id] = { rating: e.rating || 0, notes: e.notes || '' };
      });
      setEvaluations(evs);

      // Group eval
      if (data.group_evaluation) {
        setGroupEval({ rating: data.group_evaluation.rating || 0, notes: data.group_evaluation.notes || '' });
      }

      setSummaryNotes(data.summary_notes || '');
      setLoading(false);
    } catch {
      navigate('/coach/sessions');
    }
  };

  const swimmers = session?.effective_roster || [];
  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = swimmers.length - presentCount;

  const toggleAttendance = (swId) => {
    setAttendance(prev => ({ ...prev, [swId]: !prev[swId] }));
  };

  const updateEval = (swId, field, value) => {
    setEvaluations(prev => ({
      ...prev,
      [swId]: { ...(prev[swId] || { rating: 0, notes: '' }), [field]: value },
    }));
  };

  const handleEndSession = async () => {
    setSaving(true);
    try {
      const attArr = swimmers.map(sw => ({ swimmer_id: sw.id, present: !!attendance[sw.id] }));
      const evalArr = Object.entries(evaluations)
        .filter(([, v]) => v.rating > 0)
        .map(([swId, v]) => ({ swimmer_id: Number(swId), rating: v.rating, notes: v.notes || '' }));

      await api.post(`/coach/sessions/${id}/complete`, {
        attendance: attArr,
        evaluations: evalArr.length > 0 ? evalArr : undefined,
        group_evaluation: groupEval.rating > 0 ? groupEval : undefined,
        summary_notes: summaryNotes || undefined,
      });

      setToast('Session completed successfully!');
      setTimeout(() => navigate('/coach/sessions'), 1500);
    } catch (e) {
      alert('Error completing session');
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: '#6E6E73' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5EA" strokeWidth="2" />
          <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#0071E3" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <div style={caption}>Loading session...</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        marginBottom: 20, flexWrap: 'wrap', animation: 'fadeInUp 0.4s ease-out',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button type="button" onClick={() => navigate('/coach/sessions')} className="pl-icon-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 style={{
              margin: 0, color: '#1D1D1F', fontSize: 28, fontWeight: 700,
              fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.15,
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            }}>
              {session.title || session.group?.name || 'Live Session'}
              <span style={{
                padding: '3px 10px', borderRadius: 980,
                background: 'rgba(255,59,48,0.12)', color: '#B12A20',
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, lineHeight: '16px',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF3B30', display: 'inline-block' }} />
                Live
              </span>
            </h1>
            <div style={{ ...caption, display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              {session.group?.name && session.title && <span>{session.group.name}</span>}
              <span>{session.start_time?.substring(0,5)} – {session.end_time?.substring(0,5)}</span>
              {session.location && <span>{session.location}</span>}
              <ElapsedTimer startedAt={session.started_at} />
            </div>
          </div>
        </div>

        {/* Attendance summary */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge variant="success" label={`Present ${presentCount}`} />
          <Badge variant="danger" label={`Absent ${absentCount}`} />
        </div>
      </div>

      {/* Main split layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr',
        gap: 20, animation: 'fadeInUp 0.5s ease-out 0.1s both',
      }}>
        {/* LEFT: Swimmers */}
        <div style={{ ...cardStyle, padding: '20px 22px' }}>
          <div style={cardHeadStyle}>
            <span style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: 'rgba(0,113,227,0.1)', color: '#0071E3',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </span>
            <span style={{ flex: 1 }}>Swimmers</span>
            <span style={caption}>{swimmers.length} total</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {swimmers.map((sw, i) => {
              const present = !!attendance[sw.id];
              const ac = getAvatarColor(`${sw.first_name} ${sw.last_name}`);
              const initials = `${sw.first_name?.[0] || ''}${sw.last_name?.[0] || ''}`.toUpperCase();
              const ev = evaluations[sw.id] || { rating: 0, notes: '' };
              const isExpanded = expandedSwimmer === sw.id;

              return (
                <div key={sw.id} style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E5EA',
                  borderRadius: 14,
                  animation: `fadeInUp 0.25s ease-out ${0.02 + i * 0.02}s both`,
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    flexWrap: isMobile ? 'wrap' : 'nowrap',
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', background: ac.bg, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 600, color: ac.text,
                      fontFamily: 'var(--font-body)',
                      opacity: present ? 1 : 0.5,
                    }}>{initials}</div>

                    {/* Name */}
                    <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setExpandedSwimmer(isExpanded ? null : sw.id)}>
                      <div style={{
                        color: present ? '#1D1D1F' : '#86868B', fontSize: 15, fontWeight: 600,
                        fontFamily: 'var(--font-body)', lineHeight: 1.3,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{sw.first_name} {sw.last_name}</div>
                      {sw.level && <div style={{ ...caption, marginTop: 3 }}>{sw.level}</div>}
                    </div>

                    {/* Attendance segmented control */}
                    <AttendanceSegments present={present} onChange={() => toggleAttendance(sw.id)} compact />

                    {/* Rating (compact) */}
                    {present && (
                      <RatingDots value={ev.rating} onChange={v => updateEval(sw.id, 'rating', v)} size={24} />
                    )}
                  </div>

                  {/* Expanded notes */}
                  {isExpanded && present && (
                    <div style={{ padding: '0 14px 14px' }}>
                      <input type="text" placeholder="Add a note for this swimmer…"
                        value={ev.notes}
                        onChange={e => updateEval(sw.id, 'notes', e.target.value)}
                        style={{ ...fieldStyle, height: 38 }}
                        {...focusInk}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {swimmers.length === 0 && (
              <div style={{ ...caption, textAlign: 'center', padding: '30px 20px', color: '#86868B' }}>No swimmers in this session</div>
            )}
          </div>
        </div>

        {/* RIGHT: Session Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Session details */}
          <div style={{ ...cardStyle, padding: '20px 22px' }}>
            <h3 style={cardHeadStyle}>
              <span style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'rgba(0,113,227,0.1)', color: '#0071E3',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
              Session info
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {session.type && session.type !== 'General' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #F2F2F7' }}>
                  <span style={caption}>Type</span>
                  <Badge variant={TYPE_VARIANTS[session.type] || 'neutral'} label={session.type} />
                </div>
              )}
              {session.plan?.title && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: session.notes ? '1px solid #F2F2F7' : 'none' }}>
                  <span style={caption}>Plan</span>
                  <span style={{ color: '#1D1D1F', fontSize: 14, textAlign: 'end' }}>{session.plan.title}</span>
                </div>
              )}
              {session.notes && (
                <div style={{ paddingTop: 10 }}>
                  <span style={caption}>Notes</span>
                  <p style={{ color: '#515154', fontSize: 14, margin: '6px 0 0', lineHeight: 1.55 }}>{session.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Plan items */}
          {session.plan?.items?.length > 0 && (
            <div style={{ ...cardStyle, padding: '20px 22px' }}>
              <h3 style={cardHeadStyle}>
                <span style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(0,113,227,0.1)', color: '#0071E3',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.plan.title}</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {session.plan.items.map((item, i) => (
                  <div key={item.id || i} style={{
                    padding: '10px 14px', background: '#F2F2F7', borderRadius: 12,
                    fontSize: 14, color: '#1D1D1F', display: 'flex', gap: 10, alignItems: 'center',
                    lineHeight: 1.45,
                  }}>
                    <div style={{ flex: 1 }}>
                      {item.stroke && <span style={{ fontWeight: 600 }}>{item.stroke} </span>}
                      {item.drill && <span>{item.drill} </span>}
                      {item.distance && <span style={{ color: '#515154' }}>{item.distance}m </span>}
                      {item.reps && <span style={{ color: '#515154' }}>×{item.reps} </span>}
                      {item.notes && <span style={{ color: '#6E6E73', fontSize: 13 }}>— {item.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group Evaluation */}
          <div style={{ ...cardStyle, padding: '20px 22px' }}>
            <h3 style={cardHeadStyle}>Group evaluation</h3>
            <div style={{ marginBottom: 14 }}>
              <RatingDots value={groupEval.rating} onChange={v => setGroupEval(prev => ({ ...prev, rating: v }))} size={30} />
            </div>
            <textarea placeholder="Group notes…"
              value={groupEval.notes}
              onChange={e => setGroupEval(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              style={{ ...fieldStyle, height: 'auto', minHeight: 84, padding: 12, resize: 'vertical', lineHeight: 1.5 }}
              {...focusInk}
            />
          </div>

          {/* Summary notes */}
          <div style={{ ...cardStyle, padding: '20px 22px' }}>
            <h3 style={cardHeadStyle}>Session summary</h3>
            <textarea placeholder="Overall session notes, observations, things to improve…"
              value={summaryNotes}
              onChange={e => setSummaryNotes(e.target.value)}
              rows={4}
              style={{ ...fieldStyle, height: 'auto', minHeight: 84, padding: 12, resize: 'vertical', lineHeight: 1.5 }}
              {...focusInk}
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'sticky', bottom: 0, insetInline: 0,
        padding: '16px 0', marginTop: 24,
        background: '#F5F5F7', borderTop: '1px solid #E5E5EA',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        flexWrap: 'wrap', zIndex: 10,
      }}>
        <div style={{ ...caption, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>Elapsed <ElapsedTimer startedAt={session.started_at} /></span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#AEAEB2', display: 'inline-block' }} />
          <span>{presentCount}/{swimmers.length} present</span>
        </div>
        {!showEndConfirm ? (
          <button type="button" onClick={() => setShowEndConfirm(true)} className="pl-btn pl-btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            Complete session
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ ...caption, color: '#1D1D1F' }}>Complete this session?</span>
            <button type="button" onClick={handleEndSession} disabled={saving} className="pl-btn pl-btn-primary pl-btn-sm"
            >{saving ? t('loading.saving') : 'Yes, complete'}</button>
            <button type="button" onClick={() => setShowEndConfirm(false)} className="pl-btn pl-btn-ghost pl-btn-sm"
            >{t('actions.cancel')}</button>
          </div>
        )}
      </div>

      {/* Success toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, insetInlineEnd: 24, padding: '12px 18px',
          background: 'rgba(29,29,31,0.92)', color: '#1D1D1F',
          borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          backdropFilter: 'saturate(180%) blur(20px)',
          fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, zIndex: 1000,
          animation: 'fadeInUp 0.3s ease-out',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {toast}
        </div>
      )}
    </div>
  );
}

// Session type → Badge tint
const TYPE_VARIANTS = {
  General: 'neutral', Technique: 'info', Endurance: 'info',
  Speed: 'warning', Test: 'danger', Recovery: 'success', Custom: 'neutral',
};
