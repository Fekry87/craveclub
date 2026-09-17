import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { DataTable, FormPage, FormPageActions, FormField, Input, Select, TextArea, Button, PageHeader, CardActions, getAvatarColor, MobileCardWrapper } from '../../components/CrudTable';
import { Modal, ModalActions } from '../../components/ui/Modal';
import { labelStyle } from '../../components/ui/styles';
import { apiErrorMessage } from '../../lib/apiError';

// Same vocabulary as subscription plans (App\Enums\TrainingType on the backend).
const GROUP_TYPES = ['daily', 'three_days', 'two_days', 'private'];
// How many training days each type must have. Daily and private are free-form:
// "daily" means the club's training days, not literally all seven.
const DAY_COUNTS = { daily: null, three_days: 3, two_days: 2, private: null };
const DAY_ORDER = [0, 1, 2, 3, 4, 5, 6];

const EMPTY_FORM = {
  name: '', description: '', coach_user_id: '',
  group_type: 'three_days', capacity: '', days_of_week: [], start_time: '', end_time: '',
};

const toMinutes = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/* ── Seven toggles, Sunday first (0-6 like the backend) ── */
function DayPicker({ value = [], onChange, t }) {
  const toggle = (d) => onChange(value.includes(d) ? value.filter(x => x !== d) : [...value, d].sort((a, b) => a - b));
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {DAY_ORDER.map(d => {
        const on = value.includes(d);
        return (
          <button key={d} type="button" onClick={() => toggle(d)}
            aria-pressed={on}
            style={{
              minWidth: 52, height: 36, padding: '0 12px', borderRadius: 980, cursor: 'pointer',
              border: `1px solid ${on ? '#0071E3' : '#D2D2D7'}`,
              background: on ? '#0071E3' : '#FFFFFF', color: on ? '#FFFFFF' : '#1D1D1F',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
              transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
            }}>
            {t(`groups.dayNames.${d}`)}
          </button>
        );
      })}
    </div>
  );
}

/* ── Compact "Sun, Tue, Thu · 17:00–18:00" for lists ── */
function scheduleLabel(g, t) {
  if (!g.days_of_week?.length) return t('groups.noSchedule');
  const days = [...g.days_of_week].sort((a, b) => a - b).map(d => t(`groups.dayNames.${d}`)).join(', ');
  const time = g.start_time && g.end_time ? ` · ${g.start_time.slice(0, 5)}–${g.end_time.slice(0, 5)}` : '';
  return `${days}${time}`;
}

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
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get('/club/groups', { params: { search } }).then(r => setGroups(r.data.data || [])).catch(() => {});
    api.get('/club/coaches').then(r => setCoaches(r.data.data || [])).catch(() => {});
    api.get('/club/swimmers').then(r => setSwimmers(r.data.data || [])).catch(() => {});
  };
  useEffect(() => { load(); }, [search]);

  // Mirrors StoreGroupRequest: the day count must match the type, end after start.
  const expectedDays = DAY_COUNTS[form.group_type];
  const dayCountError = expectedDays !== null && form.days_of_week.length !== expectedDays
    ? t('groups.dayCountRule', { type: t(`subscriptions.types.${form.group_type}`), count: expectedDays, selected: form.days_of_week.length })
    : null;
  const timeError = form.start_time && form.end_time && toMinutes(form.end_time) <= toMinutes(form.start_time)
    ? t('groups.endAfterStart')
    : null;
  const scheduleInvalid = Boolean(dayCountError || timeError) || !form.days_of_week.length || !form.start_time || !form.end_time || !form.capacity;

  const handleSave = async () => {
    // Without this, a 422 threw out of the handler: the form never closed, the
    // list never reloaded, and the button looked broken with nothing explaining why.
    if (scheduleInvalid) {
      setSaveError(dayCountError || timeError || t('groups.noSchedule'));
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const payload = { ...form, capacity: Number(form.capacity) };
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
      group_type: g.group_type || 'three_days', capacity: g.capacity ?? '',
      days_of_week: g.days_of_week || [],
      start_time: g.start_time ? g.start_time.slice(0, 5) : '',
      end_time: g.end_time ? g.end_time.slice(0, 5) : '',
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

  const columns = [
    { key: 'name', label: t('groups.name') },
    { key: 'coach', label: t('groups.coach'), render: r => r.coach?.name || <span style={{ color: '#86868B' }}>{t('groups.unassigned')}</span> },
    { key: 'schedule', label: t('groups.schedule'), render: r => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ padding: '3px 9px', borderRadius: 980, background: '#F2F2F7', color: '#515154', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
          {t(`subscriptions.types.${r.group_type || 'daily'}`)}
        </span>
        <span style={{ color: r.days_of_week?.length ? '#1D1D1F' : '#86868B', fontSize: 13 }}>{scheduleLabel(r, t)}</span>
      </span>
    ) },
    { key: 'capacity', label: t('groups.capacity'), render: r => {
      const taken = r.swimmers?.length || 0;
      if (r.capacity == null) return <span style={{ color: '#86868B' }}>{t('groups.unlimited')}</span>;
      const full = taken >= r.capacity;
      return <span style={{ color: full ? '#B12A20' : '#1D1D1F', fontWeight: full ? 600 : 400 }}>{t('groups.spots', { taken, capacity: r.capacity })}{full ? ` · ${t('groups.full')}` : ''}</span>;
    } },
    { key: 'swimmers', label: t('dashboard.swimmers'), render: r => (
      <span style={{ ...labelStyle, color: '#1D1D1F' }}>
        {r.swimmers?.length || 0}
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
        <FormField label={t('groups.description')}><TextArea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></FormField>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 16px' }}>
          <FormField label={t('groups.type')}>
            <Select value={form.group_type} onChange={e => setForm({ ...form, group_type: e.target.value })}
              options={GROUP_TYPES.map(type => ({ value: type, label: t(`subscriptions.types.${type}`) }))} />
          </FormField>
          <FormField label={t('groups.capacity')}>
            <Input type="number" min={1} max={500} value={form.capacity} placeholder={t('groups.capacityHint')}
              onChange={e => setForm({ ...form, capacity: e.target.value })} />
          </FormField>
        </div>

        <FormField label={t('groups.days')}>
          <DayPicker value={form.days_of_week} onChange={days => setForm({ ...form, days_of_week: days })} t={t} />
          <div style={{ ...labelStyle, marginTop: 8, color: dayCountError ? '#B12A20' : '#86868B' }}>
            {dayCountError || (expectedDays === null
              ? t('groups.anyDays', { selected: form.days_of_week.length })
              : t('groups.dayCountRule', { type: t(`subscriptions.types.${form.group_type}`), count: expectedDays, selected: form.days_of_week.length }))}
          </div>
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0 16px' }}>
          <FormField label={t('groups.startTime')}>
            <Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
          </FormField>
          <FormField label={t('groups.endTime')}>
            <Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
          </FormField>
        </div>
        {timeError && <div style={{ ...labelStyle, color: '#B12A20', marginTop: -8, marginBottom: 12 }}>{timeError}</div>}

        {saveError && (
          <div role="alert" style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(255,59,48,0.1)', color: '#B12A20',
            fontSize: 13, lineHeight: 1.45,
          }}>{saveError}</div>
        )}

        <FormPageActions>
          <Button variant="secondary" onClick={closeForm}>{t('actions.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? t('loading.saving') : (editId ? t('actions.update') : t('actions.create'))}</Button>
        </FormPageActions>
      </FormPage>
    );
  }

  return (
    <div>
      <PageHeader title={t('groups.title')} search={search} onSearch={setSearch} searchPlaceholder={t('groups.searchPlaceholder')}>
        <Button onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); setSaveError(null); setShowModal(true); }}>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderTop: '1px solid #F2F2F7' }}>
                  <span style={{ ...labelStyle }}>{t('groups.schedule')}</span>
                  <span style={{ color: '#1D1D1F', fontSize: 13, textAlign: 'end' }}>{t(`subscriptions.types.${row.group_type || 'daily'}`)} · {scheduleLabel(row, t)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderTop: '1px solid #F2F2F7' }}>
                  <span style={{ ...labelStyle }}>{t('groups.capacity')}</span>
                  <span style={{ color: '#1D1D1F', fontSize: 13, textAlign: 'end' }}>{row.capacity == null ? t('groups.unlimited') : t('groups.spots', { taken: swimmerCount, capacity: row.capacity })}</span>
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
