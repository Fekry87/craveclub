import { useTranslation } from 'react-i18next';
import WizardLayout from '../components/WizardLayout';

export default function Step4_ExperienceLevel() {
  const { t } = useTranslation();
  return (
    <WizardLayout currentStep={4} title="Experience Level" subtitle="How experienced are you?">
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', borderRadius: 980,
        background: 'rgba(255,149,0,0.12)', color: '#A35A00',
        fontSize: 12, fontWeight: 500, marginBottom: 12,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF9500' }} />
        {t('status.pending', { defaultValue: 'Pending' })}
      </div>
      <p style={{ color: '#515154', fontSize: 14, margin: 0, lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
        Step 4 — Experience Level (coming soon)
      </p>
    </WizardLayout>
  );
}
