import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { DataTable, FormPage, FormPageActions, FormField, Input, TextArea, Button, PageHeader } from '../../components/CrudTable';

const emptyItem = { sort_order: 0, stroke: '', drill: '', distance: '', reps: '', interval: '', notes: '' };

export default function Plans() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', level: '', description: '', items: [] });

  const load = () => api.get('/club/plans', { params: { search } })
    .then(r => setPlans(r.data.data || []))
    .catch(() => {});
  useEffect(() => { load(); }, [search]);

  const handleSave = async () => {
    const payload = { ...form, items: form.items.map((item, i) => ({ ...item, sort_order: i + 1 })) };
    if (editId) await api.put(`/club/plans/${editId}`, payload);
    else await api.post('/club/plans', payload);
    setShowModal(false); setEditId(null); load();
  };

  const handleEdit = (plan) => {
    setEditId(plan.id);
    setForm({ title: plan.title, level: plan.level || '', description: plan.description || '', items: plan.items || [] });
    setShowModal(true);
  };

  const handleDelete = async (plan) => { if (confirm('Delete?')) { await api.delete(`/club/plans/${plan.id}`); load(); } };

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'level', label: 'Level', render: r => r.level ? (
      <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.1)', color: '#2dd4bf' }}>{r.level}</span>
    ) : <span style={{ color: '#475569' }}>--</span> },
    { key: 'items', label: 'Items', render: r => (
      <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'rgba(34,211,238,0.08)', color: '#22d3ee' }}>
        {r.items?.length || 0}
      </span>
    ) },
  ];

  const closeForm = () => { setShowModal(false); setEditId(null); };

  if (showModal) {
    return (
      <FormPage title={editId ? 'Edit Plan' : 'New Plan'} onBack={closeForm}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}>
        <FormField label="Title"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></FormField>
        <FormField label="Level"><Input value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} placeholder="e.g. Beginner, Advanced" /></FormField>
        <FormField label="Description"><TextArea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></FormField>
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{
              color: '#94a3b8', margin: 0, fontSize: 11, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>Plan Items</h4>
            <Button variant="secondary" onClick={() => setForm({ ...form, items: [...form.items, { ...emptyItem }] })}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Add Item
            </Button>
          </div>
          {form.items.map((item, idx) => (
            <div key={idx} className="plan-item-grid" style={{
              background: 'rgba(6,13,31,0.5)', padding: 14, borderRadius: 12, marginBottom: 10,
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10,
              border: '1px solid rgba(51,65,85,0.3)',
            }}>
              <Input placeholder="Stroke" value={item.stroke || ''} onChange={e => updateItem(idx, 'stroke', e.target.value)} />
              <Input placeholder="Drill" value={item.drill || ''} onChange={e => updateItem(idx, 'drill', e.target.value)} />
              <Input placeholder="Distance" value={item.distance || ''} onChange={e => updateItem(idx, 'distance', e.target.value)} />
              <Input placeholder="Reps" type="number" value={item.reps || ''} onChange={e => updateItem(idx, 'reps', e.target.value)} />
              <Input placeholder="Interval" value={item.interval || ''} onChange={e => updateItem(idx, 'interval', e.target.value)} />
              <div style={{ display: 'flex', gap: 6 }}>
                <Input placeholder="Notes" value={item.notes || ''} onChange={e => updateItem(idx, 'notes', e.target.value)} />
                <Button variant="danger" onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </Button>
              </div>
            </div>
          ))}
        </div>
        <FormPageActions>
          <Button variant="secondary" onClick={closeForm}>{t('actions.cancel')}</Button>
          <Button onClick={handleSave}>{editId ? t('actions.update') : t('actions.create')}</Button>
        </FormPageActions>
      </FormPage>
    );
  }

  return (
    <div>
      <PageHeader title="Training Plans" search={search} onSearch={setSearch} searchPlaceholder="Search plans...">
        <Button onClick={() => { setEditId(null); setForm({ title: '', level: '', description: '', items: [] }); setShowModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          New Plan
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={plans} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
}
