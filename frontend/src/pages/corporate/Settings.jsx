import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { FormField, Input, Button, PageHeader } from '../../components/CrudTable';

const colorPresets = ['#8b5cf6','#a78bfa','#6366f1','#22d3ee','#06b6d4','#2dd4bf','#10b981','#f472b6','#f43f5e','#fb923c','#fbbf24','#38bdf8'];

function ColorPicker({ value, onChange }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'rgba(6,13,31,0.6)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ width: 48, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(51,65,85,0.4)', position: 'relative' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: value || '#8b5cf6', boxShadow: `0 0 12px ${value || '#8b5cf6'}40`, border: '2px solid rgba(255,255,255,0.15)' }} />
          <input type="color" value={value || '#8b5cf6'} onChange={e => onChange(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
        </div>
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="#8b5cf6"
          style={{ flex: 1, minWidth: 0, padding: '0 14px', height: 44, background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: '0.875rem', fontFamily: "'DM Mono', 'DM Sans', monospace", outline: 'none' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
        {colorPresets.map(color => (
          <button key={color} onClick={() => onChange(color)}
            style={{ width: 22, height: 22, borderRadius: 6, background: color, border: value === color ? '2px solid #fff' : '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.2s', transform: value === color ? 'scale(1.1)' : 'scale(1)' }}
          />
        ))}
      </div>
    </div>
  );
}

export default function CorporateSettings() {
  const { corporate, checkAuth } = useAuth();
  const [form, setForm] = useState({
    platform_name: '',
    platform_logo_url: '',
    primary_color: '#8b5cf6',
    secondary_color: '#22d3ee',
    tagline: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/corporate/settings').then(r => {
      setForm({
        platform_name: r.data.platform_name || 'CraveClubs',
        platform_logo_url: r.data.platform_logo_url || '',
        primary_color: r.data.primary_color || '#8b5cf6',
        secondary_color: r.data.secondary_color || '#22d3ee',
        tagline: r.data.tagline || '',
      });
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await api.put('/corporate/settings', { settings: form });
    await checkAuth(); // Refresh corporate branding in context
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <PageHeader title="Platform Settings" />

      <div style={{ maxWidth: 640 }}>
        {/* Platform Identity */}
        <div style={{ background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)', borderRadius: 18, padding: '26px 28px', border: '1px solid rgba(139,92,246,0.08)', marginBottom: 20, animation: 'fadeInUp 0.5s ease-out 0.1s both' }}>
          <h3 style={{ color: '#a78bfa', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
            Platform Identity
          </h3>
          <FormField label="Platform Name">
            <Input value={form.platform_name} onChange={e => setForm({ ...form, platform_name: e.target.value })} placeholder="CraveClubs" />
          </FormField>
          <FormField label="Tagline">
            <Input value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} placeholder="Club Management Platform" />
          </FormField>
          <FormField label="Logo URL">
            <Input value={form.platform_logo_url} onChange={e => setForm({ ...form, platform_logo_url: e.target.value })} placeholder="https://example.com/logo.png" />
          </FormField>
        </div>

        {/* Theme Colors */}
        <div style={{ background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)', borderRadius: 18, padding: '26px 28px', border: '1px solid rgba(139,92,246,0.08)', marginBottom: 20, animation: 'fadeInUp 0.5s ease-out 0.15s both' }}>
          <h3 style={{ color: '#22d3ee', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.49 8.49l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.49-8.49l2.83-2.83" /></svg>
            Theme Colors
          </h3>
          <FormField label="Primary Color">
            <ColorPicker value={form.primary_color} onChange={v => setForm({ ...form, primary_color: v })} />
          </FormField>
          <FormField label="Secondary Color">
            <ColorPicker value={form.secondary_color} onChange={v => setForm({ ...form, secondary_color: v })} />
          </FormField>
        </div>

        {/* Live Preview */}
        <div style={{ background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)', borderRadius: 18, padding: '26px 28px', border: '1px solid rgba(51,65,85,0.15)', marginBottom: 24, animation: 'fadeInUp 0.5s ease-out 0.2s both' }}>
          <h3 style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 18px' }}>Live Preview</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, borderRadius: 14, background: 'rgba(6,13,31,0.5)', border: '1px solid rgba(51,65,85,0.15)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${form.primary_color}, ${form.secondary_color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${form.primary_color}30` }}>
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M4 20C6.5 17 9 22 12 18C15 14 17 22 20 18C23 14 25.5 20 28 17" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </div>
            <div>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", color: '#f1f5f9', margin: 0, fontSize: 20, fontWeight: 700 }}>{form.platform_name || 'CraveClubs'}</h2>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{form.tagline || 'Club Management Platform'}</div>
            </div>
          </div>
        </div>

        {/* Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          {saved && (
            <span style={{ color: '#34d399', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, animation: 'fadeInUp 0.3s ease-out' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
              Settings saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
