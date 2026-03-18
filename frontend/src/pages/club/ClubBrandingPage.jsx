import { useState, useEffect, useRef, useCallback } from 'react';
import { getOwnBranding, updateOwnBranding, uploadOwnBrandingFile } from '../../api/branding';
import { FormField, Input, Button, PageHeader } from '../../components/CrudTable';

const COLOR_PRESETS = ['1A6FB5', 'C0392B', '27AE60', '7D3C98', 'E67E22', '148F77', 'B7950B', '2C3E50'];

const sectionCardStyle = (delay = '0.1s') => ({
  padding: '26px 28px 10px', borderRadius: 18,
  background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)',
  border: '1px solid rgba(34,211,238,0.06)', marginBottom: 20,
  animation: `fadeInUp 0.5s ease-out ${delay} both`,
});

function BrandingColorPicker({ label, value, onChange }) {
  const isValid = /^[0-9A-Fa-f]{6}$/.test(value || '');
  return (
    <FormField label={label}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        background: 'rgba(6,13,31,0.6)',
        border: `1px solid ${value && !isValid ? '#f43f5e' : 'rgba(51,65,85,0.5)'}`,
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{
          width: 48, height: 44, flexShrink: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          borderRight: '1px solid rgba(51,65,85,0.4)', position: 'relative',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: isValid ? `#${value}` : 'rgba(51,65,85,0.5)',
            boxShadow: isValid ? `0 0 12px #${value}40` : 'none',
            border: '2px solid rgba(255,255,255,0.15)', transition: 'all 0.3s',
          }} />
          <input
            type="color"
            value={isValid ? `#${value}` : '#22d3ee'}
            onChange={e => onChange(e.target.value.replace('#', ''))}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
          />
        </div>
        <input
          type="text" value={value || ''} onChange={e => onChange(e.target.value.replace('#', ''))}
          placeholder="e.g. 1A6FB5"
          style={{
            flex: 1, minWidth: 0, padding: '0 14px', height: 44,
            background: 'transparent', border: 'none',
            color: '#e2e8f0', fontSize: '0.875rem',
            fontFamily: "'DM Mono', 'DM Sans', monospace",
            letterSpacing: '0.04em', outline: 'none',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
        {COLOR_PRESETS.map(color => (
          <button key={color} type="button" onClick={() => onChange(color)}
            style={{
              width: 22, height: 22, borderRadius: 6, background: `#${color}`,
              border: (value || '').toLowerCase() === color.toLowerCase() ? '2px solid #fff' : '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', transition: 'all 0.2s',
              transform: (value || '').toLowerCase() === color.toLowerCase() ? 'scale(1.1)' : 'scale(1)',
            }}
          />
        ))}
      </div>
      {value && !isValid && (
        <div style={{ color: '#f43f5e', fontSize: 11, marginTop: 4 }}>
          Invalid hex — use 6 characters (e.g. 1A6FB5)
        </div>
      )}
    </FormField>
  );
}

function FileUploadZone({ label, accept, currentUrl, previewStyle, onUpload, uploading }) {
  const ref = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('File must be under 2MB');
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    onUpload(file);
  };

  const displayUrl = previewUrl || currentUrl;

  return (
    <FormField label={label}>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        style={{
          border: `2px dashed ${dragOver ? '#22d3ee' : 'rgba(51,65,85,0.5)'}`,
          borderRadius: 12, padding: 16, textAlign: 'center', cursor: 'pointer',
          background: dragOver ? 'rgba(34,211,238,0.08)' : 'rgba(6,13,31,0.6)',
          transition: 'all 0.2s',
        }}
      >
        {displayUrl ? (
          <img src={displayUrl} alt={label} style={{ maxWidth: '100%', objectFit: 'contain', borderRadius: 8, ...previewStyle }} />
        ) : (
          <div style={{ color: '#94a3b8', fontSize: 13 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 6, display: 'block', margin: '0 auto 6px' }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <div>Drop file or click to upload</div>
            <div style={{ fontSize: 11, marginTop: 4, color: '#64748b' }}>PNG, JPG, SVG — max 2MB</div>
          </div>
        )}
        {uploading && <div style={{ color: '#22d3ee', fontSize: 12, marginTop: 8 }}>Uploading...</div>}
        <input ref={ref} type="file" accept={accept || 'image/png,image/jpeg,image/svg+xml'} style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
      </div>
    </FormField>
  );
}

function PhonePreview({ form }) {
  const primary = /^[0-9A-Fa-f]{6}$/.test(form.primary_color || '') ? `#${form.primary_color}` : '#1A6FB5';
  const secondary = /^[0-9A-Fa-f]{6}$/.test(form.secondary_color || '') ? `#${form.secondary_color}` : '#27AE60';

  return (
    <div style={{ position: 'sticky', top: 24 }}>
      <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, textAlign: 'center' }}>
        Live Preview
      </div>
      <div style={{
        width: 280, height: 560, borderRadius: 40,
        border: '3px solid rgba(51,65,85,0.4)',
        background: '#0f172a', margin: '0 auto', overflow: 'hidden', position: 'relative',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)',
      }}>
        <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
          <div style={{ width: 80, height: 24, borderRadius: 12, background: '#000' }} />
        </div>
        <div style={{
          height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          background: form.cover_url ? `url(${form.cover_url}) center/cover` : primary,
          position: 'relative',
        }}>
          {form.cover_url && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 14, background: 'rgba(255,255,255,0.1)', padding: 4 }} />
            ) : (
              <div style={{ width: 60, height: 60, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
            )}
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", textShadow: '0 1px 4px rgba(0,0,0,0.3)', textAlign: 'center', padding: '0 16px' }}>
              {form.display_name || form.club_name || 'Club Name'}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: 3, background: i === 0 ? '#fff' : 'rgba(255,255,255,0.4)' }} />)}
            </div>
          </div>
        </div>
        <div style={{ height: 48, background: primary, display: 'flex', alignItems: 'center', paddingLeft: 16, gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.6)' }} />
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
            {form.app_name || 'Club App'}
          </div>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, height: 40, borderRadius: 10, background: primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary</span>
          </div>
          <div style={{ flex: 1, height: 40, borderRadius: 10, background: secondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secondary</span>
          </div>
        </div>
        <div style={{ padding: '8px 20px' }}>
          {[0.8, 0.6, 0.9, 0.5].map((w, i) => (
            <div key={i} style={{ height: 10, borderRadius: 5, background: 'rgba(51,65,85,0.3)', marginBottom: 8, width: `${w * 100}%` }} />
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, background: 'rgba(15,23,42,0.95)', borderTop: '1px solid rgba(51,65,85,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 8px' }}>
          {['Home', 'Sessions', 'Profile'].map(tab => (
            <div key={tab} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, background: tab === 'Home' ? `${primary}30` : 'rgba(51,65,85,0.3)' }} />
              <span style={{ fontSize: 9, color: tab === 'Home' ? primary : '#475569', fontWeight: 500 }}>{tab}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ color, icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h4 style={{
        color: '#f1f5f9', margin: '0 0 4px', fontSize: 11, fontWeight: 600,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {icon}
        <span style={{ color }}>{title}</span>
      </h4>
      {subtitle && <div style={{ color: '#94a3b8', fontSize: 12 }}>{subtitle}</div>}
    </div>
  );
}

export default function ClubBrandingPage() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [uploading, setUploading] = useState({});

  useEffect(() => {
    getOwnBranding().then(data => {
      setForm({
        display_name: data.display_name || '',
        app_name: data.app_name || '',
        club_name: data.club_name,
        primary_color: (data.primary_color || '').replace('#', ''),
        secondary_color: (data.secondary_color || '').replace('#', ''),
        logo_url: data.logo_url || '',
        cover_url: data.cover_url || '',
        favicon_url: data.favicon_url || '',
        support_email: data.support_email || '',
        support_phone: data.support_phone || '',
        social_instagram: data.social_links?.instagram || '',
        social_twitter: data.social_links?.twitter || '',
        social_facebook: data.social_links?.facebook || '',
        custom_domain: data.custom_domain || '',
        is_domain_active: data.is_domain_active || false,
        branding_tier: data.branding_tier || 'shared',
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const updateForm = useCallback((key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleUpload = async (file, type) => {
    try {
      setUploading(prev => ({ ...prev, [type]: true }));
      const result = await uploadOwnBrandingFile(file, type);
      updateForm(`${type}_url`, result.url);
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded`);
    } catch (err) {
      setError(`Failed to upload ${type}`);
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (form.primary_color && !/^[0-9A-Fa-f]{6}$/.test(form.primary_color)) {
        setError('Primary color must be a valid 6-character hex (e.g. 1A6FB5)');
        setSaving(false);
        return;
      }
      if (form.secondary_color && !/^[0-9A-Fa-f]{6}$/.test(form.secondary_color)) {
        setError('Secondary color must be a valid 6-character hex (e.g. 27AE60)');
        setSaving(false);
        return;
      }

      const payload = {
        display_name: form.display_name || null,
        app_name: form.app_name || null,
        primary_color: form.primary_color || null,
        secondary_color: form.secondary_color || null,
        support_email: form.support_email || null,
        support_phone: form.support_phone || null,
        social_links: {
          instagram: form.social_instagram || null,
          twitter: form.social_twitter || null,
          facebook: form.social_facebook || null,
        },
      };

      await updateOwnBranding(payload);
      showToast('Branding saved and live');
    } catch (err) {
      const msgs = err.response?.data?.errors;
      setError(msgs ? Object.values(msgs).map(a => a[0]).join(', ') : (err.response?.data?.message || 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#94a3b8' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(34,211,238,0.2)" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div style={{ fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>Loading branding...</div>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Branding">
        <Button onClick={handleSave} disabled={saving}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <path d="M17 21v-8H7v8M7 3v5h8" />
          </svg>
          {saving ? 'Saving...' : 'Save Branding'}
        </Button>
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40 }}>
        {/* Left — Form */}
        <div>
          {/* Identity Section */}
          <div style={sectionCardStyle('0.1s')}>
            <SectionHeader color="#22d3ee" title="Identity"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField label="Display Name"><Input value={form.display_name} onChange={e => updateForm('display_name', e.target.value)} placeholder="Public-facing name" /></FormField>
              <FormField label="App Name"><Input value={form.app_name} onChange={e => updateForm('app_name', e.target.value)} placeholder="Shown in app header" /></FormField>
            </div>

            {/* Branding Tier — read-only for club managers */}
            <FormField label="Branding Tier">
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(6,13,31,0.6)', border: '1px solid rgba(51,65,85,0.5)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif", textTransform: 'capitalize',
                  background: form.branding_tier === 'branded' ? 'rgba(34,211,238,0.12)' : 'rgba(100,116,139,0.12)',
                  color: form.branding_tier === 'branded' ? '#22d3ee' : '#94a3b8',
                  border: `1px solid ${form.branding_tier === 'branded' ? 'rgba(34,211,238,0.25)' : 'rgba(100,116,139,0.2)'}`,
                }}>
                  {form.branding_tier || 'shared'}
                </div>
                <span style={{ color: '#64748b', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                  Managed by platform admin
                </span>
              </div>
            </FormField>
          </div>

          {/* Colors Section */}
          <div style={sectionCardStyle('0.15s')}>
            <SectionHeader color="#a78bfa" title="Colors"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.49 8.49l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.49-8.49l2.83-2.83" /></svg>}
              subtitle="Choose your brand colors — preview updates live"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <BrandingColorPicker label="Primary Color" value={form.primary_color} onChange={v => updateForm('primary_color', v)} />
              <BrandingColorPicker label="Secondary Color" value={form.secondary_color} onChange={v => updateForm('secondary_color', v)} />
            </div>
          </div>

          {/* Assets Section */}
          <div style={sectionCardStyle('0.2s')}>
            <SectionHeader color="#fbbf24" title="Assets"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>}
              subtitle="Upload logo, cover image, and favicon"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FileUploadZone label="Logo" currentUrl={form.logo_url} uploading={uploading.logo}
                previewStyle={{ maxHeight: 60 }} onUpload={f => handleUpload(f, 'logo')} />
              <FileUploadZone label="Favicon" currentUrl={form.favicon_url} uploading={uploading.favicon}
                previewStyle={{ maxHeight: 32, maxWidth: 32 }} onUpload={f => handleUpload(f, 'favicon')} />
            </div>
            <FileUploadZone label="Cover Image" currentUrl={form.cover_url} uploading={uploading.cover}
              previewStyle={{ maxHeight: 120, width: '100%', objectFit: 'cover' }} onUpload={f => handleUpload(f, 'cover')} />
          </div>

          {/* Contact & Social Section */}
          <div style={sectionCardStyle('0.25s')}>
            <SectionHeader color="#2dd4bf" title="Contact & Social"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField label="Support Email"><Input type="email" value={form.support_email} onChange={e => updateForm('support_email', e.target.value)} placeholder="support@club.com" /></FormField>
              <FormField label="Support Phone"><Input value={form.support_phone} onChange={e => updateForm('support_phone', e.target.value)} placeholder="+20 123 456 7890" /></FormField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <FormField label="Instagram"><Input value={form.social_instagram} onChange={e => updateForm('social_instagram', e.target.value)} placeholder="@clubname" /></FormField>
              <FormField label="Twitter / X"><Input value={form.social_twitter} onChange={e => updateForm('social_twitter', e.target.value)} placeholder="@clubname" /></FormField>
              <FormField label="Facebook"><Input value={form.social_facebook} onChange={e => updateForm('social_facebook', e.target.value)} placeholder="facebook.com/club" /></FormField>
            </div>
          </div>

          {/* Custom Domain Section — read-only for club managers */}
          {form.custom_domain && (
            <div style={sectionCardStyle('0.3s')}>
              <SectionHeader color="#818cf8" title="Custom Domain"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>}
              />
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(6,13,31,0.6)', border: '1px solid rgba(51,65,85,0.5)',
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: form.is_domain_active ? '#34d399' : '#64748b',
                  boxShadow: form.is_domain_active ? '0 0 8px #34d39960' : 'none',
                }} />
                <span style={{ color: '#f1f5f9', fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
                  {form.custom_domain}
                </span>
                <span style={{ color: '#64748b', fontSize: 11, marginLeft: 'auto', fontFamily: "'DM Sans', sans-serif" }}>
                  {form.is_domain_active ? 'Active' : 'Inactive'} — managed by platform admin
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 12,
              background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)',
              color: '#f43f5e', fontSize: 13, marginBottom: 12, fontFamily: "'DM Sans', sans-serif",
              display: 'flex', alignItems: 'center', gap: 8,
              animation: 'fadeInUp 0.3s ease-out',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
              {error}
            </div>
          )}
        </div>

        {/* Right — Phone Preview */}
        <div style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}>
          <PhonePreview form={form} />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, right: 32, padding: '14px 22px',
          background: 'linear-gradient(135deg, rgba(5,46,22,0.95) 0%, rgba(6,78,59,0.9) 100%)',
          color: '#34d399', borderRadius: 14, fontSize: 14, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(52,211,153,0.15)',
          animation: 'fadeInUp 0.3s ease-out', zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d39960' }} />
          {toast}
        </div>
      )}
    </div>
  );
}
