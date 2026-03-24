import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import FeatureRoute from './components/FeatureRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import ClubLogin from './pages/ClubLogin';
import ClubPage from './pages/public/ClubPage';

// Registration context (structural — must stay eager)
import { RegistrationProvider } from './contexts/RegistrationContext';
import { SportModuleProvider } from './contexts/SportModuleContext';

// Corporate (Platform Admin)
const CorporateDashboard = lazy(() => import('./pages/corporate/Dashboard'));
const CorporateClubs = lazy(() => import('./pages/corporate/Clubs'));
const CorporateClubDetail = lazy(() => import('./pages/corporate/ClubDetail'));
const CorporateSettings = lazy(() => import('./pages/corporate/Settings'));
const ClubBrandingPage = lazy(() => import('./pages/corporate/ClubBrandingPage'));
const SportModulesPage = lazy(() => import('./pages/corporate/SportModulesPage'));

// Legacy Platform (backward compat)
const PlatformDashboard = lazy(() => import('./pages/platform/Dashboard'));
const Clubs = lazy(() => import('./pages/platform/Clubs'));

// Club Manager
const ManagerHomePage = lazy(() => import('./pages/club/ManagerHomePage'));
const SportModuleDashboard = lazy(() => import('./pages/club/SportModuleDashboard'));
const ClubDashboard = lazy(() => import('./pages/club/Dashboard'));
const Plans = lazy(() => import('./pages/club/Plans'));
const TrainingPlansPage = lazy(() => import('./pages/club/TrainingPlansPage'));
const Skills = lazy(() => import('./pages/club/Skills'));
const Coaches = lazy(() => import('./pages/club/Coaches'));
const Swimmers = lazy(() => import('./pages/club/Swimmers'));
const Groups = lazy(() => import('./pages/club/Groups'));
const Sessions = lazy(() => import('./pages/club/Sessions'));
const SessionDetailPage = lazy(() => import('./pages/club/SessionDetailPage'));
const Registrations = lazy(() => import('./pages/club/Registrations'));
const Settings = lazy(() => import('./pages/club/Settings'));
const ClubLeaderboard = lazy(() => import('./pages/club/Leaderboard'));
const BranchesPage = lazy(() => import('./pages/club/BranchesPage'));
const BranchDetail = lazy(() => import('./pages/club/BranchDetail'));
const SubscriptionPlansPage = lazy(() => import('./pages/club/SubscriptionPlansPage'));
const ScheduleBuilderPage = lazy(() => import('./pages/club/ScheduleBuilderPage'));
const AnalyticsDashboard = lazy(() => import('./pages/club/AnalyticsDashboard'));
const CoachPerformancePage = lazy(() => import('./pages/club/CoachPerformancePage'));
const CoachDetailPage = lazy(() => import('./pages/club/CoachDetailPage'));
const ClubBrandingSettings = lazy(() => import('./pages/club/ClubBrandingPage'));

// Coach
const CoachDashboard = lazy(() => import('./pages/coach/Dashboard'));
const CoachSessions = lazy(() => import('./pages/coach/Sessions'));
const SessionLive = lazy(() => import('./pages/coach/SessionLive'));
const CoachGroups = lazy(() => import('./pages/coach/Groups'));
const CoachSwimmers = lazy(() => import('./pages/coach/Swimmers'));
const CoachSwimmerDetail = lazy(() => import('./pages/coach/SwimmerDetail'));
const CoachSettings = lazy(() => import('./pages/coach/Settings'));

// Swimmer
const SwimmerDashboard = lazy(() => import('./pages/swimmer/Dashboard'));
const SwimmerSessions = lazy(() => import('./pages/swimmer/Sessions'));
const SwimmerEvaluations = lazy(() => import('./pages/swimmer/Evaluations'));
const SwimmerLeaderboard = lazy(() => import('./pages/swimmer/Leaderboard'));

// Registration Wizard
const Step1_BasicProfile = lazy(() => import('./pages/registration/steps/Step1_BasicProfile'));
const Step2_PhysicalInfo = lazy(() => import('./pages/registration/steps/Step2_PhysicalInfo'));
const Step3_SportType = lazy(() => import('./pages/registration/steps/Step3_SportType'));
const Step4_ExperienceLevel = lazy(() => import('./pages/registration/steps/Step4_ExperienceLevel'));
const Step5_BranchSelection = lazy(() => import('./pages/registration/steps/Step5_BranchSelection'));
const Step6_SubscriptionPlan = lazy(() => import('./pages/registration/steps/Step6_SubscriptionPlan'));
const Step7_CoachSelection = lazy(() => import('./pages/registration/steps/Step7_CoachSelection'));
const Step8_ReviewPayment = lazy(() => import('./pages/registration/steps/Step8_ReviewPayment'));
const RegistrationSuccess = lazy(() => import('./pages/registration/RegistrationSuccess'));

const PageLoader = () => {
  const stored = localStorage.getItem('craveclubs_lang');
  const text = stored === 'ar' ? 'جارٍ التحميل...' : 'Loading...';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div>{text}</div>
    </div>
  );
};

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

/**
 * Resolves /:clubSlug — if the slug matches a known app route prefix,
 * redirect to /. Otherwise treat it as a club slug and render ClubLogin.
 */
function ClubSlugResolver() {
  const { clubSlug } = useParams();
  const RESERVED = ['login', 'portal', 'clubs', 'corporate', 'platform', 'club', 'coach', 'swimmer'];
  if (RESERVED.includes(clubSlug?.toLowerCase())) {
    return <Navigate to="/" replace />;
  }
  return <ClubLogin />;
}

function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/portal/:slug" element={<ClubLogin />} />
          <Route path="/clubs/:slug" element={<ClubPage />} />

          {/* Corporate Admin (new primary routes) */}
          <Route element={<ProtectedRoute roles={['PLATFORM_ADMIN']}><Layout /></ProtectedRoute>}>
            <Route path="/corporate" element={<CorporateDashboard />} />
            <Route path="/corporate/clubs" element={<CorporateClubs />} />
            <Route path="/corporate/clubs/:id" element={<CorporateClubDetail />} />
            <Route path="/corporate/clubs/:id/branding" element={<ClubBrandingPage />} />
            <Route path="/corporate/sport-modules" element={<SportModulesPage />} />
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

          {/* Club Manager Home — full screen, no sidebar */}
          <Route path="/club" element={
            <ProtectedRoute roles={['CLUB_MANAGER']}>
              <SportModuleProvider>
                <ManagerHomePage />
              </SportModuleProvider>
            </ProtectedRoute>
          } />

          {/* Club Manager — feature-gated routes (with sidebar) */}
          <Route element={<ProtectedRoute roles={['CLUB_MANAGER']}><SportModuleProvider><Layout /></SportModuleProvider></ProtectedRoute>}>
            <Route path="/club/dashboard" element={<ClubDashboard />} />
            <Route path="/club/plans" element={<FeatureRoute feature="training_plans"><Plans /></FeatureRoute>} />
            <Route path="/club/training-plans" element={<FeatureRoute feature="training_plans"><TrainingPlansPage /></FeatureRoute>} />
            <Route path="/club/skills" element={<FeatureRoute feature="skills"><Skills /></FeatureRoute>} />
            <Route path="/club/coaches" element={<Coaches />} />
            <Route path="/club/coaches/performance" element={<CoachPerformancePage />} />
            <Route path="/club/coaches/:coachId/performance" element={<CoachDetailPage />} />
            <Route path="/club/swimmers" element={<Swimmers />} />
            <Route path="/club/groups" element={<Groups />} />
            <Route path="/club/branches" element={<BranchesPage />} />
            <Route path="/club/branches/:id" element={<BranchDetail />} />
            <Route path="/club/sessions" element={<Sessions />} />
            <Route path="/club/sessions/:id" element={<SessionDetailPage />} />
            <Route path="/club/schedules" element={<ScheduleBuilderPage />} />
            <Route path="/club/registrations" element={<Registrations />} />
            <Route path="/club/subscription-plans" element={<FeatureRoute feature="subscription_plans"><SubscriptionPlansPage /></FeatureRoute>} />
            <Route path="/club/leaderboard" element={<FeatureRoute feature="leaderboard"><ClubLeaderboard /></FeatureRoute>} />
            <Route path="/club/analytics" element={<AnalyticsDashboard />} />
            <Route path="/club/branding" element={<ClubBrandingSettings />} />
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
            <Route path="/coach/training-plans" element={<TrainingPlansPage />} />
            <Route path="/coach/settings" element={<CoachSettings />} />
          </Route>

          {/* Swimmer — feature-gated */}
          <Route element={<ProtectedRoute roles={['SWIMMER']}><Layout /></ProtectedRoute>}>
            <Route path="/swimmer" element={<SwimmerDashboard />} />
            <Route path="/swimmer/leaderboard" element={<FeatureRoute feature="leaderboard"><SwimmerLeaderboard /></FeatureRoute>} />
            <Route path="/swimmer/sessions" element={<SwimmerSessions />} />
            <Route path="/swimmer/evaluations" element={<FeatureRoute feature="evaluations"><SwimmerEvaluations /></FeatureRoute>} />
          </Route>

          {/* Club-aware login: /:slug → branded login (must be AFTER all named routes) */}
          <Route path="/:clubSlug" element={<ClubSlugResolver />} />

          <Route path="/" element={<RedirectByRole />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </Suspense>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
