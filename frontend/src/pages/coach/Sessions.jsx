import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { PageHeader, FormPage, FormPageActions, FormField, Input, Select, TextArea, Button, useIsMobile, getAvatarColor } from '../../components/CrudTable';
import { useTranslation } from 'react-i18next';

const STATUS_CONFIG = {
  Scheduled: { color: '#515154' },
  Live:      { color: '#FF9500' },
  Completed: { color: '#34C759' },
  Cancelled: { color: '#86868B' },
};

const TYPE_CONFIG = {
  General: '#6E6E73', Technique: '#1D1D1F', Endurance: '#1D1D1F',
  Speed: '#FF9500', Test: '#FF3B30', Recovery: '#34C759', Custom: '#6E6E73',
};

const SESSION_TYPES = ['General','Technique','Endurance','Speed','Test','Recovery','Custom'];
const DAY_LABELS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

const labelMono = {
  fontFamily: 'var(--font-body)', fontSize: 12, color: '#6E6E73',
};

const pillBase = {
  background: 'transparent', display: 'inline-flex', alignItems: 'center',
  fontFamily: 'var(--font-body)', fontWeight: 500, letterSpacing: '-0.02em', whiteSpace: 'nowrap',
};

/* ─── Reusable Badges ─────────────────────────────────────────── */
function StatusBadge({ status, size = 'default' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Scheduled;
  const isSmall = size === 'small';
  return (
    <span style={{
      ...pillBase,
      padding: isSmall ? '2px 7px' : '3px 8px',
      fontSize: isSmall ? 10 : 10, lineHeight: '14px',
      border: `1px solid ${cfg.color}`, color: cfg.color,
      gap: 4,
    }}>
      {status === 'Live' && <span style={{ width: 5, height: 5, background: '#FF9500', display: 'inline-block' }} />}
      {status}
    </span>
  );
}

function TypeBadge({ type, size = 'default' }) {
  const color = TYPE_CONFIG[type] || '#6E6E73';
  const isSmall = size === 'small';
  return (
    <span style={{
      ...pillBase,
      padding: isSmall ? '2px 7px' : '3px 8px',
      fontSize: 10, lineHeight: '14px',
      border: `1px solid ${color}`, color,
    }}>{type}</span>
  );
}

/* ─── Status filter pills (shared) ─── */
function StatusPills({ statusFilter, setStatusFilter, statusCounts }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {[
        { key: '', label: 'All', count: statusCounts.all },
        { key: 'Scheduled', label: 'Scheduled', count: statusCounts.Scheduled, color: '#0071E3' },
        { key: 'Live', label: 'Live', count: statusCounts.Live, color: '#FF9500' },
        { key: 'Completed', label: 'Done', count: statusCounts.Completed, color: '#34C759' },
        { key: 'Cancelled', label: 'Cancelled', count: statusCounts.Cancelled, color: '#515154' },
      ].map(f => {
        const active = statusFilter === f.key;
        return (
          <button key={f.key} type="button" onClick={() => setStatusFilter(active && f.key ? '' : f.key)}
            onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#D2D2D7'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = '#E5E5EA'; }}
            style={{
              padding: '0 10px', height: 30,
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
              letterSpacing: '-0.02em',
              background: active ? '#1D1D1F' : '#FFFFFF',
              border: `1px solid ${active ? '#1D1D1F' : '#E5E5EA'}`,
              color: active ? '#F5F5F7' : '#515154',
              cursor: 'pointer',
              transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {f.color && <span style={{ width: 5, height: 5, background: f.color, display: 'inline-block' }} />}
            {f.label}
            <span style={{ color: active ? '#AEAEB2' : '#86868B' }}>{f.count}</span>
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
      <div style={{ borderRadius: 16,
        marginBottom: 16, animation: 'fadeIn 0.3s ease-out',
        padding: '12px 16px', background: '#FFFFFF',
        border: '1px solid #E5E5EA',
      }}>
        {/* Row 1: Status pills + group select + count + view toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <StatusPills statusFilter={statusFilter} setStatusFilter={setStatusFilter} statusCounts={statusCounts} />

          {/* Divider */}
          <div style={{ width: 1, height: 22, background: '#E5E5EA', flexShrink: 0 }} />

          {/* Group dropdown */}
          <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
            style={{
              padding: '0 28px 0 10px', height: 30,
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
              letterSpacing: '-0.02em',
              background: '#FFFFFF', border: `1px solid ${groupFilter ? '#1D1D1F' : '#E5E5EA'}`,
              color: groupFilter ? '#1D1D1F' : '#515154', cursor: 'pointer', outline: 'none',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23171717' stroke-width='1.5' stroke-linecap='square'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
            }}>
            <option value="">All Groups</option>
            {safeGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>

          {hasActiveFilter && (
            <button onClick={() => { setStatusFilter(''); setGroupFilter(''); }}
              onMouseEnter={e => e.currentTarget.style.color = '#FF3B30'}
              onMouseLeave={e => e.currentTarget.style.color = '#86868B'}
              type="button"
              style={{ ...labelMono, background: 'none', border: 'none', color: '#86868B', cursor: 'pointer', padding: 0, transition: 'color 0.15s ease' }}>
              Clear
            </button>
          )}

          <div style={{ flex: 1 }} />

          {/* Session count */}
          <span style={{ ...labelMono, color: '#86868B' }}>
            {statusCounts.all} total
          </span>

          {/* Divider */}
          <div style={{ width: 1, height: 22, background: '#E5E5EA' }} />

          {/* View toggle */}
          <div style={{ borderRadius: 16,
            display: 'flex',
            background: '#FFFFFF', border: '1px solid #E5E5EA',
            padding: 2,
          }}>
            {[
              { key: 'list', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg> },
              { key: 'calendar', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg> },
            ].map(v => (
              <button key={v.key} type="button" onClick={() => setViewMode(v.key)}
                onMouseEnter={e => { if (viewMode !== v.key) e.currentTarget.style.color = '#1D1D1F'; }}
                onMouseLeave={e => { if (viewMode !== v.key) e.currentTarget.style.color = '#86868B'; }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 26, border: 'none', cursor: 'pointer',
                  background: viewMode === v.key ? '#1D1D1F' : 'transparent',
                  color: viewMode === v.key ? '#F5F5F7' : '#86868B',
                  transition: 'background 0.15s ease, color 0.15s ease',
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
      <div style={{ borderRadius: 16,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px',
        background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        borderBottom: expanded ? 'none' : '1px solid #E5E5EA',
      }}>
        {/* Filter toggle button */}
        <button type="button" onClick={() => setExpanded(!expanded)}
          style={{
            ...labelMono,
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
            border: 'none', cursor: 'pointer',
            background: 'transparent', color: '#515154',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hasActiveFilter ? '#1D1D1F' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round">
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
          </svg>
          <span style={{ color: hasActiveFilter ? '#1D1D1F' : '#515154' }}>Filters</span>
          {hasActiveFilter && (
            <span style={{ width: 6, height: 6, borderRadius: 3, background: '#0071E3', flexShrink: 0 }} />
          )}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ transition: 'transform 0.2s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', marginInlineStart: 2 }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {/* Active filter chips (shown when collapsed) */}
        {!expanded && hasActiveFilter && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {statusFilter && (
              <span style={{
                ...pillBase, padding: '3px 8px', fontSize: 10, lineHeight: '14px',
                color: STATUS_CONFIG[statusFilter]?.color,
                border: `1px solid ${STATUS_CONFIG[statusFilter]?.color}`,
                gap: 4,
              }}>
                {statusFilter}
                <button onClick={(e) => { e.stopPropagation(); setStatusFilter(''); }}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1, opacity: 0.7 }}>&times;</button>
              </span>
            )}
            {groupFilter && (
              <span style={{
                ...pillBase, padding: '3px 8px', fontSize: 10, lineHeight: '14px',
                color: '#1D1D1F', border: '1px solid #E5E5EA', gap: 4,
              }}>
                {activeGroupLabel}
                <button onClick={(e) => { e.stopPropagation(); setGroupFilter(''); }}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1, opacity: 0.7 }}>&times;</button>
              </span>
            )}
          </div>
        )}

        <div style={{ flex: 1 }} />

        <span style={{ ...labelMono, color: '#86868B' }}>
          {statusCounts.all} total
        </span>
        <div style={{ width: 1, height: 20, background: '#E5E5EA' }} />

        {/* View toggle */}
        <div style={{ borderRadius: 16,
          display: 'flex',
          background: '#FFFFFF', border: '1px solid #E5E5EA',
          padding: 2,
        }}>
          {[
            { key: 'list', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg> },
            { key: 'calendar', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg> },
          ].map(v => (
            <button key={v.key} type="button" onClick={() => setViewMode(v.key)}
              onMouseEnter={e => { if (viewMode !== v.key) e.currentTarget.style.color = '#1D1D1F'; }}
              onMouseLeave={e => { if (viewMode !== v.key) e.currentTarget.style.color = '#86868B'; }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 26, border: 'none', cursor: 'pointer',
                background: viewMode === v.key ? '#1D1D1F' : 'transparent',
                color: viewMode === v.key ? '#F5F5F7' : '#86868B',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
            >
              {v.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded filter panel (mobile only) */}
      {expanded && (
        <div style={{ borderRadius: 16,
          padding: '12px 14px',
          background: '#FFFFFF',
          border: '1px solid #E5E5EA',
          borderTop: 'none',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ ...labelMono, color: '#86868B', marginBottom: 6 }}>Status</div>
            <StatusPills statusFilter={statusFilter} setStatusFilter={setStatusFilter} statusCounts={statusCounts} />
          </div>
          <div>
            <div style={{ ...labelMono, color: '#86868B', marginBottom: 6 }}>Group</div>
            <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
              style={{
                padding: '0 28px 0 10px', height: 32,
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
                letterSpacing: '-0.02em',
                background: '#FFFFFF', border: `1px solid ${groupFilter ? '#1D1D1F' : '#E5E5EA'}`,
                color: groupFilter ? '#1D1D1F' : '#515154', cursor: 'pointer', outline: 'none',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23171717' stroke-width='1.5' stroke-linecap='square'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
              }}>
              <option value="">All Groups</option>
              {safeGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          {hasActiveFilter && (
            <button onClick={() => { setStatusFilter(''); setGroupFilter(''); }}
              onMouseEnter={e => e.currentTarget.style.color = '#FF3B30'}
              onMouseLeave={e => e.currentTarget.style.color = '#86868B'}
              type="button"
              style={{ ...labelMono, marginTop: 8, background: 'none', border: 'none', color: '#86868B', cursor: 'pointer', padding: 0, transition: 'color 0.15s ease' }}>
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
    <div style={{ display: 'flex', flexDirection: isCol ? 'column' : 'row', alignItems: 'center', gap: 6 }}>
      {session.status === 'Scheduled' && (
        <button type="button" onClick={() => onStart(session)} className="pl-btn pl-btn-accent pl-btn-sm"
          style={{ width: isCol ? '100%' : 'auto', justifyContent: 'center' }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5,3 19,12 5,21" /></svg>
          Start
        </button>
      )}
      {session.status === 'Live' && (
        <button type="button" onClick={() => onContinue(session)} className="pl-btn pl-btn-primary pl-btn-sm"
          style={{ width: isCol ? '100%' : 'auto', justifyContent: 'center' }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5,3 19,12 5,21" /></svg>
          Continue
        </button>
      )}
      {session.status === 'Scheduled' && (
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" onClick={() => onEdit(session)} title="Edit" className="pl-icon-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          </button>
          <button type="button" onClick={() => onDelete(session)} title="Delete" className="pl-icon-btn"
            onMouseEnter={e => { e.currentTarget.style.color = '#FF3B30'; e.currentTarget.style.borderColor = '#FF3B30'; }}
            onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = ''; }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
          </button>
        </div>
      )}
      {session.status === 'Completed' && (
        <span style={{ ...labelMono, fontSize: 10, color: '#34C759', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
          Done
        </span>
      )}
      {session.status === 'Cancelled' && (
        <span style={{ ...labelMono, fontSize: 10, color: '#86868B' }}>Cancelled</span>
      )}
    </div>
  );
}

/* ─── Meta chips (date, group, location, plan) ─── */
function SessionMeta({ session, compact, dateLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {!compact && dateLabel && (
        <span style={{ ...labelMono, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#86868B" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          {dateLabel}
        </span>
      )}
      {session.group?.name && session.title && (
        <span style={{ ...labelMono, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#86868B" strokeWidth="1.8" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {session.group.name}
        </span>
      )}
      {session.location && (
        <span style={{ ...labelMono, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#86868B" strokeWidth="1.8" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
          {session.location}
        </span>
      )}
      {session.plan?.title && (
        <span style={{ ...labelMono, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#86868B" strokeWidth="1.8" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>
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
      className="session-card"
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        borderInlineStart: `3px solid ${statusCfg.color}`,
        transition: 'border-color 0.15s ease',
        animation: `fadeInUp 0.25s ease-out ${0.02 + index * 0.03}s both`,
        position: 'relative',
        }}
    >

      {isMobile ? (
        /* ─── MOBILE: Vertical stacked layout ─── */
        <div style={{ padding: '12px 14px' }}>
          {/* Title + Tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{
              color: '#1D1D1F', fontSize: 15, fontWeight: 500, fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              {session.title || session.group?.name || 'Session'}
            </span>
            <StatusBadge status={session.status} size="small" />
            <TypeBadge type={session.type || 'General'} size="small" />
          </div>
          {/* Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
            <span style={{ ...labelMono, fontSize: 12, color: '#1D1D1F' }}>
              {session.start_time?.substring(0,5)} – {session.end_time?.substring(0,5)}
            </span>
          </div>
          {/* Meta */}
          <div style={{ marginBottom: 10 }}>
            <SessionMeta session={session} compact={compact} dateLabel={dateLabel} />
          </div>
          {/* Actions — full width */}
          <div style={{ paddingTop: 8, borderTop: '1px solid #E5E5EA' }}>
            <SessionActions session={session} onStart={onStart} onContinue={onContinue} onEdit={onEdit} onDelete={onDelete} layout="row" />
          </div>
        </div>
      ) : (
        /* ─── DESKTOP: Horizontal card — content left, actions right ─── */
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 16 }}>
          {/* Content area */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Title + Tags */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                color: '#1D1D1F', fontSize: 15, fontWeight: 500,
                fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1,
              }}>
                {session.title || session.group?.name || 'Session'}
              </span>
              <StatusBadge status={session.status} size="small" />
              <TypeBadge type={session.type || 'General'} size="small" />
            </div>
            {/* Time + meta inline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ ...labelMono, fontSize: 12, color: '#1D1D1F', display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round">
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
          <button type="button" onClick={prevMonth} className="pl-icon-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <h3 style={{
            margin: 0, color: '#1D1D1F', fontSize: 20, fontWeight: 500,
            fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1,
            minWidth: 180, textAlign: 'center',
          }}>{monthLabel}</h3>
          <button type="button" onClick={nextMonth} className="pl-icon-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>

        {/* Legend + Today button — centered below month */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {[
            { c: '#515154', l: 'Scheduled' },
            { c: '#FF9500', l: 'Live' },
            { c: '#34C759', l: 'Completed' },
            { c: '#86868B', l: 'Cancelled' },
          ].map(x => (
            <div key={x.l} style={{ ...labelMono, fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, color: '#86868B' }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: x.c }} />{x.l}
            </div>
          ))}
          <div style={{ width: 1, height: 14, background: '#E5E5EA', margin: '0 2px' }} />
          <button type="button" onClick={goToday} className="pl-btn pl-btn-secondary pl-btn-sm" style={{ height: 26, padding: '0 10px' }}>
            Today
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ border: '1px solid #E5E5EA' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#F2F2F7' }}>
          {DAY_LABELS.map(d => (
            <div key={d} style={{
              ...labelMono, fontSize: 10, textAlign: 'center', color: '#6E6E73',
              padding: '8px 0', borderBottom: '1px solid #E5E5EA',
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
                  borderBottom: '1px solid #E5E5EA',
                  borderInlineEnd: (i + 1) % 7 !== 0 ? '1px solid #E5E5EA' : 'none',
                  background: '#FAFAFA',
                }}>
                  <span style={{ fontSize: 11, color: '#E5E5EA', fontWeight: 400, fontFamily: 'var(--font-body)' }}>{cell.day}</span>
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
              <button key={dateStr} type="button" onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F2F2F7'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                style={{
                  padding: '6px 4px', minHeight: 44,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 3,
                  border: 'none', cursor: 'pointer',
                  borderBottom: '1px solid #E5E5EA',
                  borderInlineEnd: (i + 1) % 7 !== 0 ? '1px solid #E5E5EA' : 'none',
                  background: isSelected ? '#1D1D1F' : 'transparent',
                  transition: 'background 0.12s ease', position: 'relative',
                }}
              >
                {/* Today indicator or selected */}
                <span style={{ borderRadius: 6,
                  fontSize: 12, fontWeight: 500,
                  fontFamily: 'var(--font-body)', lineHeight: 1,
                  width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isToday ? '#0071E3' : 'transparent',
                  color: isToday ? '#1D1D1F' : isSelected ? '#F5F5F7' : count > 0 ? '#1D1D1F' : '#AEAEB2',
                }}>{cell.day}</span>

                {/* Session dots */}
                {count > 0 && (
                  <div style={{ display: 'flex', gap: 2 }}>
                    {hasLive && <span style={{ width: 4, height: 4, background: '#FF9500' }} />}
                    {hasScheduled && <span style={{ width: 4, height: 4, background: isSelected ? '#F5F5F7' : '#515154' }} />}
                    {hasCompleted && <span style={{ width: 4, height: 4, background: '#34C759' }} />}
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
            <h4 style={{
              margin: 0, color: '#1D1D1F', fontSize: 16, fontWeight: 500,
              fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h4>
            <span style={{ ...labelMono, color: selectedSessions.length > 0 ? '#1D1D1F' : '#86868B' }}>{selectedSessions.length}</span>
            <div style={{ flex: 1 }} />
            <button type="button" onClick={() => setSelectedDate(null)}
              onMouseEnter={e => e.currentTarget.style.color = '#1D1D1F'}
              onMouseLeave={e => e.currentTarget.style.color = '#AEAEB2'}
              style={{ background: 'none', border: 'none', color: '#6E6E73', cursor: 'pointer', padding: 2, display: 'flex', transition: 'color 0.15s ease' }}>
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
            <div style={{ ...labelMono, textAlign: 'center', padding: '20px 16px', color: '#6E6E73' }}>
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
  const { t } = useTranslation();
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
        title={editId ? t('sessions.editSession') : t('sessions.newSession')}
        onBack={closeForm}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <FormField label={t('sessions.group')}><Select value={form.group_id} onChange={e => setForm({ ...form, group_id: e.target.value })} options={(Array.isArray(groups) ? groups : []).map(g => ({ value: g.id, label: g.name }))} /></FormField>
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
          <div style={{ borderRadius: 16, marginTop: 8, padding: '16px 16px 12px', background: '#F2F2F7', border: '1px solid #E5E5EA' }}>
            <h4 style={{ ...labelMono, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6E6E73" strokeWidth="1.8" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Group Swimmers ({groupSwimmers.length - form.excluded_swimmer_ids.filter(id => groupSwimmerIds.includes(id)).length} active)
            </h4>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {groupSwimmers.map(sw => {
                const excluded = form.excluded_swimmer_ids.includes(sw.id);
                const ac = getAvatarColor(`${sw.first_name} ${sw.last_name}`);
                return (
                  <button key={sw.id} type="button" onClick={() => toggleExclusion(sw.id)}
                    style={{
                      padding: '4px 10px', fontSize: 12, fontWeight: 500,
                      fontFamily: 'var(--font-body)',
                      background: excluded ? '#FFFFFF' : ac.bg,
                      border: `1px solid ${excluded ? '#FF3B30' : ac.bg}`,
                      color: excluded ? '#FF3B30' : ac.text,
                      cursor: 'pointer',
                      transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
                      textDecoration: excluded ? 'line-through' : 'none',
                    }}
                  >{sw.first_name} {sw.last_name}</button>
                );
              })}
            </div>
            {form.added_swimmer_ids.length > 0 && (
              <>
                <div style={{ ...labelMono, color: '#86868B', margin: '8px 0 6px' }}>Extra Swimmers</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {form.added_swimmer_ids.map(id => { const sw = allSwimmers.find(s => s.id === id); if (!sw) return null; return (
                    <span key={id} style={{ borderRadius: 16, padding: '4px 10px', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-body)', background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1D1D1F', display: 'flex', alignItems: 'center', gap: 5 }}>
                      {sw.first_name} {sw.last_name}
                      <button type="button" onClick={() => removeExtraSwimmer(id)} style={{ background: 'none', border: 'none', color: '#FF3B30', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>&times;</button>
                    </span>
                  ); })}
                </div>
              </>
            )}
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => setShowAddSwimmer(!showAddSwimmer)}
                style={{ borderRadius: 16,
                  ...labelMono, height: 30, padding: '0 12px',
                  background: '#FFFFFF', border: '1px dashed #E5E5EA', color: '#1D1D1F',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>Add Swimmer
              </button>
              {showAddSwimmer && (
                <div style={{ borderRadius: 16, position: 'absolute', bottom: '100%', insetInlineStart: 0, marginBottom: 4, width: 260, maxHeight: 200, overflowY: 'auto', background: '#FFFFFF', border: '1px solid #E5E5EA', padding: 8, zIndex: 10 }}>
                  <input type="text" value={addSwimmerSearch} onChange={e => setAddSwimmerSearch(e.target.value)} placeholder="Search swimmers..."
                    style={{ borderRadius: 16, width: '100%', padding: '0 10px', height: 34, fontSize: 12, background: '#FFFFFF', border: '1px solid #AEAEB2', color: '#1D1D1F', outline: 'none', marginBottom: 6, boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}
                    onFocus={e => e.target.style.borderColor = '#D2D2D7'}
                    onBlur={e => e.target.style.borderColor = '#AEAEB2'} />
                  {availableToAdd.slice(0, 10).map(sw => (
                    <button key={sw.id} type="button" onClick={() => addExtraSwimmer(sw.id)}
                      style={{ display: 'block', width: '100%', padding: '6px 10px', background: 'transparent', border: 'none', textAlign: 'start', color: '#1D1D1F', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F2F2F7'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >{sw.first_name} {sw.last_name} <span style={{ color: '#6E6E73', fontSize: 10 }}>({sw.level})</span></button>
                  ))}
                  {availableToAdd.length === 0 && <div style={{ ...labelMono, padding: 8, color: '#86868B', textAlign: 'center' }}>No swimmers available</div>}
                </div>
              )}
            </div>
          </div>
        )}

        {saveError && (
          <div style={{
            marginTop: 14, padding: '10px 14px', background: '#FFFFFF', border: '1px solid #FF3B30',
            color: '#FF3B30', fontSize: 12, fontWeight: 500, lineHeight: 1.5,
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
      <PageHeader title={t('sessions.title')}>
        <Button variant="accent" onClick={() => { setEditId(null); resetForm(); setSaveError(''); setShowModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          {t('sessions.newSession')}
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
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#86868B' }}>
              <div style={{ borderRadius: 14, width: 56, height: 56, background: '#F2F2F7', border: '1px solid #E5E5EA', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div style={{ color: '#1D1D1F', fontSize: 18, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8 }}>No sessions found</div>
              <div style={labelMono}>Create your first session to get started</div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ borderRadius: 16,
          background: '#FFFFFF',
          padding: '18px', border: '1px solid #E5E5EA',
        }}>
          <CalendarView sessions={sessions} onStart={handleStart} onContinue={handleContinue} onEdit={handleEdit} onDelete={handleDelete} isMobile={isMobile} />
        </div>
      )}

    </div>
  );
}
