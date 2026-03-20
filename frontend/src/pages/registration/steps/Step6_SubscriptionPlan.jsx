import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WizardLayout from '../components/WizardLayout';
import { useRegistration } from '../../../contexts/RegistrationContext';
import { getPlans } from '../../../api/registration';

export default function Step6_SubscriptionPlan() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state, dispatch } = useRegistration();

  // ── Local state ─────────────────────────────────────────────────
  const [plans, setPlans] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState(state.planId ?? null);
  const [errors, setErrors] = useState({});

  // ── Fetch plans on mount ────────────────────────────────────────
  const fetchPlans = async () => {
    setPlans(null);
    setLoadError(null);
    try {
      const data = await getPlans();
      const active = (Array.isArray(data) ? data : [])
        .filter(p => p.is_active !== false)
        .sort((a, b) => a.duration_months - b.duration_months);
      setPlans(active);
      // Pre-select monthly if nothing selected yet
      if (!state.planId) {
        const monthly = active.find(p => p.duration_months === 1);
        if (monthly) setSelected(monthly.id);
        else if (active.length > 0) setSelected(active[0].id);
      }
    } catch (err) {
      setLoadError(
        err.response?.data?.message ?? 'Failed to load plans.'
      );
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  // ── Validation ──────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!selected) errs.plan = 'Please select a plan';
    return errs;
  };

  // ── Submit ──────────────────────────────────────────────────────
  const handleContinue = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    dispatch({ type: 'SET_PLAN_ID', payload: selected });
    const selectedPlan = plans?.find(p => p.id === selected);
    if (selectedPlan) {
      dispatch({ type: 'SET_PLAN_NAME', payload: selectedPlan.name });
      dispatch({ type: 'SET_PLAN_PRICE', payload: selectedPlan.price });
    }
    dispatch({ type: 'SET_STEP', payload: 7 });
    navigate('/club/registration/coach');
  };

  // ── Shimmer skeleton ──────────────────────────────────────────
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
        onClick={fetchPlans}
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
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      No plans available yet.
    </div>
  );

  // ── Plan card ───────────────────────────────────────────────────
  const renderPlans = () => (
    <>
      {plans.map(plan => {
        const isSelected = selected === plan.id;
        return (
          <div
            key={plan.id}
            style={{ position: 'relative', marginBottom: 10 }}
          >
            {/* Most Popular Banner */}
            {plan.is_popular && (
              <div style={{
                background: '#FFC800',
                borderRadius: '10px 10px 0 0',
                padding: '4px 0',
                textAlign: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: '#1A202C',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Most Popular
              </div>
            )}
            {/* Card */}
            <div
              onClick={() => {
                setSelected(plan.id);
                if (errors.plan) setErrors({});
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: plan.is_popular
                  ? '0 0 10px 10px'
                  : '10px',
                border: isSelected
                  ? '2px solid #58CC02'
                  : '2px solid rgba(51,65,85,0.3)',
                background: isSelected
                  ? 'rgba(88,204,2,0.1)'
                  : 'rgba(6,13,31,0.6)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(88,204,2,0.4)';
                  e.currentTarget.style.background = 'rgba(88,204,2,0.05)';
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(51,65,85,0.3)';
                  e.currentTarget.style.background = 'rgba(6,13,31,0.6)';
                }
              }}
            >
              {/* Left */}
              <div>
                <div style={{
                  fontWeight: 700,
                  color: isSelected ? '#58CC02' : '#e2e8f0',
                  fontSize: 16,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {plan.name}
                </div>
                <div style={{
                  fontSize: 13, color: '#94a3b8', marginTop: 2,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {plan.duration_months} Month{plan.duration_months > 1 ? 's' : ''}
                </div>
              </div>
              {/* Right */}
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: isSelected ? '#58CC02' : '#e2e8f0',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {Number(plan.price).toLocaleString()} EGP
                </div>
                {plan.duration_months > 1 && (
                  <div style={{
                    fontSize: 12, color: '#94a3b8',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    = {Math.round(plan.price / plan.duration_months)} EGP/mo
                  </div>
                )}
              </div>
              {/* Discount Badge */}
              {plan.discount_percent > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: '#58CC02',
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  Save {plan.discount_percent}%
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );

  // ── Selected plan price ─────────────────────────────────────────
  const selectedPlanPrice = plans?.find(p => p.id === selected)?.price ?? 0;

  return (
    <WizardLayout
      currentStep={6}
      title="Choose Your Plan"
      subtitle="You can upgrade anytime"
      onBack={() => navigate('/club/registration/branch')}
    >
      {/* ── Content ──────────────────────────────────────────────── */}
      {plans === null && !loadError && renderLoading()}
      {loadError && renderError()}
      {plans !== null && plans.length === 0 && renderEmpty()}
      {plans !== null && plans.length > 0 && renderPlans()}

      {/* ── Price Summary Box ────────────────────────────────────── */}
      {selected && plans && (
        <div style={{
          background: 'rgba(28,176,246,0.08)',
          border: '1px solid rgba(28,176,246,0.3)',
          borderRadius: 10,
          padding: '14px 16px',
          marginTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            color: '#94a3b8', fontSize: 14,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Total Amount
          </span>
          <span style={{
            color: '#1CB0F6', fontSize: 20, fontWeight: 800,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {Number(selectedPlanPrice).toLocaleString()} EGP
          </span>
        </div>
      )}
      <p style={{
        textAlign: 'center', fontSize: 12,
        color: '#64748b', marginTop: 6, margin: '6px 0 0',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        Billed as a single payment
      </p>

      {/* ── Error ────────────────────────────────────────────────── */}
      {errors.plan && (
        <p style={{
          color: '#f87171', fontSize: 13,
          textAlign: 'center', margin: '8px 0 0',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {errors.plan}
        </p>
      )}

      {/* ── Continue Button ──────────────────────────────────────── */}
      <div style={{ marginTop: 24 }}>
        <button
          type="button"
          onClick={handleContinue}
          disabled={plans === null}
          style={{
            width: '100%', height: 48, borderRadius: 10,
            border: 'none', cursor: plans === null ? 'not-allowed' : 'pointer',
            background: plans === null
              ? 'rgba(51,65,85,0.3)'
              : 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
            color: plans === null ? '#64748b' : '#060d1f',
            fontSize: 15, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: plans === null ? 'none' : '0 2px 8px rgba(45,212,191,0.15)',
            transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: plans === null ? 0.5 : 1,
          }}
          onMouseEnter={e => {
            if (plans !== null) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #0e9f8e 0%, #2dd4bf 100%)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(45,212,191,0.25)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={e => {
            if (plans !== null) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(45,212,191,0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {t('actions.next')}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </WizardLayout>
  );
}
