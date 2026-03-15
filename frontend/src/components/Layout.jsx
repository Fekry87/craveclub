import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSportModule } from '../contexts/SportModuleContext';
import { getStoredClubSlug } from '../api/axios';
import { RouteErrorBoundary } from './ErrorBoundary';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `${mins}د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}س`;
  const days = Math.floor(hrs / 24);
  return `${days}ي`;
}

function NotificationBell({ navigate }) {
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
        style={{
          background: open ? 'rgba(34,211,238,0.12)' : 'rgba(34,211,238,0.06)',
          border: `1px solid ${open ? 'rgba(34,211,238,0.2)' : 'rgba(34,211,238,0.1)'}`,
          borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16,
            borderRadius: 8, background: '#ef4444', border: '2px solid #0a1628',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, color: '#fff', padding: '0 3px',
          }}>{unreadCount > 9 ? '9+' : unreadCount}</div>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 44, right: 0, width: 320, maxHeight: 400,
          background: 'linear-gradient(180deg, #0d1f3c 0%, #0a1628 100%)',
          border: '1px solid rgba(34,211,238,0.12)', borderRadius: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden',
          animation: 'fadeInUp 0.2s ease-out',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: '1px solid rgba(51,65,85,0.2)',
          }}>
            <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>الإشعارات</span>
            {unreadCount > 0 && (
              <button type="button" onClick={handleMarkAllRead} style={{
                background: 'none', border: 'none', color: '#22d3ee', fontSize: 11,
                fontWeight: 600, cursor: 'pointer', padding: '2px 6px',
              }}>قراءة الكل</button>
            )}
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 320 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#475569', fontSize: 13 }}>
                لا توجد إشعارات
              </div>
            ) : notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                style={{
                  padding: '10px 16px', cursor: 'pointer', transition: 'background 0.15s',
                  borderBottom: '1px solid rgba(51,65,85,0.1)',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: 5,
                  background: notif.read_at ? 'transparent' : '#22d3ee',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{notif.title}</div>
                  <div style={{
                    color: '#94a3b8', fontSize: 11, lineHeight: 1.4,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{notif.body}</div>
                  <div style={{ color: '#475569', fontSize: 10, marginTop: 3 }}>{timeAgo(notif.created_at)}</div>
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
    { to: '/corporate', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
    { to: '/corporate/clubs', label: 'Clubs', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { to: '/corporate/sport-modules', label: 'Sport Modules', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zM8 12h8M12 8v8' },
    { to: '/corporate/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ],
  CLUB_MANAGER: [
    { to: '/club', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
    { to: '/club/coaches', label: 'Coaches', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { to: '/club/swimmers', label: 'Swimmers', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { to: '/club/groups', label: 'Groups', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { to: '/club/branches', label: 'Branches', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { to: '/club/training-plans', label: 'Training Plans', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', feature: 'training_plans' },
    { to: '/club/skills', label: 'Skills', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', feature: 'skills' },
    { to: '/club/sessions', label: 'Sessions', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { to: '/club/schedules', label: 'Schedules', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    { to: '/club/registrations', label: 'Registrations', icon: 'M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 3a4 4 0 100 8 4 4 0 000-8zM20 8v6M23 11h-6' },
    { to: '/club/subscription-plans', label: 'Subscriptions', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', feature: 'subscription_plans' },
    { to: '/club/analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { to: '/club/leaderboard', label: 'Leaderboard', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', feature: 'leaderboard' },
    { to: '/club/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ],
  COACH: [
    { to: '/coach', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
    { to: '/coach/sessions', label: 'Sessions', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { to: '/coach/groups', label: 'My Groups', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { to: '/coach/swimmers', label: 'Swimmers', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { to: '/coach/training-plans', label: 'Training Plans', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { to: '/coach/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ],
  SWIMMER: [
    { to: '/swimmer/leaderboard', label: 'Leaderboard', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', feature: 'leaderboard' },
    { to: '/swimmer', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
    { to: '/swimmer/sessions', label: 'Sessions', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { to: '/swimmer/evaluations', label: 'Evaluations', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', feature: 'evaluations' },
  ],
};

function NavIcon({ d, active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={active ? 'var(--theme-primary, #22d3ee)' : '#64748b'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, transition: 'stroke 0.2s ease' }}>
      <path d={d} />
    </svg>
  );
}

const roleLabels = {
  PLATFORM_ADMIN: 'Corporate Admin',
  CLUB_MANAGER: 'Club Manager',
  COACH: 'Coach',
  SWIMMER: 'Swimmer',
};

export default function Layout() {
  const { user, features, corporate, logout } = useAuth();
  const sportCtx = useSportModule();
  const currentSport = sportCtx?.currentSport;
  const clearSport = sportCtx?.clearSport;
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isClubManager = user?.role === 'CLUB_MANAGER';
  const showSportBreadcrumb = isClubManager && currentSport && location.pathname !== '/club';

  // Filter nav items by enabled features
  const items = (allNavItems[user?.role] || []).filter(item => {
    if (!item.feature) return true; // Always show items without feature gate
    if (!features) return true; // Platform admin or features not loaded
    return features[`${item.feature}_enabled`] ?? true;
  }).map(item => {
    // Club manager: Dashboard nav item points to sport picker or dashboard
    if (isClubManager && item.to === '/club') {
      return currentSport
        ? { ...item, to: '/club/dashboard', label: 'Dashboard' }
        : { ...item, to: '/club', label: 'Sports' };
    }
    return item;
  });

  // Dynamic branding: club users see club name, corporate users see platform name
  const isClubUser = user?.role !== 'PLATFORM_ADMIN' && user?.club;
  const brandName = isClubUser ? user.club.name : (corporate?.platform_name || 'CraveClubs');
  const brandTagline = isClubUser ? 'Club Portal' : (corporate?.tagline || 'Management Platform');
  const brandLogo = isClubUser ? user.club.logo_url : null;

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);
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

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#060d1f', overflow: 'hidden' }}>
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="sidebar-overlay"
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(3,8,18,0.7)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease-out' }}
        />
      )}

      {/* Mobile top bar */}
      <div className="mobile-topbar" style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30,
        height: 60, padding: '0 16px',
        background: 'linear-gradient(180deg, #0a1628 0%, #0d1f3c 100%)',
        borderBottom: '1px solid rgba(34,211,238,0.08)',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.12)', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--theme-primary, #22d3ee)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {sidebarOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>}
          </svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #163060 0%, #122347 100%)', border: '1px solid rgba(34,211,238,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--theme-primary, #22d3ee)' }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{user?.name}</span>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, rgba(34,211,238,0.15) 0%, rgba(6,182,212,0.08) 100%)', border: '1px solid rgba(34,211,238,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><path d="M4 20C6.5 17 9 22 12 18C15 14 17 22 20 18C23 14 25.5 20 28 17" stroke="var(--theme-primary, #22d3ee)" strokeWidth="2.5" strokeLinecap="round"/></svg>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`} style={{
        width: 260, background: 'linear-gradient(180deg, #0a1628 0%, #0d1f3c 100%)',
        borderRight: '1px solid rgba(34,211,238,0.08)', display: 'flex', flexDirection: 'column',
        flexShrink: 0, position: 'relative', overflowY: 'auto', overflowX: 'hidden',
        height: '100vh', zIndex: 50, transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 200, height: 120, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(34,211,238,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* User info */}
        <div style={{ padding: '24px 22px 18px', borderBottom: '1px solid rgba(34,211,238,0.06)', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, rgba(34,211,238,0.15) 0%, rgba(6,182,212,0.08) 100%)', border: '1px solid rgba(34,211,238,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--theme-primary, #22d3ee)', flexShrink: 0 }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#94a3b8', fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em' }}>{user?.name}</div>
              <div style={{ color: '#475569', fontSize: 9, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{roleLabels[user?.role] || user?.role}</div>
            </div>
            <NotificationBell navigate={navigate} />
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {items.map((item, i) => (
            <NavLink key={item.to} to={item.to} end={item.to.split('/').length <= 2}
              className={({ isActive }) => `nav-link${isActive ? ' active-nav' : ''}`}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', color: isActive ? '#e2e8f0' : '#94a3b8',
                background: isActive ? 'linear-gradient(135deg, rgba(34,211,238,0.1) 0%, rgba(6,182,212,0.05) 100%)' : 'transparent',
                textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 600 : 400,
                borderRadius: 10, border: isActive ? '1px solid rgba(34,211,238,0.12)' : '1px solid transparent',
                animation: `slideInLeft 0.3s ease-out ${i * 0.04}s both`,
                position: 'relative', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden',
              })}
            >
              <NavIcon d={item.icon} active={false} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom: Platform branding + Sign out */}
        <div style={{ padding: '0 14px 14px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 12px', borderTop: '1px solid rgba(34,211,238,0.06)', marginBottom: 10, position: 'relative' }}>
            <div style={{ position: 'absolute', top: -1, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.1), transparent)', pointerEvents: 'none' }} />
            {brandLogo ? (
              <img src={brandLogo} alt={brandName} style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(34,211,238,0.2)', flexShrink: 0 }} />
            ) : isClubUser ? (
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${user.club.primary_color || user.club.theme_color || 'var(--theme-primary, #22d3ee)'}, ${user.club.secondary_color || 'var(--theme-secondary, #06b6d4)'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff' }}>
                {brandName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            ) : (
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, rgba(34,211,238,0.15) 0%, rgba(6,182,212,0.08) 100%)', border: '1px solid rgba(34,211,238,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                  <path d="M4 20C6.5 17 9 22 12 18C15 14 17 22 20 18C23 14 25.5 20 28 17" stroke="var(--theme-primary, #22d3ee)" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M4 24C6.5 21 9 26 12 22C15 18 17 26 20 22C23 18 25.5 24 28 21" stroke="var(--theme-secondary, #06b6d4)" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                </svg>
              </div>
            )}
            <div>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", color: '#94a3b8', margin: 0, fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>{brandName}</h2>
              <div style={{ color: '#475569', fontSize: 9, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{brandTagline}</div>
            </div>
          </div>

          <button onClick={handleLogout}
            onMouseEnter={e => { e.target.style.background = 'rgba(244,63,94,0.15)'; e.target.style.borderColor = 'rgba(244,63,94,0.3)'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(244,63,94,0.06)'; e.target.style.borderColor = 'rgba(244,63,94,0.15)'; }}
            style={{
              width: '100%', padding: '9px 14px', background: 'rgba(244,63,94,0.06)',
              color: '#fda4af', border: '1px solid rgba(244,63,94,0.15)',
              borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content" style={{
        flex: 1, padding: '28px 32px', overflowY: 'auto', color: '#e2e8f0',
        background: 'radial-gradient(ellipse at 0% 0%, rgba(13,31,60,0.4) 0%, transparent 50%), #060d1f',
        height: '100vh',
      }}>
        {showSportBreadcrumb && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, animation: 'fadeInUp 0.3s ease-out' }}>
            <button
              onClick={() => { clearSport(); navigate('/club', { state: { forceShow: true } }); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(51,65,85,0.15)', border: '1px solid rgba(51,65,85,0.25)',
                borderRadius: 8, padding: '5px 12px', color: '#94a3b8', fontSize: 13,
                fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.15)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
              الأنشطة
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: currentSport.color || '#8b5cf6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {currentSport.icon ? currentSport.icon.charAt(0).toUpperCase() : '?'}
              </div>
              <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                {currentSport.name}
              </span>
            </div>
          </div>
        )}
        <RouteErrorBoundary key={location.pathname}>
          <Outlet />
        </RouteErrorBoundary>
      </main>
    </div>
  );
}
