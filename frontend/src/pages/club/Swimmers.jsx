import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { FormPage, FormPageActions, FormField, Input, TextArea, Button, PageHeader, getAvatarColor } from '../../components/CrudTable';
import { CardActions, CardInfoRow } from '../../components/ui/Cards';
import { Badge } from '../../components/ui/Badge';
import { labelStyle, cardStyle } from '../../components/ui/styles';

const levelConfig = {
  'Beginner':     { color: '#0071E3', variant: 'accent' },
  'Intermediate': { color: '#FF9500', variant: 'warning' },
  'Advanced':     { color: '#34C759', variant: 'success' },
};

const svgProps = {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round',
};

const CalendarIcon = () => (
  <svg width="16" height="16" {...svgProps}><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);
const GuardianIcon = () => (
  <svg width="16" height="16" {...svgProps}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);

function getInitials(firstName, lastName) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
}

function SwimmerCard({ swimmer, onEdit, onDelete, index, t }) {
  const name = `${swimmer.first_name} ${swimmer.last_name}`;
  const color = getAvatarColor(name);
  const initials = getInitials(swimmer.first_name, swimmer.last_name);
  const lc = levelConfig[swimmer.level] || { variant: 'neutral' };
  const dob = swimmer.date_of_birth?.split('T')[0];

  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; e.currentTarget.style.boxShadow = 'none'; }}
      style={{
        ...cardStyle,
        padding: '20px 22px',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        position: 'relative',
        animation: `fadeInUp 0.3s ease-out ${0.04 + index * 0.04}s both`,
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 28,
          background: color.bg, color: color.text,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 600,
          fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
          flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{
            margin: 0, color: '#1D1D1F', fontSize: 17, fontWeight: 600,
            fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
            {swimmer.level && <Badge variant={lc.variant} label={swimmer.level} />}
            {swimmer.user && <Badge variant="success" label="Active" />}
          </div>
        </div>
      </div>

      {/* Info rows */}
      <div style={{ marginTop: 16, flex: 1, borderTop: '1px solid #F2F2F7' }}>
        <CardInfoRow icon={<CalendarIcon />} label={t('swimmers.dob')} value={dob} />
        <CardInfoRow icon={<GuardianIcon />} label={t('swimmers.guardian')} value={swimmer.guardian_name} />
        {!dob && !swimmer.guardian_name && (
          <div style={{ padding: '12px 0', color: '#86868B', fontSize: 13 }}>
            {t('swimmers.noAdditionalInfo')}
          </div>
        )}
      </div>

      <CardActions row={swimmer} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function FilterPill({ label, active, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pl-btn pl-btn-sm ${active ? 'pl-btn-primary' : 'pl-btn-ghost'}`}
    >
      {label}
      {count !== undefined && (
        <span style={{ color: active ? 'rgba(255,255,255,0.72)' : '#AEAEB2' }}>{count}</span>
      )}
    </button>
  );
}

export default function Swimmers() {
  const { t } = useTranslation();
  const [swimmers, setSwimmers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [levelFilter, setLevelFilter] = useState('All');
  const [loginFilter, setLoginFilter] = useState('All');
  const [pendingDeletion, setPendingDeletion] = useState([]);
  const [form, setForm] = useState({ first_name: '', last_name: '', level: '', date_of_birth: '', guardian_name: '', guardian_phone: '', guardian_email: '', medical_notes: '', create_login: false, email: '', password: '' });

  const load = () => api.get('/club/swimmers', { params: { search } })
    .then(r => setSwimmers(r.data.data || []))
    .catch(() => {});
  useEffect(() => { load(); }, [search]);

  useEffect(() => {
    api.get('/club/members/pending-deletion')
      .then(r => setPendingDeletion(r.data.data || []))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (editId) await api.put(`/club/swimmers/${editId}`, form);
    else await api.post('/club/swimmers', form);
    setShowModal(false); setEditId(null); load();
  };

  const handleEdit = (s) => {
    setEditId(s.id);
    setForm({ first_name: s.first_name, last_name: s.last_name, level: s.level || '', date_of_birth: s.date_of_birth?.split('T')[0] || '', guardian_name: s.guardian_name || '', guardian_phone: s.guardian_phone || '', guardian_email: s.guardian_email || '', medical_notes: s.medical_notes || '', create_login: false, email: '', password: '' });
    setShowModal(true);
  };
  const handleDelete = async (s) => { if (confirm('Delete?')) { await api.delete(`/club/swimmers/${s.id}`); load(); } };

  // Compute counts per level
  const levelCounts = swimmers.reduce((acc, s) => {
    const lvl = s.level || 'Unassigned';
    acc[lvl] = (acc[lvl] || 0) + 1;
    return acc;
  }, {});
  const loginCount = swimmers.filter(s => s.user).length;
  const noLoginCount = swimmers.length - loginCount;

  // Derive unique levels from data
  const knownLevels = ['Beginner', 'Intermediate', 'Advanced'];
  const allLevels = [...new Set([...knownLevels.filter(l => levelCounts[l]), ...Object.keys(levelCounts).filter(l => !knownLevels.includes(l))])];

  // Filter swimmers
  const filtered = swimmers.filter(s => {
    if (levelFilter !== 'All') {
      const sLevel = s.level || 'Unassigned';
      if (sLevel !== levelFilter) return false;
    }
    if (loginFilter === 'Active' && !s.user) return false;
    if (loginFilter === 'None' && s.user) return false;
    return true;
  });

  const hasActiveFilters = levelFilter !== 'All' || loginFilter !== 'All';

  const closeForm = () => { setShowModal(false); setEditId(null); };

  if (showModal) {
    return (
      <FormPage title={editId ? t('swimmers.editSwimmer') : t('swimmers.newSwimmer')} onBack={closeForm}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label={t('swimmers.firstName')}><Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></FormField>
          <FormField label={t('swimmers.lastName')}><Input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></FormField>
        </div>
        <FormField label={t('swimmers.level')}><Input value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} placeholder={t('swimmers.levelPlaceholder')} /></FormField>
        <FormField label={t('swimmers.dateOfBirth')}><Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></FormField>
        <FormField label={t('swimmers.guardianName')}><Input value={form.guardian_name} onChange={e => setForm({ ...form, guardian_name: e.target.value })} /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label={t('swimmers.guardianPhone')}><Input value={form.guardian_phone} onChange={e => setForm({ ...form, guardian_phone: e.target.value })} /></FormField>
          <FormField label={t('swimmers.guardianEmail')}><Input type="email" value={form.guardian_email} onChange={e => setForm({ ...form, guardian_email: e.target.value })} /></FormField>
        </div>
        <FormField label={t('swimmers.medicalNotes')}><TextArea value={form.medical_notes} onChange={e => setForm({ ...form, medical_notes: e.target.value })} /></FormField>
        {!editId && (
          <div style={{ borderRadius: 16,
            marginTop: 8, padding: '14px 16px', background: '#F2F2F7', border: '1px solid #E5E5EA',
          }}>
            <label style={{ ...labelStyle, color: '#1D1D1F', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.create_login} onChange={e => setForm({ ...form, create_login: e.target.checked })} />
              {t('swimmers.createLogin')}
            </label>
            {form.create_login && (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <FormField label={t('swimmers.email')}><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></FormField>
                <FormField label={t('swimmers.password')}><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></FormField>
              </div>
            )}
          </div>
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
      <PageHeader title={t('swimmers.title')} search={search} onSearch={setSearch} searchPlaceholder={t('swimmers.searchPlaceholder')}>
        <Button onClick={() => { setEditId(null); setForm({ first_name: '', last_name: '', level: '', date_of_birth: '', guardian_name: '', guardian_phone: '', guardian_email: '', medical_notes: '', create_login: false, email: '', password: '' }); setShowModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          {t('swimmers.newSwimmer')}
        </Button>
      </PageHeader>

      {/* Pending deletion warning */}
      {pendingDeletion.length > 0 && (
        <div style={{
          marginBottom: 20, padding: '16px 20px', background: '#FFFFFF',
          border: '1px solid #FF9500',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
            ...labelStyle, color: '#FF9500',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="1.8" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
            </svg>
            {t('swimmers.pendingDeletionTitle', { count: pendingDeletion.length })}
          </div>
          <div>
            {pendingDeletion.map((member, mi) => {
              const daysLeft = Math.max(0, Math.ceil((new Date(member.scheduled_purge_at).getTime() - Date.now()) / 86400000));
              const isUrgent = daysLeft <= 7;
              return (
                <div key={member.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '10px 0',
                  borderTop: mi > 0 ? '1px solid #F2F2F7' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexWrap: 'wrap' }}>
                    <span style={{ color: '#1D1D1F', fontSize: 13, fontWeight: 500 }}>{member.name}</span>
                    <span style={{ color: '#6E6E73', fontSize: 12 }}>{member.email}</span>
                  </div>
                  <Badge variant={isUrgent ? 'danger' : 'warning'} label={t('swimmers.daysLeft', { count: daysLeft })} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter bar */}
      {swimmers.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22,
          flexWrap: 'wrap',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          {/* Filter icon label */}
          <div style={{
            ...labelStyle, display: 'flex', alignItems: 'center', gap: 6,
            marginInlineEnd: 2,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
            {t('actions.filter')}
          </div>

          {/* Level filters */}
          <FilterPill
            label={t('swimmers.all')}
            active={levelFilter === 'All'}
            count={swimmers.length}
            onClick={() => setLevelFilter('All')}
          />

          {/* Divider */}
          <div style={{ width: 1, height: 22, background: '#E5E5EA', flexShrink: 0 }} />

          {allLevels.map(level => (
            <FilterPill
              key={level}
              label={level}
              active={levelFilter === level}
              count={levelCounts[level] || 0}
              onClick={() => setLevelFilter(levelFilter === level ? 'All' : level)}
            />
          ))}

          {/* Divider */}
          <div style={{ width: 1, height: 22, background: '#E5E5EA', flexShrink: 0 }} />

          {/* Login status filters */}
          <FilterPill
            label={t('swimmers.hasLogin')}
            active={loginFilter === 'Active'}
            count={loginCount}
            onClick={() => setLoginFilter(loginFilter === 'Active' ? 'All' : 'Active')}
          />
          <FilterPill
            label={t('swimmers.noLogin')}
            active={loginFilter === 'None'}
            count={noLoginCount}
            onClick={() => setLoginFilter(loginFilter === 'None' ? 'All' : 'None')}
          />

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => { setLevelFilter('All'); setLoginFilter('All'); }}
              onMouseEnter={e => { e.currentTarget.style.color = '#1D1D1F'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#6E6E73'; }}
              style={{
                border: 'none', background: 'transparent', padding: 0,
                ...labelStyle,
                cursor: 'pointer', transition: 'color 0.15s ease',
                display: 'flex', alignItems: 'center', gap: 6,
                marginInlineStart: 4,
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              {t('actions.clear')}
            </button>
          )}
        </div>
      )}

      {/* Count + active filter summary */}
      {swimmers.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
        }}>
          <div style={{ ...labelStyle }}>
            {hasActiveFilters
              ? `${filtered.length} of ${swimmers.length} swimmer${swimmers.length !== 1 ? 's' : ''}`
              : `${swimmers.length} swimmer${swimmers.length !== 1 ? 's' : ''}`
            }
          </div>
        </div>
      )}

      {/* Card grid */}
      {filtered.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {filtered.map((swimmer, i) => (
            <SwimmerCard
              key={swimmer.id}
              swimmer={swimmer}
              index={i}
              onEdit={handleEdit}
              onDelete={handleDelete}
              t={t}
            />
          ))}
        </div>
      ) : swimmers.length > 0 ? (
        <div style={{ borderRadius: 16,
          textAlign: 'center', padding: '50px 32px',
          background: '#FFFFFF',
          border: '1px dashed #AEAEB2',
          animation: 'fadeIn 0.25s ease-out',
        }}>
          <div style={{ borderRadius: 14,
            width: 56, height: 56, border: '1px solid #FF9500',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="1.5" strokeLinecap="round">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
            letterSpacing: '-0.02em', color: '#1D1D1F', marginBottom: 6,
          }}>{t('swimmers.noMatch')}</div>
          <div style={{ color: '#6E6E73', fontSize: 13, marginBottom: 18 }}>{t('swimmers.noMatchHint')}</div>
          <button
            type="button"
            className="pl-btn pl-btn-secondary"
            onClick={() => { setLevelFilter('All'); setLoginFilter('All'); }}
          >
            {t('actions.clearAllFilters')}
          </button>
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
          }}>{t('swimmers.noSwimmers')}</div>
          <div style={{ color: '#6E6E73', fontSize: 13 }}>{t('swimmers.noSwimmersHint')}</div>
        </div>
      )}

    </div>
  );
}
