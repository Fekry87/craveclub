import { useState } from 'react';
import api from '../api/axios';
import { Modal, ModalActions } from './ui/Modal';
import { Button } from './ui/FormControls';
import { inputStyle, inputFocusProps } from './ui/styles';
import { apiErrorMessage } from '../lib/apiError';

const REASON_MAX = 500;

/**
 * Asks why a session is being cancelled, then cancels it.
 *
 * Sessions are never deleted: the record stays, the reason is shown to the
 * swimmers in the app (in place of the XP they would have earned) and they get
 * a notification. `endpoint` is the role's cancel route, e.g.
 * `/coach/sessions/12/cancel` or `/club/sessions/12/cancel`.
 */
export function CancelSessionModal({ session, endpoint, onClose, onCancelled }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const trimmed = reason.trim();
  const label = session.title || session.group?.name || 'this session';
  const date = session.date?.split('T')[0];
  const when = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : '';

  const submit = async () => {
    if (!trimmed) {
      setError('Write the reason — the swimmers will see it.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const r = await api.post(endpoint, { reason: trimmed });
      onCancelled(r.data);
    } catch (err) {
      setError(apiErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Cancel session" onClose={submitting ? () => {} : onClose}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#1D1D1F', lineHeight: 1.5 }}>
        <strong style={{ fontWeight: 600 }}>{label}</strong>
        {when && <span style={{ color: '#6E6E73' }}> · {when}{session.start_time ? ` · ${session.start_time.substring(0, 5)}` : ''}</span>}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6E6E73', lineHeight: 1.5, margin: '6px 0 16px' }}>
        The session stays on record as cancelled. Every swimmer in it gets a notification, and the app shows them this reason.
      </div>

      <label htmlFor="cancel-reason" style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, color: '#6E6E73', marginBottom: 6 }}>
        Reason for cancelling
      </label>
      <textarea
        id="cancel-reason"
        autoFocus
        rows={3}
        maxLength={REASON_MAX}
        value={reason}
        onChange={e => { setReason(e.target.value); if (error) setError(null); }}
        placeholder="e.g. The pool is closed for maintenance"
        style={{ ...inputStyle, height: 'auto', minHeight: 88, padding: '10px 12px', resize: 'vertical', lineHeight: 1.45, width: '100%', boxSizing: 'border-box' }}
        {...inputFocusProps}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 6 }}>
        <span role={error ? 'alert' : undefined} style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#B12A20' }}>{error}</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#86868B', flexShrink: 0 }}>{reason.length}/{REASON_MAX}</span>
      </div>

      <ModalActions>
        <Button variant="secondary" onClick={onClose} disabled={submitting}>Keep session</Button>
        <Button variant="danger" onClick={submit} disabled={submitting || !trimmed}>
          {submitting ? 'Cancelling…' : 'Cancel session'}
        </Button>
      </ModalActions>
    </Modal>
  );
}

/** The reason line shown on a cancelled session wherever it is listed. */
export function CancellationNote({ session, style }) {
  if (session.status !== 'Cancelled' || !session.cancellation_reason) return null;
  return (
    <div style={{
      display: 'flex', gap: 6, alignItems: 'baseline',
      fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: 1.45, color: '#515154',
      ...style,
    }}>
      <span style={{ color: '#B12A20', fontWeight: 500, flexShrink: 0 }}>Cancelled:</span>
      <span style={{ overflowWrap: 'anywhere' }}>
        {session.cancellation_reason}
        {session.cancelled_by?.name && <span style={{ color: '#86868B' }}> — {session.cancelled_by.name}</span>}
      </span>
    </div>
  );
}
