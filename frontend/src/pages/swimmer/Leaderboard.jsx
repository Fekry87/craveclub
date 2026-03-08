import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { PageHeader, useIsMobile } from '../../components/CrudTable';

/* ═══ Animated counter ═══ */
function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef();
  useEffect(() => {
    if (value == null) return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);
  return <span>{display.toLocaleString()}</span>;
}

/* ═══ Tier icons ═══ */
const TIER_ICONS = {
  1: (s = 24) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="18" rx="10" ry="8" fill="#CD7F32" opacity="0.85"/>
      <ellipse cx="16" cy="17" rx="8" ry="6.5" fill="#D4944A"/>
      <circle cx="12" cy="15" r="2" fill="#fff" opacity="0.9"/><circle cx="12" cy="15" r="1" fill="#1e293b"/>
      <circle cx="20" cy="15" r="2" fill="#fff" opacity="0.9"/><circle cx="20" cy="15" r="1" fill="#1e293b"/>
      <path d="M13 20c1.5 1 3.5 1 5 0" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    </svg>
  ),
  2: (s = 24) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="17" rx="9" ry="7" fill="#C0C0C0" opacity="0.8"/>
      <ellipse cx="16" cy="16" rx="7.5" ry="5.5" fill="#D4D4D8"/>
      <circle cx="12" cy="14.5" r="1.8" fill="#fff" opacity="0.9"/><circle cx="12" cy="14.5" r="0.9" fill="#1e293b"/>
      <circle cx="20" cy="14.5" r="1.8" fill="#fff" opacity="0.9"/><circle cx="20" cy="14.5" r="0.9" fill="#1e293b"/>
      <path d="M14 19c1 .8 3 .8 4 0" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
    </svg>
  ),
  3: (s = 24) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <path d="M6 17c2-3 5-5 10-5s8 2 10 5c0 4-4 8-10 8s-10-4-10-8z" fill="#FFD700" opacity="0.85"/>
      <ellipse cx="16" cy="16" rx="8" ry="6" fill="#FBBF24"/>
      <circle cx="11" cy="14.5" r="2" fill="#fff" opacity="0.9"/><circle cx="11" cy="14.5" r="1" fill="#1e293b"/>
      <circle cx="21" cy="14.5" r="2" fill="#fff" opacity="0.9"/><circle cx="21" cy="14.5" r="1" fill="#1e293b"/>
    </svg>
  ),
  4: (s = 24) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="18" rx="11" ry="8" fill="#7DD3FC" opacity="0.8"/>
      <ellipse cx="16" cy="17" rx="9" ry="6.5" fill="#93C5FD"/>
      <ellipse cx="10" cy="15" rx="2.5" ry="3" fill="#fff" opacity="0.85"/><circle cx="10" cy="14.5" r="1.2" fill="#1e293b"/>
      <ellipse cx="22" cy="15" rx="2.5" ry="3" fill="#fff" opacity="0.85"/><circle cx="22" cy="14.5" r="1.2" fill="#1e293b"/>
    </svg>
  ),
  5: (s = 24) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <path d="M16 4c-5 0-9 5-9 9 0 3 2 5 4 7l-3 5c0 0 3 3 8 3s8-3 8-3l-3-5c2-2 4-4 4-7 0-4-4-9-9-9z" fill="#A78BFA" opacity="0.85"/>
      <ellipse cx="16" cy="14" rx="7" ry="5.5" fill="#B49BFA"/>
      <circle cx="12" cy="13" r="2" fill="#fff" opacity="0.9"/><circle cx="12" cy="13" r="1" fill="#1e293b"/>
      <circle cx="20" cy="13" r="2" fill="#fff" opacity="0.9"/><circle cx="20" cy="13" r="1" fill="#1e293b"/>
    </svg>
  ),
};

/* ═══ Inject keyframes (only leaderboard-specific ones) ═══ */
const STYLES_ID = 'leaderboard-kf';
function injectStyles() {
  if (document.getElementById(STYLES_ID)) return;
  const s = document.createElement('style');
  s.id = STYLES_ID;
  s.textContent = `
    @keyframes lb-pulse { 0%,100% { opacity:.4; transform:scale(1); } 50% { opacity:1; transform:scale(1.06); } }
    @keyframes lb-crown { 0%,100% { transform:translateY(0) rotate(-1deg); } 50% { transform:translateY(-4px) rotate(1deg); } }
    @keyframes lb-bar { from { width:0%; } }
    @keyframes lb-glow { 0%,100% { opacity:.3; } 50% { opacity:.8; } }
    @keyframes lb-shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
    .lb-scroll::-webkit-scrollbar { width: 4px; }
    .lb-scroll::-webkit-scrollbar-track { background: transparent; }
    .lb-scroll::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.15); border-radius: 4px; }
    .lb-scroll::-webkit-scrollbar-thumb:hover { background: rgba(56,189,248,0.3); }
  `;
  document.head.appendChild(s);
}

/* ═══════════════════════════════════════════════════════════
   PODIUM COLUMN — top-3 swimmer with crown/medal + pedestal
   ═══════════════════════════════════════════════════════════ */
function PodiumColumn({ entry, rank, isMobile }) {
  const isChamp = rank === 1;
  const avatarSize = isChamp ? (isMobile ? 58 : 76) : (isMobile ? 42 : 56);
  const tierIcon = TIER_ICONS[entry.level] || TIER_ICONS[1];
  const podiumH = { 1: isMobile ? 68 : 100, 2: isMobile ? 44 : 64, 3: isMobile ? 30 : 48 }[rank];
  const mc = {
    1: { bg: '#FFD700', rgb: '255,215,0' },
    2: { bg: '#C0C0C0', rgb: '192,192,192' },
    3: { bg: '#CD7F32', rgb: '205,127,50' },
  }[rank];
  const displayName = entry.is_current_user
    ? (entry.full_name || `${entry.first_name} ${entry.last_initial}`)
    : `${entry.first_name} ${entry.last_initial}`;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      flex: isChamp ? '1.3' : '1', order: { 1: 2, 2: 1, 3: 3 }[rank],
      animation: `fadeInUp 0.6s ease-out ${rank === 1 ? '0.1s' : rank === 2 ? '0.2s' : '0.3s'} both`,
    }}>
      {/* Crown for 1st only */}
      {isChamp && (
        <div style={{ height: isMobile ? 30 : 36, display: 'flex', alignItems: 'flex-end', marginBottom: isMobile ? 4 : 6 }}>
          <svg width={isMobile ? 30 : 40} height={isMobile ? 24 : 34} viewBox="0 0 44 30" fill="none"
            style={{ animation: 'lb-crown 3s ease-in-out infinite', filter: 'drop-shadow(0 2px 8px rgba(255,215,0,0.35))' }}>
            <path d="M2 26L7 8l7 6 8-14 8 14 7-6 5 18H2z" fill="url(#cg)"/>
            <circle cx="7" cy="8" r="2.5" fill="#FDE68A"/><circle cx="22" cy="0" r="3" fill="#FDE68A"/><circle cx="37" cy="8" r="2.5" fill="#FDE68A"/>
            <defs><linearGradient id="cg" x1="2" y1="0" x2="42" y2="26"><stop stopColor="#FFD700"/><stop offset="1" stopColor="#F59E0B"/></linearGradient></defs>
          </svg>
        </div>
      )}

      {/* Avatar */}
      <div style={{ position: 'relative', marginBottom: isMobile ? 6 : 10 }}>
        {isChamp && (
          <div style={{
            position: 'absolute', inset: -6, borderRadius: '50%',
            border: `2px solid rgba(${mc.rgb},0.18)`,
            animation: 'lb-pulse 2.5s ease-in-out infinite',
          }} />
        )}
        <div style={{
          width: avatarSize, height: avatarSize, borderRadius: '50%',
          background: `linear-gradient(145deg, ${entry.level_color}40, ${entry.level_color}15)`,
          border: `2.5px solid rgba(${mc.rgb},0.4)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: avatarSize * 0.38, fontWeight: 800, color: '#f1f5f9',
          fontFamily: "'Outfit', sans-serif",
          boxShadow: isChamp ? `0 6px 24px rgba(${mc.rgb},0.2)` : `0 3px 12px rgba(0,0,0,0.2)`,
        }}>
          {entry.first_name?.charAt(0)?.toUpperCase()}
        </div>
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: isChamp ? 24 : 20, height: isChamp ? 24 : 20, borderRadius: 6,
          background: 'rgba(6,13,31,0.9)', border: `1px solid ${entry.level_color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{tierIcon(isChamp ? 16 : 13)}</div>
      </div>

      {/* Name + XP — single horizontal line */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: isChamp ? 8 : 5,
        marginBottom: isMobile ? 4 : 6,
      }}>
        <span style={{
          color: entry.is_current_user ? '#f8fafc' : '#e2e8f0',
          fontSize: isChamp ? (isMobile ? 13 : 16) : (isMobile ? 11 : 13),
          fontWeight: 700, fontFamily: "'Outfit', sans-serif",
          maxWidth: isMobile ? 72 : 110,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{displayName}</span>
        <span style={{
          fontSize: isChamp ? (isMobile ? 17 : 22) : (isMobile ? 13 : 16),
          fontWeight: 900, fontFamily: "'Outfit', sans-serif",
          background: `linear-gradient(135deg, ${mc.bg}, #e2e8f0)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          lineHeight: 1, flexShrink: 0,
        }}>
          <AnimatedNumber value={entry.total_xp} duration={1200} />
          <span style={{ fontSize: isChamp ? (isMobile ? 8 : 9) : (isMobile ? 7 : 8), opacity: 0.7 }}> XP</span>
        </span>
      </div>

      {/* Podium pedestal */}
      <div style={{
        width: '100%', height: podiumH,
        borderRadius: '14px 14px 0 0',
        background: `linear-gradient(180deg, rgba(${mc.rgb},0.15) 0%, rgba(${mc.rgb},0.04) 100%)`,
        border: `1px solid rgba(${mc.rgb},0.1)`, borderBottom: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg, transparent, rgba(${mc.rgb},0.35), transparent)` }} />
        <span style={{ fontSize: isChamp ? (isMobile ? 36 : 48) : (isMobile ? 24 : 32), fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: `rgba(${mc.rgb},0.05)`, userSelect: 'none' }}>{rank}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RANK ROW — 4th/5th place + "Your Position"
   ═══════════════════════════════════════════════════════════ */
function RankRow({ entry, index = 0, isMobile }) {
  const tierIcon = TIER_ICONS[entry.level] || TIER_ICONS[1];
  const isMe = entry.is_current_user;
  const displayName = isMe
    ? (entry.full_name || `${entry.first_name} ${entry.last_initial}`)
    : `${entry.first_name} ${entry.last_initial}`;

  // Medal emoji for top 3
  const medalMap = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const medal = medalMap[entry.rank];

  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${entry.level_color}20`; e.currentTarget.style.transform = 'translateX(3px)'; e.currentTarget.style.boxShadow = `0 2px 12px ${entry.level_color}08`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = isMe ? 'rgba(56,189,248,0.1)' : 'rgba(34,211,238,0.06)'; e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none'; }}
      style={{
        display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, padding: isMobile ? '12px 14px' : '14px 18px',
        background: isMe
          ? 'linear-gradient(135deg, rgba(56,189,248,0.05) 0%, rgba(56,189,248,0.02) 100%)'
          : 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
        borderRadius: 16, position: 'relative', overflow: 'hidden',
        border: isMe ? '1px solid rgba(56,189,248,0.1)' : '1px solid rgba(34,211,238,0.06)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: `fadeInUp 0.4s ease-out ${0.05 + index * 0.04}s both`,
      }}
    >
      {isMe && (
        <div style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: 3, borderRadius: 3, background: '#38bdf8' }} />
      )}
      {/* Rank number or medal */}
      <div style={{
        width: isMobile ? 28 : 30, flexShrink: 0, textAlign: 'center',
      }}>
        {medal ? (
          <span style={{ fontSize: isMobile ? 16 : 18, lineHeight: 1 }}>{medal}</span>
        ) : (
          <span style={{
            fontSize: isMobile ? 13 : 14, fontWeight: 900, color: entry.level_color,
            fontFamily: "'Outfit', sans-serif",
          }}>{entry.rank}</span>
        )}
      </div>
      {/* Avatar */}
      <div style={{
        width: isMobile ? 34 : 38, height: isMobile ? 34 : 38, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(145deg, ${entry.level_color}30, ${entry.level_color}10)`,
        border: `2px solid ${entry.level_color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isMobile ? 13 : 14, fontWeight: 800, color: '#f1f5f9',
        fontFamily: "'Outfit', sans-serif",
      }}>{entry.first_name?.charAt(0)?.toUpperCase()}</div>
      {/* Name + Level */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            color: isMe ? '#f8fafc' : '#e2e8f0', fontSize: isMobile ? 13 : 14, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{displayName}</span>
          {isMe && <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.08em', background: '#38bdf8', color: '#fff', padding: '1.5px 6px', borderRadius: 4, flexShrink: 0 }}>YOU</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
          {tierIcon(14)}
          <span style={{ color: entry.level_color, fontSize: isMobile ? 11 : 12, fontWeight: 600 }}>{entry.level_name}</span>
        </div>
      </div>
      {/* XP */}
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: isMobile ? 44 : 54 }}>
        <span style={{ fontSize: isMobile ? 15 : 17, fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: '#e2e8f0' }}>{entry.total_xp.toLocaleString()}</span>
        <div style={{ fontSize: isMobile ? 9 : 10, color: '#64748b', fontWeight: 600, letterSpacing: '0.04em' }}>XP</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function SwimmerLeaderboard() {
  const [data, setData] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => { injectStyles(); api.get('/swimmer/leaderboard').then(r => setData(r.data)).catch(() => {}); }, []);

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#64748b' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(56,189,248,0.2)" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Loading leaderboard...</div>
      </div>
    </div>
  );

  const { top5, all_rankings, my_rank, my_xp, my_level, total_swimmers, levels } = data;
  const tierIcon = TIER_ICONS[my_level.level] || TIER_ICONS[1];
  const top3 = top5.filter(e => e.rank <= 3);
  const rest = top5.filter(e => e.rank > 3);
  const myInTop5 = top5.find(e => e.is_current_user);

  // Get current swimmer's name from rankings
  const myEntry = all_rankings.find(e => e.is_current_user);
  const myFullName = myEntry?.full_name || myEntry?.first_name || 'Swimmer';
  const myFirstName = myEntry?.first_name || 'Swimmer';
  const myInitials = myFullName.split(' ').map(w => w.charAt(0).toUpperCase()).slice(0, 2).join('');

  const ordinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div>
      {/* ══════════ PAGE HEADER ══════════ */}
      <PageHeader title="Leaderboard" />

      {/* ══════════ ROW 1: TOP 3 PODIUM (left) + MY PROFILE (right) ══════════ */}
      {top5.length > 0 && (
        <div style={{
          display: isMobile ? 'flex' : 'grid',
          gridTemplateColumns: isMobile ? undefined : '1fr 1fr',
          alignItems: isMobile ? undefined : 'stretch',
          flexDirection: isMobile ? 'column' : undefined,
          gap: isMobile ? 14 : 20,
          marginBottom: isMobile ? 14 : 20,
          animation: 'fadeInUp 0.5s ease-out 0.05s both',
        }}>
          {/* ═══ LEFT: Top 3 Podium ═══ */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
            borderRadius: isMobile ? 18 : 22, border: '1px solid rgba(34,211,238,0.06)',
            display: 'flex', flexDirection: 'column',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,215,0,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: isMobile ? '18px 18px 12px' : '24px 28px 16px',
            }}>
              <div style={{
                width: isMobile ? 34 : 40, height: isMobile ? 34 : 40, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(255,215,0,0.12) 0%, rgba(255,215,0,0.04) 100%)',
                border: '1px solid rgba(255,215,0,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width={isMobile ? 16 : 18} height={isMobile ? 16 : 18} viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7M12 15l-2 6h4l-2-6zM8 9h8l-1 6H9L8 9z" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: isMobile ? 16 : 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Top 3</h2>
                <div style={{ color: '#475569', fontSize: isMobile ? 11 : 12, marginTop: 2 }}>Leading swimmers in your club</div>
              </div>
            </div>
            {top3.length > 0 && (
              <div style={{ padding: isMobile ? '0 14px 20px' : '0 24px 24px', flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                <div style={{
                  display: 'flex', alignItems: 'flex-end', gap: isMobile ? 6 : 12,
                  justifyContent: 'center', width: '100%',
                }}>
                  {top3.map(entry => (
                    <PodiumColumn key={entry.swimmer_id} entry={entry} rank={entry.rank} isMobile={isMobile} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ═══ RIGHT: My Profile Card ═══ */}
        <div style={{
          borderRadius: isMobile ? 18 : 22, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(145deg, rgba(13,31,60,0.85) 0%, rgba(14,165,233,0.08) 50%, rgba(13,31,60,0.65) 100%)',
          border: `1px solid ${my_level.color}15`,
          display: 'flex', flexDirection: 'column',
          boxShadow: `0 2px 12px rgba(0,0,0,0.15), 0 0 40px ${my_level.color}05`,
        }}>
          {/* Background decorations */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent 10%, ${my_level.color}30 50%, transparent 90%)` }} />
          <div style={{ position: 'absolute', top: -80, right: -80, width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, ${my_level.color}08 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, ${my_level.color}05 0%, transparent 70%)`, pointerEvents: 'none' }} />

          <div style={{ padding: isMobile ? '22px 18px' : '28px 30px', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* ── Profile Header: Avatar + Name + Rank ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 18, marginBottom: isMobile ? 14 : 18 }}>
              {/* Avatar with level ring */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {/* Pulsing outer ring */}
                <div style={{
                  position: 'absolute', inset: -5, borderRadius: '50%',
                  border: `2px solid ${my_level.color}20`,
                  animation: 'lb-pulse 3s ease-in-out infinite',
                }} />
                {/* Avatar circle */}
                <div style={{
                  width: isMobile ? 62 : 72, height: isMobile ? 62 : 72, borderRadius: '50%',
                  background: `linear-gradient(145deg, ${my_level.color}50, ${my_level.color}20)`,
                  border: `3px solid ${my_level.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#f1f5f9',
                  fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em',
                  boxShadow: `0 8px 32px ${my_level.color}15, inset 0 1px 0 rgba(255,255,255,0.08)`,
                }}>
                  {myInitials}
                </div>
                {/* Level badge on avatar */}
                <div style={{
                  position: 'absolute', bottom: -3, right: -3,
                  width: isMobile ? 26 : 30, height: isMobile ? 26 : 30, borderRadius: 8,
                  background: 'rgba(6,13,31,0.92)', border: `1.5px solid ${my_level.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 2px 8px rgba(0,0,0,0.3)`,
                }}>
                  {tierIcon(isMobile ? 16 : 18)}
                </div>
              </div>

              {/* Name + Level + Rank */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: '#f8fafc', fontSize: isMobile ? 17 : 20, fontWeight: 800,
                  fontFamily: "'Outfit', sans-serif", lineHeight: 1.2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{myFullName}</div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
                }}>
                  <span style={{
                    color: my_level.color, fontSize: isMobile ? 11 : 12, fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                  }}>{my_level.name}</span>
                  <span style={{
                    width: 3, height: 3, borderRadius: '50%', background: '#334155',
                  }} />
                  <span style={{
                    color: '#64748b', fontSize: isMobile ? 10 : 11, fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>Level {my_level.level}</span>
                </div>
              </div>

              {/* Rank badge */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: isMobile ? '8px 12px' : '10px 16px', borderRadius: isMobile ? 12 : 14,
                background: `linear-gradient(145deg, ${my_level.color}10, ${my_level.color}05)`,
                border: `1px solid ${my_level.color}15`, flexShrink: 0,
                minWidth: isMobile ? 52 : 62,
              }}>
                <div style={{
                  fontSize: isMobile ? 22 : 28, fontWeight: 900,
                  fontFamily: "'Outfit', sans-serif", lineHeight: 1,
                  background: `linear-gradient(150deg, #fff 30%, ${my_level.color})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>#{my_rank}</div>
                <div style={{
                  color: '#475569', fontSize: isMobile ? 8 : 9, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2,
                }}>of {total_swimmers}</div>
              </div>
            </div>

            {/* ── XP Total Bar ── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14,
              padding: isMobile ? '10px 12px' : '12px 16px', borderRadius: 12,
              background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(34,211,238,0.06)',
              marginBottom: isMobile ? 10 : 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{
                    fontSize: isMobile ? 22 : 26, fontWeight: 900,
                    fontFamily: "'Outfit', sans-serif", color: '#f1f5f9', lineHeight: 1,
                  }}>
                    <AnimatedNumber value={my_xp.total_xp} duration={1500} />
                  </span>
                  <span style={{ fontSize: isMobile ? 11 : 12, color: '#64748b', fontWeight: 700 }}>XP earned</span>
                </div>
                {/* Progress to next level */}
                {my_level.next_level_name && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                      <span style={{ color: '#475569', fontSize: isMobile ? 9 : 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                        Next: <span style={{ color: '#94a3b8' }}>{my_level.next_level_name}</span>
                      </span>
                      <span style={{ color: my_level.color, fontSize: isMobile ? 9 : 10, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                        {my_level.xp_to_next} to go
                      </span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: 'rgba(30,41,59,0.5)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${my_level.progress}%`, height: '100%', borderRadius: 3,
                        background: `linear-gradient(90deg, ${my_level.color}80, ${my_level.color})`,
                        boxShadow: `0 0 10px ${my_level.color}30`,
                        animation: 'lb-bar 1.2s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative',
                      }}>
                        <div style={{
                          position: 'absolute', inset: 0, borderRadius: 3,
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
                          backgroundSize: '200% 100%', animation: 'lb-shimmer 3s ease-in-out infinite',
                        }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Achievement Badges ── */}
            <div style={{ display: 'flex', gap: isMobile ? 6 : 8, flex: 1, alignItems: 'stretch' }}>
              {[
                { emoji: '⭐', value: my_xp.rating_xp, label: 'Ratings', detail: `${my_xp.evaluation_count} evals`, color: '#FBBF24' },
                { emoji: '✅', value: my_xp.attendance_xp, label: 'Attend', detail: `${my_xp.attended_count} sessions`, color: '#34D399' },
                { emoji: '🔥', value: my_xp.streak_xp, label: 'Streaks', detail: 'Bonus XP', color: '#F97316' },
              ].map((item, i) => (
                <div key={item.label} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center',
                  padding: isMobile ? '10px 4px' : '10px 6px', borderRadius: 12, gap: 3,
                  background: 'rgba(13,31,60,0.5)', border: '1px solid rgba(34,211,238,0.06)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <span style={{ fontSize: isMobile ? 16 : 18, lineHeight: 1 }}>{item.emoji}</span>
                  <div style={{
                    fontSize: isMobile ? 16 : 18, fontWeight: 900,
                    fontFamily: "'Outfit', sans-serif", color: '#e2e8f0', lineHeight: 1,
                  }}>
                    <AnimatedNumber value={item.value} duration={1000 + i * 150} />
                  </div>
                  <div style={{
                    fontSize: isMobile ? 8 : 9, color: '#64748b', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        </div>
      )}

      {/* ══════════ ROW 2: TOP 5 RANKINGS (left) + LEVEL TIERS (right) ══════════ */}
      <div style={{
        display: isMobile ? 'flex' : 'grid',
        gridTemplateColumns: isMobile ? undefined : '1fr 1fr',
        alignItems: isMobile ? undefined : 'stretch',
        flexDirection: isMobile ? 'column' : undefined,
        gap: isMobile ? 14 : 20,
        marginTop: isMobile ? 14 : 20,
        animation: 'fadeInUp 0.5s ease-out 0.1s both',
      }}>
        {/* ═══ LEFT: Top 5 Rankings (Cards Grid — left aligned) ═══ */}
        {top5.length > 0 && (
          <div style={{
            background: 'linear-gradient(145deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
            borderRadius: isMobile ? 18 : 22, border: '1px solid rgba(34,211,238,0.06)',
            display: 'flex', flexDirection: 'column',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(56,189,248,0.04) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: isMobile ? '22px 18px 14px' : '24px 28px 16px',
            }}>
              <div style={{
                width: isMobile ? 34 : 40, height: isMobile ? 34 : 40, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.04) 100%)',
                border: '1px solid rgba(56,189,248,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width={isMobile ? 16 : 18} height={isMobile ? 16 : 18} viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: isMobile ? 16 : 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Top 5</h2>
                <div style={{ color: '#475569', fontSize: isMobile ? 11 : 12, marginTop: 2 }}>Highest ranked swimmers</div>
              </div>
              <div style={{
                padding: isMobile ? '4px 10px' : '4px 12px', borderRadius: 8,
                background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.08)',
                color: '#64748b', fontSize: isMobile ? 11 : 11, fontWeight: 600,
              }}>{total_swimmers} swimmers</div>
            </div>
            <div style={{
              padding: isMobile ? '0 14px 20px' : '0 24px 24px',
              display: 'flex', flexWrap: 'wrap', gap: isMobile ? 8 : 10,
              flex: 1, alignContent: 'center',
            }}>
              {top5.map((entry, i) => {
                const isMe = entry.is_current_user;
                const displayName = isMe
                  ? (entry.full_name || `${entry.first_name} ${entry.last_initial}`)
                  : `${entry.first_name} ${entry.last_initial}`;
                const medalMap = { 1: '🥇', 2: '🥈', 3: '🥉' };
                const medal = medalMap[entry.rank];
                const entryTierIcon = TIER_ICONS[entry.level] || TIER_ICONS[1];
                return (
                  <div key={entry.swimmer_id}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = isMe ? 'rgba(56,189,248,0.25)' : `${entry.level_color}25`; e.currentTarget.style.boxShadow = `0 4px 16px ${entry.level_color}10`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = isMe ? 'rgba(56,189,248,0.15)' : 'rgba(30,41,59,0.18)'; e.currentTarget.style.boxShadow = 'none'; }}
                    style={{
                    flex: `0 0 calc(33.33% - ${isMobile ? 6 : 7}px)`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', textAlign: 'center',
                    padding: isMobile ? '14px 6px' : '16px 8px', borderRadius: 16,
                    background: isMe
                      ? `linear-gradient(145deg, rgba(56,189,248,0.08), rgba(56,189,248,0.03))`
                      : 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
                    border: isMe ? '1.5px solid rgba(56,189,248,0.15)' : '1px solid rgba(34,211,238,0.06)',
                    position: 'relative', overflow: 'hidden',
                    animation: `fadeInUp 0.4s ease-out ${0.1 + i * 0.05}s both`,
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    cursor: 'default',
                  }}>
                    {/* Rank badge */}
                    <div style={{
                      position: 'absolute', top: 6, left: 8,
                      fontSize: medal ? (isMobile ? 12 : 14) : (isMobile ? 10 : 11),
                      fontWeight: 900, fontFamily: "'Outfit', sans-serif",
                      color: entry.level_color, lineHeight: 1,
                    }}>
                      {medal || entry.rank}
                    </div>
                    {isMe && (
                      <span style={{
                        position: 'absolute', top: 6, right: 6,
                        fontSize: 7, fontWeight: 800, letterSpacing: '0.06em',
                        background: '#38bdf8', color: '#fff', padding: '1.5px 5px', borderRadius: 3,
                      }}>YOU</span>
                    )}
                    {/* Avatar */}
                    <div style={{
                      width: isMobile ? 36 : 42, height: isMobile ? 36 : 42, borderRadius: '50%',
                      background: `linear-gradient(145deg, ${entry.level_color}30, ${entry.level_color}10)`,
                      border: `2px solid ${entry.level_color}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: isMobile ? 14 : 16, fontWeight: 800, color: '#f1f5f9',
                      fontFamily: "'Outfit', sans-serif", marginBottom: 6,
                    }}>
                      {entry.first_name?.charAt(0)?.toUpperCase()}
                    </div>
                    {/* Name */}
                    <div style={{
                      color: isMe ? '#f8fafc' : '#cbd5e1',
                      fontSize: isMobile ? 10 : 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                      lineHeight: 1.2, marginBottom: 2,
                      maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      padding: '0 2px',
                    }}>{displayName}</div>
                    {/* Level */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 3, marginBottom: 3,
                    }}>
                      {entryTierIcon(10)}
                      <span style={{
                        color: entry.level_color, fontSize: isMobile ? 8 : 9, fontWeight: 600,
                      }}>{entry.level_name}</span>
                    </div>
                    {/* XP */}
                    <div style={{
                      fontSize: isMobile ? 14 : 16, fontWeight: 900,
                      fontFamily: "'Outfit', sans-serif", color: '#e2e8f0', lineHeight: 1,
                    }}>{entry.total_xp.toLocaleString()}</div>
                    <div style={{
                      fontSize: isMobile ? 7 : 8, color: '#64748b', fontWeight: 600,
                      letterSpacing: '0.04em',
                    }}>XP</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ RIGHT: Level Tiers (Cards Grid — left aligned) ═══ */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
          borderRadius: isMobile ? 18 : 22, border: '1px solid rgba(34,211,238,0.06)',
          display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: isMobile ? '22px 18px 14px' : '24px 28px 16px',
          }}>
            <div style={{
              width: isMobile ? 34 : 40, height: isMobile ? 34 : 40, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(167,139,250,0.04) 100%)',
              border: '1px solid rgba(167,139,250,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width={isMobile ? 16 : 18} height={isMobile ? 16 : 18} viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: isMobile ? 16 : 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Level Tiers</h2>
              <div style={{ color: '#475569', fontSize: isMobile ? 11 : 12, marginTop: 2 }}>XP milestones to unlock</div>
            </div>
          </div>

          <div style={{
            padding: isMobile ? '0 14px 20px' : '0 24px 24px',
            display: 'flex', flexWrap: 'wrap', gap: isMobile ? 8 : 10,
            flex: 1, alignContent: 'center',
          }}>
            {(levels || []).map((lvl, i) => {
              const icon = TIER_ICONS[lvl.level] || TIER_ICONS[1];
              const isCurrent = my_level.level === lvl.level;
              const isAchieved = my_level.level >= lvl.level;
              return (
                <div key={lvl.level}
                  onMouseEnter={e => { if (isAchieved) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = `${lvl.color}25`; e.currentTarget.style.boxShadow = `0 4px 16px ${lvl.color}10`; } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = isCurrent ? `${lvl.color}25` : 'rgba(34,211,238,0.06)'; e.currentTarget.style.boxShadow = 'none'; }}
                  style={{
                  flex: `0 0 calc(33.33% - ${isMobile ? 6 : 7}px)`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', textAlign: 'center',
                  padding: isMobile ? '14px 6px' : '16px 8px', borderRadius: 16,
                  background: isCurrent
                    ? `linear-gradient(145deg, ${lvl.color}12, ${lvl.color}06)`
                    : 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
                  border: isCurrent ? `1.5px solid ${lvl.color}25` : '1px solid rgba(34,211,238,0.06)',
                  opacity: isAchieved ? 1 : 0.35,
                  position: 'relative', overflow: 'hidden',
                  animation: `fadeInUp 0.4s ease-out ${0.3 + i * 0.05}s both`,
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: isAchieved ? 'default' : 'default',
                }}>
                  {isCurrent && (
                    <div style={{
                      position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
                      width: 60, height: 60, borderRadius: '50%',
                      background: `radial-gradient(circle, ${lvl.color}15, transparent 70%)`,
                      pointerEvents: 'none',
                    }} />
                  )}
                  <div style={{
                    width: isMobile ? 36 : 42, height: isMobile ? 36 : 42, borderRadius: 11, marginBottom: 6,
                    background: isCurrent ? `${lvl.color}12` : 'rgba(30,41,59,0.3)',
                    border: `1px solid ${isCurrent ? `${lvl.color}18` : 'rgba(30,41,59,0.15)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {icon(isMobile ? 20 : 24)}
                  </div>
                  <div style={{
                    color: isCurrent ? lvl.color : isAchieved ? '#cbd5e1' : '#475569',
                    fontSize: isMobile ? 10 : 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                    lineHeight: 1.2, marginBottom: 2,
                  }}>{lvl.name}</div>
                  <div style={{
                    color: '#475569', fontSize: isMobile ? 8 : 9, fontFamily: "'DM Sans', sans-serif",
                    lineHeight: 1,
                  }}>{lvl.xp.toLocaleString()} XP</div>
                  {isCurrent ? (
                    <span style={{
                      marginTop: 5, fontSize: 7, fontWeight: 800, letterSpacing: '0.06em',
                      background: lvl.color, color: '#060d1f', padding: '2px 6px', borderRadius: 4,
                    }}>NOW</span>
                  ) : isAchieved ? (
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 5 }}>
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 5 }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══════════ YOUR POSITION (if outside top 5) ══════════ */}
      {!myInTop5 && my_rank && (
        <div style={{ marginTop: isMobile ? 14 : 20, animation: 'fadeInUp 0.5s ease-out 0.2s both' }}>
          <div style={{ color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, paddingLeft: 4, fontFamily: "'Outfit', sans-serif" }}>
            Your Position
          </div>
          <RankRow
            entry={{
              rank: my_rank, swimmer_id: 'me', first_name: 'You', last_initial: '', full_name: 'You',
              total_xp: my_xp.total_xp, level: my_level.level, level_name: my_level.name,
              level_color: my_level.color, is_current_user: true,
            }}
            index={0}
            isMobile={isMobile}
          />
        </div>
      )}

      {/* ══════════ EMPTY STATE ══════════ */}
      {top5.length === 0 && (
        <div style={{
          textAlign: 'center', padding: isMobile ? '40px 20px' : '50px 24px',
          background: 'linear-gradient(145deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
          borderRadius: isMobile ? 18 : 22, border: '1px solid rgba(34,211,238,0.06)',
          animation: 'fadeInUp 0.5s ease-out',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(56,189,248,0.03) 100%)',
            border: '1px solid rgba(56,189,248,0.1)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7M12 15l-2 6h4l-2-6zM8 9h8l-1 6H9L8 9z" />
            </svg>
          </div>
          <div style={{ color: '#64748b', fontSize: 16, fontWeight: 600, fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>No Rankings Yet</div>
          <div style={{ color: '#475569', fontSize: 13, maxWidth: 280, margin: '0 auto', lineHeight: 1.5 }}>
            Start attending sessions and getting evaluations to earn XP and climb the leaderboard!
          </div>
        </div>
      )}
    </div>
  );
}
