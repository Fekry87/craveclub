import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import FeatureRoute from './components/FeatureRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import ClubLogin from './pages/ClubLogin';
import ClubPage from './pages/public/ClubPage';

// Corporate (Platform Admin)
import CorporateDashboard from './pages/corporate/Dashboard';
import CorporateClubs from './pages/corporate/Clubs';
import CorporateClubDetail from './pages/corporate/ClubDetail';
import CorporateSettings from './pages/corporate/Settings';

// Legacy Platform (backward compat)
import PlatformDashboard from './pages/platform/Dashboard';
import Clubs from './pages/platform/Clubs';

// Club Manager
import ClubDashboard from './pages/club/Dashboard';
import Plans from './pages/club/Plans';
import Skills from './pages/club/Skills';
import Coaches from './pages/club/Coaches';
import Swimmers from './pages/club/Swimmers';
import Groups from './pages/club/Groups';
import Sessions from './pages/club/Sessions';
import Registrations from './pages/club/Registrations';
import Settings from './pages/club/Settings';
import ClubLeaderboard from './pages/club/Leaderboard';
import BranchesPage from './pages/club/BranchesPage';
import BranchDetail from './pages/club/BranchDetail';
import SubscriptionPlansPage from './pages/club/SubscriptionPlansPage';

// Coach
import CoachDashboard from './pages/coach/Dashboard';
import CoachSessions from './pages/coach/Sessions';
import SessionLive from './pages/coach/SessionLive';
import CoachGroups from './pages/coach/Groups';
import CoachSwimmers from './pages/coach/Swimmers';
import CoachSwimmerDetail from './pages/coach/SwimmerDetail';
import CoachSettings from './pages/coach/Settings';

// Swimmer
import SwimmerDashboard from './pages/swimmer/Dashboard';
import SwimmerSessions from './pages/swimmer/Sessions';
import SwimmerEvaluations from './pages/swimmer/Evaluations';
import SwimmerLeaderboard from './pages/swimmer/Leaderboard';

// Registration Wizard
import { RegistrationProvider } from './contexts/RegistrationContext';
import Step1_BasicProfile from './pages/registration/steps/Step1_BasicProfile';
import Step2_PhysicalInfo from './pages/registration/steps/Step2_PhysicalInfo';
import Step3_SportType from './pages/registration/steps/Step3_SportType';
import Step4_ExperienceLevel from './pages/registration/steps/Step4_ExperienceLevel';
import Step5_BranchSelection from './pages/registration/steps/Step5_BranchSelection';
import Step6_SubscriptionPlan from './pages/registration/steps/Step6_SubscriptionPlan';
import Step7_CoachSelection from './pages/registration/steps/Step7_CoachSelection';
import Step8_ReviewPayment from './pages/registration/steps/Step8_ReviewPayment';
import RegistrationSuccess from './pages/registration/RegistrationSuccess';

function RedirectByRole() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  const map = {
    PLATFORM_ADMIN: '/corporate',
    CLUB_MANAGER: '/club',
    COACH: '/coach',
    SWIMMER: '/swimmer',
  };
  return <Navigate to={map[user.role] || '/login'} />;
}

function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/portal/:slug" element={<ClubLogin />} />
          <Route path="/clubs/:slug" element={<ClubPage />} />

          {/* Corporate Admin (new primary routes) */}
          <Route element={<ProtectedRoute roles={['PLATFORM_ADMIN']}><Layout /></ProtectedRoute>}>
            <Route path="/corporate" element={<CorporateDashboard />} />
            <Route path="/corporate/clubs" element={<CorporateClubs />} />
            <Route path="/corporate/clubs/:id" element={<CorporateClubDetail />} />
            <Route path="/corporate/settings" element={<CorporateSettings />} />
          </Route>

          {/* Legacy Platform Admin (backward compat → redirects) */}
          <Route path="/platform" element={<Navigate to="/corporate" replace />} />
          <Route path="/platform/clubs" element={<Navigate to="/corporate/clubs" replace />} />

          {/* Registration Wizard (own layout, no sidebar) */}
          <Route element={<ProtectedRoute roles={['CLUB_MANAGER']}><RegistrationProvider /></ProtectedRoute>}>
            <Route path="/club/registration" element={<Step1_BasicProfile />} />
            <Route path="/club/registration/physical" element={<Step2_PhysicalInfo />} />
            <Route path="/club/registration/sport" element={<Step3_SportType />} />
            <Route path="/club/registration/experience" element={<Step4_ExperienceLevel />} />
            <Route path="/club/registration/branch" element={<Step5_BranchSelection />} />
            <Route path="/club/registration/plan" element={<Step6_SubscriptionPlan />} />
            <Route path="/club/registration/coach" element={<Step7_CoachSelection />} />
            <Route path="/club/registration/review" element={<Step8_ReviewPayment />} />
          </Route>

          {/* Registration Success (own layout, outside RegistrationProvider) */}
          <Route element={<ProtectedRoute roles={['CLUB_MANAGER']} />}>
            <Route path="/club/registration/success" element={<RegistrationSuccess />} />
          </Route>

          {/* Club Manager — feature-gated routes */}
          <Route element={<ProtectedRoute roles={['CLUB_MANAGER']}><Layout /></ProtectedRoute>}>
            <Route path="/club" element={<ClubDashboard />} />
            <Route path="/club/plans" element={<FeatureRoute feature="training_plans"><Plans /></FeatureRoute>} />
            <Route path="/club/skills" element={<FeatureRoute feature="skills"><Skills /></FeatureRoute>} />
            <Route path="/club/coaches" element={<Coaches />} />
            <Route path="/club/swimmers" element={<Swimmers />} />
            <Route path="/club/groups" element={<Groups />} />
            <Route path="/club/branches" element={<BranchesPage />} />
            <Route path="/club/branches/:id" element={<BranchDetail />} />
            <Route path="/club/sessions" element={<Sessions />} />
            <Route path="/club/registrations" element={<Registrations />} />
            <Route path="/club/subscription-plans" element={<FeatureRoute feature="subscription_plans"><SubscriptionPlansPage /></FeatureRoute>} />
            <Route path="/club/leaderboard" element={<FeatureRoute feature="leaderboard"><ClubLeaderboard /></FeatureRoute>} />
            <Route path="/club/settings" element={<Settings />} />
          </Route>

          {/* Coach — feature-gated */}
          <Route element={<ProtectedRoute roles={['COACH']}><Layout /></ProtectedRoute>}>
            <Route path="/coach" element={<CoachDashboard />} />
            <Route path="/coach/sessions" element={<CoachSessions />} />
            <Route path="/coach/sessions/:id/live" element={<SessionLive />} />
            <Route path="/coach/groups" element={<CoachGroups />} />
            <Route path="/coach/swimmers" element={<CoachSwimmers />} />
            <Route path="/coach/swimmers/:id" element={<CoachSwimmerDetail />} />
            <Route path="/coach/settings" element={<CoachSettings />} />
          </Route>

          {/* Swimmer — feature-gated */}
          <Route element={<ProtectedRoute roles={['SWIMMER']}><Layout /></ProtectedRoute>}>
            <Route path="/swimmer" element={<SwimmerDashboard />} />
            <Route path="/swimmer/leaderboard" element={<FeatureRoute feature="leaderboard"><SwimmerLeaderboard /></FeatureRoute>} />
            <Route path="/swimmer/sessions" element={<SwimmerSessions />} />
            <Route path="/swimmer/evaluations" element={<FeatureRoute feature="evaluations"><SwimmerEvaluations /></FeatureRoute>} />
          </Route>

          <Route path="/" element={<RedirectByRole />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
