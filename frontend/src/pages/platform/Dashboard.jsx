import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarColor } from '../../components/CrudTable';

function WelcomeHero({ user }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = user?.name?.split(' ')[0] || 'Admin';

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(13,31,60,0.85) 0%, rgba(139,92,246,0.08) 50%, rgba(13,31,60,0.65) 100%)',
      borderRadius: 22, padding: '36px 40px',
      border: '1px solid rgba(139,92,246,0.1)',
      position: 'relative', overflow: 'hidden', marginBottom: 28,
      animation: 'fadeInUp 0.5s ease-out',
      boxShadow: '0 2px 12px rgba(0,0,0,0.15), 0 0 40px rgba(139,92,246,0.03)',
    }}>
      <div style={{ position: 'absolute', top: -40, right: -20, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -30, right: 80, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 10%, rgba(139,92,246,0.2) 50%, transparent 90%)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ color: '#a78bfa', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          Platform Admin
        </div>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 30, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          {greeting}, <span style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{firstName}</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Overview of all clubs and platform metrics</p>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, delay = 0 }) {
  const c = { violet: { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.12)', glow: 'rgba(139,92,246,0.15)', gradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' }, cyan: { bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.12)', glow: 'rgba(34,211,238,0.15)', gradient: 'linear-gradient(135deg, #22d3ee, #06b6d4)' }, teal: { bg: 'rgba(45,212,191,0.08)', border: 'rgba(45,212,191,0.12)', glow: 'rgba(45,212,191,0.15)', gradient: 'linear-gradient(135deg, #2dd4bf, #14b8a6)' } }[color] || { bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.12)', glow: 'rgba(34,211,238,0.15)', gradient: 'linear-gradient(135deg, #22d3ee, #06b6d4)' };
  return (
    <div onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${c.glow}, 0 4px 16px rgba(0,0,0,0.2)`; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)'; }}
      style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)', borderRadius: 18, padding: '24px 26px', border: `1px solid ${c.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', overflow: 'hidden', animation: `fadeInUp 0.5s ease-out ${delay}s both` }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c.gradient, opacity: 0.6, borderRadius: '18px 18px 0 0' }} />
      <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${c.bg} 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{title}</div>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      </div>
      <div style={{ color: '#f1f5f9', fontSize: 34, fontWeight: 700, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function ClubCard({ club, index }) {
  const ac = getAvatarColor(club.name);
  const initials = club.name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?';
  return (
    <div onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.15)'; e.currentTarget.style.transform = 'translateX(4px)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.06)'; e.currentTarget.style.transform = 'translateX(0)'; }}
      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)', borderRadius: 14, border: '1px solid rgba(34,211,238,0.06)', transition: 'all 0.25s ease', animation: `fadeInUp 0.4s ease-out ${0.1 + index * 0.06}s both` }}>
      <div style={{ width: 46, height: 46, borderRadius: 13, background: ac.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: ac.text, flexShrink: 0, boxShadow: '0 3px 10px rgba(0,0,0,0.25)' }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.name}</div>
        <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{club.slug}</div>
      </div>
      {club.contact_email && <div style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.08)', color: '#94a3b8', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{club.contact_email}</div>}
    </div>
  );
}

export default function PlatformDashboard() {
  const [metrics, setMetrics] = useState(null);
  const { user } = useAuth();
  useEffect(() => { api.get('/platform/metrics').then(r => setMetrics(r.data)).catch(() => {}); }, []);

  if (!metrics) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#64748b' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}><circle cx="12" cy="12" r="10" fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="3" /><path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" /></svg>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Loading dashboard...</div>
      </div>
    </div>
  );

  return (
    <div>
      <WelcomeHero user={user} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <MetricCard title="Total Clubs" value={metrics.total_clubs} color="violet" delay={0.05} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
        <MetricCard title="Total Users" value={metrics.total_users} color="cyan" delay={0.1} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        <MetricCard title="Club Managers" value={metrics.total_managers} color="teal" delay={0.15} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
      </div>

      <div style={{ background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)', borderRadius: 18, padding: '24px 26px', border: '1px solid rgba(34,211,238,0.06)', animation: 'fadeInUp 0.5s ease-out 0.25s both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>
          </div>
          <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: 18, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Recent Clubs</h2>
          <div style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 8, background: 'rgba(139,92,246,0.06)', color: '#64748b', fontSize: 12, fontWeight: 500 }}>{metrics.recent_clubs?.length || 0} clubs</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {metrics.recent_clubs?.length > 0 ? metrics.recent_clubs.map((club, i) => <ClubCard key={club.id} club={club} index={i} />) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}><div style={{ fontSize: 14, fontWeight: 500 }}>No clubs yet</div></div>
          )}
        </div>
      </div>
    </div>
  );
}
