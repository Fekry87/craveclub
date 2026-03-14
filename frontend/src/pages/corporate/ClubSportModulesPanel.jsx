import { useState, useEffect } from 'react';
import { getClubSportModules, assignToClub, removeFromClub } from '../../api/sportModules';

export default function ClubSportModulesPanel({ clubId }) {
  const [modules, setModules] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const load = () => getClubSportModules(clubId).then(setModules).catch(() => {});
  useEffect(() => { if (clubId) load(); }, [clubId]);

  const handleAssign = async (moduleId) => {
    try {
      setLoadingId(moduleId);
      const updated = await assignToClub(clubId, moduleId);
      setModules(updated);
    } catch { /* ignore */ }
    finally { setLoadingId(null); }
  };

  const handleRemove = async (moduleId) => {
    try {
      setLoadingId(moduleId);
      const updated = await removeFromClub(clubId, moduleId);
      setModules(updated);
      setConfirmRemove(null);
    } catch { /* ignore */ }
    finally { setLoadingId(null); }
  };

  if (!modules.length) return null;

  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.3) 100%)', borderRadius: 18, padding: '24px 26px', border: '1px solid rgba(43,108,176,0.12)', marginTop: 24, animation: 'fadeInUp 0.5s ease-out 0.3s both' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(43,108,176,0.1)', border: '1px solid rgba(43,108,176,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v8" /></svg>
        </div>
        <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: 18, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Sport Modules</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {modules.map(mod => {
          const isLoading = loadingId === mod.id;
          const isActive = mod.is_active && mod.is_assigned;
          return (
            <div key={mod.id} style={{
              padding: '18px 16px', borderRadius: 14,
              background: isActive ? 'rgba(88,204,2,0.03)' : 'rgba(51,65,85,0.08)',
              border: `1px solid ${isActive ? 'rgba(88,204,2,0.12)' : 'rgba(51,65,85,0.15)'}`,
              opacity: isLoading ? 0.6 : 1, transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: mod.color || '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0, boxShadow: `0 2px 8px ${mod.color || '#475569'}30` }}>
                  {mod.icon ? mod.icon.charAt(0).toUpperCase() : '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600 }}>{mod.name}</div>
                  <span style={{
                    display: 'inline-block', marginTop: 3,
                    padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                    background: isActive ? 'rgba(88,204,2,0.1)' : 'rgba(51,65,85,0.25)',
                    color: isActive ? '#58CC02' : '#64748b',
                    border: `1px solid ${isActive ? 'rgba(88,204,2,0.2)' : 'rgba(51,65,85,0.3)'}`,
                  }}>
                    {isActive ? 'Active' : 'Not assigned'}
                  </span>
                </div>
              </div>

              {confirmRemove === mod.id ? (
                <div>
                  <div style={{ color: '#fc8181', fontSize: 12, marginBottom: 8 }}>Remove {mod.name} from this club?</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" onClick={() => handleRemove(mod.id)} disabled={isLoading}
                      style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid rgba(229,62,62,0.3)', background: 'rgba(229,62,62,0.1)', color: '#fc8181', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {isLoading ? '...' : 'Confirm'}
                    </button>
                    <button type="button" onClick={() => setConfirmRemove(null)}
                      style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid rgba(51,65,85,0.3)', background: 'rgba(51,65,85,0.15)', color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : isActive ? (
                <button type="button" onClick={() => setConfirmRemove(mod.id)} disabled={isLoading}
                  style={{ width: '100%', padding: '7px 0', borderRadius: 8, border: '1px solid rgba(229,62,62,0.2)', background: 'rgba(229,62,62,0.05)', color: '#fc8181', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                  Remove
                </button>
              ) : (
                <button type="button" onClick={() => handleAssign(mod.id)} disabled={isLoading}
                  style={{ width: '100%', padding: '7px 0', borderRadius: 8, border: '1px solid rgba(88,204,2,0.2)', background: 'rgba(88,204,2,0.05)', color: '#58CC02', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {isLoading ? 'Assigning...' : 'Assign'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
