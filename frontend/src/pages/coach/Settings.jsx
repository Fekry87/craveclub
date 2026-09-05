import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { PageHeader, Button, Input, TextArea, useIsMobile } from '../../components/CrudTable';
import { cardStyle, avatarCardColors } from '../../components/ui/styles';
import { useTranslation } from 'react-i18next';

const captionStyle = {
  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, color: '#6E6E73',
};

const sectionTitleStyle = {
  margin: 0, color: '#1D1D1F', fontSize: 17, fontWeight: 600,
  fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.2,
};

const iconTileStyle = {
  width: 30, height: 30, borderRadius: 9, background: 'rgba(0,113,227,0.1)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

/* Grouped settings row: label on the leading side, control on the trailing side. */
function SettingsRow({ label, hint, children, last, stacked, isMobile }) {
  const column = stacked || isMobile;
  return (
    <div style={{
      display: 'flex',
      flexDirection: column ? 'column' : 'row',
      alignItems: column ? 'stretch' : 'center',
      gap: column ? 8 : 16,
      minHeight: 44,
      padding: '12px 0',
      borderBottom: last ? 'none' : '1px solid #F2F2F7',
    }}>
      <label style={{
        fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 400, color: '#1D1D1F',
        flexShrink: 0, minWidth: column ? 0 : 140, textAlign: 'start',
      }}>
        {label}
        {hint && <span style={{ ...captionStyle, display: 'block', marginTop: 2 }}>{hint}</span>}
      </label>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

export default function CoachSettings() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState({ name: '', bio: '', specialization: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    api.get('/coach/profile').then(r => {
      const d = r.data;
      setProfile({
        name: d.user?.name || '',
        bio: d.profile?.bio || '',
        specialization: d.profile?.specialization || '',
        phone: d.profile?.phone || '',
      });
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/coach/profile', profile);
      setToast('Profile updated successfully!');
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast('Failed to save. Please try again.');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#6E6E73' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5EA" strokeWidth="2" />
          <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#0071E3" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <div style={captionStyle}>{t('loading.default')}</div>
      </div>
    </div>
  );

  const failed = toast && toast.includes('Failed');
  const avatar = avatarCardColors[0];

  return (
    <div>
      <PageHeader title={t('settings.title')}>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? t('loading.saving') : t('actions.saveChanges')}
        </Button>
      </PageHeader>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, insetInlineEnd: 24, zIndex: 1000,
          padding: '12px 18px', background: '#FFFFFF',
          border: '1px solid #E5E5EA', borderRadius: 14,
          boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fadeInUp 0.3s ease-out',
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            background: failed ? 'rgba(255,59,48,0.12)' : 'rgba(52,199,89,0.14)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={failed ? '#B12A20' : '#1E7A3B'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              {failed ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M20 6L9 17l-5-5" />}
            </svg>
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: '#1D1D1F' }}>{toast}</span>
        </div>
      )}

      <div className="settings-grid" style={{
        display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 20, maxWidth: 800,
      }}>
        {/* Profile Info */}
        <div style={{
          ...cardStyle,
          padding: isMobile ? '22px 20px' : '24px 26px',
          gridColumn: isMobile ? '1' : '1 / -1',
          animation: 'fadeInUp 0.3s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 18, borderBottom: '1px solid #F2F2F7' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: avatar.bg, color: avatar.text,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600,
              letterSpacing: '-0.02em', flexShrink: 0,
            }}>
              {profile.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                color: '#1D1D1F', fontSize: 20, fontWeight: 600,
                fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.2,
              }}>{profile.name}</div>
              <div style={{ ...captionStyle, marginTop: 4 }}>Coach profile</div>
            </div>
          </div>

          <div>
            <SettingsRow label="Full Name" isMobile={isMobile}>
              <Input value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} placeholder="Your name" />
            </SettingsRow>
            <SettingsRow label="Phone Number" isMobile={isMobile} last>
              <Input value={profile.phone} onChange={e => setProfile(p => ({...p, phone: e.target.value}))} placeholder="+966 5x xxx xxxx" />
            </SettingsRow>
          </div>
        </div>

        {/* Specialization */}
        <div style={{
          ...cardStyle,
          padding: isMobile ? '22px 20px' : '24px 26px',
          animation: 'fadeInUp 0.3s ease-out 0.06s both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, paddingBottom: 14, borderBottom: '1px solid #F2F2F7' }}>
            <div style={iconTileStyle}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0071E3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 style={sectionTitleStyle}>Specialization</h3>
          </div>
          <SettingsRow label="Coaching Focus" isMobile={isMobile} stacked last>
            <Input value={profile.specialization} onChange={e => setProfile(p => ({...p, specialization: e.target.value}))} placeholder="e.g. Freestyle & Butterfly" />
          </SettingsRow>
        </div>

        {/* Bio */}
        <div style={{
          ...cardStyle,
          padding: isMobile ? '22px 20px' : '24px 26px',
          animation: 'fadeInUp 0.3s ease-out 0.12s both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, paddingBottom: 14, borderBottom: '1px solid #F2F2F7' }}>
            <div style={iconTileStyle}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0071E3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            <h3 style={sectionTitleStyle}>Bio</h3>
          </div>
          <SettingsRow label="About You" isMobile={isMobile} stacked last>
            <TextArea value={profile.bio} onChange={e => setProfile(p => ({...p, bio: e.target.value}))} placeholder="Tell swimmers about your coaching experience..." rows={4} />
          </SettingsRow>
        </div>
      </div>
    </div>
  );
}
