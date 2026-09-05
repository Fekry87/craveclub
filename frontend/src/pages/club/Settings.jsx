import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FormField, Input, TextArea, Button, PageHeader, useIsMobile } from '../../components/CrudTable';
import { labelStyle } from '../../components/ui/styles';
import { useTranslation } from 'react-i18next';

function SettingsSection({ title, icon, children, description }) {
  return (
    <div style={{ borderRadius: 16,
      background: '#FFFFFF',
      padding: '24px 26px',
      border: '1px solid #E5E5EA',
      transition: 'border-color 0.15s ease',
      height: '100%', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        paddingBottom: 14, borderBottom: '1px solid #E5E5EA',
      }}>
        <div style={{ borderRadius: 10,
          width: 36, height: 36, border: '1px solid #E5E5EA', color: '#1D1D1F',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
          <h3 style={{
            margin: 0, color: '#1D1D1F',
            fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600,
            letterSpacing: '-0.02em', lineHeight: 1,
          }}>{title}</h3>
          {description && (
            <p style={{ ...labelStyle, margin: '7px 0 0 0', lineHeight: 1.3 }}>{description}</p>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20, flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

function SaveToast({ show }) {
  const { t } = useTranslation();
  if (!show) return null;
  return (
    <div style={{ borderRadius: 14, position: 'fixed', bottom: 28, insetInlineEnd: 28, zIndex: 100,
      background: '#FFFFFF',
      border: '1px solid #E5E5EA',
      padding: '14px 22px',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'fadeInUp 0.25s ease-out',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0071E3" strokeWidth="2" strokeLinecap="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      <span style={{
        color: '#1D1D1F', fontFamily: 'var(--font-body)', fontSize: 12,
      }}>{t('settings.saved')}</span>
    </div>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', logo_url: '', theme_color: '', about: '', contact_email: '', contact_phone: '' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    api.get('/club/settings').then(r => {
      setForm({
        name: r.data.name || '', logo_url: r.data.logo_url || '', theme_color: r.data.theme_color || '#0071E3',
        about: r.data.about || '', contact_email: r.data.contact_email || '', contact_phone: r.data.contact_phone || '',
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    await api.put('/club/settings', form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 300, color: '#6E6E73',
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5EA" strokeWidth="2" />
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#0071E3" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div style={{ ...labelStyle }}>{t('loading.default')}</div>
        </div>
      </div>
    );
  }

  const presetColors = [
    '#0071E3', '#1D1D1F', '#515154', '#6E6E73', '#AEAEB2',
    '#34C759', '#FF9500', '#FF3B30', '#F2F2F7', '#0062C3',
  ];

  return (
    <div>
      <PageHeader title={t('settings.clubSettings')}>
        <Button onClick={handleSave}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <path d="M17 21v-8H7v8M7 3v5h8" />
          </svg>
          {t('actions.save')}
        </Button>
      </PageHeader>

      {/* ── Row 1: Club Identity + Theme & Appearance ── */}
      <div className="settings-grid" style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 16,
        marginBottom: 16,
      }}>
        {/* Club Identity */}
        <SettingsSection
          title="Club Identity"
          description="Basic club information"
          icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        >
          <FormField label="Club Name">
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter your club name" />
          </FormField>
          <FormField label="Logo URL">
            <Input value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} placeholder="https://example.com/logo.png" />
          </FormField>
          {form.logo_url && (
            <div style={{ borderRadius: 16,
              marginTop: -4, marginBottom: 16, padding: 12, background: '#F2F2F7',
              border: '1px solid #E5E5EA',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <img
                src={form.logo_url}
                alt="Club logo preview"
                onError={e => { e.target.style.display = 'none'; }}
                style={{ borderRadius: 16,
                  width: 44, height: 44, objectFit: 'cover',
                  border: '1px solid #E5E5EA', background: '#FFFFFF',
                }}
              />
              <div style={{ ...labelStyle }}>Logo Preview</div>
            </div>
          )}
          <FormField label="About">
            <TextArea
              value={form.about}
              onChange={e => setForm({ ...form, about: e.target.value })}
              placeholder="Tell members about your club..."
              rows={4}
            />
          </FormField>
        </SettingsSection>

        {/* Theme & Appearance */}
        <SettingsSection
          title="Theme & Appearance"
          description="Customize your club's look"
          icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          }
        >
          <FormField label="Theme Color">
            {/* Color picker + hex input integrated into one styled row */}
            <div style={{ borderRadius: 16,
              display: 'flex', alignItems: 'center', gap: 0,
              background: '#FFFFFF',
              border: '1px solid #AEAEB2',
              transition: 'border-color 0.15s ease',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#D2D2D7'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#AEAEB2'}
            >
              {/* Color swatch picker */}
              <div style={{
                width: 44, height: 42, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderInlineEnd: '1px solid #E5E5EA',
                position: 'relative',
              }}>
                <div style={{ borderRadius: 6,
                  width: 24, height: 24, background: form.theme_color,
                  border: '1px solid #E5E5EA',
                }} />
                <input
                  type="color"
                  value={form.theme_color}
                  onChange={e => setForm({ ...form, theme_color: e.target.value })}
                  style={{
                    position: 'absolute', inset: 0,
                    opacity: 0, cursor: 'pointer',
                    width: '100%', height: '100%',
                  }}
                />
              </div>
              {/* Hex text input */}
              <input
                type="text"
                value={form.theme_color}
                onChange={e => setForm({ ...form, theme_color: e.target.value })}
                placeholder="#0071E3"
                style={{
                  flex: 1, minWidth: 0,
                  padding: '0 14px',
                  height: 42,
                  background: 'transparent',
                  border: 'none',
                  color: '#1D1D1F',
                  fontSize: 13,
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </FormField>

          {/* Color presets */}
          <div style={{ marginTop: 8 }}>
            <div style={{ ...labelStyle, marginBottom: 12 }}>Quick presets</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {presetColors.map(color => (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  onClick={() => setForm({ ...form, theme_color: color })}
                  style={{ borderRadius: 10,
                    width: 32, height: 32, background: color,
                    border: form.theme_color === color
                      ? '2px solid #1D1D1F'
                      : '1px solid #E5E5EA',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'border-color 0.15s ease',
                  }}
                />
              ))}
            </div>
          </div>
        </SettingsSection>
      </div>

      {/* ── Row 2: Contact Information (full width) ── */}
      <SettingsSection
        title="Contact Information"
        description="How members can reach your club"
        icon={
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
          </svg>
        }
      >
        <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          <FormField label="Contact Email">
            <Input
              type="email"
              value={form.contact_email}
              onChange={e => setForm({ ...form, contact_email: e.target.value })}
              placeholder="info@yourclub.com"
            />
          </FormField>
          <FormField label="Contact Phone">
            <Input
              value={form.contact_phone}
              onChange={e => setForm({ ...form, contact_phone: e.target.value })}
              placeholder={t('forms.phonePlaceholder', { defaultValue: '+966 5x xxx xxxx' })}
            />
          </FormField>
        </div>
      </SettingsSection>

      <SaveToast show={saved} />
    </div>
  );
}
