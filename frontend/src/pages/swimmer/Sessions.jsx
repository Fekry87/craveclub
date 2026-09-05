import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { PageHeader } from '../../components/CrudTable';
import { useTranslation } from 'react-i18next';

const monoLabel = {
  fontFamily: 'var(--font-body)', fontSize: 12, color: '#6E6E73',
};

function SessionCard({ session, index }) {
  const date = session.date?.split('T')[0];
  const dayName = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }) : '';
  const dayNum = date ? new Date(date + 'T00:00:00').getDate() : '';
  const month = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }) : '';
  const attendance = session.attendances?.[0];
  const isPresent = attendance?.present;

  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        display: 'flex', alignItems: 'center', gap: 18, padding: '16px 20px',
        background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        transition: 'border-color 0.15s ease',
        animation: `fadeInUp 0.3s ease-out ${index * 0.03}s both`,
      }}
    >
      {/* Date block */}
      <div style={{ borderRadius: 16,
        width: 56, height: 60, background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <div style={{ ...monoLabel, fontSize: 10 }}>{dayName}</div>
        <div style={{ color: '#1D1D1F', fontSize: 22, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{dayNum}</div>
        <div style={{ ...monoLabel, fontSize: 9, color: '#86868B' }}>{month}</div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: '#1D1D1F', fontSize: 16, fontWeight: 500, fontFamily: 'var(--font-display)',
          letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 6,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {session.group?.name || 'Training Session'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {session.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#515154', fontSize: 13 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6E6E73" strokeWidth="1.8" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
              {session.location}
            </div>
          )}
          {session.plan?.title && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#515154', fontSize: 13 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6E6E73" strokeWidth="1.8" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              {session.plan.title}
            </div>
          )}
        </div>
      </div>

      {/* Attendance badge */}
      {attendance && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', padding: '3px 8px',
          fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
          letterSpacing: '-0.02em', lineHeight: '14px',
          background: 'transparent',
          border: `1px solid ${isPresent ? '#34C759' : '#FF3B30'}`,
          color: isPresent ? '#34C759' : '#FF3B30',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {isPresent ? 'Present' : 'Absent'}
        </span>
      )}

      {/* Time */}
      <div style={{
        ...monoLabel, color: '#1D1D1F', fontSize: 12,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {session.start_time?.substring(0,5)} — {session.end_time?.substring(0,5)}
      </div>
    </div>
  );
}

export default function SwimmerSessions() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  useEffect(() => { api.get('/swimmer/sessions').then(r => setSessions(r.data.data || [])).catch(() => {}); }, []);

  return (
    <div>
      <PageHeader title={t('nav.mySessions')} />

      {sessions.length > 0 && (
        <div style={{ ...monoLabel, marginBottom: 20, animation: 'fadeIn 0.25s ease-out' }}>
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </div>
      )}

      <div style={{ borderRadius: 16,
        background: '#FFFFFF',
        padding: '24px 26px', border: '1px solid #E5E5EA',
        animation: 'fadeInUp 0.4s ease-out',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          paddingBottom: 14, marginBottom: 20, borderBottom: '1px solid #E5E5EA',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: '#0071E3', display: 'inline-block', flexShrink: 0 }} />
          <h2 style={{
            margin: 0, color: '#1D1D1F', fontSize: 18, fontWeight: 500,
            fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1,
          }}>Session History</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.length > 0 ? sessions.map((s, i) => <SessionCard key={s.id} session={s} index={i} />) : (
            <div style={{ textAlign: 'center', padding: '50px 20px' }}>
              <div style={{ borderRadius: 16,
                width: 64, height: 64, background: '#FFFFFF', border: '1px solid #E5E5EA',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div style={{
                color: '#1D1D1F', fontSize: 16, fontWeight: 500, fontFamily: 'var(--font-display)',
                letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8,
              }}>{t('sessions.noSessions')}</div>
              <div style={{ color: '#6E6E73', fontSize: 13 }}>{t('sessions.noSessionsHint')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
