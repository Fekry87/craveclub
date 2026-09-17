import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { DataTable, FormPage, FormPageActions, FormField, Input, Select, TextArea, Button, PageHeader, CardActions, getAvatarColor, MobileCardWrapper } from '../../components/CrudTable';
import { Modal, ModalActions } from '../../components/ui/Modal';
import { labelStyle } from '../../components/ui/styles';
import { apiErrorMessage } from '../../lib/apiError';

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
  const EMPTY_FORM = { name: '', description: '', coach_user_id: '', group_type: 'daily', capacity: '', days_of_week: [], start_time: '', end_time: '' };
  const [form, setForm] = useState(EMPTY_FORM);
  const TYPES = ['daily', 'two_days', 'three_days', 'private'];
  const DAYS = [0, 1, 2, 3, 4, 5, 6];
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get('/club/groups', { params: { search } }).then(r => setGroups(r.data.data || [])).catch(() => {});
    api.get('/club/coaches').then(r => setCoaches(r.data.data || [])).catch(() => {});
    api.get('/club/swimmers').then(r => setSwimmers(r.data.data || [])).catch(() => {});
  };
  useEffect(() => { load(); }, [search]);

  const handleSave = async () => {
    // Without this, a 422 threw out of the handler: the form never closed, the
    // list never reloaded, and the button looked broken with nothing explaining why.
    setSaving(true);
    setSaveError(null);
    try {
      // Empty capacity means no limit; the API wants null, not "".
      const payload = {
        ...form,
        capacity: form.capacity === '' ? null : Number(form.capacity),
        start_time: form.start_time || null,
        end_time: form.end_time || null,
      };
      if (editId) await api.put(`/club/groups/${editId}`, payload);
      else await api.post('/club/groups', payload);
      setShowModal(false); setEditId(null); load();
    } catch (err) {
      setSaveError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (g) => {
    setEditId(g.id);
    setForm({
      name: g.name, description: g.description || '', coach_user_id: g.coach_user_id || '',
      group_type: g.group_type || 'daily', capacity: g.capacity ?? '',
      days_of_week: g.days_of_week || [],
      start_time: (g.start_time || '').slice(0, 5), end_time: (g.end_time || '').slice(0, 5),
    });
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

  const spotsOf = (g) => {
    if (g.capacity == null) return t('groups.unlimited');
    const left = Math.max(0, g.capacity - (g.swimmers?.length || 0));
    return left === 0 ? t('groups.full') : t('groups.spotsLeft', { count: left });
  };

  const columns = [
    { key: 'name', label: t('groups.name') },
    { key: 'group_type', label: t('groups.type'), render: r => t(`subscriptions.types.${r.group_type || 'daily'}`) },
    { key: 'coach', label: t('groups.coach'), render: r => r.coach?.name || <span style={{ color: '#86868B' }}>{t('groups.unassigned')}</span> },
    { key: 'spots', label: t('groups.spots'), render: r => <span style={{ color: r.capacity != null && r.capacity - (r.swimmers?.length || 0) <= 0 ? '#B12A20' : '#1D1D1F' }}>{spotsOf(r)}</span> },
    { key: 'swimmers', label: t('dashboard.swimmers'), render: r => (
      <span style={{ ...labelStyle, color: '#1D1D1F' }}>
        
      </span>
    ) },
  ];

  if (showModal) {
    return (
      <FormPage title={editId ? t('groups.editGroup') : t('groups.newGroup')} onBack={closeForm}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}>
        <FormField label={t('groups.name')}><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></FormField>
        <FormField label={t('groups.coach')}>
          <Select value={form.coach_user_id} onChange={e => setForm({ ...form, coach_user_id: e.target.value })}
            options={coaches.map(c => ({ value: c.user_id, label: c.user?.name }))} />
        </FormField>
        <FormField label={t('groups.type')}>
          <Select value={form.group_type} onChange={e => setForm({ ...form, group_type: e.target.value })}
            options={TYPES.map(type => ({ value: type, label: t(`subscriptions.types.${type}`) }))} />
          <div style={{ ...labelStyle, marginTop: 6 }}>{t('groups.typeHint')}</div>
        </FormField>
        <FormField label={t('groups.days')}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DAYS.map(day => {
              const on = form.days_of_week.includes(day);
              return (
                <button type="button" key={day} aria-pressed={on}
                  onClick={() => setForm({ ...form, days_of_week: on ? form.days_of_week.filter(d => d !== day) : [...form.days_of_week, day].sort() })}
                  style={{
                    padding: '7px 12px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
                    border: `1px solid ${on ? '#0071E3' : '#D2D2D7'}`,
                    background: on ? 'rgba(0,113,227,0.1)' : '#FFFFFF', color: on ? '#0071E3' : '#1D1D1F',
                  }}>{t(`groups.dayShort.${day}`)}</button>
              );
            })}
          </div>
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <FormField label={t('groups.startTime')}><Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></FormField>
          <FormField label={t('groups.endTime')}><Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></FormField>
          <FormField label={t('groups.capacity')}><Input type="number" min="1" max="500" placeholder={t('groups.unlimited')} value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} /></FormField>
        </div>
        <div style={{ ...labelStyle, marginTop: -6, marginBottom: 12 }}>{t('groups.capacityHint')}</div>
        <FormField label={t('groups.description')}><TextArea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></FormField>
        {saveError && (
          <div role="alert" style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(255,59,48,0.1)', color: '#B12A20',
            fontSize: 13, lineHeight: 1.45,
          }}>{saveError}</div>
        )}

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
        <Button onClick={() => { setEditId(null); setForm(EMPTY_FORM); setShowModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
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
                <div style={{ borderRadius: 14,
                  width: 46, height: 46, background: ac.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600,
                  letterSpacing: '-0.02em',
                  color: ac.text, flexShrink: 0, }}>{initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: '#1D1D1F', fontSize: 16, fontWeight: 500, fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.02em', lineHeight: 1,
                  }}>{row.name}</div>
                  <div style={{ ...labelStyle, marginTop: 7, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 3, background: '#0071E3', display: 'inline-block', flexShrink: 0 }} />
                    {swimmerCount} swimmer{swimmerCount !== 1 ? 's' : ''}
                  </div>
                </div>
                </div>
              <div style={{ borderTop: '1px solid #E5E5EA' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '9px 0' }}>
                  <span style={{ ...labelStyle }}>{t('groups.coach')}</span>
                  <span style={{ color: row.coach?.name ? '#1D1D1F' : '#86868B', fontSize: 13, textAlign: 'end' }}>{row.coach?.name || t('groups.unassigned')}</span>
                </div>
              </div>
              <CardActions row={row} onEdit={e} onDelete={d} actions={a} />
            </MobileCardWrapper>
          );
        }}
      />
      {showMembers && (
        <Modal title={`Members: ${showMembers.name}`} onClose={() => setShowMembers(null)}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round"><path d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}>
          <div style={{ borderRadius: 16,
            maxHeight: 400, overflowY: 'auto',
            border: '1px solid #E5E5EA',
            background: '#FFFFFF',
          }}>
            {swimmers.map((s, i) => (
              <label key={s.id}
                onMouseEnter={e => { e.currentTarget.style.background = '#F2F2F7'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  color: '#1D1D1F', cursor: 'pointer',
                  borderBottom: i < swimmers.length - 1 ? '1px solid #E5E5EA' : 'none',
                  transition: 'background 0.15s ease',
                }}>
                <input type="checkbox" checked={selectedSwimmers.includes(s.id)} onChange={() => toggleSwimmer(s.id)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{s.first_name} {s.last_name}</div>
                </div>
                {s.level && <span style={{
                  ...labelStyle, fontSize: 10, lineHeight: '14px',
                  padding: '3px 8px', border: '1px solid #AEAEB2',
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
