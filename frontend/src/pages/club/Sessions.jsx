import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { DataTable, Modal, ModalActions, FormField, Input, Select, TextArea, Button, PageHeader, CardActions, MobileCardWrapper } from '../../components/CrudTable';

export default function Sessions() {
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

  const columns = [
    { key: 'date', label: 'Date', render: r => r.date?.split('T')[0] },
    { key: 'time', label: 'Time', render: r => (
      <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'rgba(34,211,238,0.08)', color: '#22d3ee' }}>
        {r.start_time?.substring(0,5)} - {r.end_time?.substring(0,5)}
      </span>
    )},
    { key: 'group', label: 'Group', render: r => r.group?.name },
    { key: 'plan', label: 'Plan', render: r => r.plan?.title || <span style={{ color: '#475569' }}>None</span> },
    { key: 'location', label: 'Location' },
  ];

  return (
    <div>
      <PageHeader title="Sessions">
        <Button onClick={() => { setEditId(null); setForm({ group_id: '', plan_id: '', date: '', start_time: '', end_time: '', location: '', notes: '' }); setShowModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          New Session
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={sessions} onEdit={handleEdit} onDelete={handleDelete}
        mobileCard={(row, i, { onEdit: e, onDelete: d }) => {
          const date = row.date?.split('T')[0];
          const dayName = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }) : '';
          const dayNum = date ? new Date(date + 'T00:00:00').getDate() : '';
          const month = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }) : '';
          return (
            <MobileCardWrapper key={row.id} index={i} accentColor="#22d3ee">
              {/* Header: date block + group name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{
                  width: 52, height: 56, borderRadius: 13,
                  background: 'linear-gradient(135deg, rgba(34,211,238,0.12) 0%, rgba(6,182,212,0.06) 100%)',
                  border: '1px solid rgba(34,211,238,0.15)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}>
                  <div style={{ color: '#22d3ee', fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{dayName}</div>
                  <div style={{ color: '#f1f5f9', fontSize: '1.25rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", lineHeight: 1.1 }}>{dayNum}</div>
                  <div style={{ color: '#64748b', fontSize: '0.5625rem', fontWeight: 600, textTransform: 'uppercase' }}>{month}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif", marginBottom: 5 }}>{row.group?.name || 'Session'}</div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.15)', color: '#22d3ee' }}>
                    {row.start_time?.substring(0,5)} – {row.end_time?.substring(0,5)}
                  </span>
                </div>
              </div>
              {/* Info */}
              {(row.plan?.title || row.location) && (
                <div style={{ background: 'rgba(6,13,31,0.3)', borderRadius: 12, padding: '2px 14px', border: '1px solid rgba(51,65,85,0.1)' }}>
                  {row.plan?.title && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: row.location ? '1px solid rgba(51,65,85,0.1)' : 'none' }}>
                      <span style={{ color: '#64748b', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>
                        Plan
                      </span>
                      <span style={{ color: '#cbd5e1', fontSize: '0.8125rem' }}>{row.plan.title}</span>
                    </div>
                  )}
                  {row.location && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0' }}>
                      <span style={{ color: '#64748b', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        Location
                      </span>
                      <span style={{ color: '#cbd5e1', fontSize: '0.8125rem' }}>{row.location}</span>
                    </div>
                  )}
                </div>
              )}
              <CardActions row={row} onEdit={e} onDelete={d} />
            </MobileCardWrapper>
          );
        }}
      />
      {showModal && (
        <Modal title={editId ? 'Edit Session' : 'New Session'} onClose={() => setShowModal(false)}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}>
          <FormField label="Group"><Select value={form.group_id} onChange={e => setForm({ ...form, group_id: e.target.value })} options={groups.map(g => ({ value: g.id, label: g.name }))} /></FormField>
          <FormField label="Plan (optional)"><Select value={form.plan_id} onChange={e => setForm({ ...form, plan_id: e.target.value })} options={plans.map(p => ({ value: p.id, label: p.title }))} /></FormField>
          <FormField label="Date"><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Start Time"><Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></FormField>
            <FormField label="End Time"><Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></FormField>
          </div>
          <FormField label="Location"><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></FormField>
          <FormField label="Notes"><TextArea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></FormField>
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editId ? 'Update' : 'Create'}</Button>
          </ModalActions>
        </Modal>
      )}
    </div>
  );
}
