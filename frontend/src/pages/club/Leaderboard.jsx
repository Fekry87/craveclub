import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FormField, Input, Button, PageHeader, Modal, useIsMobile } from '../../components/CrudTable';

function SettingsSection({ title, icon, children, accentColor, description }) {
  const accent = accentColor || '#22d3ee';
  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
      borderRadius: 22, padding: '28px 26px 24px',
      border: '1px solid rgba(34,211,238,0.06)',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.15), 0 4px 16px rgba(6,13,31,0.2)',
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      height: '100%', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${accent}22`;
        e.currentTarget.style.boxShadow = `0 2px 6px rgba(0,0,0,0.2), 0 8px 32px rgba(6,13,31,0.3), 0 0 40px ${accent}06`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.06)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15), 0 4px 16px rgba(6,13,31,0.2)';
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 24, right: 24, height: 2,
        borderRadius: '0 0 2px 2px',
        background: `linear-gradient(90deg, transparent 0%, ${accent}35 50%, transparent 100%)`,
      }} />
      <div style={{
        position: 'absolute', top: 20, left: 0, bottom: 20, width: 3,
        borderRadius: '0 3px 3px 0',
        background: `linear-gradient(180deg, ${accent}60 0%, ${accent}15 100%)`,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: `linear-gradient(135deg, ${accent}14 0%, ${accent}08 100%)`,
          border: `1px solid ${accent}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, boxShadow: `0 2px 12px ${accent}0a`,
        }}>{icon}</div>
        <div>
          <h3 style={{
            margin: 0, color: '#f1f5f9',
            fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 600,
            letterSpacing: '-0.01em',
          }}>{title}</h3>
          {description && (
            <p style={{ color: '#526280', fontSize: 12, margin: '3px 0 0 0', lineHeight: 1.4 }}>{description}</p>
          )}
        </div>
      </div>
      <div style={{ marginTop: 20, flex: 1 }}>{children}</div>
    </div>
  );
}

function SaveToast({ show, message }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 100,
      background: 'linear-gradient(135deg, rgba(45,212,191,0.12) 0%, rgba(34,211,238,0.08) 100%)',
      border: '1px solid rgba(45,212,191,0.25)',
      borderRadius: 16, padding: '14px 26px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 40px rgba(45,212,191,0.06)',
      animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: 'rgba(45,212,191,0.12)',
        border: '1px solid rgba(45,212,191,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <span style={{
        color: '#2dd4bf', fontSize: '0.875rem', fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
      }}>{message || 'Saved successfully'}</span>
    </div>
  );
}

const starLabels = ['Needs Work', 'Fair', 'Good', 'Great', 'Excellent'];

export default function Leaderboard() {
  const [settings, setSettings] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saved, setSaved] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [tierModal, setTierModal] = useState(null);
  const [tierForm, setTierForm] = useState({ name: '', xp_threshold: '', color: '#22d3ee', icon: '' });
  const [tierError, setTierError] = useState('');
  const isMobile = useIsMobile();

  const fetchAll = async () => {
    setLoadError('');
    try {
      const [settingsRes, overviewRes] = await Promise.all([
        api.get('/club/leaderboard/settings'),
        api.get('/club/leaderboard/overview'),
      ]);
      setSettings(settingsRes.data.settings);
      setTiers(settingsRes.data.tiers);
      setOverview(overviewRes.data);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      setLoadError(`${status ? `${status}: ` : ''}${msg}`);
      console.error('Failed to load leaderboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const showToast = (msg) => {
    setSavedMsg(msg);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveXpSettings = async () => {
    try {
      await api.put('/club/leaderboard/settings', {
        rating_xp_1: settings.rating_xp_1,
        rating_xp_2: settings.rating_xp_2,
        rating_xp_3: settings.rating_xp_3,
        rating_xp_4: settings.rating_xp_4,
        rating_xp_5: settings.rating_xp_5,
        attendance_xp: settings.attendance_xp,
        streak_bonus_xp: settings.streak_bonus_xp,
        streak_threshold: settings.streak_threshold,
      });
      showToast('XP settings saved');
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const openAddTier = () => {
    setTierForm({ name: '', xp_threshold: '', color: '#22d3ee', icon: '' });
    setTierError('');
    setTierModal({ mode: 'add' });
  };

  const openEditTier = (tier) => {
    setTierForm({ name: tier.name, xp_threshold: String(tier.xp_threshold), color: tier.color, icon: tier.icon || '' });
    setTierError('');
    setTierModal({ mode: 'edit', tier });
  };

  const handleSaveTier = async () => {
    setTierError('');
    if (!tierForm.name.trim()) { setTierError('Name is required'); return; }
    if (tierForm.xp_threshold === '' || isNaN(tierForm.xp_threshold)) { setTierError('XP threshold must be a number'); return; }

    try {
      if (tierModal.mode === 'add') {
        await api.post('/club/leaderboard/tiers', {
          name: tierForm.name.trim(),
          xp_threshold: parseInt(tierForm.xp_threshold),
          color: tierForm.color,
          icon: tierForm.icon || null,
        });
        showToast('Level tier added');
      } else {
        await api.put(`/club/leaderboard/tiers/${tierModal.tier.id}`, {
          name: tierForm.name.trim(),
          xp_threshold: parseInt(tierForm.xp_threshold),
          color: tierForm.color,
          icon: tierForm.icon || null,
        });
        showToast('Level tier updated');
      }
      setTierModal(null);
      fetchAll();
    } catch (err) {
      setTierError(err.response?.data?.message || 'Failed to save tier');
    }
  };

  const handleDeleteTier = async (tier) => {
    if (!confirm(`Delete "${tier.name}" level tier?`)) return;
    try {
      await api.delete(`/club/leaderboard/tiers/${tier.id}`);
      showToast('Level tier deleted');
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete tier');
    }
  };

  const handleResetTiers = async () => {
    if (!confirm('Reset all level tiers to defaults? This will remove custom tiers.')) return;
    try {
      await api.post('/club/leaderboard/tiers/reset');
      showToast('Level tiers reset to defaults');
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset tiers');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: '#64748b' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 10 }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(34,211,238,0.2)" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Loading leaderboard settings...</div>
        </div>
      </div>
    );
  }

  // Data failed to load — show error state instead of crashing
  if (!settings || !overview) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>!</div>
        <div style={{ color: '#94a3b8', fontSize: 15, fontWeight: 500 }}>Failed to load leaderboard settings</div>
        {loadError && (
          <div style={{
            background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '8px 16px',
            maxWidth: 400, width: '100%', textAlign: 'center',
            border: '1px solid rgba(244,63,94,0.1)',
          }}>
            <code style={{ color: '#f87171', fontSize: 12, fontFamily: 'monospace' }}>{loadError}</code>
          </div>
        )}
        <button onClick={() => { setLoading(true); fetchAll(); }} style={{
          padding: '8px 20px', borderRadius: 10,
          background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)',
          color: '#22d3ee', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}>Retry</button>
      </div>
    );
  }

  const presetColors = ['#CD7F32', '#C0C0C0', '#FFD700', '#7DD3FC', '#A78BFA', '#22d3ee', '#2dd4bf', '#f59e0b', '#ec4899', '#10b981'];

  return (
    <div>
      <PageHeader title="Leaderboard Settings">
        <Button onClick={handleSaveXpSettings}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <path d="M17 21v-8H7v8M7 3v5h8" />
          </svg>
          Save XP Rules
        </Button>
      </PageHeader>

      {/* ── Overview Stats ── */}
      {overview && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: 16, marginBottom: 24,
        }}>
          {[
            { label: 'Total Swimmers', value: overview.total_swimmers, color: '#22d3ee', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Highest XP', value: overview.top_swimmers?.[0]?.total_xp || 0, color: '#f59e0b', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { label: 'Avg XP', value: Math.round(overview.top_swimmers?.reduce((s, t) => s + t.total_xp, 0) / (overview.top_swimmers?.length || 1)), color: '#2dd4bf', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { label: 'Level Tiers', value: tiers.length, color: '#a78bfa', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
              borderRadius: 18, padding: '20px 20px',
              border: '1px solid rgba(34,211,238,0.06)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 16, right: 16, height: 2,
                background: `linear-gradient(90deg, transparent, ${stat.color}30, transparent)`,
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: `linear-gradient(135deg, ${stat.color}14 0%, ${stat.color}08 100%)`,
                  border: `1px solid ${stat.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stat.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={stat.icon} /></svg>
                </div>
                <span style={{ color: '#526280', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</span>
              </div>
              <div style={{ color: '#f1f5f9', fontSize: 28, fontWeight: 700, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
                {stat.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Row 1: Rating XP + Bonus XP ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 20, marginBottom: 20,
      }}>
        {/* Rating XP Settings */}
        <SettingsSection
          title="Rating XP Points"
          accentColor="#f59e0b"
          description="XP earned per coach evaluation rating"
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2, 3, 4, 5].map(rating => (
              <div key={rating} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px',
                background: 'rgba(6,13,31,0.4)',
                borderRadius: 14,
                border: '1px solid rgba(51,65,85,0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: isMobile ? 70 : 100 }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} width="14" height="14" viewBox="0 0 24 24" fill={j < rating ? '#f59e0b' : 'none'} stroke={j < rating ? '#f59e0b' : '#334155'} strokeWidth="2">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>{starLabels[rating - 1]}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    min="0"
                    value={settings[`rating_xp_${rating}`]}
                    onChange={e => setSettings({ ...settings, [`rating_xp_${rating}`]: parseInt(e.target.value) || 0 })}
                    style={{
                      width: 72, padding: '7px 10px',
                      background: 'rgba(6,13,31,0.6)',
                      border: '1px solid rgba(51,65,85,0.5)',
                      borderRadius: 10, color: '#f59e0b',
                      fontSize: 14, fontWeight: 700,
                      fontFamily: "'Outfit', sans-serif",
                      textAlign: 'center', outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(245,158,11,0.4)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(51,65,85,0.5)'; }}
                  />
                  <span style={{ color: '#526280', fontSize: 12, fontWeight: 600 }}>XP</span>
                </div>
              </div>
            ))}
          </div>
        </SettingsSection>

        {/* Bonus XP Settings */}
        <SettingsSection
          title="Bonus XP Rules"
          accentColor="#2dd4bf"
          description="Additional XP for attendance and streaks"
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Attendance XP */}
            <div style={{
              padding: '18px 18px',
              background: 'rgba(6,13,31,0.4)',
              borderRadius: 16,
              border: '1px solid rgba(51,65,85,0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: 'rgba(45,212,191,0.1)',
                  border: '1px solid rgba(45,212,191,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>Attendance XP</div>
                  <div style={{ color: '#526280', fontSize: 11 }}>Per session attended</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  min="0"
                  value={settings.attendance_xp}
                  onChange={e => setSettings({ ...settings, attendance_xp: parseInt(e.target.value) || 0 })}
                  style={{
                    width: 80, padding: '8px 12px',
                    background: 'rgba(6,13,31,0.6)',
                    border: '1px solid rgba(51,65,85,0.5)',
                    borderRadius: 10, color: '#2dd4bf',
                    fontSize: 16, fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                    textAlign: 'center', outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(45,212,191,0.4)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(51,65,85,0.5)'; }}
                />
                <span style={{ color: '#526280', fontSize: 13, fontWeight: 600 }}>XP per session</span>
              </div>
            </div>

            {/* Streak Bonus */}
            <div style={{
              padding: '18px 18px',
              background: 'rgba(6,13,31,0.4)',
              borderRadius: 16,
              border: '1px solid rgba(51,65,85,0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: 'rgba(249,115,22,0.1)',
                  border: '1px solid rgba(249,115,22,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round"><path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
                </div>
                <div>
                  <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>Streak Bonus</div>
                  <div style={{ color: '#526280', fontSize: 11 }}>Reward consecutive attendance</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#94a3b8', fontSize: 13, minWidth: 100 }}>Threshold</span>
                  <input
                    type="number"
                    min="2"
                    value={settings.streak_threshold}
                    onChange={e => setSettings({ ...settings, streak_threshold: parseInt(e.target.value) || 2 })}
                    style={{
                      width: 70, padding: '7px 10px',
                      background: 'rgba(6,13,31,0.6)',
                      border: '1px solid rgba(51,65,85,0.5)',
                      borderRadius: 10, color: '#f97316',
                      fontSize: 14, fontWeight: 700,
                      fontFamily: "'Outfit', sans-serif",
                      textAlign: 'center', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ color: '#526280', fontSize: 12 }}>consecutive sessions</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#94a3b8', fontSize: 13, minWidth: 100 }}>Bonus XP</span>
                  <input
                    type="number"
                    min="0"
                    value={settings.streak_bonus_xp}
                    onChange={e => setSettings({ ...settings, streak_bonus_xp: parseInt(e.target.value) || 0 })}
                    style={{
                      width: 70, padding: '7px 10px',
                      background: 'rgba(6,13,31,0.6)',
                      border: '1px solid rgba(51,65,85,0.5)',
                      borderRadius: 10, color: '#f97316',
                      fontSize: 14, fontWeight: 700,
                      fontFamily: "'Outfit', sans-serif",
                      textAlign: 'center', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ color: '#526280', fontSize: 12 }}>XP per streak session</span>
                </div>
              </div>
            </div>

            {/* Formula preview */}
            <div style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, rgba(34,211,238,0.04) 0%, rgba(6,182,212,0.02) 100%)',
              borderRadius: 12,
              border: '1px solid rgba(34,211,238,0.08)',
            }}>
              <div style={{ color: '#526280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>XP Formula Preview</div>
              <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.8 }}>
                <div>Total XP = <span style={{ color: '#f59e0b' }}>Rating XP</span> + <span style={{ color: '#2dd4bf' }}>Attendance XP</span> + <span style={{ color: '#f97316' }}>Streak XP</span></div>
                <div style={{ marginTop: 4, color: '#475569', fontSize: 11 }}>
                  Example: 5-star rating ({settings.rating_xp_5} XP) + session ({settings.attendance_xp} XP) = {settings.rating_xp_5 + settings.attendance_xp} XP
                </div>
              </div>
            </div>
          </div>
        </SettingsSection>
      </div>

      {/* ── Row 2: Level Tiers ── */}
      <SettingsSection
        title="Level Tiers"
        accentColor="#a78bfa"
        description="Gamification levels that swimmers progress through as they earn XP"
        icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
      >
        {/* Header with actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ color: '#526280', fontSize: 12, fontWeight: 500 }}>
            {tiers.length} tier{tiers.length !== 1 ? 's' : ''} configured
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleResetTiers}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.12)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.06)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.12)'; }}
              style={{
                padding: '7px 14px', borderRadius: 10, cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                background: 'rgba(244,63,94,0.06)',
                border: '1px solid rgba(244,63,94,0.12)',
                color: '#fda4af',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
              Reset
            </button>
            <button
              onClick={openAddTier}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.15)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.06)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.15)'; }}
              style={{
                padding: '7px 14px', borderRadius: 10, cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                background: 'rgba(167,139,250,0.06)',
                border: '1px solid rgba(167,139,250,0.15)',
                color: '#c4b5fd',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Add Tier
            </button>
          </div>
        </div>

        {/* Tier cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}>
          {tiers.map((tier, i) => {
            const swimmerCount = overview?.level_distribution?.[tier.name] || 0;
            return (
              <div key={tier.id} style={{
                padding: '16px 18px',
                background: `linear-gradient(135deg, ${tier.color}06 0%, rgba(6,13,31,0.5) 100%)`,
                borderRadius: 16,
                border: `1px solid ${tier.color}18`,
                transition: 'all 0.25s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${tier.color}35`;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = `0 4px 20px ${tier.color}12`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = `${tier.color}18`;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Top color bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, ${tier.color}60, ${tier.color}20)`,
                }} />

                {/* Top row: Icon + Name + Actions */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  {/* Icon circle */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: `linear-gradient(135deg, ${tier.color}18 0%, ${tier.color}08 100%)`,
                    border: `1.5px solid ${tier.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                    boxShadow: `0 2px 10px ${tier.color}10`,
                  }}>
                    {tier.icon || '⭐'}
                  </div>

                  {/* Name + Level label */}
                  <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                    <div style={{
                      color: tier.color, fontSize: 15, fontWeight: 700,
                      fontFamily: "'Outfit', sans-serif",
                      letterSpacing: '-0.01em',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{tier.name}</div>
                    <div style={{
                      color: '#526280', fontSize: 11, fontWeight: 500, marginTop: 2,
                    }}>Level {i + 1}</div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                      onClick={() => openEditTier(tier)}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.15)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.06)'; }}
                      style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: 'rgba(34,211,238,0.06)',
                        border: '1px solid rgba(34,211,238,0.12)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    {tier.xp_threshold !== 0 && tiers.length > 2 && (
                      <button
                        onClick={() => handleDeleteTier(tier)}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.06)'; }}
                        style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: 'rgba(244,63,94,0.06)',
                          border: '1px solid rgba(244,63,94,0.12)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.2s ease',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom row: XP threshold + Swimmer count */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'rgba(6,13,31,0.4)',
                  borderRadius: 10,
                  border: '1px solid rgba(51,65,85,0.15)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={tier.color} strokeWidth="2" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>
                      {tier.xp_threshold.toLocaleString()} XP
                    </span>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: `${tier.color}0c`,
                    borderRadius: 6, padding: '3px 8px',
                    border: `1px solid ${tier.color}15`,
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={tier.color} strokeWidth="2" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span style={{ color: tier.color, fontSize: 11, fontWeight: 700 }}>
                      {swimmerCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Level progression visual */}
        <div style={{
          marginTop: 20, padding: '16px 18px',
          background: 'linear-gradient(135deg, rgba(167,139,250,0.04) 0%, rgba(139,92,246,0.02) 100%)',
          borderRadius: 14,
          border: '1px solid rgba(167,139,250,0.08)',
        }}>
          <div style={{ color: '#526280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Level Progression</div>
          <div style={{
            display: 'flex', alignItems: 'center',
            overflowX: 'auto', paddingBottom: 4,
          }}>
            {tiers.map((tier, i) => (
              <div key={tier.id} style={{ display: 'flex', alignItems: 'center', flex: i < tiers.length - 1 ? 1 : 'none', minWidth: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, minWidth: 48 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 12,
                    background: `${tier.color}18`,
                    border: `2px solid ${tier.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 17,
                  }}>{tier.icon || '⭐'}</div>
                  <div style={{
                    color: tier.color, fontSize: 9, fontWeight: 700, marginTop: 5,
                    textAlign: 'center', whiteSpace: 'nowrap',
                    fontFamily: "'Outfit', sans-serif",
                  }}>{tier.xp_threshold.toLocaleString()}</div>
                  <div style={{
                    color: '#475569', fontSize: 8, fontWeight: 600, marginTop: 1,
                    textAlign: 'center', whiteSpace: 'nowrap',
                    maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{tier.name}</div>
                </div>
                {i < tiers.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, minWidth: 16,
                    background: `linear-gradient(90deg, ${tier.color}45, ${tiers[i + 1].color}45)`,
                    margin: '0 4px', marginBottom: 28,
                    borderRadius: 1,
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* ── Tier Modal ── */}
      {tierModal && (
        <Modal
          title={tierModal.mode === 'add' ? 'Add Level Tier' : 'Edit Level Tier'}
          onClose={() => setTierModal(null)}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
        >
          <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tierError && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(244,63,94,0.08)',
                border: '1px solid rgba(244,63,94,0.2)',
                color: '#fda4af', fontSize: 13,
              }}>{tierError}</div>
            )}

            <FormField label="Tier Name">
              <Input
                value={tierForm.name}
                onChange={e => setTierForm({ ...tierForm, name: e.target.value })}
                placeholder="e.g. Gold Shark"
              />
            </FormField>

            <FormField label="XP Threshold">
              <Input
                type="number"
                min="0"
                value={tierForm.xp_threshold}
                onChange={e => setTierForm({ ...tierForm, xp_threshold: e.target.value })}
                placeholder="e.g. 500"
              />
            </FormField>

            <FormField label="Icon (emoji)">
              <Input
                value={tierForm.icon}
                onChange={e => setTierForm({ ...tierForm, icon: e.target.value })}
                placeholder="e.g. 🦈"
              />
            </FormField>

            <FormField label="Color">
              <div style={{
                display: 'flex', alignItems: 'center', gap: 0,
                background: 'rgba(6,13,31,0.6)',
                border: '1px solid rgba(51,65,85,0.5)',
                borderRadius: 12, overflow: 'hidden',
              }}>
                <div style={{
                  width: 48, height: 44, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRight: '1px solid rgba(51,65,85,0.4)',
                  position: 'relative',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: tierForm.color,
                    boxShadow: `0 0 12px ${tierForm.color}40`,
                    border: '2px solid rgba(255,255,255,0.15)',
                  }} />
                  <input
                    type="color"
                    value={tierForm.color}
                    onChange={e => setTierForm({ ...tierForm, color: e.target.value })}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                  />
                </div>
                <input
                  type="text"
                  value={tierForm.color}
                  onChange={e => setTierForm({ ...tierForm, color: e.target.value })}
                  style={{
                    flex: 1, minWidth: 0, padding: '0 14px', height: 44,
                    background: 'transparent', border: 'none',
                    color: '#e2e8f0', fontSize: '0.875rem',
                    fontFamily: "'DM Mono', 'DM Sans', monospace",
                    letterSpacing: '0.04em', outline: 'none',
                  }}
                />
              </div>
            </FormField>

            {/* Color presets */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {presetColors.map(color => (
                <button
                  key={color}
                  onClick={() => setTierForm({ ...tierForm, color })}
                  style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: color,
                    border: tierForm.color === color ? '2.5px solid #fff' : '2px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    transform: tierForm.color === color ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: tierForm.color === color ? `0 0 16px ${color}66` : 'none',
                  }}
                />
              ))}
            </div>

            {/* Preview */}
            <div style={{
              padding: '14px 16px',
              background: 'rgba(6,13,31,0.4)',
              borderRadius: 12,
              border: `1px solid ${tierForm.color}20`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 24 }}>{tierForm.icon || '⭐'}</div>
              <div>
                <div style={{ color: tierForm.color, fontSize: 15, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{tierForm.name || 'Tier Name'}</div>
                <div style={{ color: '#526280', fontSize: 12 }}>{tierForm.xp_threshold || '0'} XP required</div>
              </div>
              <div style={{
                marginLeft: 'auto',
                width: 24, height: 24, borderRadius: 6,
                background: tierForm.color,
                border: '2px solid rgba(255,255,255,0.1)',
                boxShadow: `0 0 12px ${tierForm.color}30`,
              }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                onClick={() => setTierModal(null)}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.15)'; }}
                style={{
                  padding: '9px 20px', borderRadius: 10, cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  background: 'rgba(51,65,85,0.15)',
                  border: '1px solid rgba(51,65,85,0.3)',
                  color: '#94a3b8',
                  transition: 'all 0.2s ease',
                }}
              >Cancel</button>
              <Button onClick={handleSaveTier}>
                {tierModal.mode === 'add' ? 'Add Tier' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <SaveToast show={saved} message={savedMsg} />
    </div>
  );
}
