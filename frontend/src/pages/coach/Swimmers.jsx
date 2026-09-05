import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { PageHeader, Button, useIsMobile, getAvatarColor } from '../../components/CrudTable';
import { Badge } from '../../components/ui/Badge';
import { useTranslation } from 'react-i18next';

const levelConfig = {
  'Beginner':     { color: '#FF9500', variant: 'warning' },
  'Intermediate': { color: '#0071E3', variant: 'info' },
  'Advanced':     { color: '#34C759', variant: 'success' },
};

const labelStyle = {
  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, color: '#6E6E73',
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
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; e.currentTarget.style.boxShadow = 'none'; }}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        borderRadius: 16,
        transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
        position: 'relative', cursor: 'pointer',
        animation: `fadeInUp 0.3s ease-out ${0.04 + index * 0.03}s both`,
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
        gap: 10, padding: '14px 18px 0',
        minHeight: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* Level badge */}
          {swimmer.level && (
            <Badge variant={lc.variant || 'neutral'} label={swimmer.level} />
          )}

          {/* Group badge(s) in header */}
          {swimmer.groups?.slice(0, 2).map(g => (
            <Badge key={g.id || g.name} variant="neutral" label={g.name} />
          ))}
        </div>
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
        <div style={{
          borderRadius: '50%',
          width: 72, height: 72, background: color.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 25, fontWeight: 600,
          fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
          color: color.text,
        }}>{initials}</div>
      </div>

      {/* Card body */}
      <div style={{ padding: '16px 22px 20px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          margin: 0, color: '#1D1D1F', fontSize: 17, fontWeight: 600,
          fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.2,
        }}>{name}</h3>

        {/* Mini stats row */}
        {swimmer.groups?.length > 0 && (
          <div style={{
            borderRadius: 12,
            marginTop: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 10px', background: '#F2F2F7',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#86868B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
            <span style={{ color: '#515154', fontSize: 12 }}>
              {swimmer.groups.map(g => g.name).join(', ')}
            </span>
          </div>
        )}

        {/* View Profile button */}
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <div className="pl-btn pl-btn-secondary pl-btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      type="button"
      onClick={onClick}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#F2F2F7'; e.currentTarget.style.borderColor = '#D2D2D7'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E5E5EA'; } }}
      style={{
        padding: '0 14px', height: 34, borderRadius: 980,
        background: active ? '#0071E3' : '#FFFFFF',
        border: `1px solid ${active ? '#0071E3' : '#E5E5EA'}`,
        color: active ? '#FFFFFF' : '#515154',
        fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
        cursor: 'pointer',
        transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
        display: 'flex', alignItems: 'center', gap: 7,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      {count !== undefined && (
        <span style={{ color: active ? 'rgba(255,255,255,0.75)' : '#86868B' }}>{count}</span>
      )}
    </button>
  );
}

/* ───── Main Page ───── */
export default function CoachSwimmers() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [levelFilter, setLevelFilter] = useState('All');
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/coach/groups').then(r => setGroups(r.data?.data || r.data || [])).catch(() => {});
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
      <PageHeader title={t('swimmers.title')} search={search} onSearch={setSearch} searchPlaceholder={t('swimmers.searchPlaceholder')} />

      {/* Filter bar */}
      {allSwimmers.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22,
          flexWrap: 'wrap', animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{
            ...labelStyle, display: 'flex', alignItems: 'center', gap: 6,
            color: '#86868B', marginInlineEnd: 2,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#86868B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
            {t('actions.filter')}
          </div>

          {/* Group filters */}
          <FilterPill label="All Groups" active={filterGroup === 'all'} color="#0071E3" count={allSwimmers.length} onClick={() => setFilterGroup('all')} />

          {groups.length > 1 && (
            <>
              <div style={{ width: 1, height: 22, background: '#E5E5EA', flexShrink: 0 }} />
              {groups.map(g => (
                <FilterPill
                  key={g.id}
                  label={g.name}
                  active={filterGroup === String(g.id)}
                  color="#0071E3"
                  count={g.swimmers?.length || g.swimmers_count || 0}
                  onClick={() => setFilterGroup(filterGroup === String(g.id) ? 'all' : String(g.id))}
                />
              ))}
            </>
          )}

          {/* Level divider & filters */}
          {allLevels.length > 0 && (
            <>
              <div style={{ width: 1, height: 22, background: '#E5E5EA', flexShrink: 0 }} />
              {allLevels.map(level => {
                const lc = levelConfig[level] || { color: '#515154' };
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
              type="button"
              onMouseEnter={e => { e.currentTarget.style.color = '#FF3B30'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#6E6E73'; }}
              style={{
                ...labelStyle, padding: '4px 10px', height: 30, border: 'none', borderRadius: 980,
                background: 'transparent', cursor: 'pointer', transition: 'color 0.15s ease',
                display: 'flex', alignItems: 'center', gap: 5, marginInlineStart: 4,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <div style={labelStyle}>
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
        <div style={{ borderRadius: 16,
          textAlign: 'center', padding: '50px 20px',
          background: '#FFFFFF',
          border: '1px solid #E5E5EA',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{ borderRadius: 14, width: 56, height: 56, background: '#F2F2F7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
          </div>
          <div style={{ color: '#1D1D1F', fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 6 }}>{t('swimmers.noMatch')}</div>
          <div style={{ ...labelStyle, fontSize: 14, marginBottom: 16 }}>{t('swimmers.noMatchHint')}</div>
          <button type="button" className="pl-btn pl-btn-secondary pl-btn-sm"
            onClick={() => { setFilterGroup('all'); setLevelFilter('All'); }}
          >{t('actions.clearAllFilters')}</button>
        </div>
      ) : (
        <div style={{ borderRadius: 16,
          textAlign: 'center', padding: '60px 20px',
          background: '#FFFFFF',
          border: '1px solid #E5E5EA',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{ borderRadius: 16, width: 64, height: 64, background: '#F2F2F7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <div style={{ color: '#1D1D1F', fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 6 }}>{t('swimmers.noSwimmers')}</div>
          <div style={{ ...labelStyle, fontSize: 14 }}>{t('swimmers.noSwimmersHint')}</div>
        </div>
      )}
    </div>
  );
}
