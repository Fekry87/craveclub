import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WizardLayout from '../components/WizardLayout';
import { useRegistration, clearRegistrationDraft } from '../../../contexts/RegistrationContext';
import { submitRegistration } from '../../../api/registration';

// ── Age calculator ─────────────────────────────────────────────
const calculateAge = (birthDate) => {
  if (!birthDate) return 0;
  return Math.floor(
    (Date.now() - new Date(birthDate).getTime())
    / (365.25 * 24 * 60 * 60 * 1000)
  );
};

// ── Reusable summary section ───────────────────────────────────
const SummarySection = ({ title, emoji, rows }) => (
  <div style={{
    borderTop: '1px solid #F2F2F7',
    padding: '14px 0',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 12, fontWeight: 500,
      color: '#6E6E73', marginBottom: 10,
    }}>
      <span style={{
        width: 24, height: 24, borderRadius: 8,
        background: '#F2F2F7',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13,
      }}>{emoji}</span>
      {title}
    </div>
    {rows.map((row, i) => row.value ? (
      <div key={i} style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: i < rows.length - 1 ? 8 : 0,
        gap: 12,
      }}>
        <span style={{
          fontSize: 12, fontWeight: 500,
          color: '#86868B', flexShrink: 0,
        }}>
          {row.label}
        </span>
        <span style={{
          fontSize: 14, color: '#1D1D1F',
          fontWeight: 500, textAlign: 'end',
          fontFamily: 'var(--font-body)',
        }}>
          {row.value}
        </span>
      </div>
    ) : null)}
  </div>
);

export default function Step8_ReviewPayment() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state, dispatch } = useRegistration();
  const {
    basicProfile, physicalInfo, sportIds,
    experience, branchId, branchName,
    planId, planName, planPrice,
    coachId, coachName, preferredTime,
  } = state;

  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [consent, setConsent] = useState(false);
  const currency = t('common.currency', { defaultValue: 'SAR' });

  // ── Submit handler ──────────────────────────────────────────────
  const handleSubmit = async () => {
    // Guard: check all required fields
    if (
      !basicProfile?.fullName ||
      !basicProfile?.phone ||
      !basicProfile?.gender ||
      !basicProfile?.birthDate ||
      !branchId || !planId ||
      !coachId || !preferredTime
    ) {
      setSubmitError(
        'Some required information is missing. '
        + 'Please go back and complete all steps.'
      );
      return;
    }

    // PDPL: an explicit data-processing consent must be recorded with the registration
    if (!consent) {
      setSubmitError(t('registration.consentRequired', {
        defaultValue: 'Consent is required to submit the registration.',
      }));
      return;
    }

    setSaving(true);
    setSubmitError(null);

    try {
      const payload = {
        full_name:        basicProfile.fullName,
        phone:            basicProfile.phone,
        gender:           basicProfile.gender,
        birth_date:       basicProfile.birthDate,
        avatar_url:       basicProfile.avatarUrl ?? null,
        height_cm:        physicalInfo?.heightCm ?? null,
        weight_kg:        physicalInfo?.weightKg ?? null,
        fitness_level:    physicalInfo?.fitnessLevel ?? '',
        prior_experience: physicalInfo?.priorExperience ?? false,
        medical_notes:    physicalInfo?.medicalNotes || null,
        sport_ids:        sportIds ?? [],
        experience_level: experience?.level ?? '',
        years_experience: experience?.yearsExperience ?? '',
        competed:         experience?.competed ?? false,
        primary_goal:     experience?.primaryGoal ?? '',
        weekly_frequency: experience?.weeklyFrequency ?? '',
        branch_id:        branchId,
        plan_id:          planId,
        coach_id:         coachId,
        preferred_time:   preferredTime,
        payment_method:   'cash',
        consent_given:    true,
      };

      await submitRegistration(payload);

      // Save success data for the success page
      sessionStorage.setItem('registration_success',
        JSON.stringify({
          swimmerName: basicProfile.fullName,
          branchName:  branchName ?? '',
          coachName:   coachName ?? '',
          planName:    planName ?? '',
        })
      );

      // Clear draft from sessionStorage
      clearRegistrationDraft();

      // Reset context
      dispatch({ type: 'RESET' });

      // Navigate to success page
      navigate('/club/registration/success');
    } catch (err) {
      if (err?.response?.status === 422) {
        const errors = err.response?.data?.errors;
        if (errors) {
          const messages = Object.values(errors).map(arr => arr[0]);
          setSubmitError(messages[0] ?? 'Validation failed.');
        } else {
          setSubmitError(
            err.response?.data?.message ?? 'Validation failed.'
          );
        }
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Capitalize helper ───────────────────────────────────────────
  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <WizardLayout
      currentStep={8}
      title="Review & Confirm"
      subtitle="Check your details before submitting"
      onBack={() => navigate('/club/registration/coach')}
    >
      {/* ── Summary Sections ─────────────────────────────────────── */}
      <SummarySection
        title="Personal Info" emoji={'\u{1F464}'}
        rows={[
          { label: 'Name',   value: basicProfile?.fullName },
          { label: 'Phone',  value: basicProfile?.phone },
          { label: 'Gender', value: capitalize(basicProfile?.gender) },
          { label: 'Age',    value: basicProfile?.birthDate
            ? calculateAge(basicProfile.birthDate) + ' years'
            : null },
        ]}
      />

      <SummarySection
        title="Physical Info" emoji={'\u{1F4AA}'}
        rows={[
          { label: 'Height', value: physicalInfo?.heightCm
            ? physicalInfo.heightCm + ' cm' : null },
          { label: 'Weight', value: physicalInfo?.weightKg
            ? physicalInfo.weightKg + ' kg' : null },
          { label: 'Fitness Level', value: capitalize(physicalInfo?.fitnessLevel) },
          { label: 'Prior Experience', value: physicalInfo?.priorExperience === true
            ? 'Yes' : physicalInfo?.priorExperience === false ? 'No' : null },
        ]}
      />

      <SummarySection
        title="Sport & Level" emoji={'\u{1F3CA}'}
        rows={[
          { label: 'Sports', value: sportIds?.length > 0
            ? sportIds.map(capitalize).join(', ') : null },
          { label: 'Level', value: capitalize(experience?.level) },
          { label: 'Goal', value: experience?.primaryGoal },
          { label: 'Frequency', value: experience?.weeklyFrequency },
        ]}
      />

      <SummarySection
        title="Branch" emoji={'\u{1F4CD}'}
        rows={[
          { label: 'Branch', value: branchName ?? `#${branchId}` },
        ]}
      />

      <SummarySection
        title="Subscription" emoji={'\u{1F4C5}'}
        rows={[
          { label: 'Plan', value: planName ?? `#${planId}` },
          { label: 'Price', value: planPrice
            ? Number(planPrice).toLocaleString() + ' ' + currency : null },
        ]}
      />

      <SummarySection
        title="Coach" emoji={'\u{1F3C5}'}
        rows={[
          { label: 'Coach', value: coachName ?? `#${coachId}` },
          { label: 'Preferred Time', value: preferredTime },
        ]}
      />

      {/* ── Payment Method Badge ─────────────────────────────────── */}
      <div style={{
        borderRadius: 14,
        background: '#F2F2F7',
        padding: '12px 16px',
        marginTop: 6,
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: 10,
          background: '#FFFFFF',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15,
        }}>{'\u{1F4B5}'}</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#1D1D1F' }}>
          Cash on Arrival
        </span>
      </div>

      {/* ── Total Price Box ──────────────────────────────────────── */}
      <div style={{
        borderRadius: 14,
        background: 'rgba(0,113,227,0.06)',
        border: '1px solid rgba(0,113,227,0.22)',
        padding: '16px',
        marginBottom: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#515154' }}>
          Total Amount
        </span>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700,
          letterSpacing: '-0.02em', lineHeight: 1.1,
          color: '#0071E3',
        }}>
          {planPrice
            ? Number(planPrice).toLocaleString() + ' ' + currency
            : '\u2014'
          }
        </span>
      </div>

      {/* ── Data-processing consent (PDPL) ───────────────────────── */}
      <label style={{
        display: 'flex', gap: 10, alignItems: 'flex-start',
        marginBottom: 8, cursor: 'pointer',
      }}>
        <input
          type="checkbox"
          checked={consent}
          onChange={e => {
            setConsent(e.target.checked);
            if (e.target.checked) setSubmitError(null);
          }}
          style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, accentColor: '#0071E3' }}
        />
        <span style={{
          fontSize: 13, color: '#515154', lineHeight: 1.5,
          fontFamily: 'var(--font-body)',
        }}>
          {t('registration.consentLabel', {
            defaultValue: "The swimmer's guardian (or the swimmer, if an adult) has consented to CraveClubs and the club processing this personal data to manage membership and training.",
          })}
        </span>
      </label>
      <p style={{
        fontSize: 12, color: '#6E6E73', lineHeight: 1.5,
        margin: '0 0 16px', fontFamily: 'var(--font-body)',
      }}>
        {t('registration.privacyNotice', {
          defaultValue: 'Personal data is stored securely on servers outside Saudi Arabia and is used only to run the club. Data can be deleted on request within 30 days.',
        })}
      </p>

      {/* ── Error Box ────────────────────────────────────────────── */}
      {submitError && (
        <div style={{
          background: 'rgba(255,59,48,0.08)',
          border: '1px solid rgba(255,59,48,0.24)',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 14,
          color: '#B12A20',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: 'var(--font-body)',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF3B30', flexShrink: 0 }} />
          {submitError}
        </div>
      )}

      {/* ── Submit Button ────────────────────────────────────────── */}
      <div style={{ marginTop: 8 }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="pl-btn pl-btn-primary"
          style={{ width: '100%', height: 46 }}
        >
          {saving ? t('loading.saving') : t('actions.confirm')}
          {!saving && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      </div>
    </WizardLayout>
  );
}
