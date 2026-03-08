import { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext({});

export function ThemeProvider({ children }) {
  const { user, corporate } = useAuth();

  useEffect(() => {
    const root = document.documentElement;

    if (user?.role === 'PLATFORM_ADMIN') {
      // Apply corporate branding
      root.style.setProperty('--theme-primary', corporate?.primary_color || '#8b5cf6');
      root.style.setProperty('--theme-secondary', corporate?.secondary_color || '#22d3ee');
      root.style.setProperty('--theme-accent', '#a78bfa');
    } else if (user?.club) {
      // Apply club branding
      const club = user.club;
      root.style.setProperty('--theme-primary', club.primary_color || club.theme_color || '#22d3ee');
      root.style.setProperty('--theme-secondary', club.secondary_color || '#06b6d4');
      root.style.setProperty('--theme-accent', club.accent_color || '#2dd4bf');
    } else {
      // Default theme
      root.style.setProperty('--theme-primary', '#22d3ee');
      root.style.setProperty('--theme-secondary', '#06b6d4');
      root.style.setProperty('--theme-accent', '#2dd4bf');
    }
  }, [user, corporate]);

  return (
    <ThemeContext.Provider value={{}}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
