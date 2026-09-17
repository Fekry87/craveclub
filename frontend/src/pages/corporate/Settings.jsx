import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { FormField, Input, Button, PageHeader } from '../../components/CrudTable';
import { inputStyle, inputFocusProps } from '../../components/ui/styles';
import { useTranslation } from 'react-i18next';
import { apiErrorMessage } from '../../lib/apiError';

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
    splash_background_color: '#6C4CF5',
    splash_image_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [uploadingSplash, setUploadingSplash] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    api.get('/corporate/settings').then(r => {
      setForm({
        platform_name: r.data.platform_name || 'CraveClubs',
        platform_logo_url: r.data.platform_logo_url || '',
        primary_color: r.data.primary_color || '#0071E3',
        secondary_color: r.data.secondary_color || '#0071E3',
        tagline: r.data.tagline || '',
        splash_background_color: r.data.splash_background_color || '#6C4CF5',
        splash_image_url: r.data.splash_image_url || '',
      });
    });
  }, []);

  const handleSplashUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSplash(true);
    setSaveError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await api.post('/corporate/settings/splash-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(f => ({ ...f, splash_image_url: r.data.url || r.data.splash_image_url }));
    } catch (err) {
      setSaveError(apiErrorMessage(err));
    } finally {
      setUploadingSplash(false);
      e.target.value = '';
    }
  };

  // The logo is stored server-side (the bucket can't be read), so it is
  // uploaded rather than linked; the response carries the URL the app will use.
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setSaveError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await api.post('/corporate/settings/platform-logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(f => ({ ...f, platform_logo_url: r.data.url || r.data.platform_logo_url }));
    } catch (err) {
      setSaveError(apiErrorMessage(err));
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const brandColor = /^#?[0-9A-Fa-f]{6}$/.test(form.primary_color || '')
    ? (form.primary_color.startsWith('#') ? form.primary_color : `#${form.primary_color}`)
    : '#6C4CF5';
  const platformInitials = (form.platform_name || 'CraveClubs').trim().slice(0, 2).toUpperCase();

  const splashBg = /^#?[0-9A-Fa-f]{6}$/.test(form.splash_background_color || '')
    ? (form.splash_background_color.startsWith('#') ? form.splash_background_color : `#${form.splash_background_color}`)
    : '#6C4CF5';

  const handleSave = async () => {
    // A bare await here dropped every 422/500: no confirmation, no error, and the
    // page looked as if the save had simply been ignored.
    setSaveError(null);
    try {
      setSaving(true);
      await api.put('/corporate/settings', { settings: form });
      await checkAuth(); // Refresh corporate branding in context
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(apiErrorMessage(err));
      setSaving(false);
    }
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
          <FormField label="Logo">
            <div style={{ ...labelStyle, marginTop: -2, marginBottom: 12, color: '#86868B', fontWeight: 400 }}>
              Shown on the app's first screen, where swimmers type their club's name. It sits on a light background, so use a logo that reads on white.
            </div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <label
                  className="pl-btn pl-btn-secondary pl-btn-sm"
                  style={{ cursor: uploadingLogo ? 'default' : 'pointer', opacity: uploadingLogo ? 0.6 : 1 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                  {uploadingLogo ? 'Uploading…' : form.platform_logo_url ? 'Replace logo' : 'Upload logo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                </label>
                <div style={{ ...labelStyle, marginTop: 8, color: '#86868B', fontWeight: 400 }}>
                  PNG with a transparent background works best · PNG, JPG or WebP · up to 2MB
                </div>
              </div>

              {/* Preview of the app's club-name screen */}
              <div style={{
                width: 150, height: 300, borderRadius: 28, overflow: 'hidden',
                background: '#F7F6FB', border: '1px solid rgba(0,0,0,0.10)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 10, flexShrink: 0, padding: 12, boxSizing: 'border-box',
              }}>
                {form.platform_logo_url ? (
                  <img src={form.platform_logo_url} alt="Platform logo" style={{ maxWidth: '70%', maxHeight: 48, objectFit: 'contain' }} />
                ) : (
                  <div style={{
                    width: 40, height: 40, borderRadius: 11, background: brandColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#FFFFFF', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-heading)',
                  }}>{platformInitials}</div>
                )}
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1B1B2F', fontFamily: 'var(--font-heading)', textAlign: 'center' }}>
                  {form.platform_name || 'CraveClubs'}
                </div>
                <div style={{ width: '100%', height: 20, borderRadius: 6, background: '#FFFFFF', border: '1px solid #E6E5EF', marginTop: 6 }} />
                <div style={{ width: '100%', height: 20, borderRadius: 6, background: brandColor }} />
              </div>
            </div>
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

        {/* App splash screen */}
        <div style={sectionCardStyle('0.18s')}>
          <SectionTitle>App splash screen</SectionTitle>
          <div style={{ ...labelStyle, marginTop: -4, marginBottom: 16, color: '#86868B', fontWeight: 400 }}>
            Shown when the mobile app launches, before the club-name screen. Pick a background color and upload a centered logo.
          </div>
          <FormField label="Background color">
            <ColorPicker value={form.splash_background_color} onChange={v => setForm({ ...form, splash_background_color: v })} />
          </FormField>
          <FormField label="Center logo image">
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <label
                  className="pl-btn pl-btn-secondary pl-btn-sm"
                  style={{ cursor: uploadingSplash ? 'default' : 'pointer', opacity: uploadingSplash ? 0.6 : 1 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                  {uploadingSplash ? 'Uploading…' : 'Upload image'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleSplashUpload}
                    disabled={uploadingSplash}
                  />
                </label>
                <div style={{ ...labelStyle, marginTop: 8, color: '#86868B', fontWeight: 400 }}>
                  PNG (transparent), square, 512–1024px, ≤ 2MB
                </div>
              </div>

              {/* Phone preview */}
              <div style={{
                width: 150, height: 300, borderRadius: 28, overflow: 'hidden',
                background: splashBg, border: '1px solid rgba(0,0,0,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {form.splash_image_url ? (
                  <img src={form.splash_image_url} alt="Splash logo" style={{ width: '58%', height: 'auto', objectFit: 'contain' }} />
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontFamily: 'var(--font-body)' }}>Your logo here</span>
                )}
              </div>
            </div>
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
