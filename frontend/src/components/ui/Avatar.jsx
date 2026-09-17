import { useEffect, useState } from 'react';
import { getAvatarColor } from './Cards';

function initialsOf(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase() || '?';
}

/**
 * A swimmer's face: the uploaded photo when there is one, otherwise the
 * name's initials on the colour every page already derives from the name.
 * A photo that fails to load falls back too, so a stale token never leaves
 * an empty circle.
 *
 * `src` is the API's `avatar_url` (null when no photo). `size` is the box in
 * px; `radius` defaults to a circle; `fontSize` defaults from the size.
 */
export function Avatar({ src, name, size = 40, radius, fontSize, style, title }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const color = getAvatarColor(name || '');
  const box = {
    width: size, height: size, borderRadius: radius ?? '50%', flexShrink: 0,
    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: color.bg, color: color.text,
    fontSize: fontSize ?? Math.round(size * 0.36), fontWeight: 600,
    fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
    ...style,
  };

  if (src && !failed) {
    return (
      <div style={box} title={title ?? name}>
        <img
          src={src}
          alt={name || ''}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  return <div style={box} title={title ?? name} aria-label={name}>{initialsOf(name)}</div>;
}
