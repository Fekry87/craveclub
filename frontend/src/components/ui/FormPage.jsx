/**
 * Full-page form shell.
 * Header and content share one centered column so the title, the fields and the
 * action buttons all sit on the same optical axis.
 */
export function FormPage({ title, icon, onBack, maxWidth = 640, eyebrow, children }) {
  return (
    <div className="form-page-wrapper" style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div style={{ maxWidth, margin: '0 auto' }}>
        <div className="form-page-header" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 22,
        }}>
          <button type="button" onClick={onBack} className="pl-icon-btn" aria-label="Back" style={{ flexShrink: 0 }}>
            <svg className="rtl-flip" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
          </button>

          {icon && (
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: 'rgba(0,113,227,0.1)', color: '#0071E3',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>{icon}</div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            {eyebrow && (
              <div style={{ fontSize: 12, fontWeight: 500, color: '#6E6E73', marginBottom: 1 }}>{eyebrow}</div>
            )}
            <h2 style={{
              margin: 0, color: '#1D1D1F',
              fontFamily: 'var(--font-display)', fontSize: 24,
              fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{title}</h2>
          </div>
        </div>

        {/* Fields sit on a single white card, the way a settings pane does. */}
        <div className="form-page-content" style={{
          background: '#FFFFFF',
          border: '1px solid #E5E5EA',
          borderRadius: 16,
          padding: 'clamp(18px, 3vw, 26px)',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function FormPageActions({ children }) {
  return (
    <div className="form-page-actions" style={{
      display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end',
      paddingTop: 18,
      borderTop: '1px solid #F2F2F7',
    }}>
      {children}
    </div>
  );
}
