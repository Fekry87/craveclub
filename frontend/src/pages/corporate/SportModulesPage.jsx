import { useState, useEffect } from 'react';
import { getSportModules, createSportModule, updateSportModule, deleteSportModule } from '../../api/sportModules';
import { DataTable, FormPage, FormPageActions, FormField, Input, TextArea, Button, PageHeader, CardActions, MobileCardWrapper } from '../../components/CrudTable';
import { Modal, ModalActions } from '../../components/ui/Modal';

const emptyForm = { name: '', slug: '', description: '', icon: '', color: '#2B6CB0', sort_order: 0, is_active: true };

export default function SportModulesPage() {
  const [modules, setModules] = useState([]);
  const [showModal, setShowModal] = useState(null); // 'create' | 'edit' | 'delete'
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = () => getSportModules().then(setModules).catch(() => {});
  useEffect(() => { load(); }, []);

  const closeForm = () => { setShowModal(null); setEditId(null); setDeleteTarget(null); setError(null); setForm({ ...emptyForm }); };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      if (editId) {
        await updateSportModule(editId, form);
      } else {
        await createSportModule(form);
      }
      closeForm();
      load();
    } catch (err) {
      const msgs = err.response?.data?.errors;
      setError(msgs ? Object.values(msgs).map(a => a[0]).join(', ') : (err.response?.data?.message || 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (mod) => {
    setEditId(mod.id);
    setForm({ name: mod.name, slug: mod.slug, description: mod.description || '', icon: mod.icon || '', color: mod.color || '#2B6CB0', sort_order: mod.sort_order || 0, is_active: mod.is_active !== false });
    setShowModal('edit');
  };

  const handleDelete = (mod) => {
    setDeleteTarget(mod);
    setShowModal('delete');
  };

  const confirmDelete = async () => {
    try {
      setSaving(true);
      setError(null);
      await deleteSportModule(deleteTarget.id);
      closeForm();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const handleSlugFromName = (name) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setForm(f => ({ ...f, name, slug }));
  };

  const columns = [
    { key: 'icon', label: 'Icon', render: r => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: r.color || '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', boxShadow: `0 0 8px ${r.color || '#475569'}30` }}>
          <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{r.icon ? r.icon.charAt(0).toUpperCase() : '?'}</span>
        </div>
      </div>
    )},
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug', render: r => (
      <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'rgba(51,65,85,0.3)', color: '#94a3b8', fontFamily: "'DM Sans', monospace" }}>{r.slug}</span>
    )},
    { key: 'is_active', label: 'Active', render: r => (
      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: r.is_active ? 'rgba(88,204,2,0.1)' : 'rgba(229,62,62,0.1)', color: r.is_active ? '#58CC02' : '#E53E3E', border: `1px solid ${r.is_active ? 'rgba(88,204,2,0.2)' : 'rgba(229,62,62,0.2)'}` }}>
        {r.is_active ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'clubs_count', label: 'Clubs', render: r => (
      <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'rgba(34,211,238,0.08)', color: '#22d3ee' }}>{r.clubs_count || 0}</span>
    )},
  ];

  // Delete confirmation modal
  if (showModal === 'delete' && deleteTarget) {
    return (
      <Modal title="Delete Sport Module" onClose={closeForm}>
        {deleteTarget.clubs_count > 0 ? (
          <div style={{ color: '#fc8181', fontSize: 14, padding: '12px 0' }}>
            Cannot delete "{deleteTarget.name}" — it is assigned to {deleteTarget.clubs_count} club(s). Remove it from all clubs first.
          </div>
        ) : (
          <div style={{ color: '#e2e8f0', fontSize: 14, padding: '12px 0' }}>
            Delete "{deleteTarget.name}"? This action cannot be undone.
          </div>
        )}
        {error && <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)', color: '#fc8181', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <ModalActions>
          <Button variant="secondary" onClick={closeForm}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete} disabled={saving || deleteTarget.clubs_count > 0}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </ModalActions>
      </Modal>
    );
  }

  // Create / Edit form
  if (showModal === 'create' || showModal === 'edit') {
    return (
      <FormPage
        title={editId ? 'Edit Sport Module' : 'New Sport Module'}
        onBack={closeForm}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v8" /></svg>}
      >
        <FormField label="Name">
          <Input value={form.name} onChange={e => editId ? setForm({ ...form, name: e.target.value }) : handleSlugFromName(e.target.value)} placeholder="e.g. Swimming" />
        </FormField>
        <FormField label="Slug">
          <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="e.g. swimming" style={{ fontFamily: "'DM Mono', monospace" }} />
        </FormField>
        <FormField label="Description">
          <TextArea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description..." />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Icon Key">
            <Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="e.g. drop-fill" />
          </FormField>
          <FormField label="Color">
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'rgba(6,13,31,0.6)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ width: 48, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(51,65,85,0.4)', position: 'relative' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: form.color || '#475569', boxShadow: `0 0 12px ${form.color || '#475569'}40`, border: '2px solid rgba(255,255,255,0.15)' }} />
                <input type="color" value={form.color || '#475569'} onChange={e => setForm({ ...form, color: e.target.value })} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
              </div>
              <input type="text" value={form.color || ''} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="#2B6CB0"
                style={{ flex: 1, minWidth: 0, padding: '0 14px', height: 44, background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: '0.875rem', fontFamily: "'DM Mono', monospace", outline: 'none' }}
              />
            </div>
          </FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Sort Order">
            <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} min="0" />
          </FormField>
          <FormField label="Active">
            <div style={{ paddingTop: 8 }}>
              <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_active} onChange={() => setForm({ ...form, is_active: !form.is_active })} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', inset: 0, borderRadius: 999, background: form.is_active ? '#58CC02' : '#CBD5E0', transition: 'background 200ms' }} />
                <span style={{ position: 'absolute', top: 3, left: form.is_active ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </label>
            </div>
          </FormField>
        </div>

        {error && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)', color: '#fc8181', fontSize: 13 }}>{error}</div>}

        <FormPageActions>
          <Button variant="secondary" onClick={closeForm}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : (editId ? 'Update' : 'Create Module')}</Button>
        </FormPageActions>
      </FormPage>
    );
  }

  return (
    <div>
      <PageHeader title="Sport Modules" searchPlaceholder="Search modules...">
        <Button onClick={() => { setEditId(null); setError(null); setForm({ ...emptyForm }); setShowModal('create'); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          New Module
        </Button>
      </PageHeader>

      <DataTable columns={columns} data={modules} onEdit={handleEdit} onDelete={handleDelete}
        mobileCard={(row, i, { onEdit: e, onDelete: d }) => (
          <MobileCardWrapper key={row.id} index={i} accentColor={row.color || '#475569'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: row.color || '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0, boxShadow: `0 3px 10px ${row.color || '#475569'}40` }}>
                {row.icon ? row.icon.charAt(0).toUpperCase() : '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600 }}>{row.name}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: 'rgba(51,65,85,0.3)', color: '#94a3b8', fontFamily: 'monospace' }}>{row.slug}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: row.is_active ? 'rgba(88,204,2,0.1)' : 'rgba(229,62,62,0.1)', color: row.is_active ? '#58CC02' : '#E53E3E' }}>
                    {row.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: 'rgba(34,211,238,0.08)', color: '#22d3ee' }}>{row.clubs_count || 0} clubs</span>
                </div>
              </div>
            </div>
            <CardActions row={row} onEdit={e} onDelete={d} />
          </MobileCardWrapper>
        )}
      />
    </div>
  );
}
