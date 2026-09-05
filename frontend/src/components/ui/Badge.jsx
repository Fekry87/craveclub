const variants = {
  success:  { bg: 'rgba(52,199,89,0.14)',  color: '#1E7A3B' },
  warning:  { bg: 'rgba(255,149,0,0.16)',  color: '#A35A00' },
  danger:   { bg: 'rgba(255,59,48,0.12)',  color: '#B12A20' },
  info:     { bg: 'rgba(0,113,227,0.12)',  color: '#0058B3' },
  neutral:  { bg: '#F2F2F7',               color: '#515154' },
  accent:   { bg: 'rgba(0,113,227,0.12)',  color: '#0058B3' },
  pending:  { bg: 'rgba(255,149,0,0.16)',  color: '#A35A00' },
  approved: { bg: 'rgba(52,199,89,0.14)',  color: '#1E7A3B' },
  rejected: { bg: 'rgba(255,59,48,0.12)',  color: '#B12A20' },
};

export function Badge({ variant = 'neutral', label, children }) {
  const v = variants[variant] || variants.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 9px', borderRadius: 980,
      fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, lineHeight: '16px',
      background: v.bg, color: v.color,
      textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      {label || children}
    </span>
  );
}
