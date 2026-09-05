import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { DataTable, FormPage, FormPageActions, FormField, Input, Select, TextArea, Button, PageHeader, CardActions, MobileCardWrapper } from '../../components/CrudTable';
import { dateLocale } from '../../lib/dates';
import { labelStyle } from '../../components/ui/styles';

export default function Sessions() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [plans, setPlans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ group_id: '', plan_id: '', date: '', start_time: '', end_time: '', location: '', notes: '' });

  const load = () => {
    api.get('/club/sessions').then(r => setSessions(r.data.data || [])).catch(() => {});
    api.get('/club/groups').then(r => setGroups(r.data.data || [])).catch(() => {});
    api.get('/club/plans').then(r => setPlans(r.data.data || [])).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    const payload = { ...form, plan_id: form.plan_id || null };
    if (editId) await api.put(`/club/sessions/${editId}`, payload);
    else await api.post('/club/sessions', payload);
    setShowModal(false); setEditId(null); load();
  };

  const handleEdit = (s) => {
    setEditId(s.id);
    setForm({ group_id: s.group_id, plan_id: s.plan_id || '', date: s.date?.split('T')[0] || '', start_time: s.start_time?.substring(0, 5) || '', end_time: s.end_time?.substring(0, 5) || '', location: s.location || '', notes: s.notes || '' });
    setShowModal(true);
  };
  const handleDelete = async (s) => { if (confirm('Delete?')) { await api.delete(`/club/sessions/${s.id}`); load(); } };

  const closeForm = () => { setShowModal(false); setEditId(null); };

  const columns = [
    { key: 'date', label: t('sessions.date'), render: r => r.date?.split('T')[0] },
    { key: 'time', label: t('sessions.time'), render: r => (
      <span style={{ ...labelStyle, color: '#1D1D1F' }}>
        {r.start_time?.substring(0,5)} – {r.end_time?.substring(0,5)}
      </span>
    )},
    { key: 'group', label: t('sessions.group'), render: r => r.group?.name },
    { key: 'plan', label: t('sessions.plan'), render: r => r.plan?.title || <span style={{ color: '#86868B' }}>{t('sessions.none')}</span> },
    { key: 'location', label: t('sessions.location') },
  ];

  if (showModal) {
    return (
      <FormPage title={editId ? t('sessions.editSession') : t('sessions.newSession')} onBack={closeForm}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}>
        <FormField label={t('sessions.group')}><Select value={form.group_id} onChange={e => setForm({ ...form, group_id: e.target.value })} options={groups.map(g => ({ value: g.id, label: g.name }))} /></FormField>
        <FormField label={t('sessions.planOptional')}><Select value={form.plan_id} onChange={e => setForm({ ...form, plan_id: e.target.value })} options={plans.map(p => ({ value: p.id, label: p.title }))} /></FormField>
        <FormField label={t('sessions.date')}><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label={t('sessions.startTime')}><Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></FormField>
          <FormField label={t('sessions.endTime')}><Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></FormField>
        </div>
        <FormField label={t('sessions.location')}><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></FormField>
        <FormField label={t('sessions.notes')}><TextArea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></FormField>
        <FormPageActions>
          <Button variant="secondary" onClick={closeForm}>{t('actions.cancel')}</Button>
          <Button onClick={handleSave}>{editId ? t('actions.update') : t('actions.create')}</Button>
        </FormPageActions>
      </FormPage>
    );
  }

  return (
    <div>
      <PageHeader title={t('sessions.title')}>
        <Button onClick={() => { setEditId(null); setForm({ group_id: '', plan_id: '', date: '', start_time: '', end_time: '', location: '', notes: '' }); setShowModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          {t('sessions.newSession')}
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={sessions} onEdit={handleEdit} onDelete={handleDelete}
        mobileCard={(row, i, { onEdit: e, onDelete: d }) => {
          const date = row.date?.split('T')[0];
          const dayName = date ? new Date(date + 'T00:00:00').toLocaleDateString(dateLocale(), { weekday: 'short' }) : '';
          const dayNum = date ? new Date(date + 'T00:00:00').getDate() : '';
          const month = date ? new Date(date + 'T00:00:00').toLocaleDateString(dateLocale(), { month: 'short' }) : '';
          return (
            <MobileCardWrapper key={row.id} index={i} accentColor="#1D1D1F">
              {/* Header: date block + group name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{
                  width: 52, height: 56,
                  border: '1px solid #E5E5EA',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, }}>
                  <div style={{ ...labelStyle, fontSize: 9, color: '#0071E3' }}>{dayName}</div>
                  <div style={{ color: '#1D1D1F', fontSize: 20, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1 }}>{dayNum}</div>
                  <div style={{ ...labelStyle, fontSize: 9, color: '#86868B' }}>{month}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: '#1D1D1F', fontSize: 16, fontWeight: 500, fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 7,
                  }}>{row.group?.name || t('sessions.trainingSession')}</div>
                  <span style={{ ...labelStyle, color: '#1D1D1F' }}>
                    {row.start_time?.substring(0,5)} – {row.end_time?.substring(0,5)}
                  </span>
                </div>
                </div>
              {/* Info */}
              {(row.plan?.title || row.location) && (
                <div style={{ borderTop: '1px solid #E5E5EA' }}>
                  {row.plan?.title && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: row.location ? '1px solid #F2F2F7' : 'none' }}>
                      <span style={{ ...labelStyle }}>{t('sessions.plan')}</span>
                      <span style={{ color: '#1D1D1F', fontSize: 13, textAlign: 'end' }}>{row.plan.title}</span>
                    </div>
                  )}
                  {row.location && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '9px 0' }}>
                      <span style={{ ...labelStyle }}>{t('sessions.location')}</span>
                      <span style={{ color: '#1D1D1F', fontSize: 13, textAlign: 'end' }}>{row.location}</span>
                    </div>
                  )}
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
