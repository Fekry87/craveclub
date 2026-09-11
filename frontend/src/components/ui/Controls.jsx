/**
 * Shared selection controls in the Apple idiom.
 * Use these instead of hand-rolling chips, tabs, toggles or stat strips —
 * they are the single source of truth for selected-state styling.
 */

/** iOS segmented control: grey track, white selected segment. */
export function Segmented({ options, value, onChange, size = 'md', fullWidth = false }) {
  const h = size === 'sm' ? 30 : 36;
  return (
    <div style={{
      display: 'inline-flex', width: fullWidth ? '100%' : 'auto',
      background: '#F2F2F7', borderRadius: 10, padding: 2, gap: 2,
    }}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              flex: fullWidth ? 1 : '0 0 auto',
              height: h, padding: '0 14px',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              background: active ? '#FFFFFF' : 'transparent',
              color: active ? '#0071E3' : '#6E6E73',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              fontFamily: 'var(--font-body)', fontSize: 13,
              fontWeight: active ? 600 : 500,
              transition: 'background 0.15s ease, color 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Underline tabs for page-level sections. */
export function Tabs({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 22, borderBottom: '1px solid #E5E5EA' }}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              padding: '10px 0', marginBottom: -1,
              background: 'transparent', cursor: 'pointer',
              border: 'none', borderBottom: `2px solid ${active ? '#0071E3' : 'transparent'}`,
              color: active ? '#0071E3' : '#6E6E73',
              fontFamily: 'var(--font-body)', fontSize: 14,
              fontWeight: active ? 600 : 500,
              transition: 'color 0.15s ease, border-color 0.15s ease',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Rounded filter chips: tinted blue when selected. */
export function Chips({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              height: 32, padding: '0 14px', borderRadius: 980, cursor: 'pointer',
              border: `1px solid ${active ? '#0071E3' : '#E5E5EA'}`,
              background: active ? '#0071E3' : '#FFFFFF',
              color: active ? '#FFFFFF' : '#515154',
              fontFamily: 'var(--font-body)', fontSize: 13,
              fontWeight: active ? 600 : 500,
              transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** iOS switch. */
export function Toggle({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      style={{
        position: 'relative', display: 'inline-flex', flexShrink: 0,
        width: 44, height: 26, borderRadius: 13, padding: 0,
        background: checked ? '#34C759' : '#E5E5EA',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.2s ease',
      }}
    >
      <span style={{
        position: 'absolute', top: 2, insetInlineStart: checked ? 20 : 2,
        width: 22, height: 22, borderRadius: 11, background: '#FFFFFF',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        transition: 'inset-inline-start 0.2s ease',
      }} />
    </button>
  );
}

/** Row of stats inside a card — hairline separated, no grey slab. */
export function StatStrip({ items }) {
  return (
    <div style={{ display: 'flex', borderTop: '1px solid #F2F2F7' }}>
      {items.map((it, i) => (
        <div key={it.label} style={{
          flex: 1, padding: '14px 8px', textAlign: 'center',
          borderInlineStart: i > 0 ? '1px solid #F2F2F7' : 'none',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
            letterSpacing: '-0.02em', color: '#1D1D1F', lineHeight: 1.1,
          }}>{it.value}</div>
          <div style={{ fontSize: 12, color: '#6E6E73', marginTop: 3 }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}
