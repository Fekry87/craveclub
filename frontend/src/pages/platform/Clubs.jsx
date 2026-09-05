import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { DataTable, Modal, ModalActions, FormField, Input, TextArea, Button, PageHeader, CardActions, getAvatarColor, MobileCardWrapper } from '../../components/CrudTable';
import { Badge } from '../../components/ui/Badge';

const labelStyle = {
  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, color: '#6E6E73',
};

const slugPill = {
  display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 980,
  background: '#F2F2F7', color: '#515154',
  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, lineHeight: '16px',
  whiteSpace: 'nowrap',
};

const colorPresets = ['#1D1D1F', '#0071E3', '#515154', '#6E6E73', '#86868B', '#AEAEB2', '#F2F2F7', '#34C759', '#FF9500', '#FF3B30'];

export default function Clubs() {
  const { t } = useTranslation();
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', about: '', contact_email: '', contact_phone: '', theme_color: '#0071E3', manager_name: '', manager_email: '', manager_password: '' });
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
    setForm({ name: '', slug: '', about: '', contact_email: '', contact_phone: '', theme_color: '#0071E3', manager_name: '', manager_email: '', manager_password: '' });
    load();
  };

  const handleEdit = (club) => {
    setEditId(club.id);
    setForm({ name: club.name, slug: club.slug, about: club.about || '', contact_email: club.contact_email || '', contact_phone: club.contact_phone || '', theme_color: club.theme_color || '#0071E3', manager_name: '', manager_email: '', manager_password: '' });
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
    { key: 'slug', label: 'Slug', render: r => <span style={slugPill}>{r.slug}</span> },
    { key: 'contact_email', label: 'Email' },
    { key: 'users_count', label: 'Users', render: r => <Badge variant="info" label={String(r.users_count || 0)} /> },
  ];

  return (
    <div>
      <PageHeader title="Clubs" search={search} onSearch={setSearch} searchPlaceholder="Search clubs...">
        <Button onClick={() => { setEditId(null); setForm({ name: '', slug: '', about: '', contact_email: '', contact_phone: '', theme_color: '#0071E3', manager_name: '', manager_email: '', manager_password: '' }); setShowModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          New Club
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={clubs} onEdit={handleEdit} onDelete={handleDelete}
        mobileCard={(row, i, { onEdit: e, onDelete: d }) => {
          const ac = getAvatarColor(row.name);
          const initials = row.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'C';
          return (
            <MobileCardWrapper key={row.id} index={i} accentColor={ac.accent}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: '50%', background: ac.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600,
                  color: ac.text, flexShrink: 0,
                }}>{initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: '#1D1D1F', fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{row.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={slugPill}>{row.slug}</span>
                    <Badge variant="info" label={`${row.users_count || 0} users`} />
                  </div>
                </div>
              </div>
              <div style={{ background: '#F2F2F7', borderRadius: 12, padding: '2px 14px' }}>
                {row.contact_email && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: row.contact_phone ? '1px solid #E5E5EA' : 'none' }}>
                    <span style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#86868B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>
                      Email
                    </span>
                    <span style={{ color: '#1D1D1F', fontSize: 13, textAlign: 'end', wordBreak: 'break-all' }}>{row.contact_email}</span>
                  </div>
                )}
                {row.contact_phone && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 0' }}>
                    <span style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#86868B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>
                      Phone
                    </span>
                    <span style={{ color: '#1D1D1F', fontSize: 13, textAlign: 'end' }}>{row.contact_phone}</span>
                  </div>
                )}
                {!row.contact_email && !row.contact_phone && (
                  <div style={{ ...labelStyle, padding: '10px 0', color: '#86868B', textAlign: 'center' }}>No contact info</div>
                )}
              </div>
              {row.theme_color && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: row.theme_color, border: '1px solid #E5E5EA', flexShrink: 0 }} />
                  <span style={{ ...labelStyle, color: '#515154' }}>{row.theme_color}</span>
                </div>
              )}
              <CardActions row={row} onEdit={e} onDelete={d} />
            </MobileCardWrapper>
          );
        }}
      />
      {showModal && (
        <Modal title={editId ? 'Edit Club' : 'New Club'} onClose={() => setShowModal(false)}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}>
          <FormField label="Club Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Slug"><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></FormField>
          <FormField label="About"><TextArea value={form.about} onChange={e => setForm({ ...form, about: e.target.value })} /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Contact Email"><Input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></FormField>
            <FormField label="Contact Phone"><Input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} /></FormField>
          </div>
          <FormField label="Theme Color">
            <div style={{ borderRadius: 12, display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #D2D2D7', overflow: 'hidden' }}>
              <div style={{
                width: 46, height: 42, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderInlineEnd: '1px solid #E5E5EA', position: 'relative',
              }}>
                <div style={{ borderRadius: '50%', width: 24, height: 24, background: form.theme_color, border: '1px solid #E5E5EA' }} />
                <input type="color" value={form.theme_color} onChange={e => setForm({ ...form, theme_color: e.target.value })}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
              </div>
              <input type="text" value={form.theme_color} onChange={e => setForm({ ...form, theme_color: e.target.value })}
                placeholder="#0071E3"
                style={{
                  flex: 1, minWidth: 0, padding: '0 12px', height: 42,
                  background: 'transparent', border: 'none',
                  color: '#1D1D1F', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
                }}
              />
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ ...labelStyle, marginBottom: 8 }}>Quick presets</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {colorPresets.map(color => (
                  <button key={color} type="button"
                    onClick={() => setForm({ ...form, theme_color: color })}
                    style={{
                      borderRadius: '50%',
                      width: 26, height: 26, background: color, padding: 0, cursor: 'pointer',
                      border: form.theme_color === color ? '2px solid #0071E3' : '1px solid #E5E5EA',
                      boxShadow: form.theme_color === color ? '0 0 0 3px rgba(0,113,227,0.15)' : 'none',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    }}
                  />
                ))}
              </div>
            </div>
          </FormField>
          {!editId && (
            <div style={{
              marginTop: 12, padding: '18px 18px 6px', background: '#F2F2F7',
              border: '1px solid #E5E5EA', borderRadius: 16,
            }}>
              <h4 style={{
                margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid #E5E5EA',
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600,
                letterSpacing: '-0.01em', color: '#1D1D1F',
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 26, height: 26, borderRadius: 8, background: 'rgba(0,113,227,0.1)', color: '#0071E3', flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </span>
                Club manager account
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
