import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardLayout from '../components/WizardLayout';
import { useRegistration } from '../../../contexts/RegistrationContext';
import { getCoaches, getCoachSchedule } from '../../../api/registration';
import { Modal } from '../../../components/ui/Modal';

export default function Step7_CoachSelection() {
  const navigate = useNavigate();
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
      const scheduleData = Array.isArray(data) ? data : [];
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
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          width: '100%', height: 100,
          borderRadius: 10, marginBottom: 10,
          background: 'linear-gradient(90deg, rgba(51,65,85,0.15) 25%, rgba(51,65,85,0.25) 50%, rgba(51,65,85,0.15) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
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
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
        stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p style={{
        color: '#f87171', fontSize: 14,
        fontFamily: "'DM Sans', sans-serif", margin: 0,
      }}>
        {loadError}
      </p>
      <button
        type="button"
        onClick={fetchCoaches}
        style={{
          padding: '8px 24px', borderRadius: 8,
          border: '1px solid rgba(51,65,85,0.5)',
          background: 'rgba(51,65,85,0.3)',
          color: '#e2e8f0', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.3)'; }}
      >
        Retry
      </button>
    </div>
  );

  // ── Empty state ───────────────────────────────────────────────
  const renderEmpty = () => (
    <div style={{
      textAlign: 'center', padding: '40px 0',
      color: '#94a3b8', fontSize: 14,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
        stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
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
      {coaches.map(coach => {
        const isSelected = selectedCoach === coach.id;
        return (
          <div
            key={coach.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              marginBottom: 10,
              borderRadius: 10,
              border: isSelected
                ? '2px solid #1CB0F6'
                : '2px solid rgba(51,65,85,0.3)',
              background: isSelected
                ? 'rgba(28,176,246,0.1)'
                : 'rgba(6,13,31,0.6)',
              transition: 'all 150ms ease',
            }}
          >
            {/* Avatar */}
            {coach.photo
              ? <img
                  src={coach.photo}
                  alt={coach.name}
                  style={{
                    width: 52, height: 52,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
              : <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'rgba(51,65,85,0.3)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0, fontSize: 20,
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
            }

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 700,
                color: isSelected ? '#1CB0F6' : '#e2e8f0',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {coach.name}
              </div>
              <div style={{
                fontSize: 13, color: '#94a3b8', marginTop: 2,
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ color: '#FFC800' }}>&#9733;</span>
                {coach.rating ?? '—'}
                <span style={{ color: '#64748b' }}>&bull;</span>
                {coach.current_swimmers_count ?? 0} swimmers
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 6,
              flexShrink: 0,
            }}>
              <button
                type="button"
                onClick={() => {
                  setCvCoach(coach);
                  setShowCvModal(true);
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: '1.5px solid rgba(51,65,85,0.5)',
                  background: 'rgba(51,65,85,0.2)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#94a3b8',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(51,65,85,0.4)';
                  e.currentTarget.style.color = '#e2e8f0';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(51,65,85,0.2)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                View Bio
              </button>
              <button
                type="button"
                onClick={() => handleSelectCoach(coach.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: isSelected ? '#58CC02' : '#1CB0F6',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 150ms ease',
                }}
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
    <div style={{ marginTop: 20 }}>
      <div style={{
        fontWeight: 700, marginBottom: 10,
        color: '#e2e8f0', fontSize: 14,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        Available Times
      </div>

      {scheduleLoading && (
        <div style={{
          textAlign: 'center', padding: 20,
          color: '#94a3b8', fontSize: 14,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Loading schedule...
        </div>
      )}

      {!scheduleLoading && schedule.length === 0 && (
        <p style={{
          color: '#94a3b8', fontSize: 14, margin: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          No schedule available for this coach.
        </p>
      )}

      {!scheduleLoading && schedule.length > 0 && (
        <>
          {/* Day tabs */}
          <div style={{
            display: 'flex', gap: 8,
            flexWrap: 'wrap', marginBottom: 12,
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
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: 'none',
                    cursor: hasAvail ? 'pointer' : 'default',
                    fontWeight: 600,
                    fontSize: 13,
                    opacity: hasAvail ? 1 : 0.4,
                    background: isActive
                      ? '#1CB0F6' : 'rgba(51,65,85,0.3)',
                    color: isActive
                      ? '#FFFFFF' : '#94a3b8',
                    transition: 'all 150ms ease',
                    fontFamily: "'DM Sans', sans-serif",
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
                        padding: '8px 16px',
                        borderRadius: 999,
                        border: slot.is_available
                          ? '2px solid #58CC02'
                          : '2px solid rgba(51,65,85,0.3)',
                        background: !slot.is_available
                          ? 'rgba(51,65,85,0.15)'
                          : isSlotSelected
                            ? '#58CC02'
                            : 'rgba(88,204,2,0.1)',
                        color: !slot.is_available
                          ? '#64748b'
                          : isSlotSelected
                            ? '#FFFFFF'
                            : '#58CC02',
                        cursor: slot.is_available
                          ? 'pointer' : 'not-allowed',
                        opacity: slot.is_available ? 1 : 0.5,
                        fontWeight: 600,
                        fontSize: 13,
                        transition: 'all 150ms ease',
                        fontFamily: "'DM Sans', sans-serif",
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
          color: '#f87171', fontSize: 13,
          margin: '8px 0 0',
          fontFamily: "'DM Sans', sans-serif",
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
          color: '#f87171', fontSize: 13,
          textAlign: 'center', margin: '8px 0 0',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {errors.coach}
        </p>
      )}

      {/* ── Schedule viewer ──────────────────────────────────────── */}
      {selectedCoach !== null && renderSchedule()}

      {/* ── Continue Button ──────────────────────────────────────── */}
      <div style={{ marginTop: 24 }}>
        <button
          type="button"
          onClick={handleContinue}
          disabled={coaches === null}
          style={{
            width: '100%', height: 48, borderRadius: 10,
            border: 'none', cursor: coaches === null ? 'not-allowed' : 'pointer',
            background: coaches === null
              ? 'rgba(51,65,85,0.3)'
              : 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
            color: coaches === null ? '#64748b' : '#060d1f',
            fontSize: 15, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: coaches === null ? 'none' : '0 2px 8px rgba(45,212,191,0.15)',
            transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: coaches === null ? 0.5 : 1,
          }}
          onMouseEnter={e => {
            if (coaches !== null) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #0e9f8e 0%, #2dd4bf 100%)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(45,212,191,0.25)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={e => {
            if (coaches !== null) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(45,212,191,0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          Continue
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
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
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            {cvCoach.photo
              ? <img
                  src={cvCoach.photo}
                  alt={cvCoach.name}
                  style={{
                    width: 80, height: 80,
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              : <div style={{
                  width: 80, height: 80,
                  borderRadius: '50%',
                  background: 'rgba(51,65,85,0.3)',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                    stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
            }
            <h3 style={{
              margin: '8px 0 4px', color: '#f1f5f9',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {cvCoach.name}
            </h3>
            <p style={{
              color: '#94a3b8', fontSize: 14, margin: 0,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {cvCoach.experience_years} years experience
            </p>
          </div>

          {/* Bio */}
          {cvCoach.bio && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontWeight: 700, marginBottom: 6,
                color: '#e2e8f0', fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                About
              </div>
              <p style={{
                color: '#cbd5e1', fontSize: 14,
                lineHeight: 1.6, margin: 0,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {cvCoach.bio}
              </p>
            </div>
          )}

          {/* Certifications */}
          {cvCoach.certifications &&
           Array.isArray(cvCoach.certifications) &&
           cvCoach.certifications.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontWeight: 700, marginBottom: 6,
                color: '#e2e8f0', fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Certifications
              </div>
              {cvCoach.certifications.map((cert, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center',
                  gap: 8, marginBottom: 4,
                  fontSize: 14, color: '#cbd5e1',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  <span style={{ color: '#58CC02' }}>{'\u2713'}</span>
                  {cert}
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div style={{
            display: 'flex', gap: 16, marginBottom: 20,
            justifyContent: 'center',
          }}>
            <div style={{
              textAlign: 'center',
              padding: '10px 16px',
              borderRadius: 8,
              background: 'rgba(28,176,246,0.1)',
            }}>
              <div style={{
                fontSize: 18, fontWeight: 800, color: '#1CB0F6',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {cvCoach.rating ?? '—'}
              </div>
              <div style={{
                fontSize: 11, color: '#94a3b8', marginTop: 2,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Rating
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '10px 16px',
              borderRadius: 8,
              background: 'rgba(88,204,2,0.1)',
            }}>
              <div style={{
                fontSize: 18, fontWeight: 800, color: '#58CC02',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {cvCoach.current_swimmers_count ?? 0}
              </div>
              <div style={{
                fontSize: 11, color: '#94a3b8', marginTop: 2,
                fontFamily: "'DM Sans', sans-serif",
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
            style={{
              width: '100%', height: 44, borderRadius: 10,
              border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
              color: '#060d1f', fontSize: 14, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: '0 2px 8px rgba(45,212,191,0.15)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #0e9f8e 0%, #2dd4bf 100%)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Select This Coach
          </button>
        </Modal>
      )}
    </WizardLayout>
  );
}
