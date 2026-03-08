import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Modal, ModalActions, FormField, Input, TextArea, Button, PageHeader } from '../../components/CrudTable';

const avatarColors = [
  { bg: 'linear-gradient(135deg, #06b6d4, #22d3ee)', text: '#060d1f' },
  { bg: 'linear-gradient(135deg, #2dd4bf, #14b8a6)', text: '#060d1f' },
  { bg: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', text: '#060d1f' },
  { bg: 'linear-gradient(135deg, #818cf8, #6366f1)', text: '#ffffff' },
  { bg: 'linear-gradient(135deg, #fb7185, #f43f5e)', text: '#ffffff' },
  { bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)', text: '#060d1f' },
  { bg: 'linear-gradient(135deg, #a78bfa, #8b5cf6)', text: '#ffffff' },
  { bg: 'linear-gradient(135deg, #34d399, #10b981)', text: '#060d1f' },
];

function getAvatarColor(name) {
  let hash = 0;
  const str = name || '';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.charAt(0).toUpperCase();
}

function CoachCard({ coach, onEdit, onDelete, index }) {
  const name = coach.user?.name || 'Unknown';
  const email = coach.user?.email || '';
  const color = getAvatarColor(name);
  const initials = getInitials(name);

  return (
    <div
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.2)';
        e.currentTarget.style.transform = 'translateY(-6px) scale(1.01)';
        e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.3), 0 0 30px rgba(34,211,238,0.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.06)';
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)';
      }}
      style={{
        background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
        borderRadius: 22, padding: 0,
        border: '1px solid rgba(34,211,238,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)',
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden', position: 'relative',
        animation: `fadeInUp 0.4s ease-out ${0.05 + index * 0.05}s both`,
      }}
    >
      {/* Card header with gradient accent */}
      <div style={{
        height: 85,
        background: `linear-gradient(135deg, rgba(13,31,60,0.8) 0%, rgba(34,211,238,0.08) 100%)`,
        position: 'relative',
      }}>
        {/* Decorative wave pattern */}
        <svg viewBox="0 0 400 80" preserveAspectRatio="none" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, width: '100%', height: 35 }}>
          <path d="M0,40 C100,20 150,60 200,40 C250,20 300,50 400,35 L400,80 L0,80 Z" fill="rgba(10,22,40,0.6)" />
        </svg>
        {/* Subtle pattern */}
        <div style={{
          position: 'absolute', top: 10, right: 20,
          width: 50, height: 50, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', top: 25, right: 60,
          width: 25, height: 25, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 70%)',
        }} />
      </div>

      {/* Avatar - positioned half in header, half below */}
      <div style={{
        display: 'flex', justifyContent: 'center', marginTop: -44,
        position: 'relative', zIndex: 2,
      }}>
        <div style={{
          width: 84, height: 84, borderRadius: 22,
          background: color.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, fontWeight: 700,
          fontFamily: "'Outfit', sans-serif",
          color: color.text,
          border: '3px solid rgba(10,22,40,0.8)',
          boxShadow: '0 6px 24px rgba(0,0,0,0.35), 0 0 40px rgba(34,211,238,0.05)',
          letterSpacing: '-0.01em',
          transition: 'transform 0.3s ease',
        }}>
          {initials}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 24px 22px', textAlign: 'center' }}>
        <h3 style={{
          margin: '0 0 2px', color: '#f1f5f9', fontSize: 17, fontWeight: 600,
          fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em',
        }}>{name}</h3>

        {coach.specialization && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 12px', borderRadius: 8,
            background: 'rgba(34,211,238,0.08)',
            border: '1px solid rgba(34,211,238,0.1)',
            color: '#22d3ee', fontSize: 12, fontWeight: 500,
            marginTop: 8,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            {coach.specialization}
          </div>
        )}

        {/* Contact info */}
        <div style={{
          marginTop: 18, padding: '14px 0 0',
          borderTop: '1px solid rgba(51,65,85,0.3)',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {email && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: '#94a3b8', fontSize: 13,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</span>
            </div>
          )}
          {coach.phone && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: '#94a3b8', fontSize: 13,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
              {coach.phone}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex', gap: 8, marginTop: 18,
          paddingTop: 16,
          borderTop: '1px solid rgba(51,65,85,0.15)',
        }}>
          <button
            onClick={() => onEdit(coach)}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.15)'; e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)'; e.currentTarget.style.color = '#22d3ee'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.2)'; e.currentTarget.style.borderColor = 'rgba(51,65,85,0.35)'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'translateY(0)'; }}
            style={{
              flex: 1, padding: '9px 14px', height: 38,
              background: 'rgba(51,65,85,0.2)',
              border: '1px solid rgba(51,65,85,0.35)',
              borderRadius: 10, cursor: 'pointer',
              color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            onClick={() => onDelete(coach)}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.15)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'; e.currentTarget.style.color = '#fda4af'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.06)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.15)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.transform = 'translateY(0)'; }}
            style={{
              flex: 1, padding: '9px 14px', height: 38,
              background: 'rgba(244,63,94,0.06)',
              border: '1px solid rgba(244,63,94,0.15)',
              borderRadius: 10, cursor: 'pointer',
              color: '#f87171', fontSize: '0.8125rem', fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Coaches() {
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

  return (
    <div>
      <PageHeader title="Coaches" search={search} onSearch={setSearch} searchPlaceholder="Search coaches...">
        <Button onClick={() => {
          setEditId(null);
          setForm({ name: '', email: '', password: '', bio: '', specialization: '', phone: '' });
          setShowModal(true);
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Coach
        </Button>
      </PageHeader>

      {/* Coach count badge */}
      {coaches.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{
            padding: '4px 12px', borderRadius: 8,
            background: 'rgba(34,211,238,0.06)',
            border: '1px solid rgba(34,211,238,0.08)',
            color: '#64748b', fontSize: 13, fontWeight: 500,
          }}>
            {coaches.length} coach{coaches.length !== 1 ? 'es' : ''}
          </div>
        </div>
      )}

      {/* Card grid */}
      {coaches.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: 22,
        }}>
          {coaches.map((coach, i) => (
            <CoachCard
              key={coach.id}
              coach={coach}
              index={i}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)',
          borderRadius: 20,
          border: '1px solid rgba(34,211,238,0.06)',
          animation: 'fadeIn 0.4s ease-out',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'rgba(34,211,238,0.08)',
            border: '1px solid rgba(34,211,238,0.1)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div style={{ color: '#64748b', fontSize: 15, fontWeight: 500, marginBottom: 4 }}>No coaches found</div>
          <div style={{ color: '#475569', fontSize: 13 }}>Add your first coach to get started</div>
        </div>
      )}

      {showModal && (
        <Modal title={editId ? 'Edit Coach' : 'New Coach'} onClose={() => setShowModal(false)}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}>
          <FormField label="Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></FormField>
          {!editId && <>
            <FormField label="Email"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></FormField>
            <FormField label="Password"><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></FormField>
          </>}
          <FormField label="Specialization"><Input value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} /></FormField>
          <FormField label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></FormField>
          <FormField label="Bio"><TextArea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} /></FormField>
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editId ? 'Update' : 'Create'}</Button>
          </ModalActions>
        </Modal>
      )}
    </div>
  );
}
