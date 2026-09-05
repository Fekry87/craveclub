import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { getAvatarColor } from '../../components/CrudTable';
import { Badge } from '../../components/ui/Badge';
import { labelStyle } from '../../components/ui/styles';

const DISPLAY = {
  fontFamily: 'var(--font-display)', fontWeight: 600,
  letterSpacing: '-0.02em', lineHeight: 1,
};

export default function SessionDetailPage() {
  const { t } = useTranslation();
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#6E6E73' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5EA" strokeWidth="2" />
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#0071E3" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div style={{ ...labelStyle }}>{t('loading.default')}</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ ...DISPLAY, fontSize: 20, color: '#1D1D1F', marginBottom: 18 }}>Session not found</div>
        <button type="button" onClick={() => navigate(-1)} className="pl-btn pl-btn-secondary">Go Back</button>
      </div>
    );
  }

  const date = session.date?.split('T')[0];
  const statusVariants = {
    Scheduled: 'accent',
    Completed: 'success',
    Cancelled: 'danger',
  };
  const statusVariant = statusVariants[session.status] || 'neutral';

  return (
    <div>
      {/* Back + Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          onMouseEnter={e => { e.currentTarget.style.color = '#1D1D1F'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6E6E73'; }}
          style={{
            background: 'transparent', border: 'none', color: '#6E6E73', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, padding: 0, marginBottom: 16,
            ...labelStyle, transition: 'color 0.15s ease',
          }}
        >
          <svg className="rtl-flip" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Sessions
        </button>

        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 18, flexWrap: 'wrap',
          paddingBottom: 18, borderBottom: '1px solid #E5E5EA',
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...labelStyle, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span>{date}</span>
              {session.start_time && <span style={{ color: '#1D1D1F' }}>{session.start_time?.slice(0, 5)} – {session.end_time?.slice(0, 5)}</span>}
            </div>
            <h1 style={{ margin: 0, ...DISPLAY, fontSize: 32, letterSpacing: '-0.02em', color: '#1D1D1F' }}>
              {session.title || session.group?.name || 'Training Session'}
            </h1>
          </div>
          <Badge variant={statusVariant} label={session.status} />
        </div>
      </div>

      {/* Details Grid */}
      <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Info Card */}
        <div
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
          style={{ borderRadius: 16,
            background: '#FFFFFF',
            padding: '22px 24px',
            border: '1px solid #E5E5EA',
            transition: 'border-color 0.15s ease',
          }}
        >
          <h3 style={{
            margin: '0 0 16px', ...DISPLAY, fontSize: 16, color: '#1D1D1F',
            paddingBottom: 12, borderBottom: '1px solid #E5E5EA',
          }}>Session Details</h3>
          {[
            { label: 'Group', value: session.group?.name || '—' },
            { label: 'Type', value: session.type || 'training' },
            { label: 'Location', value: session.location || '—' },
            { label: 'Notes', value: session.notes || '—' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', gap: 12,
              padding: '10px 0', borderBottom: i < 3 ? '1px solid #F2F2F7' : 'none',
            }}>
              <span style={{ ...labelStyle, flexShrink: 0 }}>{item.label}</span>
              <span style={{ color: '#1D1D1F', fontSize: 13, textAlign: 'end' }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Attendance Card */}
        <div
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
          style={{ borderRadius: 16,
            background: '#FFFFFF',
            padding: '22px 24px',
            border: '1px solid #E5E5EA',
            transition: 'border-color 0.15s ease',
          }}
        >
          <h3 style={{
            margin: '0 0 16px', ...DISPLAY, fontSize: 16, color: '#1D1D1F',
            paddingBottom: 12, borderBottom: '1px solid #E5E5EA',
          }}>Attendance</h3>
          {session.attendance?.length > 0 ? (
            <div>
              {session.attendance.map((a, i) => {
                const ac = getAvatarColor(a.swimmer_name || 'S');
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 0',
                    borderBottom: i < session.attendance.length - 1 ? '1px solid #F2F2F7' : 'none',
                  }}>
                    <div style={{ borderRadius: 10,
                      width: 30, height: 30, background: ac.bg, color: ac.text, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600,
                    }}>{(a.swimmer_name || '?')[0]}</div>
                    <div style={{
                      flex: 1, minWidth: 0, color: '#1D1D1F', fontSize: 13,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{a.swimmer_name}</div>
                    <Badge variant={a.present ? 'success' : 'danger'} label={a.present ? 'Present' : 'Absent'} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: '#6E6E73' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 12 }}>
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div style={{ ...labelStyle }}>No attendance recorded</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
