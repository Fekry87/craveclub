import { useTranslation } from 'react-i18next';
import WizardProgressBar from './WizardProgressBar';
import { useRegistration } from '../../../contexts/RegistrationContext';

export default function WizardLayout({ currentStep, title, subtitle, onBack, children }) {
  const { t } = useTranslation();
  const { TOTAL_STEPS } = useRegistration();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #060d1f 0%, #0a1628 100%)',
      display: 'flex', justifyContent: 'center',
      padding: '40px 16px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#94a3b8', fontSize: 14, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 0', marginBottom: 16,
              fontFamily: "'DM Sans', sans-serif",
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {t('actions.back')}
          </button>
        )}

        {/* Progress bar */}
        <WizardProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        {/* Title + subtitle */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            margin: 0, fontSize: 26, fontWeight: 700,
            color: '#f1f5f9', fontFamily: "'Outfit', sans-serif",
            lineHeight: 1.2,
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              margin: '6px 0 0', fontSize: 14, color: '#94a3b8',
              fontWeight: 400, lineHeight: 1.4,
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Content */}
        <div style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(51,65,85,0.3)',
          borderRadius: 16, padding: 28,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
