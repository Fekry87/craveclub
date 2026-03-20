import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { PageHeader, Button, FormPage, FormPageActions, FormField, Input, TextArea, useIsMobile, getAvatarColor } from '../../components/CrudTable';
import { useTranslation } from 'react-i18next';

/* ───── Swimmer Chip (for member display & picker) ───── */
function SwimmerChip({ swimmer, removable, onRemove, small }) {
  const name = `${swimmer.first_name} ${swimmer.last_name}`;
  const ac = getAvatarColor(name);
  const initials = `${swimmer.first_name?.[0] || ''}${swimmer.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div
      onMouseEnter={e => { if (removable) { e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'; } }}
      onMouseLeave={e => { if (removable) { e.currentTarget.style.borderColor = 'rgba(51,65,85,0.2)'; } }}
      style={{
        display: 'flex', alignItems: 'center', gap: small ? 6 : 7,
        padding: small ? '4px 8px 4px 4px' : '5px 10px 5px 5px',
        borderRadius: small ? 8 : 10,
        background: 'rgba(6,13,31,0.4)', border: '1px solid rgba(51,65,85,0.2)',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{
        width: small ? 22 : 26, height: small ? 22 : 26, borderRadius: small ? 6 : 8,
        background: ac.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: small ? 8 : 10, fontWeight: 700, color: ac.text,
        fontFamily: "'Outfit', sans-serif",
      }}>{initials}</div>
      <span style={{ color: '#e2e8f0', fontSize: small ? 11 : 13, fontWeight: 500 }}>{name}</span>
      {removable && (
        <button onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{
            width: 18, height: 18, borderRadius: 5, border: 'none',
            background: 'rgba(244,63,94,0.15)', color: '#f87171',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', marginLeft: 2, padding: 0,
          }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}

/* ───── Group Card ───── */
function GroupCard({ group, index, onEdit, onDelete, navigate }) {
  const swimmerCount = group.swimmers_count || group.swimmers?.length || 0;

  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(45,212,191,0.2)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25), 0 0 30px rgba(45,212,191,0.05)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)'; }}
      style={{
        background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
        borderRadius: 20, border: '1px solid rgba(34,211,238,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)',
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden', position: 'relative',
        animation: `fadeInUp 0.4s ease-out ${0.05 + index * 0.05}s both`,
      }}
    >
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(45,212,191,0.3), transparent)' }} />

      <div style={{ padding: '24px 24px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: 18, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{group.name}</h3>
          <div style={{
            padding: '5px 12px', borderRadius: 10,
            background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.15)',
            color: '#2dd4bf', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            {swimmerCount}
          </div>
        </div>

        {group.description && <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 16px', lineHeight: 1.5 }}>{group.description}</p>}

        {/* Swimmers list */}
        {group.swimmers?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {group.swimmers.map(s => (
              <div key={s.id}
                onClick={() => navigate(`/coach/swimmers/${s.id}`)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(45,212,191,0.2)'; e.currentTarget.style.cursor = 'pointer'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(51,65,85,0.2)'; }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '5px 10px 5px 5px', borderRadius: 10,
                  background: 'rgba(6,13,31,0.4)', border: '1px solid rgba(51,65,85,0.2)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: getAvatarColor(`${s.first_name} ${s.last_name}`).bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: getAvatarColor(`${s.first_name} ${s.last_name}`).text,
                  fontFamily: "'Outfit', sans-serif",
                }}>{`${s.first_name?.[0] || ''}${s.last_name?.[0] || ''}`.toUpperCase()}</div>
                <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>{s.first_name} {s.last_name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Plans */}
        {group.plans?.length > 0 && (
          <div style={{ paddingTop: 14, borderTop: '1px solid rgba(51,65,85,0.15)', marginBottom: 16 }}>
            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Assigned Plans</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {group.plans.map(p => (
                <span key={p.id} style={{
                  padding: '4px 12px', borderRadius: 8,
                  background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.1)',
                  color: '#22d3ee', fontSize: 12, fontWeight: 500,
                }}>{p.title}</span>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{
          display: 'flex', gap: 8, paddingTop: 14,
          borderTop: '1px solid rgba(51,65,85,0.15)',
        }}>
          <button
            onClick={() => onEdit(group)}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,212,191,0.15)'; e.currentTarget.style.borderColor = 'rgba(45,212,191,0.3)'; e.currentTarget.style.color = '#2dd4bf'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.2)'; e.currentTarget.style.borderColor = 'rgba(51,65,85,0.35)'; e.currentTarget.style.color = '#94a3b8'; }}
            style={{
              flex: 1, padding: '9px 14px', height: 38,
              background: 'rgba(51,65,85,0.2)', border: '1px solid rgba(51,65,85,0.35)',
              borderRadius: 10, cursor: 'pointer',
              color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t('actions.edit')}
          </button>
          <button
            onClick={() => onDelete(group)}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.15)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'; e.currentTarget.style.color = '#fda4af'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.06)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.15)'; e.currentTarget.style.color = '#f87171'; }}
            style={{
              flex: 1, padding: '9px 14px', height: 38,
              background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)',
              borderRadius: 10, cursor: 'pointer',
              color: '#f87171', fontSize: '0.8125rem', fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            {t('actions.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───── Main Page ───── */
export default function CoachGroups() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [clubSwimmers, setClubSwimmers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const load = () => {
    api.get('/coach/groups').then(r => setGroups(r.data?.data || r.data || [])).catch(() => {});
  };

  useEffect(() => {
    load();
    // Load all club swimmers for the picker
    api.get('/coach/swimmers').then(r => setClubSwimmers(r.data)).catch(() => {});
  }, []);

  const closeForm = () => { setShowModal(false); setEditGroup(null); setForm({ name: '', description: '' }); setSelectedIds([]); setMemberSearch(''); };

  const handleEdit = (group) => {
    setEditGroup(group);
    setForm({ name: group.name, description: group.description || '' });
    setSelectedIds(group.swimmers?.map(s => s.id) || []);
    setMemberSearch('');
    setShowModal(true);
  };

  const openNewForm = () => {
    setEditGroup(null);
    setForm({ name: '', description: '' });
    setSelectedIds([]);
    setMemberSearch('');
    setShowModal(true);
  };

  const handleSaveGroup = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, swimmer_ids: selectedIds };
      if (editGroup) {
        await api.put(`/coach/groups/${editGroup.id}`, payload);
      } else {
        await api.post('/coach/groups', payload);
      }
      load();
      setToast(editGroup ? 'Group updated!' : 'Group created!');
      setTimeout(() => setToast(null), 3000);
      closeForm();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleSwimmer = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleDelete = async (group) => {
    if (!confirm(`Delete group "${group.name}"? This will remove all swimmer memberships from this group.`)) return;
    try {
      await api.delete(`/coach/groups/${group.id}`);
      load();
      setToast('Group deleted');
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast('Failed to delete group');
      setTimeout(() => setToast(null), 3000);
    }
  };

  /* ── Full-page form for Create / Edit ── */
  if (showModal) {
    const filteredSwimmers = clubSwimmers.filter(s => {
      const name = `${s.first_name} ${s.last_name}`.toLowerCase();
      return name.includes(memberSearch.toLowerCase());
    });
    const selectedSwimmers = clubSwimmers.filter(s => selectedIds.includes(s.id));
    const availableSwimmers = filteredSwimmers.filter(s => !selectedIds.includes(s.id));

    return (
      <FormPage
        title={editGroup ? t('groups.editGroup') : t('groups.newGroup')}
        onBack={closeForm}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
      >
        <FormField label="Group Name">
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sharks Elite" />
        </FormField>
        <FormField label="Description (optional)">
          <TextArea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe this group..." rows={2} />
        </FormField>

        {/* Swimmer picker */}
        <div style={{ marginTop: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
          }}>
            <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Members ({selectedIds.length})
            </label>
          </div>

          {/* Selected swimmers */}
          {selectedSwimmers.length > 0 && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12,
              padding: '12px', borderRadius: 12,
              background: 'rgba(45,212,191,0.04)', border: '1px solid rgba(45,212,191,0.08)',
            }}>
              {selectedSwimmers.map(s => (
                <SwimmerChip key={s.id} swimmer={s} removable small onRemove={() => toggleSwimmer(s.id)} />
              ))}
            </div>
          )}

          {/* Search available swimmers */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 10,
            background: 'rgba(6,13,31,0.4)', border: '1px solid rgba(51,65,85,0.3)',
            marginBottom: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
              placeholder="Search swimmers to add..."
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: '#e2e8f0', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>

          {/* Available swimmers list */}
          <div style={{
            maxHeight: 300, overflowY: 'auto', borderRadius: 12,
            background: 'rgba(6,13,31,0.3)', border: '1px solid rgba(51,65,85,0.15)',
          }}>
            {availableSwimmers.length > 0 ? availableSwimmers.map((s, i) => {
              const ac = getAvatarColor(`${s.first_name} ${s.last_name}`);
              const initials = `${s.first_name?.[0] || ''}${s.last_name?.[0] || ''}`.toUpperCase();
              return (
                <div key={s.id}
                  onClick={() => toggleSwimmer(s.id)}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,212,191,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', cursor: 'pointer',
                    borderBottom: i < availableSwimmers.length - 1 ? '1px solid rgba(51,65,85,0.1)' : 'none',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: ac.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: ac.text,
                    fontFamily: "'Outfit', sans-serif",
                  }}>{initials}</div>
                  <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500, flex: 1 }}>{s.first_name} {s.last_name}</span>
                  {s.level && (
                    <span style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                      background: s.level === 'Advanced' ? 'rgba(45,212,191,0.1)' : s.level === 'Intermediate' ? 'rgba(56,189,248,0.1)' : 'rgba(251,191,36,0.1)',
                      color: s.level === 'Advanced' ? '#2dd4bf' : s.level === 'Intermediate' ? '#38bdf8' : '#fbbf24',
                    }}>{s.level}</span>
                  )}
                  <div style={{
                    width: 24, height: 24, borderRadius: 7,
                    background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  </div>
                </div>
              );
            }) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#475569', fontSize: 13 }}>
                {memberSearch ? 'No swimmers match search' : 'All swimmers have been added'}
              </div>
            )}
          </div>
        </div>

        <FormPageActions>
          <Button variant="secondary" onClick={closeForm}>{t('actions.cancel')}</Button>
          <Button variant="primary" onClick={handleSaveGroup} disabled={!form.name.trim() || saving}>
            {saving ? t('loading.saving') : editGroup ? t('actions.update') : t('actions.create')}
          </Button>
        </FormPageActions>
      </FormPage>
    );
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 1000,
          padding: '12px 20px', borderRadius: 12,
          background: toast.includes('Failed') ? 'rgba(244,63,94,0.15)' : 'rgba(45,212,191,0.15)',
          border: `1px solid ${toast.includes('Failed') ? 'rgba(244,63,94,0.3)' : 'rgba(45,212,191,0.3)'}`,
          color: toast.includes('Failed') ? '#fda4af' : '#2dd4bf',
          fontSize: 13, fontWeight: 600, backdropFilter: 'blur(12px)',
          animation: 'fadeInUp 0.3s ease-out',
        }}>{toast}</div>
      )}

      <PageHeader title={t('nav.myGroups')}>
        <Button onClick={openNewForm}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          {t('groups.newGroup')}
        </Button>
      </PageHeader>

      {groups.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.08)', color: '#64748b', fontSize: 13, fontWeight: 500 }}>
            {groups.length} group{groups.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {groups.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
          {groups.map((g, i) => (
            <GroupCard key={g.id} group={g} index={i}
              onEdit={handleEdit} onDelete={handleDelete} navigate={navigate} />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)',
          borderRadius: 20, border: '1px solid rgba(34,211,238,0.06)',
          animation: 'fadeIn 0.4s ease-out',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.1)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div style={{ color: '#64748b', fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{t('groups.noGroups')}</div>
          <div style={{ color: '#475569', fontSize: 13, marginBottom: 20 }}>{t('groups.noGroupsHint')}</div>
          <button
            onClick={openNewForm}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            style={{
              padding: '10px 24px', borderRadius: 12,
              background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
              border: 'none', cursor: 'pointer',
              color: '#060d1f', fontSize: 14, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'all 0.25s ease',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Create First Group
          </button>
        </div>
      )}

    </div>
  );
}
