const variants = {
  success:  { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.25)' },
  warning:  { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.25)' },
  danger:   { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.25)' },
  info:     { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.25)' },
  neutral:  { bg: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.2)' },
  pending:  { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.25)' },
  approved: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.25)' },
  rejected: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.25)' },
};

export function Badge({ variant = 'neutral', label, children }) {
  const v = variants[variant] || variants.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600, lineHeight: '18px',
      background: v.bg, color: v.color,
      border: `1px solid ${v.border}`,
      textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      {label || children}
    </span>
  );
}
