import { useIsMobile } from './hooks';

export function Modal({ title, onClose, children, icon }) {
  const isMobile = useIsMobile();

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(3,8,18,0.88)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center', zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out',
      padding: isMobile ? 0 : 12,
    }} onClick={onClose}>
      <div className="modal-content" style={{
        background: 'linear-gradient(145deg, #0d1f3c 0%, #0a1628 50%, #091320 100%)',
        borderRadius: isMobile ? '20px 20px 0 0' : 24,
        padding: 0, minWidth: 0, maxWidth: isMobile ? '100%' : 620, width: '100%',
        maxHeight: isMobile ? '92dvh' : '90vh', display: 'flex', flexDirection: 'column',
        border: '1px solid rgba(34,211,238,0.1)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 80px rgba(34,211,238,0.04), inset 0 1px 0 rgba(34,211,238,0.06)',
        animation: isMobile ? 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        {/* Drag handle for mobile */}
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(148,163,184,0.3)' }} />
          </div>
        )}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: isMobile ? '0.75rem 1.25rem 0.875rem' : '1.375rem 1.5rem 1.125rem',
          borderBottom: '1px solid rgba(34,211,238,0.06)',
          background: isMobile ? 'transparent' : 'linear-gradient(180deg, rgba(6,13,31,0.5) 0%, rgba(6,13,31,0.2) 100%)',
          position: 'relative',
        }}>
          {!isMobile && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: 'linear-gradient(90deg, transparent 5%, rgba(34,211,238,0.35) 50%, transparent 95%)',
              borderRadius: '24px 24px 0 0',
            }} />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            {icon && (
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(34,211,238,0.1) 0%, rgba(6,182,212,0.05) 100%)',
                border: '1px solid rgba(34,211,238,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(34,211,238,0.06)',
              }}>{icon}</div>
            )}
            <h3 style={{
              margin: 0, color: '#f1f5f9',
              fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? '1rem' : '1.125rem', fontWeight: 600,
              letterSpacing: '-0.01em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{title}</h3>
          </div>
          <button onClick={onClose}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.12)'; e.currentTarget.style.color = '#fda4af'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.25)'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.25)'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(51,65,85,0.4)'; e.currentTarget.style.transform = 'rotate(0)'; }}
            style={{
              background: 'rgba(51,65,85,0.25)', border: '1px solid rgba(51,65,85,0.4)', color: '#94a3b8',
              cursor: 'pointer', fontSize: 16, width: 34, height: 34,
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', lineHeight: 1, flexShrink: 0,
            }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>
        <div style={{
          padding: isMobile ? '1rem 1.25rem calc(env(safe-area-inset-bottom, 0px) + 1.25rem)' : '1.375rem 1.5rem 1.5rem',
          overflowY: 'auto',
          flex: 1,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function ModalActions({ children }) {
  return (
    <div className="modal-actions" style={{
      display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end',
      paddingTop: 20,
      borderTop: '1px solid rgba(51,65,85,0.3)',
    }}>
      {children}
    </div>
  );
}
