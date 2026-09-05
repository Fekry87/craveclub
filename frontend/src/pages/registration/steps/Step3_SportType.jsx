import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WizardLayout from '../components/WizardLayout';
import { useRegistration } from '../../../contexts/RegistrationContext';

const SPORTS = [
  { id: 'freestyle',    label: 'Free Swimming',  emoji: '\u{1F3CA}' },
  { id: 'competitive',  label: 'Competitive',    emoji: '\u{1F3C5}' },
  { id: 'diving',       label: 'Diving',         emoji: '\u{1F93F}' },
  { id: 'waterpolo',    label: 'Water Polo',     emoji: '\u{1F93D}' },
  { id: 'kids',         label: 'Kids Swimming',  emoji: '\u{1F476}' },
  { id: 'aquafitness',  label: 'Aqua Fitness',   emoji: '\u{1F4AA}' },
];

export default function Step3_SportType() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state, dispatch } = useRegistration();

  // ── Local state (pre-fill from context) ─────────────────────────
  const [selected, setSelected] = useState(state.sportIds ?? []);
  const [errors, setErrors] = useState({});

  // ── Toggle logic ────────────────────────────────────────────────
  const toggleSport = (id) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
    if (errors.sports) setErrors({});
  };

  // ── Validation ──────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (selected.length === 0) errs.sports = 'Please select at least one sport';
    return errs;
  };

  // ── Submit ──────────────────────────────────────────────────────
  const handleContinue = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    dispatch({ type: 'SET_SPORT_IDS', payload: selected });
    dispatch({ type: 'SET_STEP', payload: 4 });
    navigate('/club/registration/experience');
  };

  return (
    <WizardLayout
      currentStep={3}
      title="Choose Your Sport"
      subtitle="You can select more than one"
      onBack={() => navigate('/club/registration/physical')}
    >
      {/* ── Selection counter ────────────────────────────────────── */}
      {selected.length > 0 && (
        <p style={{
          fontSize: 13, fontWeight: 500,
          color: '#0071E3', textAlign: 'start', margin: '0 0 14px',
        }}>
          {selected.length} sport{selected.length > 1 ? 's' : ''} selected
        </p>
      )}

      {/* ── Sport Grid ───────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        marginBottom: 16,
      }}>
        {SPORTS.map((sport) => {
          const isSelected = selected.includes(sport.id);
          return (
            <button
              key={sport.id}
              type="button"
              onClick={() => toggleSport(sport.id)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                gap: 12,
                padding: '18px 16px',
                borderRadius: 14,
                textAlign: 'start',
                border: isSelected ? '2px solid #0071E3' : '1px solid #E5E5EA',
                background: isSelected ? 'rgba(0,113,227,0.06)' : '#FFFFFF',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#D2D2D7'; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#E5E5EA'; }}
            >
              {/* Selected marker */}
              {isSelected && (
                <span style={{
                  position: 'absolute', top: 12, insetInlineEnd: 12,
                  width: 20, height: 20, borderRadius: '50%', background: '#0071E3',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
              )}

              <span style={{
                width: 44, height: 44, borderRadius: 12,
                background: isSelected ? 'rgba(0,113,227,0.12)' : '#F2F2F7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, lineHeight: 1,
                transition: 'background 0.15s ease',
              }}>{sport.emoji}</span>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600,
                letterSpacing: '-0.01em', lineHeight: 1.2,
                color: '#1D1D1F',
              }}>
                {sport.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Error ────────────────────────────────────────────────── */}
      {errors.sports && (
        <p style={{
          color: '#FF3B30', fontSize: 13,
          textAlign: 'start', margin: '0 0 8px',
          fontFamily: 'var(--font-body)',
        }}>
          {errors.sports}
        </p>
      )}

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
