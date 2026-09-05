import { inputStyle, inputFocusProps, labelStyle } from './styles';

export function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ ...labelStyle, display: 'block', marginBottom: 7 }}>{label}</label>
      {children}
    </div>
  );
}

export function Input({ ...props }) {
  return <input style={inputStyle} {...inputFocusProps} {...props} />;
}

export function Select({ options = [], children, ...props }) {
  return (
    <select style={{
      ...inputStyle,
      cursor: 'pointer',
      appearance: 'none',
      WebkitAppearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 5L6 8L9 5' stroke='%236E6E73' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px center',
      paddingRight: 36,
    }} {...inputFocusProps} {...props}>
      {children || (
        <>
          <option value="">Select...</option>
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </>
      )}
    </select>
  );
}

export function TextArea({ ...props }) {
  return <textarea style={{ ...inputStyle, height: 'auto', minHeight: 96, padding: 12, resize: 'vertical', lineHeight: 1.5 }} {...inputFocusProps} {...props} />;
}

const VARIANT_CLASS = {
  primary: 'pl-btn-primary',
  accent: 'pl-btn-accent',
  secondary: 'pl-btn-secondary',
  ghost: 'pl-btn-ghost',
  danger: 'pl-btn-danger',
  dark: 'pl-btn-dark',
};

export function Button({ variant = 'primary', disabled, className = '', size, ...props }) {
  const cls = ['pl-btn', VARIANT_CLASS[variant] || VARIANT_CLASS.primary, size === 'sm' ? 'pl-btn-sm' : '', className]
    .filter(Boolean).join(' ');
  return <button className={cls} disabled={disabled} {...props} />;
}
