import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Modal, ModalActions, FormField, Input, TextArea, Button, PageHeader, getAvatarColor } from '../../components/CrudTable';

const levelConfig = {
  'Beginner':     { color: '#22d3ee', bg: 'rgba(34,211,238,0.10)', border: 'rgba(34,211,238,0.20)', headerGrad: 'rgba(34,211,238,0.08)' },
  'Intermediate': { color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.20)', headerGrad: 'rgba(251,191,36,0.06)' },
  'Advanced':     { color: '#34d399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.20)', headerGrad: 'rgba(52,211,153,0.08)' },
};

function getInitials(firstName, lastName) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
}

function SwimmerCard({ swimmer, onEdit, onDelete, index }) {
  const name = `${swimmer.first_name} ${swimmer.last_name}`;
  const color = getAvatarColor(name);
  const initials = getInitials(swimmer.first_name, swimmer.last_name);
  const lc = levelConfig[swimmer.level] || levelConfig['Beginner'];
  const dob = swimmer.date_of_birth?.split('T')[0];

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
        animation: `fadeInUp 0.4s ease-out ${0.05 + index * 0.04}s both`,
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Card header */}
      <div style={{
        height: 80,
        background: `linear-gradient(135deg, rgba(13,31,60,0.8) 0%, ${lc.headerGrad} 100%)`,
        position: 'relative',
      }}>
        <svg viewBox="0 0 400 80" preserveAspectRatio="none" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, width: '100%', height: 32 }}>
          <path d="M0,40 C100,20 150,60 200,40 C250,20 300,50 400,35 L400,80 L0,80 Z" fill="rgba(10,22,40,0.6)" />
        </svg>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: 10, right: 18,
          width: 44, height: 44, borderRadius: '50%',
          background: `radial-gradient(circle, ${lc.bg} 0%, transparent 70%)`,
        }} />
        <div style={{
          position: 'absolute', top: 22, right: 52,
          width: 22, height: 22, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 70%)',
        }} />

        {/* Level badge in header */}
        {swimmer.level && (
          <div style={{
            position: 'absolute', top: 12, left: 16,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 11px', borderRadius: 8,
            background: lc.bg,
            border: `1px solid ${lc.border}`,
            color: lc.color, fontSize: 11, fontWeight: 600,
            letterSpacing: '0.02em',
            backdropFilter: 'blur(8px)',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            {swimmer.level}
          </div>
        )}

        {/* Login status badge */}
        {swimmer.user && (
          <div style={{
            position: 'absolute', top: 12, right: 16,
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 8,
            background: 'rgba(45,212,191,0.10)',
            border: '1px solid rgba(45,212,191,0.20)',
            color: '#2dd4bf', fontSize: 11, fontWeight: 600,
            backdropFilter: 'blur(8px)',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Active
          </div>
        )}
      </div>

      {/* Avatar */}
      <div style={{
        display: 'flex', justifyContent: 'center', marginTop: -40,
        position: 'relative', zIndex: 2,
      }}>
        <div style={{
          width: 76, height: 76, borderRadius: 20,
          background: color.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 27, fontWeight: 700,
          fontFamily: "'Outfit', sans-serif",
          color: color.text,
          border: '3px solid rgba(10,22,40,0.8)',
          boxShadow: '0 6px 24px rgba(0,0,0,0.35), 0 0 40px rgba(34,211,238,0.05)',
          letterSpacing: '-0.01em',
        }}>
          {initials}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '12px 22px 20px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          margin: '0 0 2px', color: '#f1f5f9', fontSize: 16, fontWeight: 600,
          fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em',
        }}>{name}</h3>

        {/* Info rows */}
        <div style={{
          marginTop: 14, flex: 1,
          display: 'flex', flexDirection: 'column', gap: 0,
          background: 'rgba(6,13,31,0.3)', borderRadius: 12,
          border: '1px solid rgba(51,65,85,0.15)',
          overflow: 'hidden',
        }}>
          {dob && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px',
              borderBottom: swimmer.guardian_name ? '1px solid rgba(51,65,85,0.15)' : 'none',
            }}>
              <span style={{
                color: '#64748b', fontSize: 11, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                DOB
              </span>
              <span style={{ color: '#cbd5e1', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{dob}</span>
            </div>
          )}
          {swimmer.guardian_name && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px',
            }}>
              <span style={{
                color: '#64748b', fontSize: 11, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Guardian
              </span>
              <span style={{ color: '#cbd5e1', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{swimmer.guardian_name}</span>
            </div>
          )}
          {!dob && !swimmer.guardian_name && (
            <div style={{ padding: '12px 14px', color: '#475569', fontSize: 12, textAlign: 'center' }}>
              No additional info
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex', gap: 8, marginTop: 16,
          paddingTop: 14,
          borderTop: '1px solid rgba(51,65,85,0.15)',
        }}>
          <button
            onClick={() => onEdit(swimmer)}
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
            onClick={() => onDelete(swimmer)}
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

function FilterPill({ label, active, color, count, onClick }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = `${color}12`;
          e.currentTarget.style.borderColor = `${color}30`;
          e.currentTarget.style.color = color;
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(51,65,85,0.15)';
          e.currentTarget.style.borderColor = 'rgba(51,65,85,0.3)';
          e.currentTarget.style.color = '#94a3b8';
        }
      }}
      style={{
        padding: '6px 14px', height: 34,
        borderRadius: 10,
        background: active ? `${color}15` : 'rgba(51,65,85,0.15)',
        border: `1px solid ${active ? `${color}35` : 'rgba(51,65,85,0.3)'}`,
        color: active ? color : '#94a3b8',
        fontSize: 13, fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex', alignItems: 'center', gap: 7,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      {count !== undefined && (
        <span style={{
          padding: '1px 7px', borderRadius: 6,
          background: active ? `${color}20` : 'rgba(51,65,85,0.3)',
          fontSize: 11, fontWeight: 700,
          color: active ? color : '#64748b',
          minWidth: 18, textAlign: 'center',
        }}>{count}</span>
      )}
    </button>
  );
}

export default function Swimmers() {
  const [swimmers, setSwimmers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [levelFilter, setLevelFilter] = useState('All');
  const [loginFilter, setLoginFilter] = useState('All');
  const [form, setForm] = useState({ first_name: '', last_name: '', level: '', date_of_birth: '', guardian_name: '', guardian_phone: '', guardian_email: '', medical_notes: '', create_login: false, email: '', password: '' });

  const load = () => api.get('/club/swimmers', { params: { search } })
    .then(r => setSwimmers(r.data.data || []))
    .catch(() => {});
  useEffect(() => { load(); }, [search]);

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

  return (
    <div>
      <PageHeader title="Swimmers" search={search} onSearch={setSearch} searchPlaceholder="Search swimmers...">
        <Button onClick={() => { setEditId(null); setForm({ first_name: '', last_name: '', level: '', date_of_birth: '', guardian_name: '', guardian_phone: '', guardian_email: '', medical_notes: '', create_login: false, email: '', password: '' }); setShowModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          New Swimmer
        </Button>
      </PageHeader>

      {/* Filter bar */}
      {swimmers.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22,
          flexWrap: 'wrap',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          {/* Filter icon label */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: '#526280', fontSize: 12, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            marginRight: 2,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#526280" strokeWidth="2" strokeLinecap="round">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
            Filter
          </div>

          {/* Level filters */}
          <FilterPill
            label="All"
            active={levelFilter === 'All'}
            color="#22d3ee"
            count={swimmers.length}
            onClick={() => setLevelFilter('All')}
          />

          {/* Divider */}
          <div style={{ width: 1, height: 22, background: 'rgba(51,65,85,0.3)', flexShrink: 0 }} />

          {allLevels.map(level => {
            const lc = levelConfig[level] || { color: '#94a3b8' };
            return (
              <FilterPill
                key={level}
                label={level}
                active={levelFilter === level}
                color={lc.color}
                count={levelCounts[level] || 0}
                onClick={() => setLevelFilter(levelFilter === level ? 'All' : level)}
              />
            );
          })}

          {/* Divider */}
          <div style={{ width: 1, height: 22, background: 'rgba(51,65,85,0.3)', flexShrink: 0 }} />

          {/* Login status filters */}
          <FilterPill
            label="Has Login"
            active={loginFilter === 'Active'}
            color="#2dd4bf"
            count={loginCount}
            onClick={() => setLoginFilter(loginFilter === 'Active' ? 'All' : 'Active')}
          />
          <FilterPill
            label="No Login"
            active={loginFilter === 'None'}
            color="#f59e0b"
            count={noLoginCount}
            onClick={() => setLoginFilter(loginFilter === 'None' ? 'All' : 'None')}
          />

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={() => { setLevelFilter('All'); setLoginFilter('All'); }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f1f5f9'; e.currentTarget.style.background = 'rgba(244,63,94,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; }}
              style={{
                padding: '4px 10px', height: 30,
                borderRadius: 8, border: 'none',
                background: 'transparent',
                color: '#64748b', fontSize: 12, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer', transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: 5,
                marginLeft: 4,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>
      )}

      {/* Count + active filter summary */}
      {swimmers.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
        }}>
          <div style={{
            padding: '4px 12px', borderRadius: 8,
            background: 'rgba(34,211,238,0.06)',
            border: '1px solid rgba(34,211,238,0.08)',
            color: '#64748b', fontSize: 13, fontWeight: 500,
          }}>
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
          gap: 22,
        }}>
          {filtered.map((swimmer, i) => (
            <SwimmerCard
              key={swimmer.id}
              swimmer={swimmer}
              index={i}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : swimmers.length > 0 ? (
        <div style={{
          textAlign: 'center', padding: '50px 20px',
          background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)',
          borderRadius: 20,
          border: '1px solid rgba(34,211,238,0.06)',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(251,191,36,0.08)',
            border: '1px solid rgba(251,191,36,0.12)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
          </div>
          <div style={{ color: '#94a3b8', fontSize: 15, fontWeight: 500, marginBottom: 4 }}>No swimmers match filters</div>
          <div style={{ color: '#475569', fontSize: 13, marginBottom: 16 }}>Try adjusting your filter criteria</div>
          <button
            onClick={() => { setLevelFilter('All'); setLoginFilter('All'); }}
            style={{
              padding: '8px 20px', borderRadius: 10,
              background: 'rgba(34,211,238,0.1)',
              border: '1px solid rgba(34,211,238,0.2)',
              color: '#22d3ee', fontSize: 13, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            Clear All Filters
          </button>
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
          <div style={{ color: '#64748b', fontSize: 15, fontWeight: 500, marginBottom: 4 }}>No swimmers found</div>
          <div style={{ color: '#475569', fontSize: 13 }}>Add your first swimmer to get started</div>
        </div>
      )}

      {showModal && (
        <Modal title={editId ? 'Edit Swimmer' : 'New Swimmer'} onClose={() => setShowModal(false)}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="First Name"><Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></FormField>
            <FormField label="Last Name"><Input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></FormField>
          </div>
          <FormField label="Level"><Input value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} placeholder="Beginner, Intermediate, Advanced" /></FormField>
          <FormField label="Date of Birth"><Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></FormField>
          <FormField label="Guardian Name"><Input value={form.guardian_name} onChange={e => setForm({ ...form, guardian_name: e.target.value })} /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Guardian Phone"><Input value={form.guardian_phone} onChange={e => setForm({ ...form, guardian_phone: e.target.value })} /></FormField>
            <FormField label="Guardian Email"><Input type="email" value={form.guardian_email} onChange={e => setForm({ ...form, guardian_email: e.target.value })} /></FormField>
          </div>
          <FormField label="Medical Notes"><TextArea value={form.medical_notes} onChange={e => setForm({ ...form, medical_notes: e.target.value })} /></FormField>
          {!editId && (
            <div style={{
              marginTop: 8, padding: '14px 16px', borderRadius: 12,
              background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.08)',
            }}>
              <label style={{ color: '#94a3b8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.create_login} onChange={e => setForm({ ...form, create_login: e.target.checked })} />
                Create login account for swimmer
              </label>
              {form.create_login && (
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <FormField label="Email"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></FormField>
                  <FormField label="Password"><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></FormField>
                </div>
              )}
            </div>
          )}
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editId ? 'Update' : 'Create'}</Button>
          </ModalActions>
        </Modal>
      )}
    </div>
  );
}
