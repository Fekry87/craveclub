import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { FormPage, FormPageActions, FormField, Input, TextArea, Button, PageHeader, getAvatarColor } from '../../components/CrudTable';

const CLUB_FEATURES = [
  {
    key:   'subscription_plans',
    dbKey: 'subscription_plans_enabled',
    label: 'Subscription Plans',
    desc:  'Allow club to create and manage subscription plans for swimmers',
    icon:  '\u{1F4B3}',
  },
  {
    key:   'training_plans',
    dbKey: 'training_plans_enabled',
    label: 'Training Plans',
    desc:  'Coaches can build and assign training programs',
    icon:  '\u{1F4CB}',
  },
  {
    key:   'skills',
    dbKey: 'skills_enabled',
    label: 'Skills Tracking',
    desc:  'Track swimmer skill progression',
    icon:  '\u{1F3AF}',
  },
  {
    key:   'leaderboard',
    dbKey: 'leaderboard_enabled',
    label: 'Leaderboard',
    desc:  'Competitive rankings visible to swimmers',
    icon:  '\u{1F3C6}',
  },
  {
    key:   'evaluations',
    dbKey: 'evaluations_enabled',
    label: 'Evaluations',
    desc:  'Coach evaluation system for swimmers',
    icon:  '\u{1F4CA}',
  },
  {
    key:   'attendance_tracking',
    dbKey: 'attendance_tracking_enabled',
    label: 'Attendance',
    desc:  'Session attendance tracking',
    icon:  '\u{2705}',
  },
  {
    key:   'swimmer_accounts',
    dbKey: 'swimmer_accounts_enabled',
    label: 'Swimmer Accounts',
    desc:  'Swimmer login and self-service portal',
    icon:  '\u{1F3CA}',
  },
  {
    key:   'coach_portal',
    dbKey: 'coach_portal_enabled',
    label: 'Coach Portal',
    desc:  'Dedicated coach dashboard and tools',
    icon:  '\u{1F9D1}\u{200D}\u{1F3EB}',
  },
];

// Build default features object from CLUB_FEATURES (all enabled)
const defaultFeatures = Object.fromEntries(CLUB_FEATURES.map(f => [f.dbKey, true]));

// Extract features from club.features into form-friendly object
function extractFeatures(clubFeatures) {
  if (!clubFeatures) return { ...defaultFeatures };
  const result = {};
  for (const f of CLUB_FEATURES) {
    result[f.dbKey] = clubFeatures[f.dbKey] !== false && clubFeatures[f.dbKey] !== undefined ? clubFeatures[f.dbKey] : false;
  }
  return result;
}

const colorPresets = ['#0ea5e9','#22d3ee','#2dd4bf','#10b981','#a78bfa','#8b5cf6','#f472b6','#f43f5e','#fb923c','#fbbf24','#38bdf8','#6366f1'];

function ColorPicker({ label, value, onChange }) {
  return (
    <FormField label={label}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'rgba(6,13,31,0.6)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ width: 48, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(51,65,85,0.4)', position: 'relative' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: value || '#8b5cf6', boxShadow: `0 0 12px ${value || '#8b5cf6'}40`, border: '2px solid rgba(255,255,255,0.15)' }} />
          <input type="color" value={value || '#8b5cf6'} onChange={e => onChange(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
        </div>
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="#8b5cf6"
          style={{ flex: 1, minWidth: 0, padding: '0 14px', height: 44, background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: '0.875rem', fontFamily: "'DM Mono', 'DM Sans', monospace", letterSpacing: '0.04em', outline: 'none' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
        {colorPresets.map(color => (
          <button key={color} onClick={() => onChange(color)}
            style={{ width: 22, height: 22, borderRadius: 6, background: color, border: value === color ? '2px solid #fff' : '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.2s', transform: value === color ? 'scale(1.1)' : 'scale(1)' }}
          />
        ))}
      </div>
    </FormField>
  );
}

function FeatureToggleRow({ feature, enabled, onChange }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0', borderBottom: '1px solid rgba(51,65,85,0.15)',
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 20 }}>{feature.icon}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{feature.label}</div>
          <div style={{ fontSize: 12, color: '#718096' }}>{feature.desc}</div>
        </div>
      </div>
      <label style={{
        position: 'relative', display: 'inline-block',
        width: 44, height: 24, cursor: 'pointer', flexShrink: 0,
      }}>
        <input
          type="checkbox"
          checked={enabled !== false}
          onChange={() => onChange(!enabled)}
          style={{ opacity: 0, width: 0, height: 0 }}
        />
        <span style={{
          position: 'absolute', inset: 0,
          borderRadius: 999,
          background: enabled !== false ? '#58CC02' : '#CBD5E0',
          transition: 'background 200ms ease',
        }} />
        <span style={{
          position: 'absolute',
          top: 3, left: enabled !== false ? 23 : 3,
          width: 18, height: 18,
          borderRadius: '50%', background: '#FFFFFF',
          transition: 'left 200ms ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </label>
    </div>
  );
}

const emptyForm = {
  name: '', slug: '', about: '', contact_email: '', contact_phone: '',
  theme_color: '#0ea5e9', primary_color: '', secondary_color: '', accent_color: '', font_preference: '',
  manager_name: '', manager_email: '', manager_password: '',
  features: { ...defaultFeatures },
  max_branches: 1,
};

/* ── Club Card Component ── */
function ClubCard({ club, index, onEdit, onDelete, onClick }) {
  const ac = getAvatarColor(club.name);
  const initials = club.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'C';
  const rawColor = club.primary_color || club.theme_color;
  const brandColor = rawColor ? (rawColor.startsWith('#') ? rawColor : `#${rawColor}`) : null;
  const enabledFeatures = CLUB_FEATURES.filter(f => club.features?.[f.dbKey] !== false);
  const usedBranches = club.branches_count ?? 0;
  const maxBranches = club.max_branches ?? 1;

  return (
    <div
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3), 0 0 30px rgba(139,92,246,0.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(51,65,85,0.15)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
      }}
      style={{
        background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
        borderRadius: 20, padding: 0, overflow: 'hidden',
        border: '1px solid rgba(51,65,85,0.15)',
        cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        animation: `fadeInUp 0.4s ease-out ${index * 0.06}s both`,
        position: 'relative',
      }}
    >
      {/* Top color banner */}
      <div style={{
        height: 6, width: '100%',
        background: brandColor
          ? `linear-gradient(90deg, ${brandColor}, ${brandColor}88)`
          : 'linear-gradient(90deg, rgba(139,92,246,0.3), rgba(139,92,246,0.1))',
      }} />

      <div style={{ padding: '20px 22px 18px' }}>
        {/* Header: Avatar + Name + Slug */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          {club.logo_url ? (
            <img src={club.logo_url} alt={club.name}
              style={{ width: 48, height: 48, borderRadius: 14, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.08)', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: ac.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Outfit', sans-serif", fontSize: 17, fontWeight: 700, color: ac.text,
              flexShrink: 0, boxShadow: '0 3px 12px rgba(0,0,0,0.25)',
            }}>{initials}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: '#f1f5f9', fontSize: 17, fontWeight: 700,
              fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{club.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{
                padding: '2px 9px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                background: 'rgba(51,65,85,0.3)', color: '#94a3b8',
                fontFamily: "'DM Sans', monospace",
              }}>{club.slug}</span>
              {brandColor && (
                <div style={{
                  width: 14, height: 14, borderRadius: 5,
                  background: brandColor, border: '1.5px solid rgba(255,255,255,0.12)',
                  boxShadow: `0 0 8px ${brandColor}40`,
                }} />
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
          marginBottom: 14,
        }}>
          {[
            {
              label: 'Users', value: club.users_count || 0,
              color: '#a78bfa', bg: 'rgba(139,92,246,0.06)',
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>,
            },
            {
              label: 'Swimmers', value: club.swimmer_profiles_count || 0,
              color: '#22d3ee', bg: 'rgba(34,211,238,0.06)',
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M1 1l4 4m0 0l4-4M5 5v12" /><path d="M12 3a4 4 0 100 8 4 4 0 000-8z" /></svg>,
            },
            {
              label: 'Branches', value: `${usedBranches}/${maxBranches}`,
              color: usedBranches >= maxBranches ? '#f43f5e' : '#fbbf24',
              bg: usedBranches >= maxBranches ? 'rgba(244,63,94,0.06)' : 'rgba(251,191,36,0.06)',
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={usedBranches >= maxBranches ? '#f43f5e' : '#fbbf24'} strokeWidth="2" strokeLinecap="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>,
            },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: '10px 10px', borderRadius: 12,
              background: stat.bg,
              border: `1px solid ${stat.color}12`,
              textAlign: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 3 }}>
                {stat.icon}
                <span style={{ color: stat.color, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                  {stat.value}
                </span>
              </div>
              <div style={{ color: '#64748b', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
          {enabledFeatures.slice(0, 5).map(f => (
            <span key={f.key} style={{
              fontSize: 10, padding: '2px 7px',
              borderRadius: 999, background: 'rgba(88,204,2,0.06)',
              color: '#58CC02', border: '1px solid rgba(88,204,2,0.15)',
              lineHeight: '16px',
            }}>
              {f.icon} {f.label}
            </span>
          ))}
          {enabledFeatures.length > 5 && (
            <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 999,
              background: 'rgba(148,163,184,0.06)', color: '#94a3b8',
              border: '1px solid rgba(148,163,184,0.15)', lineHeight: '16px',
            }}>
              +{enabledFeatures.length - 5} more
            </span>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          paddingTop: 14, borderTop: '1px solid rgba(51,65,85,0.12)',
        }}>
          <button
            onClick={e => { e.stopPropagation(); onClick(); }}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 10,
              background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
              color: '#a78bfa', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.06)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            View Details
          </button>
          <button
            onClick={e => { e.stopPropagation(); onEdit(club); }}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)',
              color: '#22d3ee', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.06)'; }}
            title="Edit Club"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(club); }}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)',
              color: '#f43f5e', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.06)'; }}
            title="Delete Club"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CorporateClubs() {
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState(null);
  const [editClub, setEditClub] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = () => api.get('/corporate/clubs', { params: { search } }).then(r => setClubs(r.data.data || [])).catch(() => {});
  useEffect(() => { load(); }, [search]);

  const closeForm = () => { setShowModal(false); setEditId(null); setEditClub(null); setError(null); setForm({ ...emptyForm }); };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      if (editId) {
        await api.put(`/corporate/clubs/${editId}`, form);
        await api.put(`/corporate/clubs/${editId}/features`, form.features);
      } else {
        await api.post('/corporate/clubs', form);
      }
      closeForm();
      load();
    } catch (err) {
      const msgs = err.response?.data?.errors;
      setError(msgs ? Object.values(msgs).map(a => a[0]).join(', ') : (err.response?.data?.message || 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (club) => {
    setEditId(club.id);
    setEditClub(club);
    setError(null);
    try {
      const res = await api.get(`/corporate/clubs/${club.id}`);
      const full = res.data;
      setEditClub(full);
      setForm({
        name: full.name, slug: full.slug, about: full.about || '',
        contact_email: full.contact_email || '', contact_phone: full.contact_phone || '',
        theme_color: full.theme_color || '#0ea5e9',
        primary_color: full.primary_color || '', secondary_color: full.secondary_color || '',
        accent_color: full.accent_color || '', font_preference: full.font_preference || '',
        manager_name: full.manager?.name || '', manager_email: full.manager?.email || '', manager_password: '',
        max_branches: full.max_branches || 1,
        features: extractFeatures(full.features),
      });
    } catch {
      setForm({
        name: club.name, slug: club.slug, about: club.about || '',
        contact_email: club.contact_email || '', contact_phone: club.contact_phone || '',
        theme_color: club.theme_color || '#0ea5e9',
        primary_color: club.primary_color || '', secondary_color: club.secondary_color || '',
        accent_color: club.accent_color || '', font_preference: club.font_preference || '',
        manager_name: '', manager_email: '', manager_password: '',
        max_branches: club.max_branches || 1,
        features: extractFeatures(club.features),
      });
    }
    setShowModal(true);
  };

  const handleDelete = async (club) => {
    if (confirm('Delete this club? This will remove all associated data.')) {
      try {
        await api.delete(`/corporate/clubs/${club.id}`);
        load();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete club');
      }
    }
  };

  /* ── Full-page form for Create / Edit ── */
  if (showModal) {
    return (
      <FormPage
        title={editId ? 'Edit Club' : 'New Club'}
        onBack={closeForm}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
      >
        {/* Club Info */}
        <FormField label="Club Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></FormField>
        <FormField label="Slug"><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="e.g. future-academy" /></FormField>
        <FormField label="About"><TextArea value={form.about} onChange={e => setForm({ ...form, about: e.target.value })} /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Contact Email"><Input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></FormField>
          <FormField label="Contact Phone"><Input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} /></FormField>
        </div>

        {/* Branding */}
        <div style={{ marginTop: 12, padding: '18px 18px 6px', borderRadius: 14, background: 'rgba(139,92,246,0.03)', border: '1px solid rgba(139,92,246,0.08)' }}>
          <h4 style={{ color: '#a78bfa', margin: '0 0 14px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.49 8.49l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.49-8.49l2.83-2.83" /></svg>
            Club Branding
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <ColorPicker label="Primary Color" value={form.primary_color || form.theme_color} onChange={v => setForm({ ...form, primary_color: v, theme_color: v })} />
            <ColorPicker label="Secondary Color" value={form.secondary_color} onChange={v => setForm({ ...form, secondary_color: v })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <ColorPicker label="Accent Color" value={form.accent_color} onChange={v => setForm({ ...form, accent_color: v })} />
            <FormField label="Logo URL"><Input value={form.logo_url || ''} onChange={e => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." /></FormField>
          </div>
        </div>

        {/* Branch Limit */}
        <div style={{ marginTop: 12, padding: '18px 18px 14px', borderRadius: 14, background: 'rgba(251,191,36,0.03)', border: '1px solid rgba(251,191,36,0.08)' }}>
          <h4 style={{ color: '#fbbf24', margin: '0 0 4px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            Branch Limit
          </h4>
          <div style={{ color: '#64748b', fontSize: 12, marginBottom: 12 }}>Maximum number of branches this club can create</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" onClick={() => setForm({ ...form, max_branches: Math.max(1, form.max_branches - 1) })}
              style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(51,65,85,0.5)', background: 'rgba(6,13,31,0.6)', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <div style={{ minWidth: 80, textAlign: 'center', fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>{form.max_branches}</div>
            <button type="button" onClick={() => setForm({ ...form, max_branches: Math.min(100, form.max_branches + 1) })}
              style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(51,65,85,0.5)', background: 'rgba(6,13,31,0.6)', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {[1, 3, 5, 10].map(n => (
              <button key={n} type="button" onClick={() => setForm({ ...form, max_branches: n })}
                style={{ padding: '4px 12px', borderRadius: 999, border: form.max_branches === n ? '2px solid #1CB0F6' : '2px solid rgba(51,65,85,0.4)', background: form.max_branches === n ? 'rgba(28,176,246,0.1)' : 'rgba(6,13,31,0.4)', color: form.max_branches === n ? '#1CB0F6' : '#718096', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {n} {n === 1 ? 'branch' : 'branches'}
              </button>
            ))}
          </div>
          {editId && editClub && (() => {
            const used = editClub.branches_count ?? 0;
            const remaining = form.max_branches - used;
            return (
              <div style={{ fontSize: 13, color: '#718096', marginTop: 10 }}>
                Currently using <strong style={{ color: '#e2e8f0' }}>{used}</strong> of{' '}
                <strong style={{ color: '#e2e8f0' }}>{form.max_branches}</strong> branches
                {remaining < 0 && (
                  <span style={{ color: '#E53E3E', marginLeft: 8 }}>
                    Warning: limit is below existing branch count
                  </span>
                )}
              </div>
            );
          })()}
        </div>

        {/* Club Features */}
        <div style={{ marginTop: 12, padding: '18px 18px 8px', borderRadius: 14, background: 'rgba(88,204,2,0.03)', border: '1px solid rgba(88,204,2,0.08)' }}>
          <h4 style={{ color: '#58CC02', margin: '0 0 4px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#58CC02" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            Club Features
          </h4>
          <div style={{ color: '#64748b', fontSize: 12, marginBottom: 12 }}>Control which features this club can access</div>
          {CLUB_FEATURES.map(f => (
            <FeatureToggleRow
              key={f.key}
              feature={f}
              enabled={form.features[f.dbKey]}
              onChange={v => setForm({ ...form, features: { ...form.features, [f.dbKey]: v } })}
            />
          ))}
        </div>

        {/* Manager Account */}
        <div style={{ marginTop: 12, padding: '18px 18px 6px', borderRadius: 14, background: 'rgba(45,212,191,0.03)', border: '1px solid rgba(45,212,191,0.08)' }}>
          <h4 style={{ color: '#2dd4bf', margin: '0 0 14px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Club Manager Account
          </h4>
          <FormField label="Manager Name"><Input value={form.manager_name} onChange={e => setForm({ ...form, manager_name: e.target.value })} /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Manager Email"><Input type="email" value={form.manager_email} onChange={e => setForm({ ...form, manager_email: e.target.value })} /></FormField>
            <FormField label="Manager Password"><Input type="password" value={form.manager_password} onChange={e => setForm({ ...form, manager_password: e.target.value })} placeholder={editId ? 'Leave blank to keep current' : ''} /></FormField>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)', color: '#fc8181', fontSize: 13 }}>{error}</div>
        )}

        <FormPageActions>
          <Button variant="secondary" onClick={closeForm}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : (editId ? 'Update' : 'Create Club')}</Button>
        </FormPageActions>
      </FormPage>
    );
  }

  return (
    <div>
      <PageHeader title="Club Management" search={search} onSearch={setSearch} searchPlaceholder="Search clubs...">
        <Button onClick={() => { setEditId(null); setEditClub(null); setError(null); setForm({ ...emptyForm }); setShowModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          New Club
        </Button>
      </PageHeader>

      {/* Summary strip */}
      {clubs.length > 0 && (
        <div style={{
          display: 'flex', gap: 14, marginBottom: 24,
          animation: 'fadeInUp 0.4s ease-out',
        }}>
          {[
            { label: 'Total Clubs', value: clubs.length, color: '#a78bfa', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg> },
            { label: 'Total Users', value: clubs.reduce((s, c) => s + (c.users_count || 0), 0), color: '#22d3ee', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg> },
            { label: 'Total Swimmers', value: clubs.reduce((s, c) => s + (c.swimmer_profiles_count || 0), 0), color: '#2dd4bf', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="7" r="4" /><path d="M5 21v-2a7 7 0 0114 0v2" /></svg> },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, padding: '14px 18px', borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)',
              border: `1px solid ${s.color}12`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${s.color}0f`, border: `1px solid ${s.color}1a`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{s.icon}</div>
              <div>
                <div style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{s.value}</div>
                <div style={{ color: '#64748b', fontSize: 11, fontWeight: 500, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cards grid */}
      {clubs.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px', borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(13,31,60,0.3) 0%, rgba(10,22,40,0.2) 100%)',
          border: '1px solid rgba(51,65,85,0.12)',
          animation: 'fadeInUp 0.4s ease-out',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 600, fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>
            {search ? 'No clubs match your search' : 'No clubs yet'}
          </div>
          <div style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
            {search ? 'Try a different search term' : 'Create your first club to get started'}
          </div>
          {!search && (
            <Button onClick={() => { setEditId(null); setEditClub(null); setError(null); setForm({ ...emptyForm }); setShowModal(true); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Create Club
            </Button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 18,
        }}>
          {clubs.map((club, i) => (
            <ClubCard
              key={club.id}
              club={club}
              index={i}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onClick={() => navigate(`/corporate/clubs/${club.id}`)}
            />
          ))}
        </div>
      )}

      {error && !showModal && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          padding: '12px 18px', borderRadius: 12,
          background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)',
          color: '#fda4af', fontSize: 13, fontWeight: 500,
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          animation: 'fadeInUp 0.3s ease-out',
          zIndex: 100,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
