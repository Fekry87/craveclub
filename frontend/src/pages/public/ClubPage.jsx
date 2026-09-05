import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

const labelStyle = {
  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, color: '#6E6E73',
};

function ContactRow({ icon, label, value, last }) {
  if (!value) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 0', borderBottom: last ? 'none' : '1px solid #F2F2F7',
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, borderRadius: 10,
        background: 'rgba(0,113,227,0.1)', color: '#0071E3', flexShrink: 0,
      }}>{icon}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={labelStyle}>{label}</div>
        <div style={{ color: '#1D1D1F', fontSize: 15, marginTop: 2, wordBreak: 'break-word' }}>{value}</div>
      </div>
    </div>
  );
}

export default function ClubPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const [club, setClub] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get(`/clubs/${slug}`).then(r => setClub(r.data)).catch(() => setError(true));
  }, [slug]);

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F7', padding: '24px 20px' }}>
      <div style={{
        textAlign: 'center', background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 16,
        padding: '40px 32px', maxWidth: 380, width: '100%',
        animation: 'fadeInUp 0.35s ease-out',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px',
          background: '#F2F2F7', color: '#86868B',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
          </svg>
        </div>
        <h1 style={{
          color: '#1D1D1F', margin: '0 0 8px', fontSize: 24, fontWeight: 700,
          fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.15,
        }}>Club not found</h1>
        <p style={{ color: '#6E6E73', fontSize: 14, margin: '0 0 20px' }}>
          The club you are looking for is not available.
        </p>
        <Link to="/login" className="pl-btn pl-btn-primary">Go to sign in</Link>
      </div>
    </div>
  );

  if (!club) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F7', ...labelStyle }}>
      {t('loading.default')}
    </div>
  );

  const initials = club.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'C';

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7' }}>
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '56px 20px 64px', animation: 'fadeIn 0.3s ease-out' }}>
        {/* Club mark + name */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {club.logo_url ? (
            <img src={club.logo_url} alt={club.name}
              style={{
                width: 88, height: 88, borderRadius: '50%', objectFit: 'cover',
                border: '1px solid #E5E5EA', background: '#FFFFFF', marginBottom: 18,
              }}
            />
          ) : (
            <div style={{
              width: 88, height: 88, borderRadius: '50%', margin: '0 auto 18px',
              background: '#FFFFFF', border: '1px solid #E5E5EA',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700,
              color: '#0071E3', letterSpacing: '-0.02em',
            }}>{initials}</div>
          )}
          <h1 style={{
            color: '#1D1D1F', margin: 0, fontSize: 32, fontWeight: 700,
            fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.1,
          }}>{club.name}</h1>
          {club.slug && (
            <p style={{ color: '#86868B', fontSize: 14, margin: '8px 0 0' }}>{club.slug}</p>
          )}
        </div>

        {/* About + contact card */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 16,
          padding: '26px 28px', animation: 'fadeInUp 0.35s ease-out',
        }}>
          {club.about && (
            <div style={{ marginBottom: (club.contact_email || club.contact_phone) ? 22 : 0 }}>
              <div style={{
                color: '#1D1D1F', fontSize: 17, fontWeight: 600,
                fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', marginBottom: 8,
              }}>About</div>
              <p style={{ color: '#515154', fontSize: 15, lineHeight: 1.6, margin: 0, fontFamily: 'var(--font-body)' }}>{club.about}</p>
            </div>
          )}

          {(club.contact_email || club.contact_phone) && (
            <div style={{ borderTop: club.about ? '1px solid #F2F2F7' : 'none', paddingTop: club.about ? 6 : 0 }}>
              <ContactRow
                label="Email"
                value={club.contact_email}
                last={!club.contact_phone}
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>}
              />
              <ContactRow
                label="Phone"
                value={club.contact_phone}
                last
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>}
              />
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 26 }}>
          <Link to={`/portal/${slug}`} className="pl-btn pl-btn-primary">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
