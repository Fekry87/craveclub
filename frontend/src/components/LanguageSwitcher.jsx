import { useTranslation } from 'react-i18next';

export function LanguageSwitcher({ compact = false, onDark = false }) {
  const { i18n, t } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const toggle = () => {
    i18n.changeLanguage(isArabic ? 'en' : 'ar');
  };

  const cls = `pl-icon-btn${onDark ? ' on-dark' : ''}`;
  const label = isArabic ? 'EN' : 'ع';

  if (compact) {
    return (
      <button type="button" onClick={toggle} title={t('language.switch')} className={cls}
        style={{ fontSize: 12, fontWeight: 600, borderRadius: 18 }}>
        {label}
      </button>
    );
  }

  return (
    <button type="button" onClick={toggle} title={t('language.switch')} className={cls}
      style={{ width: 'auto', padding: '0 12px', gap: 8, fontSize: 12, fontWeight: 600 }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
      {label}
    </button>
  );
}
