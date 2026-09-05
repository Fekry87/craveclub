import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getSkills, createSkill, updateSkill, deleteSkill } from '../../api/skills';
import { DataTable, FormPage, FormPageActions, FormField, Input, Select, TextArea, Button, PageHeader, CardActions, MobileCardWrapper } from '../../components/CrudTable';
import { Badge } from '../../components/ui/Badge';
import { labelStyle } from '../../components/ui/styles';

export default function Skills() {
  const { t } = useTranslation();
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'SKILL', description: '' });

  const load = () => getSkills({ search })
    .then(r => setSkills(r.data.data || []))
    .catch(() => {});
  useEffect(() => { load(); }, [search]);

  const handleSave = async () => {
    if (editId) await updateSkill(editId, form);
    else await createSkill(form);
    setShowModal(false); setEditId(null); load();
  };

  const handleEdit = (s) => { setEditId(s.id); setForm({ name: s.name, type: s.type, description: s.description || '' }); setShowModal(true); };
  const handleDelete = async (s) => { if (confirm('Delete?')) { await deleteSkill(s.id); load(); } };

  const typeColors = {
    SKILL: { variant: 'accent', color: '#0071E3' },
    SWIM_TYPE: { variant: 'info', color: '#515154' },
    TECHNIQUE: { variant: 'warning', color: '#FF9500' },
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: r => {
      const tc = typeColors[r.type] || typeColors.SKILL;
      return <Badge variant={tc.variant} label={r.type.replace('_', ' ')} />;
    }},
    { key: 'description', label: 'Description' },
  ];

  const closeForm = () => { setShowModal(false); setEditId(null); };

  if (showModal) {
    return (
      <FormPage title={editId ? 'Edit Skill' : 'New Skill'} onBack={closeForm}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}>
        <FormField label="Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></FormField>
        <FormField label="Type"><Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} options={[{ value: 'SKILL', label: 'Skill' }, { value: 'SWIM_TYPE', label: 'Swim Type' }, { value: 'TECHNIQUE', label: 'Technique' }]} /></FormField>
        <FormField label="Description"><TextArea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></FormField>
        <FormPageActions>
          <Button variant="secondary" onClick={closeForm}>{t('actions.cancel')}</Button>
          <Button onClick={handleSave}>{editId ? t('actions.update') : t('actions.create')}</Button>
        </FormPageActions>
      </FormPage>
    );
  }

  return (
    <div>
      <PageHeader title="Skills Library" search={search} onSearch={setSearch} searchPlaceholder="Search skills...">
        <Button onClick={() => { setEditId(null); setForm({ name: '', type: 'SKILL', description: '' }); setShowModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          New Skill
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={skills} onEdit={handleEdit} onDelete={handleDelete}
        mobileCard={(row, i, { onEdit: e, onDelete: d }) => {
          const tc = typeColors[row.type] || typeColors.SKILL;
          const typeIcons = {
            SKILL: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={tc.color} strokeWidth="1.8" strokeLinecap="round"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
            SWIM_TYPE: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={tc.color} strokeWidth="1.8" strokeLinecap="round"><path d="M4 20C6.5 17 9 22 12 18C15 14 17 22 20 18" /></svg>,
            TECHNIQUE: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={tc.color} strokeWidth="1.8" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>,
          };
          return (
            <MobileCardWrapper key={row.id} index={i} accentColor={tc.color}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: row.description ? 10 : 0 }}>
                <div style={{ borderRadius: 14,
                  width: 44, height: 44, background: '#F2F2F7', border: '1px solid #E5E5EA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{typeIcons[row.type] || typeIcons.SKILL}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: '#1D1D1F', fontSize: 16, fontWeight: 500, fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8,
                  }}>{row.name}</div>
                  <Badge variant={tc.variant} label={row.type.replace('_', ' ')} />
                </div>
                </div>
              {row.description && (
                <div style={{ color: '#515154', fontSize: 13, lineHeight: 1.5, padding: '10px 0 2px', borderTop: '1px solid #E5E5EA', marginTop: 2 }}>
                  {row.description}
                </div>
              )}
              <CardActions row={row} onEdit={e} onDelete={d} />
            </MobileCardWrapper>
          );
        }}
      />
    </div>
  );
}
