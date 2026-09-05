import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { PageHeader, useIsMobile } from '../../components/CrudTable';
import { useTranslation } from 'react-i18next';

/* ═══ Idiom tokens ═══ */
const monoLabel = {
  fontFamily: 'var(--font-body)', fontSize: 12, color: '#6E6E73',
};
const displayHeading = {
  fontFamily: 'var(--font-display)', fontWeight: 600,
  letterSpacing: '-0.02em', lineHeight: 1,
};
const displayNumber = {
  fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1,
};

/* Muted medal palette */
const MEDALS = {
  1: '#FF9500', // gold
  2: '#86868B', // silver
  3: '#A2845E', // bronze
};

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

/* ═══ Tier marks — a 5-step meter, monochrome ═══ */
function tierMark(level, size = 24, onDark = false) {
  const on = onDark ? '#F5F5F7' : '#1D1D1F';
  const off = onDark ? '#3A3A3C' : '#E5E5EA';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {[0, 1, 2, 3, 4].map(i => {
        const h = 5 + i * 4;
        return (
          <rect key={i} x={2 + i * 4.4} y={21 - h} width="3" height={h}
            fill={i < level ? on : off} />
        );
      })}
    </svg>
  );
}

const TIER_ICONS = {
  1: (s = 24, onDark = false) => tierMark(1, s, onDark),
  2: (s = 24, onDark = false) => tierMark(2, s, onDark),
  3: (s = 24, onDark = false) => tierMark(3, s, onDark),
  4: (s = 24, onDark = false) => tierMark(4, s, onDark),
  5: (s = 24, onDark = false) => tierMark(5, s, onDark),
};

/* ═══ Inject keyframes (only leaderboard-specific ones) ═══ */
const STYLES_ID = 'leaderboard-kf';
function injectStyles() {
  if (document.getElementById(STYLES_ID)) return;
  const s = document.createElement('style');
  s.id = STYLES_ID;
  s.textContent = `
    @keyframes lb-bar { from { width:0%; } }
    .lb-scroll::-webkit-scrollbar { width: 4px; }
    .lb-scroll::-webkit-scrollbar-track { background: transparent; }
    .lb-scroll::-webkit-scrollbar-thumb { background: #E5E5EA; }
    .lb-scroll::-webkit-scrollbar-thumb:hover { background: #AEAEB2; }
  `;
  document.head.appendChild(s);
}

/* ═══ Small section header ═══ */
function SectionHead({ title, subtitle, meta, isMobile }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      padding: isMobile ? '20px 18px 14px' : '24px 28px 16px',
      borderBottom: '1px solid #E5E5EA',
      marginBottom: isMobile ? 16 : 20,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: '#0071E3', display: 'inline-block', flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <h2 style={{ ...displayHeading, margin: 0, color: '#1D1D1F', fontSize: isMobile ? 16 : 18 }}>{title}</h2>
        {subtitle && <div style={{ ...monoLabel, fontSize: 10, color: '#86868B', marginTop: 6 }}>{subtitle}</div>}
      </div>
      {meta && <div style={{ marginInlineStart: 'auto' }}>{meta}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PODIUM COLUMN — top-3 swimmer + pedestal
   ═══════════════════════════════════════════════════════════ */
function PodiumColumn({ entry, rank, isMobile }) {
  const isChamp = rank === 1;
  const avatarSize = isChamp ? (isMobile ? 58 : 76) : (isMobile ? 42 : 56);
  const tierIcon = TIER_ICONS[entry.level] || TIER_ICONS[1];
  const podiumH = { 1: isMobile ? 68 : 100, 2: isMobile ? 44 : 64, 3: isMobile ? 30 : 48 }[rank];
  const medal = MEDALS[rank] || '#86868B';
  const displayName = entry.is_current_user
    ? (entry.full_name || `${entry.first_name} ${entry.last_initial}`)
    : `${entry.first_name} ${entry.last_initial}`;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      flex: isChamp ? '1.3' : '1', order: { 1: 2, 2: 1, 3: 3 }[rank],
      animation: `fadeInUp 0.4s ease-out ${rank === 1 ? '0.05s' : rank === 2 ? '0.1s' : '0.15s'} both`,
    }}>
      {/* Rank marker */}
      <div style={{
        height: isMobile ? 22 : 26, display: 'flex', alignItems: 'flex-end',
        marginBottom: isMobile ? 4 : 6,
      }}>
        <span style={{ ...monoLabel, fontSize: 10, color: medal }}>
          
        </span>
      </div>

      {/* Avatar */}
      <div style={{ position: 'relative', marginBottom: isMobile ? 8 : 12 }}>
        <div style={{
          width: avatarSize, height: avatarSize, background: '#F2F2F7',
          border: `1px solid ${medal}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: avatarSize * 0.36, color: '#1D1D1F',
          ...displayNumber,
        }}>
          {entry.first_name?.charAt(0)?.toUpperCase()}
        </div>
        <div style={{ borderRadius: 16,
          position: 'absolute', bottom: -1, insetInlineEnd: -1,
          width: isChamp ? 24 : 20, height: isChamp ? 24 : 20,
          background: '#FFFFFF', border: '1px solid #E5E5EA',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{tierIcon(isChamp ? 15 : 12)}</div>
      </div>

      {/* Name + XP */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: isChamp ? 8 : 5,
        marginBottom: isMobile ? 6 : 10,
      }}>
        <span style={{
          ...displayHeading, color: '#1D1D1F',
          fontSize: isChamp ? (isMobile ? 13 : 15) : (isMobile ? 11 : 13),
          maxWidth: isMobile ? 72 : 110,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{displayName}</span>
        <span style={{
          ...displayNumber, color: '#1D1D1F',
          fontSize: isChamp ? (isMobile ? 18 : 24) : (isMobile ? 13 : 16),
          flexShrink: 0,
        }}>
          <AnimatedNumber value={entry.total_xp} duration={1200} />
          <span style={{ ...monoLabel, fontSize: isChamp ? 9 : 8, color: '#86868B' }}> XP</span>
        </span>
      </div>

      {/* Podium pedestal */}
      <div style={{
        width: '100%', height: podiumH,
        background: rank === 1 ? '#F2F2F7' : '#FFFFFF',
        border: '1px solid #E5E5EA', borderBottom: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          ...displayNumber,
          fontSize: isChamp ? (isMobile ? 36 : 48) : (isMobile ? 24 : 32),
          color: '#E5E5EA', userSelect: 'none',
        }}>{rank}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RANK ROW — "Your Position"
   ═══════════════════════════════════════════════════════════ */
function RankRow({ entry, index = 0, isMobile }) {
  const tierIcon = TIER_ICONS[entry.level] || TIER_ICONS[1];
  const isMe = entry.is_current_user;
  const displayName = isMe
    ? (entry.full_name || `${entry.first_name} ${entry.last_initial}`)
    : `${entry.first_name} ${entry.last_initial}`;
  const medal = MEDALS[entry.rank];

  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14,
        padding: isMobile ? '12px 14px' : '14px 18px',
        background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        borderInlineStart: isMe ? '3px solid #0071E3' : '1px solid #E5E5EA',
        transition: 'border-color 0.15s ease',
        animation: `fadeInUp 0.3s ease-out ${index * 0.04}s both`,
      }}
    >
      {/* Rank number */}
      <div style={{ width: isMobile ? 28 : 34, flexShrink: 0, textAlign: 'center' }}>
        <span style={{
          ...displayNumber, fontSize: isMobile ? 16 : 18,
          color: medal || '#1D1D1F',
        }}>{entry.rank}</span>
      </div>
      {/* Avatar */}
      <div style={{
        width: isMobile ? 34 : 38, height: isMobile ? 34 : 38, flexShrink: 0,
        background: '#F2F2F7', border: '1px solid #E5E5EA',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isMobile ? 13 : 15, color: '#1D1D1F', ...displayNumber,
      }}>{entry.first_name?.charAt(0)?.toUpperCase()}</div>
      {/* Name + Level */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            ...displayHeading, color: '#1D1D1F', fontSize: isMobile ? 13 : 15,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{displayName}</span>
          {isMe && (
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 12, background: '#0071E3', color: '#1D1D1F',
              padding: '2px 6px', flexShrink: 0, lineHeight: '12px',
            }}>You</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          {tierIcon(13)}
          <span style={{ ...monoLabel, fontSize: 10 }}>{entry.level_name}</span>
        </div>
      </div>
      {/* XP */}
      <div style={{ textAlign: 'end', flexShrink: 0, minWidth: isMobile ? 44 : 54 }}>
        <span style={{ ...displayNumber, fontSize: isMobile ? 16 : 18, color: '#1D1D1F' }}>
          {entry.total_xp.toLocaleString()}
        </span>
        <div style={{ ...monoLabel, fontSize: 9, color: '#86868B', marginTop: 4 }}>XP</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function SwimmerLeaderboard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => { injectStyles(); api.get('/swimmer/leaderboard').then(r => setData(r.data)).catch(() => {}); }, []);

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 14 }}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5EA" strokeWidth="2" />
          <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#1D1D1F" strokeWidth="2" />
        </svg>
        <div style={{ ...monoLabel }}>{t('loading.default')}</div>
      </div>
    </div>
  );

  const { top5, all_rankings, my_rank, my_xp, my_level, total_swimmers, levels } = data;
  const tierIcon = TIER_ICONS[my_level.level] || TIER_ICONS[1];
  const top3 = top5.filter(e => e.rank <= 3);
  const myInTop5 = top5.find(e => e.is_current_user);

  // Get current swimmer's name from rankings
  const myEntry = all_rankings.find(e => e.is_current_user);
  const myFullName = myEntry?.full_name || myEntry?.first_name || 'Swimmer';
  const myInitials = myFullName.split(' ').map(w => w.charAt(0).toUpperCase()).slice(0, 2).join('');

  const panel = { borderRadius: 16,
    background: '#FFFFFF',
    border: '1px solid #E5E5EA',
    display: 'flex', flexDirection: 'column',
  };

  return (
    <div>
      {/* ══════════ PAGE HEADER ══════════ */}
      <PageHeader title={t('leaderboard.title')} />

      {/* ══════════ ROW 1: TOP 3 PODIUM (left) + MY PROFILE (right) ══════════ */}
      {top5.length > 0 && (
        <div style={{
          display: isMobile ? 'flex' : 'grid',
          gridTemplateColumns: isMobile ? undefined : '1fr 1fr',
          alignItems: isMobile ? undefined : 'stretch',
          flexDirection: isMobile ? 'column' : undefined,
          gap: isMobile ? 14 : 20,
          marginBottom: isMobile ? 14 : 20,
          animation: 'fadeInUp 0.4s ease-out 0.05s both',
        }}>
          {/* ═══ LEFT: Top 3 Podium ═══ */}
          <div style={panel}>
            <SectionHead title="Top 3" subtitle="Leading swimmers in your club" isMobile={isMobile} />
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

          {/* ═══ RIGHT: My Profile Card (dark hero) ═══ */}
          <div style={{ borderRadius: 14,
            background: '#FFFFFF', border: '1px solid #E5E5EA',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: isMobile ? '22px 18px' : '28px 30px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* ── Profile Header: Avatar + Name + Rank ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 18, marginBottom: isMobile ? 16 : 20 }}>
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: isMobile ? 62 : 72, height: isMobile ? 62 : 72,
                    background: '#F2F2F7', border: '1px solid #E5E5EA',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isMobile ? 22 : 26, color: '#1D1D1F', ...displayNumber,
                  }}>
                    {myInitials}
                  </div>
                  <div style={{ borderRadius: 14,
                    position: 'absolute', bottom: -1, insetInlineEnd: -1,
                    width: isMobile ? 26 : 30, height: isMobile ? 26 : 30,
                    background: '#FFFFFF', border: '1px solid #E5E5EA',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {tierIcon(isMobile ? 16 : 18, true)}
                  </div>
                </div>

                {/* Name + Level */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    ...displayHeading, color: '#1D1D1F', fontSize: isMobile ? 17 : 20,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{myFullName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ ...monoLabel, fontSize: 10, color: '#6E6E73' }}>{my_level.name}</span>
                    <span style={{ width: 3, height: 3, background: '#515154' }} />
                    <span style={{ ...monoLabel, fontSize: 10, color: '#86868B' }}>Level {my_level.level}</span>
                  </div>
                </div>

                {/* Rank badge */}
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  border: '1px solid #E5E5EA', flexShrink: 0,
                  minWidth: isMobile ? 52 : 62,
                }}>
                  <div style={{
                    ...displayNumber, fontSize: isMobile ? 24 : 30, color: '#0071E3',
                  }}>#{my_rank}</div>
                  <div style={{ ...monoLabel, fontSize: 9, color: '#86868B', marginTop: 6 }}>of {total_swimmers}</div>
                </div>
              </div>

              {/* ── XP Total Bar ── */}
              <div style={{
                padding: isMobile ? '12px 14px' : '14px 16px',
                border: '1px solid #E5E5EA',
                marginBottom: isMobile ? 10 : 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ ...displayNumber, fontSize: isMobile ? 24 : 28, color: '#1D1D1F' }}>
                    <AnimatedNumber value={my_xp.total_xp} duration={1500} />
                  </span>
                  <span style={{ ...monoLabel, fontSize: 10, color: '#86868B' }}>XP earned</span>
                </div>
                {/* Progress to next level */}
                {my_level.next_level_name && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center', gap: 8 }}>
                      <span style={{ ...monoLabel, fontSize: 9, color: '#86868B' }}>
                        Next: <span style={{ color: '#6E6E73' }}>{my_level.next_level_name}</span>
                      </span>
                      <span style={{ ...monoLabel, fontSize: 9, color: '#6E6E73' }}>
                        {my_level.xp_to_next} to go
                      </span>
                    </div>
                    <div style={{ height: 6, background: '#F2F2F7', overflow: 'hidden' }}>
                      <div style={{
                        width: `${my_level.progress}%`, height: '100%', background: '#F5F5F7',
                        animation: 'lb-bar 1s ease-out',
                      }} />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Achievement Breakdown ── */}
              <div style={{ display: 'flex', gap: isMobile ? 6 : 8, flex: 1, alignItems: 'stretch' }}>
                {[
                  { value: my_xp.rating_xp, label: 'Ratings', detail: `${my_xp.evaluation_count} evals` },
                  { value: my_xp.attendance_xp, label: 'Attend', detail: `${my_xp.attended_count} sessions` },
                  { value: my_xp.streak_xp, label: 'Streaks', detail: 'Bonus XP' },
                ].map((item, i) => (
                  <div key={item.label} style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 8,
                    padding: isMobile ? '12px 4px' : '14px 6px',
                    border: '1px solid #E5E5EA',
                  }}>
                    <div style={{ ...displayNumber, fontSize: isMobile ? 18 : 20, color: '#1D1D1F' }}>
                      <AnimatedNumber value={item.value} duration={1000 + i * 150} />
                    </div>
                    <div style={{ ...monoLabel, fontSize: 9, color: '#86868B', textAlign: 'center' }}>{item.label}</div>
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
        animation: 'fadeInUp 0.4s ease-out 0.1s both',
      }}>
        {/* ═══ LEFT: Top 5 Rankings ═══ */}
        {top5.length > 0 && (
          <div style={panel}>
            <SectionHead
              title="Top 5" subtitle="Highest ranked swimmers" isMobile={isMobile}
              meta={<span style={{ ...monoLabel, fontSize: 10 }}>{total_swimmers} swimmers</span>}
            />
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
                const medal = MEDALS[entry.rank];
                const entryTierIcon = TIER_ICONS[entry.level] || TIER_ICONS[1];
                return (
                  <div key={entry.swimmer_id}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
                    style={{
                      flex: `0 0 calc(33.33% - ${isMobile ? 6 : 7}px)`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', textAlign: 'center',
                      padding: isMobile ? '16px 6px 14px' : '18px 8px 16px',
                      background: '#FFFFFF',
                      border: '1px solid #E5E5EA',
                      borderInlineStart: isMe ? '3px solid #0071E3' : '1px solid #E5E5EA',
                      position: 'relative',
                      animation: `fadeInUp 0.3s ease-out ${i * 0.04}s both`,
                      transition: 'border-color 0.15s ease',
                    }}>
                    {/* Rank */}
                    <div style={{
                      position: 'absolute', top: 6, insetInlineStart: 8,
                      ...monoLabel, fontSize: 10, color: medal || '#AEAEB2',
                    }}>
                      
                    </div>
                    {isMe && (
                      <span style={{
                        position: 'absolute', top: 6, insetInlineEnd: 6,
                        fontFamily: 'var(--font-body)', fontSize: 8, background: '#0071E3', color: '#1D1D1F',
                        padding: '2px 5px', lineHeight: '10px',
                      }}>You</span>
                    )}
                    {/* Avatar */}
                    <div style={{
                      width: isMobile ? 36 : 42, height: isMobile ? 36 : 42,
                      background: '#F2F2F7', border: '1px solid #E5E5EA',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: isMobile ? 14 : 16, color: '#1D1D1F',
                      ...displayNumber, marginBottom: 10,
                    }}>
                      {entry.first_name?.charAt(0)?.toUpperCase()}
                    </div>
                    {/* Name */}
                    <div style={{
                      ...displayHeading, color: '#1D1D1F',
                      fontSize: isMobile ? 11 : 12, marginBottom: 6,
                      maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      padding: '0 2px',
                    }}>{displayName}</div>
                    {/* Level */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                      {entryTierIcon(10)}
                      <span style={{ ...monoLabel, fontSize: 9, color: '#86868B' }}>{entry.level_name}</span>
                    </div>
                    {/* XP */}
                    <div style={{ ...displayNumber, fontSize: isMobile ? 15 : 17, color: '#1D1D1F' }}>
                      {entry.total_xp.toLocaleString()}
                    </div>
                    <div style={{ ...monoLabel, fontSize: 8, color: '#86868B', marginTop: 4 }}>XP</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ RIGHT: Level Tiers ═══ */}
        <div style={panel}>
          <SectionHead title="Level Tiers" subtitle="XP milestones to unlock" isMobile={isMobile} />

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
                  onMouseEnter={e => { if (isAchieved) e.currentTarget.style.borderColor = '#D2D2D7'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isCurrent ? '#1D1D1F' : '#E5E5EA'; }}
                  style={{
                    flex: `0 0 calc(33.33% - ${isMobile ? 6 : 7}px)`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', textAlign: 'center',
                    padding: isMobile ? '14px 6px' : '16px 8px',
                    background: isCurrent ? '#F2F2F7' : '#FFFFFF',
                    border: `1px solid ${isCurrent ? '#1D1D1F' : '#E5E5EA'}`,
                    opacity: isAchieved ? 1 : 0.45,
                    animation: `fadeInUp 0.3s ease-out ${0.15 + i * 0.04}s both`,
                    transition: 'border-color 0.15s ease',
                  }}>
                  <div style={{ borderRadius: 16,
                    width: isMobile ? 36 : 42, height: isMobile ? 36 : 42, marginBottom: 10,
                    background: '#FFFFFF', border: '1px solid #E5E5EA',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {icon(isMobile ? 20 : 24)}
                  </div>
                  <div style={{
                    ...displayHeading, color: isAchieved ? '#1D1D1F' : '#86868B',
                    fontSize: isMobile ? 11 : 12, marginBottom: 6,
                  }}>{lvl.name}</div>
                  <div style={{ ...monoLabel, fontSize: 9, color: '#86868B' }}>{lvl.xp.toLocaleString()} XP</div>
                  {isCurrent ? (
                    <span style={{
                      marginTop: 8, fontFamily: 'var(--font-body)', fontSize: 8,
                      background: '#0071E3', color: '#1D1D1F', padding: '2px 6px', lineHeight: '10px',
                    }}>Now</span>
                  ) : isAchieved ? (
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round" style={{ marginTop: 8 }}>
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="2" strokeLinecap="round" style={{ marginTop: 8 }}>
                      <rect x="3" y="11" width="18" height="11" /><path d="M7 11V7a5 5 0 0110 0v4" />
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
        <div style={{ marginTop: isMobile ? 14 : 20, animation: 'fadeInUp 0.4s ease-out 0.15s both' }}>
          <div style={{
            ...monoLabel, marginBottom: 10,
            paddingBottom: 10, borderBottom: '1px solid #E5E5EA',
          }}>
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
        <div style={{ borderRadius: 16,
          textAlign: 'center', padding: isMobile ? '40px 20px' : '50px 24px',
          background: '#FFFFFF',
          border: '1px solid #E5E5EA',
          animation: 'fadeInUp 0.4s ease-out',
        }}>
          <div style={{ borderRadius: 16,
            width: 72, height: 72, background: '#FFFFFF',
            border: '1px solid #E5E5EA',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7M12 15l-2 6h4l-2-6zM8 9h8l-1 6H9L8 9z" />
            </svg>
          </div>
          <div style={{ ...displayHeading, color: '#1D1D1F', fontSize: 16, marginBottom: 10 }}>No Rankings Yet</div>
          <div style={{ color: '#6E6E73', fontSize: 13, maxWidth: 280, margin: '0 auto', lineHeight: 1.5 }}>
            Start attending sessions and getting evaluations to earn XP and climb the leaderboard!
          </div>
        </div>
      )}
    </div>
  );
}
