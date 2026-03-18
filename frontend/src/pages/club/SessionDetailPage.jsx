import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { PageHeader, Button, getAvatarColor } from '../../components/CrudTable';

export default function SessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/club/sessions/${id}`)
      .then(r => setSession(r.data.data || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#94a3b8' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 10 }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Loading session...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Session not found</div>
        <button onClick={() => navigate(-1)} style={{
          background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)',
          color: '#22d3ee', padding: '8px 20px', borderRadius: 10, cursor: 'pointer',
          fontSize: 13, fontWeight: 600,
        }}>Go Back</button>
      </div>
    );
  }

  const date = session.date?.split('T')[0];
  const statusColors = {
    Scheduled: { bg: 'rgba(34,211,238,0.10)', color: '#22d3ee', border: 'rgba(34,211,238,0.20)' },
    Completed: { bg: 'rgba(52,211,153,0.10)', color: '#34d399', border: 'rgba(52,211,153,0.20)' },
    Cancelled: { bg: 'rgba(244,63,94,0.10)', color: '#f43f5e', border: 'rgba(244,63,94,0.20)' },
  };
  const sc = statusColors[session.status] || statusColors.Scheduled;

  return (
    <div>
      {/* Back + Header */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => navigate(-1)}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          style={{
            background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8,
            fontSize: 13, fontWeight: 500, marginBottom: 12, transition: 'all 0.2s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Sessions
        </button>

        <div style={{
          padding: '20px 24px', borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(6,13,31,0.3) 100%)',
          border: '1px solid rgba(34,211,238,0.06)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 120, height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div>
              <h1 style={{
                margin: '0 0 4px', fontFamily: "'DM Sans', sans-serif",
                fontSize: 22, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em',
              }}>
                {session.title || session.group?.name || 'Training Session'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#94a3b8', fontSize: 13 }}>
                <span>{date}</span>
                {session.start_time && <span>{session.start_time?.slice(0, 5)} – {session.end_time?.slice(0, 5)}</span>}
              </div>
            </div>
            <span style={{
              padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
            }}>{session.status}</span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Info Card */}
        <div
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.06)'; }}
          style={{
            background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
            borderRadius: 18, padding: '22px 24px',
            border: '1px solid rgba(34,211,238,0.06)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <h3 style={{ margin: '0 0 16px', color: '#f1f5f9', fontSize: 15, fontWeight: 600 }}>Session Details</h3>
          {[
            { label: 'Group', value: session.group?.name || '—' },
            { label: 'Type', value: session.type || 'training' },
            { label: 'Location', value: session.location || '—' },
            { label: 'Notes', value: session.notes || '—' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>{item.label}</span>
              <span style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Attendance Card */}
        <div
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.06)'; }}
          style={{
            background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
            borderRadius: 18, padding: '22px 24px',
            border: '1px solid rgba(34,211,238,0.06)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <h3 style={{ margin: '0 0 16px', color: '#f1f5f9', fontSize: 15, fontWeight: 600 }}>Attendance</h3>
          {session.attendance?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {session.attendance.map((a, i) => {
                const ac = getAvatarColor(a.swimmer_name || 'S');
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 10,
                    background: 'rgba(13,31,60,0.4)',
                    border: '1px solid rgba(34,211,238,0.06)',
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: ac.bg, color: ac.text,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                    }}>{(a.swimmer_name || '?')[0]}</div>
                    <div style={{ flex: 1, color: '#f1f5f9', fontSize: 13, fontWeight: 500 }}>{a.swimmer_name}</div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: a.present ? 'rgba(52,211,153,0.10)' : 'rgba(244,63,94,0.10)',
                      color: a.present ? '#34d399' : '#f43f5e',
                    }}>{a.present ? 'Present' : 'Absent'}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#64748b' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 8, opacity: 0.5 }}>
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div style={{ fontSize: 13, fontWeight: 500 }}>No attendance recorded</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
