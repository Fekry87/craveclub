import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { PageHeader, Button, useIsMobile, getAvatarColor } from '../../components/CrudTable';

const levelConfig = {
  'Beginner':     { color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.20)', headerGrad: 'rgba(251,191,36,0.06)' },
  'Intermediate': { color: '#38bdf8', bg: 'rgba(56,189,248,0.10)', border: 'rgba(56,189,248,0.20)', headerGrad: 'rgba(56,189,248,0.06)' },
  'Advanced':     { color: '#2dd4bf', bg: 'rgba(45,212,191,0.10)', border: 'rgba(45,212,191,0.20)', headerGrad: 'rgba(45,212,191,0.08)' },
};

function getInitials(firstName, lastName) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
}

/* ───── Swimmer Card (matches manager portal style) ───── */
function SwimmerCard({ swimmer, index, onClick }) {
  const name = `${swimmer.first_name} ${swimmer.last_name}`;
  const color = getAvatarColor(name);
  const initials = getInitials(swimmer.first_name, swimmer.last_name);
  const lc = levelConfig[swimmer.level] || levelConfig['Beginner'];

  return (
    <div
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(45,212,191,0.2)';
        e.currentTarget.style.transform = 'translateY(-6px) scale(1.01)';
        e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.3), 0 0 30px rgba(45,212,191,0.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(45,212,191,0.06)';
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)';
      }}
      style={{
        background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
        borderRadius: 22, padding: 0,
        border: '1px solid rgba(45,212,191,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)',
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden', position: 'relative', cursor: 'pointer',
        animation: `fadeInUp 0.4s ease-out ${0.05 + index * 0.04}s both`,
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Card header */}
      <div style={{
        height: 80,
        background: `linear-gradient(135deg, rgba(13,31,60,0.8) 0%, ${lc.headerGrad} 100%)`,
        position: 'relative',
      }}>
        <svg viewBox="0 0 400 80" preserveAspectRatio="none" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, width: '100%', height: 32 }}>
          <path d="M0,40 C100,20 150,60 200,40 C250,20 300,50 400,35 L400,80 L0,80 Z" fill="rgba(10,22,40,0.6)" />
        </svg>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: 10, right: 18, width: 44, height: 44, borderRadius: '50%', background: `radial-gradient(circle, ${lc.bg} 0%, transparent 70%)` }} />
        <div style={{ position: 'absolute', top: 22, right: 52, width: 22, height: 22, borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 70%)' }} />

        {/* Level badge */}
        {swimmer.level && (
          <div style={{
            position: 'absolute', top: 12, left: 16,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 11px', borderRadius: 8,
            background: lc.bg, border: `1px solid ${lc.border}`,
            color: lc.color, fontSize: 11, fontWeight: 600,
            letterSpacing: '0.02em', backdropFilter: 'blur(8px)',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            {swimmer.level}
          </div>
        )}

        {/* Group badge(s) in header */}
        {swimmer.groups?.length > 0 && (
          <div style={{ position: 'absolute', top: 12, right: 16, display: 'flex', gap: 4 }}>
            {swimmer.groups.slice(0, 2).map(g => (
              <div key={g.id || g.name} style={{
                padding: '4px 10px', borderRadius: 8,
                background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.15)',
                color: '#2dd4bf', fontSize: 10, fontWeight: 600,
                backdropFilter: 'blur(8px)',
              }}>{g.name}</div>
            ))}
          </div>
        )}
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: -40, position: 'relative', zIndex: 2 }}>
        <div style={{
          width: 76, height: 76, borderRadius: 20,
          background: color.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 27, fontWeight: 700,
          fontFamily: "'Outfit', sans-serif",
          color: color.text,
          border: '3px solid rgba(10,22,40,0.8)',
          boxShadow: '0 6px 24px rgba(0,0,0,0.35), 0 0 40px rgba(45,212,191,0.05)',
          letterSpacing: '-0.01em',
        }}>{initials}</div>
      </div>

      {/* Card body */}
      <div style={{ padding: '12px 22px 20px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          margin: '0 0 2px', color: '#f1f5f9', fontSize: 16, fontWeight: 600,
          fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em',
        }}>{name}</h3>

        {/* Mini stats row */}
        <div style={{
          marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}>
          {swimmer.groups?.length > 0 && (
            <div style={{
              gridColumn: '1 / -1',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 10px', borderRadius: 10,
              background: 'rgba(6,13,31,0.3)', border: '1px solid rgba(51,65,85,0.15)',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
              </svg>
              <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>
                {swimmer.groups.map(g => g.name).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* View Profile button */}
        <div style={{ marginTop: 14, paddingTop: 16, borderTop: '1px solid rgba(51,65,85,0.15)' }}>
          <div
            style={{
              padding: '10px 14px', height: 40,
              background: 'linear-gradient(135deg, rgba(45,212,191,0.08) 0%, rgba(45,212,191,0.04) 100%)',
              border: '1px solid rgba(45,212,191,0.15)',
              borderRadius: 12,
              color: '#2dd4bf', fontSize: '0.8125rem', fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Profile
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── Filter Pill ───── */
function FilterPill({ label, active, color, count, onClick }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = `${color}12`;
          e.currentTarget.style.borderColor = `${color}30`;
          e.currentTarget.style.color = color;
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(51,65,85,0.15)';
          e.currentTarget.style.borderColor = 'rgba(51,65,85,0.3)';
          e.currentTarget.style.color = '#94a3b8';
        }
      }}
      style={{
        padding: '6px 14px', height: 34,
        borderRadius: 10,
        background: active ? `${color}15` : 'rgba(51,65,85,0.15)',
        border: `1px solid ${active ? `${color}35` : 'rgba(51,65,85,0.3)'}`,
        color: active ? color : '#94a3b8',
        fontSize: 13, fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        cursor: 'pointer', transition: 'all 0.2s ease',
        display: 'flex', alignItems: 'center', gap: 7,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      {count !== undefined && (
        <span style={{
          padding: '1px 7px', borderRadius: 6,
          background: active ? `${color}20` : 'rgba(51,65,85,0.3)',
          fontSize: 11, fontWeight: 700,
          color: active ? color : '#64748b',
          minWidth: 18, textAlign: 'center',
        }}>{count}</span>
      )}
    </button>
  );
}

/* ───── Main Page ───── */
export default function CoachSwimmers() {
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [levelFilter, setLevelFilter] = useState('All');
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/coach/groups').then(r => setGroups(r.data)).catch(() => {});
  }, []);

  // Flatten swimmers from groups with group info
  const allSwimmers = [];
  const seen = new Set();
  groups.forEach(group => {
    (group.swimmers || []).forEach(s => {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        allSwimmers.push({ ...s, groups: [{ id: group.id, name: group.name }] });
      } else {
        const existing = allSwimmers.find(x => x.id === s.id);
        if (existing) existing.groups.push({ id: group.id, name: group.name });
      }
    });
  });

  // Level counts
  const levelCounts = allSwimmers.reduce((acc, s) => {
    const lvl = s.level || 'Unassigned';
    acc[lvl] = (acc[lvl] || 0) + 1;
    return acc;
  }, {});
  const knownLevels = ['Beginner', 'Intermediate', 'Advanced'];
  const allLevels = [...new Set([...knownLevels.filter(l => levelCounts[l]), ...Object.keys(levelCounts).filter(l => !knownLevels.includes(l))])];

  // Filter
  let filtered = allSwimmers;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(q));
  }
  if (filterGroup !== 'all') {
    filtered = filtered.filter(s => s.groups?.some(g => g.id === Number(filterGroup)));
  }
  if (levelFilter !== 'All') {
    filtered = filtered.filter(s => (s.level || 'Unassigned') === levelFilter);
  }
  filtered.sort((a, b) => a.first_name.localeCompare(b.first_name));

  const hasActiveFilters = filterGroup !== 'all' || levelFilter !== 'All';

  return (
    <div>
      <PageHeader title="Swimmers" search={search} onSearch={setSearch} searchPlaceholder="Search swimmers..." />

      {/* Filter bar */}
      {allSwimmers.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22,
          flexWrap: 'wrap', animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: '#526280', fontSize: 12, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 2,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#526280" strokeWidth="2" strokeLinecap="round">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
            Filter
          </div>

          {/* Group filters */}
          <FilterPill label="All Groups" active={filterGroup === 'all'} color="#2dd4bf" count={allSwimmers.length} onClick={() => setFilterGroup('all')} />

          {groups.length > 1 && (
            <>
              <div style={{ width: 1, height: 22, background: 'rgba(51,65,85,0.3)', flexShrink: 0 }} />
              {groups.map(g => (
                <FilterPill
                  key={g.id}
                  label={g.name}
                  active={filterGroup === String(g.id)}
                  color="#22d3ee"
                  count={g.swimmers?.length || g.swimmers_count || 0}
                  onClick={() => setFilterGroup(filterGroup === String(g.id) ? 'all' : String(g.id))}
                />
              ))}
            </>
          )}

          {/* Level divider & filters */}
          {allLevels.length > 0 && (
            <>
              <div style={{ width: 1, height: 22, background: 'rgba(51,65,85,0.3)', flexShrink: 0 }} />
              {allLevels.map(level => {
                const lc = levelConfig[level] || { color: '#94a3b8' };
                return (
                  <FilterPill
                    key={level}
                    label={level}
                    active={levelFilter === level}
                    color={lc.color}
                    count={levelCounts[level] || 0}
                    onClick={() => setLevelFilter(levelFilter === level ? 'All' : level)}
                  />
                );
              })}
            </>
          )}

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={() => { setFilterGroup('all'); setLevelFilter('All'); }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f1f5f9'; e.currentTarget.style.background = 'rgba(244,63,94,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; }}
              style={{
                padding: '4px 10px', height: 30, borderRadius: 8, border: 'none',
                background: 'transparent', color: '#64748b', fontSize: 12, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: 5, marginLeft: 4,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>
      )}

      {/* Count */}
      {allSwimmers.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{
            padding: '4px 12px', borderRadius: 8,
            background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.08)',
            color: '#64748b', fontSize: 13, fontWeight: 500,
          }}>
            {hasActiveFilters
              ? `${filtered.length} of ${allSwimmers.length} swimmer${allSwimmers.length !== 1 ? 's' : ''}`
              : `${allSwimmers.length} swimmer${allSwimmers.length !== 1 ? 's' : ''}`
            }
          </div>
        </div>
      )}

      {/* Card grid */}
      {filtered.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 22,
        }}>
          {filtered.map((swimmer, i) => (
            <SwimmerCard
              key={swimmer.id}
              swimmer={swimmer}
              index={i}
              onClick={() => navigate(`/coach/swimmers/${swimmer.id}`)}
            />
          ))}
        </div>
      ) : allSwimmers.length > 0 ? (
        <div style={{
          textAlign: 'center', padding: '50px 20px',
          background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)',
          borderRadius: 20, border: '1px solid rgba(45,212,191,0.06)',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
          </div>
          <div style={{ color: '#94a3b8', fontSize: 15, fontWeight: 500, marginBottom: 4 }}>No swimmers match filters</div>
          <div style={{ color: '#475569', fontSize: 13, marginBottom: 16 }}>Try adjusting your filter criteria</div>
          <button
            onClick={() => { setFilterGroup('all'); setLevelFilter('All'); }}
            style={{ padding: '8px 20px', borderRadius: 10, background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.2)', color: '#2dd4bf', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}
          >Clear All Filters</button>
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)',
          borderRadius: 20, border: '1px solid rgba(45,212,191,0.06)',
          animation: 'fadeIn 0.4s ease-out',
        }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <div style={{ color: '#64748b', fontSize: 15, fontWeight: 500, marginBottom: 4 }}>No swimmers found</div>
          <div style={{ color: '#475569', fontSize: 13 }}>No swimmers assigned to your groups yet</div>
        </div>
      )}
    </div>
  );
}
