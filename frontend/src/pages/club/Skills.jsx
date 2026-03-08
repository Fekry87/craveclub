import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { DataTable, Modal, ModalActions, FormField, Input, Select, TextArea, Button, PageHeader, CardActions, MobileCardWrapper } from '../../components/CrudTable';

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'SKILL', description: '' });

  const load = () => api.get('/club/skills', { params: { search } })
    .then(r => setSkills(r.data.data || []))
    .catch(() => {});
  useEffect(() => { load(); }, [search]);

  const handleSave = async () => {
    if (editId) await api.put(`/club/skills/${editId}`, form);
    else await api.post('/club/skills', form);
    setShowModal(false); setEditId(null); load();
  };

  const handleEdit = (s) => { setEditId(s.id); setForm({ name: s.name, type: s.type, description: s.description || '' }); setShowModal(true); };
  const handleDelete = async (s) => { if (confirm('Delete?')) { await api.delete(`/club/skills/${s.id}`); load(); } };

  const typeColors = {
    SKILL: { bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.15)', color: '#22d3ee' },
    SWIM_TYPE: { bg: 'rgba(45,212,191,0.08)', border: 'rgba(45,212,191,0.15)', color: '#2dd4bf' },
    TECHNIQUE: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: r => {
      const tc = typeColors[r.type] || typeColors.SKILL;
      return <span style={{ background: tc.bg, border: `1px solid ${tc.border}`, color: tc.color, padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500 }}>{r.type}</span>;
    }},
    { key: 'description', label: 'Description' },
  ];

  return (
    <div>
      <PageHeader title="Skills Library" search={search} onSearch={setSearch} searchPlaceholder="Search skills...">
        <Button onClick={() => { setEditId(null); setForm({ name: '', type: 'SKILL', description: '' }); setShowModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          New Skill
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={skills} onEdit={handleEdit} onDelete={handleDelete}
        mobileCard={(row, i, { onEdit: e, onDelete: d }) => {
          const tc = typeColors[row.type] || typeColors.SKILL;
          const typeIcons = {
            SKILL: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={tc.color} strokeWidth="2" strokeLinecap="round"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
            SWIM_TYPE: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={tc.color} strokeWidth="2" strokeLinecap="round"><path d="M4 20C6.5 17 9 22 12 18C15 14 17 22 20 18" /></svg>,
            TECHNIQUE: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={tc.color} strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>,
          };
          return (
            <MobileCardWrapper key={row.id} index={i} accentColor={tc.color}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: row.description ? 10 : 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 13,
                  background: tc.bg, border: `1px solid ${tc.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}>{typeIcons[row.type] || typeIcons.SKILL}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{row.name}</div>
                  <span style={{ display: 'inline-block', marginTop: 4, background: tc.bg, border: `1px solid ${tc.border}`, color: tc.color, padding: '2px 10px', borderRadius: 20, fontSize: '0.6875rem', fontWeight: 600 }}>{row.type.replace('_', ' ')}</span>
                </div>
              </div>
              {row.description && (
                <div style={{ color: '#94a3b8', fontSize: '0.8125rem', lineHeight: 1.5, padding: '10px 0 2px', borderTop: '1px solid rgba(51,65,85,0.1)', marginTop: 2 }}>
                  {row.description}
                </div>
              )}
              <CardActions row={row} onEdit={e} onDelete={d} />
            </MobileCardWrapper>
          );
        }}
      />
      {showModal && (
        <Modal title={editId ? 'Edit Skill' : 'New Skill'} onClose={() => setShowModal(false)}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}>
          <FormField label="Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Type"><Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} options={[{ value: 'SKILL', label: 'Skill' }, { value: 'SWIM_TYPE', label: 'Swim Type' }, { value: 'TECHNIQUE', label: 'Technique' }]} /></FormField>
          <FormField label="Description"><TextArea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></FormField>
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editId ? 'Update' : 'Create'}</Button>
          </ModalActions>
        </Modal>
      )}
    </div>
  );
}
