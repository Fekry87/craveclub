import { useTranslation } from 'react-i18next';

const axisLabelStyle = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 500,
  color: '#86868B',
};

const overlayStyle = {
  position: 'absolute', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'var(--font-body)', fontSize: 12,
  color: '#86868B',
  pointerEvents: 'none',
};

export function MiniChart({ data = [], type = 'bar', color = '#0071E3', height = 120 }) {
  const { t } = useTranslation();
  if (!data.length) return null;

  const allZero = data.every(d => d.value === 0);
  const max = Math.max(...data.map(d => d.value), 1);

  // Unique gradient ID per chart instance
  const gradId = `lineGrad_${type}_${color.replace('#', '')}`;

  // Vertical padding inside the chart area (percentage of viewBox height)
  const padTop = 10;
  const padBot = 10;
  const chartRange = 100 - padTop - padBot;

  if (type === 'line') {
    const getY = (val) => allZero ? 50 : padTop + chartRange - (val / max) * chartRange;

    const points = data.map((d, i) => {
      const x = (i / (data.length - 1 || 1)) * 100;
      return `${x},${getY(d.value)}`;
    }).join(' ');

    const fillBottom = 100 - padBot;

    return (
      <div style={{ width: '100%', height, position: 'relative' }}>
        {/* SVG for line + fill (stretches with preserveAspectRatio="none") */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Subtle grid lines */}
          {[0.25, 0.5, 0.75].map(frac => {
            const gy = padTop + chartRange * (1 - frac);
            return <line key={frac} x1="0" y1={gy} x2="100" y2={gy} stroke="#F2F2F7" strokeWidth="1" vectorEffect="non-scaling-stroke" />;
          })}
          <polygon points={`0,${fillBottom} ${points} 100,${fillBottom}`} fill={`url(#${gradId})`} />
          <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* Dots as HTML elements so they stay round (not distorted by SVG stretch) */}
        {!allZero && data.map((d, i) => {
          const xPct = (i / (data.length - 1 || 1)) * 100;
          const yPct = getY(d.value);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${xPct}%`,
                top: `${yPct}%`,
                width: 7, height: 7, borderRadius: '50%',
                background: color,
                border: '1.5px solid #FFFFFF',
                boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            />
          );
        })}

        {/* "All zero" overlay */}
        {allZero && (
          <div style={overlayStyle}>
            {t('empty.noData')}
          </div>
        )}

        {/* X-axis labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 2px 0' }}>
          {data.map((d, i) => (
            <span key={i} style={{ ...axisLabelStyle, whiteSpace: 'nowrap' }}>{d.label}</span>
          ))}
        </div>
      </div>
    );
  }

  // Bar chart
  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: '80%' }}>
        {data.map((d, i) => {
          const barPct = allZero ? 6 : Math.max((d.value / max) * 100, 4);
          return (
            <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
              <div style={{
                width: '68%', height: `${barPct}%`,
                background: allZero ? '#EDEDF0' : color,
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease',
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', marginTop: 6 }}>
        {data.map((d, i) => (
          <div key={i} style={{ ...axisLabelStyle, flex: 1, textAlign: 'center' }}>
            {d.label}
          </div>
        ))}
      </div>
      {allZero && (
        <div style={overlayStyle}>
          {t('empty.noData')}
        </div>
      )}
    </div>
  );
}
