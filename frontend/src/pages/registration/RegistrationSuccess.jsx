import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function RegistrationSuccess() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // ── Local state ─────────────────────────────────────────────────
  const [swimmerName, setSwimmerName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [coachName, setCoachName] = useState('');
  const [planName, setPlanName] = useState('');

  // ── Guard: prevent direct access ────────────────────────────────
  useEffect(() => {
    const flag = sessionStorage.getItem('registration_success');
    if (!flag) {
      navigate('/club/registration');
    } else {
      try {
        const data = JSON.parse(flag);
        setSwimmerName(data.swimmerName ?? '');
        setBranchName(data.branchName ?? '');
        setCoachName(data.coachName ?? '');
        setPlanName(data.planName ?? '');
      } catch {
        // ignore parse errors
      }
      // Clear flag so refresh redirects to start
      sessionStorage.removeItem('registration_success');
    }
  }, []);

  // ── Summary rows ───────────────────────────────────────────────
  const rows = [
    { label: 'Branch', value: branchName },
    { label: 'Coach', value: coachName },
    { label: 'Plan', value: planName },
  ].filter(r => r.value);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F5F5F7',
      color: '#1D1D1F',
      padding: 'clamp(20px, 5vw, 48px)',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{
        maxWidth: 480,
        width: '100%',
        textAlign: 'center',
        animation: 'fadeInUp 0.35s ease-out',
      }}>
        {/* ── Check mark ──────────────────────────────────────────── */}
        <div style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          background: 'rgba(52,199,89,0.14)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none"
            stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* ── Heading ─────────────────────────────────────────────── */}
        <h1 style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 28, fontWeight: 700,
          letterSpacing: '-0.02em', lineHeight: 1.15,
          color: '#1D1D1F',
        }}>
          Registration submitted
        </h1>

        {/* ── Welcome line ───────────────────────────────────────── */}
        <p style={{
          color: '#6E6E73',
          fontSize: 14,
          lineHeight: 1.6,
          margin: '10px auto 0',
          maxWidth: 400,
        }}>
          Welcome, <strong style={{ color: '#1D1D1F', fontWeight: 600 }}>{swimmerName || 'Swimmer'}</strong>.
          The swimmer will be contacted within 24 hours to confirm the session
          schedule and complete payment.
        </p>

        {/* ── Summary card ───────────────────────────────────────── */}
        {rows.length > 0 && (
          <div style={{
            marginTop: 24,
            background: '#FFFFFF',
            border: '1px solid #E5E5EA',
            borderRadius: 16,
            padding: '4px 16px',
            textAlign: 'start',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05)',
          }}>
            {rows.map((row, i) => (
              <div key={row.label} style={{
                display: 'flex', alignItems: 'baseline',
                justifyContent: 'space-between', gap: 12,
                padding: '13px 0',
                borderBottom: i < rows.length - 1 ? '1px solid #F2F2F7' : 'none',
              }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#86868B' }}>
                  {row.label}
                </span>
                <span style={{
                  fontSize: 14, fontWeight: 500, color: '#1D1D1F',
                  textAlign: 'end',
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Action buttons ─────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: 24,
        }}>
          <button
            type="button"
            onClick={() => navigate('/club/registration')}
            className="pl-btn pl-btn-primary"
            style={{ flex: '1 1 220px', height: 46 }}
          >
            Register another swimmer
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => navigate('/club')}
            className="pl-btn pl-btn-secondary"
            style={{ flex: '1 1 180px', height: 46 }}
          >
            {t('actions.goToDashboard')}
          </button>
        </div>
      </div>
    </div>
  );
}
