import { useIsMobile } from './hooks';
import { inputStyle, inputFocusProps } from './styles';

const PAGE_ICONS = {
  'Dashboard': 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4',
  'Clubs': 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  'Coaches': 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  'Swimmers': 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  'Groups': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  'Branches': 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  'My Groups': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  'Training Plans': 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  'Skills Library': 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  'Sessions': 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  'My Sessions': 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  'Schedules': 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
  'Club Settings': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  'Settings': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  'Daily Training': 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  'My Evaluations': 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  'My Stats': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  'Analytics': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  'Registrations': 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  'Subscriptions': 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  'Club Management': 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  'Platform Settings': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  'Sport Modules': 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  'Branding': 'M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.49 8.49l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.49-8.49l2.83-2.83',
};

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

function getPortalAccent() {
  if (typeof window === 'undefined') return { main: '#22d3ee', rgb: '34,211,238' };
  const path = window.location.pathname;
  if (path.startsWith('/coach'))    return { main: '#2dd4bf', rgb: '45,212,191' };
  if (path.startsWith('/swimmer')) return { main: '#38bdf8', rgb: '56,189,248' };
  if (path.startsWith('/platform')) return { main: '#a78bfa', rgb: '167,139,250' };
  if (path.startsWith('/corporate')) return { main: '#a78bfa', rgb: '167,139,250' };
  return { main: '#22d3ee', rgb: '34,211,238' };
}

export function PageHeader({ title, search, onSearch, searchPlaceholder, children }) {
  const accent = getPortalAccent();
  const iconPath = PAGE_ICONS[title];
  const description = PAGE_DESCRIPTIONS[title];
  const isSettings = title === 'Club Settings' || title === 'Settings' || title === 'Platform Settings';
  const mobile = useIsMobile();

  return (
    <div className="page-header-wrapper" style={{ marginBottom: 20, animation: 'fadeInUp 0.4s ease-out' }}>
      <div style={{
        padding: mobile ? '18px 18px' : '20px 24px',
        borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(6,13,31,0.3) 100%)',
        border: `1px solid rgba(${accent.rgb},0.06)`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 120, height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${accent.rgb},0.06) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {mobile ? (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: (onSearch !== undefined || children) ? 14 : 0,
              position: 'relative',
            }}>
              {iconPath && (
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: `rgba(${accent.rgb},0.08)`, border: `1px solid rgba(${accent.rgb},0.1)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent.main} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={iconPath} />
                    {isSettings && <circle cx="12" cy="12" r="3" />}
                  </svg>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{
                  margin: 0, fontSize: 20, color: '#f1f5f9',
                  fontFamily: "'Outfit', sans-serif", fontWeight: 700,
                  letterSpacing: '-0.02em', lineHeight: 1.2,
                }}>{title}</h1>
                {description && (
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#526280', fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{description}</p>
                )}
              </div>
            </div>
            {onSearch !== undefined && (
              <div style={{ position: 'relative', marginBottom: children ? 10 : 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input type="text" value={search || ''} onChange={e => onSearch(e.target.value)}
                  placeholder={searchPlaceholder || 'Search...'}
                  style={{ ...inputStyle, paddingLeft: 36, borderRadius: 10, background: 'rgba(6,13,31,0.4)', border: '1px solid rgba(51,65,85,0.35)', fontSize: '0.8125rem', height: 40, padding: '0 0.875rem 0 2.25rem' }}
                  {...inputFocusProps}
                />
              </div>
            )}
            {children && (
              <div className="page-header-actions-mobile" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <style>{`.page-header-actions-mobile > button, .page-header-actions-mobile > div > button { width: 100% !important; justify-content: center !important; height: 42px !important; border-radius: 10px !important; font-size: 0.8125rem !important; }`}</style>
                {children}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              position: 'relative',
              marginBottom: onSearch !== undefined ? 14 : 0,
            }}>
              {iconPath && (
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `rgba(${accent.rgb},0.08)`, border: `1px solid rgba(${accent.rgb},0.1)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent.main} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={iconPath} />
                    {isSettings && <circle cx="12" cy="12" r="3" />}
                  </svg>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{
                  margin: 0, fontSize: 22, color: '#f1f5f9',
                  fontFamily: "'Outfit', sans-serif", fontWeight: 700,
                  letterSpacing: '-0.02em', lineHeight: 1.2,
                }}>{title}</h1>
                {description && (
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: '#526280', fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{description}</p>
                )}
              </div>
              {children && (
                <div style={{ flexShrink: 0, display: 'flex', gap: 8 }}>{children}</div>
              )}
            </div>
            {onSearch !== undefined && (
              <div style={{ position: 'relative' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input type="text" value={search || ''} onChange={e => onSearch(e.target.value)}
                  placeholder={searchPlaceholder || 'Search...'}
                  style={{ ...inputStyle, paddingLeft: 40, borderRadius: 12, background: 'rgba(6,13,31,0.4)', border: '1px solid rgba(51,65,85,0.35)', fontSize: '0.8125rem', height: 42, padding: '0 0.875rem 0 2.5rem' }}
                  {...inputFocusProps}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div style={{ position: 'relative', maxWidth: 320, marginBottom: 20 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"
        style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle, paddingLeft: 40 }}
        {...inputFocusProps}
      />
    </div>
  );
}
