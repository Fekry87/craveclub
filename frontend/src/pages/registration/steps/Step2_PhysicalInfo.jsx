import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardLayout from '../components/WizardLayout';
import { useRegistration } from '../../../contexts/RegistrationContext';
import { FormField, TextArea } from '../../../components/ui/FormControls';

const FITNESS_OPTIONS = ['excellent', 'good', 'average', 'beginner'];

export default function Step2_PhysicalInfo() {
  const navigate = useNavigate();
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 14, color: '#94a3b8', fontFamily: "'DM Sans', sans-serif" }}>
            Drag to adjust
          </span>
          <span style={{
            fontSize: 20, fontWeight: 700, color: '#1CB0F6',
            fontFamily: "'DM Sans', sans-serif",
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
            width: '100%', accentColor: '#1CB0F6',
            height: 6, borderRadius: 999,
            cursor: 'pointer',
          }}
        />
      </FormField>

      {/* ── Weight Slider ────────────────────────────────────────── */}
      <FormField label="Weight">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 14, color: '#94a3b8', fontFamily: "'DM Sans', sans-serif" }}>
            Drag to adjust
          </span>
          <span style={{
            fontSize: 20, fontWeight: 700, color: '#58CC02',
            fontFamily: "'DM Sans', sans-serif",
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
            width: '100%', accentColor: '#58CC02',
            height: 6, borderRadius: 999,
            cursor: 'pointer',
          }}
        />
      </FormField>

      {/* ── Fitness Level Chips ──────────────────────────────────── */}
      <FormField label="Fitness Level">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {FITNESS_OPTIONS.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => { setFitnessLevel(option); clearError('fitnessLevel'); }}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                border: fitnessLevel === option
                  ? '2px solid #58CC02'
                  : '2px solid rgba(51,65,85,0.3)',
                background: fitnessLevel === option
                  ? '#58CC02'
                  : 'rgba(15,23,42,0.4)',
                color: fitnessLevel === option
                  ? '#ffffff'
                  : '#94a3b8',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                if (fitnessLevel !== option) {
                  e.currentTarget.style.borderColor = 'rgba(88,204,2,0.4)';
                  e.currentTarget.style.background = 'rgba(88,204,2,0.08)';
                }
              }}
              onMouseLeave={e => {
                if (fitnessLevel !== option) {
                  e.currentTarget.style.borderColor = 'rgba(51,65,85,0.3)';
                  e.currentTarget.style.background = 'rgba(15,23,42,0.4)';
                }
              }}
            >
              {option}
            </button>
          ))}
        </div>
        {errors.fitnessLevel && (
          <span style={{ fontSize: 12, color: '#f87171', marginTop: 4, display: 'block' }}>
            {errors.fitnessLevel}
          </span>
        )}
      </FormField>

      {/* ── Prior Experience Toggle ──────────────────────────────── */}
      <FormField label="Have you practiced water sports before?">
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ].map(opt => (
            <button
              key={opt.label}
              type="button"
              onClick={() => { setPriorExperience(opt.value); clearError('priorExperience'); }}
              style={{
                flex: 1, height: 52,
                borderRadius: 8,
                border: priorExperience === opt.value
                  ? '2px solid #1CB0F6'
                  : '2px solid rgba(51,65,85,0.5)',
                background: priorExperience === opt.value
                  ? 'rgba(28,176,246,0.1)'
                  : 'rgba(6,13,31,0.6)',
                color: priorExperience === opt.value
                  ? '#1CB0F6'
                  : '#94a3b8',
                fontWeight: 600, cursor: 'pointer',
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                if (priorExperience !== opt.value) {
                  e.currentTarget.style.borderColor = 'rgba(28,176,246,0.4)';
                  e.currentTarget.style.background = 'rgba(28,176,246,0.05)';
                }
              }}
              onMouseLeave={e => {
                if (priorExperience !== opt.value) {
                  e.currentTarget.style.borderColor = 'rgba(51,65,85,0.5)';
                  e.currentTarget.style.background = 'rgba(6,13,31,0.6)';
                }
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {errors.priorExperience && (
          <span style={{ fontSize: 12, color: '#f87171', marginTop: 4, display: 'block' }}>
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
          fontSize: 12, color: '#64748b', textAlign: 'right',
          marginTop: 4, fontFamily: "'DM Sans', sans-serif",
        }}>
          {medicalNotes.length}/300
        </div>
      </FormField>

      {/* ── Continue Button ──────────────────────────────────────── */}
      <div style={{ marginTop: 24 }}>
        <button
          type="button"
          onClick={handleContinue}
          style={{
            width: '100%', height: 48, borderRadius: 10,
            border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
            color: '#060d1f', fontSize: 15, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 2px 8px rgba(45,212,191,0.15)',
            transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #0e9f8e 0%, #2dd4bf 100%)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(45,212,191,0.25)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(45,212,191,0.15)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Continue
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </WizardLayout>
  );
}
