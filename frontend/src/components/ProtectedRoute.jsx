import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getStoredClubSlug } from '../api/axios';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ color: '#94a3b8', padding: 40, textAlign: 'center' }}>Loading...</div>;

  if (!user) {
    // Redirect to the correct login page based on scope
    const isClubRoute = ['/club', '/coach', '/swimmer'].some(p => location.pathname.startsWith(p));
    if (isClubRoute) {
      const slug = getStoredClubSlug();
      if (slug) return <Navigate to={`/portal/${slug}`} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;

  return children;
}
