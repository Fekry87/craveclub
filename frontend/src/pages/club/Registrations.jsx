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

/* ─────── Toast Notification ─────── */
function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 1000,
      background: 'linear-gradient(145deg, rgba(13,31,60,0.95) 0%, rgba(10,22,40,0.95) 100%)',
      border: '1px solid rgba(34,211,238,0.15)',
      borderRadius: 14,
      padding: '14px 20px',
      color: '#f1f5f9',
      fontSize: 13,
      fontWeight: 500,
      fontFamily: "'DM Sans', sans-serif",
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'fadeInUp 0.3s ease-out',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: '#34d399',
        flexShrink: 0,
        animation: 'glowPulse 2s infinite',
      }} />
      {message}
    </div>
  );
}

/* ─────── Live Indicator ─────── */
function LiveBadge({ liveState }) {
  const { t } = useTranslation();
  const isLive = liveState === 'live';
  const isOffline = liveState === 'offline';
  const color = isLive ? '#34d399' : isOffline ? '#f59e0b' : '#64748b';
  const label = isLive ? t('registrations.live') : isOffline ? t('registrations.offline') : t('registrations.connecting');
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
      color,
      textTransform: 'uppercase',
      padding: '4px 10px', borderRadius: 6,
      background: isLive ? 'rgba(52,211,153,0.10)' : isOffline ? 'rgba(245,158,11,0.08)' : 'rgba(13,31,60,0.4)',
      border: `1px solid ${isLive ? 'rgba(52,211,153,0.20)' : isOffline ? 'rgba(245,158,11,0.18)' : 'rgba(34,211,238,0.06)'}`,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        backgroundColor: color,
        animation: isLive ? 'glowPulse 2s infinite' : 'none',
      }} />
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
          color: '#94a3b8', fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.08)',
            borderTopColor: '#22d3ee',
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
        background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.20)',
        borderRadius: 18, padding: '24px 28px', textAlign: 'center',
      }}>
        <p style={{ color: '#f43f5e', fontSize: 13, margin: '0 0 14px' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'rgba(34,211,238,0.08)', color: '#22d3ee',
            border: '1px solid rgba(34,211,238,0.15)', borderRadius: 10,
            padding: '8px 20px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}
        >
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
    padding: '12px 16px', textAlign: 'start', fontSize: 11,
    fontWeight: 600, color: '#64748b', textTransform: 'uppercase',
    letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.04)',
    fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
    background: 'rgba(13,31,60,0.4)',
  };

  const tdStyle = {
    padding: '14px 16px', fontSize: 13, color: '#94a3b8',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    fontFamily: "'DM Sans', sans-serif",
  };

  const actionBtnBase = {
    padding: '5px 12px', borderRadius: 6,
    fontSize: 11, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.2s ease',
    fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.01em',
    display: 'inline-flex', alignItems: 'center', gap: 4,
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
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {pendingCount}
              {pendingCount > 0 && (
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#fbbf24',
                  animation: 'glowPulse 2s infinite',
                  display: 'inline-block',
                }} />
              )}
            </span>
          }
          accentColor="#fbbf24"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatCard
          label={t('status.approved')}
          value={approvedCount}
          accentColor="#34d399"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
        <StatCard
          label={t('status.rejected')}
          value={rejectedCount}
          accentColor="#f43f5e"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />
        <StatCard
          label={t('registrations.total')}
          value={totalCount}
          accentColor="#22d3ee"
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
        <div style={{
          background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
          borderRadius: 18,
          border: '1px solid rgba(34,211,238,0.06)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)',
          animation: 'fadeInUp 0.4s ease-out 0.1s both',
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
        <div style={{
          background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
          borderRadius: 18,
          border: '1px solid rgba(34,211,238,0.06)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)',
          overflow: 'hidden',
          animation: 'fadeInUp 0.4s ease-out 0.1s both',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr>
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
                {registrations.map(reg => (
                  <tr
                    key={reg.id}
                    className="data-table-row"
                    style={{
                      backgroundColor: newIds.has(reg.id)
                        ? 'rgba(52,211,153,0.08)' : 'transparent',
                      transition: 'background-color 1s ease',
                    }}
                  >
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#f1f5f9' }}>
                      {reg.swimmer_name ?? reg.full_name}
                    </td>
                    <td style={tdStyle}>{reg.swimmer_phone ?? reg.phone}</td>
                    <td style={tdStyle}>{reg.branch_name ?? reg.branch?.name ?? '\u2014'}</td>
                    <td style={tdStyle}>{reg.coach_name ?? reg.coach?.user?.name ?? '\u2014'}</td>
                    <td style={tdStyle}>{reg.plan_name ?? reg.plan?.name ?? '\u2014'}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#22d3ee' }}>
                      {reg.total_amount} {t('common.currency')}
                    </td>
                    <td style={tdStyle}>
                      <Badge
                        label={t(`status.${reg.status === 'cancelled' ? 'rejected' : reg.status}`, { defaultValue: reg.status })}
                        variant={STATUS_VARIANT[reg.status] || 'neutral'}
                      />
                    </td>
                    <td style={{ ...tdStyle, color: '#64748b', fontSize: 11 }}>
                      {formatDate(reg.created_at)}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      {reg.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => { setApproveTarget(reg); setActionError(null); setApproveResult(null); }}
                            style={{
                              ...actionBtnBase,
                              background: 'rgba(52,211,153,0.10)',
                              color: '#34d399',
                              border: '1px solid rgba(52,211,153,0.20)',
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {t('registrations.approve')}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRejectTarget(reg); setActionError(null); }}
                            style={{
                              ...actionBtnBase,
                              background: 'rgba(244,63,94,0.10)',
                              color: '#f43f5e',
                              border: '1px solid rgba(244,63,94,0.20)',
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            {t('registrations.reject')}
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#475569', fontSize: 11 }}>{'\u2014'}</span>
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        >
          {approveResult ? (
            /* ── Success view ── */
            <div>
              <div style={{
                background: 'var(--color-success-bg)', border: '1px solid var(--color-success)',
                borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--color-surface)',
                    border: '2px solid var(--color-success)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-success-text)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-success-text)', fontWeight: 600, fontSize: 'var(--text-md)', fontFamily: 'var(--font-sans)' }}>
                      {t('registrations.approvedTitle')}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', marginTop: 2 }}>
                      {t('registrations.accountCreated')}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '14px 16px',
                  border: '1px solid var(--color-border)',
                }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 10 }}>
                    {t('registrations.accountCredentials')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{t('registrations.email')}</span>
                      <span style={{ color: 'var(--color-text)', fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{approveResult.email}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{t('registrations.tempPassword')}</span>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{approveResult.temp_password}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{t('registrations.groupAssigned')}</span>
                      <span style={{ color: approveResult.group_assigned ? 'var(--color-success-text)' : 'var(--color-warning-text)', fontWeight: 500 }}>
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
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: '0 0 16px', lineHeight: 1.6 }}>
                <Trans
                  i18nKey="registrations.confirmApprove"
                  values={{ name: approveTarget.full_name }}
                  components={{ b: <strong style={{ color: 'var(--color-text)' }} /> }}
                />
              </p>

              <div style={{
                background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', padding: '16px 18px',
                border: '1px solid var(--color-border)', marginBottom: 8,
              }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 12 }}>
                  {t('registrations.willAutomatically')}
                </div>
                <ul style={{ margin: 0, paddingBlock: 0, paddingInline: '18px 0', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', lineHeight: 2 }}>
                  <li>
                    <Trans i18nKey="registrations.bulletAccount" components={{ b: <span style={{ color: 'var(--color-text)' }} /> }} />
                  </li>
                  <li>
                    <Trans
                      i18nKey="registrations.bulletBranch"
                      values={{ branch: approveTarget.branch?.name ?? t('registrations.selectedBranch') }}
                      components={{ b: <span style={{ color: 'var(--color-primary)' }} /> }}
                    />
                  </li>
                  <li>
                    <Trans
                      i18nKey="registrations.bulletGroup"
                      values={{ coach: approveTarget.coach?.user?.name ?? t('registrations.selectedCoach') }}
                      components={{ b: <span style={{ color: 'var(--color-primary)' }} /> }}
                    />
                  </li>
                </ul>
              </div>

              {actionError && (
                <div style={{
                  background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)',
                  borderRadius: 'var(--radius-md)', padding: '10px 14px', marginTop: 12,
                  color: 'var(--color-danger-text)', fontSize: 'var(--text-sm)',
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
                        width: 14, height: 14, borderRadius: '50%',
                        border: '2px solid var(--color-border)',
                        borderTopColor: 'var(--color-primary)',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      {t('registrations.approving')}
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        >
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: '0 0 16px', lineHeight: 1.6 }}>
            <Trans
              i18nKey="registrations.confirmReject"
              values={{ name: rejectTarget.full_name }}
              components={{ b: <strong style={{ color: 'var(--color-text)' }} /> }}
            />
          </p>

          <div style={{
            background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 8,
            color: 'var(--color-danger-text)', fontSize: 'var(--text-sm)', lineHeight: 1.5,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {t('registrations.rejectWarning')}
          </div>

          {actionError && (
            <div style={{
              background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius-md)', padding: '10px 14px', marginTop: 12,
              color: 'var(--color-danger-text)', fontSize: 'var(--text-sm)',
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
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid var(--color-danger-bg)',
                    borderTopColor: 'var(--color-danger-text)',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  {t('registrations.rejecting')}
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
