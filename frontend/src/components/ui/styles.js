// Shared inline style primitives — Apple-style system look:
// white rounded surfaces, hairline separators, SF-style type, single blue accent.

export const inputStyle = {
  width: '100%',
  height: 42,
  padding: '0 14px',
  background: '#FFFFFF',
  border: '1px solid #D2D2D7',
  borderRadius: 12,
  color: '#1D1D1F',
  fontSize: 14,
  boxSizing: 'border-box',
  fontFamily: 'var(--font-body)',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  outline: 'none',
};

export const inputFocusProps = {
  onFocus: (e) => { e.target.style.borderColor = '#0071E3'; e.target.style.boxShadow = '0 0 0 4px rgba(0,113,227,0.15)'; },
  onBlur: (e) => { e.target.style.borderColor = '#D2D2D7'; e.target.style.boxShadow = 'none'; },
};

export const btnStyle = {
  height: 40,
  padding: '0 18px',
  border: '1px solid transparent',
  borderRadius: 12,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
  fontFamily: 'var(--font-body)',
  letterSpacing: '-0.005em',
  transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
};

export const labelStyle = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 500,
  color: '#6E6E73',
};

export const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E5E5EA',
  borderRadius: 16,
};

// Avatar tiles: soft system tints with legible text.
export const avatarCardColors = [
  { bg: '#E8F0FE', text: '#0058B3', accent: '#0071E3' },
  { bg: '#E9F7EE', text: '#1E7A3B', accent: '#34C759' },
  { bg: '#FFF1E0', text: '#A35A00', accent: '#FF9500' },
  { bg: '#F0EAFB', text: '#5B2FA8', accent: '#7D57C2' },
  { bg: '#FFE9E7', text: '#B12A20', accent: '#FF3B30' },
  { bg: '#E6F6F9', text: '#0A6E82', accent: '#32ADE6' },
  { bg: '#F2F2F7', text: '#1D1D1F', accent: '#86868B' },
];
