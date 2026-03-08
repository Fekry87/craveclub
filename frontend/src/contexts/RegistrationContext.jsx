import { createContext, useContext, useReducer, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

const STORAGE_KEY = 'crave_registration_draft';
const TOTAL_STEPS = 8;

const initialState = {
  step: 1,
  basicProfile: {
    fullName: '',
    phone: '',
    gender: null,
    birthDate: '',
    avatarUrl: null,
  },
  physicalInfo: {
    heightCm: 170,
    weightKg: 70,
    fitnessLevel: null,
    priorExperience: null,
    medicalNotes: '',
  },
  sportIds: [],
  experience: {
    level: null,
    yearsExperience: null,
    competed: null,
    primaryGoal: null,
    weeklyFrequency: null,
  },
  branchId: null,
  branchName: null,
  planId: null,
  planName: null,
  planPrice: null,
  coachId: null,
  coachName: null,
  preferredTime: null,
};

function registrationReducer(state, action) {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'UPDATE_BASIC_PROFILE':
      return { ...state, basicProfile: { ...state.basicProfile, ...action.payload } };
    case 'UPDATE_PHYSICAL_INFO':
      return { ...state, physicalInfo: { ...state.physicalInfo, ...action.payload } };
    case 'SET_SPORT_IDS':
      return { ...state, sportIds: action.payload };
    case 'UPDATE_EXPERIENCE':
      return { ...state, experience: { ...state.experience, ...action.payload } };
    case 'SET_BRANCH_ID':
      return { ...state, branchId: action.payload };
    case 'SET_BRANCH_NAME':
      return { ...state, branchName: action.payload };
    case 'SET_PLAN_ID':
      return { ...state, planId: action.payload };
    case 'SET_PLAN_NAME':
      return { ...state, planName: action.payload };
    case 'SET_PLAN_PRICE':
      return { ...state, planPrice: action.payload };
    case 'SET_COACH_ID':
      return { ...state, coachId: action.payload };
    case 'SET_COACH_NAME':
      return { ...state, coachName: action.payload };
    case 'SET_PREFERRED_TIME':
      return { ...state, preferredTime: action.payload };
    case 'RESET':
      return { ...initialState };
    case 'RESTORE':
      return { ...initialState, ...action.payload };
    default:
      return state;
  }
}

const RegistrationContext = createContext(null);

export function RegistrationProvider({ children = null }) {
  const [state, dispatch] = useReducer(registrationReducer, initialState, () => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialState, ...parsed };
      }
    } catch {
      // ignore parse errors
    }
    return initialState;
  });

  // Persist to sessionStorage on every state change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage errors
    }
  }, [state]);

  return (
    <RegistrationContext.Provider value={{ state, dispatch, TOTAL_STEPS }}>
      {children || <Outlet />}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  const ctx = useContext(RegistrationContext);
  if (!ctx) throw new Error('useRegistration must be used within RegistrationProvider');
  return ctx;
}

export function clearRegistrationDraft() {
  sessionStorage.removeItem(STORAGE_KEY);
}
