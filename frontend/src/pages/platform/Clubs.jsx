import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { DataTable, Modal, ModalActions, FormField, Input, TextArea, Button, PageHeader, CardActions, getAvatarColor, MobileCardWrapper } from '../../components/CrudTable';

export default function Clubs() {
  const { t } = useTranslation();
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', about: '', contact_email: '', contact_phone: '', theme_color: '#0ea5e9', manager_name: '', manager_email: '', manager_password: '' });
  const [editId, setEditId] = useState(null);

  const load = () => api.get('/platform/clubs', { params: { search } }).then(r => setClubs(r.data.data || [])).catch(() => {});
  useEffect(() => { load(); }, [search]);

  const handleSave = async () => {
    if (editId) {
      await api.put(`/platform/clubs/${editId}`, form);
    } else {
      await api.post('/platform/clubs', form);
    }
    setShowModal(false);
    setEditId(null);
    setForm({ name: '', slug: '', about: '', contact_email: '', contact_phone: '', theme_color: '#0ea5e9', manager_name: '', manager_email: '', manager_password: '' });
    load();
  };

  const handleEdit = (club) => {
    setEditId(club.id);
    setForm({ name: club.name, slug: club.slug, about: club.about || '', contact_email: club.contact_email || '', contact_phone: club.contact_phone || '', theme_color: club.theme_color || '#0ea5e9', manager_name: '', manager_email: '', manager_password: '' });
    setShowModal(true);
  };

  const handleDelete = async (club) => {
    if (confirm('Delete this club?')) {
      await api.delete(`/platform/clubs/${club.id}`);
      load();
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug', render: r => (
      <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'rgba(51,65,85,0.3)', color: '#94a3b8', fontFamily: "'DM Sans', monospace" }}>{r.slug}</span>
    ) },
    { key: 'contact_email', label: 'Email' },
    { key: 'users_count', label: 'Users', render: r => (
      <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'rgba(34,211,238,0.08)', color: '#22d3ee' }}>
        {r.users_count || 0}
      </span>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Clubs" search={search} onSearch={setSearch} searchPlaceholder="Search clubs...">
        <Button onClick={() => { setEditId(null); setForm({ name: '', slug: '', about: '', contact_email: '', contact_phone: '', theme_color: '#0ea5e9', manager_name: '', manager_email: '', manager_password: '' }); setShowModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          New Club
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={clubs} onEdit={handleEdit} onDelete={handleDelete}
        mobileCard={(row, i, { onEdit: e, onDelete: d }) => {
          const ac = getAvatarColor(row.name);
          const initials = row.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'C';
          return (
            <MobileCardWrapper key={row.id} index={i} accentColor={ac.accent}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 13, background: ac.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Outfit', sans-serif", fontSize: '0.9375rem', fontWeight: 700,
                  color: ac.text, flexShrink: 0, boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
                }}>{initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{row.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.6875rem', fontWeight: 600, background: 'rgba(51,65,85,0.25)', border: '1px solid rgba(51,65,85,0.35)', color: '#94a3b8', fontFamily: "'DM Sans', monospace" }}>{row.slug}</span>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.6875rem', fontWeight: 600, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.15)', color: '#22d3ee' }}>
                      {row.users_count || 0} users
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ background: 'rgba(6,13,31,0.3)', borderRadius: 12, padding: '2px 14px', border: '1px solid rgba(51,65,85,0.1)' }}>
                {row.contact_email && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: row.contact_phone ? '1px solid rgba(51,65,85,0.1)' : 'none' }}>
                    <span style={{ color: '#64748b', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>
                      Email
                    </span>
                    <span style={{ color: '#cbd5e1', fontSize: '0.8125rem' }}>{row.contact_email}</span>
                  </div>
                )}
                {row.contact_phone && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0' }}>
                    <span style={{ color: '#64748b', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>
                      Phone
                    </span>
                    <span style={{ color: '#cbd5e1', fontSize: '0.8125rem' }}>{row.contact_phone}</span>
                  </div>
                )}
                {!row.contact_email && !row.contact_phone && (
                  <div style={{ padding: '9px 0', color: '#475569', fontSize: '0.8125rem', textAlign: 'center', fontStyle: 'italic' }}>No contact info</div>
                )}
              </div>
              {row.theme_color && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 5, background: row.theme_color, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, boxShadow: `0 0 6px ${row.theme_color}40` }} />
                  <span style={{ color: '#64748b', fontSize: '0.75rem', fontFamily: "'DM Sans', monospace" }}>{row.theme_color}</span>
                </div>
              )}
              <CardActions row={row} onEdit={e} onDelete={d} />
            </MobileCardWrapper>
          );
        }}
      />
      {showModal && (
        <Modal title={editId ? 'Edit Club' : 'New Club'} onClose={() => setShowModal(false)}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}>
          <FormField label="Club Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Slug"><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></FormField>
          <FormField label="About"><TextArea value={form.about} onChange={e => setForm({ ...form, about: e.target.value })} /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Contact Email"><Input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></FormField>
            <FormField label="Contact Phone"><Input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} /></FormField>
          </div>
          <FormField label="Theme Color">
            {/* Integrated 3-zone color picker: swatch | hex input | preview */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 0,
              background: 'rgba(6,13,31,0.6)',
              border: '1px solid rgba(51,65,85,0.5)',
              borderRadius: 12, overflow: 'hidden',
              transition: 'border-color 0.25s ease',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(51,65,85,0.7)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(51,65,85,0.5)'}
            >
              {/* Color swatch with hidden native picker */}
              <div style={{
                width: 48, height: 44, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRight: '1px solid rgba(51,65,85,0.4)',
                position: 'relative',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: form.theme_color,
                  boxShadow: `0 0 12px ${form.theme_color}40`,
                  border: '2px solid rgba(255,255,255,0.15)',
                }} />
                <input type="color" value={form.theme_color} onChange={e => setForm({ ...form, theme_color: e.target.value })}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
              </div>
              {/* Hex text input */}
              <input type="text" value={form.theme_color} onChange={e => setForm({ ...form, theme_color: e.target.value })}
                placeholder="#0ea5e9"
                style={{
                  flex: 1, minWidth: 0, padding: '0 14px', height: 44,
                  background: 'transparent', border: 'none',
                  color: '#e2e8f0', fontSize: '0.875rem',
                  fontFamily: "'DM Mono', 'DM Sans', monospace",
                  letterSpacing: '0.04em', outline: 'none',
                }}
              />
              {/* Live preview circle */}
              <div style={{
                width: 48, height: 44, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderLeft: '1px solid rgba(51,65,85,0.4)',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: form.theme_color,
                  boxShadow: `0 0 16px ${form.theme_color}50`,
                  border: '2px solid rgba(255,255,255,0.12)',
                }} />
              </div>
            </div>
            {/* Preset color swatches */}
            <div style={{ marginTop: 10 }}>
              <div style={{ color: '#526280', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', marginBottom: 8, textTransform: 'uppercase' }}>Quick presets</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['#0ea5e9','#22d3ee','#2dd4bf','#10b981','#a78bfa','#8b5cf6','#f472b6','#f43f5e','#fb923c','#fbbf24','#38bdf8','#6366f1'].map(color => (
                  <button key={color}
                    onClick={() => setForm({ ...form, theme_color: color })}
                    onMouseEnter={e => { if (form.theme_color !== color) { e.currentTarget.style.transform = 'scale(1.18)'; e.currentTarget.style.boxShadow = `0 0 18px ${color}55, 0 4px 12px ${color}30`; }}}
                    onMouseLeave={e => { if (form.theme_color !== color) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}}
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: color,
                      border: form.theme_color === color ? '2.5px solid #fff' : '2px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: form.theme_color === color ? `0 0 16px ${color}66, 0 0 30px ${color}25` : 'none',
                      transform: form.theme_color === color ? 'scale(1.1)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>
          </FormField>
          {!editId && (
            <div style={{
              marginTop: 8, padding: '18px 18px 6px', borderRadius: 14,
              background: 'rgba(34,211,238,0.03)', border: '1px solid rgba(34,211,238,0.08)',
            }}>
              <h4 style={{
                color: '#94a3b8', margin: '0 0 14px', fontSize: 11, fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Club Manager Account
              </h4>
              <FormField label="Manager Name"><Input value={form.manager_name} onChange={e => setForm({ ...form, manager_name: e.target.value })} /></FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <FormField label="Manager Email"><Input type="email" value={form.manager_email} onChange={e => setForm({ ...form, manager_email: e.target.value })} /></FormField>
                <FormField label="Manager Password"><Input type="password" value={form.manager_password} onChange={e => setForm({ ...form, manager_password: e.target.value })} /></FormField>
              </div>
            </div>
          )}
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowModal(false)}>{t('actions.cancel')}</Button>
            <Button onClick={handleSave}>{editId ? t('actions.update') : t('actions.create')}</Button>
          </ModalActions>
        </Modal>
      )}
    </div>
  );
}
