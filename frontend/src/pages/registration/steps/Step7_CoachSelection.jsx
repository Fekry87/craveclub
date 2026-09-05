import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WizardLayout from '../components/WizardLayout';
import { useRegistration } from '../../../contexts/RegistrationContext';
import { getCoaches, getCoachSchedule } from '../../../api/registration';
import { Modal } from '../../../components/ui/Modal';

export default function Step7_CoachSelection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state, dispatch } = useRegistration();

  // ── Coach list ────────────────────────────────────────────────
  const [coaches, setCoaches] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // ── Selection ─────────────────────────────────────────────────
  const [selectedCoach, setSelectedCoach] = useState(state.coachId ?? null);
  const [selectedTime, setSelectedTime] = useState(state.preferredTime ?? null);

  // ── CV Modal ──────────────────────────────────────────────────
  const [cvCoach, setCvCoach] = useState(null);
  const [showCvModal, setShowCvModal] = useState(false);

  // ── Schedule ──────────────────────────────────────────────────
  const [schedule, setSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [activeDay, setActiveDay] = useState(null);

  // ── Errors ────────────────────────────────────────────────────
  const [errors, setErrors] = useState({});

  // ── Fetch coaches ─────────────────────────────────────────────
  const fetchCoaches = async () => {
    setCoaches(null);
    setLoadError(null);
    try {
      const sportId = state.sportIds?.[0] ?? null;
      const data = await getCoaches(sportId);
      setCoaches(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(
        err.response?.data?.message ?? 'Failed to load coaches.'
      );
    }
  };

  useEffect(() => { fetchCoaches(); }, []);

  // ── Fetch schedule on select ──────────────────────────────────
  const handleSelectCoach = async (id) => {
    setSelectedCoach(id);
    setSelectedTime(null);
    setSchedule([]);
    setActiveDay(null);
    if (errors.coach) setErrors(e => ({ ...e, coach: null }));

    setScheduleLoading(true);
    try {
      const data = await getCoachSchedule(id);
      // API returns { coach_id, slots: [{ day, start_time, end_time }] }
      // Transform to [{ day_of_week, slots: [{ time, is_available }] }] for display
      let scheduleData = [];
      if (data?.slots && Array.isArray(data.slots)) {
        const grouped = {};
        data.slots.forEach(slot => {
          const dayName = slot.day;
          if (!grouped[dayName]) grouped[dayName] = [];
          grouped[dayName].push({
            time: slot.start_time,
            is_available: true,
          });
        });
        scheduleData = Object.entries(grouped).map(([dayName, slots]) => ({
          day_of_week: dayName,
          slots,
        }));
      } else if (Array.isArray(data)) {
        scheduleData = data;
      }
      setSchedule(scheduleData);
      const firstAvail = scheduleData.find(d =>
        d.slots?.some(s => s.is_available)
      );
      if (firstAvail) setActiveDay(firstAvail.day_of_week);
    } catch {
      setSchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  };

  // ── Validation ────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!selectedCoach) errs.coach = 'Please select a coach';
    if (!selectedTime) errs.time = 'Please select a preferred time slot';
    return errs;
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleContinue = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    dispatch({ type: 'SET_COACH_ID', payload: selectedCoach });
    const coach = coaches?.find(c => c.id === selectedCoach);
    if (coach) {
      dispatch({ type: 'SET_COACH_NAME', payload: coach.name });
    }
    dispatch({ type: 'SET_PREFERRED_TIME', payload: selectedTime });
    dispatch({ type: 'SET_STEP', payload: 8 });
    navigate('/club/registration/review');
  };

  // ── Shimmer skeleton ──────────────────────────────────────────
  const renderLoading = () => (
    <>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          width: '100%', height: 100,
          marginBottom: 10, borderRadius: 14,
          background: '#F2F2F7',
          border: '1px solid #E5E5EA',
        }} />
      ))}
    </>
  );

  // ── Error state ───────────────────────────────────────────────
  const renderError = () => (
    <div style={{
      textAlign: 'center', padding: '40px 0',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
        stroke="#FF3B30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p style={{
        color: '#FF3B30', fontSize: 13,
        fontFamily: 'var(--font-body)', margin: 0,
      }}>
        {loadError}
      </p>
      <button type="button" onClick={fetchCoaches} className="pl-btn pl-btn-secondary pl-btn-sm">
        Retry
      </button>
    </div>
  );

  // ── Empty state ───────────────────────────────────────────────
  const renderEmpty = () => (
    <div style={{
      textAlign: 'center', padding: '40px 0',
      color: '#515154', fontSize: 14,
      fontFamily: 'var(--font-body)',
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
        stroke="#86868B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ display: 'block', margin: '0 auto 12px' }}>
        <circle cx="12" cy="12" r="10" />
        <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
      No coaches available yet.
    </div>
  );

  // ── Coach cards ───────────────────────────────────────────────
  const renderCoaches = () => (
    <>
      {coaches.map((coach) => {
        const isSelected = selectedCoach === coach.id;
        return (
          <div
            key={coach.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              marginBottom: 10,
              borderRadius: 14,
              border: isSelected ? '2px solid #0071E3' : '1px solid #E5E5EA',
              background: isSelected ? 'rgba(0,113,227,0.06)' : '#FFFFFF',
              transition: 'border-color 0.15s ease, background 0.15s ease',
            }}
          >
            {/* Avatar tile */}
            {coach.photo
              ? <img
                  src={coach.photo}
                  alt={coach.name}
                  style={{ borderRadius: '50%', width: 52, height: 52, objectFit: 'cover', flexShrink: 0 }}
                />
              : <div style={{ borderRadius: '50%',
                  width: 52, height: 52,
                  background: '#F2F2F7', border: '1px solid #E5E5EA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                    stroke="#86868B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
            }

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600,
                letterSpacing: '-0.01em', lineHeight: 1.2,
                color: '#1D1D1F',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {coach.name}
              </div>
              <div style={{
                fontSize: 13, color: '#6E6E73', marginTop: 4,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ color: '#FF9500' }}>&#9733;</span>
                {coach.rating ?? '\u2014'}
                <span style={{ color: '#6E6E73' }}>&bull;</span>
                {coach.current_swimmers_count ?? 0} swimmers
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 6,
              flexShrink: 0, alignItems: 'stretch',
            }}>
              <button
                type="button"
                onClick={() => {
                  setCvCoach(coach);
                  setShowCvModal(true);
                }}
                className="pl-btn pl-btn-ghost pl-btn-sm"
              >
                View Bio
              </button>
              <button
                type="button"
                onClick={() => handleSelectCoach(coach.id)}
                className={`pl-btn pl-btn-sm ${isSelected ? 'pl-btn-secondary' : 'pl-btn-primary'}`}
              >
                {isSelected ? 'Selected \u2713' : 'Select'}
              </button>
            </div>
          </div>
        );
      })}
    </>
  );

  // ── Schedule viewer ───────────────────────────────────────────
  const renderSchedule = () => (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #F2F2F7' }}>
      <div style={{
        fontSize: 12, fontWeight: 500,
        color: '#6E6E73', marginBottom: 12,
      }}>
        Available Times
      </div>

      {scheduleLoading && (
        <div style={{
          fontSize: 12, fontWeight: 500,
          color: '#86868B', padding: '12px 0',
        }}>
          Loading schedule...
        </div>
      )}

      {!scheduleLoading && schedule.length === 0 && (
        <p style={{
          color: '#6E6E73', fontSize: 13, margin: 0,
          fontFamily: 'var(--font-body)',
        }}>
          No schedule available for this coach.
        </p>
      )}

      {!scheduleLoading && schedule.length > 0 && (
        <>
          {/* Day tabs */}
          <div style={{
            display: 'flex', gap: 8,
            flexWrap: 'wrap', marginBottom: 14,
          }}>
            {schedule.map(day => {
              const hasAvail = day.slots?.some(s => s.is_available);
              const isActive = activeDay === day.day_of_week;
              return (
                <button
                  key={day.day_of_week}
                  type="button"
                  onClick={() => {
                    if (hasAvail) setActiveDay(day.day_of_week);
                  }}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 980,
                    cursor: hasAvail ? 'pointer' : 'default',
                    fontSize: 13, fontWeight: 500,
                    border: isActive ? '1px solid #0071E3' : '1px solid #E5E5EA',
                    background: isActive ? '#0071E3' : hasAvail ? '#FFFFFF' : '#F2F2F7',
                    color: isActive ? '#FFFFFF' : hasAvail ? '#515154' : '#AEAEB2',
                    transition: 'border-color 0.15s ease, background 0.15s ease, color 0.15s ease',
                  }}
                >
                  {day.day_of_week?.slice(0, 3)}
                </button>
              );
            })}
          </div>

          {/* Time slots for active day */}
          {activeDay && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8,
            }}>
              {schedule
                .find(d => d.day_of_week === activeDay)
                ?.slots
                ?.map((slot, i) => {
                  const isSlotSelected = selectedTime === slot.time;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!slot.is_available}
                      onClick={() => {
                        if (!slot.is_available) return;
                        setSelectedTime(slot.time);
                        if (errors.time)
                          setErrors(e => ({ ...e, time: null }));
                      }}
                      style={{
                        padding: '9px 16px',
                        borderRadius: 10,
                        border: !slot.is_available
                          ? '1px solid transparent'
                          : isSlotSelected ? '1px solid #0071E3' : '1px solid #D2D2D7',
                        background: !slot.is_available
                          ? '#F2F2F7'
                          : isSlotSelected ? '#0071E3' : '#FFFFFF',
                        color: !slot.is_available
                          ? '#AEAEB2'
                          : isSlotSelected ? '#FFFFFF' : '#1D1D1F',
                        cursor: slot.is_available ? 'pointer' : 'not-allowed',
                        fontSize: 13, fontWeight: 500,
                        transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
                      }}
                    >
                      {slot.time}
                    </button>
                  );
                })
              }
            </div>
          )}
        </>
      )}

      {/* Time error */}
      {errors.time && (
        <p style={{
          color: '#FF3B30', fontSize: 13,
          margin: '10px 0 0',
          fontFamily: 'var(--font-body)',
        }}>
          {errors.time}
        </p>
      )}
    </div>
  );

  return (
    <WizardLayout
      currentStep={7}
      title="Choose Your Coach"
      subtitle="View their profile before deciding"
      onBack={() => navigate('/club/registration/plan')}
    >
      {/* ── Content ──────────────────────────────────────────────── */}
      {coaches === null && !loadError && renderLoading()}
      {loadError && renderError()}
      {coaches !== null && coaches.length === 0 && renderEmpty()}
      {coaches !== null && coaches.length > 0 && renderCoaches()}

      {/* ── Coach error ──────────────────────────────────────────── */}
      {errors.coach && (
        <p style={{
          color: '#FF3B30', fontSize: 13,
          textAlign: 'start', margin: '8px 0 0',
          fontFamily: 'var(--font-body)',
        }}>
          {errors.coach}
        </p>
      )}

      {/* ── Schedule viewer ──────────────────────────────────────── */}
      {selectedCoach !== null && renderSchedule()}

      {/* ── Continue Button ──────────────────────────────────────── */}
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #F2F2F7' }}>
        <button
          type="button"
          onClick={handleContinue}
          disabled={coaches === null}
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

      {/* ── CV Modal ─────────────────────────────────────────────── */}
      {showCvModal && cvCoach !== null && (
        <Modal
          title={cvCoach.name ?? 'Coach Profile'}
          onClose={() => setShowCvModal(false)}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            {cvCoach.photo
              ? <img
                  src={cvCoach.photo}
                  alt={cvCoach.name}
                  style={{ borderRadius: '50%', width: 72, height: 72, objectFit: 'cover', flexShrink: 0 }}
                />
              : <div style={{ borderRadius: '50%',
                  width: 72, height: 72,
                  background: '#F2F2F7', border: '1px solid #E5E5EA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke="#86868B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
            }
            <div style={{ minWidth: 0 }}>
              <h3 style={{
                margin: 0,
                fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600,
                letterSpacing: '-0.02em', lineHeight: 1.2,
                color: '#1D1D1F',
              }}>
                {cvCoach.name}
              </h3>
              <p style={{
                fontSize: 13, color: '#6E6E73', margin: '6px 0 0',
              }}>
                {cvCoach.experience_years} years experience
              </p>
            </div>
          </div>

          {/* Bio */}
          {cvCoach.bio && (
            <div style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid #F2F2F7' }}>
              <div style={{
                fontSize: 12, fontWeight: 500,
                color: '#6E6E73', marginBottom: 8,
              }}>
                About
              </div>
              <p style={{
                color: '#1D1D1F', fontSize: 14,
                lineHeight: 1.6, margin: 0,
                fontFamily: 'var(--font-body)',
              }}>
                {cvCoach.bio}
              </p>
            </div>
          )}

          {/* Certifications */}
          {cvCoach.certifications &&
           Array.isArray(cvCoach.certifications) &&
           cvCoach.certifications.length > 0 && (
            <div style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid #F2F2F7' }}>
              <div style={{
                fontSize: 12, fontWeight: 500,
                color: '#6E6E73', marginBottom: 8,
              }}>
                Certifications
              </div>
              {cvCoach.certifications.map((cert, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center',
                  gap: 8, marginBottom: 6,
                  fontSize: 14, color: '#1D1D1F',
                  fontFamily: 'var(--font-body)',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: '#0071E3', flexShrink: 0 }} />
                  {cert}
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            border: '1px solid #E5E5EA', borderRadius: 14, overflow: 'hidden',
            marginBottom: 20,
          }}>
            <div style={{ padding: '14px 16px', borderInlineEnd: '1px solid #F2F2F7' }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700,
                letterSpacing: '-0.02em', lineHeight: 1.1, color: '#0071E3',
              }}>
                {cvCoach.rating ?? '\u2014'}
              </div>
              <div style={{
                fontSize: 12, fontWeight: 500,
                color: '#6E6E73', marginTop: 6,
              }}>
                Rating
              </div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700,
                letterSpacing: '-0.02em', lineHeight: 1.1, color: '#1D1D1F',
              }}>
                {cvCoach.current_swimmers_count ?? 0}
              </div>
              <div style={{
                fontSize: 12, fontWeight: 500,
                color: '#6E6E73', marginTop: 6,
              }}>
                Swimmers
              </div>
            </div>
          </div>

          {/* Select button */}
          <button
            type="button"
            onClick={() => {
              handleSelectCoach(cvCoach.id);
              setShowCvModal(false);
            }}
            className="pl-btn pl-btn-primary"
            style={{ width: '100%', height: 46 }}
          >
            {t('actions.confirm')}
          </button>
        </Modal>
      )}
    </WizardLayout>
  );
}
