import { avatarCardColors } from './styles';

export function StatCard({ title, label, value, icon }) {
  // Accept both "title" and "label" props for backward compat
  const displayTitle = title || label;
  return (
    <div
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.2)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25), 0 0 20px rgba(34,211,238,0.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)';
      }}
      style={{
        background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
        borderRadius: 18, padding: '1.5rem 1.625rem',
        border: '1px solid rgba(34,211,238,0.06)',
        minWidth: 180,
        boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.18), transparent)',
      }} />
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 80, height: 80,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        color: '#94a3b8', fontSize: '0.75rem', marginBottom: 12,
        fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>{icon} {displayTitle}</div>
      <div style={{
        color: '#f1f5f9', fontSize: '2rem', fontWeight: 700,
        fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em',
      }}>{value}</div>
    </div>
  );
}

export function CardInfoRow({ icon, label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 0',
    }}>
      {icon && (
        <div style={{ flexShrink: 0, width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      )}
      <span style={{
        color: '#64748b', fontSize: '0.75rem', fontWeight: 500,
        textTransform: 'uppercase', letterSpacing: '0.04em',
        minWidth: 70, flexShrink: 0,
      }}>{label}</span>
      <span style={{
        color: '#cbd5e1', fontSize: '0.8125rem', flex: 1,
        textAlign: 'right',
      }}>{value}</span>
    </div>
  );
}

export function CardActions({ row, onEdit, onDelete, actions }) {
  if (!onEdit && !onDelete && !actions) return null;
  return (
    <div style={{
      display: 'flex', gap: 8, marginTop: 14, paddingTop: 14,
      borderTop: '1px solid rgba(51,65,85,0.15)',
    }}>
      {actions && actions(row)}
      {onEdit && (
        <button
          onClick={() => onEdit(row)}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.12)'; e.currentTarget.style.borderColor = 'rgba(34,211,238,0.25)'; e.currentTarget.style.color = '#22d3ee'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.2)'; e.currentTarget.style.borderColor = 'rgba(51,65,85,0.35)'; e.currentTarget.style.color = '#94a3b8'; }}
          style={{
            flex: 1, height: 38, borderRadius: 10,
            background: 'rgba(51,65,85,0.2)', border: '1px solid rgba(51,65,85,0.35)',
            color: '#94a3b8', cursor: 'pointer',
            fontSize: '0.8125rem', fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          Edit
        </button>
      )}
      {onDelete && (
        <button
          onClick={() => onDelete(row)}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.15)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'; e.currentTarget.style.color = '#fda4af'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.06)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.15)'; e.currentTarget.style.color = '#f87171'; }}
          style={{
            flex: 1, height: 38, borderRadius: 10,
            background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)',
            color: '#f87171', cursor: 'pointer',
            fontSize: '0.8125rem', fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
          Delete
        </button>
      )}
    </div>
  );
}

export function getAvatarColor(name) {
  let hash = 0;
  const str = name || '';
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return avatarCardColors[Math.abs(hash) % avatarCardColors.length];
}

export function MobileCardWrapper({ children, index, accentColor }) {
  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(13,31,60,0.55) 0%, rgba(10,22,40,0.35) 100%)',
      borderRadius: 18, padding: 0,
      border: '1px solid rgba(34,211,238,0.06)',
      boxShadow: '0 2px 16px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)',
      animation: `fadeInUp 0.35s ease-out ${(index || 0) * 0.05}s both`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 12, left: 0, bottom: 12, width: 3,
        borderRadius: '0 3px 3px 0',
        background: accentColor || 'linear-gradient(180deg, #22d3ee, #06b6d4)',
        opacity: 0.6,
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent 10%, ${accentColor ? accentColor + '30' : 'rgba(34,211,238,0.18)'} 50%, transparent 90%)`,
      }} />
      <div style={{ padding: '1rem 1.125rem 1rem 1.25rem' }}>
        {children}
      </div>
    </div>
  );
}
