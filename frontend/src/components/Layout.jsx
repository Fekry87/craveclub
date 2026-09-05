import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useSportModule } from '../contexts/SportModuleContext';
import { getStoredClubSlug } from '../api/axios';
import { RouteErrorBoundary } from './ErrorBoundary';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications';
import { LanguageSwitcher } from './LanguageSwitcher';

const CAPTION = { fontSize: 12, fontWeight: 500, color: '#6E6E73' };

function timeAgo(dateStr, t) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('time.now');
  if (mins < 60) return t('time.minutesShort', { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('time.hoursShort', { count: hrs });
  const days = Math.floor(hrs / 24);
  return t('time.daysShort', { count: days });
}

export function NotificationBell({ navigate, onDark = false }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(() => {
    getNotifications()
      .then(data => {
        setNotifications(data.notifications?.data?.slice(0, 5) || []);
        setUnreadCount(data.unread_count || 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
    } catch {}
  };

  const handleNotificationClick = (notif) => {
    if (!notif.read_at) handleMarkRead(notif.id);
    setOpen(false);
    const d = notif.data;
    if (d?.swimmer_id) navigate(`/club/swimmers`);
    else if (d?.session_id) navigate(`/club/sessions`);
    else if (d?.registration_id) navigate(`/club/registrations`);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`pl-icon-btn${onDark ? ' on-dark' : ''}`}
        aria-label={t('notifications.title')}
        style={{ position: 'relative', borderRadius: 18 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: -3, insetInlineEnd: -3, minWidth: 17, height: 17, borderRadius: 9,
            background: '#FF3B30', border: '2px solid #F5F5F7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, color: '#fff', padding: '0 3px',
          }}>{unreadCount > 9 ? '9+' : unreadCount}</div>
        )}
      </button>

      {open && (
        <div className="notification-dropdown" style={{
          position: 'absolute', top: 44, right: 0, width: 'min(340px, calc(100vw - 32px))', maxHeight: 420,
          background: '#FFFFFF', color: '#1D1D1F', borderRadius: 16,
          border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 16px 48px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)',
          zIndex: 100, overflow: 'hidden',
          animation: 'fadeInUp 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: '1px solid #E5E5EA',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>{t('notifications.title')}</span>
            {unreadCount > 0 && (
              <button type="button" onClick={handleMarkAllRead} style={{
                background: 'none', border: 'none', color: '#0071E3', cursor: 'pointer', padding: 0, fontSize: 12, fontWeight: 500,
              }}>{t('notifications.markAllRead')}</button>
            )}
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 340 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#6E6E73', fontSize: 13 }}>
                {t('notifications.noNotifications')}
              </div>
            ) : notifications.map((notif, i) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                onMouseEnter={e => { e.currentTarget.style.background = '#F5F5F7'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                style={{
                  padding: '12px 16px', cursor: 'pointer', transition: 'background 0.15s',
                  borderBottom: i < notifications.length - 1 ? '1px solid #F2F2F7' : 'none',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: 5,
                  background: notif.read_at ? '#E5E5EA' : '#0071E3',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#1D1D1F', fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{notif.title}</div>
                  <div style={{
                    color: '#515154', fontSize: 12, lineHeight: 1.4,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{notif.body}</div>
                  <div style={{ color: '#86868B', marginTop: 4, fontSize: 11 }}>{timeAgo(notif.created_at, t)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const allNavItems = {
  PLATFORM_ADMIN: [
    { to: '/corporate', label: 'nav.dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
    { to: '/corporate/clubs', label: 'nav.clubs', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { to: '/corporate/sport-modules', label: 'nav.sportModules', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zM8 12h8M12 8v8' },
    { to: '/corporate/settings', label: 'nav.settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ],
  CLUB_MANAGER: 'grouped', // Uses CLUB_MANAGER_NAV grouped structure below
  COACH: [
    { to: '/coach', label: 'nav.dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
    { to: '/coach/sessions', label: 'nav.sessions', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { to: '/coach/groups', label: 'nav.myGroups', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { to: '/coach/swimmers', label: 'nav.swimmers', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { to: '/coach/training-plans', label: 'nav.trainingPlans', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { to: '/coach/settings', label: 'nav.settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ],
  SWIMMER: [
    { to: '/swimmer/leaderboard', label: 'nav.leaderboard', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', feature: 'leaderboard' },
    { to: '/swimmer', label: 'nav.dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
    { to: '/swimmer/sessions', label: 'nav.sessions', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { to: '/swimmer/evaluations', label: 'nav.myEvaluations', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', feature: 'evaluations' },
  ],
};

const CLUB_MANAGER_NAV = [
  {
    section: 'sections.heroes',
    items: [
      { to: '/club/dashboard', label: 'nav.dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
      { to: '/club/coaches', label: 'nav.coaches', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
      { to: '/club/swimmers', label: 'nav.swimmers', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      { to: '/club/groups', label: 'nav.groups', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    ],
  },
  {
    section: 'sections.training',
    items: [
      { to: '/club/training-plans', label: 'nav.trainingPlans', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', feature: 'training_plans' },
      { to: '/club/skills', label: 'nav.skills', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', feature: 'skills' },
      { to: '/club/sessions', label: 'nav.sessions', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { to: '/club/schedules', label: 'nav.schedules', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    ],
  },
  {
    section: 'sections.business',
    items: [
      { to: '/club/registrations', label: 'nav.registrations', icon: 'M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 3a4 4 0 100 8 4 4 0 000-8zM20 8v6M23 11h-6' },
      { to: '/club/subscription-plans', label: 'nav.subscriptions', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', feature: 'subscription_plans' },
      { to: '/club/analytics', label: 'nav.analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
      { to: '/club/leaderboard', label: 'nav.leaderboard', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', feature: 'leaderboard' },
    ],
  },
  {
    section: 'sections.clubManagement',
    items: [
      { to: '/club/branches', label: 'nav.branches', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { to: '/club/branding', label: 'nav.branding', icon: 'M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.49 8.49l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.49-8.49l2.83-2.83' },
      { to: '/club/settings', label: 'nav.settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    ],
  },
];

function NavIcon({ d }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="#6E6E73" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, transition: 'stroke 0.15s' }}>
      <path d={d} />
    </svg>
  );
}

const navLinkStyle = ({ isActive }) => ({
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '8px 10px', margin: '1px 0',
  color: isActive ? '#1D1D1F' : '#3A3A3C',
  background: isActive ? 'rgba(0,0,0,0.07)' : 'transparent',
  textDecoration: 'none', fontSize: 13.5, fontWeight: isActive ? 600 : 500,
  borderRadius: 8, position: 'relative',
});

function BrandMark({ logo, name, size = 32, color }) {
  const r = Math.round(size * 0.28);
  if (logo) {
    return <img src={logo} alt={name} style={{ width: size, height: size, borderRadius: r, objectFit: 'cover', flexShrink: 0, background: '#fff' }} />;
  }
  const initials = (name || 'C').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: r, background: color || '#0071E3', color: '#fff', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size * 0.4, fontWeight: 600, letterSpacing: '-0.02em',
    }}>{initials}</div>
  );
}

export default function Layout() {
  const { t } = useTranslation();
  const { user, features, corporate, logout } = useAuth();
  const sportCtx = useSportModule();
  const currentSport = sportCtx?.currentSport;
  const clearSport = sportCtx?.clearSport;
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isClubManager = user?.role === 'CLUB_MANAGER';
  const showSportBreadcrumb = isClubManager && currentSport && location.pathname !== '/club';

  const isFeatureVisible = (item) => {
    if (!item.feature) return true;
    if (!features) return true;
    return features[`${item.feature}_enabled`] ?? true;
  };

  const isGroupedNav = user?.role === 'CLUB_MANAGER';
  const flatItems = isGroupedNav ? [] : (allNavItems[user?.role] || []).filter(isFeatureVisible);

  const isClubUser = user?.role !== 'PLATFORM_ADMIN' && user?.club;
  const brandName = isClubUser ? user.club.name : (corporate?.platform_name || 'CraveClubs');
  const brandTagline = isClubUser ? t('club.clubPortal') : (corporate?.tagline || t('corporate.managementPlatform'));
  const brandLogo = isClubUser ? user.club.logo_url : null;
  const brandColor = isClubUser ? (user.club.primary_color || user.club.theme_color) : null;
  const brandColorHex = brandColor ? (brandColor.startsWith('#') ? brandColor : `#${brandColor}`) : null;

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);
  useEffect(() => { document.title = brandName || 'CraveClubs'; }, [brandName]);
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 768) setSidebarOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    const isClubRole = user?.role !== 'PLATFORM_ADMIN';
    const clubSlug = user?.club?.slug || getStoredClubSlug();
    await logout();
    navigate(isClubRole && clubSlug ? `/portal/${clubSlug}` : '/login');
  };

  const renderLink = (item) => (
    <NavLink key={item.to} to={item.to} end={item.to.split('/').length <= 2}
      className={({ isActive }) => `nav-link${isActive ? ' active-nav' : ''}`}
      style={navLinkStyle}
    >
      <NavIcon d={item.icon} />
      <span>{t(item.label)}</span>
    </NavLink>
  );

  const sidebarSurface = {
    background: 'rgba(246,246,248,0.86)',
    backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F5F5F7', overflow: 'hidden' }}>
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="sidebar-overlay"
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.15s ease-out' }}
        />
      )}

      {/* Mobile top bar */}
      <div className="mobile-topbar" style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30,
        height: 60, padding: '0 14px',
        ...sidebarSurface,
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className="pl-icon-btn" aria-label="Menu" style={{ background: 'transparent', border: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {sidebarOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>}
          </svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <BrandMark logo={brandLogo} name={brandName} size={28} color={brandColorHex} />
          <span style={{ color: '#1D1D1F', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brandName}</span>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`} style={{
        width: 250, ...sidebarSurface, color: '#1D1D1F',
        borderRight: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column',
        flexShrink: 0, position: 'relative', overflowY: 'auto', overflowX: 'hidden',
        height: '100vh', zIndex: 50, transition: 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}>
        {/* Brand */}
        <div style={{ padding: '20px 16px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <BrandMark logo={brandLogo} name={brandName} size={36} color={brandColorHex} />
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#1D1D1F', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brandName}</div>
              <div style={{ ...CAPTION, fontSize: 11, marginTop: 1 }}>{brandTagline}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '4px 10px 10px', display: 'flex', flexDirection: 'column' }}>
          {isGroupedNav ? (
            CLUB_MANAGER_NAV.map((group, groupIndex) => {
              const visibleItems = group.items.filter(isFeatureVisible);
              if (visibleItems.length === 0) return null;
              return (
                <div key={group.section} style={{ marginTop: groupIndex > 0 ? 14 : 0 }}>
                  <div style={{ padding: '4px 10px 6px', fontSize: 11, fontWeight: 600, color: '#86868B', letterSpacing: '0.01em' }}>
                    {t(group.section)}
                  </div>
                  {visibleItems.map(renderLink)}
                </div>
              );
            })
          ) : (
            flatItems.map(renderLink)
          )}
        </nav>

        {/* Bottom: user + sign out */}
        <div style={{ padding: '10px 12px 14px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px 10px' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 17, background: '#E5E5EA', color: '#1D1D1F', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#1D1D1F', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ ...CAPTION, fontSize: 11 }}>{t(`roles.${user?.role}`, user?.role)}</div>
            </div>
          </div>
          <button type="button" onClick={handleLogout} className="pl-btn pl-btn-secondary pl-btn-sm" style={{ width: '100%', justifyContent: 'center', gap: 8, color: '#FF3B30' }}>
            <svg className="rtl-flip" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            {t('nav.signOut')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content" style={{
        flex: 1, display: 'flex', flexDirection: 'column', color: '#1D1D1F',
        background: '#F5F5F7',
        height: '100vh', overflow: 'hidden',
      }}>
        {/* Content header bar (fixed, does not scroll) */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 clamp(16px, 4vw, 32px)', height: 56, minHeight: 56,
          ...sidebarSurface,
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          flexShrink: 0, zIndex: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, fontSize: 13, color: '#6E6E73' }}>
            {showSportBreadcrumb ? (
              <>
                <button type="button"
                  onClick={() => { clearSport(); navigate('/club'); }}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#0071E3', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <svg className="rtl-flip" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                  {t('nav.home')}
                </button>
                <span style={{ color: '#AEAEB2' }}>/</span>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: currentSport.color || '#0071E3', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ color: '#1D1D1F', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentSport.name}</span>
              </>
            ) : (
              <span style={{ color: '#1D1D1F', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brandName}</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LanguageSwitcher compact />
            <NotificationBell navigate={navigate} />
          </div>
        </div>

        {/* Page content (scrollable) */}
        <div className="page-scroll-area" style={{ flex: 1, padding: '26px clamp(16px, 4vw, 32px) 40px', overflowY: 'auto' }}>
          <RouteErrorBoundary key={location.pathname}>
            <Outlet />
          </RouteErrorBoundary>
        </div>
      </main>
    </div>
  );
}
