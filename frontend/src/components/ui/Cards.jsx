import { useTranslation } from 'react-i18next';
import { avatarCardColors, labelStyle, cardStyle } from './styles';

export function StatCard({ title, label, value, icon }) {
  // Accept both "title" and "label" props for backward compat
  const displayTitle = title || label;
  return (
    <div
      className="stat-card-wrapper"
      style={{
        ...cardStyle,
        padding: '18px 20px',
        minWidth: 0,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
      <div style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {icon && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, borderRadius: 8, background: '#F2F2F7', color: '#0071E3', flexShrink: 0,
          }}>{icon}</span>
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayTitle}</span>
      </div>
      <div style={{
        color: '#1D1D1F', fontSize: 30, fontWeight: 700, lineHeight: 1,
        fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
      }}>{value}</div>
    </div>
  );
}

export function CardInfoRow({ icon, label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 0', borderBottom: '1px solid #F2F2F7',
    }}>
      {icon && (
        <div style={{ flexShrink: 0, width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868B' }}>
          {icon}
        </div>
      )}
      <span style={{ ...labelStyle, minWidth: 70, flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#1D1D1F', fontSize: 13, flex: 1, textAlign: 'end' }}>{value}</span>
    </div>
  );
}

export function CardActions({ row, onEdit, onDelete, actions }) {
  const { t } = useTranslation();
  if (!onEdit && !onDelete && !actions) return null;
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid #F2F2F7' }}>
      {actions && actions(row)}
      {onEdit && (
        <button type="button" className="pl-btn pl-btn-secondary pl-btn-sm" style={{ flex: 1 }} onClick={() => onEdit(row)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          {t('actions.edit')}
        </button>
      )}
      {onDelete && (
        <button type="button" className="pl-btn pl-btn-danger pl-btn-sm" style={{ flex: 1 }} onClick={() => onDelete(row)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
          {t('actions.delete')}
        </button>
      )}
    </div>
  );
}

export function getAvatarColor(name) {
  let hash = 0;
  const str = name || '';
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return avatarCardColors[Math.abs(hash) % avatarCardColors.length];
}

export function MobileCardWrapper({ children, index, accentColor }) {
  return (
    <div style={{
      ...cardStyle,
      animation: `fadeInUp 0.3s ease-out ${(index || 0) * 0.04}s both`,
      position: 'relative', overflow: 'hidden',
    }}>
      {accentColor && <div style={{ position: 'absolute', insetInlineStart: 0, top: 0, bottom: 0, width: 3, background: accentColor }} />}
      <div style={{ padding: '16px 18px' }}>
        {children}
      </div>
    </div>
  );
}
