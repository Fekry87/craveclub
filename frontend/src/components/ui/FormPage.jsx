export function FormPage({ title, icon, onBack, maxWidth = 720, children }) {
  return (
    <div className="form-page-wrapper" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Header */}
      <div className="form-page-header" style={{
        display: 'flex', alignItems: 'center', gap: 14,
        marginBottom: 28, paddingBottom: 20,
        borderBottom: '1px solid rgba(34,211,238,0.06)',
        position: 'relative',
      }}>
        {/* Accent line */}
        <div style={{
          position: 'absolute', bottom: -1, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, rgba(34,211,238,0.3), transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(34,211,238,0.1)';
            e.currentTarget.style.borderColor = 'rgba(34,211,238,0.25)';
            e.currentTarget.style.color = '#22d3ee';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(51,65,85,0.25)';
            e.currentTarget.style.borderColor = 'rgba(51,65,85,0.4)';
            e.currentTarget.style.color = '#94a3b8';
          }}
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(51,65,85,0.25)',
            border: '1px solid rgba(51,65,85,0.4)',
            color: '#94a3b8', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease', flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Icon */}
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

        {/* Title */}
        <h2 style={{
          margin: 0, color: '#f1f5f9',
          fontFamily: "'Outfit', sans-serif", fontSize: '1.375rem',
          fontWeight: 600, letterSpacing: '-0.01em',
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{title}</h2>
      </div>

      {/* Form content */}
      <div className="form-page-content" style={{ maxWidth, margin: '0 auto' }}>
        {children}
      </div>
    </div>
  );
}

export function FormPageActions({ children }) {
  return (
    <div className="form-page-actions" style={{
      display: 'flex', gap: 10, marginTop: 28, justifyContent: 'flex-end',
      paddingTop: 24,
      borderTop: '1px solid rgba(51,65,85,0.3)',
    }}>
      {children}
    </div>
  );
}
