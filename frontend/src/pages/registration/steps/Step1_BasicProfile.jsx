import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardLayout from '../components/WizardLayout';
import { useRegistration } from '../../../contexts/RegistrationContext';
import { FormField, Input } from '../../../components/ui/FormControls';

export default function Step1_BasicProfile() {
  const navigate = useNavigate();
  const { state, dispatch } = useRegistration();
  const fileRef = useRef(null);

  // ── Local form state (pre-fill from context if navigating back) ──
  const [fullName, setFullName] = useState(state.basicProfile.fullName);
  const [phone, setPhone] = useState(state.basicProfile.phone);
  const [gender, setGender] = useState(state.basicProfile.gender);
  const [birthDate, setBirthDate] = useState(state.basicProfile.birthDate);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(state.basicProfile.avatarUrl);
  const [avatarError, setAvatarError] = useState('');
  const [errors, setErrors] = useState({});

  // ── Avatar handling ────────────────────────────────────────────
  const handleAvatarClick = () => {
    fileRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image must be under 2MB');
      return;
    }

    setAvatarError('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ── Age calculation ────────────────────────────────────────────
  const calculateAge = (dateStr) => {
    if (!dateStr) return null;
    return Math.floor(
      (Date.now() - new Date(dateStr).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
    );
  };

  const age = calculateAge(birthDate);

  // ── Validation ─────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!fullName.trim() || fullName.trim().length < 2)
      errs.fullName = 'Full name is required (min 2 characters)';
    if (phone.replace(/\D/g, '').length < 10)
      errs.phone = 'Valid phone number is required';
    if (!gender)
      errs.gender = 'Please select gender';
    if (!birthDate)
      errs.birthDate = 'Date of birth is required';
    else {
      const a = calculateAge(birthDate);
      if (a < 5)
        errs.birthDate = 'Swimmer must be at least 5 years old';
    }
    return errs;
  };

  // ── Submit ─────────────────────────────────────────────────────
  const handleContinue = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    dispatch({
      type: 'UPDATE_BASIC_PROFILE',
      payload: { fullName: fullName.trim(), phone, gender, birthDate, avatarUrl: avatarPreview },
    });
    dispatch({ type: 'SET_STEP', payload: 2 });
    navigate('/club/registration/physical');
  };

  // ── Clear error helper ─────────────────────────────────────────
  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <WizardLayout
      currentStep={1}
      title="Let's get started"
      subtitle="Tell us about the swimmer"
      onBack={null}
    >
      {/* ── Avatar ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <div
          onClick={handleAvatarClick}
          style={{
            width: 80, height: 80, borderRadius: '50%',
            background: avatarPreview
              ? `url(${avatarPreview}) center/cover no-repeat`
              : 'rgba(51,65,85,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            border: '2px dashed rgba(100,116,139,0.4)',
            transition: 'border-color 0.2s ease, transform 0.15s ease',
            overflow: 'hidden',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(34,211,238,0.5)';
            e.currentTarget.style.transform = 'scale(1.03)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(100,116,139,0.4)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {!avatarPreview && (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <span style={{
          fontSize: 12, color: '#64748b', marginTop: 8,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Tap to add photo
        </span>
        {avatarError && (
          <span style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>{avatarError}</span>
        )}
      </div>

      {/* ── Full Name ──────────────────────────────────────────── */}
      <FormField label="Full Name">
        <Input
          placeholder="Full name"
          value={fullName}
          onChange={e => { setFullName(e.target.value); clearError('fullName'); }}
        />
        {errors.fullName && (
          <span style={{ fontSize: 12, color: '#f87171', marginTop: 4, display: 'block' }}>
            {errors.fullName}
          </span>
        )}
      </FormField>

      {/* ── Phone ──────────────────────────────────────────────── */}
      <FormField label="Phone">
        <Input
          placeholder="+20 1xx xxxx xxxx"
          type="tel"
          value={phone}
          onChange={e => { setPhone(e.target.value); clearError('phone'); }}
        />
        {errors.phone && (
          <span style={{ fontSize: 12, color: '#f87171', marginTop: 4, display: 'block' }}>
            {errors.phone}
          </span>
        )}
      </FormField>

      {/* ── Gender ─────────────────────────────────────────────── */}
      <FormField label="Gender">
        <div style={{ display: 'flex', gap: 8 }}>
          {['male', 'female'].map(g => (
            <button
              key={g}
              type="button"
              onClick={() => { setGender(g); clearError('gender'); }}
              style={{
                flex: 1, height: 52,
                borderRadius: 8,
                border: gender === g
                  ? '2px solid #1CB0F6'
                  : '2px solid rgba(51,65,85,0.5)',
                background: gender === g ? 'rgba(28,176,246,0.1)' : 'rgba(6,13,31,0.6)',
                color: gender === g ? '#1CB0F6' : '#94a3b8',
                fontWeight: 600, cursor: 'pointer',
                textTransform: 'capitalize',
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                if (gender !== g) {
                  e.currentTarget.style.borderColor = 'rgba(28,176,246,0.4)';
                  e.currentTarget.style.background = 'rgba(28,176,246,0.05)';
                }
              }}
              onMouseLeave={e => {
                if (gender !== g) {
                  e.currentTarget.style.borderColor = 'rgba(51,65,85,0.5)';
                  e.currentTarget.style.background = 'rgba(6,13,31,0.6)';
                }
              }}
            >
              {g}
            </button>
          ))}
        </div>
        {errors.gender && (
          <span style={{ fontSize: 12, color: '#f87171', marginTop: 4, display: 'block' }}>
            {errors.gender}
          </span>
        )}
      </FormField>

      {/* ── Date of Birth ──────────────────────────────────────── */}
      <FormField label="Date of Birth">
        <Input
          type="date"
          value={birthDate}
          onChange={e => { setBirthDate(e.target.value); clearError('birthDate'); }}
        />
        {birthDate && age !== null && age >= 0 && (
          <span style={{
            fontSize: 12, color: '#64748b', marginTop: 6, display: 'block',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Age: {age} years
          </span>
        )}
        {errors.birthDate && (
          <span style={{ fontSize: 12, color: '#f87171', marginTop: 4, display: 'block' }}>
            {errors.birthDate}
          </span>
        )}
      </FormField>

      {/* ── Continue Button ────────────────────────────────────── */}
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
