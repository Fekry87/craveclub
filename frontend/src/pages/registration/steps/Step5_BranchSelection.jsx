import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardLayout from '../components/WizardLayout';
import { useRegistration } from '../../../contexts/RegistrationContext';
import api from '../../../api/axios';

export default function Step5_BranchSelection() {
  const navigate = useNavigate();
  const { state, dispatch } = useRegistration();

  // ── Local state ─────────────────────────────────────────────────
  const [branches, setBranches] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState(state.branchId ?? null);
  const [errors, setErrors] = useState({});

  // ── Fetch branches on mount ─────────────────────────────────────
  const fetchBranches = async () => {
    setBranches(null);
    setLoadError(null);
    try {
      const res = await api.get('/club/branches');
      const data = res.data?.data ?? res.data ?? [];
      setBranches(data.filter(b => b.is_active !== false));
    } catch (err) {
      setLoadError(
        err.response?.data?.message ?? 'Failed to load branches.'
      );
    }
  };

  useEffect(() => { fetchBranches(); }, []);

  // ── Validation ──────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!selected) errs.branch = 'Please select a branch';
    return errs;
  };

  // ── Submit ──────────────────────────────────────────────────────
  const handleContinue = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    dispatch({ type: 'SET_BRANCH_ID', payload: selected });
    const selectedBranch = branches.find(b => b.id === selected);
    if (selectedBranch) {
      dispatch({ type: 'SET_BRANCH_NAME', payload: selectedBranch.name });
    }
    dispatch({ type: 'SET_STEP', payload: 6 });
    navigate('/club/registration/plan');
  };

  // ── Shimmer skeleton ────────────────────────────────────────────
  const renderLoading = () => (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          width: '100%', height: 88,
          borderRadius: 10, marginBottom: 10,
          background: 'linear-gradient(90deg, rgba(51,65,85,0.15) 25%, rgba(51,65,85,0.25) 50%, rgba(51,65,85,0.15) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
        }} />
      ))}
    </>
  );

  // ── Error state ─────────────────────────────────────────────────
  const renderError = () => (
    <div style={{
      textAlign: 'center', padding: '40px 0',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
        stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p style={{
        color: '#f87171', fontSize: 14,
        fontFamily: "'DM Sans', sans-serif", margin: 0,
      }}>
        {loadError}
      </p>
      <button
        type="button"
        onClick={fetchBranches}
        style={{
          padding: '8px 24px', borderRadius: 8,
          border: '1px solid rgba(51,65,85,0.5)',
          background: 'rgba(51,65,85,0.3)',
          color: '#e2e8f0', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.3)'; }}
      >
        Retry
      </button>
    </div>
  );

  // ── Empty state ─────────────────────────────────────────────────
  const renderEmpty = () => (
    <div style={{
      textAlign: 'center', padding: '40px 0',
      color: '#94a3b8', fontSize: 14,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
        stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ display: 'block', margin: '0 auto 12px' }}>
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
      No branches available yet.
    </div>
  );

  // ── Branch card ─────────────────────────────────────────────────
  const renderBranches = () => (
    <>
      {branches.map(branch => {
        const isSelected = selected === branch.id;
        const hasPhoto = branch.photos && branch.photos.length > 0;
        return (
          <div
            key={branch.id}
            onClick={() => {
              setSelected(branch.id);
              if (errors.branch) setErrors({});
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', marginBottom: 10,
              borderRadius: 10, cursor: 'pointer',
              border: isSelected
                ? '2px solid #1CB0F6'
                : '2px solid rgba(51,65,85,0.3)',
              background: isSelected
                ? 'rgba(28,176,246,0.1)'
                : 'rgba(6,13,31,0.6)',
              transition: 'all 150ms ease',
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = 'rgba(28,176,246,0.4)';
                e.currentTarget.style.background = 'rgba(28,176,246,0.05)';
              }
            }}
            onMouseLeave={e => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = 'rgba(51,65,85,0.3)';
                e.currentTarget.style.background = 'rgba(6,13,31,0.6)';
              }
            }}
          >
            {/* Photo or placeholder */}
            {hasPhoto
              ? <img
                  src={branch.photos[0]}
                  alt={branch.name}
                  style={{
                    width: 64, height: 64,
                    borderRadius: 8, objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
              : <div style={{
                  width: 64, height: 64,
                  borderRadius: 8,
                  background: 'rgba(51,65,85,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
            }

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 600, fontSize: 15,
                color: isSelected ? '#1CB0F6' : '#e2e8f0',
                fontFamily: "'DM Sans', sans-serif",
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {branch.name}
              </div>
              {branch.city && (
                <div style={{
                  fontSize: 13, color: '#94a3b8', marginTop: 2,
                  fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {branch.city}
                </div>
              )}
              {branch.working_hours && (
                <div style={{
                  fontSize: 12, color: '#64748b', marginTop: 2,
                  fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {branch.working_hours}
                </div>
              )}
            </div>

            {/* Checkmark */}
            {isSelected && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1CB0F6">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            )}
          </div>
        );
      })}
    </>
  );

  return (
    <WizardLayout
      currentStep={5}
      title="Choose a Branch"
      subtitle="Select the location you'll be training at"
      onBack={() => navigate('/club/registration/experience')}
    >
      {/* ── Content ──────────────────────────────────────────────── */}
      {branches === null && !loadError && renderLoading()}
      {loadError && renderError()}
      {branches !== null && branches.length === 0 && renderEmpty()}
      {branches !== null && branches.length > 0 && renderBranches()}

      {/* ── Error ────────────────────────────────────────────────── */}
      {errors.branch && (
        <p style={{
          color: '#f87171', fontSize: 13,
          textAlign: 'center', margin: '8px 0 0',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {errors.branch}
        </p>
      )}

      {/* ── Continue Button ──────────────────────────────────────── */}
      <div style={{ marginTop: 24 }}>
        <button
          type="button"
          onClick={handleContinue}
          disabled={branches === null}
          style={{
            width: '100%', height: 48, borderRadius: 10,
            border: 'none', cursor: branches === null ? 'not-allowed' : 'pointer',
            background: branches === null
              ? 'rgba(51,65,85,0.3)'
              : 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
            color: branches === null ? '#64748b' : '#060d1f',
            fontSize: 15, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: branches === null ? 'none' : '0 2px 8px rgba(45,212,191,0.15)',
            transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: branches === null ? 0.5 : 1,
          }}
          onMouseEnter={e => {
            if (branches !== null) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #0e9f8e 0%, #2dd4bf 100%)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(45,212,191,0.25)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={e => {
            if (branches !== null) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(45,212,191,0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          Continue
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </WizardLayout>
  );
}
