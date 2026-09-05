import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getBranch, getAvailableCoaches, getAvailableSwimmers,
  assignCoaches, unassignCoaches, assignSwimmers, unassignSwimmers,
} from '../../api/branches';
import { getAvatarColor } from '../../components/CrudTable';
import { FormPage, FormPageActions } from '../../components/ui/FormPage';
import { Button } from '../../components/ui/FormControls';

const KNOWN_FEATURES = [
  { key: 'training_plans', label: 'Training Plans', icon: '\u{1F4CB}' },
  { key: 'skills', label: 'Skills Tracking', icon: '\u{1F3AF}' },
  { key: 'leaderboard', label: 'Leaderboard', icon: '\u{1F3C6}' },
  { key: 'evaluations', label: 'Evaluations', icon: '\u{1F4CA}' },
  { key: 'coach_portal', label: 'Coach Portal', icon: '\u{1F468}\u200D\u{1F3EB}' },
];

const TABS = ['Coaches', 'Swimmers', 'Sessions'];

export default function BranchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState('Coaches');
  const [assignModal, setAssignModal] = useState(null); // 'coaches' | 'swimmers'
  const [availableList, setAvailableList] = useState([]);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setLoadError('');
    getBranch(id)
      .then(data => { setBranch(data); setLoading(false); })
      .catch(() => { setLoadError('Failed to load branch'); setLoading(false); });
  };

  useEffect(() => { load(); }, [id]);

  const openAssignModal = async (type) => {
    setAssignModal(type);
    setSelected([]);
    setSearch('');
    setError('');
    setAvailableLoading(true);
    try {
      const data = type === 'coaches'
        ? await getAvailableCoaches(id)
        : await getAvailableSwimmers(id);
      setAvailableList(Array.isArray(data) ? data : (data.data ?? []));
    } catch {
      setError('Failed to load available list');
      setAvailableList([]);
    } finally {
      setAvailableLoading(false);
    }
  };

  const handleAssign = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    setError('');
    try {
      const updated = assignModal === 'coaches'
        ? await assignCoaches(id, selected)
        : await assignSwimmers(id, selected);
      setBranch(updated);
      setAssignModal(null);
    } catch (err) {
      if (err.response?.status === 422 && err.response.data.errors) {
        setError(Object.values(err.response.data.errors).map(a => a[0]).join('. '));
      } else {
        setError(err.response?.data?.message || 'Failed to assign');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async (type, entityId) => {
    setSaving(true);
    try {
      const updated = type === 'coaches'
        ? await unassignCoaches(id, [entityId])
        : await unassignSwimmers(id, [entityId]);
      setBranch(updated);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unassign');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (entityId) => {
    setSelected(prev =>
      prev.includes(entityId) ? prev.filter(x => x !== entityId) : [...prev, entityId]
    );
  };

  const closeAssignForm = () => { setAssignModal(null); setSelected([]); setSearch(''); setError(''); };

  // ── Assign Form (full-page) ────────────────────────────
  if (assignModal) {
    return (
      <FormPage
        title={assignModal === 'coaches' ? 'Assign Coaches' : 'Assign Swimmers'}
        onBack={closeAssignForm}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" />
            <path d="M20 8v6M23 11h-6" />
          </svg>
        }
      >
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6E6E73" strokeWidth="2" strokeLinecap="round"
            style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${assignModal}...`}
            onFocus={e => { e.target.style.borderColor = '#D2D2D7'; }}
            onBlur={e => { e.target.style.borderColor = '#AEAEB2'; }}
            style={{ borderRadius: 16,
              width: '100%', height: 42, padding: '0 12px', paddingInlineStart: 36,
              background: '#FFFFFF', border: '1px solid #AEAEB2',
              color: '#1D1D1F', fontSize: 14, fontFamily: 'var(--font-body)',
              outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s ease',
            }}
          />
        </div>

        {/* List */}
        <div style={{
          maxHeight: 440, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {availableLoading ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#6E6E73', fontSize: 13 }}>{t('loading.default')}</div>
          ) : filteredAvailable(availableList, search, assignModal).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#6E6E73', fontSize: 13 }}>
              {availableList.length === 0 ? `No ${assignModal} available to assign` : 'No matches found'}
            </div>
          ) : (
            filteredAvailable(availableList, search, assignModal).map(item => {
              const name = assignModal === 'coaches'
                ? (item.user?.name || 'Unknown')
                : `${item.first_name} ${item.last_name}`;
              const sub = assignModal === 'coaches'
                ? (item.specialization || 'Coach')
                : (item.level ? item.level.replace('_', ' ') : 'Swimmer');
              const isSelected = selected.includes(item.id);
              const itemAc = getAvatarColor(name);
              const itemInitials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleSelect(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', background: isSelected ? '#F2F2F7' : '#FFFFFF',
                    border: isSelected ? '1px solid #1D1D1F' : '1px solid #E5E5EA',
                    cursor: 'pointer', width: '100%',
                    transition: 'border-color 0.15s ease, background 0.15s ease',
                  }}
                >
                  {/* Checkbox */}
                  <div style={{ borderRadius: 6,
                    width: 20, height: 20, flexShrink: 0,
                    background: isSelected ? '#1D1D1F' : 'transparent',
                    border: isSelected ? '1px solid #1D1D1F' : '1px solid #AEAEB2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s ease, border-color 0.15s ease',
                  }}>
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="3" strokeLinecap="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                  {/* Avatar */}
                  <div style={{ borderRadius: 10,
                    width: 34, height: 34, background: itemAc.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 500, color: itemAc.text, flexShrink: 0,
                    fontFamily: 'var(--font-body)',
                  }}>
                    {itemInitials}
                  </div>
                  <div style={{ flex: 1, textAlign: 'start', minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, color: '#1D1D1F', fontFamily: 'var(--font-display)', fontWeight: 600,
                      letterSpacing: '-0.02em', lineHeight: 1,
                    }}>{name}</div>
                    <div style={{
                      fontSize: 11, color: '#6E6E73', marginTop: 5,
                      fontFamily: 'var(--font-body)',
                    }}>{sub}</div>
                  </div>
                  {item.branch_id && (
                    <span style={{
                      padding: '2px 8px', fontSize: 10, background: 'transparent', color: '#FF9500',
                      fontFamily: 'var(--font-body)',
                      border: '1px solid #FF9500',
                    }}>
                      Other branch
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {error && (
          <div style={{
            background: '#FFFFFF', border: '1px solid #FF3B30',
            padding: '10px 14px', marginTop: 12,
            fontSize: 13, color: '#FF3B30',
          }}>
            {error}
          </div>
        )}

        <FormPageActions>
          <Button type="button" variant="secondary" onClick={closeAssignForm}>{t('actions.cancel')}</Button>
          <Button type="button" disabled={saving || selected.length === 0} onClick={handleAssign}>
            {saving ? t('loading.saving') : `Assign ${selected.length} Selected`}
          </Button>
        </FormPageActions>
      </FormPage>
    );
  }

  // ── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#6E6E73' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 32, height: 32, border: '2px solid #E5E5EA', borderTopColor: '#1D1D1F',
            animation: 'spin 1s linear infinite', margin: '0 auto 12px',
          }} />
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 12, color: '#6E6E73',
          }}>{t('loading.default')}</div>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────
  if (loadError || !branch) {
    return (
      <div>
        <BackButton onClick={() => navigate('/club/branches')} />
        <div style={{ borderRadius: 16,
          textAlign: 'center', padding: '60px 20px',
          background: '#FFFFFF',
          border: '1px solid #E5E5EA',
          borderInlineStart: '3px solid #FF3B30',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 12 }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <p style={{
            color: '#FF3B30', fontSize: 18, margin: '0 0 16px',
            fontFamily: 'var(--font-display)', fontWeight: 600,
            letterSpacing: '-0.02em', lineHeight: 1,
          }}>
            {loadError || 'Branch not found'}
          </p>
          <Button type="button" variant="secondary" onClick={load}>Retry</Button>
        </div>
      </div>
    );
  }

  const ac = getAvatarColor(branch.name);
  const initials = branch.name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?';
  const enabledFeatures = KNOWN_FEATURES.filter(f => branch.features?.[f.key] !== false);

  return (
    <div>
      {/* Back button */}
      <BackButton onClick={() => navigate('/club/branches')} />

      {/* Hero Header */}
      <div style={{ borderRadius: 16,
        background: '#FFFFFF',
        padding: '28px 32px', position: 'relative', overflow: 'hidden', marginBottom: 20,
        border: '1px solid #E5E5EA',
        animation: 'fadeInUp 0.5s ease-out',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ borderRadius: 14,
            width: 60, height: 60, background: ac.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 500,
            letterSpacing: '-0.02em', color: ac.text, flexShrink: 0, }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600,
                color: '#1D1D1F', margin: 0, letterSpacing: '-0.02em', lineHeight: 1,
              }}>
                {branch.name}
              </h1>
              <span style={{
                padding: '3px 10px', fontSize: 10, background: 'transparent',
                fontFamily: 'var(--font-body)', letterSpacing: '-0.02em',
                color: branch.is_active ? '#34C759' : '#FF3B30',
                border: `1px solid ${branch.is_active ? '#34C759' : '#FF3B30'}`,
              }}>
                {branch.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap',
              fontFamily: 'var(--font-body)', fontSize: 12, color: '#6E6E73',
            }}>
              {branch.city && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6E6E73" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {branch.city}
                </span>
              )}
              {branch.address && (
                <span>{branch.address}</span>
              )}
              {branch.phone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6E6E73" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  {branch.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
        marginBottom: 20, animation: 'fadeInUp 0.5s ease-out 0.1s both',
      }}>
        {[
          { label: 'Coaches', value: branch.coaches_count ?? branch.coaches?.length ?? 0, color: '#1D1D1F' },
          { label: 'Swimmers', value: branch.swimmers_count ?? branch.swimmers?.length ?? 0, color: '#1D1D1F' },
          { label: 'Sessions', value: branch.sessions_count ?? branch.sessions?.length ?? 0, color: '#1D1D1F' },
          { label: 'Capacity', value: branch.capacity ?? '\u2014', color: '#1D1D1F' },
        ].map((s, si) => (
          <div key={s.label} style={{ borderRadius: 16,
            textAlign: 'center', padding: '18px 12px', background: '#FFFFFF', border: '1px solid #E5E5EA',
          }}>
            <div style={{
              color: si === 0 ? '#0071E3' : s.color, fontSize: 30, fontWeight: 500,
              fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              {s.value}
            </div>
            <div style={{
              color: '#6E6E73', fontSize: 11, marginTop: 8,
              fontFamily: 'var(--font-body)',
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Info Section — Working Hours + Description + Features */}
      {(branch.working_hours || branch.description || enabledFeatures.length > 0) && (
        <div style={{ borderRadius: 16,
          background: '#FFFFFF',
          padding: '18px 22px', marginBottom: 20,
          border: '1px solid #E5E5EA',
          animation: 'fadeInUp 0.5s ease-out 0.15s both',
        }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: enabledFeatures.length > 0 ? 14 : 0 }}>
            {branch.working_hours && (
              <div style={{
                fontSize: 11, color: '#6E6E73', display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: 'var(--font-body)',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6E6E73" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
                {branch.working_hours}
              </div>
            )}
            {branch.description && (
              <div style={{ fontSize: 13, color: '#515154', lineHeight: 1.5, flex: 1, minWidth: 200 }}>
                {branch.description}
              </div>
            )}
          </div>
          {enabledFeatures.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {enabledFeatures.map(f => (
                <span key={f.key} style={{
                  padding: '3px 10px', background: 'transparent', color: '#6E6E73',
                  fontSize: 10, fontFamily: 'var(--font-body)', border: '1px solid #E5E5EA',
                }}>
                  {f.icon} {f.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 20,
        borderBottom: '1px solid #E5E5EA',
        animation: 'fadeInUp 0.5s ease-out 0.2s both',
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 22px', background: 'none', border: 'none',
              borderBottom: activeTab === tab ? '2px solid #1D1D1F' : '2px solid transparent',
              color: activeTab === tab ? '#1D1D1F' : '#6E6E73',
              fontSize: 11, cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'color 0.15s ease, border-color 0.15s ease',
            }}
          >
            {tab}
            <span style={{
              marginInlineStart: 8, fontSize: 11,
              color: activeTab === tab ? '#0071E3' : '#AEAEB2',
            }}>
              {tab === 'Coaches' ? (branch.coaches?.length ?? 0)
                : tab === 'Swimmers' ? (branch.swimmers?.length ?? 0)
                : (branch.sessions?.length ?? 0)}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
        {activeTab === 'Coaches' && (
          <TabSection
            title="Coaches"
            items={branch.coaches || []}
            onAssign={() => openAssignModal('coaches')}
            renderItem={(coach, i) => (
              <EntityCard
                key={coach.id}
                index={i}
                name={coach.user?.name || 'Unknown'}
                subtitle={coach.specialization || 'Coach'}
                detail={coach.user?.email}
                badge={coach.is_active === false ? 'Inactive' : null}
                onUnassign={() => handleUnassign('coaches', coach.id)}
                saving={saving}
              />
            )}
            emptyText="No coaches assigned to this branch"
            assignLabel="Assign Coach"
          />
        )}

        {activeTab === 'Swimmers' && (
          <TabSection
            title="Swimmers"
            items={branch.swimmers || []}
            onAssign={() => openAssignModal('swimmers')}
            renderItem={(swimmer, i) => (
              <EntityCard
                key={swimmer.id}
                index={i}
                name={`${swimmer.first_name} ${swimmer.last_name}`}
                subtitle={swimmer.level ? swimmer.level.replace('_', ' ') : 'Swimmer'}
                detail={swimmer.date_of_birth ? `DOB: ${swimmer.date_of_birth.slice(0, 10)}` : null}
                badge={swimmer.level}
                badgeColor={levelColor(swimmer.level)}
                onUnassign={() => handleUnassign('swimmers', swimmer.id)}
                saving={saving}
              />
            )}
            emptyText="No swimmers assigned to this branch"
            assignLabel="Assign Swimmer"
          />
        )}

        {activeTab === 'Sessions' && (
          <div>
            {(branch.sessions?.length ?? 0) === 0 ? (
              <EmptyState text="No sessions at this branch" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {branch.sessions.map((session, i) => (
                  <div key={session.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                    background: '#FFFFFF',
                    border: '1px solid #E5E5EA', animation: `fadeInUp 0.3s ease-out ${i * 0.04}s both`,
                  }}>
                    <div style={{ borderRadius: 10,
                      width: 40, height: 40, background: '#F2F2F7', border: '1px solid #E5E5EA',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 15, color: '#1D1D1F', fontFamily: 'var(--font-display)', fontWeight: 600,
                        letterSpacing: '-0.02em', lineHeight: 1,
                      }}>
                        {session.title || 'Untitled Session'}
                      </div>
                      <div style={{
                        fontSize: 11, color: '#6E6E73', marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap',
                        fontFamily: 'var(--font-body)',
                      }}>
                        <span>{session.date}</span>
                        {session.start_time && <span>{session.start_time}{session.end_time ? ` - ${session.end_time}` : ''}</span>}
                        {session.group && <span style={{ color: '#1D1D1F' }}>{session.group.name}</span>}
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 10px', fontSize: 10, background: 'transparent',
                      fontFamily: 'var(--font-body)', letterSpacing: '-0.02em',
                      color: statusColor(session.status).text,
                      border: `1px solid ${statusColor(session.status).border}`,
                    }}>
                      {session.status || 'scheduled'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

/* ── Sub-Components ──────────────────────────────────────── */

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.color = '#1D1D1F'; }}
      onMouseLeave={e => { e.currentTarget.style.color = '#6E6E73'; }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, background: 'none',
        border: 'none', color: '#6E6E73', fontSize: 11,
        fontFamily: 'var(--font-body)',
        cursor: 'pointer', marginBottom: 18, padding: 0, transition: 'color 0.15s ease',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Back to Branches
    </button>
  );
}

function TabSection({ items, onAssign, renderItem, emptyText, assignLabel }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <Button type="button" onClick={onAssign}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {assignLabel}
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState text={emptyText} />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 12,
        }}>
          {items.map((item, i) => renderItem(item, i))}
        </div>
      )}
    </div>
  );
}

function EntityCard({ index, name, subtitle, detail, badge, badgeColor, onUnassign, saving }) {
  const ac = getAvatarColor(name);
  const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
        background: '#FFFFFF',
        border: '1px solid #E5E5EA', transition: 'border-color 0.15s ease',
        animation: `fadeInUp 0.3s ease-out ${index * 0.04}s both`,
      }}
    >
      <div style={{ borderRadius: 10,
        width: 42, height: 42, background: ac.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 500, color: ac.text, flexShrink: 0,
        fontFamily: 'var(--font-body)',
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 15, color: '#1D1D1F',
            fontFamily: 'var(--font-display)', fontWeight: 600,
            letterSpacing: '-0.02em', lineHeight: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {name}
          </span>
          {badge && (
            <span style={{
              padding: '1px 8px', fontSize: 10, background: 'transparent',
              fontFamily: 'var(--font-body)', letterSpacing: '-0.02em',
              color: badgeColor?.text || '#6E6E73',
              border: `1px solid ${badgeColor?.border || '#E5E5EA'}`,
            }}>
              {badge.replace('_', ' ')}
            </span>
          )}
        </div>
        <div style={{
          fontSize: 11, color: '#6E6E73', marginTop: 6,
          fontFamily: 'var(--font-body)',
        }}>
          {subtitle}
          {detail && <span style={{ marginInlineStart: 10 }}>{detail}</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={onUnassign}
        disabled={saving}
        className="pl-btn pl-btn-ghost pl-btn-sm"
        style={{ flexShrink: 0, cursor: saving ? 'wait' : undefined }}
      >
        Unassign
      </button>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ borderRadius: 16,
      textAlign: 'center', padding: '50px 20px',
      background: '#FFFFFF',
      border: '1px solid #E5E5EA',
    }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.2" strokeLinecap="round" style={{ marginBottom: 12 }}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
      <p style={{
        color: '#1D1D1F', fontSize: 18, margin: 0,
        fontFamily: 'var(--font-display)', fontWeight: 600,
        letterSpacing: '-0.02em', lineHeight: 1,
      }}>{text}</p>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

function filteredAvailable(list, search, type) {
  if (!search.trim()) return list;
  const q = search.toLowerCase();
  return list.filter(item => {
    const name = type === 'coaches'
      ? (item.user?.name || '')
      : `${item.first_name} ${item.last_name}`;
    return name.toLowerCase().includes(q)
      || (item.specialization || '').toLowerCase().includes(q)
      || (item.user?.email || '').toLowerCase().includes(q);
  });
}

function levelColor(level) {
  const map = {
    beginner: { bg: 'transparent', text: '#6E6E73', border: '#E5E5EA' },
    intermediate: { bg: 'transparent', text: '#6E6E73', border: '#E5E5EA' },
    advanced: { bg: 'transparent', text: '#1D1D1F', border: '#1D1D1F' },
    competitive: { bg: 'transparent', text: '#FF9500', border: '#FF9500' },
  };
  return map[level] || map.beginner;
}

function statusColor(status) {
  const map = {
    scheduled: { bg: 'transparent', text: '#6E6E73', border: '#E5E5EA' },
    in_progress: { bg: 'transparent', text: '#FF9500', border: '#FF9500' },
    completed: { bg: 'transparent', text: '#34C759', border: '#34C759' },
    cancelled: { bg: 'transparent', text: '#FF3B30', border: '#FF3B30' },
  };
  return map[status] || map.scheduled;
}
