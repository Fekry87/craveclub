import { useTranslation } from 'react-i18next';

export default function WizardProgressBar({ currentStep, totalSteps }) {
  const { t } = useTranslation();
  const pct = Math.round((currentStep / totalSteps) * 100);

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Step indicator */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 10,
      }}>
        <span style={{
          fontSize: 12, fontWeight: 600, color: '#94a3b8',
          letterSpacing: '0.04em', fontFamily: "'DM Sans', sans-serif",
        }}>
          {`Step ${currentStep} of ${totalSteps}`}
        </span>
        <span style={{
          fontSize: 12, fontWeight: 600, color: '#22d3ee',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {pct}%
        </span>
      </div>

      {/* Track */}
      <div style={{
        height: 6, borderRadius: 3,
        background: 'rgba(51,65,85,0.4)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 3,
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #22d3ee 0%, #2dd4bf 100%)',
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
    </div>
  );
}
