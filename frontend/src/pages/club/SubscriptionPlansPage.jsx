import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getPlans, createPlan, updatePlan, deletePlan, togglePlan, reorderPlans } from '../../api/subscriptionPlans';
import { PageHeader, Button, FormField, Input } from '../../components/CrudTable';
import { Modal, ModalActions } from '../../components/ui/Modal';
import { FormPage, FormPageActions } from '../../components/ui/FormPage';
import { Badge } from '../../components/ui/Badge';
import { cardStyle, labelStyle } from '../../components/ui/styles';

const emptyForm = {
  name: '',
  duration_months: 1,
  price: '',
  discount_percent: 0,
  is_popular: false,
  is_active: true,
};

export default function SubscriptionPlansPage() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'delete'
  const [editPlan, setEditPlan] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = () => {
    setLoadError('');
    getPlans()
      .then(data => setPlans(Array.isArray(data) ? data : data.data ?? []))
      .catch(err => {
        if (err.response?.status === 403) {
          setLoadError('feature_disabled');
        } else {
          setLoadError(t('subscriptions.loadFailed'));
        }
      });
  };

  const openCreate = () => {
    setForm(emptyForm);
    setError('');
    setEditPlan(null);
    setModal('create');
  };

  const openEdit = (plan) => {
    setForm({
      name: plan.name || '',
      duration_months: plan.duration_months ?? 1,
      price: plan.price ?? '',
      discount_percent: plan.discount_percent ?? 0,
      is_popular: plan.is_popular ?? false,
      is_active: plan.is_active ?? true,
    });
    setError('');
    setEditPlan(plan);
    setModal('edit');
  };

  const openDelete = (plan) => {
    setError('');
    setEditPlan(plan);
    setModal('delete');
  };

  const closeModal = () => {
    setModal(null);
    setEditPlan(null);
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        discount_percent: Number(form.discount_percent),
      };
      if (modal === 'create') {
        const result = await createPlan(payload);
        setPlans(prev => [...prev, result.data ?? result]);
      } else {
        const result = await updatePlan(editPlan.id, payload);
        const updated = result.data ?? result;
        setPlans(prev => prev.map(p => p.id === editPlan.id ? updated : (payload.is_popular ? { ...p, is_popular: false } : p)));
      }
      closeModal();
      loadPlans(); // Refresh to get accurate is_popular state
    } catch (err) {
      if (err.response?.status === 422) {
        const data = err.response.data;
        if (data.errors) {
          setError(Object.values(data.errors).map(a => a[0]).join('. '));
        } else {
          setError(data.message || t('subscriptions.validationFailed'));
        }
      } else {
        setError(err.response?.data?.message || t('subscriptions.saveFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError('');
    try {
      await deletePlan(editPlan.id);
      setPlans(prev => prev.filter(p => p.id !== editPlan.id));
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || t('subscriptions.deleteFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (plan) => {
    try {
      const result = await togglePlan(plan.id);
      const updated = result.data ?? result;
      setPlans(prev => prev.map(p => p.id === plan.id ? updated : p));
    } catch {
      // silently fail — user sees no change
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0 || !plans) return;
    const ids = plans.map(p => p.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    try {
      const result = await reorderPlans(ids);
      setPlans(Array.isArray(result) ? result : result.data ?? plans);
    } catch {
      // silently fail
    }
  };

  const handleMoveDown = async (index) => {
    if (!plans || index >= plans.length - 1) return;
    const ids = plans.map(p => p.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    try {
      const result = await reorderPlans(ids);
      setPlans(Array.isArray(result) ? result : result.data ?? plans);
    } catch {
      // silently fail
    }
  };

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  // Computed: live price preview
  const computedPrice = form.price && form.discount_percent > 0
    ? (Number(form.price) * (1 - Number(form.discount_percent) / 100)).toFixed(2)
    : null;

  // ── Create / Edit Form Page ─────────────────────────
  if (modal === 'create' || modal === 'edit') {
    return (
      <FormPage
        title={modal === 'create' ? t('subscriptions.newPlan') : `${t('actions.edit')} \u2014 ${editPlan?.name}`}
        onBack={closeModal}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20" />
          </svg>
        }
      >
        <FormField label={t('subscriptions.planName')}>
          <Input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder={t('subscriptions.planNamePlaceholder')} />
        </FormField>

        {/* Duration stepper */}
        <FormField label={t('subscriptions.duration')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" onClick={() => updateField('duration_months', Math.max(1, form.duration_months - 1))}
              className="pl-icon-btn" style={stepperBtnStyle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
            </button>
            <div style={{
              flex: 1, textAlign: 'center',
              fontSize: 34, fontWeight: 700, color: '#1D1D1F', lineHeight: 1,
              fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
            }}>
              {form.duration_months}
            </div>
            <button type="button" onClick={() => updateField('duration_months', Math.min(36, form.duration_months + 1))}
              className="pl-icon-btn" style={stepperBtnStyle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
          <div style={{ ...labelStyle, textAlign: 'center', marginTop: 8 }}>
            {t('subscriptions.monthCount', { count: form.duration_months })}
          </div>
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label={t('subscriptions.price')}>
            <Input type="number" min="0" step="0.01" value={form.price} onChange={e => updateField('price', e.target.value)} placeholder="0.00" />
          </FormField>
          <FormField label={t('subscriptions.discount')}>
            <Input type="number" min="0" max="100" value={form.discount_percent} onChange={e => updateField('discount_percent', e.target.value)} placeholder="0" />
          </FormField>
        </div>

        {/* Live price preview */}
        {computedPrice && (
          <div style={{
            borderRadius: 12,
            padding: '14px 16px', marginBottom: 18,
            background: '#F2F2F7',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <span style={labelStyle}>{t('subscriptions.afterDiscount')}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#86868B', textDecoration: 'line-through' }}>
                {Number(form.price).toLocaleString()} {t('common.currency')}
              </span>
              <span style={{
                fontSize: 24, fontWeight: 700, color: '#0071E3', lineHeight: 1,
                fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
              }}>
                {Number(computedPrice).toLocaleString()} {t('common.currency')}
              </span>
            </div>
          </div>
        )}

        {/* Most Popular toggle */}
        <div style={{
          ...cardStyle,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          border: form.is_popular ? '1px solid #0071E3' : '1px solid #E5E5EA',
          marginBottom: 12, transition: 'border-color 0.15s ease',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600,
              lineHeight: 1.2,
              color: '#1D1D1F', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: form.is_popular ? '#0071E3' : '#D2D2D7', display: 'inline-block' }} />
              {t('subscriptions.mostPopular')}
            </div>
            <div style={{ fontSize: 13, color: '#515154', marginTop: 6 }}>
              {form.is_popular ? t('subscriptions.popularOnHint') : t('subscriptions.popularOffHint')}
            </div>
          </div>
          <ToggleSwitch checked={form.is_popular} onChange={() => updateField('is_popular', !form.is_popular)} />
        </div>

        {/* Active toggle */}
        <div style={{
          ...cardStyle,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          marginBottom: 4,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600,
              lineHeight: 1.2, color: '#1D1D1F',
            }}>{t('subscriptions.activeStatus')}</div>
            <div style={{ fontSize: 13, color: '#515154', marginTop: 6 }}>
              {form.is_active ? t('subscriptions.activeOnHint') : t('subscriptions.activeOffHint')}
            </div>
          </div>
          <ToggleSwitch checked={form.is_active} onChange={() => updateField('is_active', !form.is_active)} />
        </div>

        {error && <ErrorBanner message={error} />}

        <FormPageActions>
          <Button type="button" variant="secondary" onClick={closeModal}>{t('actions.cancel')}</Button>
          <Button type="button" disabled={saving || !form.name || !form.price} onClick={handleSave}>
            {saving ? t('loading.saving') : modal === 'create' ? t('actions.create') : t('actions.saveChanges')}
          </Button>
        </FormPageActions>
      </FormPage>
    );
  }

  // ── Feature disabled ─────────────────────────────────
  if (loadError === 'feature_disabled') {
    return (
      <>
        <PageHeader title={t('subscriptions.title')} />
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 24, background: '#F2F2F7', color: '#0071E3',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="3" /><path d="M8 11V7a4 4 0 018 0v4" />
            </svg>
          </div>
          <p style={{
            color: '#1D1D1F', margin: '0 0 8px',
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
            letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>{t('subscriptions.featureDisabled')}</p>
          <p style={{ color: '#515154', fontSize: 14, margin: 0, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
            {t('subscriptions.featureDisabledHint')}
          </p>
        </div>
      </>
    );
  }

  // ── Loading ──────────────────────────────────────────
  if (plans === null && !loadError) {
    return (
      <>
        <PageHeader title={t('subscriptions.title')} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              ...cardStyle, height: 220,
              animation: `fadeIn 0.3s ease-out ${i * 0.08}s both`,
            }} />
          ))}
        </div>
      </>
    );
  }

  // ── Error ────────────────────────────────────────────
  if (loadError) {
    return (
      <>
        <PageHeader title={t('subscriptions.title')} />
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 24, background: 'rgba(255,59,48,0.12)', color: '#B12A20',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 8v4.5M12 16h.01" />
            </svg>
          </div>
          <p style={{ color: '#B12A20', margin: '0 0 16px', fontSize: 14 }}>{loadError}</p>
          <Button type="button" variant="secondary" onClick={loadPlans}>{t('actions.retry')}</Button>
        </div>
      </>
    );
  }

  // ── Main content ─────────────────────────────────────
  return (
    <>
      <PageHeader title={t('subscriptions.title')}>
        <Button type="button" onClick={openCreate}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t('subscriptions.addPlan')}
        </Button>
      </PageHeader>

      {plans.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 24, background: '#F2F2F7', color: '#0071E3',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20" />
            </svg>
          </div>
          <p style={{
            color: '#1D1D1F', margin: '0 0 8px',
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
            letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>{t('subscriptions.noPlans')}</p>
          <p style={{ color: '#515154', fontSize: 14, margin: '0 0 22px' }}>{t('subscriptions.noPlansHint')}</p>
          <Button type="button" onClick={openCreate}>{t('subscriptions.createFirst')}</Button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
        }}>
          {plans.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={i}
              total={plans.length}
              onEdit={() => openEdit(plan)}
              onDelete={() => openDelete(plan)}
              onToggle={() => handleToggle(plan)}
              onMoveUp={() => handleMoveUp(i)}
              onMoveDown={() => handleMoveDown(i)}
            />
          ))}
        </div>
      )}

      {/* ── Delete Confirmation ─────────────────────────── */}
      {modal === 'delete' && editPlan && (
        <Modal
          title={t('subscriptions.deleteTitle', { name: editPlan.name })}
          onClose={closeModal}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          }
        >
          {(editPlan.registrations_count ?? 0) > 0 && (
            <div style={{
              padding: '12px 14px', borderRadius: 12,
              background: 'rgba(255,149,0,0.16)',
              marginBottom: 12,
            }}>
              <p style={{ color: '#A35A00', fontSize: 13, margin: 0, lineHeight: 1.6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
                </svg>
                {t('subscriptions.hasRegistrations', { count: editPlan.registrations_count })}
              </p>
            </div>
          )}

          <div style={{
            padding: '16px', borderRadius: 12,
            background: 'rgba(255,59,48,0.12)',
            marginBottom: 4,
          }}>
            <p style={{ color: '#B12A20', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              {t('subscriptions.deleteWarning')}
            </p>
          </div>

          {error && <ErrorBanner message={error} />}

          <ModalActions>
            <Button type="button" variant="secondary" onClick={closeModal}>{t('actions.cancel')}</Button>
            <Button type="button" variant="danger" disabled={saving} onClick={handleDelete}>
              {saving ? t('loading.deleting') : t('actions.delete')}
            </Button>
          </ModalActions>
        </Modal>
      )}
    </>
  );
}

/* ── Plan Card ──────────────────────────────────────── */
function PlanCard({ plan, index, total, onEdit, onDelete, onToggle, onMoveUp, onMoveDown }) {
  const { t } = useTranslation();
  const discountedPrice = plan.discount_percent > 0
    ? (plan.price * (1 - plan.discount_percent / 100)).toFixed(2)
    : null;

  // The "popular" plan is highlighted with a blue border, not a dark card.
  const ink = !!plan.is_popular;
  const surface = '#FFFFFF';
  const hairline = '#F2F2F7';
  const textPrimary = '#1D1D1F';
  const textSecondary = '#6E6E73';
  const priceColor = '#1D1D1F';
  const iconBtnClass = 'pl-icon-btn';

  return (
    <div
      onMouseEnter={e => { if (!ink) e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { if (!ink) e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        background: surface,
        border: ink ? '2px solid #0071E3' : '1px solid #E5E5EA',
        borderRadius: 16,
        padding: 22,
        position: 'relative',
        opacity: plan.is_active ? 1 : 0.6,
        transition: 'border-color 0.15s ease',
        animation: `fadeInUp 0.35s ease-out ${0.04 + index * 0.05}s both`,
      }}
    >
      {/* Index + status row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, marginBottom: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {plan.is_popular && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 980,
              background: 'rgba(0,113,227,0.12)', color: '#0058B3',
              fontSize: 12, fontWeight: 500, lineHeight: '16px',
            }}>
              {t('subscriptions.popular')}
            </span>
          )}
          {!plan.is_active && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 980,
              background: 'rgba(255,59,48,0.12)', color: '#B12A20',
              fontSize: 12, fontWeight: 500, lineHeight: '16px',
            }}>
              {t('status.inactive')}
            </span>
          )}
        </div>
      </div>

      {/* Plan name */}
      <div style={{
        fontSize: 18, fontWeight: 500, color: textPrimary,
        fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8,
      }}>
        {plan.name}
      </div>

      {/* Duration */}
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 12, color: textSecondary, marginBottom: 18,
      }}>
        {t('subscriptions.monthCount', { count: plan.duration_months })}
      </div>

      {/* Price */}
      <div style={{ marginBottom: 18 }}>
        {discountedPrice ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 34, fontWeight: 500, color: priceColor,
              fontFamily: 'var(--font-display)', lineHeight: 1, letterSpacing: '-0.02em',
            }}>
              {Number(discountedPrice).toLocaleString()} {t('common.currency')}
            </span>
            <span style={{ fontSize: 13, color: '#86868B', textDecoration: 'line-through' }}>
              {Number(plan.price).toLocaleString()} {t('common.currency')}
            </span>
            <span style={{
              padding: '2px 8px', border: '1px solid #0071E3', color: '#0071E3',
              fontFamily: 'var(--font-body)', fontSize: 12,
            }}>
              -{plan.discount_percent}%
            </span>
          </div>
        ) : (
          <span style={{
            fontSize: 34, fontWeight: 500, color: priceColor,
            fontFamily: 'var(--font-display)', lineHeight: 1, letterSpacing: '-0.02em',
          }}>
            {Number(plan.price).toLocaleString()} {t('common.currency')}
          </span>
        )}
      </div>

      {/* Registrations count */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        paddingTop: 14, borderTop: `1px solid ${hairline}`, marginBottom: 14,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="1.8" strokeLinecap="round">
          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6M23 11h-6" />
        </svg>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 12, color: textSecondary,
        }}>
          {t('subscriptions.registrationCount', { count: plan.registrations_count ?? 0 })}
        </span>
      </div>

      {/* Actions row */}
      <div style={{
        display: 'flex', gap: 6, paddingTop: 14,
        borderTop: `1px solid ${hairline}`,
        flexWrap: 'wrap',
      }}>
        {/* Reorder arrows */}
        <div style={{ display: 'flex', gap: 4, marginInlineEnd: 'auto' }}>
          <button type="button" disabled={index === 0} onClick={onMoveUp}
            title={t('subscriptions.moveUp')}
            className={iconBtnClass} style={reorderBtnStyle(index === 0)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 15l-6-6-6 6" /></svg>
          </button>
          <button type="button" disabled={index === total - 1} onClick={onMoveDown}
            title={t('subscriptions.moveDown')}
            className={iconBtnClass} style={reorderBtnStyle(index === total - 1)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
          </button>
        </div>

        {/* Toggle active */}
        <button type="button" onClick={onToggle}
          title={plan.is_active ? t('subscriptions.deactivate') : t('subscriptions.activate')}
          className={iconBtnClass}>
          {plan.is_active ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          )}
        </button>

        {/* Edit */}
        <button type="button" onClick={onEdit} title={t('actions.edit')} className={iconBtnClass}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        {/* Delete */}
        <button type="button" onClick={onDelete} title={t('actions.delete')}
          className={iconBtnClass} style={{ color: '#FF3B30' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ── Toggle Switch ────────────────────────────────────── */
function ToggleSwitch({ checked, onChange, color }) {
  const activeColor = color || '#1D1D1F';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        position: 'relative', display: 'inline-flex',
        width: 44, height: 26, borderRadius: 13,
        background: checked ? '#34C759' : '#E5E5EA',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.2s ease, border-color 0.2s ease',
        padding: 0, flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, insetInlineStart: checked ? 20 : 2,
        width: 22, height: 22, borderRadius: 11, background: '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        transition: 'inset-inline-start 0.2s ease',
      }} />
    </button>
  );
}

/* ── Error Banner ─────────────────────────────────────── */
function ErrorBanner({ message }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #FF3B30',
      padding: '10px 14px', marginTop: 16,
      fontSize: 13, color: '#FF3B30',
      display: 'flex', alignItems: 'center', gap: 8,
      animation: 'fadeInUp 0.3s ease-out',
    }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="8" cy="8" r="7" stroke="#FF3B30" strokeWidth="1.5" />
        <path d="M8 5v3M8 10.5v.5" stroke="#FF3B30" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {message}
    </div>
  );
}

/* ── Shared styles ────────────────────────────────────── */
const stepperBtnStyle = { width: 42, height: 42, flexShrink: 0 };

const reorderBtnStyle = (disabled) => ({
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.3 : 1,
});
