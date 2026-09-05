import { useTranslation } from 'react-i18next';
import WizardProgressBar from './WizardProgressBar';
import { useRegistration } from '../../../contexts/RegistrationContext';
import { useAuth } from '../../../contexts/AuthContext';

export default function WizardLayout({ currentStep, title, subtitle, onBack, children }) {
  const { t } = useTranslation();
  const { TOTAL_STEPS } = useRegistration();
  const { user } = useAuth();

  const clubName = user?.club?.display_name || user?.club?.name || 'CraveClubs';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F5F7',
      color: '#1D1D1F',
      fontFamily: 'var(--font-body)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── Frosted top bar ──────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, height: 56, flexShrink: 0,
        padding: '0 clamp(16px, 4vw, 32px)',
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(246,246,248,0.86)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        backdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="pl-icon-btn"
              aria-label={t('actions.back')}
              style={{ flexShrink: 0 }}
            >
              <svg className="rtl-flip" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <span style={{ fontSize: 12, fontWeight: 500, color: '#6E6E73' }}>
            {t('registration.stepOf', {
              current: currentStep,
              total: TOTAL_STEPS,
              defaultValue: `Step ${currentStep} of ${TOTAL_STEPS}`,
            })}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0071E3', flexShrink: 0 }} />
          <span style={{
            fontSize: 14, fontWeight: 600, color: '#1D1D1F',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {clubName}
          </span>
        </div>
      </div>

      {/* ── Content column ───────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex', justifyContent: 'center',
        padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 32px) 56px',
      }}>
        <div style={{ width: '100%', maxWidth: 720 }}>
          {/* Progress */}
          <WizardProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

          {/* Title + subtitle */}
          <div style={{ marginBottom: 20, animation: 'fadeInUp 0.3s ease-out' }}>
            <h1 style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 28, fontWeight: 700,
              letterSpacing: '-0.02em', lineHeight: 1.15,
              color: '#1D1D1F',
            }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{
                margin: '8px 0 0', fontSize: 14, color: '#6E6E73',
                lineHeight: 1.5, maxWidth: 520,
              }}>
                {subtitle}
              </p>
            )}
          </div>

          {/* White content panel */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E5EA',
            borderRadius: 20,
            color: '#1D1D1F',
            padding: 28,
            boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05)',
            animation: 'fadeIn 0.25s ease-out',
          }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
