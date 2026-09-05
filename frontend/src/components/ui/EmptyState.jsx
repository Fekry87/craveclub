export function EmptyState({ title, description, icon, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 20px', textAlign: 'center',
      background: '#FFFFFF', border: '1px dashed #D2D2D7', borderRadius: 16,
    }}>
      {icon && (
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: '#F2F2F7', color: '#6E6E73',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14,
        }}>
          {icon}
        </div>
      )}
      {title && (
        <h4 style={{
          margin: '0 0 6px', color: '#1D1D1F',
          fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em',
        }}>{title}</h4>
      )}
      {description && (
        <p style={{ margin: 0, color: '#6E6E73', fontSize: 13, maxWidth: 320, lineHeight: 1.5 }}>{description}</p>
      )}
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  );
}
