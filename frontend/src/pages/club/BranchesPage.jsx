import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getBranches, createBranch, updateBranch, deleteBranch, updateBranchFeatures } from '../../api/branches';
import { PageHeader, Button, FormField, Input, TextArea } from '../../components/CrudTable';
import { Modal, ModalActions } from '../../components/ui/Modal';
import { FormPage, FormPageActions } from '../../components/ui/FormPage';

const KNOWN_FEATURES = [
  { key: 'training_plans', label: 'Training Plans', icon: '\u{1F4CB}' },
  { key: 'skills', label: 'Skills Tracking', icon: '\u{1F3AF}' },
  { key: 'leaderboard', label: 'Leaderboard', icon: '\u{1F3C6}' },
  { key: 'evaluations', label: 'Evaluations', icon: '\u{1F4CA}' },
  { key: 'coach_portal', label: 'Coach Portal', icon: '\u{1F468}\u200D\u{1F3EB}' },
];

const emptyForm = {
  name: '', city: '', address: '', phone: '',
  working_hours: '', description: '', capacity: '',
  is_active: true,
};

export default function BranchesPage() {
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
        title={modal === 'create' ? 'New Branch' : `Edit \u2014 ${editBranch?.name}`}
        onBack={closeModal}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round">
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
            <Input value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+20-100-1234567" />
          </FormField>
        </div>
        <FormField label="Address *">
          <Input value={form.address} onChange={e => updateField('address', e.target.value)} placeholder="123 Olympic Avenue" />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Working Hours">
            <Input value={form.working_hours} onChange={e => updateField('working_hours', e.target.value)} placeholder="7am \u2013 10pm" />
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
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', borderRadius: 12,
          background: 'rgba(6,13,31,0.4)',
          border: '1px solid rgba(51,65,85,0.3)',
          marginBottom: 4,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', fontFamily: "'DM Sans', sans-serif" }}>Active Status</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {form.is_active ? 'Branch is operational' : 'Branch is inactive'}
            </div>
          </div>
          <ToggleSwitch checked={form.is_active} onChange={() => updateField('is_active', !form.is_active)} />
        </div>

        {error && <ErrorBanner message={error} />}

        <FormPageActions>
          <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
          <Button type="button" disabled={saving || !form.name || !form.city || !form.address} onClick={handleSave}>
            {saving ? 'Saving...' : modal === 'create' ? 'Create Branch' : 'Save Changes'}
          </Button>
        </FormPageActions>
      </FormPage>
    );
  }

  // ── Manage Features Form Page ──────────────────────────
  if (modal === 'features' && editBranch) {
    return (
      <FormPage
        title={`Branch Features \u2014 ${editBranch.name}`}
        onBack={closeModal}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        }
      >
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 18px', lineHeight: 1.5 }}>
          Override which features are available at this branch.
          Features disabled at club level cannot be enabled here.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {KNOWN_FEATURES.map(f => {
            const clubEnabled = clubFeatureKeys.includes(f.key);
            const branchValue = localFeatures[f.key];
            const effective = branchValue !== undefined ? branchValue : clubEnabled;

            return (
              <div key={f.key} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 0',
                borderBottom: '1px solid rgba(51,65,85,0.2)',
                opacity: !clubEnabled ? 0.4 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0', fontFamily: "'DM Sans', sans-serif" }}>
                      {f.label}
                    </div>
                    {!clubEnabled && (
                      <div style={{ fontSize: 12, color: '#fda4af' }}>Disabled at club level</div>
                    )}
                    {clubEnabled && branchValue !== undefined && (
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {branchValue ? 'Enabled for this branch' : 'Disabled for this branch'}
                      </div>
                    )}
                    {clubEnabled && branchValue === undefined && (
                      <div style={{ fontSize: 12, color: '#64748b' }}>Inherited from club</div>
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
          <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
          <Button type="button" disabled={saving} onClick={handleSaveFeatures}>
            {saving ? 'Saving...' : 'Save Features'}
          </Button>
        </FormPageActions>
      </FormPage>
    );
  }

  // ── Loading ────────────────────────────────────────────
  if (branches === null && !loadError) {
    return (
      <>
        <PageHeader title="Branches" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340, 1fr))', gap: 16 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              height: 200, borderRadius: 18,
              background: 'linear-gradient(145deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
              border: '1px solid rgba(34,211,238,0.06)',
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
        <PageHeader title="Branches" />
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'linear-gradient(145deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.2) 100%)',
          borderRadius: 18, border: '1px solid rgba(244,63,94,0.15)',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 12 }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <p style={{ color: '#fda4af', fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>{loadError}</p>
          <Button type="button" variant="secondary" onClick={loadBranches} style={undefined}>Retry</Button>
        </div>
      </>
    );
  }

  // ── Success ────────────────────────────────────────────
  return (
    <>
      <PageHeader title="Branches">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 8,
          background: atLimit ? 'rgba(244,63,94,0.1)' : 'rgba(45,212,191,0.1)',
          border: `1px solid ${atLimit ? 'rgba(244,63,94,0.25)' : 'rgba(45,212,191,0.25)'}`,
          fontSize: 13, fontWeight: 600,
          color: atLimit ? '#fda4af' : '#2dd4bf',
          fontFamily: "'DM Sans', sans-serif",
          whiteSpace: 'nowrap',
        }}>
          {branches.length}/{maxBranches} branches
          {atLimit && ' \u2014 Limit reached'}
        </div>
        <Button type="button" disabled={atLimit} onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Branch
        </Button>
      </PageHeader>

      {branches.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'linear-gradient(145deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.2) 100%)',
          borderRadius: 18, border: '1px solid rgba(34,211,238,0.06)',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" style={{ marginBottom: 12 }}>
            <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p style={{ color: '#64748b', fontSize: 15, margin: '0 0 16px' }}>No branches yet</p>
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          }
        >
          <div style={{
            padding: '16px',
            background: 'rgba(244,63,94,0.06)',
            border: '1px solid rgba(244,63,94,0.15)',
            borderRadius: 12, marginBottom: 4,
          }}>
            <p style={{ color: '#fda4af', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              This cannot be undone. Coaches and swimmers assigned to this branch will become unassigned.
            </p>
          </div>

          {error && <ErrorBanner message={error} />}

          <ModalActions>
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="button" variant="danger" disabled={saving} onClick={handleDelete}>
              {saving ? 'Deleting...' : 'Delete Branch'}
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
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = branch.is_active ? 'rgba(34,211,238,0.2)' : 'rgba(244,63,94,0.3)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3), 0 0 20px rgba(34,211,238,0.04)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = branch.is_active ? 'rgba(34,211,238,0.06)' : 'rgba(244,63,94,0.2)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)';
      }}
      style={{
        background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
        border: branch.is_active ? '1px solid rgba(34,211,238,0.06)' : '1px solid rgba(244,63,94,0.2)',
        borderRadius: 18, padding: 20,
        position: 'relative',
        opacity: branch.is_active ? 1 : 0.7,
        boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: `fadeInUp 0.4s ease-out ${0.05 + index * 0.06}s both`,
        cursor: 'pointer',
      }}
    >
      {/* Inactive badge */}
      {!branch.is_active && (
        <div style={{
          position: 'absolute', top: 14, right: 52,
          padding: '3px 10px', borderRadius: 20,
          background: 'rgba(244,63,94,0.12)', color: '#fda4af',
          fontSize: 11, fontWeight: 600, border: '1px solid rgba(244,63,94,0.2)',
        }}>
          Inactive
        </div>
      )}

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 17, fontWeight: 700, color: '#f1f5f9',
            fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {branch.name}
          </div>
          {branch.city && (
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              {branch.city}
            </div>
          )}
        </div>

        {/* Kebab menu */}
        <div style={{ position: 'relative' }} ref={menuOpen ? menuRef : undefined}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.2)'; }}
            style={{
              background: 'rgba(51,65,85,0.2)', border: '1px solid rgba(51,65,85,0.3)',
              borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#94a3b8', transition: 'all 0.2s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: 36, right: 0, zIndex: 50,
              background: 'linear-gradient(145deg, #0d1f3c, #0a1628)',
              border: '1px solid rgba(34,211,238,0.12)',
              borderRadius: 12, padding: 4, minWidth: 160,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              animation: 'scaleIn 0.15s ease-out',
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
                  onMouseEnter={e => { e.currentTarget.style.background = item.danger ? 'rgba(244,63,94,0.1)' : 'rgba(34,211,238,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', background: 'transparent',
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                    color: item.danger ? '#fda4af' : '#c9d1d9',
                    fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                    transition: 'background 0.15s',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      <div style={{ display: 'flex', gap: 0, marginBottom: 14 }}>
        {[
          { value: branch.coaches_count ?? 0, label: 'Coaches' },
          { value: branch.swimmers_count ?? 0, label: 'Swimmers' },
          { value: branch.sessions_count ?? 0, label: 'Sessions' },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: 1, textAlign: 'center',
            padding: '10px 0', borderRadius: 10,
            background: 'rgba(6,13,31,0.4)',
          }}>
            <div style={{
              fontSize: 20, fontWeight: 800, color: '#22d3ee',
              fontFamily: "'Outfit', sans-serif", lineHeight: 1.2,
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Features pills */}
      {effectiveFeatures.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {effectiveFeatures.map(f => (
            <span key={f.key} style={{
              padding: '3px 10px', borderRadius: 999,
              background: 'rgba(34,211,238,0.08)',
              color: '#22d3ee', fontSize: 11, fontWeight: 500,
              border: '1px solid rgba(34,211,238,0.15)',
            }}>
              {f.icon} {f.label}
            </span>
          ))}
        </div>
      )}

      {/* Capacity + Working hours footer */}
      {(branch.capacity || branch.working_hours) && (
        <div style={{
          display: 'flex', gap: 16, marginTop: 12, paddingTop: 12,
          borderTop: '1px solid rgba(51,65,85,0.2)',
        }}>
          {branch.capacity && (
            <div style={{ fontSize: 12, color: '#526280', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#526280" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
              Cap: {branch.capacity}
            </div>
          )}
          {branch.working_hours && (
            <div style={{ fontSize: 12, color: '#526280', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#526280" strokeWidth="2" strokeLinecap="round">
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
        width: 44, height: 24, borderRadius: 12,
        background: checked
          ? 'linear-gradient(135deg, #2dd4bf, #14b8a6)'
          : 'rgba(51,65,85,0.4)',
        border: checked ? '1px solid rgba(45,212,191,0.3)' : '1px solid rgba(51,65,85,0.5)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
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
