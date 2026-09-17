import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { Modal, ModalActions } from './ui/Modal';
import { Button } from './ui/FormControls';
import { apiErrorMessage } from '../lib/apiError';

export const AWARD_TYPES = ['day', 'week', 'month'];

const TYPE_STYLE = {
  day: { tint: 'rgba(0,113,227,0.10)', color: '#0058B3', border: '#0071E3' },
  week: { tint: 'rgba(52,199,89,0.14)', color: '#1E7A3B', border: '#34C759' },
  month: { tint: 'rgba(255,149,0,0.16)', color: '#A35A00', border: '#FF9500' },
};

const TrophyIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4z" />
    <path d="M7 6H4a1 1 0 00-1 1v1a4 4 0 004 4M17 6h3a1 1 0 011 1v1a4 4 0 01-4 4" />
  </svg>
);

/**
 * Pick Man of the Day / Week / Month for one swimmer.
 *
 * `endpoint` is the role-specific POST path (`/club/awards` for managers,
 * `/coach/awards` for coaches). `pointValues` is optional: when the caller
 * knows the club's configured XP per type it is shown on each option.
 */
export function AwardModal({ swimmer, endpoint, pointValues, onClose, onAwarded }) {
  const { t } = useTranslation();
  const [type, setType] = useState('day');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const name = swimmer.full_name || `${swimmer.first_name || ''} ${swimmer.last_name || ''}`.trim();

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);
    try {
      const r = await api.post(endpoint, { swimmer_id: swimmer.id, award_type: type });
      onAwarded?.(r.data.award, type);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={t('awards.give')} onClose={onClose} icon={<TrophyIcon size={18} />}>
      <p style={{ margin: '0 0 16px', color: '#6E6E73', fontSize: 14, lineHeight: 1.5 }}>
        {t('awards.pickFor', { name })}
      </p>

      <div role="radiogroup" aria-label={t('awards.type')} style={{ display: 'grid', gap: 10 }}>
        {AWARD_TYPES.map((key) => {
          const active = type === key;
          const s = TYPE_STYLE[key];
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setType(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'start',
                background: active ? s.tint : '#FFFFFF',
                border: `1px solid ${active ? s.border : '#E5E5EA'}`,
                transition: 'border-color 0.15s ease, background 0.15s ease',
                fontFamily: 'var(--font-body)',
              }}
            >
              <span style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: active ? '#FFFFFF' : '#F2F2F7', color: active ? s.color : '#6E6E73',
              }}>
                <TrophyIcon />
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{
                  display: 'block', color: '#1D1D1F', fontSize: 15, fontWeight: 600,
                  fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
                }}>{t(`awards.types.${key}`)}</span>
                <span style={{ display: 'block', color: '#6E6E73', fontSize: 12, marginTop: 3 }}>
                  {t(`awards.typeHint.${key}`)}
                </span>
              </span>
              {pointValues?.[key] !== undefined && (
                <span style={{
                  padding: '3px 9px', borderRadius: 980, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                  background: active ? '#FFFFFF' : '#F2F2F7', color: active ? s.color : '#515154',
                }}>
                  +{pointValues[key]} XP
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div role="alert" style={{
          marginTop: 16, padding: '12px 14px', borderRadius: 10,
          background: 'rgba(255,59,48,0.10)', color: '#B12A20', fontSize: 13, lineHeight: 1.5,
        }}>{error}</div>
      )}

      <ModalActions>
        <Button variant="secondary" onClick={onClose} disabled={saving}>{t('actions.cancel')}</Button>
        <Button onClick={handleConfirm} disabled={saving}>
          {saving ? t('awards.giving') : t('awards.confirm')}
        </Button>
      </ModalActions>
    </Modal>
  );
}

export function AwardButton({ onClick, compact = false, className = 'pl-btn pl-btn-secondary pl-btn-sm', style }) {
  const { t } = useTranslation();
  return (
    <button type="button" className={className} style={style} onClick={onClick} title={t('awards.give')}>
      <svg width={compact ? 13 : 14} height={compact ? 13 : 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4z" />
        <path d="M7 6H4a1 1 0 00-1 1v1a4 4 0 004 4M17 6h3a1 1 0 011 1v1a4 4 0 01-4 4" />
      </svg>
      {compact ? t('awards.short') : t('awards.give')}
    </button>
  );
}
