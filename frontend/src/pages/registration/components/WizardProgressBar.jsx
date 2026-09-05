export default function WizardProgressBar({ currentStep, totalSteps }) {
  const pct = Math.round((currentStep / totalSteps) * 100);

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Step indicator */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#6E6E73' }}>
          {`${currentStep} / ${totalSteps}`}
        </span>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#0071E3' }}>
          {`${pct}%`}
        </span>
      </div>

      {/* Track */}
      <div style={{ height: 6, borderRadius: 3, background: '#E5E5EA', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          borderRadius: 3,
          background: '#0071E3',
          transition: 'width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }} />
      </div>
    </div>
  );
}
