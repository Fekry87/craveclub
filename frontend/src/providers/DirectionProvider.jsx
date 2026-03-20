import { createContext, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const DirectionContext = createContext({
  direction: 'ltr',
  isRtl: false,
});

export function useDirection() {
  return useContext(DirectionContext);
}

export function DirectionProvider({ children }) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const direction = isRtl ? 'rtl' : 'ltr';

  // Update document direction and lang on language change
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = i18n.language;
    // Update font family on body
    document.body.style.fontFamily = isRtl
      ? "'IBM Plex Sans Arabic', 'Tajawal', 'DM Sans', sans-serif"
      : "'DM Sans', 'Outfit', sans-serif";
  }, [direction, i18n.language, isRtl]);

  return (
    <DirectionContext.Provider value={{ direction, isRtl }}>
      {children}
    </DirectionContext.Provider>
  );
}
