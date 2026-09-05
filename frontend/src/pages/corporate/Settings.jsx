import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { FormField, Input, Button, PageHeader } from '../../components/CrudTable';
import { inputStyle, inputFocusProps } from '../../components/ui/styles';
import { useTranslation } from 'react-i18next';

const labelStyle = {
  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, color: '#6E6E73',
};

const sectionCardStyle = (delay) => ({
  borderRadius: 16, background: '#FFFFFF', padding: '22px 24px',
  border: '1px solid #E5E5EA', marginBottom: 20,
  animation: `fadeInUp 0.5s ease-out ${delay} both`,
});

const colorPresets = ['#0071E3', '#34C759', '#FF9500', '#FF3B30', '#7D57C2', '#32ADE6', '#515154', '#1D1D1F'];

function SectionTitle({ children }) {
  return (
    <h2 style={{
      margin: '0 0 16px', paddingBottom: 12, borderBottom: '1px solid #F2F2F7',
      fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600,
      color: '#1D1D1F', letterSpacing: '-0.01em', lineHeight: 1.2,
    }}>
      {children}
    </h2>
  );
}

/** Round colour well — native picker lives inside a circular clipped wrapper. */
function ColorWell({ value, onChange, size = 36 }) {
  return (
    <div style={{
      position: 'relative', width: size, height: size, flexShrink: 0,
      borderRadius: '50%', overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.08)',
      background: value || '#0071E3',
    }}>
      <input
        type="color"
        value={value || '#0071E3'}
        onChange={e => onChange(e.target.value)}
        style={{
          position: 'absolute', insetInlineStart: -4, top: -4,
          width: size + 8, height: size + 8,
          opacity: 0, cursor: 'pointer', border: 'none', padding: 0, background: 'none',
        }}
      />
    </div>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ColorWell value={value} onChange={onChange} />
        <input
          type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="#0071E3"
          style={{ ...inputStyle, flex: 1, minWidth: 0 }}
          {...inputFocusProps}
        />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
        {colorPresets.map(color => {
          const selected = (value || '').toLowerCase() === color.toLowerCase();
          return (
            <button key={color} type="button" onClick={() => onChange(color)} aria-label={color}
              style={{
                width: 32, height: 32, borderRadius: '50%', background: color,
                cursor: 'pointer', padding: 0,
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: selected ? '0 0 0 3px #FFFFFF, 0 0 0 5px #0071E3' : 'none',
                transition: 'box-shadow 0.15s ease, transform 0.15s ease',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function CorporateSettings() {
  const { t } = useTranslation();
  const { corporate, checkAuth } = useAuth();
  const [form, setForm] = useState({
    platform_name: '',
    platform_logo_url: '',
    primary_color: '#0071E3',
    secondary_color: '#0071E3',
    tagline: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/corporate/settings').then(r => {
      setForm({
        platform_name: r.data.platform_name || 'CraveClubs',
        platform_logo_url: r.data.platform_logo_url || '',
        primary_color: r.data.primary_color || '#0071E3',
        secondary_color: r.data.secondary_color || '#0071E3',
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
      <PageHeader title={t('settings.platformSettings')} />

      <div style={{ maxWidth: 640 }}>
        {/* Platform Identity */}
        <div style={sectionCardStyle('0.1s')}>
          <SectionTitle>Platform identity</SectionTitle>
          <FormField label="Platform name">
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
        <div style={sectionCardStyle('0.15s')}>
          <SectionTitle>Theme colors</SectionTitle>
          <FormField label="Primary color">
            <ColorPicker value={form.primary_color} onChange={v => setForm({ ...form, primary_color: v })} />
          </FormField>
          <FormField label="Secondary color">
            <ColorPicker value={form.secondary_color} onChange={v => setForm({ ...form, secondary_color: v })} />
          </FormField>
        </div>

        {/* Live Preview */}
        <div style={sectionCardStyle('0.2s')}>
          <SectionTitle>Live preview</SectionTitle>
          <div style={{
            borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16, padding: 20,
            background: '#F2F2F7',
          }}>
            <div style={{
              borderRadius: 14, width: 52, height: 52, background: form.primary_color || '#0071E3',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <path d="M4 20C6.5 17 9 22 12 18C15 14 17 22 20 18C23 14 25.5 20 28 17" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 25C6.5 22 9 27 12 23C15 19 17 27 20 23C23 19 25.5 25 28 22" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{
                fontFamily: 'var(--font-display)', color: '#1D1D1F', margin: 0, fontSize: 20, fontWeight: 700,
                letterSpacing: '-0.02em', lineHeight: 1.2,
              }}>{form.platform_name || 'CraveClubs'}</h3>
              <div style={{ ...labelStyle, marginTop: 5 }}>{form.tagline || 'Club Management Platform'}</div>
            </div>
            <div style={{
              marginInlineStart: 'auto', display: 'flex', gap: 8, flexShrink: 0,
            }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: form.primary_color || '#0071E3', border: '1px solid rgba(0,0,0,0.08)' }} />
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: form.secondary_color || '#0071E3', border: '1px solid rgba(0,0,0,0.08)' }} />
            </div>
          </div>
        </div>

        {/* Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('loading.saving') : t('actions.save')}
          </Button>
          {saved && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '6px 12px', borderRadius: 980,
              background: 'rgba(52,199,89,0.14)', color: '#1E7A3B',
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
              animation: 'fadeInUp 0.3s ease-out',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              {t('settings.saved')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
