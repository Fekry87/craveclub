import { useTranslation } from 'react-i18next';
import WizardLayout from '../components/WizardLayout';

export default function Step4_ExperienceLevel() {
  const { t } = useTranslation();
  return (
    <WizardLayout currentStep={4} title="Experience Level" subtitle="How experienced are you?">
      <p style={{ color: '#94a3b8', fontSize: 14 }}>Step 4 — Experience Level (coming soon)</p>
    </WizardLayout>
  );
}
