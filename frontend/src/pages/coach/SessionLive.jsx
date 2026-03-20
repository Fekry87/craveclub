import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { Button, useIsMobile, getAvatarColor } from '../../components/CrudTable';

function RatingDots({ value, onChange, size = 26 }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1,2,3,4,5].map(r => (
        <button key={r} onClick={() => onChange(value === r ? 0 : r)}
          style={{
            width: size, height: size, borderRadius: '50%', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.46, fontWeight: 700,
            background: value >= r ? 'linear-gradient(135deg, #2dd4bf, #14b8a6)' : 'rgba(51,65,85,0.3)',
            color: value >= r ? '#060d1f' : '#64748b',
            fontFamily: "'Outfit', sans-serif", transition: 'all 0.15s ease',
          }}
        >{r}</button>
      ))}
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
  return <span style={{ fontFamily: "'DM Mono', 'DM Sans', monospace", fontSize: 16, fontWeight: 700, color: '#f87171', letterSpacing: '0.05em' }}>{elapsed}</span>;
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: '#64748b' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(45,212,191,0.2)" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div style={{ fontSize: 14 }}>Loading session...</div>
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
          <button onClick={() => navigate('/coach/sessions')}
            style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.1)', color: '#2dd4bf', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 style={{ margin: 0, color: '#f1f5f9', fontSize: 22, fontWeight: 700, fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 10 }}>
              {session.title || session.group?.name || 'Live Session'}
              <span style={{
                padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: 5,
                animation: 'pulse 2s infinite',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', animation: 'pulse 1.5s infinite' }} />
                LIVE
              </span>
            </h1>
            <div style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
              {session.group?.name && session.title && <span>{session.group.name}</span>}
              <span>{session.start_time?.substring(0,5)} - {session.end_time?.substring(0,5)}</span>
              {session.location && <span>@ {session.location}</span>}
              <ElapsedTimer startedAt={session.started_at} />
            </div>
          </div>
        </div>

        {/* Attendance summary */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.12)', color: '#2dd4bf', fontSize: 13, fontWeight: 700 }}>
            ✓ {presentCount}
          </div>
          <div style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)', color: '#f87171', fontSize: 13, fontWeight: 700 }}>
            ✗ {absentCount}
          </div>
        </div>
      </div>

      {/* Main split layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr',
        gap: 20, animation: 'fadeInUp 0.5s ease-out 0.1s both',
      }}>
        {/* LEFT: Swimmers */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)',
          borderRadius: 18, padding: '20px 22px', border: '1px solid rgba(34,211,238,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: 16, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Swimmers</h2>
            <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 12, fontWeight: 500 }}>{swimmers.length} total</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {swimmers.map((sw, i) => {
              const present = !!attendance[sw.id];
              const ac = getAvatarColor(`${sw.first_name} ${sw.last_name}`);
              const initials = `${sw.first_name?.[0] || ''}${sw.last_name?.[0] || ''}`.toUpperCase();
              const ev = evaluations[sw.id] || { rating: 0, notes: '' };
              const isExpanded = expandedSwimmer === sw.id;

              return (
                <div key={sw.id} style={{
                  borderRadius: 12,
                  background: present ? 'rgba(45,212,191,0.03)' : 'rgba(239,68,68,0.03)',
                  border: `1px solid ${present ? 'rgba(45,212,191,0.08)' : 'rgba(239,68,68,0.08)'}`,
                  transition: 'all 0.2s ease',
                  animation: `fadeInUp 0.3s ease-out ${0.02 + i * 0.02}s both`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
                    {/* Attendance toggle */}
                    <button onClick={() => toggleAttendance(sw.id)}
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: present ? 'linear-gradient(135deg, #2dd4bf, #14b8a6)' : 'rgba(239,68,68,0.15)',
                        color: present ? '#060d1f' : '#f87171',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, flexShrink: 0, transition: 'all 0.2s ease',
                      }}
                    >{present ? '✓' : '✗'}</button>

                    {/* Avatar */}
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, background: ac.bg, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: ac.text, fontFamily: "'Outfit', sans-serif",
                      opacity: present ? 1 : 0.4,
                    }}>{initials}</div>

                    {/* Name */}
                    <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setExpandedSwimmer(isExpanded ? null : sw.id)}>
                      <div style={{
                        color: present ? '#f1f5f9' : '#64748b', fontSize: 14, fontWeight: 600,
                        fontFamily: "'Outfit', sans-serif",
                        textDecoration: present ? 'none' : 'line-through',
                      }}>{sw.first_name} {sw.last_name}</div>
                      {sw.level && <div style={{ color: '#475569', fontSize: 11 }}>{sw.level}</div>}
                    </div>

                    {/* Rating dots (compact) */}
                    {present && (
                      <RatingDots value={ev.rating} onChange={v => updateEval(sw.id, 'rating', v)} size={22} />
                    )}
                  </div>

                  {/* Expanded notes */}
                  {isExpanded && present && (
                    <div style={{ padding: '0 14px 12px' }}>
                      <input type="text" placeholder="Add a note for this swimmer..."
                        value={ev.notes}
                        onChange={e => updateEval(sw.id, 'notes', e.target.value)}
                        style={{
                          width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                          background: 'rgba(6,13,31,0.4)', border: '1px solid rgba(51,65,85,0.3)',
                          color: '#e2e8f0', outline: 'none', boxSizing: 'border-box',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(45,212,191,0.3)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.3)'}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {swimmers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: '#475569', fontSize: 14 }}>No swimmers in this session</div>
            )}
          </div>
        </div>

        {/* RIGHT: Session Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Session details */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)',
            borderRadius: 18, padding: '20px 22px', border: '1px solid rgba(34,211,238,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Session Info</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {session.type && session.type !== 'General' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Type</span>
                  <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: `${TYPE_CONFIG[session.type] || '#94a3b8'}15`, color: TYPE_CONFIG[session.type] || '#94a3b8' }}>{session.type}</span>
                </div>
              )}
              {session.plan?.title && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Plan</span>
                  <span style={{ color: '#cbd5e1', fontSize: 13 }}>{session.plan.title}</span>
                </div>
              )}
              {session.notes && (
                <div style={{ marginTop: 4 }}>
                  <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notes</span>
                  <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0', lineHeight: 1.5 }}>{session.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Plan items */}
          {session.plan?.items?.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)',
              borderRadius: 18, padding: '20px 22px', border: '1px solid rgba(34,211,238,0.06)',
            }}>
              <h3 style={{ margin: '0 0 12px', color: '#f1f5f9', fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Plan: {session.plan.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {session.plan.items.map((item, i) => (
                  <div key={item.id || i} style={{
                    padding: '8px 12px', borderRadius: 8,
                    background: 'rgba(6,13,31,0.3)', border: '1px solid rgba(51,65,85,0.1)',
                    fontSize: 13, color: '#cbd5e1', display: 'flex', gap: 10, alignItems: 'center',
                  }}>
                    <span style={{ color: '#64748b', fontSize: 11, fontWeight: 700, minWidth: 18 }}>#{i+1}</span>
                    <div style={{ flex: 1 }}>
                      {item.stroke && <span style={{ color: '#2dd4bf', fontSize: 12, fontWeight: 600 }}>{item.stroke} </span>}
                      {item.drill && <span>{item.drill} </span>}
                      {item.distance && <span style={{ color: '#94a3b8' }}>{item.distance}m </span>}
                      {item.reps && <span style={{ color: '#94a3b8' }}>x{item.reps} </span>}
                      {item.notes && <span style={{ color: '#64748b', fontSize: 12 }}>— {item.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group Evaluation */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)',
            borderRadius: 18, padding: '20px 22px', border: '1px solid rgba(34,211,238,0.06)',
          }}>
            <h3 style={{ margin: '0 0 12px', color: '#f1f5f9', fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Group Evaluation</h3>
            <div style={{ marginBottom: 12 }}>
              <RatingDots value={groupEval.rating} onChange={v => setGroupEval(prev => ({ ...prev, rating: v }))} size={30} />
            </div>
            <textarea placeholder="Group notes..."
              value={groupEval.notes}
              onChange={e => setGroupEval(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 13,
                background: 'rgba(6,13,31,0.4)', border: '1px solid rgba(51,65,85,0.3)',
                color: '#e2e8f0', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                fontFamily: "'DM Sans', sans-serif",
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(45,212,191,0.3)'}
              onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.3)'}
            />
          </div>

          {/* Summary notes */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)',
            borderRadius: 18, padding: '20px 22px', border: '1px solid rgba(34,211,238,0.06)',
          }}>
            <h3 style={{ margin: '0 0 12px', color: '#f1f5f9', fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Session Summary</h3>
            <textarea placeholder="Overall session notes, observations, things to improve..."
              value={summaryNotes}
              onChange={e => setSummaryNotes(e.target.value)}
              rows={4}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 13,
                background: 'rgba(6,13,31,0.4)', border: '1px solid rgba(51,65,85,0.3)',
                color: '#e2e8f0', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                fontFamily: "'DM Sans', sans-serif",
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(45,212,191,0.3)'}
              onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.3)'}
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'sticky', bottom: 0, left: 0, right: 0,
        padding: '16px 0', marginTop: 24,
        background: 'linear-gradient(to top, rgba(6,13,31,0.95) 60%, transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#64748b', fontSize: 13 }}>
          <span>Elapsed: <ElapsedTimer startedAt={session.started_at} /></span>
          <span style={{ color: '#334155' }}>|</span>
          <span>{presentCount}/{swimmers.length} present</span>
        </div>
        {!showEndConfirm ? (
          <button onClick={() => setShowEndConfirm(true)}
            onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)'}
            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)'}
            style={{
              padding: '10px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              border: 'none', color: '#fff', cursor: 'pointer', transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
            End Session
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#f87171', fontSize: 13, fontWeight: 600 }}>End session?</span>
            <button onClick={handleEndSession} disabled={saving}
              style={{
                padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                background: saving ? '#64748b' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none', color: '#fff', cursor: saving ? 'wait' : 'pointer',
              }}
            >{saving ? t('loading.saving') : 'Yes, End'}</button>
            <button onClick={() => setShowEndConfirm(false)}
              style={{
                padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: 'rgba(51,65,85,0.3)', border: '1px solid rgba(51,65,85,0.3)',
                color: '#94a3b8', cursor: 'pointer',
              }}
            >{t('actions.cancel')}</button>
          </div>
        )}
      </div>

      {/* Success toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, padding: '14px 24px', borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(45,212,191,0.15) 0%, rgba(13,31,60,0.95) 100%)',
          border: '1px solid rgba(45,212,191,0.25)', color: '#2dd4bf',
          fontSize: 14, fontWeight: 600, zIndex: 1000,
          animation: 'fadeInUp 0.3s ease-out',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {toast}
        </div>
      )}
    </div>
  );
}

const TYPE_CONFIG = {
  General: '#94a3b8', Technique: '#a78bfa', Endurance: '#f472b6',
  Speed: '#fbbf24', Test: '#f87171', Recovery: '#2dd4bf', Custom: '#64748b',
};
