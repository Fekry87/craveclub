import { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext({});

const DEFAULT_PRIMARY = '#0071e3';
const DEFAULT_SECONDARY = '#0062c3';

/** DB may store hex with or without '#' */
function normalize(raw, fallback) {
  if (!raw) return fallback;
  return raw.startsWith('#') ? raw : `#${raw}`;
}

export function ThemeProvider({ children }) {
  const { user, corporate } = useAuth();

  useEffect(() => {
    const root = document.documentElement;

    if (user?.role === 'PLATFORM_ADMIN') {
      root.style.setProperty('--theme-primary', normalize(corporate?.primary_color, DEFAULT_PRIMARY));
      root.style.setProperty('--theme-secondary', normalize(corporate?.secondary_color, DEFAULT_SECONDARY));
      root.style.setProperty('--theme-accent', normalize(corporate?.primary_color, DEFAULT_PRIMARY));
    } else if (user?.club) {
      const club = user.club;
      root.style.setProperty('--theme-primary', normalize(club.primary_color || club.theme_color, DEFAULT_PRIMARY));
      root.style.setProperty('--theme-secondary', normalize(club.secondary_color, DEFAULT_SECONDARY));
      root.style.setProperty('--theme-accent', normalize(club.accent_color || club.primary_color, DEFAULT_PRIMARY));
    } else {
      root.style.setProperty('--theme-primary', DEFAULT_PRIMARY);
      root.style.setProperty('--theme-secondary', DEFAULT_SECONDARY);
      root.style.setProperty('--theme-accent', DEFAULT_PRIMARY);
    }
  }, [user, corporate]);

  return (
    <ThemeContext.Provider value={{}}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
