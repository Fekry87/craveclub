import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { FormField, Input, Button, PageHeader, Modal, useIsMobile } from '../../components/CrudTable';

const monoLabel = {
  fontFamily: 'var(--font-body)', fontSize: 12, color: '#6E6E73',
};

const numberInputStyle = { borderRadius: 16,
  padding: '0 10px', height: 36,
  background: '#FFFFFF',
  border: '1px solid #AEAEB2',
  color: '#1D1D1F',
  fontSize: 14, fontWeight: 500,
  fontFamily: 'var(--font-display)',
  letterSpacing: '-0.02em',
  textAlign: 'center', outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
};

const numberFocusProps = {
  onFocus: e => { e.target.style.borderColor = '#D2D2D7'; },
  onBlur: e => { e.target.style.borderColor = '#AEAEB2'; },
};

function SettingsSection({ title, icon, children, accentColor, description }) {
  const accent = accentColor || '#0071E3';
  return (
    <div style={{ borderRadius: 16,
      background: '#FFFFFF',
      padding: '24px 22px',
      border: '1px solid #E5E5EA',
      position: 'relative',
      transition: 'border-color 0.15s ease',
      height: '100%', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{ borderRadius: 10,
          width: 36, height: 36, background: '#F2F2F7',
          border: '1px solid #E5E5EA',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
          <h3 style={{
            margin: 0, color: '#1D1D1F',
            fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600,
            letterSpacing: '-0.02em', lineHeight: 1,
          }}>{title}</h3>
          {description && (
            <div style={{ ...monoLabel, marginTop: 7, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: accent, display: 'inline-block', flexShrink: 0 }} />
              {description}
            </div>
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
    <div style={{ borderRadius: 14, position: 'fixed', bottom: 28, insetInlineEnd: 28, zIndex: 100,
      background: '#FFFFFF',
      border: '1px solid #E5E5EA',
      padding: '14px 22px',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'fadeInUp 0.3s ease-out',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0071E3" strokeWidth="2.5" strokeLinecap="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      <span style={{
        color: '#1D1D1F', fontSize: 12, fontWeight: 500,
        fontFamily: 'var(--font-body)',
      }}>{message || 'Saved successfully'}</span>
    </div>
  );
}

const starLabels = ['Needs Work', 'Fair', 'Good', 'Great', 'Excellent'];

export default function Leaderboard() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saved, setSaved] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [tierModal, setTierModal] = useState(null);
  const [tierForm, setTierForm] = useState({ name: '', xp_threshold: '', color: '#0071E3', icon: '' });
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
    setTierForm({ name: '', xp_threshold: '', color: '#0071E3', icon: '' });
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: '#6E6E73' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="#E5E5EA" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#1D1D1F" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div style={monoLabel}>Loading leaderboard settings...</div>
        </div>
      </div>
    );
  }

  // Data failed to load — show error state instead of crashing
  if (!settings || !overview) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 14 }}>
        <div style={{ borderRadius: 14,
          width: 48, height: 48, background: '#FFFFFF', border: '1px solid #FF3B30',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: '#FF3B30', fontFamily: 'var(--font-display)', fontWeight: 600,
        }}>!</div>
        <div style={{
          color: '#1D1D1F', fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600,
          letterSpacing: '-0.02em', lineHeight: 1,
        }}>Failed to load leaderboard settings</div>
        {loadError && (
          <div style={{ borderRadius: 16,
            background: '#FFFFFF', padding: '10px 16px',
            maxWidth: 400, width: '100%', textAlign: 'center',
            border: '1px solid #E5E5EA',
          }}>
            <code style={{ color: '#FF3B30', fontSize: 12, fontFamily: 'var(--font-body)' }}>{loadError}</code>
          </div>
        )}
        <button
          type="button"
          className="pl-btn pl-btn-primary pl-btn-sm"
          onClick={() => { setLoading(true); fetchAll(); }}
        >Retry</button>
      </div>
    );
  }

  const presetColors = ['#A2845E', '#86868B', '#FF9500', '#0071E3', '#1D1D1F', '#515154', '#6E6E73', '#FF3B30', '#34C759', '#AEAEB2'];

  return (
    <div>
      <PageHeader title="Leaderboard Settings">
        <Button onClick={handleSaveXpSettings}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
            { label: 'Total Swimmers', value: overview.total_swimmers, color: '#1D1D1F', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Highest XP', value: overview.top_swimmers?.[0]?.total_xp || 0, color: '#0071E3', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { label: 'Avg XP', value: Math.round(overview.top_swimmers?.reduce((s, t) => s + t.total_xp, 0) / (overview.top_swimmers?.length || 1)), color: '#1D1D1F', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { label: 'Level Tiers', value: tiers.length, color: '#1D1D1F', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
          ].map((stat, i) => (
            <div key={i}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
              style={{ borderRadius: 16,
                background: '#FFFFFF',
                padding: '20px 22px',
                border: '1px solid #E5E5EA',
                transition: 'border-color 0.15s ease',
                display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0,
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ ...monoLabel, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d={stat.icon} /></svg>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stat.label}</span>
                </div>
                </div>
              <div style={{
                color: stat.color, fontSize: 34, fontWeight: 500, lineHeight: 1,
                fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
              }}>
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
          accentColor="#FF9500"
          description="XP earned per coach evaluation rating"
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4, 5].map(rating => (
              <div key={rating} style={{ borderRadius: 16,
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px',
                background: '#FFFFFF',
                border: '1px solid #E5E5EA',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: isMobile ? 70 : 100 }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} width="14" height="14" viewBox="0 0 24 24" fill={j < rating ? '#FF9500' : 'none'} stroke={j < rating ? '#FF9500' : '#AEAEB2'} strokeWidth="2">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ color: '#515154', fontSize: 13, fontFamily: 'var(--font-body)' }}>{starLabels[rating - 1]}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    min="0"
                    value={settings[`rating_xp_${rating}`]}
                    onChange={e => setSettings({ ...settings, [`rating_xp_${rating}`]: parseInt(e.target.value) || 0 })}
                    style={{ ...numberInputStyle, width: 72 }}
                    {...numberFocusProps}
                  />
                  <span style={monoLabel}>XP</span>
                </div>
              </div>
            ))}
          </div>
        </SettingsSection>

        {/* Bonus XP Settings */}
        <SettingsSection
          title="Bonus XP Rules"
          accentColor="#0071E3"
          description="Additional XP for attendance and streaks"
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Attendance XP */}
            <div style={{ borderRadius: 16,
              padding: '18px',
              background: '#FFFFFF',
              border: '1px solid #E5E5EA',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ borderRadius: 10,
                  width: 30, height: 30, background: '#F2F2F7',
                  border: '1px solid #E5E5EA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <div style={{
                    color: '#1D1D1F', fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 600,
                    letterSpacing: '-0.02em', lineHeight: 1,
                  }}>Attendance XP</div>
                  <div style={{ ...monoLabel, marginTop: 6 }}>Per session attended</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="number"
                  min="0"
                  value={settings.attendance_xp}
                  onChange={e => setSettings({ ...settings, attendance_xp: parseInt(e.target.value) || 0 })}
                  style={{ ...numberInputStyle, width: 80, height: 42, fontSize: 16 }}
                  {...numberFocusProps}
                />
                <span style={monoLabel}>XP per session</span>
              </div>
            </div>

            {/* Streak Bonus */}
            <div style={{ borderRadius: 16,
              padding: '18px',
              background: '#FFFFFF',
              border: '1px solid #E5E5EA',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ borderRadius: 10,
                  width: 30, height: 30, background: '#F2F2F7',
                  border: '1px solid #E5E5EA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round"><path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
                </div>
                <div>
                  <div style={{
                    color: '#1D1D1F', fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 600,
                    letterSpacing: '-0.02em', lineHeight: 1,
                  }}>Streak Bonus</div>
                  <div style={{ ...monoLabel, marginTop: 6 }}>Reward consecutive attendance</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ ...monoLabel, minWidth: 100 }}>Threshold</span>
                  <input
                    type="number"
                    min="2"
                    value={settings.streak_threshold}
                    onChange={e => setSettings({ ...settings, streak_threshold: parseInt(e.target.value) || 2 })}
                    style={{ ...numberInputStyle, width: 70 }}
                    {...numberFocusProps}
                  />
                  <span style={monoLabel}>consecutive sessions</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ ...monoLabel, minWidth: 100 }}>Bonus XP</span>
                  <input
                    type="number"
                    min="0"
                    value={settings.streak_bonus_xp}
                    onChange={e => setSettings({ ...settings, streak_bonus_xp: parseInt(e.target.value) || 0 })}
                    style={{ ...numberInputStyle, width: 70 }}
                    {...numberFocusProps}
                  />
                  <span style={monoLabel}>XP per streak session</span>
                </div>
              </div>
            </div>

            {/* Formula preview */}
            <div style={{ borderRadius: 16,
              padding: '14px 16px',
              background: '#F2F2F7',
              border: '1px solid #E5E5EA',
            }}>
              <div style={{ ...monoLabel, marginBottom: 10 }}>XP Formula Preview</div>
              <div style={{ color: '#515154', fontSize: 13, lineHeight: 1.8, fontFamily: 'var(--font-body)' }}>
                <div>Total XP = <span style={{ color: '#1D1D1F', fontWeight: 500 }}>Rating XP</span> + <span style={{ color: '#0071E3', fontWeight: 500 }}>Attendance XP</span> + <span style={{ color: '#1D1D1F', fontWeight: 500 }}>Streak XP</span></div>
                <div style={{ ...monoLabel, marginTop: 6, textTransform: 'none' }}>
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
        accentColor="#0071E3"
        description="Gamification levels that swimmers progress through as they earn XP"
        icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
      >
        {/* Header with actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
          <div style={monoLabel}>
            {tiers.length} tier{tiers.length !== 1 ? 's' : ''} configured
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="pl-btn pl-btn-danger pl-btn-sm"
              onClick={handleResetTiers}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
              Reset
            </button>
            <button
              type="button"
              className="pl-btn pl-btn-primary pl-btn-sm"
              onClick={openAddTier}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
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
              <div key={tier.id} style={{ borderRadius: 16,
                padding: '16px 18px',
                background: '#FFFFFF',
                border: '1px solid #E5E5EA',
                transition: 'border-color 0.15s ease',
                position: 'relative',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
              >
                {/* Top row: Icon + Name + Actions */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  {/* Icon tile */}
                  <div style={{
                    width: 44, height: 44, background: '#F2F2F7',
                    border: `1px solid ${tier.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                  }}>
                    {tier.icon || '⭐'}
                  </div>

                  {/* Name + Level label */}
                  <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                    <div style={{
                      color: '#1D1D1F', fontSize: 16, fontWeight: 500,
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '-0.02em', lineHeight: 1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{tier.name}</div>
                    <div style={{ ...monoLabel, marginTop: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 3, background: tier.color, display: 'inline-block', flexShrink: 0 }} />
                      Level {i + 1}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      type="button"
                      className="pl-icon-btn"
                      onClick={() => openEditTier(tier)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    {tier.xp_threshold !== 0 && tiers.length > 2 && (
                      <button
                        type="button"
                        className="pl-icon-btn"
                        style={{ color: '#FF3B30' }}
                        onClick={() => handleDeleteTier(tier)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom row: XP threshold + Swimmer count */}
                <div style={{ borderRadius: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: '#F2F2F7',
                  border: '1px solid #E5E5EA',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span style={{
                      color: '#1D1D1F', fontSize: 13, fontWeight: 500,
                      fontFamily: 'var(--font-display)',
                    }}>
                      {tier.xp_threshold.toLocaleString()} XP
                    </span>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'transparent',
                    padding: '3px 8px',
                    border: '1px solid #AEAEB2',
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6E6E73" strokeWidth="2" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span style={{
                      color: '#1D1D1F', fontSize: 11, fontWeight: 500,
                      fontFamily: 'var(--font-body)',
                    }}>
                      {swimmerCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Level progression visual */}
        <div style={{ borderRadius: 16,
          marginTop: 20, padding: '16px 18px',
          background: '#F2F2F7',
          border: '1px solid #E5E5EA',
        }}>
          <div style={{ ...monoLabel, marginBottom: 16 }}>Level Progression</div>
          <div style={{
            display: 'flex', alignItems: 'center',
            overflowX: 'auto', paddingBottom: 4,
          }}>
            {tiers.map((tier, i) => (
              <div key={tier.id} style={{ display: 'flex', alignItems: 'center', flex: i < tiers.length - 1 ? 1 : 'none', minWidth: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, minWidth: 48 }}>
                  <div style={{
                    width: 36, height: 36, background: '#FFFFFF',
                    border: `1px solid ${tier.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 17,
                  }}>{tier.icon || '⭐'}</div>
                  <div style={{
                    color: '#1D1D1F', fontSize: 11, fontWeight: 500, marginTop: 7,
                    textAlign: 'center', whiteSpace: 'nowrap',
                    fontFamily: 'var(--font-display)',
                  }}>{tier.xp_threshold.toLocaleString()}</div>
                  <div style={{
                    ...monoLabel, fontSize: 9, marginTop: 3,
                    textAlign: 'center', whiteSpace: 'nowrap',
                    maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{tier.name}</div>
                </div>
                {i < tiers.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, minWidth: 16,
                    background: '#E5E5EA',
                    margin: '0 4px', marginBottom: 34,
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
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
        >
          <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tierError && (
              <div style={{
                padding: '10px 14px', background: '#FFFFFF',
                border: '1px solid #FF3B30',
                color: '#FF3B30', fontSize: 13, fontFamily: 'var(--font-body)',
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
              <div style={{ borderRadius: 16,
                display: 'flex', alignItems: 'center', gap: 0,
                background: '#FFFFFF',
                border: '1px solid #AEAEB2',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: 48, height: 42, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderInlineEnd: '1px solid #E5E5EA',
                  position: 'relative',
                }}>
                  <div style={{ borderRadius: 6,
                    width: 26, height: 26, background: tierForm.color,
                    border: '1px solid #E5E5EA',
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
                    flex: 1, minWidth: 0, padding: '0 14px', height: 42,
                    background: 'transparent', border: 'none',
                    color: '#1D1D1F', fontSize: 13,
                    fontFamily: 'var(--font-body)', outline: 'none',
                  }}
                />
              </div>
            </FormField>

            {/* Color presets */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {presetColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setTierForm({ ...tierForm, color })}
                  style={{ borderRadius: 10,
                    width: 28, height: 28, background: color,
                    border: tierForm.color === color ? '2px solid #1D1D1F' : '1px solid #E5E5EA',
                    cursor: 'pointer', padding: 0,
                  }}
                />
              ))}
            </div>

            {/* Preview */}
            <div style={{ borderRadius: 16,
              padding: '14px 16px',
              background: '#F2F2F7',
              border: '1px solid #E5E5EA',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 24 }}>{tierForm.icon || '⭐'}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  color: '#1D1D1F', fontSize: 16, fontWeight: 500, fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.02em', lineHeight: 1,
                }}>{tierForm.name || 'Tier Name'}</div>
                <div style={{ ...monoLabel, marginTop: 7 }}>{tierForm.xp_threshold || '0'} XP required</div>
              </div>
              <div style={{ borderRadius: 6,
                marginInlineStart: 'auto',
                width: 24, height: 24, background: tierForm.color,
                border: '1px solid #E5E5EA',
              }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                className="pl-btn pl-btn-ghost"
                onClick={() => setTierModal(null)}
              >{t('actions.cancel')}</button>
              <Button onClick={handleSaveTier}>
                {tierModal.mode === 'add' ? 'Add Tier' : t('actions.saveChanges')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <SaveToast show={saved} message={savedMsg} />
    </div>
  );
}
