import { useState, useEffect } from 'react';
import { getPlans, createPlan, updatePlan, deletePlan, togglePlan, reorderPlans } from '../../api/subscriptionPlans';
import { PageHeader, Button, FormField, Input } from '../../components/CrudTable';
import { Modal, ModalActions } from '../../components/ui/Modal';

const emptyForm = {
  name: '',
  duration_months: 1,
  price: '',
  discount_percent: 0,
  is_popular: false,
  is_active: true,
};

export default function SubscriptionPlansPage() {
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
          setLoadError('Failed to load subscription plans.');
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
          setError(data.message || 'Validation failed.');
        }
      } else {
        setError(err.response?.data?.message || 'Failed to save plan.');
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
      setError(err.response?.data?.message || 'Failed to delete plan.');
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

  // ── Feature disabled ─────────────────────────────────
  if (loadError === 'feature_disabled') {
    return (
      <>
        <PageHeader title="Subscription Plans" />
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'linear-gradient(145deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.2) 100%)',
          borderRadius: 18, border: '1px solid rgba(139,92,246,0.15)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>&#128274;</div>
          <p style={{ color: '#a78bfa', fontSize: 16, fontWeight: 600, margin: '0 0 6px' }}>Feature Disabled</p>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
            Subscription Plans are disabled for your club. Contact your platform admin to enable this feature.
          </p>
        </div>
      </>
    );
  }

  // ── Loading ──────────────────────────────────────────
  if (plans === null && !loadError) {
    return (
      <>
        <PageHeader title="Subscription Plans" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              height: 220, borderRadius: 18,
              background: 'linear-gradient(145deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
              border: '1px solid rgba(34,211,238,0.06)',
              animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
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
        <PageHeader title="Subscription Plans" />
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'linear-gradient(145deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.2) 100%)',
          borderRadius: 18, border: '1px solid rgba(244,63,94,0.15)',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 12 }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <p style={{ color: '#fda4af', fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>{loadError}</p>
          <Button type="button" variant="secondary" onClick={loadPlans}>Retry</Button>
        </div>
      </>
    );
  }

  // ── Main content ─────────────────────────────────────
  return (
    <>
      <PageHeader title="Subscription Plans">
        <Button type="button" onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Plan
        </Button>
      </PageHeader>

      {plans.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'linear-gradient(145deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.2) 100%)',
          borderRadius: 18, border: '1px solid rgba(34,211,238,0.06)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>&#128179;</div>
          <p style={{ color: '#94a3b8', fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>No plans yet</p>
          <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>Create subscription plans for your club members.</p>
          <Button type="button" onClick={openCreate}>Create your first plan</Button>
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

      {/* ── Create / Edit Modal ─────────────────────────── */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? 'New Plan' : `Edit \u2014 ${editPlan?.name}`}
          onClose={closeModal}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><path d="M1 10h22" />
            </svg>
          }
        >
          <FormField label="Plan Name *">
            <Input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="e.g. Monthly, Quarterly" />
          </FormField>

          {/* Duration stepper */}
          <FormField label="Duration (months) *">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type="button" onClick={() => updateField('duration_months', Math.max(1, form.duration_months - 1))}
                style={stepperBtnStyle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
              </button>
              <div style={{
                flex: 1, textAlign: 'center',
                fontSize: 28, fontWeight: 800, color: '#22d3ee',
                fontFamily: "'Outfit', sans-serif",
              }}>
                {form.duration_months}
              </div>
              <button type="button" onClick={() => updateField('duration_months', Math.min(36, form.duration_months + 1))}
                style={stepperBtnStyle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </button>
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: '#64748b', marginTop: 4 }}>
              {form.duration_months === 1 ? '1 month' : `${form.duration_months} months`}
            </div>
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Price *">
              <Input type="number" min="0" step="0.01" value={form.price} onChange={e => updateField('price', e.target.value)} placeholder="0.00" />
            </FormField>
            <FormField label="Discount %">
              <Input type="number" min="0" max="100" value={form.discount_percent} onChange={e => updateField('discount_percent', e.target.value)} placeholder="0" />
            </FormField>
          </div>

          {/* Live price preview */}
          {computedPrice && (
            <div style={{
              padding: '12px 14px', borderRadius: 12, marginBottom: 18,
              background: 'linear-gradient(135deg, rgba(34,211,238,0.06) 0%, rgba(6,182,212,0.03) 100%)',
              border: '1px solid rgba(34,211,238,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>After discount:</span>
              <div>
                <span style={{ fontSize: 13, color: '#64748b', textDecoration: 'line-through', marginRight: 8 }}>
                  {Number(form.price).toLocaleString()}
                </span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#2dd4bf', fontFamily: "'Outfit', sans-serif" }}>
                  {Number(computedPrice).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Most Popular toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', borderRadius: 12,
            background: form.is_popular ? 'rgba(251,191,36,0.06)' : 'rgba(6,13,31,0.4)',
            border: form.is_popular ? '1px solid rgba(251,191,36,0.2)' : '1px solid rgba(51,65,85,0.3)',
            marginBottom: 12, transition: 'all 0.25s ease',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16 }}>&#11088;</span> Most Popular
              </div>
              <div style={{ fontSize: 12, color: form.is_popular ? '#fbbf24' : '#64748b', marginTop: 2 }}>
                {form.is_popular ? 'This plan will be highlighted. Only one plan can be popular.' : 'Highlight this plan for new members.'}
              </div>
            </div>
            <ToggleSwitch checked={form.is_popular} onChange={() => updateField('is_popular', !form.is_popular)} color="#fbbf24" />
          </div>

          {/* Active toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', borderRadius: 12,
            background: 'rgba(6,13,31,0.4)',
            border: '1px solid rgba(51,65,85,0.3)',
            marginBottom: 4,
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', fontFamily: "'DM Sans', sans-serif" }}>Active Status</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {form.is_active ? 'Plan is visible to new members' : 'Plan is hidden from registration'}
              </div>
            </div>
            <ToggleSwitch checked={form.is_active} onChange={() => updateField('is_active', !form.is_active)} />
          </div>

          {error && <ErrorBanner message={error} />}

          <ModalActions>
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="button" disabled={saving || !form.name || !form.price} onClick={handleSave}>
              {saving ? 'Saving...' : modal === 'create' ? 'Create Plan' : 'Save Changes'}
            </Button>
          </ModalActions>
        </Modal>
      )}

      {/* ── Delete Confirmation ─────────────────────────── */}
      {modal === 'delete' && editPlan && (
        <Modal
          title={`Delete ${editPlan.name}?`}
          onClose={closeModal}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          }
        >
          {(editPlan.registrations_count ?? 0) > 0 && (
            <div style={{
              padding: '12px 14px',
              background: 'rgba(251,191,36,0.06)',
              border: '1px solid rgba(251,191,36,0.2)',
              borderRadius: 12, marginBottom: 12,
            }}>
              <p style={{ color: '#fbbf24', fontSize: 14, margin: 0, lineHeight: 1.6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
                </svg>
                This plan has {editPlan.registrations_count} registration{editPlan.registrations_count > 1 ? 's' : ''}. Consider deactivating instead.
              </p>
            </div>
          )}

          <div style={{
            padding: '16px',
            background: 'rgba(244,63,94,0.06)',
            border: '1px solid rgba(244,63,94,0.15)',
            borderRadius: 12, marginBottom: 4,
          }}>
            <p style={{ color: '#fda4af', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              This action cannot be undone. The plan will be permanently removed.
            </p>
          </div>

          {error && <ErrorBanner message={error} />}

          <ModalActions>
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="button" variant="danger" disabled={saving} onClick={handleDelete}>
              {saving ? 'Deleting...' : 'Delete Plan'}
            </Button>
          </ModalActions>
        </Modal>
      )}
    </>
  );
}

/* ── Plan Card ──────────────────────────────────────── */
function PlanCard({ plan, index, total, onEdit, onDelete, onToggle, onMoveUp, onMoveDown }) {
  const discountedPrice = plan.discount_percent > 0
    ? (plan.price * (1 - plan.discount_percent / 100)).toFixed(2)
    : null;

  return (
    <div
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = plan.is_active ? 'rgba(34,211,238,0.2)' : 'rgba(244,63,94,0.3)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3), 0 0 20px rgba(34,211,238,0.04)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = plan.is_popular ? 'rgba(251,191,36,0.25)' : plan.is_active ? 'rgba(34,211,238,0.06)' : 'rgba(244,63,94,0.2)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)';
      }}
      style={{
        background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
        border: plan.is_popular ? '1px solid rgba(251,191,36,0.25)' : plan.is_active ? '1px solid rgba(34,211,238,0.06)' : '1px solid rgba(244,63,94,0.2)',
        borderRadius: 18, padding: 20,
        position: 'relative', overflow: 'hidden',
        opacity: plan.is_active ? 1 : 0.65,
        boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: `fadeInUp 0.4s ease-out ${0.05 + index * 0.06}s both`,
      }}
    >
      {/* Popular ribbon */}
      {plan.is_popular && (
        <div style={{
          position: 'absolute', top: 14, right: -32,
          transform: 'rotate(45deg)',
          background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
          color: '#060d1f',
          fontSize: 10, fontWeight: 800,
          padding: '4px 40px',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
        }}>
          Popular
        </div>
      )}

      {/* Inactive badge */}
      {!plan.is_active && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          padding: '3px 10px', borderRadius: 20,
          background: 'rgba(244,63,94,0.12)', color: '#fda4af',
          fontSize: 11, fontWeight: 600, border: '1px solid rgba(244,63,94,0.2)',
        }}>
          Inactive
        </div>
      )}

      {/* Plan name */}
      <div style={{
        fontSize: 18, fontWeight: 700, color: '#f1f5f9',
        fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em',
        marginBottom: 4,
      }}>
        {plan.name}
      </div>

      {/* Duration */}
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </svg>
        {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}
      </div>

      {/* Price */}
      <div style={{ marginBottom: 16 }}>
        {discountedPrice ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{
              fontSize: 28, fontWeight: 800, color: '#2dd4bf',
              fontFamily: "'Outfit', sans-serif", lineHeight: 1,
            }}>
              {Number(discountedPrice).toLocaleString()}
            </span>
            <span style={{ fontSize: 14, color: '#526280', textDecoration: 'line-through' }}>
              {Number(plan.price).toLocaleString()}
            </span>
            <span style={{
              padding: '2px 8px', borderRadius: 20,
              background: 'rgba(45,212,191,0.12)', color: '#2dd4bf',
              fontSize: 11, fontWeight: 700,
            }}>
              -{plan.discount_percent}%
            </span>
          </div>
        ) : (
          <span style={{
            fontSize: 28, fontWeight: 800, color: '#22d3ee',
            fontFamily: "'Outfit', sans-serif", lineHeight: 1,
          }}>
            {Number(plan.price).toLocaleString()}
          </span>
        )}
      </div>

      {/* Registrations count */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 12px', borderRadius: 10,
        background: 'rgba(6,13,31,0.4)', marginBottom: 16,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round">
          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6M23 11h-6" />
        </svg>
        <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
          {plan.registrations_count ?? 0} registration{(plan.registrations_count ?? 0) !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Actions row */}
      <div style={{
        display: 'flex', gap: 6, paddingTop: 14,
        borderTop: '1px solid rgba(51,65,85,0.2)',
        flexWrap: 'wrap',
      }}>
        {/* Reorder arrows */}
        <div style={{ display: 'flex', gap: 2, marginRight: 'auto' }}>
          <button type="button" disabled={index === 0} onClick={onMoveUp}
            title="Move up"
            style={iconBtnStyle(index === 0)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 15l-6-6-6 6" /></svg>
          </button>
          <button type="button" disabled={index === total - 1} onClick={onMoveDown}
            title="Move down"
            style={iconBtnStyle(index === total - 1)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
          </button>
        </div>

        {/* Toggle active */}
        <button type="button" onClick={onToggle}
          title={plan.is_active ? 'Deactivate' : 'Activate'}
          onMouseEnter={e => { e.currentTarget.style.background = plan.is_active ? 'rgba(244,63,94,0.15)' : 'rgba(45,212,191,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.2)'; }}
          style={{
            background: 'rgba(51,65,85,0.2)', border: '1px solid rgba(51,65,85,0.3)',
            borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: plan.is_active ? '#fda4af' : '#2dd4bf',
            transition: 'all 0.2s',
          }}>
          {plan.is_active ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          )}
        </button>

        {/* Edit */}
        <button type="button" onClick={onEdit}
          title="Edit"
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.2)'; }}
          style={{
            background: 'rgba(51,65,85,0.2)', border: '1px solid rgba(51,65,85,0.3)',
            borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#94a3b8', transition: 'all 0.2s',
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        {/* Delete */}
        <button type="button" onClick={onDelete}
          title="Delete"
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.2)'; }}
          style={{
            background: 'rgba(51,65,85,0.2)', border: '1px solid rgba(51,65,85,0.3)',
            borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fda4af', transition: 'all 0.2s',
          }}>
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
  const activeColor = color || '#2dd4bf';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        position: 'relative', display: 'inline-flex',
        width: 44, height: 24, borderRadius: 12,
        background: checked
          ? `linear-gradient(135deg, ${activeColor}, ${activeColor})`
          : 'rgba(51,65,85,0.4)',
        border: checked ? `1px solid ${activeColor}40` : '1px solid rgba(51,65,85,0.5)',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        padding: 0, flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: checked ? 22 : 2,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        transition: 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }} />
    </button>
  );
}

/* ── Error Banner ─────────────────────────────────────── */
function ErrorBanner({ message }) {
  return (
    <div style={{
      background: 'rgba(244,63,94,0.08)',
      border: '1px solid rgba(244,63,94,0.2)',
      borderRadius: 10, padding: '10px 14px', marginTop: 16,
      fontSize: 13, color: '#fda4af',
      display: 'flex', alignItems: 'center', gap: 8,
      animation: 'fadeInUp 0.3s ease-out',
    }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="8" cy="8" r="7" stroke="#f43f5e" strokeWidth="1.5" />
        <path d="M8 5v3M8 10.5v.5" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {message}
    </div>
  );
}

/* ── Shared styles ────────────────────────────────────── */
const stepperBtnStyle = {
  width: 40, height: 40, borderRadius: 12,
  background: 'rgba(51,65,85,0.3)',
  border: '1px solid rgba(51,65,85,0.5)',
  color: '#94a3b8', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.2s',
};

const iconBtnStyle = (disabled) => ({
  background: 'rgba(51,65,85,0.2)',
  border: '1px solid rgba(51,65,85,0.3)',
  borderRadius: 8, width: 28, height: 28, cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#64748b', transition: 'all 0.2s',
  opacity: disabled ? 0.3 : 1,
});
