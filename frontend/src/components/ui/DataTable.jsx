import { useIsMobile } from './hooks';
import { CardActions, getAvatarColor, MobileCardWrapper } from './Cards';

function DefaultMobileCard({ row, columns, onEdit, onDelete, actions, index }) {
  const primaryValue = columns[0].render ? columns[0].render(row) : row[columns[0].key];
  const nameStr = typeof primaryValue === 'string' ? primaryValue : (row.name || row.first_name || '?');
  const avatarColor = getAvatarColor(nameStr);
  const initials = nameStr.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MobileCardWrapper index={index} accentColor={avatarColor.accent}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 13,
          background: avatarColor.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Outfit', sans-serif", fontSize: '0.875rem', fontWeight: 700,
          color: avatarColor.text, flexShrink: 0,
          boxShadow: `0 3px 10px rgba(0,0,0,0.25)`,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: '#f1f5f9', fontSize: '1rem', fontWeight: 600,
            fontFamily: "'Outfit', sans-serif",
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{primaryValue}</div>
        </div>
      </div>

      {columns.length > 1 && (
        <div style={{
          background: 'rgba(6,13,31,0.35)', borderRadius: 12,
          padding: '4px 14px', marginBottom: 2,
          border: '1px solid rgba(51,65,85,0.12)',
        }}>
          {columns.slice(1).map((col, ci) => {
            const val = col.render ? col.render(row) : row[col.key];
            if (val === null || val === undefined || val === '') return null;
            return (
              <div key={col.key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 0',
                borderBottom: ci < columns.length - 2 ? '1px solid rgba(51,65,85,0.12)' : 'none',
              }}>
                <span style={{
                  color: '#64748b', fontSize: '0.6875rem', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
                }}>{col.label}</span>
                <span style={{ color: '#cbd5e1', fontSize: '0.8125rem', textAlign: 'right' }}>{val}</span>
              </div>
            );
          })}
        </div>
      )}

      <CardActions row={row} onEdit={onEdit} onDelete={onDelete} actions={actions} />
    </MobileCardWrapper>
  );
}

export function DataTable({ columns, data, onEdit, onDelete, actions, mobileCard }) {
  const isMobile = useIsMobile();

  if (!data?.length) {
    return (
      <div style={{
        color: '#64748b', padding: '60px 32px', textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(13,31,60,0.35) 0%, rgba(10,22,40,0.2) 100%)',
        borderRadius: 20,
        border: '1px solid rgba(34,211,238,0.05)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.08), transparent)',
        }} />
        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
          background: 'linear-gradient(135deg, rgba(34,211,238,0.06) 0%, rgba(6,182,212,0.03) 100%)',
          border: '1px solid rgba(34,211,238,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round">
            <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>No data found</div>
        <div style={{ fontSize: '0.8125rem', color: '#475569' }}>Items you create will appear here</div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((row, i) => (
          mobileCard
            ? mobileCard(row, i, { onEdit, onDelete, actions })
            : <DefaultMobileCard
                key={row.id || i}
                row={row}
                columns={columns}
                onEdit={onEdit}
                onDelete={onDelete}
                actions={actions}
                index={i}
              />
        ))}
      </div>
    );
  }

  return (
    <div style={{
      overflowX: 'auto', borderRadius: 18,
      border: '1px solid rgba(34,211,238,0.06)',
      background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.15), 0 4px 16px rgba(6,13,31,0.2)',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{
                textAlign: 'left', padding: '0.9375rem 1.125rem', color: '#64748b', fontSize: '0.6875rem',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                borderBottom: '1px solid rgba(34,211,238,0.08)', fontWeight: 600,
                background: 'rgba(6,13,31,0.4)',
                fontFamily: "'DM Sans', sans-serif",
              }}>{col.label}</th>
            ))}
            {(onEdit || onDelete || actions) && (
              <th style={{
                textAlign: 'right', padding: '0.9375rem 1.125rem', color: '#64748b', fontSize: '0.6875rem',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                borderBottom: '1px solid rgba(34,211,238,0.08)', fontWeight: 600,
                background: 'rgba(6,13,31,0.4)',
                fontFamily: "'DM Sans', sans-serif",
              }}>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i}
              className="data-table-row"
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 1 ? 'rgba(6,13,31,0.15)' : 'transparent'; }}
              style={{
                borderBottom: i < data.length - 1 ? '1px solid rgba(51,65,85,0.15)' : 'none',
                transition: 'all 0.2s ease',
                background: i % 2 === 1 ? 'rgba(6,13,31,0.15)' : 'transparent',
                animation: `fadeInUp 0.3s ease-out ${i * 0.03}s both`,
              }}>
              {columns.map((col, ci) => (
                <td key={col.key} style={{
                  padding: '0.875rem 1.125rem', color: ci === 0 ? '#f1f5f9' : '#cbd5e1',
                  fontSize: '0.875rem',
                  fontWeight: ci === 0 ? 500 : 400,
                  borderLeft: ci === 0 ? '2px solid transparent' : 'none',
                  transition: 'border-color 0.2s ease',
                }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              {(onEdit || onDelete || actions) && (
                <td style={{ padding: '0.875rem 1.125rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', opacity: 0.7, transition: 'opacity 0.2s ease' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                  >
                    {actions && actions(row)}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.15)'; e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)'; e.currentTarget.style.color = '#22d3ee'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.25)'; e.currentTarget.style.borderColor = 'rgba(51,65,85,0.35)'; e.currentTarget.style.color = '#94a3b8'; }}
                        style={{
                          padding: '6px 14px', borderRadius: 8,
                          background: 'rgba(51,65,85,0.25)', border: '1px solid rgba(51,65,85,0.35)',
                          color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                          fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s ease',
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.15)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'; e.currentTarget.style.color = '#fda4af'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.06)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.15)'; e.currentTarget.style.color = '#f87171'; }}
                        style={{
                          padding: '6px 14px', borderRadius: 8,
                          background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)',
                          color: '#f87171', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                          fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s ease',
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
