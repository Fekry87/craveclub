import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button, PageHeader, getAvatarColor } from '../../components/CrudTable';
import { Badge } from '../../components/ui/Badge';
import { inputStyle, inputFocusProps, cardStyle } from '../../components/ui/styles';

const captionStyle = {
  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, color: '#6E6E73',
};

const fieldStyle = { ...inputStyle, fontSize: 14 };

const sectionTitleStyle = {
  margin: 0, color: '#1D1D1F', fontSize: 17, fontWeight: 600,
  fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.2,
};

const iconTileStyle = {
  width: 30, height: 30, borderRadius: 9, background: 'rgba(0,113,227,0.1)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

function RatingDots({ value, onChange, size = 32 }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1,2,3,4,5].map(r => {
        const on = value >= r;
        return (
          <button key={r} type="button" onClick={() => onChange(r)}
            onMouseEnter={e => { if (!on) e.currentTarget.style.background = '#E5E5EA'; }}
            onMouseLeave={e => { if (!on) e.currentTarget.style.background = '#F2F2F7'; }}
            style={{
              width: size, height: size, borderRadius: '50%', cursor: 'pointer',
              fontSize: Math.round(size * 0.42), fontWeight: 600,
              background: on ? '#0071E3' : '#F2F2F7',
              border: 'none',
              color: on ? '#FFFFFF' : '#6E6E73',
              transition: 'background 0.15s ease, color 0.15s ease',
              fontFamily: 'var(--font-display)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              padding: 0,
            }}>
            {r}
          </button>
        );
      })}
    </div>
  );
}

function SuccessToast({ show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 28, insetInlineEnd: 28, zIndex: 100,
      background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 14,
      boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
      padding: '14px 20px',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'fadeInUp 0.3s ease-out',
    }}>
      <span style={{
        width: 24, height: 24, borderRadius: '50%', background: 'rgba(52,199,89,0.14)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E7A3B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: '#1D1D1F' }}>Saved successfully!</span>
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
        <div style={{ ...captionStyle, marginBottom: 12 }}>Select session</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {sessions.map(s => {
            const active = selectedSession?.id === s.id;
            const date = s.date?.split('T')[0];
            const dayName = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }) : '';
            const avatar = getAvatarColor(s.group?.name || '');
            return (
              <button key={s.id} type="button" onClick={() => selectSession(s)}
                onMouseEnter={e => { if (!active) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.boxShadow = 'none'; }}
                style={{
                  padding: '13px 18px', cursor: 'pointer', borderRadius: 14,
                  border: `1px solid ${active ? '#0071E3' : '#E5E5EA'}`,
                  background: active ? 'rgba(0,113,227,0.1)' : '#FFFFFF',
                  color: '#1D1D1F',
                  transition: 'border-color 0.15s ease, background 0.15s ease, box-shadow 0.2s ease',
                  textAlign: 'start',
                  display: 'flex', alignItems: 'center', gap: 12,
                  fontFamily: 'var(--font-body)',
                }}>
                <span style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: active ? '#0071E3' : avatar.bg,
                  color: active ? '#FFFFFF' : avatar.text,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em',
                }}>
                  {(s.group?.name || '?').charAt(0).toUpperCase()}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 15, color: '#1D1D1F', lineHeight: 1.3 }}>{s.group?.name}</span>
                  <span style={{ ...captionStyle, display: 'block', marginTop: 3 }}>{dayName} {date} · {s.start_time?.slice(0,5)}</span>
                </span>
              </button>
            );
          })}
          {!sessions.length && (
            <div style={{
              ...cardStyle, ...captionStyle,
              padding: '30px 20px', color: '#86868B', textAlign: 'center', width: '100%',
            }}>No sessions available</div>
          )}
        </div>
      </div>

      {selectedSession && swimmers.length > 0 && (
        <>
          {/* Swimmers attendance & evaluation */}
          <div style={{
            ...cardStyle,
            marginBottom: 20,
            animation: 'fadeInUp 0.3s ease-out',
          }}>
            <div style={{ padding: '18px 0 14px', marginInline: 24, display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #F2F2F7' }}>
              <span style={iconTileStyle}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0071E3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </span>
              <h3 style={sectionTitleStyle}>Swimmers</h3>
              <span style={{ marginInlineStart: 'auto' }}>
                <Badge variant="neutral" label={`${swimmers.filter(s => attendance[s.id]).length} / ${swimmers.length} present`} />
              </span>
            </div>
            <div style={{ padding: '6px 24px 20px' }}>
              {swimmers.map((s, i) => {
                const avatar = getAvatarColor(`${s.first_name} ${s.last_name}`);
                const present = !!attendance[s.id];
                return (
                  <div key={s.id} style={{ borderBottom: i < swimmers.length - 1 ? '1px solid #F2F2F7' : 'none', padding: '14px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: present ? 12 : 0, flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#1D1D1F', minWidth: 180, cursor: 'pointer', flex: '1 1 auto' }}>
                        <input type="checkbox" checked={present} onChange={e => setAttendance({ ...attendance, [s.id]: e.target.checked })}
                          style={{ width: 18, height: 18, accentColor: '#0071E3', cursor: 'pointer', flexShrink: 0 }} />
                        <span style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: present ? avatar.bg : '#F2F2F7',
                          color: present ? avatar.text : '#AEAEB2',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, letterSpacing: '-0.02em',
                        }}>
                          {(s.first_name || '?').charAt(0).toUpperCase()}
                        </span>
                        <span style={{ fontWeight: 500, fontSize: 15, fontFamily: 'var(--font-body)', color: present ? '#1D1D1F' : '#86868B' }}>{s.first_name} {s.last_name}</span>
                      </label>
                      {present ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={captionStyle}>Rating</span>
                          <RatingDots value={evaluations[s.id]?.rating || 3} onChange={r => setEvaluations({ ...evaluations, [s.id]: { ...evaluations[s.id], rating: r } })} size={30} />
                        </div>
                      ) : (
                        <Badge variant="danger" label="Absent" />
                      )}
                    </div>
                    {present && (
                      <input placeholder="Notes for this swimmer..." value={evaluations[s.id]?.notes || ''}
                        onChange={e => setEvaluations({ ...evaluations, [s.id]: { ...evaluations[s.id], notes: e.target.value } })}
                        style={fieldStyle}
                        {...inputFocusProps}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group Evaluation */}
          <div style={{
            ...cardStyle,
            padding: '20px 24px 22px', marginBottom: 24,
            animation: 'fadeInUp 0.3s ease-out 0.08s both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #F2F2F7' }}>
              <span style={iconTileStyle}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0071E3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </span>
              <h3 style={sectionTitleStyle}>Group evaluation</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={captionStyle}>Rating</span>
              <RatingDots value={groupEval.rating} onChange={r => setGroupEval({ ...groupEval, rating: r })} size={36} />
            </div>
            <textarea placeholder="Group notes..." value={groupEval.notes} onChange={e => setGroupEval({ ...groupEval, notes: e.target.value })}
              style={{ ...fieldStyle, height: 'auto', minHeight: 88, padding: 12, resize: 'vertical', lineHeight: 1.5 }}
              {...inputFocusProps}
            />
          </div>

          {/* Submit */}
          <Button variant="accent" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> Saving...</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg> Submit daily training</>
            )}
          </Button>
        </>
      )}

      <SuccessToast show={success} />
    </div>
  );
}
