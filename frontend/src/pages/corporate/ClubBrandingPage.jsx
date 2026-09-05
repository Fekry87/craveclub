import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getClubBranding, updateClubBranding, uploadBrandingFile } from '../../api/branding';
import { FormPage, FormPageActions } from '../../components/ui/FormPage';
import { FormField, Input, Button } from '../../components/ui/FormControls';

const COLOR_PRESETS = ['171717', 'FF350D', '4E4E4E', '727272', '979797', 'BBBBBB', '1F7A3F', 'C81E1E'];

const labelStyle = {
  fontFamily: 'var(--font-body)', fontSize: 12, color: '#6E6E73',
};

const sectionCardStyle = (delay = '0.1s') => ({
  padding: '24px 26px 10px', background: '#FFFFFF',
  border: '1px solid #E5E5EA', marginBottom: 20,
  animation: `fadeInUp 0.5s ease-out ${delay} both`,
});

function BrandingColorPicker({ label, value, onChange }) {
  const isValid = /^[0-9A-Fa-f]{6}$/.test(value || '');
  return (
    <FormField label={label}>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: '#FFFFFF',
        border: `1px solid ${value && !isValid ? '#FF3B30' : '#AEAEB2'}`,
      }}>
        <div style={{
          width: 46, height: 42, flexShrink: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          borderInlineEnd: '1px solid #E5E5EA', position: 'relative',
        }}>
          <div style={{
            width: 24, height: 24, background: isValid ? `#${value}` : '#E5E5EA',
            border: '1px solid #E5E5EA',
          }} />
          <input
            type="color"
            value={isValid ? `#${value}` : '#1D1D1F'}
            onChange={e => onChange(e.target.value.replace('#', ''))}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
          />
        </div>
        <input
          type="text" value={value || ''} onChange={e => onChange(e.target.value.replace('#', ''))}
          placeholder="e.g. 171717"
          onBlur={() => {}}
          style={{
            flex: 1, minWidth: 0, padding: '0 12px', height: 42,
            background: 'transparent', border: 'none',
            color: '#1D1D1F', fontSize: 13,
            fontFamily: 'var(--font-body)', outline: 'none',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        {COLOR_PRESETS.map(color => (
          <button key={color} type="button" onClick={() => onChange(color)}
            style={{
              width: 22, height: 22, background: `#${color}`, padding: 0, cursor: 'pointer',
              border: (value || '').toLowerCase() === color.toLowerCase() ? '2px solid #1D1D1F' : '1px solid #E5E5EA',
              transition: 'border-color 0.15s ease',
            }}
          />
        ))}
      </div>
      {value && !isValid && (
        <div style={{ color: '#FF3B30', fontSize: 12, marginTop: 6 }}>
          Invalid hex — use 6 characters (e.g. 171717)
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
          border: `1px dashed ${dragOver ? '#1D1D1F' : '#AEAEB2'}`,
          padding: 16, textAlign: 'center', cursor: 'pointer',
          background: dragOver ? '#F2F2F7' : '#FFFFFF',
          transition: 'border-color 0.15s ease, background 0.15s ease',
        }}
      >
        {displayUrl ? (
          <img src={displayUrl} alt={label} style={{ maxWidth: '100%', objectFit: 'contain', ...previewStyle }} />
        ) : (
          <div style={{ color: '#515154', fontSize: 13 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6E6E73" strokeWidth="1.5" strokeLinecap="round" style={{ display: 'block', margin: '0 auto 8px' }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <div>Drop file or click to upload</div>
            <div style={{ ...labelStyle, marginTop: 6 }}>PNG, JPG, SVG — max 2MB</div>
          </div>
        )}
        {uploading && <div style={{ ...labelStyle, color: '#0071E3', marginTop: 8 }}>Uploading...</div>}
        <input ref={ref} type="file" accept={accept || 'image/png,image/jpeg,image/svg+xml'} style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
      </div>
    </FormField>
  );
}

function PhonePreview({ form }) {
  const primary = /^[0-9A-Fa-f]{6}$/.test(form.primary_color || '') ? `#${form.primary_color}` : '#515154';
  const secondary = /^[0-9A-Fa-f]{6}$/.test(form.secondary_color || '') ? `#${form.secondary_color}` : '#34C759';

  return (
    <div style={{ position: 'sticky', top: 24 }}>
      <div style={{ ...labelStyle, marginBottom: 12, textAlign: 'center' }}>
        Live Preview
      </div>
      {/* Phone Frame — a device mockup */}
      <div style={{ borderRadius: 16,
        width: 280, height: 560, border: '2px solid #0071E3',
        background: '#FFFFFF', margin: '0 auto', overflow: 'hidden', position: 'relative',
        }}>
        {/* Status Bar / Notch */}
        <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
          <div style={{ width: 80, height: 24, background: '#F2F2F7' }} />
        </div>

        {/* Splash Area */}
        <div style={{
          height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          background: form.cover_url ? `url(${form.cover_url}) center/cover` : primary,
          position: 'relative',
        }}>
          {form.cover_url && <div style={{ position: 'absolute', inset: 0, background: 'rgba(29,29,31,0.45)' }} />}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" style={{ borderRadius: 14, width: 60, height: 60, objectFit: 'contain', background: 'rgba(255,255,255,0.15)', padding: 4 }} />
            ) : (
              <div style={{ borderRadius: 14, width: 60, height: 60, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.5"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
            )}
            <div style={{ color: '#1D1D1F', fontSize: 16, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', textAlign: 'center', padding: '0 16px' }}>
              {form.display_name || form.club_name || 'Club Name'}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: 3, background: i === 0 ? '#F5F5F7' : 'rgba(255,255,255,0.4)' }} />)}
            </div>
          </div>
        </div>

        {/* Header Bar */}
        <div style={{ height: 48, background: primary, display: 'flex', alignItems: 'center', paddingInlineStart: 16, gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.7)' }} />
          <div style={{ color: '#1D1D1F', fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',}}>
            {form.app_name || 'Club App'}
          </div>
        </div>

        {/* Color Chips */}
        <div style={{ padding: '16px 20px', display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, height: 40, background: primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#1D1D1F', fontFamily: 'var(--font-body)', fontSize: 12,}}>Primary</span>
          </div>
          <div style={{ flex: 1, height: 40, background: secondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#1D1D1F', fontFamily: 'var(--font-body)', fontSize: 12,}}>Secondary</span>
          </div>
        </div>

        {/* Fake content lines */}
        <div style={{ padding: '8px 20px' }}>
          {[0.8, 0.6, 0.9, 0.5].map((w, i) => (
            <div key={i} style={{ height: 10, background: '#E5E5EA', marginBottom: 8, width: `${w * 100}%` }} />
          ))}
        </div>

        {/* Bottom Nav */}
        <div style={{ borderRadius: 16, position: 'absolute', bottom: 0, insetInlineStart: 0, insetInlineEnd: 0, height: 56, background: '#FFFFFF', borderTop: '1px solid #E5E5EA', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 8px' }}>
          {['Home', 'Sessions', 'Profile'].map(tab => (
            <div key={tab} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 18, height: 18, background: tab === 'Home' ? primary : '#515154' }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: tab === 'Home' ? '#F5F5F7' : '#86868B' }}>{tab}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer', flexShrink: 0 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{ position: 'absolute', inset: 0, background: checked ? '#1D1D1F' : '#AEAEB2', transition: 'background 200ms ease' }} />
      <span style={{ position: 'absolute', top: 3, insetInlineStart: checked ? 23 : 3, width: 18, height: 18, background: '#F5F5F7', transition: 'inset-inline-start 200ms ease', }} />
    </label>
  );
}

function SectionHeader({ color, icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #E5E5EA' }}>
      <h4 style={{ ...labelStyle, margin: 0, fontWeight: 400, display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <span>{title}</span>
      </h4>
      {subtitle && <div style={{ color: '#6E6E73', fontSize: 12, marginTop: 6, fontFamily: 'var(--font-body)' }}>{subtitle}</div>}
    </div>
  );
}

export default function ClubBrandingPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [uploading, setUploading] = useState({});

  useEffect(() => {
    getClubBranding(id).then(data => {
      setClub(data);
      setForm({
        display_name: data.display_name || '',
        app_name: data.app_name || '',
        club_name: data.name,
        slug: data.slug,
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
    }).catch(() => navigate('/corporate/clubs'));
  }, [id]);

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
      const result = await uploadBrandingFile(id, file, type);
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
        custom_domain: form.custom_domain || null,
        is_domain_active: form.is_domain_active,
        branding_tier: form.branding_tier,
      };

      await updateClubBranding(id, payload);
      showToast('Branding saved and live');
    } catch (err) {
      const msgs = err.response?.data?.errors;
      setError(msgs ? Object.values(msgs).map(a => a[0]).join(', ') : (err.response?.data?.message || 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  if (!club) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#515154' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5EA" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#1D1D1F" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div style={labelStyle}>Loading branding...</div>
      </div>
    </div>
  );

  return (
    <FormPage
      title={`Branding — ${club.name}`}
      onBack={() => navigate(`/corporate/clubs/${id}`)}
      maxWidth={1200}
      icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.49 8.49l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.49-8.49l2.83-2.83" /></svg>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40 }}>
        {/* Left — Form */}
        <div>
          {/* Identity Section */}
          <div style={sectionCardStyle('0.1s')}>
            <SectionHeader color="#1D1D1F" title="Identity"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField label="Display Name"><Input value={form.display_name} onChange={e => updateForm('display_name', e.target.value)} placeholder="Public-facing name" /></FormField>
              <FormField label="App Name"><Input value={form.app_name} onChange={e => updateForm('app_name', e.target.value)} placeholder="Shown in app header" /></FormField>
            </div>
            <FormField label="Slug (read-only)">
              <div style={{ borderRadius: 16,
                padding: '0 12px', height: 42, display: 'flex', alignItems: 'center',
                background: '#F2F2F7', border: '1px solid #E5E5EA',
                color: '#515154', fontSize: 13, fontFamily: 'var(--font-body)',
              }}>{form.slug}</div>
            </FormField>

            {/* Branding Tier */}
            <FormField label="Branding Tier">
              <div style={{ display: 'flex', gap: 10 }}>
                {['shared', 'branded'].map(tier => (
                  <button key={tier} type="button" onClick={() => updateForm('branding_tier', tier)}
                    style={{
                      flex: 1, height: 42, cursor: 'pointer', textAlign: 'center',
                      transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
                      background: form.branding_tier === tier ? '#1D1D1F' : '#FFFFFF',
                      border: `1px solid ${form.branding_tier === tier ? '#1D1D1F' : '#AEAEB2'}`,
                      color: form.branding_tier === tier ? '#F5F5F7' : '#6E6E73',
                      fontFamily: 'var(--font-body)', fontSize: 12, letterSpacing: '-0.02em',
                    }}>
                    {tier === 'shared' ? 'Shared' : 'Branded'}
                  </button>
                ))}
              </div>
              <div style={{ color: '#6E6E73', fontSize: 12, marginTop: 8, fontFamily: 'var(--font-body)' }}>
                {form.branding_tier === 'branded' ? 'Full white-label with custom domain and branding' : 'Standard CraveClubs branding with club colors'}
              </div>
            </FormField>
          </div>

          {/* Colors Section */}
          <div style={sectionCardStyle('0.15s')}>
            <SectionHeader color="#1D1D1F" title="Colors"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.49 8.49l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.49-8.49l2.83-2.83" /></svg>}
              subtitle="Choose your brand colors — preview updates live"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <BrandingColorPicker label="Primary Color" value={form.primary_color} onChange={v => updateForm('primary_color', v)} />
              <BrandingColorPicker label="Secondary Color" value={form.secondary_color} onChange={v => updateForm('secondary_color', v)} />
            </div>
          </div>

          {/* Assets Section */}
          <div style={sectionCardStyle('0.2s')}>
            <SectionHeader color="#1D1D1F" title="Assets"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>}
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
            <SectionHeader color="#1D1D1F" title="Contact & Social"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField label="Support Email"><Input type="email" value={form.support_email} onChange={e => updateForm('support_email', e.target.value)} placeholder="support@club.com" /></FormField>
              <FormField label="Support Phone"><Input value={form.support_phone} onChange={e => updateForm('support_phone', e.target.value)} placeholder={t('forms.phonePlaceholder', { defaultValue: '+966 5x xxx xxxx' })} /></FormField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <FormField label="Instagram"><Input value={form.social_instagram} onChange={e => updateForm('social_instagram', e.target.value)} placeholder="@clubname" /></FormField>
              <FormField label="Twitter / X"><Input value={form.social_twitter} onChange={e => updateForm('social_twitter', e.target.value)} placeholder="@clubname" /></FormField>
              <FormField label="Facebook"><Input value={form.social_facebook} onChange={e => updateForm('social_facebook', e.target.value)} placeholder="facebook.com/club" /></FormField>
            </div>
          </div>

          {/* Custom Domain Section */}
          <div style={sectionCardStyle('0.3s')}>
            <SectionHeader color="#1D1D1F" title="Custom Domain"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>}
              subtitle="Map a custom domain for white-label experience"
            />
            <FormField label="Domain">
              <Input value={form.custom_domain} onChange={e => updateForm('custom_domain', e.target.value)} placeholder="app.yourclub.com" />
            </FormField>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ color: '#1D1D1F', fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Domain Active</div>
                <div style={{ color: '#6E6E73', fontSize: 12, marginTop: 3, fontFamily: 'var(--font-body)' }}>Enable after DNS is configured</div>
              </div>
              <ToggleSwitch checked={form.is_domain_active} onChange={v => updateForm('is_domain_active', v)} />
            </div>
            {form.custom_domain && (
              <div style={{ borderRadius: 16,
                padding: '12px 14px', background: '#F2F2F7', border: '1px solid #E5E5EA', marginBottom: 18,
              }}>
                <div style={{ ...labelStyle, marginBottom: 8 }}>DNS Configuration</div>
                <div style={{ color: '#1D1D1F', fontSize: 12, fontFamily: 'var(--font-body)', wordBreak: 'break-all' }}>
                  CNAME {form.custom_domain} → clubs.craveclubs.com
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '12px 16px', background: '#FFFFFF', border: '1px solid #FF3B30',
              color: '#FF3B30', fontSize: 13, marginBottom: 12, fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', gap: 8,
              animation: 'fadeInUp 0.3s ease-out',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
              {error}
            </div>
          )}

          {/* Save Button */}
          <FormPageActions>
            <Button variant="secondary" onClick={() => navigate(`/corporate/clubs/${id}`)}>{t('actions.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? t('loading.saving') : t('actions.save')}</Button>
          </FormPageActions>
        </div>

        {/* Right — Phone Preview */}
        <div style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}>
          <PhonePreview form={form} />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ borderRadius: 14, position: 'fixed', bottom: 32, insetInlineEnd: 32, padding: '14px 20px',
          background: '#FFFFFF', border: '1px solid #E5E5EA',
          color: '#1D1D1F',
          fontFamily: 'var(--font-body)', fontSize: 12,
          animation: 'fadeInUp 0.3s ease-out', zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: '#0071E3', flexShrink: 0 }} />
          {toast}
        </div>
      )}
    </FormPage>
  );
}
