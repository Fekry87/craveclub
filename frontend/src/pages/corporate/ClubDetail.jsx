import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { getAvatarColor } from '../../components/CrudTable';
import ClubSportModulesPanel from './ClubSportModulesPanel';

const labelStyle = {
  fontFamily: 'var(--font-body)', fontSize: 12, color: '#6E6E73',
};

const featureLabels = {
  leaderboard_enabled: { label: 'Leaderboard', desc: 'Gamified XP ranking system for swimmers', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  evaluations_enabled: { label: 'Evaluations', desc: 'Coach evaluation and rating system', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  skills_enabled: { label: 'Skills', desc: 'Skill and technique tracking', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  training_plans_enabled: { label: 'Training Plans', desc: 'Reusable session plans with exercises', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  attendance_tracking_enabled: { label: 'Attendance', desc: 'Session attendance tracking', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  swimmer_accounts_enabled: { label: 'Swimmer Accounts', desc: 'Swimmer login and self-service portal', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  coach_portal_enabled: { label: 'Coach Portal', desc: 'Dedicated coach dashboard and tools', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  subscription_plans_enabled: { label: 'Subscription Plans', desc: 'Manage subscription tiers and pricing', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
};

function FeatureToggleCard({ featureKey, enabled, onToggle }) {
  const f = featureLabels[featureKey];
  return (
    <div onClick={onToggle}
      onMouseEnter={e => { if (!enabled) e.currentTarget.style.borderColor = '#86868B'; }}
      onMouseLeave={e => { if (!enabled) e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
        background: '#FFFFFF', border: `1px solid ${enabled ? '#1D1D1F' : '#E5E5EA'}`,
        cursor: 'pointer', transition: 'border-color 0.15s ease',
      }}
    >
      <div style={{
        width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: enabled ? '#F2F2F7' : '#FFFFFF', border: `1px solid ${enabled ? '#E5E5EA' : '#E5E5EA'}`,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={enabled ? '#1D1D1F' : '#AEAEB2'} strokeWidth="2" strokeLinecap="round"><path d={f.icon} /></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: enabled ? '#1D1D1F' : '#6E6E73', fontSize: 14, fontWeight: 500,
          fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
        }}>{f.label}</div>
        <div style={{ color: '#6E6E73', fontSize: 12, marginTop: 3, fontFamily: 'var(--font-body)' }}>{f.desc}</div>
      </div>
      <div style={{ width: 42, height: 22, background: enabled ? '#1D1D1F' : '#AEAEB2', padding: 2, transition: 'background 0.2s ease', flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, background: '#F5F5F7', transition: 'transform 0.2s ease', transform: enabled ? 'translateX(20px)' : 'translateX(0)' }} />
      </div>
    </div>
  );
}

function StatBox({ label, value, index }) {
  return (
    <div style={{ borderRadius: 16, padding: '18px 16px', background: '#FFFFFF', border: '1px solid #E5E5EA' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ ...labelStyle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
        
      </div>
      <div style={{
        color: '#1D1D1F', fontSize: 30, fontWeight: 500, fontFamily: 'var(--font-display)',
        letterSpacing: '-0.02em', lineHeight: 1, marginTop: 14,
      }}>{value}</div>
    </div>
  );
}

export default function CorporateClubDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => api.get(`/corporate/clubs/${id}`).then(r => setClub(r.data)).catch(() => {});
  useEffect(() => { load(); }, [id]);

  const toggleFeature = async (key) => {
    const features = club.features || {};
    const newVal = !features[key];
    setSaving(true);
    await api.put(`/corporate/clubs/${id}/features`, { [key]: newVal });
    await load();
    setSaving(false);
  };

  if (!club) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#6E6E73' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}><circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5EA" strokeWidth="3" /><path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#1D1D1F" strokeWidth="3" strokeLinecap="round" /></svg>
        <div style={labelStyle}>{t('loading.default')}</div>
      </div>
    </div>
  );

  const ac = getAvatarColor(club.name);
  const initials = club.name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?';

  return (
    <div>
      {/* Back button */}
      <button onClick={() => navigate('/corporate/clubs')}
        style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 18, padding: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        Back to Clubs
      </button>

      {/* Club Header */}
      <div style={{ borderRadius: 16, background: '#FFFFFF', padding: '28px 32px', border: '1px solid #E5E5EA', marginBottom: 24, animation: 'fadeInUp 0.5s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ borderRadius: 14,
            width: 64, height: 64, background: ac.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: ac.text, flexShrink: 0,
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: '#1D1D1F', margin: 0,
              letterSpacing: '-0.02em', lineHeight: 1,
            }}>{club.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ ...labelStyle, color: '#515154', padding: '2px 8px', border: '1px solid #AEAEB2' }}>{club.slug}</span>
              {club.contact_email && <span style={{ color: '#6E6E73', fontSize: 13 }}>{club.contact_email}</span>}
            </div>
          </div>
          {/* Color swatches */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[club.primary_color || club.theme_color, club.secondary_color, club.accent_color].filter(Boolean).map((color, i) => (
              <div key={i} style={{ borderRadius: 6, width: 26, height: 26, background: color, border: '1px solid #E5E5EA' }} />
            ))}
          </div>
          <button type="button" className="pl-btn pl-btn-secondary pl-btn-sm"
            onClick={() => navigate(`/corporate/clubs/${id}/branding`)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.49 8.49l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.49-8.49l2.83-2.83" /></svg>
            Configure Branding
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24, animation: 'fadeInUp 0.5s ease-out 0.1s both' }}>
        <StatBox label="Users" value={club.users_count || 0} index={0} />
        <StatBox label="Swimmers" value={club.swimmer_profiles_count || 0} index={1} />
        <StatBox label="Coaches" value={club.coach_profiles_count || 0} index={2} />
        <StatBox label="Groups" value={club.groups_count || 0} index={3} />
        <StatBox label="Sessions" value={club.training_sessions_count || 0} index={4} />
      </div>

      {/* Feature Controls */}
      <div style={{ borderRadius: 16, background: '#FFFFFF', padding: '22px 24px', border: '1px solid #E5E5EA', animation: 'fadeInUp 0.5s ease-out 0.2s both' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10,
          paddingBottom: 14, marginBottom: 16, borderBottom: '1px solid #E5E5EA',
        }}>
          <h2 style={{
            margin: 0, color: '#1D1D1F', fontSize: 18, fontWeight: 500, fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em', lineHeight: 1,
          }}>Feature Controls</h2>
          {saving && <span style={{ ...labelStyle, color: '#0071E3' }}>{t('loading.saving')}</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
          {Object.keys(featureLabels).map(key => (
            <FeatureToggleCard key={key} featureKey={key} enabled={club.features?.[key] ?? true} onToggle={() => toggleFeature(key)} />
          ))}
        </div>
      </div>

      {/* Sport Modules */}
      <ClubSportModulesPanel clubId={club.id} />
    </div>
  );
}
