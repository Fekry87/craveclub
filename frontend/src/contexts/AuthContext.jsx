import { createContext, useContext, useState, useEffect } from 'react';
import api, {
  getAuthScope,
  getStoredToken,
  storeToken,
  removeToken,
  storeClubSlug,
} from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [features, setFeatures] = useState(null);
  const [corporate, setCorporate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalScope, setPortalScope] = useState(() => getAuthScope());

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const scope = getAuthScope();
    setPortalScope(scope);
    const token = getStoredToken(scope);

    // No token for this scope → not authenticated, skip API call
    if (!token) {
      setUser(null);
      setFeatures(null);
      setCorporate(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setFeatures(data.user.features || null);
      setCorporate(data.user.corporate || null);
    } catch {
      // Token is invalid — clear it
      removeToken(scope);
      setUser(null);
      setFeatures(null);
      setCorporate(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, clubSlug) => {
    const scope = clubSlug ? 'club' : 'corporate';
    const payload = { email, password };
    if (clubSlug) {
      payload.club_slug = clubSlug;
      storeClubSlug(clubSlug);
    }

    const { data } = await api.post('/auth/login', payload);

    // Store the bearer token for this scope
    storeToken(scope, data.token);
    setPortalScope(scope);

    setUser(data.user);
    setFeatures(data.user.features || null);
    setCorporate(data.user.corporate || null);

    return data.user;
  };

  const logout = async () => {
    const scope = getAuthScope();
    try {
      await api.post('/auth/logout');
    } catch {
      // Token might already be invalid
    }
    removeToken(scope);
    setUser(null);
    setFeatures(null);
    setCorporate(null);
  };

  /** Check if a feature is enabled for the current club. */
  const isFeatureEnabled = (feature) => {
    if (!features) return true;
    return features[`${feature}_enabled`] ?? true;
  };

  return (
    <AuthContext.Provider value={{
      user, features, corporate, loading, portalScope,
      login, logout, checkAuth, isFeatureEnabled,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
