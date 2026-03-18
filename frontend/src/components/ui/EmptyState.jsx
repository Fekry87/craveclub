export function EmptyState({ title, description, icon, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 20px', textAlign: 'center',
    }}>
      {icon && (
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'var(--color-surface-2, rgba(255,255,255,0.05))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-text-muted, #64748b)',
          marginBottom: 16,
        }}>
          {icon}
        </div>
      )}
      {title && (
        <h4 style={{
          margin: '0 0 6px', color: 'var(--color-text, #e2e8f0)',
          fontSize: 15, fontWeight: 600,
        }}>{title}</h4>
      )}
      {description && (
        <p style={{
          margin: 0, color: 'var(--color-text-muted, #64748b)',
          fontSize: 13, maxWidth: 300, lineHeight: 1.5,
        }}>{description}</p>
      )}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
