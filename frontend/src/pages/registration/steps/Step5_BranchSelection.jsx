import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WizardLayout from '../components/WizardLayout';
import { useRegistration } from '../../../contexts/RegistrationContext';
import api from '../../../api/axios';

export default function Step5_BranchSelection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          width: '100%', height: 92,
          marginBottom: 10, borderRadius: 14,
          background: '#F2F2F7',
          border: '1px solid #E5E5EA',
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
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
        stroke="#FF3B30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p style={{
        color: '#FF3B30', fontSize: 13,
        fontFamily: 'var(--font-body)', margin: 0,
      }}>
        {loadError}
      </p>
      <button type="button" onClick={fetchBranches} className="pl-btn pl-btn-secondary pl-btn-sm">
        Retry
      </button>
    </div>
  );

  // ── Empty state ─────────────────────────────────────────────────
  const renderEmpty = () => (
    <div style={{
      textAlign: 'center', padding: '40px 0',
      color: '#515154', fontSize: 14,
      fontFamily: 'var(--font-body)',
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
        stroke="#86868B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
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
      {branches.map((branch) => {
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
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', marginBottom: 10,
              borderRadius: 14,
              cursor: 'pointer',
              border: isSelected ? '2px solid #0071E3' : '1px solid #E5E5EA',
              background: isSelected ? 'rgba(0,113,227,0.06)' : '#FFFFFF',
              transition: 'border-color 0.15s ease, background 0.15s ease',
              position: 'relative',
            }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#D2D2D7'; }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#E5E5EA'; }}
          >
            {/* Photo or placeholder */}
            {hasPhoto
              ? <img
                  src={branch.photos[0]}
                  alt={branch.name}
                  style={{ borderRadius: 14, width: 64, height: 64, objectFit: 'cover', flexShrink: 0 }}
                />
              : <div style={{ borderRadius: 14,
                  width: 64, height: 64,
                  background: '#F2F2F7',
                  border: '1px solid #E5E5EA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="#86868B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
            }

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600,
                letterSpacing: '-0.01em', lineHeight: 1.2,
                color: '#1D1D1F',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {branch.name}
              </div>
              {branch.city && (
                <div style={{
                  fontSize: 13, color: '#515154', marginTop: 6,
                  fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', gap: 5,
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
                  fontSize: 12, fontWeight: 500, color: '#6E6E73', marginTop: 4,
                  display: 'flex', alignItems: 'center', gap: 5,
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

            {/* Selected marker */}
            {isSelected && (
              <span style={{
                width: 22, height: 22, borderRadius: '50%', background: '#0071E3', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
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
          color: '#FF3B30', fontSize: 13,
          textAlign: 'start', margin: '8px 0 0',
          fontFamily: 'var(--font-body)',
        }}>
          {errors.branch}
        </p>
      )}

      {/* ── Continue Button ──────────────────────────────────────── */}
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #F2F2F7' }}>
        <button
          type="button"
          onClick={handleContinue}
          disabled={branches === null}
          className="pl-btn pl-btn-primary"
          style={{ width: '100%', height: 46 }}
        >
          {t('actions.next')}
          <svg className="rtl-flip" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </WizardLayout>
  );
}
