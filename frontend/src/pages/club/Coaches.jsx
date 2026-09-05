import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { FormPage, FormPageActions, FormField, Input, TextArea, Button, PageHeader } from '../../components/CrudTable';
import { CardActions, CardInfoRow, getAvatarColor } from '../../components/ui/Cards';
import { labelStyle } from '../../components/ui/styles';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.charAt(0).toUpperCase();
}

function CoachCard({ coach, onEdit, onDelete, index, t }) {
  const name = coach.user?.name || 'Unknown';
  const email = coach.user?.email || '';
  const color = getAvatarColor(name);
  const initials = getInitials(name);

  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        background: '#FFFFFF',
        padding: '20px 22px',
        border: '1px solid #E5E5EA',
        transition: 'border-color 0.15s ease',
        position: 'relative',
        animation: `fadeInUp 0.3s ease-out ${0.04 + index * 0.04}s both`,
      }}
    >
      {/* Avatar tile + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ borderRadius: 14,
          width: 56, height: 56, background: color.bg, color: color.text,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 600,
          fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
          flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{
            margin: 0, color: '#1D1D1F', fontSize: 17, fontWeight: 500,
            fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{name}</h3>
          {coach.specialization && (
            <div style={{ ...labelStyle, marginTop: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: '#0071E3', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{coach.specialization}</span>
            </div>
          )}
        </div>
        </div>

      {/* Contact info */}
      <div style={{ marginTop: 16, borderTop: '1px solid #E5E5EA' }}>
        <CardInfoRow
          label={t('coaches.email')}
          value={email ? <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{email}</span> : ''}
        />
        <CardInfoRow label={t('coaches.phone')} value={coach.phone} />
      </div>

      <CardActions row={coach} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

export default function Coaches() {
  const { t } = useTranslation();
  const [coaches, setCoaches] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', bio: '', specialization: '', phone: '' });

  const load = () => api.get('/club/coaches', { params: { search } })
    .then(r => setCoaches(r.data.data || []))
    .catch(err => console.error('[Coaches] Load failed:', err.message));
  useEffect(() => { load(); }, [search]);

  const handleSave = async () => {
    if (editId) await api.put(`/club/coaches/${editId}`, form);
    else await api.post('/club/coaches', form);
    setShowModal(false); setEditId(null); load();
  };

  const handleEdit = (c) => {
    setEditId(c.id);
    setForm({ name: c.user?.name || '', email: '', password: '', bio: c.bio || '', specialization: c.specialization || '', phone: c.phone || '' });
    setShowModal(true);
  };
  const handleDelete = async (c) => { if (confirm('Delete?')) { await api.delete(`/club/coaches/${c.id}`); load(); } };

  const closeForm = () => { setShowModal(false); setEditId(null); };

  if (showModal) {
    return (
      <FormPage title={editId ? t('coaches.editCoach') : t('coaches.newCoach')} onBack={closeForm}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}>
        <FormField label={t('coaches.name')}><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></FormField>
        {!editId && <>
          <FormField label={t('coaches.email')}><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></FormField>
          <FormField label={t('coaches.password')}><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></FormField>
        </>}
        <FormField label={t('coaches.specialization')}><Input value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} /></FormField>
        <FormField label={t('coaches.phone')}><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></FormField>
        <FormField label={t('coaches.bio')}><TextArea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} /></FormField>
        <FormPageActions>
          <Button variant="secondary" onClick={closeForm}>{t('actions.cancel')}</Button>
          <Button onClick={handleSave}>{editId ? t('actions.update') : t('actions.create')}</Button>
        </FormPageActions>
      </FormPage>
    );
  }

  return (
    <div>
      <PageHeader title={t('coaches.title')} search={search} onSearch={setSearch} searchPlaceholder={t('coaches.searchPlaceholder')}>
        <Button onClick={() => {
          setEditId(null);
          setForm({ name: '', email: '', password: '', bio: '', specialization: '', phone: '' });
          setShowModal(true);
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t('coaches.newCoach')}
        </Button>
      </PageHeader>

      {/* Coach count badge */}
      {coaches.length > 0 && (
        <div style={{
          ...labelStyle, marginBottom: 18,
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fadeIn 0.25s ease-out',
        }}>
          <span>coach{coaches.length !== 1 ? 'es' : ''}</span>
        </div>
      )}

      {/* Card grid */}
      {coaches.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: 16,
        }}>
          {coaches.map((coach, i) => (
            <CoachCard
              key={coach.id}
              coach={coach}
              index={i}
              onEdit={handleEdit}
              onDelete={handleDelete}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div style={{ borderRadius: 16,
          textAlign: 'center', padding: '56px 32px',
          background: '#FFFFFF',
          border: '1px dashed #AEAEB2',
          animation: 'fadeIn 0.25s ease-out',
        }}>
          <div style={{ borderRadius: 14,
            width: 56, height: 56, border: '1px solid #E5E5EA',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 18,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.5" strokeLinecap="round">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
            letterSpacing: '-0.02em', color: '#1D1D1F', marginBottom: 6,
          }}>{t('coaches.noCoaches')}</div>
          <div style={{ color: '#6E6E73', fontSize: 13 }}>{t('coaches.noCoachesHint')}</div>
        </div>
      )}
    </div>
  );
}
