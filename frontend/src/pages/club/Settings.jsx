import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FormField, Input, Button, PageHeader, useIsMobile } from '../../components/CrudTable';
import { useTranslation } from 'react-i18next';

function SettingsSection({ title, icon, children, accentColor, description }) {
  const accent = accentColor || '#22d3ee';
  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
      borderRadius: 22, padding: '28px 26px 24px',
      border: '1px solid rgba(34,211,238,0.06)',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.15), 0 4px 16px rgba(6,13,31,0.2)',
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      height: '100%', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${accent}22`;
        e.currentTarget.style.boxShadow = `0 2px 6px rgba(0,0,0,0.2), 0 8px 32px rgba(6,13,31,0.3), 0 0 40px ${accent}06`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.06)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15), 0 4px 16px rgba(6,13,31,0.2)';
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 24, right: 24, height: 2,
        borderRadius: '0 0 2px 2px',
        background: `linear-gradient(90deg, transparent 0%, ${accent}35 50%, transparent 100%)`,
      }} />
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', top: 20, left: 0, bottom: 20, width: 3,
        borderRadius: '0 3px 3px 0',
        background: `linear-gradient(180deg, ${accent}60 0%, ${accent}15 100%)`,
      }} />

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: `linear-gradient(135deg, ${accent}14 0%, ${accent}08 100%)`,
          border: `1px solid ${accent}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 2px 12px ${accent}0a`,
        }}>{icon}</div>
        <div>
          <h3 style={{
            margin: 0, color: '#f1f5f9',
            fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 600,
            letterSpacing: '-0.01em',
          }}>{title}</h3>
          {description && (
            <p style={{
              color: '#526280', fontSize: 12, margin: '3px 0 0 0',
              lineHeight: 1.4,
            }}>{description}</p>
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
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 100,
      background: 'linear-gradient(135deg, rgba(45,212,191,0.12) 0%, rgba(34,211,238,0.08) 100%)',
      border: '1px solid rgba(45,212,191,0.25)',
      borderRadius: 16, padding: '14px 26px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 40px rgba(45,212,191,0.06)',
      animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: 'rgba(45,212,191,0.12)',
        border: '1px solid rgba(45,212,191,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <span style={{
        color: '#2dd4bf', fontSize: '0.875rem', fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
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
        name: r.data.name || '', logo_url: r.data.logo_url || '', theme_color: r.data.theme_color || '#0ea5e9',
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
        minHeight: 300, color: '#64748b',
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 10 }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(34,211,238,0.2)" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{t('loading.default')}</div>
        </div>
      </div>
    );
  }

  const presetColors = [
    '#0ea5e9', '#22d3ee', '#06b6d4', '#2dd4bf', '#14b8a6',
    '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  ];

  return (
    <div>
      <PageHeader title={t('settings.clubSettings')}>
        <Button onClick={handleSave}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <path d="M17 21v-8H7v8M7 3v5h8" />
          </svg>
          {t('actions.save')}
        </Button>
      </PageHeader>

      {/* ── Row 1: Club Identity + Theme & Appearance ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 20,
        marginBottom: 20,
      }}>
        {/* Club Identity */}
        <SettingsSection
          title="Club Identity"
          accentColor="#22d3ee"
          description="Basic club information"
          icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round">
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
            <div style={{
              marginTop: -4, marginBottom: 16, padding: 12, borderRadius: 12,
              background: 'rgba(6,13,31,0.5)',
              border: '1px solid rgba(51,65,85,0.3)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <img
                src={form.logo_url}
                alt="Club logo preview"
                onError={e => { e.target.style.display = 'none'; }}
                style={{
                  width: 44, height: 44, borderRadius: 10,
                  objectFit: 'cover',
                  border: '1px solid rgba(51,65,85,0.3)',
                }}
              />
              <div style={{ color: '#64748b', fontSize: 12, fontWeight: 500 }}>Logo Preview</div>
            </div>
          )}
          <FormField label="About">
            <textarea
              value={form.about}
              onChange={e => setForm({ ...form, about: e.target.value })}
              placeholder="Tell members about your club..."
              rows={4}
              style={{
                width: '100%',
                minHeight: 100,
                padding: '12px 14px',
                background: 'rgba(6,13,31,0.6)',
                border: '1px solid rgba(51,65,85,0.5)',
                borderRadius: 12,
                color: '#e2e8f0',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.25s ease',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.6,
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(34,211,238,0.4)';
                e.target.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.06)';
                e.target.style.background = 'rgba(6,13,31,0.8)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(51,65,85,0.5)';
                e.target.style.boxShadow = 'none';
                e.target.style.background = 'rgba(6,13,31,0.6)';
              }}
            />
          </FormField>
        </SettingsSection>

        {/* Theme & Appearance */}
        <SettingsSection
          title="Theme & Appearance"
          accentColor="#8b5cf6"
          description="Customize your club's look"
          icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          }
        >
          <FormField label="Theme Color">
            {/* Color picker + hex input integrated into one styled row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 0,
              background: 'rgba(6,13,31,0.6)',
              border: '1px solid rgba(51,65,85,0.5)',
              borderRadius: 12,
              overflow: 'hidden',
              transition: 'border-color 0.25s ease',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(51,65,85,0.7)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(51,65,85,0.5)'}
            >
              {/* Color swatch picker */}
              <div style={{
                width: 48, height: 44, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRight: '1px solid rgba(51,65,85,0.4)',
                position: 'relative',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: form.theme_color,
                  boxShadow: `0 0 12px ${form.theme_color}40`,
                  border: '2px solid rgba(255,255,255,0.15)',
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
                placeholder="#0ea5e9"
                style={{
                  flex: 1, minWidth: 0,
                  padding: '0 14px',
                  height: 44,
                  background: 'transparent',
                  border: 'none',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                  fontFamily: "'DM Mono', 'DM Sans', monospace",
                  letterSpacing: '0.04em',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {/* Live preview circle */}
              <div style={{
                width: 48, height: 44, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderLeft: '1px solid rgba(51,65,85,0.4)',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: form.theme_color,
                  boxShadow: `0 0 16px ${form.theme_color}50`,
                  border: '2px solid rgba(255,255,255,0.12)',
                }} />
              </div>
            </div>
          </FormField>

          {/* Color presets */}
          <div style={{ marginTop: 8 }}>
            <div style={{
              color: '#526280', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.06em', marginBottom: 12,
              textTransform: 'uppercase',
            }}>Quick presets</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {presetColors.map(color => (
                <button
                  key={color}
                  onClick={() => setForm({ ...form, theme_color: color })}
                  onMouseEnter={e => {
                    if (form.theme_color !== color) {
                      e.currentTarget.style.transform = 'scale(1.18)';
                      e.currentTarget.style.boxShadow = `0 0 18px ${color}55, 0 4px 12px ${color}30`;
                    }
                  }}
                  onMouseLeave={e => {
                    if (form.theme_color !== color) {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                  style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: color,
                    border: form.theme_color === color
                      ? '2.5px solid #fff'
                      : '2px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: form.theme_color === color
                      ? `0 0 16px ${color}66, 0 0 30px ${color}25`
                      : 'none',
                    transform: form.theme_color === color ? 'scale(1.1)' : 'scale(1)',
                    position: 'relative',
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
        accentColor="#2dd4bf"
        description="How members can reach your club"
        icon={
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round">
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
              placeholder="+1 (555) 000-0000"
            />
          </FormField>
        </div>
      </SettingsSection>

      <SaveToast show={saved} />
    </div>
  );
}
