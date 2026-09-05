import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { PageHeader, Button, FormPage, FormPageActions, FormField, Input, TextArea, useIsMobile, getAvatarColor } from '../../components/CrudTable';
import { useTranslation } from 'react-i18next';

const labelMono = {
  fontFamily: 'var(--font-body)', fontSize: 12, color: '#6E6E73',
};

/* ───── Swimmer Chip (for member display & picker) ───── */
function SwimmerChip({ swimmer, removable, onRemove, small }) {
  const name = `${swimmer.first_name} ${swimmer.last_name}`;
  const ac = getAvatarColor(name);
  const initials = `${swimmer.first_name?.[0] || ''}${swimmer.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div
      onMouseEnter={e => { if (removable) { e.currentTarget.style.borderColor = '#FF3B30'; } }}
      onMouseLeave={e => { if (removable) { e.currentTarget.style.borderColor = '#E5E5EA'; } }}
      style={{ borderRadius: 16,
        display: 'flex', alignItems: 'center', gap: small ? 6 : 7,
        padding: small ? '4px 8px 4px 4px' : '5px 10px 5px 5px',
        background: '#FFFFFF', border: '1px solid #E5E5EA',
        transition: 'border-color 0.15s ease',
      }}
    >
      <div style={{
        width: small ? 22 : 26, height: small ? 22 : 26,
        background: ac.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: small ? 9 : 10, fontWeight: 500, color: ac.text,
        fontFamily: 'var(--font-body)', letterSpacing: '-0.02em',
      }}>{initials}</div>
      <span style={{ color: '#1D1D1F', fontSize: small ? 12 : 13, fontWeight: 500 }}>{name}</span>
      {removable && (
        <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{
            width: 18, height: 18, border: '1px solid #FF3B30',
            background: 'transparent', color: '#FF3B30',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', marginInlineStart: 2, padding: 0,
          }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}

/* ───── Group Card ───── */
function GroupCard({ group, index, onEdit, onDelete, navigate }) {
  const { t } = useTranslation();
  const swimmerCount = group.swimmers_count || group.swimmers?.length || 0;

  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        transition: 'border-color 0.15s ease',
        position: 'relative',
        animation: `fadeInUp 0.3s ease-out ${0.04 + index * 0.04}s both`,
      }}
    >
      <div style={{ padding: '24px 24px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #E5E5EA' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
            <h3 style={{ margin: 0, color: '#1D1D1F', fontSize: 18, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1 }}>{group.name}</h3>
          </div>
          <div style={{ ...labelMono, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            {swimmerCount}
          </div>
        </div>

        {group.description && <p style={{ color: '#515154', fontSize: 14, margin: '0 0 16px', lineHeight: 1.5 }}>{group.description}</p>}

        {/* Swimmers list */}
        {group.swimmers?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {group.swimmers.map(s => (
              <div key={s.id}
                onClick={() => navigate(`/coach/swimmers/${s.id}`)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
                style={{ borderRadius: 16,
                  display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                  padding: '5px 10px 5px 5px', background: '#FFFFFF', border: '1px solid #E5E5EA',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{
                  width: 26, height: 26, background: getAvatarColor(`${s.first_name} ${s.last_name}`).bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 500, color: getAvatarColor(`${s.first_name} ${s.last_name}`).text,
                  fontFamily: 'var(--font-body)', letterSpacing: '-0.02em',
                }}>{`${s.first_name?.[0] || ''}${s.last_name?.[0] || ''}`.toUpperCase()}</div>
                <span style={{ color: '#1D1D1F', fontSize: 13, fontWeight: 500 }}>{s.first_name} {s.last_name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Plans */}
        {group.plans?.length > 0 && (
          <div style={{ paddingTop: 14, borderTop: '1px solid #E5E5EA', marginBottom: 16 }}>
            <div style={{ ...labelMono, marginBottom: 8 }}>Assigned Plans</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {group.plans.map(p => (
                <span key={p.id} style={{
                  padding: '3px 8px', background: 'transparent', border: '1px solid #AEAEB2',
                  color: '#515154', fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: '14px',
                }}>{p.title}</span>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{
          display: 'flex', gap: 8, paddingTop: 14,
          borderTop: '1px solid #E5E5EA',
        }}>
          <button type="button" onClick={() => onEdit(group)} className="pl-btn pl-btn-secondary pl-btn-sm" style={{ flex: 1 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t('actions.edit')}
          </button>
          <button type="button" onClick={() => onDelete(group)} className="pl-btn pl-btn-danger pl-btn-sm" style={{ flex: 1 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
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
            <label style={labelMono}>
              Members ({selectedIds.length})
            </label>
          </div>

          {/* Selected swimmers */}
          {selectedSwimmers.length > 0 && (
            <div style={{ borderRadius: 16,
              display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12,
              padding: '12px', background: '#F2F2F7', border: '1px solid #E5E5EA',
            }}>
              {selectedSwimmers.map(s => (
                <SwimmerChip key={s.id} swimmer={s} removable small onRemove={() => toggleSwimmer(s.id)} />
              ))}
            </div>
          )}

          {/* Search available swimmers */}
          <div style={{ borderRadius: 16,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0 12px', height: 42, background: '#FFFFFF', border: '1px solid #AEAEB2',
            marginBottom: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6E6E73" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
              placeholder="Search swimmers to add..."
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: '#1D1D1F', fontSize: 13, fontFamily: 'var(--font-body)',
              }}
            />
          </div>

          {/* Available swimmers list */}
          <div style={{ borderRadius: 16,
            maxHeight: 300, overflowY: 'auto', background: '#FFFFFF', border: '1px solid #E5E5EA',
          }}>
            {availableSwimmers.length > 0 ? availableSwimmers.map((s, i) => {
              const ac = getAvatarColor(`${s.first_name} ${s.last_name}`);
              const initials = `${s.first_name?.[0] || ''}${s.last_name?.[0] || ''}`.toUpperCase();
              return (
                <div key={s.id}
                  onClick={() => toggleSwimmer(s.id)}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F2F2F7'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', cursor: 'pointer',
                    borderBottom: i < availableSwimmers.length - 1 ? '1px solid #E5E5EA' : 'none',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ borderRadius: 10,
                    width: 28, height: 28, background: ac.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 500, color: ac.text,
                    fontFamily: 'var(--font-body)',
                  }}>{initials}</div>
                  <span style={{ color: '#1D1D1F', fontSize: 13, fontWeight: 500, flex: 1 }}>{s.first_name} {s.last_name}</span>
                  {s.level && (
                    <span style={{
                      padding: '2px 8px', background: 'transparent',
                      fontFamily: 'var(--font-body)', fontSize: 12, letterSpacing: '-0.02em', lineHeight: '14px',
                      border: `1px solid ${s.level === 'Beginner' ? '#FF9500' : '#515154'}`,
                      color: s.level === 'Beginner' ? '#FF9500' : '#515154',
                    }}>{s.level}</span>
                  )}
                  <div style={{ borderRadius: 6,
                    width: 24, height: 24, background: 'transparent', border: '1px solid #E5E5EA',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  </div>
                </div>
              );
            }) : (
              <div style={{ ...labelMono, padding: '20px', textAlign: 'center', color: '#86868B' }}>
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
          position: 'fixed', top: 24, insetInlineEnd: 24, zIndex: 1000,
          padding: '12px 20px', background: '#FFFFFF',
          border: `1px solid ${toast.includes('Failed') ? '#FF3B30' : '#34C759'}`,
          color: toast.includes('Failed') ? '#FF3B30' : '#34C759',
          fontFamily: 'var(--font-body)', fontSize: 12, letterSpacing: '-0.02em',
          animation: 'fadeInUp 0.3s ease-out',
        }}>{toast}</div>
      )}

      <PageHeader title={t('nav.myGroups')}>
        <Button variant="accent" onClick={openNewForm}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          {t('groups.newGroup')}
        </Button>
      </PageHeader>

      {groups.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, animation: 'fadeIn 0.3s ease-out' }}>
          <div style={labelMono}>
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
        <div style={{ borderRadius: 16,
          textAlign: 'center', padding: '60px 20px',
          background: '#FFFFFF',
          border: '1px solid #E5E5EA',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{ borderRadius: 14,
            width: 64, height: 64, background: '#F2F2F7', border: '1px solid #E5E5EA',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div style={{ color: '#1D1D1F', fontSize: 18, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8 }}>{t('groups.noGroups')}</div>
          <div style={{ ...labelMono, marginBottom: 20 }}>{t('groups.noGroupsHint')}</div>
          <button type="button" onClick={openNewForm} className="pl-btn pl-btn-accent">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Create First Group
          </button>
        </div>
      )}

    </div>
  );
}
