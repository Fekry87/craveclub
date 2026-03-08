import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    background: 'rgba(6,13,31,0.6)',
    border: '1px solid rgba(51,65,85,0.3)',
    borderRadius: 10,
    padding: '14px 16px',
    marginBottom: 10,
  }}>
    <div style={{
      fontWeight: 700,
      fontSize: 14,
      marginBottom: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      color: '#e2e8f0',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <span>{emoji}</span>
      {title}
    </div>
    {rows.map((row, i) => row.value ? (
      <div key={i} style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: i < rows.length - 1 ? 6 : 0,
        gap: 12,
      }}>
        <span style={{
          fontSize: 13, color: '#94a3b8',
          flexShrink: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {row.label}
        </span>
        <span style={{
          fontSize: 13, color: '#e2e8f0',
          fontWeight: 500, textAlign: 'right',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {row.value}
        </span>
      </div>
    ) : null)}
  </div>
);

export default function Step8_ReviewPayment() {
  const navigate = useNavigate();
  const { state, dispatch } = useRegistration();
  const {
    basicProfile, physicalInfo, sportIds,
    experience, branchId, branchName,
    planId, planName, planPrice,
    coachId, coachName, preferredTime,
  } = state;

  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

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
            ? Number(planPrice).toLocaleString() + ' EGP' : null },
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
        background: 'rgba(255,200,0,0.08)',
        border: '1px solid rgba(255,200,0,0.3)',
        borderRadius: 10,
        padding: '12px 16px',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 20 }}>{'\u{1F4B5}'}</span>
        <span style={{
          fontWeight: 700,
          color: '#FFC800',
          fontSize: 15,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Cash on Arrival
        </span>
      </div>

      {/* ── Total Price Box ──────────────────────────────────────── */}
      <div style={{
        background: 'rgba(28,176,246,0.08)',
        border: '1px solid rgba(28,176,246,0.3)',
        borderRadius: 10,
        padding: '14px 16px',
        marginBottom: 16,
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
          color: '#1CB0F6',
          fontSize: 22,
          fontWeight: 800,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {planPrice
            ? Number(planPrice).toLocaleString() + ' EGP'
            : '\u2014'
          }
        </span>
      </div>

      {/* ── Error Box ────────────────────────────────────────────── */}
      {submitError && (
        <div style={{
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: 8,
          padding: '12px 14px',
          marginBottom: 12,
          color: '#f87171',
          fontSize: 13,
          display: 'flex',
          gap: 8,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <span>{'\u26A0\uFE0F'}</span>
          {submitError}
        </div>
      )}

      {/* ── Submit Button ────────────────────────────────────────── */}
      <div style={{ marginTop: 8 }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          style={{
            width: '100%', height: 48, borderRadius: 10,
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            background: saving
              ? 'rgba(51,65,85,0.3)'
              : 'linear-gradient(135deg, #58CC02 0%, #46A302 100%)',
            color: saving ? '#64748b' : '#FFFFFF',
            fontSize: 15, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: saving ? 'none' : '0 2px 8px rgba(88,204,2,0.2)',
            transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: saving ? 0.5 : 1,
          }}
          onMouseEnter={e => {
            if (!saving) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #46A302 0%, #58CC02 100%)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(88,204,2,0.3)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={e => {
            if (!saving) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #58CC02 0%, #46A302 100%)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(88,204,2,0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {saving ? 'Submitting...' : 'Confirm Registration'}
          {!saving && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      </div>
    </WizardLayout>
  );
}
