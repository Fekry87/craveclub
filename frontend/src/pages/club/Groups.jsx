import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { DataTable, FormPage, FormPageActions, FormField, Input, Select, TextArea, Button, PageHeader, CardActions, getAvatarColor, MobileCardWrapper } from '../../components/CrudTable';
import { Modal, ModalActions } from '../../components/ui/Modal';

export default function Groups() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [swimmers, setSwimmers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showMembers, setShowMembers] = useState(null);
  const [selectedSwimmers, setSelectedSwimmers] = useState([]);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', coach_user_id: '' });

  const load = () => {
    api.get('/club/groups', { params: { search } }).then(r => setGroups(r.data.data || [])).catch(() => {});
    api.get('/club/coaches').then(r => setCoaches(r.data.data || [])).catch(() => {});
    api.get('/club/swimmers').then(r => setSwimmers(r.data.data || [])).catch(() => {});
  };
  useEffect(() => { load(); }, [search]);

  const handleSave = async () => {
    if (editId) await api.put(`/club/groups/${editId}`, form);
    else await api.post('/club/groups', form);
    setShowModal(false); setEditId(null); load();
  };

  const handleEdit = (g) => {
    setEditId(g.id);
    setForm({ name: g.name, description: g.description || '', coach_user_id: g.coach_user_id || '' });
    setShowModal(true);
  };

  const handleDelete = async (g) => { if (confirm('Delete?')) { await api.delete(`/club/groups/${g.id}`); load(); } };

  const openMembers = (g) => {
    setShowMembers(g);
    setSelectedSwimmers(g.swimmers?.map(s => s.id) || []);
  };

  const saveMembers = async () => {
    await api.post(`/club/groups/${showMembers.id}/members`, { swimmer_ids: selectedSwimmers });
    setShowMembers(null); load();
  };

  const toggleSwimmer = (id) => {
    setSelectedSwimmers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const closeForm = () => { setShowModal(false); setEditId(null); };

  const columns = [
    { key: 'name', label: t('groups.name') },
    { key: 'coach', label: t('groups.coach'), render: r => r.coach?.name || <span style={{ color: '#475569' }}>{t('groups.unassigned')}</span> },
    { key: 'swimmers', label: t('dashboard.swimmers'), render: r => (
      <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'rgba(34,211,238,0.08)', color: '#22d3ee' }}>
        {r.swimmers?.length || 0}
      </span>
    ) },
  ];

  if (showModal) {
    return (
      <FormPage title={editId ? t('groups.editGroup') : t('groups.newGroup')} onBack={closeForm}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}>
        <FormField label={t('groups.name')}><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></FormField>
        <FormField label={t('groups.coach')}>
          <Select value={form.coach_user_id} onChange={e => setForm({ ...form, coach_user_id: e.target.value })}
            options={coaches.map(c => ({ value: c.user_id, label: c.user?.name }))} />
        </FormField>
        <FormField label={t('groups.description')}><TextArea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></FormField>
        <FormPageActions>
          <Button variant="secondary" onClick={closeForm}>{t('actions.cancel')}</Button>
          <Button onClick={handleSave}>{editId ? t('actions.update') : t('actions.create')}</Button>
        </FormPageActions>
      </FormPage>
    );
  }

  return (
    <div>
      <PageHeader title={t('groups.title')} search={search} onSearch={setSearch} searchPlaceholder={t('groups.searchPlaceholder')}>
        <Button onClick={() => { setEditId(null); setForm({ name: '', description: '', coach_user_id: '' }); setShowModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          {t('groups.newGroup')}
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={groups} onEdit={handleEdit} onDelete={handleDelete}
        actions={(row) => <Button variant="secondary" onClick={() => openMembers(row)}>{t('groups.members')}</Button>}
        mobileCard={(row, i, { onEdit: e, onDelete: d, actions: a }) => {
          const ac = getAvatarColor(row.name);
          const initials = row.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'G';
          const swimmerCount = row.swimmers?.length || 0;
          return (
            <MobileCardWrapper key={row.id} index={i} accentColor={ac.accent}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 13, background: ac.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Outfit', sans-serif", fontSize: '0.9375rem', fontWeight: 700,
                  color: ac.text, flexShrink: 0, boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
                }}>{initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{row.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.6875rem', fontWeight: 600, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.15)', color: '#22d3ee', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      {swimmerCount} swimmer{swimmerCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ background: 'rgba(6,13,31,0.3)', borderRadius: 12, padding: '2px 14px', border: '1px solid rgba(51,65,85,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0' }}>
                  <span style={{ color: '#64748b', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {t('groups.coach')}
                  </span>
                  <span style={{ color: row.coach?.name ? '#cbd5e1' : '#475569', fontSize: '0.8125rem', fontStyle: row.coach?.name ? 'normal' : 'italic' }}>{row.coach?.name || t('groups.unassigned')}</span>
                </div>
              </div>
              <CardActions row={row} onEdit={e} onDelete={d} actions={a} />
            </MobileCardWrapper>
          );
        }}
      />
      {showMembers && (
        <Modal title={`Members: ${showMembers.name}`} onClose={() => setShowMembers(null)}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}>
          <div style={{
            maxHeight: 400, overflowY: 'auto',
            borderRadius: 12, border: '1px solid rgba(51,65,85,0.3)',
            background: 'rgba(6,13,31,0.3)',
          }}>
            {swimmers.map((s, i) => (
              <label key={s.id}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  color: '#e2e8f0', cursor: 'pointer',
                  borderBottom: i < swimmers.length - 1 ? '1px solid rgba(51,65,85,0.25)' : 'none',
                  transition: 'background 0.15s ease',
                }}>
                <input type="checkbox" checked={selectedSwimmers.includes(s.id)} onChange={() => toggleSwimmer(s.id)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{s.first_name} {s.last_name}</div>
                </div>
                {s.level && <span style={{
                  color: '#64748b', fontSize: 11, fontWeight: 500, textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: 6, background: 'rgba(51,65,85,0.3)',
                  letterSpacing: '0.04em',
                }}>{s.level}</span>}
              </label>
            ))}
          </div>
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowMembers(null)}>{t('actions.cancel')}</Button>
            <Button onClick={saveMembers}>{t('actions.saveMembers')}</Button>
          </ModalActions>
        </Modal>
      )}
    </div>
  );
}
