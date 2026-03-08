import { inputStyle, inputFocusProps, btnStyle } from './styles';

export function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: 'block', marginBottom: 7, color: '#94a3b8',
        fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
        fontFamily: "'DM Sans', sans-serif",
      }}>{label}</label>
      {children}
    </div>
  );
}

export function Input({ ...props }) {
  return <input style={inputStyle} {...inputFocusProps} {...props} />;
}

export function Select({ options = [], ...props }) {
  return (
    <select style={{
      ...inputStyle,
      cursor: 'pointer',
      appearance: 'none',
      WebkitAppearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 5L6 8L9 5' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 14px center',
      paddingRight: 36,
    }} {...inputFocusProps} {...props}>
      <option value="">Select...</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function TextArea({ ...props }) {
  return <textarea style={{ ...inputStyle, minHeight: 88, resize: 'vertical', lineHeight: 1.5 }} {...inputFocusProps} {...props} />;
}

export function Button({ variant = 'primary', disabled, ...props }) {
  const configs = {
    primary: {
      background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
      color: '#060d1f',
      boxShadow: '0 2px 8px rgba(45,212,191,0.15)',
      hoverBg: 'linear-gradient(135deg, #0e9f8e 0%, #2dd4bf 100%)',
      hoverShadow: '0 4px 16px rgba(45,212,191,0.25)',
    },
    danger: {
      background: 'rgba(244,63,94,0.12)',
      color: '#fda4af',
      border: '1px solid rgba(244,63,94,0.2)',
      boxShadow: 'none',
      hoverBg: 'rgba(244,63,94,0.2)',
    },
    secondary: {
      background: 'rgba(51,65,85,0.3)',
      color: '#e2e8f0',
      border: '1px solid rgba(51,65,85,0.5)',
      boxShadow: 'none',
      hoverBg: 'rgba(51,65,85,0.5)',
    },
  };
  const cfg = configs[variant] || configs.primary;
  return (
    <button
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = cfg.hoverBg; e.currentTarget.style.transform = 'translateY(-1px)'; if (cfg.hoverShadow) e.currentTarget.style.boxShadow = cfg.hoverShadow; } }}
      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.background = cfg.background; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = cfg.boxShadow || 'none'; } }}
      disabled={disabled}
      style={{
        ...btnStyle,
        background: cfg.background,
        color: cfg.color,
        border: cfg.border || 'none',
        boxShadow: cfg.boxShadow,
        ...(disabled ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : {}),
      }}
      {...props}
    />
  );
}
