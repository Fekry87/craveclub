import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { getAvatarColor } from '../../components/CrudTable';
import ClubSportModulesPanel from './ClubSportModulesPanel';

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
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, background: enabled ? 'rgba(139,92,246,0.04)' : 'rgba(51,65,85,0.08)', border: `1px solid ${enabled ? 'rgba(139,92,246,0.12)' : 'rgba(51,65,85,0.15)'}`, cursor: 'pointer', transition: 'all 0.2s' }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: enabled ? 'rgba(139,92,246,0.1)' : 'rgba(51,65,85,0.15)', border: `1px solid ${enabled ? 'rgba(139,92,246,0.15)' : 'rgba(51,65,85,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={enabled ? '#a78bfa' : '#475569'} strokeWidth="2" strokeLinecap="round"><path d={f.icon} /></svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: enabled ? '#e2e8f0' : '#64748b', fontSize: 14, fontWeight: 600 }}>{f.label}</div>
        <div style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>{f.desc}</div>
      </div>
      <div style={{ width: 42, height: 22, borderRadius: 11, background: enabled ? 'linear-gradient(135deg, #8b5cf6, #a78bfa)' : 'rgba(51,65,85,0.4)', padding: 2, transition: 'all 0.25s', flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'all 0.25s', transform: enabled ? 'translateX(20px)' : 'translateX(0)' }} />
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px 12px', borderRadius: 12, background: 'rgba(6,13,31,0.3)', border: '1px solid rgba(51,65,85,0.15)' }}>
      <div style={{ color, fontSize: 28, fontWeight: 700, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{value}</div>
      <div style={{ color: '#64748b', fontSize: 12, fontWeight: 500, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    </div>
  );
}

export default function CorporateClubDetail() {
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#64748b' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}><circle cx="12" cy="12" r="10" fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="3" /><path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" /></svg>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Loading club...</div>
      </div>
    </div>
  );

  const ac = getAvatarColor(club.name);
  const initials = club.name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?';

  return (
    <div>
      {/* Back button */}
      <button onClick={() => navigate('/corporate/clubs')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 20, padding: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        Back to Clubs
      </button>

      {/* Club Header */}
      <div style={{ background: 'linear-gradient(145deg, rgba(13,31,60,0.85) 0%, rgba(139,92,246,0.06) 50%, rgba(13,31,60,0.65) 100%)', borderRadius: 22, padding: '32px 36px', border: '1px solid rgba(139,92,246,0.1)', position: 'relative', overflow: 'hidden', marginBottom: 24, animation: 'fadeInUp 0.5s ease-out' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 10%, rgba(139,92,246,0.2) 50%, transparent 90%)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: ac.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 700, color: ac.text, flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>{club.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'rgba(51,65,85,0.3)', color: '#94a3b8', fontFamily: "'DM Sans', monospace" }}>{club.slug}</span>
              {club.contact_email && <span style={{ color: '#64748b', fontSize: 13 }}>{club.contact_email}</span>}
            </div>
          </div>
          {/* Color swatches */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[club.primary_color || club.theme_color, club.secondary_color, club.accent_color].filter(Boolean).map((color, i) => (
              <div key={i} style={{ width: 28, height: 28, borderRadius: 8, background: color, border: '2px solid rgba(255,255,255,0.1)', boxShadow: `0 0 10px ${color}40` }} />
            ))}
          </div>
          <button
            onClick={() => navigate(`/corporate/clubs/${id}/branding`)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.49 8.49l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.49-8.49l2.83-2.83" /></svg>
            Configure Branding
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24, animation: 'fadeInUp 0.5s ease-out 0.1s both' }}>
        <StatBox label="Users" value={club.users_count || 0} color="#a78bfa" />
        <StatBox label="Swimmers" value={club.swimmer_profiles_count || 0} color="#22d3ee" />
        <StatBox label="Coaches" value={club.coach_profiles_count || 0} color="#2dd4bf" />
        <StatBox label="Groups" value={club.groups_count || 0} color="#38bdf8" />
        <StatBox label="Sessions" value={club.training_sessions_count || 0} color="#fbbf24" />
      </div>

      {/* Feature Controls */}
      <div style={{ background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)', borderRadius: 18, padding: '24px 26px', border: '1px solid rgba(139,92,246,0.08)', animation: 'fadeInUp 0.5s ease-out 0.2s both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: 18, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Feature Controls</h2>
          {saving && <span style={{ color: '#a78bfa', fontSize: 12, fontWeight: 500, marginLeft: 'auto' }}>Saving...</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
