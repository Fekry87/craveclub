export const inputStyle = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  background: 'rgba(6,13,31,0.6)',
  border: '1px solid rgba(51,65,85,0.5)',
  borderRadius: 12,
  color: '#e2e8f0',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
  fontFamily: "'DM Sans', sans-serif",
  transition: 'all 0.25s ease',
  outline: 'none',
};

export const inputFocusProps = {
  onFocus: (e) => {
    e.target.style.borderColor = 'rgba(34,211,238,0.4)';
    e.target.style.background = 'linear-gradient(135deg, rgba(34,211,238,0.06) 0%, rgba(6,182,212,0.03) 100%)';
    e.target.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.08), 0 2px 8px rgba(34,211,238,0.06)';
  },
  onBlur: (e) => {
    e.target.style.borderColor = 'rgba(51,65,85,0.5)';
    e.target.style.background = 'rgba(6,13,31,0.6)';
    e.target.style.boxShadow = 'none';
  },
};

export const btnStyle = {
  padding: '0.625rem 1.125rem',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  fontSize: '0.8125rem',
  fontWeight: 600,
  fontFamily: "'DM Sans', sans-serif",
  transition: 'all 0.2s ease',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  whiteSpace: 'nowrap',
  height: 40,
  boxSizing: 'border-box',
};

export const avatarCardColors = [
  { bg: 'linear-gradient(135deg, #06b6d4, #22d3ee)', text: '#060d1f', accent: '#22d3ee' },
  { bg: 'linear-gradient(135deg, #14b8a6, #2dd4bf)', text: '#060d1f', accent: '#2dd4bf' },
  { bg: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', text: '#060d1f', accent: '#38bdf8' },
  { bg: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', text: '#fff', accent: '#a78bfa' },
  { bg: 'linear-gradient(135deg, #f59e0b, #fbbf24)', text: '#060d1f', accent: '#fbbf24' },
  { bg: 'linear-gradient(135deg, #ec4899, #f472b6)', text: '#fff', accent: '#f472b6' },
  { bg: 'linear-gradient(135deg, #10b981, #34d399)', text: '#060d1f', accent: '#34d399' },
  { bg: 'linear-gradient(135deg, #f97316, #fb923c)', text: '#060d1f', accent: '#fb923c' },
];
