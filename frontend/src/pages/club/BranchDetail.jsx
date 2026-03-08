import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getBranch, getAvailableCoaches, getAvailableSwimmers,
  assignCoaches, unassignCoaches, assignSwimmers, unassignSwimmers,
} from '../../api/branches';
import { getAvatarColor } from '../../components/CrudTable';
import { Modal, ModalActions } from '../../components/ui/Modal';
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

  // ── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#64748b' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(34,211,238,0.2)" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Loading branch...</div>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────
  if (loadError || !branch) {
    return (
      <div>
        <BackButton onClick={() => navigate('/club/branches')} />
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'linear-gradient(145deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.2) 100%)',
          borderRadius: 18, border: '1px solid rgba(244,63,94,0.15)',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 12 }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <p style={{ color: '#fda4af', fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>
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
      <div style={{
        background: 'linear-gradient(145deg, rgba(13,31,60,0.85) 0%, rgba(34,211,238,0.04) 50%, rgba(13,31,60,0.65) 100%)',
        borderRadius: 22, padding: '28px 32px', position: 'relative', overflow: 'hidden', marginBottom: 20,
        border: '1px solid rgba(34,211,238,0.08)',
        animation: 'fadeInUp 0.5s ease-out',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 10%, rgba(34,211,238,0.15) 50%, transparent 90%)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, background: ac.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 700,
            color: ac.text, flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{
                fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 700,
                color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em',
              }}>
                {branch.name}
              </h1>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: branch.is_active ? 'rgba(45,212,191,0.12)' : 'rgba(244,63,94,0.12)',
                color: branch.is_active ? '#2dd4bf' : '#fda4af',
                border: `1px solid ${branch.is_active ? 'rgba(45,212,191,0.25)' : 'rgba(244,63,94,0.2)'}`,
              }}>
                {branch.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
              {branch.city && (
                <span style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {branch.city}
                </span>
              )}
              {branch.address && (
                <span style={{ fontSize: 13, color: '#64748b' }}>{branch.address}</span>
              )}
              {branch.phone && (
                <span style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
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
          { label: 'Coaches', value: branch.coaches_count ?? branch.coaches?.length ?? 0, color: '#2dd4bf' },
          { label: 'Swimmers', value: branch.swimmers_count ?? branch.swimmers?.length ?? 0, color: '#22d3ee' },
          { label: 'Sessions', value: branch.sessions_count ?? branch.sessions?.length ?? 0, color: '#a78bfa' },
          { label: 'Capacity', value: branch.capacity ?? '\u2014', color: '#fbbf24' },
        ].map(s => (
          <div key={s.label} style={{
            textAlign: 'center', padding: '16px 12px', borderRadius: 14,
            background: 'rgba(6,13,31,0.4)', border: '1px solid rgba(51,65,85,0.15)',
          }}>
            <div style={{ color: s.color, fontSize: 26, fontWeight: 700, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 500, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Info Section — Working Hours + Description + Features */}
      {(branch.working_hours || branch.description || enabledFeatures.length > 0) && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)',
          borderRadius: 16, padding: '18px 22px', marginBottom: 20,
          border: '1px solid rgba(34,211,238,0.06)',
          animation: 'fadeInUp 0.5s ease-out 0.15s both',
        }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: enabledFeatures.length > 0 ? 14 : 0 }}>
            {branch.working_hours && (
              <div style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
                {branch.working_hours}
              </div>
            )}
            {branch.description && (
              <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, flex: 1, minWidth: 200 }}>
                {branch.description}
              </div>
            )}
          </div>
          {enabledFeatures.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {enabledFeatures.map(f => (
                <span key={f.key} style={{
                  padding: '3px 10px', borderRadius: 999,
                  background: 'rgba(34,211,238,0.08)', color: '#22d3ee',
                  fontSize: 11, fontWeight: 500, border: '1px solid rgba(34,211,238,0.15)',
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
        borderBottom: '1px solid rgba(51,65,85,0.3)',
        animation: 'fadeInUp 0.5s ease-out 0.2s both',
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 22px', background: 'none', border: 'none',
              borderBottom: activeTab === tab ? '2px solid #22d3ee' : '2px solid transparent',
              color: activeTab === tab ? '#22d3ee' : '#64748b',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s',
            }}
          >
            {tab}
            <span style={{
              marginLeft: 6, padding: '1px 7px', borderRadius: 10,
              fontSize: 11, fontWeight: 700,
              background: activeTab === tab ? 'rgba(34,211,238,0.12)' : 'rgba(51,65,85,0.3)',
              color: activeTab === tab ? '#22d3ee' : '#64748b',
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
                    background: 'linear-gradient(145deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
                    border: '1px solid rgba(34,211,238,0.06)', borderRadius: 14,
                    animation: `fadeInUp 0.3s ease-out ${i * 0.04}s both`,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', fontFamily: "'DM Sans', sans-serif" }}>
                        {session.title || 'Untitled Session'}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span>{session.date}</span>
                        {session.start_time && <span>{session.start_time}{session.end_time ? ` - ${session.end_time}` : ''}</span>}
                        {session.group && <span style={{ color: '#94a3b8' }}>{session.group.name}</span>}
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: statusColor(session.status).bg,
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

      {/* ── Assign Modal ────────────────────────────────────── */}
      {assignModal && (
        <Modal
          title={assignModal === 'coaches' ? 'Assign Coaches' : 'Assign Swimmers'}
          onClose={() => setAssignModal(null)}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" />
              <path d="M20 8v6M23 11h-6" />
            </svg>
          }
        >
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${assignModal}...`}
              style={{
                width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10,
                background: 'rgba(6,13,31,0.5)', border: '1px solid rgba(51,65,85,0.3)',
                color: '#e2e8f0', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* List */}
          <div style={{
            maxHeight: 340, overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {availableLoading ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 13 }}>Loading...</div>
            ) : filteredAvailable(availableList, search, assignModal).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 13 }}>
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
                      padding: '10px 14px', borderRadius: 10,
                      background: isSelected ? 'rgba(34,211,238,0.08)' : 'transparent',
                      border: isSelected ? '1px solid rgba(34,211,238,0.2)' : '1px solid rgba(51,65,85,0.15)',
                      cursor: 'pointer', width: '100%',
                      transition: 'all 0.15s',
                    }}
                  >
                    {/* Checkbox */}
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                      background: isSelected ? 'linear-gradient(135deg, #22d3ee, #06b6d4)' : 'rgba(51,65,85,0.3)',
                      border: isSelected ? '1px solid rgba(34,211,238,0.4)' : '1px solid rgba(51,65,85,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}>
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                    {/* Avatar */}
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, background: itemAc.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: itemAc.text, flexShrink: 0,
                      fontFamily: "'Outfit', sans-serif",
                    }}>
                      {itemInitials}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', fontFamily: "'DM Sans', sans-serif" }}>{name}</div>
                      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>{sub}</div>
                    </div>
                    {item.branch_id && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 500,
                        background: 'rgba(251,191,36,0.1)', color: '#fbbf24',
                        border: '1px solid rgba(251,191,36,0.2)',
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
              background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
              borderRadius: 10, padding: '10px 14px', marginTop: 12,
              fontSize: 13, color: '#fda4af',
            }}>
              {error}
            </div>
          )}

          <ModalActions>
            <Button type="button" variant="secondary" onClick={() => setAssignModal(null)}>Cancel</Button>
            <Button type="button" disabled={saving || selected.length === 0} onClick={handleAssign}>
              {saving ? 'Assigning...' : `Assign ${selected.length} Selected`}
            </Button>
          </ModalActions>
        </Modal>
      )}
    </div>
  );
}

/* ── Sub-Components ──────────────────────────────────────── */

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.color = '#22d3ee'; }}
      onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; }}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, background: 'none',
        border: 'none', color: '#64748b', fontSize: 13, fontWeight: 500,
        cursor: 'pointer', marginBottom: 18, padding: 0, transition: 'color 0.2s',
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.15)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
        background: 'linear-gradient(145deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
        border: '1px solid rgba(34,211,238,0.06)', borderRadius: 14,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: `fadeInUp 0.3s ease-out ${index * 0.04}s both`,
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12, background: ac.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, color: ac.text, flexShrink: 0,
        fontFamily: "'Outfit', sans-serif",
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 14, fontWeight: 600, color: '#f1f5f9',
            fontFamily: "'DM Sans', sans-serif",
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {name}
          </span>
          {badge && (
            <span style={{
              padding: '1px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
              background: badgeColor?.bg || 'rgba(34,211,238,0.1)',
              color: badgeColor?.text || '#22d3ee',
              border: `1px solid ${badgeColor?.border || 'rgba(34,211,238,0.2)'}`,
              textTransform: 'capitalize',
            }}>
              {badge.replace('_', ' ')}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, textTransform: 'capitalize' }}>
          {subtitle}
          {detail && <span style={{ marginLeft: 10 }}>{detail}</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={onUnassign}
        disabled={saving}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.15)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.2)'; e.currentTarget.style.borderColor = 'rgba(51,65,85,0.3)'; }}
        style={{
          padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
          background: 'rgba(51,65,85,0.2)', border: '1px solid rgba(51,65,85,0.3)',
          color: '#94a3b8', cursor: saving ? 'wait' : 'pointer',
          transition: 'all 0.2s', flexShrink: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Unassign
      </button>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{
      textAlign: 'center', padding: '50px 20px',
      background: 'linear-gradient(145deg, rgba(13,31,60,0.3) 0%, rgba(10,22,40,0.2) 100%)',
      borderRadius: 16, border: '1px solid rgba(51,65,85,0.15)',
    }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" style={{ marginBottom: 10 }}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
      <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>{text}</p>
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
    beginner: { bg: 'rgba(34,211,238,0.1)', text: '#22d3ee', border: 'rgba(34,211,238,0.2)' },
    intermediate: { bg: 'rgba(45,212,191,0.1)', text: '#2dd4bf', border: 'rgba(45,212,191,0.2)' },
    advanced: { bg: 'rgba(139,92,246,0.1)', text: '#a78bfa', border: 'rgba(139,92,246,0.2)' },
    competitive: { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
  };
  return map[level] || map.beginner;
}

function statusColor(status) {
  const map = {
    scheduled: { bg: 'rgba(34,211,238,0.1)', text: '#22d3ee', border: 'rgba(34,211,238,0.2)' },
    in_progress: { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
    completed: { bg: 'rgba(45,212,191,0.1)', text: '#2dd4bf', border: 'rgba(45,212,191,0.2)' },
    cancelled: { bg: 'rgba(244,63,94,0.1)', text: '#fda4af', border: 'rgba(244,63,94,0.2)' },
  };
  return map[status] || map.scheduled;
}
