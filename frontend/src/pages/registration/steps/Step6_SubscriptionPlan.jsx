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
      <button type="button" onClick={fetchPlans} className="pl-btn pl-btn-secondary pl-btn-sm">
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
      {plans.map((plan) => {
        const isSelected = selected === plan.id;
        const popular = !!plan.is_popular;
        return (
          <div key={plan.id} style={{ position: 'relative', marginBottom: 10 }}>
            <div
              onClick={() => {
                setSelected(plan.id);
                if (errors.plan) setErrors({});
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '16px',
                borderRadius: 14,
                border: isSelected || popular ? '2px solid #0071E3' : '1px solid #E5E5EA',
                background: isSelected ? 'rgba(0,113,227,0.06)' : '#FFFFFF',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, background 0.15s ease',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isSelected && !popular) e.currentTarget.style.borderColor = '#D2D2D7';
              }}
              onMouseLeave={e => {
                if (!isSelected && !popular) e.currentTarget.style.borderColor = '#E5E5EA';
              }}
            >
              {/* Left */}
              <div style={{ minWidth: 0 }}>
                {popular && (
                  <span style={{
                    display: 'inline-block',
                    background: '#0071E3', color: '#1D1D1F',
                    borderRadius: 980, padding: '3px 10px',
                    fontSize: 11, fontWeight: 600,
                    marginBottom: 8,
                  }}>
                    Most popular
                  </span>
                )}
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600,
                  letterSpacing: '-0.01em', lineHeight: 1.2,
                  color: '#1D1D1F',
                }}>
                  {plan.name}
                </div>
                <div style={{ fontSize: 13, color: '#6E6E73', marginTop: 4 }}>
                  {plan.duration_months} Month{plan.duration_months > 1 ? 's' : ''}
                  {plan.discount_percent > 0 && (
                    <span style={{
                      marginInlineStart: 8,
                      display: 'inline-block',
                      background: 'rgba(52,199,89,0.14)', color: '#1E7A3B',
                      borderRadius: 980, padding: '2px 8px',
                      fontSize: 11, fontWeight: 600,
                    }}>
                      Save {plan.discount_percent}%
                    </span>
                  )}
                </div>
              </div>
              {/* Right */}
              <div style={{ textAlign: 'end', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
                    letterSpacing: '-0.02em', lineHeight: 1.1,
                    color: '#1D1D1F',
                  }}>
                    {Number(plan.price).toLocaleString()} {t('common.currency', { defaultValue: 'SAR' })}
                  </div>
                  {plan.duration_months > 1 && (
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#6E6E73', marginTop: 4 }}>
                      = {Math.round(plan.price / plan.duration_months)} {t('common.currency', { defaultValue: 'SAR' })}{t('subscriptions.perMonthShort', { defaultValue: '/mo' })}
                    </div>
                  )}
                </div>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: isSelected ? '#0071E3' : 'transparent',
                  border: isSelected ? 'none' : '1px solid #D2D2D7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isSelected && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </span>
              </div>
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
          borderRadius: 14,
          background: '#F2F2F7',
          border: '1px solid #E5E5EA',
          padding: '14px 16px',
          marginTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontSize: 12, fontWeight: 500, color: '#6E6E73',
          }}>
            Total Amount
          </span>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
            letterSpacing: '-0.02em', lineHeight: 1.1,
            color: '#1D1D1F',
          }}>
            {Number(selectedPlanPrice).toLocaleString()} {t('common.currency', { defaultValue: 'SAR' })}
          </span>
        </div>
      )}
      <p style={{
        fontSize: 12, fontWeight: 500,
        color: '#86868B', textAlign: 'start', margin: '8px 0 0',
      }}>
        Billed as a single payment
      </p>

      {/* ── Error ────────────────────────────────────────────────── */}
      {errors.plan && (
        <p style={{
          color: '#FF3B30', fontSize: 13,
          textAlign: 'start', margin: '8px 0 0',
          fontFamily: 'var(--font-body)',
        }}>
          {errors.plan}
        </p>
      )}

      {/* ── Continue Button ──────────────────────────────────────── */}
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #F2F2F7' }}>
        <button
          type="button"
          onClick={handleContinue}
          disabled={plans === null}
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
