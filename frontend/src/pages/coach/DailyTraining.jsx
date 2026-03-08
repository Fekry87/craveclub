import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button, PageHeader } from '../../components/CrudTable';

function RatingDots({ value, onChange, size = 32 }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(r => (
        <button key={r} onClick={() => onChange(r)}
          onMouseEnter={e => { if (value < r) e.currentTarget.style.background = 'rgba(34,211,238,0.3)'; }}
          onMouseLeave={e => { if (value < r) e.currentTarget.style.background = 'rgba(51,65,85,0.3)'; }}
          style={{
            width: size, height: size, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: size * 0.44, fontWeight: 700,
            background: value >= r ? 'linear-gradient(135deg, #22d3ee, #06b6d4)' : 'rgba(51,65,85,0.3)',
            color: value >= r ? '#060d1f' : '#64748b',
            transition: 'all 0.2s ease',
            fontFamily: "'Outfit', sans-serif",
          }}>
          {r}
        </button>
      ))}
    </div>
  );
}

function SuccessToast({ show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 100,
      background: 'linear-gradient(135deg, rgba(45,212,191,0.12) 0%, rgba(34,211,238,0.08) 100%)',
      border: '1px solid rgba(45,212,191,0.25)', borderRadius: 16, padding: '14px 26px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)', animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      backdropFilter: 'blur(16px)',
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
      </div>
      <span style={{ color: '#2dd4bf', fontSize: 14, fontWeight: 600 }}>Saved successfully!</span>
    </div>
  );
}

export default function DailyTraining() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [groupEval, setGroupEval] = useState({ rating: 3, notes: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get('/coach/dashboard').then(r => {
      const allSessions = [...(r.data.today_sessions || []), ...(r.data.upcoming_sessions || [])];
      setSessions(allSessions.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i));
    });
  }, []);

  const selectSession = async (session) => {
    setSelectedSession(session);
    setSuccess(false);
    try {
      const r = await api.get(`/coach/sessions/${session.id}`).catch(() => null);
      const detail = r?.data || session;
      setSessionDetail(detail);
      const swimmers = detail.group?.swimmers || [];
      const att = {}, evals = {};
      swimmers.forEach(s => {
        const existing = detail.attendances?.find(a => a.swimmer_id === s.id);
        att[s.id] = existing ? existing.present : true;
        const existingEval = detail.evaluations?.find(e => e.swimmer_id === s.id);
        evals[s.id] = { rating: existingEval?.rating || 3, notes: existingEval?.notes || '' };
      });
      setAttendance(att);
      setEvaluations(evals);
      setGroupEval(detail.group_evaluation ? { rating: detail.group_evaluation.rating, notes: detail.group_evaluation.notes || '' } : { rating: 3, notes: '' });
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async () => {
    setSaving(true); setSuccess(false);
    try {
      const swimmers = sessionDetail?.group?.swimmers || [];
      await api.post('/coach/daily-training', {
        session_id: selectedSession.id,
        attendance: swimmers.map(s => ({ swimmer_id: s.id, present: !!attendance[s.id] })),
        evaluations: swimmers.filter(s => attendance[s.id]).map(s => ({ swimmer_id: s.id, rating: evaluations[s.id]?.rating || 3, notes: evaluations[s.id]?.notes || '' })),
        group_evaluation: { group_id: selectedSession.group_id || sessionDetail?.group_id, rating: groupEval.rating, notes: groupEval.notes },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { alert('Error: ' + (err.response?.data?.message || 'Failed to save')); }
    finally { setSaving(false); }
  };

  const swimmers = sessionDetail?.group?.swimmers || [];

  return (
    <div>
      <PageHeader title="Daily Training" />

      {/* Session selector */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Select Session</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {sessions.map(s => {
            const active = selectedSession?.id === s.id;
            const date = s.date?.split('T')[0];
            const dayName = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }) : '';
            return (
              <button key={s.id} onClick={() => selectSession(s)}
                onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'rgba(45,212,191,0.3)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'rgba(51,65,85,0.3)'; }}
                style={{
                  padding: '14px 18px', borderRadius: 14, cursor: 'pointer',
                  border: active ? '2px solid #2dd4bf' : '1px solid rgba(51,65,85,0.3)',
                  background: active ? 'rgba(45,212,191,0.08)' : 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
                  color: '#e2e8f0', transition: 'all 0.2s ease', textAlign: 'left',
                }}>
                <div style={{ fontWeight: 600, fontSize: 14, fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>{s.group?.name}</div>
                <div style={{ fontSize: 12, color: active ? '#2dd4bf' : '#64748b' }}>{dayName} {date} · {s.start_time?.slice(0,5)}</div>
              </button>
            );
          })}
          {!sessions.length && (
            <div style={{ padding: '30px 20px', color: '#475569', fontSize: 14, textAlign: 'center', width: '100%', background: 'rgba(13,31,60,0.3)', borderRadius: 14, border: '1px solid rgba(51,65,85,0.15)' }}>No sessions available</div>
          )}
        </div>
      </div>

      {selectedSession && swimmers.length > 0 && (
        <>
          {/* Swimmers attendance & evaluation */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
            borderRadius: 20, border: '1px solid rgba(34,211,238,0.06)', marginBottom: 20,
            overflow: 'hidden', animation: 'fadeInUp 0.4s ease-out',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.2), transparent)' }} />
            <div style={{ padding: '22px 24px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: 16, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Swimmers</h3>
              <div style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 8, background: 'rgba(34,211,238,0.06)', color: '#64748b', fontSize: 12, fontWeight: 500 }}>{swimmers.length}</div>
            </div>
            <div style={{ padding: '12px 24px 20px' }}>
              {swimmers.map((s, i) => (
                <div key={s.id} style={{ borderBottom: i < swimmers.length - 1 ? '1px solid rgba(51,65,85,0.15)' : 'none', padding: '14px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: attendance[s.id] ? 10 : 0, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#e2e8f0', minWidth: 160, cursor: 'pointer', flex: '1 1 auto' }}>
                      <input type="checkbox" checked={!!attendance[s.id]} onChange={e => setAttendance({ ...attendance, [s.id]: e.target.checked })}
                        style={{ width: 18, height: 18, accentColor: '#2dd4bf', cursor: 'pointer' }} />
                      <span style={{ fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>{s.first_name} {s.last_name}</span>
                    </label>
                    {attendance[s.id] && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#64748b', fontSize: 12, fontWeight: 500 }}>Rating</span>
                        <RatingDots value={evaluations[s.id]?.rating || 3} onChange={r => setEvaluations({ ...evaluations, [s.id]: { ...evaluations[s.id], rating: r } })} size={30} />
                      </div>
                    )}
                  </div>
                  {attendance[s.id] && (
                    <input placeholder="Notes for this swimmer..." value={evaluations[s.id]?.notes || ''}
                      onChange={e => setEvaluations({ ...evaluations, [s.id]: { ...evaluations[s.id], notes: e.target.value } })}
                      style={{ width: '100%', padding: '8px 14px', background: 'rgba(6,13,31,0.5)', border: '1px solid rgba(51,65,85,0.3)', borderRadius: 10, color: '#e2e8f0', fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.2s ease' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(34,211,238,0.3)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.3)'}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Group Evaluation */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
            borderRadius: 20, border: '1px solid rgba(45,212,191,0.06)', padding: '22px 24px', marginBottom: 24,
            animation: 'fadeInUp 0.4s ease-out 0.1s both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: 16, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Group Evaluation</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Rating</span>
              <RatingDots value={groupEval.rating} onChange={r => setGroupEval({ ...groupEval, rating: r })} size={36} />
            </div>
            <textarea placeholder="Group notes..." value={groupEval.notes} onChange={e => setGroupEval({ ...groupEval, notes: e.target.value })}
              style={{ width: '100%', padding: '12px 14px', background: 'rgba(6,13,31,0.5)', border: '1px solid rgba(51,65,85,0.3)', borderRadius: 12, color: '#e2e8f0', fontSize: 13, minHeight: 70, boxSizing: 'border-box', outline: 'none', fontFamily: "'DM Sans', sans-serif", resize: 'vertical', lineHeight: 1.5, transition: 'border-color 0.2s ease' }}
              onFocus={e => e.target.style.borderColor = 'rgba(45,212,191,0.3)'}
              onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.3)'}
            />
          </div>

          {/* Submit */}
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg> Saving...</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg> Submit Daily Training</>
            )}
          </Button>
        </>
      )}

      <SuccessToast show={success} />
    </div>
  );
}
