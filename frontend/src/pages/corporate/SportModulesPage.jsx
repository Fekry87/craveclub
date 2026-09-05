import { useState, useEffect } from 'react';
import { getSportModules, createSportModule, updateSportModule, deleteSportModule } from '../../api/sportModules';
import { DataTable, FormPage, FormPageActions, FormField, Input, TextArea, Button, PageHeader, CardActions, MobileCardWrapper } from '../../components/CrudTable';
import { Modal, ModalActions } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { inputStyle, inputFocusProps } from '../../components/ui/styles';
import { useTranslation } from 'react-i18next';

const emptyForm = { name: '', slug: '', description: '', icon: '', color: '#0071E3', sort_order: 0, is_active: true };

/** Soft tinted initial tile — matches the avatar language used across the app. */
function ModuleTile({ name, color, size = 28 }) {
  const tint = color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#0071E3';
  return (
    <div style={{
      width: size, height: size, borderRadius: size >= 36 ? 12 : 9, flexShrink: 0,
      background: `${tint}1A`, color: tint,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size >= 36 ? 16 : 13, fontWeight: 600,
    }}>{name ? name.charAt(0).toUpperCase() : '?'}</div>
  );
}

/** iOS-style switch — RTL-safe via insetInlineStart. */
function ToggleSwitch({ checked, onChange }) {
  return (
    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 26, cursor: 'pointer', flexShrink: 0 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{
        position: 'absolute', inset: 0, borderRadius: 13,
        background: checked ? '#34C759' : '#E5E5EA',
        transition: 'background 200ms ease',
      }} />
      <span style={{
        position: 'absolute', top: 2, insetInlineStart: checked ? 20 : 2,
        width: 22, height: 22, borderRadius: '50%', background: '#FFFFFF',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        transition: 'inset-inline-start 200ms ease',
      }} />
    </label>
  );
}

/** Round colour well — the native picker sits inside a circular clipped wrapper. */
function ColorWell({ value, onChange, size = 36 }) {
  return (
    <div style={{
      position: 'relative', width: size, height: size, flexShrink: 0,
      borderRadius: '50%', overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.08)',
      background: value || '#0071E3',
    }}>
      <input
        type="color" value={value || '#0071E3'} onChange={e => onChange(e.target.value)}
        style={{
          position: 'absolute', insetInlineStart: -4, top: -4,
          width: size + 8, height: size + 8,
          opacity: 0, cursor: 'pointer', border: 'none', padding: 0, background: 'none',
        }}
      />
    </div>
  );
}

function InlineError({ children }) {
  if (!children) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', borderRadius: 12,
      background: 'rgba(255,59,48,0.08)', color: '#B12A20',
      fontSize: 13, fontFamily: 'var(--font-body)',
      animation: 'fadeInUp 0.25s ease-out',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />
      </svg>
      {children}
    </div>
  );
}

export default function SportModulesPage() {
  const { t } = useTranslation();
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
    setForm({ name: mod.name, slug: mod.slug, description: mod.description || '', icon: mod.icon || '', color: mod.color || '#0071E3', sort_order: mod.sort_order || 0, is_active: mod.is_active !== false });
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
    { key: 'icon', label: 'Icon', render: r => <ModuleTile name={r.name} color={r.color} /> },
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug', render: r => (
      <span style={{
        display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 980,
        background: '#F2F2F7', color: '#515154',
        fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, lineHeight: '16px', whiteSpace: 'nowrap',
      }}>{r.slug}</span>
    )},
    { key: 'is_active', label: 'Active', render: r => (
      <Badge variant={r.is_active ? 'success' : 'neutral'} label={r.is_active ? 'Active' : 'Inactive'} />
    )},
    { key: 'clubs_count', label: 'Clubs', render: r => (
      <span style={{ color: '#1D1D1F', fontSize: 14, fontWeight: 500 }}>{r.clubs_count || 0}</span>
    )},
  ];

  // Delete confirmation modal
  if (showModal === 'delete' && deleteTarget) {
    return (
      <Modal title="Delete sport module" onClose={closeForm}>
        {deleteTarget.clubs_count > 0 ? (
          <div style={{ color: '#515154', fontSize: 14, lineHeight: 1.5, padding: '4px 0 14px' }}>
            Cannot delete “{deleteTarget.name}” — it is assigned to {deleteTarget.clubs_count} club(s). Remove it from all clubs first.
          </div>
        ) : (
          <div style={{ color: '#515154', fontSize: 14, lineHeight: 1.5, padding: '4px 0 14px' }}>
            Delete “{deleteTarget.name}”? This action cannot be undone.
          </div>
        )}
        {error && <div style={{ marginBottom: 12 }}><InlineError>{error}</InlineError></div>}
        <ModalActions>
          <Button variant="secondary" onClick={closeForm}>{t('actions.cancel')}</Button>
          <Button variant="danger" onClick={confirmDelete} disabled={saving || deleteTarget.clubs_count > 0}>
            {saving ? t('loading.deleting') : t('actions.delete')}
          </Button>
        </ModalActions>
      </Modal>
    );
  }

  // Create / Edit form
  if (showModal === 'create' || showModal === 'edit') {
    return (
      <FormPage
        title={editId ? t('actions.edit') + ' ' + t('corporate.sportModules') : t('actions.create') + ' ' + t('corporate.sportModules')}
        onBack={closeForm}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v8" /></svg>}
      >
        <FormField label="Name">
          <Input value={form.name} onChange={e => editId ? setForm({ ...form, name: e.target.value }) : handleSlugFromName(e.target.value)} placeholder="e.g. Swimming" />
        </FormField>
        <FormField label="Slug">
          <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="e.g. swimming" />
        </FormField>
        <FormField label="Description">
          <TextArea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description..." />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Icon key">
            <Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="e.g. drop-fill" />
          </FormField>
          <FormField label="Color">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ColorWell value={form.color} onChange={v => setForm({ ...form, color: v })} />
              <input type="text" value={form.color || ''} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="#0071E3"
                style={{ ...inputStyle, flex: 1, minWidth: 0 }} {...inputFocusProps}
              />
            </div>
          </FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Sort order">
            <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} min="0" />
          </FormField>
          <FormField label="Active">
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              height: 42, padding: '0 14px', borderRadius: 12, background: '#F2F2F7',
            }}>
              <span style={{ fontSize: 14, color: '#1D1D1F' }}>{form.is_active ? 'Active' : 'Inactive'}</span>
              <ToggleSwitch checked={form.is_active} onChange={() => setForm({ ...form, is_active: !form.is_active })} />
            </div>
          </FormField>
        </div>

        {error && <div style={{ marginTop: 12 }}><InlineError>{error}</InlineError></div>}

        <FormPageActions>
          <Button variant="secondary" onClick={closeForm}>{t('actions.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? t('loading.saving') : (editId ? t('actions.update') : t('actions.create'))}</Button>
        </FormPageActions>
      </FormPage>
    );
  }

  return (
    <div>
      <PageHeader title={t('corporate.sportModules')} searchPlaceholder={t('actions.search') + '...'}>
        <Button onClick={() => { setEditId(null); setError(null); setForm({ ...emptyForm }); setShowModal('create'); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          {t('actions.create')}
        </Button>
      </PageHeader>

      <DataTable columns={columns} data={modules} onEdit={handleEdit} onDelete={handleDelete}
        mobileCard={(row, i, { onEdit: e, onDelete: d }) => (
          <MobileCardWrapper key={row.id} index={i} accentColor={row.is_active ? '#34C759' : '#D2D2D7'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <ModuleTile name={row.name} color={row.color} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: '#1D1D1F', fontSize: 15, fontWeight: 600,
                  fontFamily: 'var(--font-display)', letterSpacing: '-0.01em',
                }}>{row.name}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 980,
                    background: '#F2F2F7', color: '#515154',
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, lineHeight: '16px', whiteSpace: 'nowrap',
                  }}>{row.slug}</span>
                  <Badge variant={row.is_active ? 'success' : 'neutral'} label={row.is_active ? 'Active' : 'Inactive'} />
                  <Badge variant="info" label={`${row.clubs_count || 0} clubs`} />
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
