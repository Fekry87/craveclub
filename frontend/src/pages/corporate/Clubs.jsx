import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { FormPage, FormPageActions, FormField, Input, TextArea, Button, PageHeader, getAvatarColor } from '../../components/CrudTable';
import { useTranslation } from 'react-i18next';

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

const colorPresets = ['#1D1D1F', '#0071E3', '#515154', '#6E6E73', '#86868B', '#AEAEB2', '#F2F2F7', '#34C759', '#FF9500', '#FF3B30'];

const labelStyle = {
  fontFamily: 'var(--font-body)', fontSize: 12, color: '#6E6E73',
};

const monoTag = {
  display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
  fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: '14px', background: 'transparent',
  whiteSpace: 'nowrap',
};

function SectionTitle({ children, accent, hint }) {
  return (
    <div style={{ margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid #E5E5EA' }}>
      <h4 style={{ ...labelStyle, margin: 0, fontWeight: 400, display: 'flex', alignItems: 'center', gap: 8 }}>
        {accent && <span style={{ width: 6, height: 6, borderRadius: 3, background: '#0071E3', display: 'inline-block', flexShrink: 0 }} />}
        {children}
      </h4>
      {hint && <div style={{ color: '#6E6E73', fontSize: 12, marginTop: 6, fontFamily: 'var(--font-body)' }}>{hint}</div>}
    </div>
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <FormField label={label}>
      <div style={{ borderRadius: 16, display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #AEAEB2' }}>
        <div style={{ width: 46, height: 42, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderInlineEnd: '1px solid #E5E5EA', position: 'relative' }}>
          <div style={{ borderRadius: 6, width: 24, height: 24, background: value || '#1D1D1F', border: '1px solid #E5E5EA' }} />
          <input type="color" value={value || '#1D1D1F'} onChange={e => onChange(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
        </div>
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="#1D1D1F"
          style={{ flex: 1, minWidth: 0, padding: '0 12px', height: 42, background: 'transparent', border: 'none', color: '#1D1D1F', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        {colorPresets.map(color => (
          <button key={color} type="button" onClick={() => onChange(color)}
            style={{ borderRadius: 6, width: 22, height: 22, background: color, padding: 0, cursor: 'pointer', border: value === color ? '2px solid #1D1D1F' : '1px solid #E5E5EA', transition: 'border-color 0.15s ease' }}
          />
        ))}
      </div>
    </FormField>
  );
}

function FeatureToggleRow({ feature, enabled, onChange, index }) {
  const on = enabled !== false;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
      padding: '12px 0', borderBottom: '1px solid #E5E5EA',
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 500, color: '#1D1D1F',
            fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
          }}>{feature.label}</div>
          <div style={{ fontSize: 12, color: '#6E6E73', marginTop: 3, fontFamily: 'var(--font-body)' }}>{feature.desc}</div>
        </div>
      </div>
      <label style={{
        position: 'relative', display: 'inline-block',
        width: 44, height: 24, cursor: 'pointer', flexShrink: 0,
      }}>
        <input
          type="checkbox"
          checked={on}
          onChange={() => onChange(!enabled)}
          style={{ opacity: 0, width: 0, height: 0 }}
        />
        <span style={{
          position: 'absolute', inset: 0,
          background: on ? '#1D1D1F' : '#AEAEB2',
          transition: 'background 200ms ease',
        }} />
        <span style={{
          position: 'absolute',
          top: 3, insetInlineStart: on ? 23 : 3,
          width: 18, height: 18,
          background: '#F5F5F7',
          transition: 'inset-inline-start 200ms ease',
        }} />
      </label>
    </div>
  );
}

const emptyForm = {
  name: '', slug: '', about: '', contact_email: '', contact_phone: '',
  theme_color: '#0071E3', primary_color: '', secondary_color: '', accent_color: '', font_preference: '',
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
  const atLimit = usedBranches >= maxBranches;

  return (
    <div
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        cursor: 'pointer', transition: 'border-color 0.15s ease',
        animation: `fadeInUp 0.4s ease-out ${index * 0.06}s both`,
      }}
    >
      <div style={{ padding: '20px 22px 18px' }}>
        {/* Header: Avatar + Name + Slug */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {club.logo_url ? (
            <img src={club.logo_url} alt={club.name}
              style={{ borderRadius: 14, width: 48, height: 48, objectFit: 'cover', border: '1px solid #E5E5EA', flexShrink: 0 }}
            />
          ) : (
            <div style={{ borderRadius: 14,
              width: 48, height: 48, background: ac.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: ac.text,
              flexShrink: 0 }}>{initials}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: '#1D1D1F', fontSize: 17, fontWeight: 500,
              fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{club.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ ...monoTag, color: '#515154', border: '1px solid #AEAEB2' }}>{club.slug}</span>
              {brandColor && (
                <div style={{ width: 14, height: 14, background: brandColor, border: '1px solid #E5E5EA', flexShrink: 0 }} />
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, marginBottom: 16, background: '#E5E5EA', border: '1px solid #E5E5EA' }}>
          {[
            { label: 'Users', value: club.users_count || 0, color: '#1D1D1F' },
            { label: 'Swimmers', value: club.swimmer_profiles_count || 0, color: '#1D1D1F' },
            { label: 'Branches', value: `${usedBranches}/${maxBranches}`, color: atLimit ? '#FF3B30' : '#1D1D1F' },
          ].map(stat => (
            <div key={stat.label} style={{ padding: '12px 10px', background: '#FFFFFF', textAlign: 'center' }}>
              <div style={{
                color: stat.color, fontSize: 20, fontWeight: 500,
                fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1,
              }}>{stat.value}</div>
              <div style={{ ...labelStyle, fontSize: 10, marginTop: 6 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
          {enabledFeatures.slice(0, 5).map(f => (
            <span key={f.key} style={{ ...monoTag, color: '#515154', border: '1px solid #E5E5EA' }}>
              {f.label}
            </span>
          ))}
          {enabledFeatures.length > 5 && (
            <span style={{ ...monoTag, color: '#6E6E73', border: '1px solid #E5E5EA' }}>
              +{enabledFeatures.length - 5} more
            </span>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          paddingTop: 14, borderTop: '1px solid #E5E5EA',
        }}>
          <button type="button" className="pl-btn pl-btn-secondary pl-btn-sm" style={{ flex: 1, justifyContent: 'center' }}
            onClick={e => { e.stopPropagation(); onClick(); }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            View Details
          </button>
          <button type="button" className="pl-icon-btn" title="Edit Club"
            onClick={e => { e.stopPropagation(); onEdit(club); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          </button>
          <button type="button" className="pl-btn pl-btn-danger pl-btn-sm" title="Delete Club"
            style={{ width: 34, padding: 0, justifyContent: 'center', flexShrink: 0 }}
            onClick={e => { e.stopPropagation(); onDelete(club); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CorporateClubs() {
  const { t } = useTranslation();
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
        theme_color: full.theme_color || '#0071E3',
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
        theme_color: club.theme_color || '#0071E3',
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
        title={editId ? t('actions.edit') + ' Club' : t('actions.create') + ' Club'}
        onBack={closeForm}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
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
        <div style={{ borderRadius: 16, marginTop: 12, padding: '18px 18px 6px', background: '#F2F2F7', border: '1px solid #E5E5EA' }}>
          <SectionTitle accent>Club Branding</SectionTitle>
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
        <div style={{ borderRadius: 16, marginTop: 12, padding: '18px 18px 14px', background: '#F2F2F7', border: '1px solid #E5E5EA' }}>
          <SectionTitle hint="Maximum number of branches this club can create">Branch Limit</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" className="pl-icon-btn" onClick={() => setForm({ ...form, max_branches: Math.max(1, form.max_branches - 1) })}>−</button>
            <div style={{
              minWidth: 80, textAlign: 'center', fontSize: 32, fontWeight: 500, color: '#1D1D1F',
              fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1,
            }}>{form.max_branches}</div>
            <button type="button" className="pl-icon-btn" onClick={() => setForm({ ...form, max_branches: Math.min(100, form.max_branches + 1) })}>+</button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            {[1, 3, 5, 10].map(n => (
              <button key={n} type="button" onClick={() => setForm({ ...form, max_branches: n })}
                style={{
                  ...monoTag, padding: '5px 10px', cursor: 'pointer',
                  background: form.max_branches === n ? '#1D1D1F' : 'transparent',
                  color: form.max_branches === n ? '#F5F5F7' : '#6E6E73',
                  border: `1px solid ${form.max_branches === n ? '#1D1D1F' : '#AEAEB2'}`,
                }}>
                {n} {n === 1 ? 'branch' : 'branches'}
              </button>
            ))}
          </div>
          {editId && editClub && (() => {
            const used = editClub.branches_count ?? 0;
            const remaining = form.max_branches - used;
            return (
              <div style={{ fontSize: 13, color: '#6E6E73', marginTop: 12 }}>
                Currently using <strong style={{ color: '#1D1D1F' }}>{used}</strong> of{' '}
                <strong style={{ color: '#1D1D1F' }}>{form.max_branches}</strong> branches
                {remaining < 0 && (
                  <span style={{ color: '#FF3B30', marginInlineStart: 8 }}>
                    Warning: limit is below existing branch count
                  </span>
                )}
              </div>
            );
          })()}
        </div>

        {/* Club Features */}
        <div style={{ borderRadius: 16, marginTop: 12, padding: '18px 18px 8px', background: '#FFFFFF', border: '1px solid #E5E5EA' }}>
          <SectionTitle hint="Control which features this club can access">Club Features</SectionTitle>
          {CLUB_FEATURES.map((f, fi) => (
            <FeatureToggleRow
              key={f.key}
              index={fi}
              feature={f}
              enabled={form.features[f.dbKey]}
              onChange={v => setForm({ ...form, features: { ...form.features, [f.dbKey]: v } })}
            />
          ))}
        </div>

        {/* Manager Account */}
        <div style={{ borderRadius: 16, marginTop: 12, padding: '18px 18px 6px', background: '#F2F2F7', border: '1px solid #E5E5EA' }}>
          <SectionTitle>Club Manager Account</SectionTitle>
          <FormField label="Manager Name"><Input value={form.manager_name} onChange={e => setForm({ ...form, manager_name: e.target.value })} /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Manager Email"><Input type="email" value={form.manager_email} onChange={e => setForm({ ...form, manager_email: e.target.value })} /></FormField>
            <FormField label="Manager Password"><Input type="password" value={form.manager_password} onChange={e => setForm({ ...form, manager_password: e.target.value })} placeholder={editId ? 'Leave blank to keep current' : ''} /></FormField>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#FFFFFF', border: '1px solid #FF3B30', color: '#FF3B30', fontSize: 13 }}>{error}</div>
        )}

        <FormPageActions>
          <Button variant="secondary" onClick={closeForm}>{t('actions.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? t('loading.saving') : (editId ? t('actions.update') : t('actions.create'))}</Button>
        </FormPageActions>
      </FormPage>
    );
  }

  return (
    <div>
      <PageHeader title={t('corporate.clubs')} search={search} onSearch={setSearch} searchPlaceholder={t('actions.search') + '...'}>
        <Button onClick={() => { setEditId(null); setEditClub(null); setError(null); setForm({ ...emptyForm }); setShowModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          {t('actions.create')}
        </Button>
      </PageHeader>

      {/* Summary strip */}
      {clubs.length > 0 && (
        <div style={{
          display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap',
          animation: 'fadeInUp 0.4s ease-out',
        }}>
          {[
            { label: 'Total Clubs', value: clubs.length },
            { label: 'Total Users', value: clubs.reduce((s, c) => s + (c.users_count || 0), 0) },
            { label: 'Total Swimmers', value: clubs.reduce((s, c) => s + (c.swimmer_profiles_count || 0), 0) },
          ].map((s, si) => (
            <div key={s.label} style={{ borderRadius: 16,
              flex: '1 1 180px', padding: '18px 20px', background: '#FFFFFF',
              border: '1px solid #E5E5EA',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ ...labelStyle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</div>
                </div>
              <div style={{
                color: '#1D1D1F', fontSize: 30, fontWeight: 500, fontFamily: 'var(--font-display)',
                letterSpacing: '-0.02em', lineHeight: 1, marginTop: 14,
              }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Cards grid */}
      {clubs.length === 0 ? (
        <div style={{ borderRadius: 16,
          textAlign: 'center', padding: '60px 20px', background: '#FFFFFF',
          border: '1px solid #E5E5EA',
          animation: 'fadeInUp 0.4s ease-out',
        }}>
          <div style={{ borderRadius: 14,
            width: 56, height: 56, margin: '0 auto 16px',
            background: '#F2F2F7', border: '1px solid #E5E5EA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.5" strokeLinecap="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div style={{
            color: '#1D1D1F', fontSize: 16, fontWeight: 500, fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em', marginBottom: 8,
          }}>
            {search ? t('empty.noResults') : t('empty.noData')}
          </div>
          <div style={{ color: '#6E6E73', fontSize: 13, marginBottom: 20 }}>
            {search ? t('empty.noResultsHint') : t('empty.itemsWillAppear')}
          </div>
          {!search && (
            <Button onClick={() => { setEditId(null); setEditClub(null); setError(null); setForm({ ...emptyForm }); setShowModal(true); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              {t('actions.create')}
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
          position: 'fixed', bottom: 24, insetInlineEnd: 24,
          padding: '12px 18px', background: '#FFFFFF', border: '1px solid #FF3B30',
          color: '#FF3B30', fontSize: 13, fontWeight: 500,
          animation: 'fadeInUp 0.3s ease-out',
          zIndex: 100,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
