import { useIsMobile } from './hooks';
import { inputStyle, inputFocusProps } from './styles';
import { useTranslation } from 'react-i18next';

const PAGE_DESCRIPTIONS = {
  'Clubs': 'Manage registered clubs and their settings',
  'Coaches': 'Add and manage coaching staff',
  'Swimmers': 'Manage swimmer profiles and records',
  'Groups': 'Organize swimmers into training groups',
  'Branches': 'Manage club branch locations and features',
  'My Groups': 'View your assigned training groups',
  'Training Plans': 'Create and manage training plans',
  'Skills Library': 'Build your skill assessment catalog',
  'Sessions': 'Schedule and manage training sessions',
  'My Sessions': 'View your training schedule',
  'Schedules': 'Create repeating schedules and generate sessions',
  'Club Settings': 'Configure your club preferences',
  'Settings': 'Configure your preferences',
  'Daily Training': 'Record daily attendance and evaluations',
  'My Evaluations': 'Track your performance evaluations',
  'My Stats': 'View your performance statistics',
  'Dashboard': 'Overview of your club activity',
  'Analytics': 'Club performance overview',
  'Registrations': 'Manage incoming swimmer registrations',
  'Subscriptions': 'Manage subscription plans and pricing',
  'Club Management': 'Manage registered clubs and their settings',
  'Platform Settings': 'Configure your platform preferences',
  'Sport Modules': 'Manage available sport modules',
  'Branding': 'Customize your club identity, colors, and assets',
};

function SearchInput({ value, onChange, placeholder, height = 40 }) {
  return (
    <div style={{ position: 'relative' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#86868B" strokeWidth="2" strokeLinecap="round"
        style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
      <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Search...'}
        style={{ ...inputStyle, height, borderRadius: 11, background: '#F2F2F7', border: '1px solid transparent', padding: '0 12px', paddingInlineStart: 34 }}
        onFocus={e => { e.target.style.background = '#FFFFFF'; inputFocusProps.onFocus(e); }}
        onBlur={e => { e.target.style.background = '#F2F2F7'; e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  );
}

/**
 * Page header: large bold title + grey description, actions on the trailing side.
 */
export function PageHeader({ title, search, onSearch, searchPlaceholder, children }) {
  const { t } = useTranslation();
  const description = t(`pageDescriptions.${title}`, PAGE_DESCRIPTIONS[title] || '');
  const mobile = useIsMobile();

  return (
    <div className="page-header-wrapper" style={{ marginBottom: 22, animation: 'fadeIn 0.25s ease-out' }}>
      <div className="page-header-inner" style={{
        display: 'flex', flexDirection: mobile ? 'column' : 'row',
        alignItems: mobile ? 'stretch' : 'flex-end', justifyContent: 'space-between',
        gap: mobile ? 14 : 24,
      }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{
            margin: 0, fontSize: mobile ? 26 : 32, color: '#1D1D1F',
            fontFamily: 'var(--font-display)', fontWeight: 700,
            letterSpacing: '-0.02em', lineHeight: 1.1,
          }}>{title}</h1>
          {description && (
            <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6E6E73' }}>{description}</p>
          )}
        </div>

        {(onSearch !== undefined || children) && (
          <div style={{
            display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0,
            flexDirection: mobile ? 'column' : 'row', width: mobile ? '100%' : 'auto',
          }}>
            {onSearch !== undefined && (
              <div className="page-header-search" style={{ width: mobile ? '100%' : 260 }}>
                <SearchInput value={search} onChange={onSearch} placeholder={searchPlaceholder} />
              </div>
            )}
            {children && (
              <div className={`page-header-actions${mobile ? ' page-header-actions-mobile' : ''}`}
                style={{ display: 'flex', gap: 8, width: mobile ? '100%' : 'auto', flexDirection: mobile ? 'column' : 'row' }}>
                {mobile && <style>{`.page-header-actions-mobile > button, .page-header-actions-mobile > a, .page-header-actions-mobile > div > button { width: 100% !important; justify-content: center !important; }`}</style>}
                {children}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div style={{ maxWidth: 320, marginBottom: 20 }}>
      <SearchInput value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}
