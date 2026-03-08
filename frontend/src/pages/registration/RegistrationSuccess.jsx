import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegistrationSuccess() {
  const navigate = useNavigate();

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

  // ── Summary pills ──────────────────────────────────────────────
  const pills = [branchName, coachName, planName].filter(Boolean);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #060d1f 0%, #0a1628 50%, #0d1f3c 100%)',
      padding: 24,
    }}>
      {/* ── Animations ───────────────────────────────────────────── */}
      <style>{`
        @keyframes checkIn {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.2); opacity: 1; }
          80%  { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        maxWidth: 480,
        width: '100%',
        background: 'rgba(6,13,31,0.8)',
        border: '1px solid rgba(51,65,85,0.3)',
        borderRadius: 16,
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 0 60px rgba(88,204,2,0.04)',
      }}>
        {/* ── Animated Checkmark ──────────────────────────────────── */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #58CC02 0%, #46A302 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 8px 24px rgba(88,204,2,0.3)',
          animation: 'checkIn 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* ── Heading ────────────────────────────────────────────── */}
        <h2 style={{
          fontSize: 26,
          fontWeight: 800,
          color: '#f1f5f9',
          margin: '0 0 8px',
          fontFamily: "'DM Sans', sans-serif",
          animation: 'fadeSlideUp 0.4s ease 0.2s both',
        }}>
          Registration Submitted!
        </h2>

        {/* ── Welcome line ───────────────────────────────────────── */}
        <p style={{
          color: '#94a3b8',
          fontSize: 16,
          margin: '0 0 20px',
          fontFamily: "'DM Sans', sans-serif",
          animation: 'fadeSlideUp 0.4s ease 0.3s both',
        }}>
          Welcome, <strong style={{ color: '#e2e8f0' }}>{swimmerName || 'Swimmer'}</strong>!
        </p>

        {/* ── Summary pills ──────────────────────────────────────── */}
        {pills.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 20,
            animation: 'fadeSlideUp 0.4s ease 0.4s both',
          }}>
            {pills.map((label, i) => (
              <span key={i} style={{
                background: 'rgba(51,65,85,0.3)',
                border: '1px solid rgba(51,65,85,0.5)',
                borderRadius: 999,
                padding: '4px 12px',
                fontSize: 13,
                color: '#94a3b8',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {label}
              </span>
            ))}
          </div>
        )}

        {/* ── Info box ───────────────────────────────────────────── */}
        <div style={{
          background: 'rgba(28,176,246,0.08)',
          border: '1px solid rgba(28,176,246,0.3)',
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 24,
          fontSize: 14,
          color: '#1CB0F6',
          lineHeight: 1.6,
          fontFamily: "'DM Sans', sans-serif",
          animation: 'fadeSlideUp 0.4s ease 0.5s both',
        }}>
          The swimmer will be contacted within 24 hours
          to confirm the session schedule and complete payment.
        </div>

        {/* ── Action buttons ─────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          animation: 'fadeSlideUp 0.4s ease 0.6s both',
        }}>
          {/* Primary — Register Another */}
          <button
            type="button"
            onClick={() => navigate('/club/registration')}
            style={{
              width: '100%', height: 48, borderRadius: 10,
              border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
              color: '#060d1f', fontSize: 15, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: '0 2px 8px rgba(45,212,191,0.15)',
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #0e9f8e 0%, #2dd4bf 100%)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(45,212,191,0.25)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(45,212,191,0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Register Another Swimmer
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>

          {/* Secondary — Dashboard */}
          <button
            type="button"
            onClick={() => navigate('/club')}
            style={{
              width: '100%', height: 48, borderRadius: 10,
              background: 'transparent',
              border: '2px solid rgba(51,65,85,0.5)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 15,
              color: '#94a3b8',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(51,65,85,0.8)';
              e.currentTarget.style.background = 'rgba(51,65,85,0.15)';
              e.currentTarget.style.color = '#e2e8f0';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(51,65,85,0.5)';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
