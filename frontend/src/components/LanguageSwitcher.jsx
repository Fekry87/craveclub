import { useTranslation } from 'react-i18next';

export function LanguageSwitcher({ compact = false }) {
  const { i18n, t } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const toggle = () => {
    i18n.changeLanguage(isArabic ? 'en' : 'ar');
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        title={t('language.switch')}
        style={{
          background: 'rgba(34,211,238,0.06)',
          border: '1px solid rgba(34,211,238,0.1)',
          borderRadius: 10,
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          gap: 4,
          transition: 'all 0.2s',
          color: '#94a3b8',
          fontSize: 12,
          fontWeight: 700,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(34,211,238,0.12)';
          e.currentTarget.style.borderColor = 'rgba(34,211,238,0.2)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(34,211,238,0.06)';
          e.currentTarget.style.borderColor = 'rgba(34,211,238,0.1)';
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={t('language.switch')}
      style={{
        background: 'rgba(34,211,238,0.06)',
        border: '1px solid rgba(34,211,238,0.1)',
        borderRadius: 10,
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        gap: 6,
        transition: 'all 0.2s',
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(34,211,238,0.12)';
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(34,211,238,0.06)';
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.1)';
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
      {isArabic ? 'EN' : 'ع'}
    </button>
  );
}
