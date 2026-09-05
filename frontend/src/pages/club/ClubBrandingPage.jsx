import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getOwnBranding, updateOwnBranding, uploadOwnBrandingFile } from '../../api/branding';
import { FormField, Input, Button, PageHeader } from '../../components/CrudTable';
import { Badge } from '../../components/ui/Badge';
import { cardStyle, inputStyle, inputFocusProps } from '../../components/ui/styles';

const COLOR_PRESETS = ['1A6FB5', 'C0392B', '27AE60', '7D3C98', 'E67E22', '148F77', 'B7950B', '2C3E50'];
const ASSET_LABEL_KEY = { logo: 'branding.logo', favicon: 'branding.favicon', cover: 'branding.coverImage' };

const sectionCardStyle = (delay = '0.1s') => ({
  ...cardStyle,
  padding: '22px 24px 6px',
  marginBottom: 20,
  animation: `fadeInUp 0.4s ease-out ${delay} both`,
});

function BrandingColorPicker({ label, value, onChange }) {
  const { t } = useTranslation();
  const isValid = /^[0-9A-Fa-f]{6}$/.test(value || '');
  return (
    <FormField label={label}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          position: 'relative', width: 32, height: 32, flexShrink: 0,
          borderRadius: '50%', background: isValid ? `#${value}` : '#E5E5EA',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
        }}>
          <input
            type="color"
            value={isValid ? `#${value}` : '#0071E3'}
            onChange={e => onChange(e.target.value.replace('#', ''))}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
          />
        </div>
        <input
          type="text" value={value || ''} onChange={e => onChange(e.target.value.replace('#', ''))}
          placeholder={t('branding.hexPlaceholder')}
          {...inputFocusProps}
          style={{
            ...inputStyle,
            flex: 1, minWidth: 0,
            borderColor: value && !isValid ? '#FF3B30' : '#D2D2D7',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
        {COLOR_PRESETS.map(color => {
          const selected = (value || '').toLowerCase() === color.toLowerCase();
          return (
            <button key={color} type="button" onClick={() => onChange(color)}
              style={{
                width: 28, height: 28, borderRadius: '50%', background: `#${color}`,
                border: 'none', padding: 0, cursor: 'pointer',
                transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                boxShadow: selected
                  ? '0 0 0 2px #FFFFFF, 0 0 0 4px #0071E3'
                  : 'inset 0 0 0 1px rgba(0,0,0,0.08)',
              }}
            />
          );
        })}
      </div>
      {value && !isValid && (
        <div style={{ color: '#B12A20', marginTop: 8, fontSize: 12 }}>
          {t('branding.invalidHex')}
        </div>
      )}
    </FormField>
  );
}

function FileUploadZone({ label, accept, currentUrl, previewStyle, onUpload, uploading }) {
  const { t } = useTranslation();
  const ref = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert(t('branding.fileTooLarge'));
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
        onMouseEnter={e => { if (!dragOver) e.currentTarget.style.borderColor = '#0071E3'; }}
        onMouseLeave={e => { if (!dragOver) e.currentTarget.style.borderColor = '#D2D2D7'; }}
        style={{
          border: `2px dashed ${dragOver ? '#0071E3' : '#D2D2D7'}`,
          borderRadius: 14,
          padding: 20, textAlign: 'center', cursor: 'pointer',
          background: '#F2F2F7',
          transition: 'border-color 0.15s ease, background 0.15s ease',
        }}
      >
        {displayUrl ? (
          <img src={displayUrl} alt={label} style={{ maxWidth: '100%', borderRadius: 10, objectFit: 'contain', ...previewStyle }} />
        ) : (
          <div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#86868B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 10px' }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <div style={{ fontSize: 13, color: '#6E6E73' }}>{t('branding.dropFile')}</div>
            <div style={{ fontSize: 12, marginTop: 4, color: '#86868B' }}>{t('branding.fileTypes')}</div>
          </div>
        )}
        {uploading && (
          <div style={{ color: '#0071E3', marginTop: 10, fontSize: 12 }}>{t('branding.uploading')}</div>
        )}
        <input ref={ref} type="file" accept={accept || 'image/png,image/jpeg,image/svg+xml'} style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
      </div>
    </FormField>
  );
}

function PhonePreview({ form }) {
  const { t } = useTranslation();
  const primary = /^[0-9A-Fa-f]{6}$/.test(form.primary_color || '') ? `#${form.primary_color}` : '#515154';
  const secondary = /^[0-9A-Fa-f]{6}$/.test(form.secondary_color || '') ? `#${form.secondary_color}` : '#34C759';
  const previewTabs = [
    { key: 'home', label: t('nav.home') },
    { key: 'sessions', label: t('nav.sessions') },
    { key: 'profile', label: t('branding.profile') },
  ];

  return (
    <div style={{ position: 'sticky', top: 24 }}>
      <div style={{
        fontSize: 12, color: '#6E6E73',
        marginBottom: 14, textAlign: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0071E3', display: 'inline-block' }} />
        {t('branding.livePreview')}
      </div>
      {/* Device mock — deliberately renders the CLUB's own brand colours, not the Apple palette */}
      <div style={{
        width: 292, margin: '0 auto', padding: 6,
        borderRadius: 36, background: '#FFFFFF',
        boxShadow: '0 12px 40px rgba(0,0,0,0.16)',
      }}>
        <div style={{
          width: 280, height: 560, borderRadius: 28,
          background: '#F5F5F7', overflow: 'hidden', position: 'relative',
        }}>
          <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
            <div style={{ width: 80, height: 24, borderRadius: 12, background: '#000000' }} />
          </div>
          <div style={{
            height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
            background: form.cover_url ? `url(${form.cover_url}) center/cover` : primary,
            position: 'relative',
          }}>
            {form.cover_url && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" style={{ borderRadius: 14, width: 60, height: 60, objectFit: 'contain', background: 'rgba(255,255,255,0.15)', padding: 4 }} />
              ) : (
                <div style={{ borderRadius: 14, width: 60, height: 60, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
              )}
              <div style={{ color: '#1D1D1F', fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', textShadow: '0 1px 4px rgba(0,0,0,0.3)', textAlign: 'center', padding: '0 16px' }}>
                {form.display_name || form.club_name || t('branding.clubNameFallback')}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 ? '#F5F5F7' : 'rgba(255,255,255,0.4)' }} />)}
              </div>
            </div>
          </div>
          <div style={{ height: 48, background: primary, display: 'flex', alignItems: 'center', paddingInlineStart: 16, gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F5F5F7' }} />
            <div style={{ color: '#1D1D1F', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)' }}>
              {form.app_name || t('branding.appNameFallback')}
            </div>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, height: 40, borderRadius: 10, background: primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#1D1D1F', fontSize: 11, fontWeight: 600 }}>{t('branding.primary')}</span>
            </div>
            <div style={{ flex: 1, height: 40, borderRadius: 10, background: secondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#1D1D1F', fontSize: 11, fontWeight: 600 }}>{t('branding.secondary')}</span>
            </div>
          </div>
          <div style={{ padding: '8px 20px' }}>
            {[0.8, 0.6, 0.9, 0.5].map((w, i) => (
              <div key={i} style={{ height: 10, borderRadius: 5, background: '#E5E5EA', marginBottom: 8, width: `${w * 100}%` }} />
            ))}
          </div>
          <div style={{ position: 'absolute', bottom: 0, insetInlineStart: 0, insetInlineEnd: 0, height: 56, background: '#FFFFFF', borderTop: '1px solid #E5E5EA', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 8px' }}>
            {previewTabs.map(tab => (
              <div key={tab.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 18, height: 18, borderRadius: 6, background: tab.key === 'home' ? primary : '#515154' }} />
                <span style={{ fontSize: 9, color: tab.key === 'home' ? primary : '#86868B', fontWeight: 500 }}>{tab.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ color, icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #F2F2F7' }}>
      <h4 style={{
        color: '#1D1D1F', margin: 0,
        fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600,
        lineHeight: 1.2,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {icon && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: '#F2F2F7', color: color || '#0071E3',
          }}>{icon}</span>
        )}
        <span>{title}</span>
      </h4>
      {subtitle && (
        <div style={{ marginTop: 8, fontSize: 13, color: '#6E6E73' }}>{subtitle}</div>
      )}
    </div>
  );
}

export default function ClubBrandingPage() {
  const { t } = useTranslation();
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
      showToast(t('branding.uploaded', { name: t(ASSET_LABEL_KEY[type] || 'branding.logo') }));
    } catch {
      setError(t('branding.uploadFailed', { name: t(ASSET_LABEL_KEY[type] || 'branding.logo') }));
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (form.primary_color && !/^[0-9A-Fa-f]{6}$/.test(form.primary_color)) {
        setError(t('branding.primaryColorInvalid'));
        setSaving(false);
        return;
      }
      if (form.secondary_color && !/^[0-9A-Fa-f]{6}$/.test(form.secondary_color)) {
        setError(t('branding.secondaryColorInvalid'));
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
      showToast(t('branding.saved'));
    } catch (err) {
      const msgs = err.response?.data?.errors;
      setError(msgs ? Object.values(msgs).map(a => a[0]).join(', ') : (err.response?.data?.message || t('branding.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#6E6E73' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" style={{ animation: 'spin 1.2s linear infinite', marginBottom: 14 }}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5EA" strokeWidth="2" />
          <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#0071E3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ fontSize: 13, color: '#6E6E73' }}>{t('branding.loading')}</div>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title={t('branding.title')}>
        <Button onClick={handleSave} disabled={saving}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <path d="M17 21v-8H7v8M7 3v5h8" />
          </svg>
          {saving ? t('loading.saving') : t('actions.save')}
        </Button>
      </PageHeader>

      <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40 }}>
        {/* Left — Form */}
        <div>
          {/* Identity Section */}
          <div style={sectionCardStyle('0.1s')}>
            <SectionHeader title={t('branding.identity')}
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField label={t('branding.displayName')}><Input value={form.display_name} onChange={e => updateForm('display_name', e.target.value)} placeholder={t('branding.displayNamePlaceholder')} /></FormField>
              <FormField label={t('branding.appName')}><Input value={form.app_name} onChange={e => updateForm('app_name', e.target.value)} placeholder={t('branding.appNamePlaceholder')} /></FormField>
            </div>

            {/* Branding Tier — read-only for club managers */}
            <FormField label={t('branding.brandingTier')}>
              <div style={{
                padding: '10px 14px', borderRadius: 12, background: '#F2F2F7',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <Badge variant={form.branding_tier === 'branded' ? 'accent' : 'neutral'}
                  label={form.branding_tier === 'branded' ? t('branding.tierBranded') : t('branding.tierShared')} />
                <span style={{ color: '#6E6E73', fontSize: 13 }}>
                  {t('branding.managedByAdmin')}
                </span>
              </div>
            </FormField>
          </div>

          {/* Colors Section */}
          <div style={sectionCardStyle('0.15s')}>
            <SectionHeader title={t('branding.colors')}
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.49 8.49l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.49-8.49l2.83-2.83" /></svg>}
              subtitle={t('branding.colorsHint')}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <BrandingColorPicker label={t('branding.primaryColor')} value={form.primary_color} onChange={v => updateForm('primary_color', v)} />
              <BrandingColorPicker label={t('branding.secondaryColor')} value={form.secondary_color} onChange={v => updateForm('secondary_color', v)} />
            </div>
          </div>

          {/* Assets Section */}
          <div style={sectionCardStyle('0.2s')}>
            <SectionHeader title={t('branding.assets')}
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>}
              subtitle={t('branding.assetsHint')}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FileUploadZone label={t('branding.logo')} currentUrl={form.logo_url} uploading={uploading.logo}
                previewStyle={{ maxHeight: 60 }} onUpload={f => handleUpload(f, 'logo')} />
              <FileUploadZone label={t('branding.favicon')} currentUrl={form.favicon_url} uploading={uploading.favicon}
                previewStyle={{ maxHeight: 32, maxWidth: 32 }} onUpload={f => handleUpload(f, 'favicon')} />
            </div>
            <FileUploadZone label={t('branding.coverImage')} currentUrl={form.cover_url} uploading={uploading.cover}
              previewStyle={{ maxHeight: 120, width: '100%', objectFit: 'cover' }} onUpload={f => handleUpload(f, 'cover')} />
          </div>

          {/* Contact & Social Section */}
          <div style={sectionCardStyle('0.25s')}>
            <SectionHeader title={t('branding.contactSocial')}
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField label={t('branding.supportEmail')}><Input type="email" value={form.support_email} onChange={e => updateForm('support_email', e.target.value)} placeholder="support@club.com" /></FormField>
              <FormField label={t('branding.supportPhone')}><Input value={form.support_phone} onChange={e => updateForm('support_phone', e.target.value)} placeholder={t('forms.phonePlaceholder')} /></FormField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <FormField label={t('branding.instagram')}><Input value={form.social_instagram} onChange={e => updateForm('social_instagram', e.target.value)} placeholder="@clubname" /></FormField>
              <FormField label={t('branding.twitter')}><Input value={form.social_twitter} onChange={e => updateForm('social_twitter', e.target.value)} placeholder="@clubname" /></FormField>
              <FormField label={t('branding.facebook')}><Input value={form.social_facebook} onChange={e => updateForm('social_facebook', e.target.value)} placeholder="facebook.com/club" /></FormField>
            </div>
          </div>

          {/* Custom Domain Section — read-only for club managers */}
          {form.custom_domain && (
            <div style={sectionCardStyle('0.3s')}>
              <SectionHeader title={t('branding.customDomain')}
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>}
              />
              <div style={{
                padding: '10px 14px', borderRadius: 12, background: '#F2F2F7',
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: form.is_domain_active ? '#34C759' : '#AEAEB2',
                }} />
                <span style={{
                  color: '#1D1D1F', fontSize: 13,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {form.custom_domain}
                </span>
                <span style={{ marginInlineStart: 'auto', display: 'inline-flex' }}>
                  <Badge variant={form.is_domain_active ? 'success' : 'neutral'}
                    label={t('branding.domainManaged', { status: form.is_domain_active ? t('status.active') : t('status.inactive') })} />
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 12,
              background: 'rgba(255,59,48,0.10)', border: '1px solid rgba(255,59,48,0.25)',
              color: '#B12A20', fontSize: 13, marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 8,
              animation: 'fadeInUp 0.3s ease-out',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
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
          position: 'fixed', bottom: 32, insetInlineEnd: 32, padding: '12px 16px',
          borderRadius: 12,
          background: 'rgba(29,29,31,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
          color: '#1D1D1F', fontSize: 14,
          animation: 'fadeInUp 0.3s ease-out', zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34C759', flexShrink: 0 }} />
          {toast}
        </div>
      )}
    </div>
  );
}
