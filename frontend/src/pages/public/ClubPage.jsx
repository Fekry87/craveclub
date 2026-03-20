import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

export default function ClubPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const [club, setClub] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get(`/clubs/${slug}`).then(r => setClub(r.data)).catch(() => setError(true));
  }, [slug]);

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <h1 style={{ color: '#ef4444' }}>Club not found</h1>
        <Link to="/login" style={{ color: '#0ea5e9' }}>Go to Login</Link>
      </div>
    </div>
  );

  if (!club) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#94a3b8' }}>{t('loading.default')}</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {club.logo_url && <img src={club.logo_url} alt={club.name} style={{ width: 80, height: 80, borderRadius: 16, marginBottom: 16 }} />}
          <h1 style={{ color: club.theme_color || '#0ea5e9', margin: 0, fontSize: 32 }}>{club.name}</h1>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 16, padding: 32, border: '1px solid #334155' }}>
          {club.about && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#94a3b8', fontSize: 14, textTransform: 'uppercase', marginBottom: 8 }}>About</h3>
              <p style={{ color: '#e2e8f0', lineHeight: 1.6, margin: 0 }}>{club.about}</p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {club.contact_email && (
              <div>
                <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>Email</div>
                <div style={{ color: '#e2e8f0' }}>{club.contact_email}</div>
              </div>
            )}
            {club.contact_phone && (
              <div>
                <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>Phone</div>
                <div style={{ color: '#e2e8f0' }}>{club.contact_phone}</div>
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to={`/portal/${slug}`} style={{
            display: 'inline-block', padding: '12px 32px', background: club.theme_color || '#0ea5e9',
            color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 16,
          }}>Login</Link>
        </div>
      </div>
    </div>
  );
}
