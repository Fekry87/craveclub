import { useState, useEffect } from 'react';
import api, { API_BASE } from '../../api/axios';
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

const ENTRY_PHOTO_SLOTS = [1, 2, 3];
// Matches the app, which holds each photo this long before cross-fading.
const ENTRY_PHOTO_INTERVAL_MS = 3000;
// Long edge of the photo actually sent. Enough for the largest phones, and it
// keeps a straight-off-the-camera photo well under the 2MB upload limit.
const ENTRY_PHOTO_MAX_EDGE = 1600;

const entryPhotoUrl = (slot, version) =>
  version ? `${API_BASE}/public/branding/entry-photo/${slot}?v=${version}` : null;

/**
 * Scale a photo down to ENTRY_PHOTO_MAX_EDGE and re-encode it as JPEG in the
 * browser. Phone photos are routinely 4–8MB, which the server refuses; a
 * full-screen background has no use for that many pixels. Falls back to the
 * original file when the browser can't decode it (the server then decides).
 */
async function shrinkPhoto(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, ENTRY_PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    return blob ? new File([blob], 'entry-photo.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

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
  const { checkAuth } = useAuth();
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
  // slot → proxy URL (null when the slot is empty)
  const [entryPhotos, setEntryPhotos] = useState({ 1: null, 2: null, 3: null });
  const [busyPhotoSlot, setBusyPhotoSlot] = useState(null);
  // Shown inside the photos section — the page-level error sits by the Save
  // button, out of sight from here.
  const [photoError, setPhotoError] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);

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
      setEntryPhotos(Object.fromEntries(
        ENTRY_PHOTO_SLOTS.map(slot => [slot, entryPhotoUrl(slot, r.data[`entry_photo_${slot}_version`])]),
      ));
    });
  }, []);

  const filledPhotos = ENTRY_PHOTO_SLOTS.map(slot => entryPhotos[slot]).filter(Boolean);
  const filledPhotosKey = filledPhotos.join('|');

  // Cycle the preview the way the app does.
  useEffect(() => {
    setPreviewIndex(0);
    const count = filledPhotosKey ? filledPhotosKey.split('|').length : 0;
    if (count < 2) return undefined;
    const id = setInterval(() => setPreviewIndex(i => (i + 1) % count), ENTRY_PHOTO_INTERVAL_MS);
    return () => clearInterval(id);
  }, [filledPhotosKey]);

  // Photos are saved the moment they're picked or removed, like the logo — they
  // are not part of the Save button's form.
  const handleEntryPhotoUpload = async (slot, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusyPhotoSlot(slot);
    setPhotoError(null);
    try {
      const fd = new FormData();
      fd.append('file', await shrinkPhoto(file));
      const r = await api.post(`/corporate/settings/entry-photos/${slot}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEntryPhotos(p => ({ ...p, [slot]: r.data.url }));
    } catch (err) {
      setPhotoError(apiErrorMessage(err));
    } finally {
      setBusyPhotoSlot(null);
    }
  };

  const handleEntryPhotoRemove = async (slot) => {
    setBusyPhotoSlot(slot);
    setPhotoError(null);
    try {
      await api.delete(`/corporate/settings/entry-photos/${slot}`);
      setEntryPhotos(p => ({ ...p, [slot]: null }));
    } catch (err) {
      setPhotoError(apiErrorMessage(err));
    } finally {
      setBusyPhotoSlot(null);
    }
  };

  const handleSplashUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSplash(true);
    setPhotoError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await api.post('/corporate/settings/splash-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(f => ({ ...f, splash_image_url: r.data.url || r.data.splash_image_url }));
    } catch (err) {
      setPhotoError(apiErrorMessage(err));
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
              Shown at the top of the app's first screen, over a swimming photo. The app displays it in white, so upload a PNG with a transparent background — anything that isn't transparent turns into a white block.
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
                    // JPEG can't carry transparency, so it would render as a solid white block.
                    accept="image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                </label>
                <div style={{ ...labelStyle, marginTop: 8, color: '#86868B', fontWeight: 400 }}>
                  Transparent PNG or WebP · any colour, it's shown white · up to 2MB
                </div>
              </div>

              {/* Preview of the app's club-name screen: dark water, logo in white,
                  the task at the bottom. The CSS filter whitens the logo the same way
                  the app's tint does, so a non-transparent image previews as the
                  white block it would really become. */}
              <div style={{
                width: 150, height: 300, borderRadius: 28, overflow: 'hidden',
                background: 'linear-gradient(180deg, #0B3B44 0%, #0E5560 38%, #062129 70%, #031116 100%)',
                border: '1px solid rgba(0,0,0,0.10)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                flexShrink: 0, padding: '26px 12px 14px', boxSizing: 'border-box',
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', minHeight: 20 }}>
                  {form.platform_logo_url ? (
                    <img src={form.platform_logo_url} alt="Platform logo" style={{ maxWidth: 92, maxHeight: 20, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                  ) : form.splash_image_url ? (
                    <img src={form.splash_image_url} alt="Splash logo" style={{ maxWidth: 92, maxHeight: 20, objectFit: 'contain' }} />
                  ) : (
                    <span style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: 'var(--font-heading)' }}>
                      {form.platform_name || 'CraveClubs'}
                    </span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.72)', fontFamily: 'var(--font-body)', marginBottom: 3 }}>
                    {form.platform_name || 'CraveClubs'}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>
                    Find your club
                  </div>
                  <div style={{ width: '100%', height: 18, borderRadius: 5, background: '#FFFFFF', marginTop: 10 }} />
                  <div style={{ width: '100%', height: 18, borderRadius: 5, background: '#FFFFFF', marginTop: 6 }} />
                </div>
              </div>
            </div>
          </FormField>
        </div>

        {/* App entry screen photos */}
        <div style={sectionCardStyle('0.12s')}>
          <SectionTitle>App entry screen photos</SectionTitle>
          <div style={{ ...labelStyle, marginTop: -4, marginBottom: 16, color: '#86868B', fontWeight: 400 }}>
            The background of the app's first screen, where swimmers type their club's name. Add up to three — the app fades from one to the next every 3 seconds. The top and bottom are darkened for the logo and the form, so keep the subject in the middle. With none uploaded, the app uses its built-in swimming photo.
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {ENTRY_PHOTO_SLOTS.map(slot => {
                const url = entryPhotos[slot];
                const busy = busyPhotoSlot === slot;
                return (
                  <div key={slot} style={{ width: 96 }}>
                    <label style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6,
                      width: 96, height: 170, borderRadius: 14, overflow: 'hidden', boxSizing: 'border-box',
                      cursor: busy || busyPhotoSlot ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
                      background: url ? `#031116 center / cover no-repeat url("${url}")` : '#F5F5F7',
                      border: url ? '1px solid rgba(0,0,0,0.10)' : '1.5px dashed #C7C7CC',
                      color: '#6E6E73', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
                    }}>
                      {!url && (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                          {busy ? 'Uploading…' : `Photo ${slot}`}
                        </>
                      )}
                      {url && busy && (
                        <span style={{ color: '#FFFFFF', background: 'rgba(0,0,0,0.5)', padding: '3px 8px', borderRadius: 980 }}>Working…</span>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }}
                        onChange={e => handleEntryPhotoUpload(slot, e)}
                        disabled={!!busyPhotoSlot}
                      />
                    </label>
                    {url && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                        <label style={{ ...labelStyle, color: '#0071E3', cursor: busyPhotoSlot ? 'default' : 'pointer' }}>
                          Replace
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: 'none' }}
                            onChange={e => handleEntryPhotoUpload(slot, e)}
                            disabled={!!busyPhotoSlot}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleEntryPhotoRemove(slot)}
                          disabled={!!busyPhotoSlot}
                          style={{ ...labelStyle, color: '#FF3B30', background: 'none', border: 'none', padding: 0, cursor: busyPhotoSlot ? 'default' : 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ ...labelStyle, flexBasis: '100%', color: '#86868B', fontWeight: 400 }}>
                Portrait photos work best · JPG, PNG or WebP · large photos are resized automatically
              </div>
              {photoError && (
                <div role="alert" style={{
                  flexBasis: '100%', padding: '8px 12px', borderRadius: 10,
                  background: 'rgba(255,59,48,0.10)', color: '#C4271D',
                  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
                }}>
                  {photoError}
                </div>
              )}
            </div>

            {/* Preview: the photos cross-fade under the same dark scrim as the app. */}
            <div style={{
              position: 'relative', width: 150, height: 300, borderRadius: 28, overflow: 'hidden',
              background: '#031116', border: '1px solid rgba(0,0,0,0.10)', flexShrink: 0,
            }}>
              {filledPhotos.length === 0 && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'var(--font-body)', textAlign: 'center', padding: 16,
                }}>
                  Built-in photo
                </div>
              )}
              {filledPhotos.map((url, i) => (
                <div key={url} style={{
                  position: 'absolute', left: 0, right: 0, top: '-24%', height: '100%',
                  background: `center / cover no-repeat url("${url}")`,
                  opacity: i === previewIndex % filledPhotos.length ? 1 : 0,
                  transition: 'opacity 0.8s ease',
                }} />
              ))}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(3,17,22,0.75) 0%, rgba(3,17,22,0.05) 30%, rgba(3,17,22,0.35) 50%, #031116 76%, #031116 100%)',
              }} />
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                padding: '26px 12px 14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', minHeight: 20 }}>
                  {form.platform_logo_url ? (
                    <img src={form.platform_logo_url} alt="" style={{ maxWidth: 92, maxHeight: 20, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                  ) : (
                    <span style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: 'var(--font-heading)' }}>
                      {form.platform_name || 'CraveClubs'}
                    </span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>
                    Find your club
                  </div>
                  <div style={{ width: '100%', height: 18, borderRadius: 5, background: '#FFFFFF', marginTop: 10 }} />
                  <div style={{ width: '100%', height: 18, borderRadius: 5, background: '#FFFFFF', marginTop: 6 }} />
                </div>
              </div>
              {filledPhotos.length > 1 && (
                <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 4 }}>
                  {filledPhotos.map((url, i) => (
                    <span key={url} style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: i === previewIndex % filledPhotos.length ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
                    }} />
                  ))}
                </div>
              )}
            </div>
          </div>
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
        {saveError && (
          <div role="alert" style={{
            marginBottom: 14, padding: '10px 14px', borderRadius: 12,
            background: 'rgba(255,59,48,0.10)', color: '#C4271D',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
          }}>
            {saveError}
          </div>
        )}
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
