import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { PageHeader } from '../../components/CrudTable';
import { useTranslation } from 'react-i18next';

function SessionCard({ session, index }) {
  const date = session.date?.split('T')[0];
  const dayName = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }) : '';
  const dayNum = date ? new Date(date + 'T00:00:00').getDate() : '';
  const month = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }) : '';
  const attendance = session.attendances?.[0];
  const isPresent = attendance?.present;

  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(56,189,248,0.15)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.06)'; e.currentTarget.style.transform = 'translateX(0)'; }}
      style={{
        display: 'flex', alignItems: 'center', gap: 18, padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
        borderRadius: 14, border: '1px solid rgba(34,211,238,0.06)',
        transition: 'all 0.25s ease',
        animation: `fadeInUp 0.4s ease-out ${0.05 + index * 0.04}s both`,
      }}
    >
      {/* Date block */}
      <div style={{
        width: 56, height: 60, borderRadius: 12,
        background: 'linear-gradient(135deg, rgba(56,189,248,0.1) 0%, rgba(56,189,248,0.05) 100%)',
        border: '1px solid rgba(56,189,248,0.12)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <div style={{ color: '#38bdf8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{dayName}</div>
        <div style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif", lineHeight: 1.1 }}>{dayNum}</div>
        <div style={{ color: '#64748b', fontSize: 9, fontWeight: 500, textTransform: 'uppercase' }}>{month}</div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif", marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {session.group?.name || 'Training Session'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {session.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 13 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
              {session.location}
            </div>
          )}
          {session.plan?.title && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 13 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              {session.plan.title}
            </div>
          )}
        </div>
      </div>

      {/* Attendance badge */}
      {attendance && (
        <div style={{
          padding: '5px 12px', borderRadius: 8,
          background: isPresent ? 'rgba(45,212,191,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${isPresent ? 'rgba(45,212,191,0.15)' : 'rgba(239,68,68,0.15)'}`,
          color: isPresent ? '#2dd4bf' : '#f87171',
          fontSize: 12, fontWeight: 600, flexShrink: 0,
        }}>
          {isPresent ? '✓ Present' : '✗ Absent'}
        </div>
      )}

      {/* Time badge */}
      <div style={{
        padding: '7px 14px', borderRadius: 10,
        background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.12)',
        color: '#38bdf8', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {session.start_time?.substring(0,5)} - {session.end_time?.substring(0,5)}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.08)', color: '#64748b', fontSize: 13, fontWeight: 500 }}>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <div style={{
        background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)',
        borderRadius: 18, padding: '24px 26px', border: '1px solid rgba(34,211,238,0.06)',
        animation: 'fadeInUp 0.5s ease-out',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: 18, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Session History</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.length > 0 ? sessions.map((s, i) => <SessionCard key={s.id} session={s} index={i} />) : (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#475569' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div style={{ color: '#64748b', fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{t('sessions.noSessions')}</div>
              <div style={{ color: '#475569', fontSize: 13 }}>{t('sessions.noSessionsHint')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
