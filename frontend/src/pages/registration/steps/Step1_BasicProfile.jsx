import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WizardLayout from '../components/WizardLayout';
import { useRegistration } from '../../../contexts/RegistrationContext';
import { FormField, Input } from '../../../components/ui/FormControls';

export default function Step1_BasicProfile() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      errs.phone = t('forms.phoneInvalid', { defaultValue: 'Valid phone number is required' });
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
            width: 84, height: 84, borderRadius: '50%',
            background: avatarPreview
              ? `url(${avatarPreview}) center/cover no-repeat`
              : '#F2F2F7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            border: avatarPreview ? '1px solid #E5E5EA' : '1px dashed #C7C7CC',
            transition: 'border-color 0.15s ease, background 0.15s ease',
            overflow: 'hidden',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#0071E3'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = avatarPreview ? '#E5E5EA' : '#C7C7CC'; }}
        >
          {!avatarPreview && (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="#86868B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
        <span style={{ fontSize: 12, fontWeight: 500, color: '#6E6E73', marginTop: 10 }}>
          Tap to add photo
        </span>
        {avatarError && (
          <span style={{ fontSize: 12, color: '#FF3B30', marginTop: 4 }}>{avatarError}</span>
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
          <span style={{ fontSize: 12, color: '#FF3B30', marginTop: 4, display: 'block' }}>
            {errors.fullName}
          </span>
        )}
      </FormField>

      {/* ── Phone ──────────────────────────────────────────────── */}
      <FormField label="Phone">
        <Input
          placeholder={t('forms.phonePlaceholder', { defaultValue: '+966 5x xxx xxxx' })}
          type="tel"
          value={phone}
          onChange={e => { setPhone(e.target.value); clearError('phone'); }}
        />
        {errors.phone && (
          <span style={{ fontSize: 12, color: '#FF3B30', marginTop: 4, display: 'block' }}>
            {errors.phone}
          </span>
        )}
      </FormField>

      {/* ── Gender ─────────────────────────────────────────────── */}
      <FormField label="Gender">
        <div style={{
          display: 'flex', gap: 4, padding: 4,
          background: '#F2F2F7', borderRadius: 12,
        }}>
          {['male', 'female'].map((g) => {
            const active = gender === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => { setGender(g); clearError('gender'); }}
                style={{
                  flex: 1, height: 38,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  border: 'none',
                  borderRadius: 9,
                  background: active ? '#FFFFFF' : 'transparent',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.10), 0 1px 1px rgba(0,0,0,0.04)' : 'none',
                  color: active ? '#1D1D1F' : '#6E6E73',
                  cursor: 'pointer',
                  fontSize: 14, fontWeight: active ? 600 : 500,
                  textTransform: 'capitalize',
                  transition: 'background 0.18s var(--ease-spring), color 0.15s ease, box-shadow 0.18s ease',
                }}
              >
                {g}
              </button>
            );
          })}
        </div>
        {errors.gender && (
          <span style={{ fontSize: 12, color: '#FF3B30', marginTop: 4, display: 'block' }}>
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
          <span style={{ fontSize: 12, fontWeight: 500, color: '#6E6E73', marginTop: 8, display: 'block' }}>
            Age: {age} years
          </span>
        )}
        {errors.birthDate && (
          <span style={{ fontSize: 12, color: '#FF3B30', marginTop: 4, display: 'block' }}>
            {errors.birthDate}
          </span>
        )}
      </FormField>

      {/* ── Continue Button ────────────────────────────────────── */}
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
