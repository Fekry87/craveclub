import { useIsMobile } from './hooks';
import { CardActions, getAvatarColor, MobileCardWrapper } from './Cards';
import { labelStyle } from './styles';
import { useTranslation } from 'react-i18next';

function DefaultMobileCard({ row, columns, onEdit, onDelete, actions, index }) {
  const primaryValue = columns[0].render ? columns[0].render(row) : row[columns[0].key];
  const nameStr = typeof primaryValue === 'string' ? primaryValue : (row.name || row.first_name || '?');
  const avatarColor = getAvatarColor(nameStr);
  const initials = nameStr.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <MobileCardWrapper index={index}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 20,
          background: avatarColor.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600,
          color: avatarColor.text, flexShrink: 0,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: '#1D1D1F', fontSize: 16, fontWeight: 600,
            fontFamily: 'var(--font-display)', letterSpacing: '-0.01em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{primaryValue}</div>
        </div>
      </div>

      {columns.length > 1 && (
        <div>
          {columns.slice(1).map((col) => {
            const val = col.render ? col.render(row) : row[col.key];
            if (val === null || val === undefined || val === '') return null;
            return (
              <div key={col.key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '9px 0', borderTop: '1px solid #F2F2F7',
              }}>
                <span style={{ ...labelStyle, flexShrink: 0 }}>{col.label}</span>
                <span style={{ color: '#1D1D1F', fontSize: 13, textAlign: 'end' }}>{val}</span>
              </div>
            );
          })}
        </div>
      )}

      <CardActions row={row} onEdit={onEdit} onDelete={onDelete} actions={actions} />
    </MobileCardWrapper>
  );
}

const thStyle = {
  textAlign: 'start', padding: '11px 16px',
  ...labelStyle,
  borderBottom: '1px solid #E5E5EA',
  background: '#FAFAFC',
  whiteSpace: 'nowrap',
};

export function DataTable({ columns, data, onEdit, onDelete, actions, mobileCard }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  if (!data?.length) {
    return (
      <div style={{
        color: '#6E6E73', padding: '56px 32px', textAlign: 'center',
        background: '#FFFFFF', border: '1px dashed #D2D2D7', borderRadius: 16,
      }}>
        <div style={{
          width: 52, height: 52, margin: '0 auto 14px', borderRadius: 14,
          background: '#F2F2F7', color: '#86868B',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', color: '#1D1D1F', marginBottom: 4 }}>{t('empty.noData')}</div>
        <div style={{ fontSize: 13, color: '#6E6E73' }}>{t('empty.itemsWillAppear')}</div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((row, i) => (
          mobileCard
            ? mobileCard(row, i, { onEdit, onDelete, actions })
            : <DefaultMobileCard
                key={row.id || i}
                row={row}
                columns={columns}
                onEdit={onEdit}
                onDelete={onDelete}
                actions={actions}
                index={i}
              />
        ))}
      </div>
    );
  }

  const hasActions = onEdit || onDelete || actions;

  return (
    <div style={{ overflowX: 'auto', border: '1px solid #E5E5EA', background: '#FFFFFF', borderRadius: 16 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={thStyle}>{col.label}</th>
            ))}
            {hasActions && (
              <th style={{ ...thStyle, textAlign: 'end' }}>{t('actions.edit')}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i}
              className="data-table-row"
              style={{
                borderBottom: i < data.length - 1 ? '1px solid #F2F2F7' : 'none',
                background: 'transparent',
              }}>
              {columns.map((col, ci) => (
                <td key={col.key} style={{
                  padding: '12px 16px', color: ci === 0 ? '#1D1D1F' : '#515154',
                  fontSize: 14,
                  fontWeight: ci === 0 ? 500 : 400,
                }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              {hasActions && (
                <td style={{ padding: '8px 16px', textAlign: 'end' }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    {actions && actions(row)}
                    {onEdit && (
                      <button type="button" className="pl-btn pl-btn-ghost pl-btn-sm" onClick={() => onEdit(row)}>
                        {t('actions.edit')}
                      </button>
                    )}
                    {onDelete && (
                      <button type="button" className="pl-btn pl-btn-danger pl-btn-sm" onClick={() => onDelete(row)}>
                        {t('actions.delete')}
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
