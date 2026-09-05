import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getClubSportModules, assignToClub, removeFromClub } from '../../api/sportModules';
import { Badge } from '../../components/ui/Badge';

const labelStyle = {
  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, color: '#6E6E73',
};

export default function ClubSportModulesPanel({ clubId }) {
  const { t } = useTranslation();
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
    <div style={{
      borderRadius: 16, background: '#FFFFFF', padding: '22px 24px',
      border: '1px solid #E5E5EA', marginTop: 24, animation: 'fadeInUp 0.5s ease-out 0.3s both',
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10,
        paddingBottom: 14, marginBottom: 16, borderBottom: '1px solid #F2F2F7',
      }}>
        <h2 style={{
          margin: 0, color: '#1D1D1F', fontSize: 17, fontWeight: 600, fontFamily: 'var(--font-display)',
          letterSpacing: '-0.02em', lineHeight: 1.2,
        }}>Sport Modules</h2>
        <span style={labelStyle}>{modules.length}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {modules.map((mod) => {
          const isLoading = loadingId === mod.id;
          const isActive = mod.is_active && mod.is_assigned;
          return (
            <div key={mod.id} style={{
              padding: 16, background: '#FFFFFF', borderRadius: 14,
              border: `1px solid ${isActive ? '#D2D2D7' : '#E5E5EA'}`,
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              opacity: isLoading ? 0.6 : 1,
              transition: 'opacity 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  borderRadius: 10,
                  width: 36, height: 36, flexShrink: 0,
                  background: isActive ? 'rgba(0,113,227,0.1)' : '#F2F2F7',
                  color: isActive ? '#0058B3' : '#6E6E73',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15,
                }}>
                  {mod.name ? mod.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: '#1D1D1F', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{mod.name}</div>
                  <div style={{ marginTop: 6 }}>
                    <Badge variant={isActive ? 'success' : 'neutral'} label={isActive ? 'Active' : 'Not assigned'} />
                  </div>
                </div>
              </div>

              {confirmRemove === mod.id ? (
                <div>
                  <div style={{ color: '#B12A20', fontSize: 13, marginBottom: 10 }}>Remove {mod.name} from this club?</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="pl-btn pl-btn-danger pl-btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => handleRemove(mod.id)} disabled={isLoading}>
                      {isLoading ? '...' : t('actions.confirm')}
                    </button>
                    <button type="button" className="pl-btn pl-btn-ghost pl-btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => setConfirmRemove(null)}>
                      {t('actions.cancel')}
                    </button>
                  </div>
                </div>
              ) : isActive ? (
                <button type="button" className="pl-btn pl-btn-danger pl-btn-sm" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setConfirmRemove(mod.id)} disabled={isLoading}>
                  Remove
                </button>
              ) : (
                <button type="button" className="pl-btn pl-btn-secondary pl-btn-sm" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleAssign(mod.id)} disabled={isLoading}>
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
