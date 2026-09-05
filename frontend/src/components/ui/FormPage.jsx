export function FormPage({ title, icon, onBack, maxWidth = 720, eyebrow, children }) {
  return (
    <div className="form-page-wrapper" style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div className="form-page-header" style={{
        display: 'flex', alignItems: 'center', gap: 14,
        marginBottom: 24, paddingBottom: 16,
        borderBottom: '1px solid #E5E5EA',
      }}>
        <button type="button" onClick={onBack} className="pl-icon-btn" aria-label="Back" style={{ flexShrink: 0 }}>
          <svg className="rtl-flip" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
        </button>

        {icon && (
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: '#F2F2F7', color: '#0071E3',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>{icon}</div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {eyebrow && (
            <div style={{ fontSize: 12, fontWeight: 500, color: '#6E6E73', marginBottom: 2 }}>{eyebrow}</div>
          )}
          <h2 style={{
            margin: 0, color: '#1D1D1F',
            fontFamily: 'var(--font-display)', fontSize: 22,
            fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{title}</h2>
        </div>
      </div>

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
      paddingTop: 20,
      borderTop: '1px solid #E5E5EA',
    }}>
      {children}
    </div>
  );
}
