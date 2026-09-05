import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WizardLayout from '../components/WizardLayout';
import { useRegistration } from '../../../contexts/RegistrationContext';
import { FormField, TextArea } from '../../../components/ui/FormControls';

const FITNESS_OPTIONS = ['excellent', 'good', 'average', 'beginner'];

export default function Step2_PhysicalInfo() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state, dispatch } = useRegistration();

  // ── Local form state (pre-fill from context if navigating back) ──
  const [heightCm, setHeightCm] = useState(state.physicalInfo.heightCm ?? 170);
  const [weightKg, setWeightKg] = useState(state.physicalInfo.weightKg ?? 70);
  const [fitnessLevel, setFitnessLevel] = useState(state.physicalInfo.fitnessLevel ?? null);
  const [priorExperience, setPriorExperience] = useState(state.physicalInfo.priorExperience ?? null);
  const [medicalNotes, setMedicalNotes] = useState(state.physicalInfo.medicalNotes ?? '');
  const [errors, setErrors] = useState({});

  // ── Clear error helper ──────────────────────────────────────────
  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // ── Validation ──────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!fitnessLevel) errs.fitnessLevel = 'Please select your fitness level';
    if (priorExperience === null) errs.priorExperience = 'Please answer this question';
    return errs;
  };

  // ── Submit ──────────────────────────────────────────────────────
  const handleContinue = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    dispatch({
      type: 'UPDATE_PHYSICAL_INFO',
      payload: { heightCm, weightKg, fitnessLevel, priorExperience, medicalNotes },
    });
    dispatch({ type: 'SET_STEP', payload: 3 });
    navigate('/club/registration/sport');
  };

  return (
    <WizardLayout
      currentStep={2}
      title="Physical Information"
      subtitle="Helps your coach build the right training plan"
      onBack={() => navigate('/club/registration')}
    >
      {/* ── Height Slider ────────────────────────────────────────── */}
      <FormField label="Height">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{
            fontSize: 12, fontWeight: 500, color: '#86868B',
          }}>
            Drag to adjust
          </span>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600,
            letterSpacing: '-0.02em', lineHeight: 1,
            color: '#1D1D1F',
          }}>
            {heightCm} cm
          </span>
        </div>
        <input
          type="range"
          min={100}
          max={220}
          step={1}
          value={heightCm}
          onChange={e => setHeightCm(Number(e.target.value))}
          style={{
            width: '100%', accentColor: '#0071E3',
            height: 4, cursor: 'pointer',
          }}
        />
      </FormField>

      {/* ── Weight Slider ────────────────────────────────────────── */}
      <FormField label="Weight">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{
            fontSize: 12, fontWeight: 500, color: '#86868B',
          }}>
            Drag to adjust
          </span>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600,
            letterSpacing: '-0.02em', lineHeight: 1,
            color: '#1D1D1F',
          }}>
            {weightKg} kg
          </span>
        </div>
        <input
          type="range"
          min={30}
          max={200}
          step={1}
          value={weightKg}
          onChange={e => setWeightKg(Number(e.target.value))}
          style={{
            width: '100%', accentColor: '#0071E3',
            height: 4, cursor: 'pointer',
          }}
        />
      </FormField>

      {/* ── Fitness Level Chips ──────────────────────────────────── */}
      <FormField label="Fitness Level">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {FITNESS_OPTIONS.map((option) => {
            const active = fitnessLevel === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => { setFitnessLevel(option); clearError('fitnessLevel'); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '9px 16px',
                  borderRadius: 980,
                  cursor: 'pointer',
                  fontSize: 13, fontWeight: 500,
                  textTransform: 'capitalize',
                  border: active ? '1px solid #0071E3' : '1px solid #E5E5EA',
                  background: active ? '#0071E3' : '#FFFFFF',
                  color: active ? '#FFFFFF' : '#515154',
                  transition: 'border-color 0.15s ease, background 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#D2D2D7'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = '#E5E5EA'; }}
              >
                {option}
              </button>
            );
          })}
        </div>
        {errors.fitnessLevel && (
          <span style={{ fontSize: 12, color: '#FF3B30', marginTop: 4, display: 'block' }}>
            {errors.fitnessLevel}
          </span>
        )}
      </FormField>

      {/* ── Prior Experience Toggle ──────────────────────────────── */}
      <FormField label="Have you practiced water sports before?">
        <div style={{
          display: 'flex', gap: 4, padding: 4,
          background: '#F2F2F7', borderRadius: 12,
        }}>
          {[
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ].map((opt) => {
            const active = priorExperience === opt.value;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => { setPriorExperience(opt.value); clearError('priorExperience'); }}
                style={{
                  flex: 1, height: 38,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none',
                  borderRadius: 9,
                  background: active ? '#FFFFFF' : 'transparent',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.10), 0 1px 1px rgba(0,0,0,0.04)' : 'none',
                  color: active ? '#1D1D1F' : '#6E6E73',
                  cursor: 'pointer',
                  fontSize: 14, fontWeight: active ? 600 : 500,
                  transition: 'background 0.18s var(--ease-spring), color 0.15s ease, box-shadow 0.18s ease',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {errors.priorExperience && (
          <span style={{ fontSize: 12, color: '#FF3B30', marginTop: 4, display: 'block' }}>
            {errors.priorExperience}
          </span>
        )}
      </FormField>

      {/* ── Medical Notes ────────────────────────────────────────── */}
      <FormField label="Medical Notes (optional)">
        <TextArea
          placeholder="Any health conditions your coach should know about?"
          value={medicalNotes}
          onChange={e => {
            if (e.target.value.length <= 300) setMedicalNotes(e.target.value);
          }}
          rows={3}
        />
        <div style={{
          fontSize: 12, fontWeight: 500, color: '#86868B',
          textAlign: 'end', marginTop: 6,
        }}>
          {medicalNotes.length}/300
        </div>
      </FormField>

      {/* ── Continue Button ──────────────────────────────────────── */}
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #F2F2F7' }}>
        <button
          type="button"
          onClick={handleContinue}
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
