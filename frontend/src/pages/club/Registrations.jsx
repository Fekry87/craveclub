import { useState, useEffect, useRef } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { createEcho } from '../../lib/echo';
import { formatDate } from '../../lib/dates';
import api from '../../api/axios';
import { Modal, ModalActions } from '../../components/ui/Modal';
import { Button } from '../../components/ui/FormControls';
import { StatCard } from '../../components/ui/Cards';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/CrudTable';
import { labelStyle } from '../../components/ui/styles';

/* ─────── Toast Notification ─────── */
function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', top: 20, insetInlineEnd: 20, zIndex: 1000,
      background: 'rgba(29,29,31,0.92)',
      color: '#1D1D1F',
      borderRadius: 12,
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
      padding: '12px 16px',
      fontSize: 14,
      fontFamily: 'var(--font-body)',
      animation: 'fadeInUp 0.25s ease-out',
      display: 'flex', alignItems: 'center', gap: 10,
      maxWidth: 'min(360px, calc(100vw - 40px))',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34C759', flexShrink: 0 }} />
      {message}
    </div>
  );
}

/* ─────── Live Indicator ─────── */
function LiveBadge({ liveState }) {
  const { t } = useTranslation();
  const isLive = liveState === 'live';
  const isOffline = liveState === 'offline';
  const dot = isLive ? '#34C759' : isOffline ? '#FF9500' : '#86868B';
  const tint = isLive ? 'rgba(52,199,89,0.14)' : isOffline ? 'rgba(255,149,0,0.16)' : '#F2F2F7';
  const text = isLive ? '#1E7A3B' : isOffline ? '#A35A00' : '#515154';
  const label = isLive ? t('registrations.live') : isOffline ? t('registrations.offline') : t('registrations.connecting');
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, lineHeight: '16px',
      color: text, background: tint,
      padding: '4px 11px', borderRadius: 980, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: dot, flexShrink: 0 }} />
      {label}
    </span>
  );
}

/* ─────── Status to Badge variant map ─────── */
const STATUS_VARIANT = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'danger',
};

/* ─────── Main Page ─────── */
export default function Registrations() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState(null);
  const [error, setError] = useState(null);
  const [liveState, setLiveState] = useState('connecting'); // connecting | live | offline
  const [newIds, setNewIds] = useState(new Set());
  const [toast, setToast] = useState(null);
  const echoRef = useRef(null);

  // Action modals state
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actionSaving, setActionSaving] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [approveResult, setApproveResult] = useState(null);

  // ── Fetch existing registrations ──────────────────────
  useEffect(() => {
    api.get('/club/registrations')
      .then(res => setRegistrations(res.data.data))
      .catch(err => setError(err.response?.data?.message ?? t('registrations.loadFailed')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Reverb subscription ───────────────────────────────
  useEffect(() => {
    if (!user?.club_id) return;

    const echo = createEcho();
    echoRef.current = echo;

    echo.connector.pusher.connection.bind('state_change', ({ current }) => {
      if (current === 'connected') setLiveState('live');
      else if (current === 'connecting' || current === 'initialized') setLiveState('connecting');
      else setLiveState('offline'); // unavailable, failed, disconnected
    });

    echo
      .private(`club.${user.club_id}`)
      .listen('.NewRegistrationSubmitted', (payload) => {
        setRegistrations(prev => prev ? [payload, ...prev] : [payload]);

        setNewIds(prev => new Set([...prev, payload.id]));
        setTimeout(() => {
          setNewIds(prev => {
            const next = new Set(prev);
            next.delete(payload.id);
            return next;
          });
        }, 4000);

        setToast(t('registrations.justRegistered', { name: payload.swimmer_name }));
        setTimeout(() => setToast(null), 5000);

        if (document.hidden && Notification.permission === 'granted') {
          new Notification(t('registrations.newRegistration'), {
            body: `${payload.swimmer_name} \u2014 ${payload.plan_name}`,
          });
        }
      });

    return () => {
      echo.leave(`club.${user.club_id}`);
      echo.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.club_id]);

  // ── Request browser notification permission ───────────
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ── Action handlers ───────────────────────────────────
  const handleApprove = async () => {
    if (!approveTarget) return;
    setActionSaving(true);
    setActionError(null);
    try {
      const res = await api.patch(`/club/registrations/${approveTarget.id}/status`, {
        status: 'approved',
      });
      setRegistrations(prev =>
        prev.map(r => r.id === approveTarget.id ? res.data.registration : r)
      );
      setApproveResult(res.data.swimmer);
      setToast(t('registrations.approvedSuccess', { name: approveTarget.full_name }));
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).map(a => a[0]).join(', ')
        : err.response?.data?.message ?? t('registrations.approveFailed');
      setActionError(msg);
    } finally {
      setActionSaving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionSaving(true);
    setActionError(null);
    try {
      const res = await api.patch(`/club/registrations/${rejectTarget.id}/status`, {
        status: 'cancelled',
      });
      setRegistrations(prev =>
        prev.map(r => r.id === rejectTarget.id ? res.data.registration : r)
      );
      setRejectTarget(null);
      setToast(t('registrations.rejectedSuccess', { name: rejectTarget.full_name }));
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).map(a => a[0]).join(', ')
        : err.response?.data?.message ?? t('registrations.rejectFailed');
      setActionError(msg);
    } finally {
      setActionSaving(false);
    }
  };

  const closeApproveModal = () => {
    setApproveTarget(null);
    setActionError(null);
    setApproveResult(null);
  };

  const closeRejectModal = () => {
    setRejectTarget(null);
    setActionError(null);
  };

  // ── Loading state ─────────────────────────────────────
  if (registrations === null && !error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <div style={{
          ...labelStyle,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 18, height: 18, border: '2px solid #E5E5EA',
            borderTopColor: '#0071E3',
            animation: 'spin 0.8s linear infinite',
          }} />
          {t('registrations.loading')}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────
  if (error) {
    return (
      <div style={{
        background: '#FFFFFF', border: '1px solid #FF3B30',
        padding: '24px 28px', textAlign: 'center',
      }}>
        <p style={{ color: '#FF3B30', fontSize: 13, margin: '0 0 16px' }}>{error}</p>
        <button type="button" onClick={() => window.location.reload()} className="pl-btn pl-btn-secondary">
          {t('actions.retry')}
        </button>
      </div>
    );
  }

  // ── Compute stats ─────────────────────────────────────
  const pendingCount = registrations.filter(r => r.status === 'pending').length;
  const approvedCount = registrations.filter(r => r.status === 'approved').length;
  const rejectedCount = registrations.filter(r => r.status === 'cancelled' || r.status === 'rejected').length;
  const totalCount = registrations.length;

  const thStyle = {
    padding: '12px 16px', textAlign: 'start',
    ...labelStyle, fontWeight: 500,
    borderBottom: '1px solid #E5E5EA',
    whiteSpace: 'nowrap',
    background: '#FFFFFF',
  };

  const tdStyle = {
    padding: '14px 16px', fontSize: 14, color: '#1D1D1F',
    borderBottom: '1px solid #E5E5EA',
    fontFamily: 'var(--font-body)',
  };

  return (
    <div style={{ position: 'relative' }}>
      <Toast message={toast} />

      {/* ── Page Header ─────────────────────────────────── */}
      <PageHeader title={t('registrations.title')}>
        <LiveBadge liveState={liveState} />
      </PageHeader>

      {/* ── Stat Cards ────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14, marginBottom: 22,
        animation: 'fadeInUp 0.4s ease-out both',
      }}>
        <StatCard
          label={t('status.pending')}
          value={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              {pendingCount}
              {pendingCount > 0 && (
                <span style={{ width: 8, height: 8, borderRadius: 4, background: '#0071E3', display: 'inline-block' }} />
              )}
            </span>
          }
          index={0}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatCard
          label={t('status.approved')}
          value={approvedCount}
          index={1}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
        <StatCard
          label={t('status.rejected')}
          value={rejectedCount}
          index={2}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />
        <StatCard
          label={t('registrations.total')}
          value={totalCount}
          index={3}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          }
        />
      </div>

      {/* ── Empty State ─────────────────────────────────── */}
      {registrations.length === 0 && (
        <div style={{ borderRadius: 16,
          background: '#FFFFFF',
          border: '1px solid #E5E5EA',
          animation: 'fadeInUp 0.3s ease-out 0.08s both',
        }}>
          <EmptyState
            title={t('registrations.noPending')}
            description={t('registrations.noPendingHint')}
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            }
          />
        </div>
      )}

      {/* ── Registrations Table ─────────────────────────── */}
      {registrations.length > 0 && (
        <div style={{ borderRadius: 16,
          background: '#FFFFFF',
          border: '1px solid #E5E5EA',
          animation: 'fadeInUp 0.3s ease-out 0.08s both',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 940 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 56, color: '#6E6E73' }}>#</th>
                  <th style={thStyle}>{t('registrations.columns.name')}</th>
                  <th style={thStyle}>{t('registrations.columns.phone')}</th>
                  <th style={thStyle}>{t('registrations.columns.branch')}</th>
                  <th style={thStyle}>{t('registrations.columns.coach')}</th>
                  <th style={thStyle}>{t('registrations.columns.plan')}</th>
                  <th style={thStyle}>{t('registrations.columns.amount')}</th>
                  <th style={thStyle}>{t('registrations.columns.status')}</th>
                  <th style={thStyle}>{t('registrations.columns.date')}</th>
                  <th style={thStyle}>{t('registrations.columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg, ri) => (
                  <tr
                    key={reg.id}
                    className="data-table-row"
                    style={{
                      backgroundColor: newIds.has(reg.id) ? '#F2F2F7' : 'transparent',
                      transition: 'background-color 1s ease',
                    }}
                  >
                    <td style={{ ...tdStyle, ...labelStyle, color: '#6E6E73', padding: '14px 16px' }}>
                      
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>
                      {reg.swimmer_name ?? reg.full_name}
                    </td>
                    <td style={{ ...tdStyle, color: '#515154' }}>{reg.swimmer_phone ?? reg.phone}</td>
                    <td style={{ ...tdStyle, color: '#515154' }}>{reg.branch_name ?? reg.branch?.name ?? '\u2014'}</td>
                    <td style={{ ...tdStyle, color: '#515154' }}>{reg.coach_name ?? reg.coach?.user?.name ?? '\u2014'}</td>
                    <td style={{ ...tdStyle, color: '#515154' }}>{reg.plan_name ?? reg.plan?.name ?? '\u2014'}</td>
                    <td style={{ ...tdStyle, fontWeight: 500, color: '#0071E3' }}>
                      {reg.total_amount} {t('common.currency')}
                    </td>
                    <td style={tdStyle}>
                      <Badge
                        label={t(`status.${reg.status === 'cancelled' ? 'rejected' : reg.status}`, { defaultValue: reg.status })}
                        variant={STATUS_VARIANT[reg.status] || 'neutral'}
                      />
                    </td>
                    <td style={{ ...tdStyle, ...labelStyle, padding: '14px 16px' }}>
                      {formatDate(reg.created_at)}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      {reg.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="pl-btn pl-btn-primary pl-btn-sm"
                            onClick={() => { setApproveTarget(reg); setActionError(null); setApproveResult(null); }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {t('registrations.approve')}
                          </button>
                          <button
                            type="button"
                            className="pl-btn pl-btn-danger pl-btn-sm"
                            onClick={() => { setRejectTarget(reg); setActionError(null); }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            {t('registrations.reject')}
                          </button>
                        </div>
                      ) : (
                        <span style={{ ...labelStyle, color: '#6E6E73' }}>{'\u2014'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Approve Confirmation Modal ────────────────────── */}
      {approveTarget && (
        <Modal
          title={t('registrations.approveTitle')}
          onClose={closeApproveModal}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        >
          {approveResult ? (
            /* ── Success view ── */
            <div>
              <div style={{
                background: '#FFFFFF', border: '1px solid #34C759',
                padding: '20px 22px', marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ borderRadius: 10,
                    width: 36, height: 36,
                    border: '1px solid #34C759',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      color: '#1D1D1F', fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600,
                      letterSpacing: '-0.02em', lineHeight: 1,
                    }}>
                      {t('registrations.approvedTitle')}
                    </div>
                    <div style={{ ...labelStyle, marginTop: 7 }}>
                      {t('registrations.accountCreated')}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #E5E5EA', paddingTop: 14 }}>
                  <div style={{ ...labelStyle, marginBottom: 10 }}>
                    {t('registrations.accountCredentials')}
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid #F2F2F7' }}>
                      <span style={{ ...labelStyle }}>{t('registrations.email')}</span>
                      <span style={{ color: '#1D1D1F', fontFamily: 'var(--font-body)', fontSize: 12, textAlign: 'end' }}>{approveResult.email}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid #F2F2F7' }}>
                      <span style={{ ...labelStyle }}>{t('registrations.tempPassword')}</span>
                      <span style={{ color: '#0071E3', fontFamily: 'var(--font-body)', fontSize: 12, textAlign: 'end' }}>{approveResult.temp_password}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0' }}>
                      <span style={{ ...labelStyle }}>{t('registrations.groupAssigned')}</span>
                      <span style={{ color: approveResult.group_assigned ? '#34C759' : '#FF9500', fontSize: 13, textAlign: 'end' }}>
                        {approveResult.group_assigned ? t('common.yes') : t('registrations.noGroupFound')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <ModalActions>
                <Button variant="primary" onClick={closeApproveModal}>{t('actions.done')}</Button>
              </ModalActions>
            </div>
          ) : (
            /* ── Confirmation view ── */
            <div>
              <p style={{ color: '#515154', fontSize: 14, margin: '0 0 16px', lineHeight: 1.6 }}>
                <Trans
                  i18nKey="registrations.confirmApprove"
                  values={{ name: approveTarget.full_name }}
                  components={{ b: <strong style={{ color: '#1D1D1F', fontWeight: 500 }} /> }}
                />
              </p>

              <div style={{ borderRadius: 16,
                background: '#F2F2F7', padding: '16px 18px',
                border: '1px solid #E5E5EA', marginBottom: 8,
              }}>
                <div style={{ ...labelStyle, marginBottom: 12 }}>
                  {t('registrations.willAutomatically')}
                </div>
                <ul style={{ margin: 0, paddingBlock: 0, paddingInline: '18px 0', color: '#515154', fontSize: 13, lineHeight: 2 }}>
                  <li>
                    <Trans i18nKey="registrations.bulletAccount" components={{ b: <span style={{ color: '#1D1D1F' }} /> }} />
                  </li>
                  <li>
                    <Trans
                      i18nKey="registrations.bulletBranch"
                      values={{ branch: approveTarget.branch?.name ?? t('registrations.selectedBranch') }}
                      components={{ b: <span style={{ color: '#0071E3' }} /> }}
                    />
                  </li>
                  <li>
                    <Trans
                      i18nKey="registrations.bulletGroup"
                      values={{ coach: approveTarget.coach?.user?.name ?? t('registrations.selectedCoach') }}
                      components={{ b: <span style={{ color: '#0071E3' }} /> }}
                    />
                  </li>
                </ul>
              </div>

              {actionError && (
                <div style={{
                  background: '#FFFFFF', border: '1px solid #FF3B30',
                  padding: '10px 14px', marginTop: 12,
                  color: '#FF3B30', fontSize: 13,
                }}>
                  {actionError}
                </div>
              )}

              <ModalActions>
                <Button variant="secondary" onClick={closeApproveModal} disabled={actionSaving}>{t('actions.cancel')}</Button>
                <Button
                  variant="primary"
                  onClick={handleApprove}
                  disabled={actionSaving}
                >
                  {actionSaving ? (
                    <>
                      <div style={{
                        width: 14, height: 14, border: '2px solid rgba(242,242,242,0.35)',
                        borderTopColor: '#F5F5F7',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      {t('registrations.approving')}
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {t('registrations.approveTitle')}
                    </>
                  )}
                </Button>
              </ModalActions>
            </div>
          )}
        </Modal>
      )}

      {/* ── Reject Confirmation Modal ─────────────────────── */}
      {rejectTarget && (
        <Modal
          title={t('registrations.rejectTitle')}
          onClose={closeRejectModal}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        >
          <p style={{ color: '#515154', fontSize: 14, margin: '0 0 16px', lineHeight: 1.6 }}>
            <Trans
              i18nKey="registrations.confirmReject"
              values={{ name: rejectTarget.full_name }}
              components={{ b: <strong style={{ color: '#1D1D1F', fontWeight: 500 }} /> }}
            />
          </p>

          <div style={{
            background: '#FFFFFF', border: '1px solid #FF3B30',
            padding: '12px 16px', marginBottom: 8,
            color: '#FF3B30', fontSize: 13, lineHeight: 1.5,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {t('registrations.rejectWarning')}
          </div>

          {actionError && (
            <div style={{
              background: '#FFFFFF', border: '1px solid #FF3B30',
              padding: '10px 14px', marginTop: 12,
              color: '#FF3B30', fontSize: 13,
            }}>
              {actionError}
            </div>
          )}

          <ModalActions>
            <Button variant="secondary" onClick={closeRejectModal} disabled={actionSaving}>{t('actions.cancel')}</Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={actionSaving}
            >
              {actionSaving ? (
                <>
                  <div style={{
                    width: 14, height: 14, border: '2px solid rgba(255,59,48,0.25)',
                    borderTopColor: '#FF3B30',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  {t('registrations.rejecting')}
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  {t('registrations.rejectTitle')}
                </>
              )}
            </Button>
          </ModalActions>
        </Modal>
      )}
    </div>
  );
}
