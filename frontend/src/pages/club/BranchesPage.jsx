import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getBranches, createBranch, updateBranch, deleteBranch, updateBranchFeatures } from '../../api/branches';
import { PageHeader, Button, FormField, Input, TextArea } from '../../components/CrudTable';
import { Modal, ModalActions } from '../../components/ui/Modal';
import { FormPage, FormPageActions } from '../../components/ui/FormPage';
import { Badge } from '../../components/ui/Badge';
import { cardStyle, labelStyle } from '../../components/ui/styles';

const KNOWN_FEATURES = [
  { key: 'training_plans', label: 'Training Plans', icon: '\u{1F4CB}' },
  { key: 'skills', label: 'Skills Tracking', icon: '\u{1F3AF}' },
  { key: 'leaderboard', label: 'Leaderboard', icon: '\u{1F3C6}' },
  { key: 'evaluations', label: 'Evaluations', icon: '\u{1F4CA}' },
  { key: 'coach_portal', label: 'Coach Portal', icon: '\u{1F468}‍\u{1F3EB}' },
];

const emptyForm = {
  name: '', city: '', address: '', phone: '',
  working_hours: '', description: '', capacity: '',
  is_active: true,
};

export default function BranchesPage() {
  const { t } = useTranslation();
  const { user, features } = useAuth();
  const [branches, setBranches] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'features' | 'delete'
  const [editBranch, setEditBranch] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [localFeatures, setLocalFeatures] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
  const menuRef = useRef(null);

  const maxBranches = user?.club?.max_branches ?? 1;
  const atLimit = (branches?.length ?? 0) >= maxBranches;

  // Club-level enabled features
  const clubFeatureKeys = KNOWN_FEATURES
    .filter(f => features?.[`${f.key}_enabled`] ?? true)
    .map(f => f.key);

  useEffect(() => { loadBranches(); }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadBranches = () => {
    setLoadError('');
    getBranches()
      .then(data => setBranches(data.data ?? data))
      .catch(() => setLoadError('Failed to load branches'));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setError('');
    setEditBranch(null);
    setModal('create');
  };

  const openEdit = (branch) => {
    setForm({
      name: branch.name || '',
      city: branch.city || '',
      address: branch.address || '',
      phone: branch.phone || '',
      working_hours: branch.working_hours || '',
      description: branch.description || '',
      capacity: branch.capacity ?? '',
      is_active: branch.is_active ?? true,
    });
    setError('');
    setEditBranch(branch);
    setModal('edit');
    setMenuOpen(null);
  };

  const openFeatures = (branch) => {
    setLocalFeatures(branch.features || {});
    setError('');
    setEditBranch(branch);
    setModal('features');
    setMenuOpen(null);
  };

  const openDelete = (branch) => {
    setError('');
    setEditBranch(branch);
    setModal('delete');
    setMenuOpen(null);
  };

  const closeModal = () => {
    setModal(null);
    setEditBranch(null);
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        capacity: form.capacity === '' ? null : Number(form.capacity),
      };
      if (modal === 'create') {
        const result = await createBranch(payload);
        setBranches(prev => [...prev, result.data ?? result]);
      } else {
        const result = await updateBranch(editBranch.id, payload);
        setBranches(prev => prev.map(b => b.id === editBranch.id ? (result.data ?? result) : b));
      }
      closeModal();
    } catch (err) {
      if (err.response?.status === 422) {
        const data = err.response.data;
        if (data.errors) {
          setError(Object.values(data.errors).map(a => a[0]).join('. '));
        } else {
          setError(data.message || 'Validation failed.');
        }
      } else {
        setError(err.response?.data?.message || 'Failed to save branch.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFeatures = async () => {
    setSaving(true);
    setError('');
    try {
      const result = await updateBranchFeatures(editBranch.id, localFeatures);
      setBranches(prev => prev.map(b => b.id === editBranch.id ? (result.data ?? result) : b));
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update features.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError('');
    try {
      await deleteBranch(editBranch.id);
      setBranches(prev => prev.filter(b => b.id !== editBranch.id));
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete branch.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  // ── Create / Edit Form Page ────────────────────────────
  if (modal === 'create' || modal === 'edit') {
    return (
      <FormPage
        title={modal === 'create' ? t('branches.newBranch') : `${t('actions.edit')} — ${editBranch?.name}`}
        onBack={closeModal}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
      >
        <FormField label="Branch Name *">
          <Input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Main Branch" />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="City *">
            <Input value={form.city} onChange={e => updateField('city', e.target.value)} placeholder="Cairo" />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder={t('forms.phonePlaceholder', { defaultValue: '+966 5x xxx xxxx' })} />
          </FormField>
        </div>
        <FormField label="Address *">
          <Input value={form.address} onChange={e => updateField('address', e.target.value)} placeholder="123 Olympic Avenue" />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Working Hours">
            <Input value={form.working_hours} onChange={e => updateField('working_hours', e.target.value)} placeholder="7am – 10pm" />
          </FormField>
          <FormField label="Capacity">
            <Input type="number" min="1" value={form.capacity} onChange={e => updateField('capacity', e.target.value)} placeholder="100" />
          </FormField>
        </div>
        <FormField label="Description">
          <TextArea value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="Describe this branch..." rows={3} />
        </FormField>

        {/* Active toggle */}
        <div style={{
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: '#F2F2F7',
          marginBottom: 4,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1D1D1F' }}>Active status</div>
            <div style={{ fontSize: 13, color: '#6E6E73', marginTop: 3 }}>
              {form.is_active ? 'Branch is operational' : 'Branch is inactive'}
            </div>
          </div>
          <ToggleSwitch checked={form.is_active} onChange={() => updateField('is_active', !form.is_active)} />
        </div>

        {error && <ErrorBanner message={error} />}

        <FormPageActions>
          <Button type="button" variant="secondary" onClick={closeModal}>{t('actions.cancel')}</Button>
          <Button type="button" disabled={saving || !form.name || !form.city || !form.address} onClick={handleSave}>
            {saving ? t('loading.saving') : modal === 'create' ? t('actions.create') : t('actions.saveChanges')}
          </Button>
        </FormPageActions>
      </FormPage>
    );
  }

  // ── Manage Features Form Page ──────────────────────────
  if (modal === 'features' && editBranch) {
    return (
      <FormPage
        title={`Branch features — ${editBranch.name}`}
        onBack={closeModal}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        }
      >
        <p style={{ fontSize: 14, color: '#6E6E73', margin: '0 0 18px', lineHeight: 1.5 }}>
          Override which features are available at this branch.
          Features disabled at club level cannot be enabled here.
        </p>

        <div style={{ ...cardStyle, padding: '4px 18px' }}>
          {KNOWN_FEATURES.map((f, fi) => {
            const clubEnabled = clubFeatureKeys.includes(f.key);
            const branchValue = localFeatures[f.key];
            const effective = branchValue !== undefined ? branchValue : clubEnabled;

            return (
              <div key={f.key} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                padding: '14px 0',
                borderBottom: fi === KNOWN_FEATURES.length - 1 ? 'none' : '1px solid #F2F2F7',
                opacity: !clubEnabled ? 0.5 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 36, height: 36, borderRadius: 10, background: '#F2F2F7',
                    fontSize: 18, lineHeight: 1, flexShrink: 0,
                  }}>{f.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, color: '#1D1D1F', fontWeight: 600, lineHeight: 1.3 }}>
                      {f.label}
                    </div>
                    {!clubEnabled && (
                      <div style={{ fontSize: 13, color: '#B12A20', marginTop: 2 }}>Disabled at club level</div>
                    )}
                    {clubEnabled && branchValue !== undefined && (
                      <div style={{ fontSize: 13, color: '#6E6E73', marginTop: 2 }}>
                        {branchValue ? 'Enabled for this branch' : 'Disabled for this branch'}
                      </div>
                    )}
                    {clubEnabled && branchValue === undefined && (
                      <div style={{ fontSize: 13, color: '#6E6E73', marginTop: 2 }}>Inherited from club</div>
                    )}
                  </div>
                </div>
                <ToggleSwitch
                  checked={effective}
                  disabled={!clubEnabled}
                  onChange={() => {
                    if (!clubEnabled) return;
                    setLocalFeatures(prev => ({ ...prev, [f.key]: !effective }));
                  }}
                />
              </div>
            );
          })}
        </div>

        {error && <ErrorBanner message={error} />}

        <FormPageActions>
          <Button type="button" variant="secondary" onClick={closeModal}>{t('actions.cancel')}</Button>
          <Button type="button" disabled={saving} onClick={handleSaveFeatures}>
            {saving ? t('loading.saving') : t('actions.save')}
          </Button>
        </FormPageActions>
      </FormPage>
    );
  }

  // ── Loading ────────────────────────────────────────────
  if (branches === null && !loadError) {
    return (
      <>
        <PageHeader title={t('branches.title')} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              ...cardStyle,
              height: 200,
              animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </>
    );
  }

  // ── Error ──────────────────────────────────────────────
  if (loadError) {
    return (
      <>
        <PageHeader title={t('branches.title')} />
        <div style={{
          ...cardStyle,
          textAlign: 'center', padding: '60px 20px',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <p style={{
            color: '#1D1D1F', fontSize: 20, margin: '0 0 16px',
            fontFamily: 'var(--font-display)', fontWeight: 600,
            letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>{loadError}</p>
          <Button type="button" variant="secondary" onClick={loadBranches} style={undefined}>Retry</Button>
        </div>
      </>
    );
  }

  // ── Success ────────────────────────────────────────────
  return (
    <>
      <PageHeader title={t('branches.title')}>
        <Badge variant={atLimit ? 'danger' : 'neutral'}>
          {branches.length}/{maxBranches} branches{atLimit ? ' — limit reached' : ''}
        </Badge>
        <Button type="button" disabled={atLimit} onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Branch
        </Button>
      </PageHeader>

      {branches.length === 0 ? (
        <div style={{
          ...cardStyle,
          textAlign: 'center', padding: '60px 20px',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
            <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p style={{
            color: '#1D1D1F', fontSize: 20, margin: '0 0 18px',
            fontFamily: 'var(--font-display)', fontWeight: 600,
            letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>No branches yet</p>
          <Button type="button" onClick={openCreate}>Create your first branch</Button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 16,
        }}>
          {branches.map((branch, i) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              index={i}
              clubFeatureKeys={clubFeatureKeys}
              menuOpen={menuOpen === branch.id}
              onMenuToggle={() => setMenuOpen(menuOpen === branch.id ? null : branch.id)}
              menuRef={menuOpen === branch.id ? menuRef : undefined}
              onEdit={() => openEdit(branch)}
              onFeatures={() => openFeatures(branch)}
              onDelete={() => openDelete(branch)}
            />
          ))}
        </div>
      )}

      {/* ── Delete Confirmation ─────────────────────────── */}
      {modal === 'delete' && editBranch && (
        <Modal
          title={`Delete ${editBranch.name}?`}
          onClose={closeModal}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          }
        >
          <div style={{
            borderRadius: 12,
            padding: '14px 16px',
            background: 'rgba(255,59,48,0.08)',
            marginBottom: 4,
          }}>
            <p style={{ color: '#B12A20', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
              This cannot be undone. Coaches and swimmers assigned to this branch will become unassigned.
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

/* ── Branch Card ──────────────────────────────────────── */
function BranchCard({ branch, index, clubFeatureKeys, menuOpen, onMenuToggle, menuRef, onEdit, onFeatures, onDelete }) {
  const navigate = useNavigate();
  const effectiveFeatures = KNOWN_FEATURES.filter(f =>
    branch.features?.[f.key] !== false && clubFeatureKeys.includes(f.key)
  );

  return (
    <div
      onClick={() => navigate(`/club/branches/${branch.id}`)}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
      style={{
        ...cardStyle,
        padding: 20,
        position: 'relative',
        opacity: branch.is_active ? 1 : 0.8,
        transition: 'box-shadow 0.2s ease',
        animation: `fadeInUp 0.4s ease-out ${0.05 + index * 0.06}s both`,
        cursor: 'pointer',
      }}
    >
      {/* Inactive badge */}
      {!branch.is_active && (
        <div style={{ position: 'absolute', top: 16, insetInlineEnd: 56 }}>
          <Badge variant="danger">Inactive</Badge>
        </div>
      )}

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, background: '#F2F2F7', color: '#0071E3',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 17, fontWeight: 600, color: '#1D1D1F',
              fontFamily: 'var(--font-display)', lineHeight: 1.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {branch.name}
            </div>
            {branch.city && (
              <div style={{
                ...labelStyle, marginTop: 4,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                {branch.city}
              </div>
            )}
          </div>
        </div>

        {/* Kebab menu */}
        <div style={{ position: 'relative' }} ref={menuOpen ? menuRef : undefined}>
          <button
            type="button"
            className="pl-icon-btn"
            onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {menuOpen && (
            <div style={{
              borderRadius: 12,
              position: 'absolute', top: 38, insetInlineEnd: 0, zIndex: 50,
              background: '#FFFFFF',
              border: '1px solid #E5E5EA',
              boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
              padding: 6, minWidth: 184, overflow: 'hidden',
              animation: 'fadeIn 0.15s ease-out',
            }}>
              {[
                { label: 'Edit', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', onClick: onEdit },
                { label: 'Manage Features', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', onClick: onFeatures },
                { label: 'Delete', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', onClick: onDelete, danger: true },
              ].map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); item.onClick(); }}
                  onMouseEnter={e => { e.currentTarget.style.background = item.danger ? 'rgba(255,59,48,0.10)' : '#F2F2F7'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', background: 'transparent',
                    border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'start',
                    color: item.danger ? '#B12A20' : '#1D1D1F',
                    fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-body)',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.icon} />
                    {item.label === 'Manage Features' && <circle cx="12" cy="12" r="3" />}
                  </svg>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 14,
        background: '#F2F2F7', borderRadius: 12, overflow: 'hidden',
      }}>
        {[
          { value: branch.coaches_count ?? 0, label: 'Coaches' },
          { value: branch.swimmers_count ?? 0, label: 'Swimmers' },
          { value: branch.sessions_count ?? 0, label: 'Sessions' },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: 1, textAlign: 'center', padding: '12px 4px', minWidth: 0,
          }}>
            <div style={{
              fontSize: 22, fontWeight: 700, color: '#1D1D1F',
              fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              {stat.value}
            </div>
            <div style={{ ...labelStyle, marginTop: 6 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Features pills */}
      {effectiveFeatures.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {effectiveFeatures.map(f => (
            <Badge key={f.key} variant="neutral">{f.icon} {f.label}</Badge>
          ))}
        </div>
      )}

      {/* Capacity + Working hours footer */}
      {(branch.capacity || branch.working_hours) && (
        <div style={{
          display: 'flex', gap: 16, marginTop: 14, paddingTop: 14,
          borderTop: '1px solid #F2F2F7',
        }}>
          {branch.capacity && (
            <div style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
              Cap: {branch.capacity}
            </div>
          )}
          {branch.working_hours && (
            <div style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              {branch.working_hours}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Toggle Switch ────────────────────────────────────── */
function ToggleSwitch({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      style={{
        position: 'relative', display: 'inline-flex',
        width: 44, height: 26, borderRadius: 13,
        background: checked ? '#34C759' : '#E5E5EA',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 0.2s ease',
        padding: 0, flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, insetInlineStart: checked ? 20 : 2,
        width: 22, height: 22, borderRadius: '50%', background: '#FFFFFF',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        transition: 'inset-inline-start 0.2s ease',
      }} />
    </button>
  );
}

/* ── Error Banner ─────────────────────────────────────── */
function ErrorBanner({ message }) {
  return (
    <div style={{
      background: 'rgba(255,59,48,0.08)',
      borderRadius: 12,
      padding: '12px 14px', marginTop: 16,
      fontSize: 14, color: '#B12A20',
      display: 'flex', alignItems: 'center', gap: 8,
      animation: 'fadeInUp 0.3s ease-out',
    }}>
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {message}
    </div>
  );
}
