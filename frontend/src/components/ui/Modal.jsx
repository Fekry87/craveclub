import { useIsMobile } from './hooks';

export function Modal({ title, onClose, children, icon }) {
  const isMobile = useIsMobile();

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.35)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center', zIndex: 1000,
      animation: 'fadeIn 0.15s ease-out',
      padding: isMobile ? 0 : 16,
    }} onClick={onClose}>
      <div className="modal-content" style={{
        background: '#FFFFFF',
        borderRadius: isMobile ? '20px 20px 0 0' : 20,
        boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.08)',
        padding: 0, minWidth: 0, maxWidth: isMobile ? '100%' : 620, width: '100%',
        maxHeight: isMobile ? '92dvh' : '90vh', display: 'flex', flexDirection: 'column',
        animation: isMobile ? 'slideUp 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'scaleIn 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
            <div style={{ width: 36, height: 5, borderRadius: 3, background: '#D2D2D7' }} />
          </div>
        )}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: isMobile ? '14px 18px' : '18px 24px',
          borderBottom: '1px solid #E5E5EA',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            {icon && (
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: '#F2F2F7', color: '#0071E3',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>{icon}</div>
            )}
            <h3 style={{
              margin: 0, color: '#1D1D1F',
              fontFamily: 'var(--font-display)', fontSize: isMobile ? 17 : 19, fontWeight: 600,
              letterSpacing: '-0.015em', lineHeight: 1.2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{title}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{
            width: 30, height: 30, borderRadius: 15, background: '#F2F2F7', border: 'none',
            color: '#6E6E73', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>
        <div style={{
          padding: isMobile ? '18px 18px calc(env(safe-area-inset-bottom, 0px) + 18px)' : '22px 24px 24px',
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
      paddingTop: 18,
      borderTop: '1px solid #E5E5EA',
    }}>
      {children}
    </div>
  );
}
