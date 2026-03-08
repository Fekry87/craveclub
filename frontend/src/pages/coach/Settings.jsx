import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { PageHeader, Button, FormField, Input, TextArea, useIsMobile } from '../../components/CrudTable';

export default function CoachSettings() {
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#64748b' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(45,212,191,0.2)" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Loading settings...</div>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Settings">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </PageHeader>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 1000,
          padding: '12px 20px', borderRadius: 12,
          background: toast.includes('Failed') ? 'rgba(244,63,94,0.15)' : 'rgba(45,212,191,0.15)',
          border: `1px solid ${toast.includes('Failed') ? 'rgba(244,63,94,0.3)' : 'rgba(45,212,191,0.3)'}`,
          color: toast.includes('Failed') ? '#fda4af' : '#2dd4bf',
          fontSize: 13, fontWeight: 600, backdropFilter: 'blur(12px)',
          animation: 'fadeInUp 0.3s ease-out',
        }}>{toast}</div>
      )}

      <div style={{
        display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 20, maxWidth: 800,
      }}>
        {/* Profile Info */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
          borderRadius: 20, padding: '28px', border: '1px solid rgba(45,212,191,0.08)',
          gridColumn: isMobile ? '1' : '1 / -1',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'linear-gradient(135deg, #163060 0%, #122347 100%)',
              border: '1px solid rgba(45,212,191,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 800,
              color: '#2dd4bf',
            }}>
              {profile.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <div style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{profile.name}</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>Coach Profile</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <FormField label="Full Name">
              <Input value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} placeholder="Your name" />
            </FormField>
            <FormField label="Phone Number">
              <Input value={profile.phone} onChange={e => setProfile(p => ({...p, phone: e.target.value}))} placeholder="+1-555-0000" />
            </FormField>
          </div>
        </div>

        {/* Specialization */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
          borderRadius: 20, padding: '28px', border: '1px solid rgba(45,212,191,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: 16, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Specialization</h3>
          </div>
          <FormField label="Coaching Focus">
            <Input value={profile.specialization} onChange={e => setProfile(p => ({...p, specialization: e.target.value}))} placeholder="e.g. Freestyle & Butterfly" />
          </FormField>
        </div>

        {/* Bio */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
          borderRadius: 20, padding: '28px', border: '1px solid rgba(45,212,191,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: 16, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Bio</h3>
          </div>
          <FormField label="About You">
            <TextArea value={profile.bio} onChange={e => setProfile(p => ({...p, bio: e.target.value}))} placeholder="Tell swimmers about your coaching experience..." rows={4} />
          </FormField>
        </div>
      </div>
    </div>
  );
}
