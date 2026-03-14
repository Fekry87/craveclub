import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { PageHeader, FormPage, FormPageActions, FormField, Input, Select, TextArea, Button, useIsMobile, getAvatarColor } from '../../components/CrudTable';

const STATUS_CONFIG = {
  Scheduled: { bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.15)', color: '#38bdf8', gradient: 'linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.03) 100%)' },
  Live:      { bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.15)', color: '#fb923c', gradient: 'linear-gradient(135deg, rgba(251,146,60,0.12) 0%, rgba(251,146,60,0.03) 100%)' },
  Completed: { bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.15)', color: '#4ade80', gradient: 'linear-gradient(135deg, rgba(74,222,128,0.12) 0%, rgba(74,222,128,0.03) 100%)' },
  Cancelled: { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)', color: '#94a3b8', gradient: 'linear-gradient(135deg, rgba(148,163,184,0.12) 0%, rgba(148,163,184,0.03) 100%)' },
};

const TYPE_CONFIG = {
  General: '#94a3b8', Technique: '#a78bfa', Endurance: '#f472b6',
  Speed: '#fbbf24', Test: '#f87171', Recovery: '#2dd4bf', Custom: '#64748b',
};

const SESSION_TYPES = ['General','Technique','Endurance','Speed','Test','Recovery','Custom'];
const DAY_LABELS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

/* ─── Reusable Badges ─────────────────────────────────────────── */
function StatusBadge({ status, size = 'default' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Scheduled;
  const isSmall = size === 'small';
  return (
    <span style={{
      padding: isSmall ? '2px 7px' : '3px 10px', borderRadius: 6, fontSize: isSmall ? 10 : 11, fontWeight: 600,
      background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
      display: 'inline-flex', alignItems: 'center', gap: 4, lineHeight: 1.3,
      letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>
      {status === 'Live' && (
        <>
          <style>{`@keyframes livePulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }`}</style>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fb923c', animation: 'livePulse 1.5s ease-in-out infinite' }} />
        </>
      )}
      {status}
    </span>
  );
}

function TypeBadge({ type, size = 'default' }) {
  const color = TYPE_CONFIG[type] || '#94a3b8';
  const isSmall = size === 'small';
  return (
    <span style={{
      padding: isSmall ? '2px 7px' : '3px 10px', borderRadius: 6, fontSize: isSmall ? 10 : 11, fontWeight: 600,
      background: `${color}12`, border: `1px solid ${color}22`, color,
      lineHeight: 1.3, letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>{type}</span>
  );
}

/* ─── Status filter pills (shared) ─── */
function StatusPills({ statusFilter, setStatusFilter, statusCounts }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {[
        { key: '', label: 'All', count: statusCounts.all },
        { key: 'Scheduled', label: 'Scheduled', count: statusCounts.Scheduled, color: '#38bdf8' },
        { key: 'Live', label: 'Live', count: statusCounts.Live, color: '#fb923c' },
        { key: 'Completed', label: 'Done', count: statusCounts.Completed, color: '#4ade80' },
        { key: 'Cancelled', label: 'Cancelled', count: statusCounts.Cancelled, color: '#94a3b8' },
      ].map(f => {
        const active = statusFilter === f.key;
        return (
          <button key={f.key} onClick={() => setStatusFilter(active && f.key ? '' : f.key)}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(45,212,191,0.06)'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? 'rgba(45,212,191,0.1)' : 'rgba(13,31,60,0.3)'; }}
            style={{
              padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              background: active ? 'rgba(45,212,191,0.1)' : 'rgba(13,31,60,0.3)',
              border: `1px solid ${active ? 'rgba(45,212,191,0.25)' : 'rgba(51,65,85,0.2)'}`,
              color: active ? '#2dd4bf' : '#7a8ba8',
              cursor: 'pointer', transition: 'all 0.15s ease',
              display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {f.color && <span style={{ width: 5, height: 5, borderRadius: '50%', background: f.color, opacity: active ? 1 : 0.5 }} />}
            {f.label}
            <span style={{
              fontSize: 9, fontWeight: 700, color: active ? '#2dd4bf' : '#3e4a5e',
              background: active ? 'rgba(45,212,191,0.12)' : 'rgba(51,65,85,0.2)',
              padding: '1px 5px', borderRadius: 4, minWidth: 12, textAlign: 'center',
            }}>{f.count}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Toolbar ─────────────────────────────────────────── */
function Toolbar({ statusFilter, setStatusFilter, groupFilter, setGroupFilter, groups = [], statusCounts, viewMode, setViewMode, isMobile }) {
  const [expanded, setExpanded] = useState(false);
  const safeGroups = Array.isArray(groups) ? groups : [];
  const activeGroupLabel = groupFilter ? (safeGroups.find(g => String(g.id) === String(groupFilter))?.name || 'Group') : 'All Groups';
  const hasActiveFilter = statusFilter || groupFilter;

  /* ─── Desktop: always-open inline toolbar ─── */
  if (!isMobile) {
    return (
      <div style={{
        marginBottom: 16, animation: 'fadeIn 0.3s ease-out',
        padding: '12px 16px', borderRadius: 14,
        background: 'rgba(13,31,60,0.35)',
        border: '1px solid rgba(34,211,238,0.06)',
      }}>
        {/* Row 1: Status pills + group select + count + view toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <StatusPills statusFilter={statusFilter} setStatusFilter={setStatusFilter} statusCounts={statusCounts} />

          {/* Divider */}
          <div style={{ width: 1, height: 22, background: 'rgba(51,65,85,0.2)', flexShrink: 0 }} />

          {/* Group dropdown */}
          <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
            style={{
              padding: '5px 28px 5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              background: 'rgba(13,31,60,0.4)', border: `1px solid ${groupFilter ? 'rgba(45,212,191,0.25)' : 'rgba(51,65,85,0.2)'}`,
              color: groupFilter ? '#2dd4bf' : '#7a8ba8', cursor: 'pointer', outline: 'none',
              fontFamily: "'DM Sans', sans-serif", appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
            }}>
            <option value="">All Groups</option>
            {safeGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>

          {hasActiveFilter && (
            <button onClick={() => { setStatusFilter(''); setGroupFilter(''); }}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = '#526280'}
              style={{ background: 'none', border: 'none', color: '#526280', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: 0, transition: 'color 0.15s ease' }}>
              Clear
            </button>
          )}

          <div style={{ flex: 1 }} />

          {/* Session count */}
          <span style={{ color: '#475569', fontSize: 11, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
            {statusCounts.all} total
          </span>

          {/* Divider */}
          <div style={{ width: 1, height: 22, background: 'rgba(51,65,85,0.2)' }} />

          {/* View toggle */}
          <div style={{
            display: 'flex', borderRadius: 8, overflow: 'hidden',
            background: 'rgba(6,13,31,0.4)', border: '1px solid rgba(51,65,85,0.15)',
            padding: 2,
          }}>
            {[
              { key: 'list', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg> },
              { key: 'calendar', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg> },
            ].map(v => (
              <button key={v.key} onClick={() => setViewMode(v.key)}
                onMouseEnter={e => { if (viewMode !== v.key) e.currentTarget.style.background = 'rgba(45,212,191,0.06)'; }}
                onMouseLeave={e => { if (viewMode !== v.key) e.currentTarget.style.background = 'transparent'; }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 26, border: 'none', cursor: 'pointer', borderRadius: 6,
                  background: viewMode === v.key ? 'rgba(45,212,191,0.15)' : 'transparent',
                  color: viewMode === v.key ? '#2dd4bf' : '#475569',
                  transition: 'all 0.15s ease',
                }}
              >
                {v.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Mobile: collapsible toolbar ─── */
  return (
    <div style={{ marginBottom: 16, animation: 'fadeIn 0.3s ease-out' }}>
      {/* Main toolbar row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderRadius: expanded ? '14px 14px 0 0' : 14,
        background: 'rgba(13,31,60,0.35)',
        border: '1px solid rgba(34,211,238,0.06)',
        borderBottom: expanded ? '1px solid rgba(51,65,85,0.12)' : '1px solid rgba(34,211,238,0.06)',
        transition: 'border-radius 0.2s ease',
      }}>
        {/* Filter toggle button */}
        <button onClick={() => setExpanded(!expanded)}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(45,212,191,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
            borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: '#94a3b8', transition: 'all 0.2s ease',
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hasActiveFilter ? '#2dd4bf' : 'currentColor'} strokeWidth="2" strokeLinecap="round">
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
          </svg>
          <span style={{ color: hasActiveFilter ? '#2dd4bf' : '#94a3b8' }}>Filters</span>
          {hasActiveFilter && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2dd4bf', flexShrink: 0 }} />
          )}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            style={{ transition: 'transform 0.2s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', marginLeft: 2 }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {/* Active filter chips (shown when collapsed) */}
        {!expanded && hasActiveFilter && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {statusFilter && (
              <span style={{
                padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                background: STATUS_CONFIG[statusFilter]?.bg, color: STATUS_CONFIG[statusFilter]?.color,
                border: `1px solid ${STATUS_CONFIG[statusFilter]?.border}`,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {statusFilter}
                <button onClick={(e) => { e.stopPropagation(); setStatusFilter(''); }}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1, opacity: 0.7 }}>&times;</button>
              </span>
            )}
            {groupFilter && (
              <span style={{
                padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                background: 'rgba(45,212,191,0.08)', color: '#2dd4bf',
                border: '1px solid rgba(45,212,191,0.15)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {activeGroupLabel}
                <button onClick={(e) => { e.stopPropagation(); setGroupFilter(''); }}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1, opacity: 0.7 }}>&times;</button>
              </span>
            )}
          </div>
        )}

        <div style={{ flex: 1 }} />

        <span style={{ color: '#475569', fontSize: 11, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
          {statusCounts.all} total
        </span>
        <div style={{ width: 1, height: 20, background: 'rgba(51,65,85,0.2)' }} />

        {/* View toggle */}
        <div style={{
          display: 'flex', borderRadius: 8, overflow: 'hidden',
          background: 'rgba(6,13,31,0.4)', border: '1px solid rgba(51,65,85,0.15)',
          padding: 2,
        }}>
          {[
            { key: 'list', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg> },
            { key: 'calendar', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg> },
          ].map(v => (
            <button key={v.key} onClick={() => setViewMode(v.key)}
              onMouseEnter={e => { if (viewMode !== v.key) e.currentTarget.style.background = 'rgba(45,212,191,0.06)'; }}
              onMouseLeave={e => { if (viewMode !== v.key) e.currentTarget.style.background = 'transparent'; }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 26, border: 'none', cursor: 'pointer', borderRadius: 6,
                background: viewMode === v.key ? 'rgba(45,212,191,0.15)' : 'transparent',
                color: viewMode === v.key ? '#2dd4bf' : '#475569',
                transition: 'all 0.15s ease',
              }}
            >
              {v.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded filter panel (mobile only) */}
      {expanded && (
        <div style={{
          padding: '12px 14px',
          background: 'rgba(10,22,40,0.4)',
          borderRadius: '0 0 14px 14px',
          border: '1px solid rgba(34,211,238,0.06)',
          borderTop: 'none',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: '#3e4a5e', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Status</div>
            <StatusPills statusFilter={statusFilter} setStatusFilter={setStatusFilter} statusCounts={statusCounts} />
          </div>
          <div>
            <div style={{ color: '#3e4a5e', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Group</div>
            <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
              style={{
                padding: '6px 28px 6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                background: 'rgba(13,31,60,0.4)', border: `1px solid ${groupFilter ? 'rgba(45,212,191,0.25)' : 'rgba(51,65,85,0.2)'}`,
                color: groupFilter ? '#2dd4bf' : '#7a8ba8', cursor: 'pointer', outline: 'none',
                fontFamily: "'DM Sans', sans-serif", appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
              }}>
              <option value="">All Groups</option>
              {safeGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          {hasActiveFilter && (
            <button onClick={() => { setStatusFilter(''); setGroupFilter(''); }}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = '#526280'}
              style={{ marginTop: 8, background: 'none', border: 'none', color: '#526280', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: 0, transition: 'color 0.15s ease' }}>
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Action Buttons (shared between desktop/mobile) ─── */
function SessionActions({ session, onStart, onContinue, onEdit, onDelete, layout = 'row' }) {
  const isCol = layout === 'column';
  return (
    <div style={{ display: 'flex', flexDirection: isCol ? 'column' : 'row', alignItems: 'center', gap: 5 }}>
      {session.status === 'Scheduled' && (
        <button onClick={() => onStart(session)}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,212,191,0.15)'; e.currentTarget.style.borderColor = 'rgba(45,212,191,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(45,212,191,0.06)'; e.currentTarget.style.borderColor = 'rgba(45,212,191,0.15)'; }}
          style={{
            padding: '6px 14px', height: 32, borderRadius: 8, fontSize: 11, fontWeight: 700,
            background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.15)',
            color: '#2dd4bf', cursor: 'pointer', transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
            width: isCol ? '100%' : 'auto',
          }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="#2dd4bf" stroke="none"><polygon points="5,3 19,12 5,21" /></svg>
          Start
        </button>
      )}
      {session.status === 'Live' && (
        <button onClick={() => onContinue(session)}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251,146,60,0.15)'; e.currentTarget.style.borderColor = 'rgba(251,146,60,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(251,146,60,0.06)'; e.currentTarget.style.borderColor = 'rgba(251,146,60,0.15)'; }}
          style={{
            padding: '6px 14px', height: 32, borderRadius: 8, fontSize: 11, fontWeight: 700,
            background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.15)',
            color: '#fb923c', cursor: 'pointer', transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
            width: isCol ? '100%' : 'auto',
          }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="#fb923c" stroke="none"><polygon points="5,3 19,12 5,21" /></svg>
          Continue
        </button>
      )}
      {session.status === 'Scheduled' && (
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => onEdit(session)} title="Edit"
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.1)'; e.currentTarget.style.color = '#38bdf8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.15)'; e.currentTarget.style.color = '#526280'; }}
            style={{
              height: 32, width: 32, borderRadius: 8, flexShrink: 0,
              background: 'rgba(51,65,85,0.15)', border: '1px solid rgba(51,65,85,0.1)',
              color: '#526280', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          </button>
          <button onClick={() => onDelete(session)} title="Delete"
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.15)'; e.currentTarget.style.color = '#526280'; }}
            style={{
              height: 32, width: 32, borderRadius: 8, flexShrink: 0,
              background: 'rgba(51,65,85,0.15)', border: '1px solid rgba(51,65,85,0.1)',
              color: '#526280', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
          </button>
        </div>
      )}
      {session.status === 'Completed' && (
        <span style={{ color: '#4ade80', fontSize: 10, fontWeight: 600, opacity: 0.6 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" style={{ marginRight: 3, verticalAlign: -1 }}><path d="M20 6L9 17l-5-5" /></svg>
          Done
        </span>
      )}
      {session.status === 'Cancelled' && (
        <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600, opacity: 0.5 }}>Cancelled</span>
      )}
    </div>
  );
}

/* ─── Meta chips (date, group, location, plan) ─── */
function SessionMeta({ session, compact, dateLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {!compact && dateLabel && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: 11, fontWeight: 500 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          {dateLabel}
        </span>
      )}
      {session.group?.name && session.title && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: 11, fontWeight: 500 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {session.group.name}
        </span>
      )}
      {session.location && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: 11, fontWeight: 500 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
          {session.location}
        </span>
      )}
      {session.plan?.title && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: 11, fontWeight: 500 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>
          {session.plan.title}
        </span>
      )}
    </div>
  );
}

/* ─── Session Card ────────────────────────────────────────────── */
function SessionCard({ session, index, onEdit, onDelete, onStart, onContinue, compact, isMobile }) {
  const date = session.date?.split('T')[0];
  const dateObj = date ? new Date(date + 'T00:00:00') : null;
  const dateLabel = dateObj ? dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '';
  const statusCfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.Scheduled;

  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = statusCfg.border; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 16px rgba(0,0,0,0.12), 0 0 0 1px ${statusCfg.border}`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(51,65,85,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'; }}
      style={{
        background: 'rgba(13,31,60,0.35)',
        borderRadius: 14, border: '1px solid rgba(51,65,85,0.08)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: `fadeInUp 0.3s ease-out ${0.02 + index * 0.03}s both`,
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {/* Left accent strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
        background: `linear-gradient(180deg, ${statusCfg.color} 0%, ${statusCfg.color}30 100%)`,
        borderRadius: '14px 0 0 14px',
      }} />

      {isMobile ? (
        /* ─── MOBILE: Vertical stacked layout ─── */
        <div style={{ padding: '12px 14px 12px 16px' }}>
          {/* Title + Tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
              {session.title || session.group?.name || 'Session'}
            </span>
            <StatusBadge status={session.status} size="small" />
            <TypeBadge type={session.type || 'General'} size="small" />
          </div>
          {/* Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
            <span style={{ color: '#2dd4bf', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
              {session.start_time?.substring(0,5)} – {session.end_time?.substring(0,5)}
            </span>
          </div>
          {/* Meta */}
          <div style={{ marginBottom: 10 }}>
            <SessionMeta session={session} compact={compact} dateLabel={dateLabel} />
          </div>
          {/* Actions — full width */}
          <div style={{ paddingTop: 8, borderTop: '1px solid rgba(51,65,85,0.08)' }}>
            <SessionActions session={session} onStart={onStart} onContinue={onContinue} onEdit={onEdit} onDelete={onDelete} layout="row" />
          </div>
        </div>
      ) : (
        /* ─── DESKTOP: Horizontal card — content left, actions right ─── */
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px 12px 18px', gap: 16 }}>
          {/* Content area */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Title + Tags */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                color: '#f1f5f9', fontSize: 14, fontWeight: 700,
                fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em',
              }}>
                {session.title || session.group?.name || 'Session'}
              </span>
              <StatusBadge status={session.status} size="small" />
              <TypeBadge type={session.type || 'General'} size="small" />
            </div>
            {/* Time + meta inline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#2dd4bf', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
                {session.start_time?.substring(0,5)} – {session.end_time?.substring(0,5)}
              </span>
              <SessionMeta session={session} compact={compact} dateLabel={dateLabel} />
            </div>
          </div>

          {/* Actions — compact, right side */}
          <div style={{ flexShrink: 0 }}>
            <SessionActions session={session} onStart={onStart} onContinue={onContinue} onEdit={onEdit} onDelete={onDelete} layout="row" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Calendar View ──────────────────────────────────────────── */
function CalendarView({ sessions, onStart, onContinue, onEdit, onDelete, isMobile }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];
  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Previous month days for filling first row
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Map sessions to dates
  const sessionMap = {};
  sessions.forEach(s => {
    const d = s.date?.split('T')[0];
    if (d) {
      if (!sessionMap[d]) sessionMap[d] = [];
      sessionMap[d].push(s);
    }
  });

  const prevMonth = () => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDate(null); };
  const nextMonth = () => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDate(null); };
  const goToday = () => { setCurrentDate(new Date()); setSelectedDate(todayStr); };

  const selectedSessions = selectedDate ? (sessionMap[selectedDate] || []) : [];

  // Build calendar grid cells with previous month fill
  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, outside: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, outside: false });
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) for (let d = 1; d <= remaining; d++) cells.push({ day: d, outside: true });

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      {/* Calendar header — centered month with legend below */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        {/* Month navigation — centered */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={prevMonth}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(45,212,191,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            style={{ width: 30, height: 30, borderRadius: 8, background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: 17, fontWeight: 700, fontFamily: "'Outfit', sans-serif", minWidth: 160, textAlign: 'center' }}>{monthLabel}</h3>
          <button onClick={nextMonth}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(45,212,191,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            style={{ width: 30, height: 30, borderRadius: 8, background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>

        {/* Legend + Today button — centered below month */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {[
            { c: '#38bdf8', l: 'Scheduled' },
            { c: '#fb923c', l: 'Live' },
            { c: '#4ade80', l: 'Completed' },
            { c: '#94a3b8', l: 'Cancelled' },
          ].map(x => (
            <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#526280', fontSize: 10, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: x.c }} />{x.l}
            </div>
          ))}
          <div style={{ width: 1, height: 14, background: 'rgba(51,65,85,0.2)', margin: '0 2px' }} />
          <button onClick={goToday}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(45,212,191,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(45,212,191,0.04)'}
            style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(45,212,191,0.04)', border: '1px solid rgba(45,212,191,0.12)', color: '#2dd4bf', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s ease', letterSpacing: '0.03em' }}>
            Today
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(51,65,85,0.1)' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'rgba(13,31,60,0.4)' }}>
          {DAY_LABELS.map((d, i) => (
            <div key={d} style={{
              textAlign: 'center', color: i === 0 || i === 6 ? '#475569' : '#526280',
              fontSize: 9, fontWeight: 700, padding: '8px 0', letterSpacing: '0.1em',
              borderBottom: '1px solid rgba(51,65,85,0.1)',
            }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((cell, i) => {
            if (cell.outside) {
              return (
                <div key={`out-${i}`} style={{
                  padding: '8px 4px', minHeight: 44,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 3,
                  borderBottom: '1px solid rgba(51,65,85,0.06)',
                  borderRight: (i + 1) % 7 !== 0 ? '1px solid rgba(51,65,85,0.06)' : 'none',
                  background: 'rgba(6,13,31,0.15)',
                }}>
                  <span style={{ fontSize: 11, color: '#1e293b', fontWeight: 400, fontFamily: "'Outfit', sans-serif" }}>{cell.day}</span>
                </div>
              );
            }

            const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}`;
            const daySessions = sessionMap[dateStr] || [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasLive = daySessions.some(s => s.status === 'Live');
            const hasScheduled = daySessions.some(s => s.status === 'Scheduled');
            const hasCompleted = daySessions.some(s => s.status === 'Completed');
            const count = daySessions.length;

            return (
              <button key={dateStr} onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(45,212,191,0.04)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday && !isSelected ? 'rgba(45,212,191,0.03)' : 'transparent'; }}
                style={{
                  padding: '6px 4px', minHeight: 44,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 3,
                  border: 'none', cursor: 'pointer',
                  borderBottom: '1px solid rgba(51,65,85,0.06)',
                  borderRight: (i + 1) % 7 !== 0 ? '1px solid rgba(51,65,85,0.06)' : 'none',
                  background: isSelected ? 'rgba(45,212,191,0.1)' : isToday ? 'rgba(45,212,191,0.03)' : 'transparent',
                  transition: 'background 0.12s ease', position: 'relative',
                }}
              >
                {/* Today indicator ring or selected */}
                <span style={{
                  fontSize: 12, fontWeight: isToday ? 800 : count > 0 ? 600 : 400,
                  fontFamily: "'Outfit', sans-serif", lineHeight: 1,
                  width: 24, height: 24, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isToday ? '#2dd4bf' : isSelected ? 'rgba(45,212,191,0.2)' : 'transparent',
                  color: isToday ? '#060d1f' : isSelected ? '#2dd4bf' : count > 0 ? '#cbd5e1' : '#334155',
                }}>{cell.day}</span>

                {/* Session dots */}
                {count > 0 && (
                  <div style={{ display: 'flex', gap: 2 }}>
                    {hasLive && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#fb923c' }} />}
                    {hasScheduled && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#38bdf8' }} />}
                    {hasCompleted && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#4ade80' }} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date sessions */}
      {selectedDate && (
        <div style={{ marginTop: 16, animation: 'fadeInUp 0.25s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '0 2px' }}>
            <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: 13, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h4>
            <span style={{
              padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 700,
              background: selectedSessions.length > 0 ? 'rgba(45,212,191,0.1)' : 'rgba(51,65,85,0.15)',
              color: selectedSessions.length > 0 ? '#2dd4bf' : '#475569',
            }}>{selectedSessions.length}</span>
            <div style={{ flex: 1 }} />
            <button onClick={() => setSelectedDate(null)}
              onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
              onMouseLeave={e => e.currentTarget.style.color = '#334155'}
              style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', padding: 2, display: 'flex', transition: 'color 0.15s ease' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>

          {selectedSessions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedSessions.map((s, i) => (
                <SessionCard key={s.id} session={s} index={i} onEdit={onEdit} onDelete={onDelete} onStart={onStart} onContinue={onContinue} compact isMobile={isMobile} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 16px', color: '#334155', fontSize: 12, fontWeight: 500 }}>
              No sessions scheduled
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function CoachSessions() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sessions, setSessions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [allSwimmers, setAllSwimmers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [statusCounts, setStatusCounts] = useState({ all: 0, Scheduled: 0, Live: 0, Completed: 0, Cancelled: 0 });
  const [form, setForm] = useState({
    group_id: '', plan_id: '', title: '', type: 'General',
    date: '', start_time: '', end_time: '', location: '', notes: '',
    added_swimmer_ids: [], excluded_swimmer_ids: [],
  });
  const [groupSwimmers, setGroupSwimmers] = useState([]);
  const [addSwimmerSearch, setAddSwimmerSearch] = useState('');
  const [showAddSwimmer, setShowAddSwimmer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (groupFilter) params.group_id = groupFilter;
    api.get('/coach/sessions', { params }).then(r => {
      setSessions(r.data.data || []);
      if (r.data.status_counts) setStatusCounts(r.data.status_counts);
    }).catch(() => {});
  };

  useEffect(() => { load(); }, [statusFilter, groupFilter]);
  useEffect(() => {
    api.get('/coach/groups').then(r => setGroups(r.data?.data || r.data || [])).catch(() => {});
    api.get('/coach/swimmers').then(r => setAllSwimmers(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.group_id) {
      const g = (Array.isArray(groups) ? groups : []).find(g => g.id === Number(form.group_id));
      setGroupSwimmers(g?.swimmers || []);
    } else {
      setGroupSwimmers([]);
    }
  }, [form.group_id, groups]);

  const resetForm = () => setForm({ group_id: '', plan_id: '', title: '', type: 'General', date: '', start_time: '', end_time: '', location: '', notes: '', added_swimmer_ids: [], excluded_swimmer_ids: [] });

  const closeForm = () => { setShowModal(false); setEditId(null); resetForm(); setSaveError(''); };

  const handleSave = async () => {
    setSaveError('');
    setSaving(true);
    try {
      const payload = { ...form, plan_id: form.plan_id || null };
      if (editId) await api.put(`/coach/sessions/${editId}`, payload);
      else await api.post('/coach/sessions', payload);
      closeForm(); load();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        // Laravel 422 validation — show first error per field
        const msgs = Object.values(data.errors).map(arr => arr[0]);
        setSaveError(msgs.join('\n'));
      } else {
        setSaveError(data?.message || err.message || 'Failed to save session');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (s) => {
    setEditId(s.id);
    setForm({ group_id: s.group_id, plan_id: s.plan_id || '', title: s.title || '', type: s.type || 'General', date: s.date?.split('T')[0] || '', start_time: s.start_time?.substring(0,5) || '', end_time: s.end_time?.substring(0,5) || '', location: s.location || '', notes: s.notes || '', added_swimmer_ids: s.session_swimmers?.map(sw => sw.id) || [], excluded_swimmer_ids: s.session_exclusions?.map(sw => sw.id) || [] });
    setShowModal(true);
  };

  const handleDelete = async (s) => { if (confirm('Delete this session?')) { await api.delete(`/coach/sessions/${s.id}`); load(); } };
  const handleStart = async (s) => { try { await api.post(`/coach/sessions/${s.id}/start`); navigate(`/coach/sessions/${s.id}/live`); } catch { alert('Could not start session'); } };
  const handleContinue = (s) => navigate(`/coach/sessions/${s.id}/live`);

  const toggleExclusion = (swimmerId) => {
    setForm(f => ({ ...f, excluded_swimmer_ids: f.excluded_swimmer_ids.includes(swimmerId) ? f.excluded_swimmer_ids.filter(id => id !== swimmerId) : [...f.excluded_swimmer_ids, swimmerId] }));
  };
  const addExtraSwimmer = (swimmerId) => { if (!form.added_swimmer_ids.includes(swimmerId)) setForm(f => ({ ...f, added_swimmer_ids: [...f.added_swimmer_ids, swimmerId] })); setShowAddSwimmer(false); setAddSwimmerSearch(''); };
  const removeExtraSwimmer = (swimmerId) => { setForm(f => ({ ...f, added_swimmer_ids: f.added_swimmer_ids.filter(id => id !== swimmerId) })); };

  const groupSwimmerIds = groupSwimmers.map(s => s.id);
  const availableToAdd = allSwimmers.filter(s => !groupSwimmerIds.includes(s.id) && !form.added_swimmer_ids.includes(s.id) && (addSwimmerSearch === '' || `${s.first_name} ${s.last_name}`.toLowerCase().includes(addSwimmerSearch.toLowerCase())));

  /* ── Full-page form for Create / Edit ── */
  if (showModal) {
    return (
      <FormPage
        title={editId ? 'Edit Session' : 'New Session'}
        onBack={closeForm}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <FormField label="Group"><Select value={form.group_id} onChange={e => setForm({ ...form, group_id: e.target.value })} options={(Array.isArray(groups) ? groups : []).map(g => ({ value: g.id, label: g.name }))} /></FormField>
          <FormField label="Type"><Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} options={SESSION_TYPES.map(t => ({ value: t, label: t }))} /></FormField>
        </div>
        <FormField label="Title (optional)"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Speed Day, Butterfly Focus" /></FormField>
        <FormField label="Date"><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Start Time"><Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></FormField>
          <FormField label="End Time"><Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></FormField>
        </div>
        <FormField label="Location"><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Main Pool, Lane 3-5" /></FormField>
        <FormField label="Notes"><TextArea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></FormField>

        {form.group_id && groupSwimmers.length > 0 && (
          <div style={{ marginTop: 8, padding: '16px 16px 12px', borderRadius: 14, background: 'rgba(45,212,191,0.03)', border: '1px solid rgba(45,212,191,0.08)' }}>
            <h4 style={{ color: '#94a3b8', margin: '0 0 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Group Swimmers ({groupSwimmers.length - form.excluded_swimmer_ids.filter(id => groupSwimmerIds.includes(id)).length} active)
            </h4>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {groupSwimmers.map(sw => {
                const excluded = form.excluded_swimmer_ids.includes(sw.id);
                const ac = getAvatarColor(`${sw.first_name} ${sw.last_name}`);
                return (
                  <button key={sw.id} onClick={() => toggleExclusion(sw.id)}
                    style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: excluded ? 'rgba(239,68,68,0.08)' : ac.bg, border: `1px solid ${excluded ? 'rgba(239,68,68,0.15)' : ac.accent + '30'}`, color: excluded ? '#f87171' : ac.text, cursor: 'pointer', transition: 'all 0.2s ease', textDecoration: excluded ? 'line-through' : 'none', opacity: excluded ? 0.6 : 1 }}
                  >{sw.first_name} {sw.last_name}</button>
                );
              })}
            </div>
            {form.added_swimmer_ids.length > 0 && (
              <>
                <div style={{ color: '#526280', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '8px 0 6px' }}>Extra Swimmers</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {form.added_swimmer_ids.map(id => { const sw = allSwimmers.find(s => s.id === id); if (!sw) return null; return (
                    <span key={id} style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.15)', color: '#2dd4bf', display: 'flex', alignItems: 'center', gap: 5 }}>
                      {sw.first_name} {sw.last_name}
                      <button onClick={() => removeExtraSwimmer(id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>&times;</button>
                    </span>
                  ); })}
                </div>
              </>
            )}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowAddSwimmer(!showAddSwimmer)}
                style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(45,212,191,0.06)', border: '1px dashed rgba(45,212,191,0.2)', color: '#2dd4bf', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>Add Swimmer
              </button>
              {showAddSwimmer && (
                <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 4, width: 260, maxHeight: 200, overflowY: 'auto', background: 'rgba(13,25,50,0.98)', border: '1px solid rgba(45,212,191,0.15)', borderRadius: 12, padding: 8, zIndex: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                  <input type="text" value={addSwimmerSearch} onChange={e => setAddSwimmerSearch(e.target.value)} placeholder="Search swimmers..."
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 8, fontSize: 12, background: 'rgba(6,13,31,0.6)', border: '1px solid rgba(51,65,85,0.3)', color: '#e2e8f0', outline: 'none', marginBottom: 6, boxSizing: 'border-box' }} />
                  {availableToAdd.slice(0, 10).map(sw => (
                    <button key={sw.id} onClick={() => addExtraSwimmer(sw.id)}
                      style={{ display: 'block', width: '100%', padding: '6px 10px', borderRadius: 6, background: 'transparent', border: 'none', textAlign: 'left', color: '#cbd5e1', fontSize: 12, cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(45,212,191,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >{sw.first_name} {sw.last_name} <span style={{ color: '#64748b', fontSize: 10 }}>({sw.level})</span></button>
                  ))}
                  {availableToAdd.length === 0 && <div style={{ padding: 8, color: '#475569', fontSize: 12, textAlign: 'center' }}>No swimmers available</div>}
                </div>
              )}
            </div>
          </div>
        )}

        {saveError && (
          <div style={{
            marginTop: 14, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
            color: '#f87171', fontSize: 12, fontWeight: 500, lineHeight: 1.5,
            whiteSpace: 'pre-line',
          }}>
            {saveError}
          </div>
        )}

        <FormPageActions>
          <Button variant="secondary" onClick={closeForm}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
          </Button>
        </FormPageActions>
      </FormPage>
    );
  }

  return (
    <div>
      {/* Page header */}
      <PageHeader title="Sessions">
        <Button onClick={() => { setEditId(null); resetForm(); setSaveError(''); setShowModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          New Session
        </Button>
      </PageHeader>

      {/* Compact collapsible toolbar */}
      <Toolbar
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        groupFilter={groupFilter} setGroupFilter={setGroupFilter}
        groups={groups} statusCounts={statusCounts}
        viewMode={viewMode} setViewMode={setViewMode}
        isMobile={isMobile}
      />

      {/* Content */}
      {viewMode === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'fadeInUp 0.4s ease-out' }}>
          {sessions.length > 0 ? sessions.map((s, i) => (
            <SessionCard key={s.id} session={s} index={i} onEdit={handleEdit} onDelete={handleDelete} onStart={handleStart} onContinue={handleContinue} isMobile={isMobile} />
          )) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div style={{ color: '#526280', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No sessions found</div>
              <div style={{ color: '#334155', fontSize: 12 }}>Create your first session to get started</div>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          background: 'rgba(13,31,60,0.3)',
          borderRadius: 16, padding: '18px 18px', border: '1px solid rgba(34,211,238,0.05)',
        }}>
          <CalendarView sessions={sessions} onStart={handleStart} onContinue={handleContinue} onEdit={handleEdit} onDelete={handleDelete} isMobile={isMobile} />
        </div>
      )}

    </div>
  );
}
