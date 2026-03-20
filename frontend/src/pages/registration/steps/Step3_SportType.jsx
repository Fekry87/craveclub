import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WizardLayout from '../components/WizardLayout';
import { useRegistration } from '../../../contexts/RegistrationContext';

const SPORTS = [
  { id: 'freestyle',    label: 'Free Swimming',  emoji: '\u{1F3CA}', color: '#1CB0F6', bg: '#EBF8FF' },
  { id: 'competitive',  label: 'Competitive',    emoji: '\u{1F3C5}', color: '#58CC02', bg: '#F0FFF4' },
  { id: 'diving',       label: 'Diving',         emoji: '\u{1F93F}', color: '#FF9600', bg: '#FFFBEB' },
  { id: 'waterpolo',    label: 'Water Polo',     emoji: '\u{1F93D}', color: '#CE82FF', bg: '#FAF5FF' },
  { id: 'kids',         label: 'Kids Swimming',  emoji: '\u{1F476}', color: '#2DD4BF', bg: '#F0FDFA' },
  { id: 'aquafitness',  label: 'Aqua Fitness',   emoji: '\u{1F4AA}', color: '#FFC800', bg: '#FFFFF0' },
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
          textAlign: 'center', color: '#1CB0F6',
          fontSize: 13, fontWeight: 600, marginBottom: 8,
          fontFamily: "'DM Sans', sans-serif", margin: '0 0 8px',
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
        {SPORTS.map(sport => {
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
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px 12px',
                borderRadius: 12,
                border: isSelected
                  ? `2px solid ${sport.color}`
                  : '2px solid rgba(51,65,85,0.3)',
                background: isSelected
                  ? `${sport.color}18`
                  : 'rgba(6,13,31,0.6)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                boxShadow: isSelected
                  ? `0 0 0 3px ${sport.color}22`
                  : 'none',
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = `${sport.color}66`;
                  e.currentTarget.style.background = `${sport.color}0A`;
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(51,65,85,0.3)';
                  e.currentTarget.style.background = 'rgba(6,13,31,0.6)';
                }
              }}
            >
              {/* Checkmark */}
              {isSelected && (
                <span style={{
                  position: 'absolute', top: 8, right: 8,
                  color: sport.color, fontSize: 16, fontWeight: 700,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={sport.color}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </span>
              )}

              <span style={{ fontSize: 32, lineHeight: 1 }}>{sport.emoji}</span>
              <span style={{
                marginTop: 8, fontSize: 13, fontWeight: 600,
                color: isSelected ? sport.color : '#94a3b8',
                textAlign: 'center',
                fontFamily: "'DM Sans', sans-serif",
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
          color: '#f87171', fontSize: 13,
          textAlign: 'center', margin: '0 0 8px',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {errors.sports}
        </p>
      )}

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
          {t('actions.next')}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </WizardLayout>
  );
}
