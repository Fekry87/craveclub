import { createContext, useContext, useState, useEffect } from 'react';

const SportModuleContext = createContext(null);

const STORAGE_KEY = 'current_sport_module';

export function SportModuleProvider({ children }) {
  const [currentSport, setCurrentSport] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setSport = (module) => {
    setCurrentSport(module);
    if (module) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(module));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearSport = () => {
    setCurrentSport(null);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <SportModuleContext.Provider value={{ currentSport, setSport, clearSport }}>
      {children}
    </SportModuleContext.Provider>
  );
}

export const useSportModule = () => useContext(SportModuleContext);
