import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Wraps a route that requires a specific feature to be enabled.
 * If the feature is disabled, redirects to the user's base dashboard.
 */
export default function FeatureRoute({ feature, children }) {
  const { user, isFeatureEnabled } = useAuth();

  if (!isFeatureEnabled(feature)) {
    const baseRoutes = {
      PLATFORM_ADMIN: '/corporate',
      CLUB_MANAGER: '/club',
      COACH: '/coach',
      SWIMMER: '/swimmer',
    };
    return <Navigate to={baseRoutes[user?.role] || '/login'} replace />;
  }

  return children;
}
