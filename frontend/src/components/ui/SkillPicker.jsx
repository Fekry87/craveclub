import { useState, useRef, useEffect, useCallback } from 'react';
import { createSkill } from '../../api/skills';
import { inputStyle } from './styles';

const TYPE_COLORS = {
  SKILL: { bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.15)', color: '#22d3ee' },
  SWIM_TYPE: { bg: 'rgba(45,212,191,0.08)', border: 'rgba(45,212,191,0.15)', color: '#2dd4bf' },
  TECHNIQUE: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
};

const TYPE_LABELS = { SKILL: 'Skill', SWIM_TYPE: 'Swim Type', TECHNIQUE: 'Technique' };

export default function SkillPicker({ value, onChange, skills = [], onSkillCreated }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value || '');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState('SKILL');
  const [saving, setSaving] = useState(false);

  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Sync search text when value prop changes externally
  useEffect(() => { setSearch(value || ''); }, [value]);

  // Filter skills by search text
  const filtered = (skills || []).filter(s =>
    s.name.toLowerCase().includes((search || '').toLowerCase())
  );

  // Check if search text exactly matches any skill
  const exactMatch = filtered.some(s => s.name.toLowerCase() === (search || '').toLowerCase());

  // Build option list: skills + optional "create" option
  const showCreateOption = search && search.trim().length > 0 && !exactMatch && !creating;
  const optionCount = filtered.length + (showCreateOption ? 1 : 0);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setCreating(false);
        // Preserve typed text as the value
        if (search && search !== value) onChange(search);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [search, value, onChange]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[highlightIdx];
      if (item) item.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIdx]);

  const selectSkill = useCallback((name) => {
    onChange(name);
    setSearch(name);
    setOpen(false);
    setCreating(false);
    setHighlightIdx(0);
  }, [onChange]);

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIdx(prev => Math.min(prev + 1, optionCount - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIdx(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (creating) return; // Let inline form handle Enter
        if (highlightIdx < filtered.length) {
          selectSkill(filtered[highlightIdx].name);
        } else if (showCreateOption) {
          setCreating(true);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setCreating(false);
        break;
      default:
        break;
    }
  };

  const handleCreateSave = async () => {
    if (!search.trim() || saving) return;
    setSaving(true);
    try {
      const res = await createSkill({ name: search.trim(), type: newType, description: '' });
      const newSkill = res.data;
      if (onSkillCreated) onSkillCreated(newSkill);
      selectSkill(newSkill.name || search.trim());
    } catch {
      // If creation fails, just use the typed text
      selectSkill(search.trim());
    } finally {
      setSaving(false);
    }
  };

  // Group skills by type for display
  const grouped = {};
  filtered.forEach(s => {
    const t = s.type || 'SKILL';
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(s);
  });

  // Flatten for index tracking
  let flatIdx = 0;

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search skills..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          onChange(e.target.value);
          setOpen(true);
          setCreating(false);
          setHighlightIdx(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        style={{
          ...inputStyle,
          paddingRight: 30,
        }}
      />
      {/* Dropdown chevron */}
      <svg
        width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', opacity: 0.6,
        }}
      >
        <path d="M6 9l6 6 6-6" />
      </svg>

      {open && (skills.length > 0 || search) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          marginTop: 4, zIndex: 9999,
          background: 'rgba(10,18,36,0.98)',
          border: '1px solid rgba(51,65,85,0.5)',
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(51,65,85,0.2)',
          maxHeight: 280, overflowY: 'auto',
        }}>
          <div ref={listRef}>
            {/* No results message */}
            {filtered.length === 0 && !showCreateOption && !creating && (
              <div style={{ padding: '14px 16px', color: '#64748b', fontSize: 12, textAlign: 'center' }}>
                No skills found
              </div>
            )}

            {/* Grouped skill options */}
            {['SKILL', 'SWIM_TYPE', 'TECHNIQUE'].map(type => {
              const items = grouped[type];
              if (!items || items.length === 0) return null;
              const tc = TYPE_COLORS[type];

              return (
                <div key={type}>
                  {/* Type group header */}
                  <div style={{
                    padding: '6px 14px', fontSize: 10, fontWeight: 700,
                    color: tc.color, textTransform: 'uppercase', letterSpacing: '0.5px',
                    background: tc.bg, borderBottom: `1px solid ${tc.border}`,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {TYPE_LABELS[type]}
                  </div>
                  {items.map(skill => {
                    const idx = flatIdx++;
                    const isHighlighted = idx === highlightIdx;
                    return (
                      <div
                        key={skill.id}
                        onMouseDown={(e) => { e.preventDefault(); selectSkill(skill.name); }}
                        onMouseEnter={() => setHighlightIdx(idx)}
                        style={{
                          padding: '8px 14px',
                          display: 'flex', alignItems: 'center', gap: 8,
                          cursor: 'pointer', fontSize: 13,
                          color: isHighlighted ? '#f1f5f9' : '#cbd5e1',
                          background: isHighlighted ? 'rgba(34,211,238,0.08)' : 'transparent',
                          transition: 'background 0.1s',
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: tc.color, flexShrink: 0, opacity: 0.7,
                        }} />
                        <span style={{ flex: 1 }}>{skill.name}</span>
                        <span style={{
                          fontSize: 10, color: tc.color, opacity: 0.6,
                          padding: '1px 6px', borderRadius: 4,
                          background: tc.bg,
                        }}>
                          {TYPE_LABELS[type]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Create new skill option */}
            {showCreateOption && (() => {
              const idx = flatIdx++;
              const isHighlighted = idx === highlightIdx;
              return (
                <div
                  onMouseDown={(e) => { e.preventDefault(); setCreating(true); }}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  style={{
                    padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 8,
                    cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    color: '#22d3ee',
                    background: isHighlighted ? 'rgba(34,211,238,0.06)' : 'transparent',
                    borderTop: filtered.length > 0 ? '1px solid rgba(51,65,85,0.3)' : 'none',
                    transition: 'background 0.1s',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span>Create &ldquo;{search.trim()}&rdquo; as new skill</span>
                </div>
              );
            })()}

            {/* Inline creation form */}
            {creating && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  padding: '10px 12px',
                  borderTop: '1px solid rgba(34,211,238,0.15)',
                  background: 'rgba(34,211,238,0.03)',
                }}
              >
                <div style={{
                  fontSize: 11, color: '#22d3ee', fontWeight: 600, marginBottom: 8,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  New Skill: {search.trim()}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      background: 'rgba(6,13,31,0.8)',
                      border: '1px solid rgba(51,65,85,0.5)',
                      borderRadius: 8, color: '#e2e8f0', fontSize: 12,
                      fontFamily: "'DM Sans', sans-serif",
                      outline: 'none',
                    }}
                  >
                    <option value="SKILL">Skill</option>
                    <option value="SWIM_TYPE">Swim Type</option>
                    <option value="TECHNIQUE">Technique</option>
                  </select>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleCreateSave}
                    style={{
                      padding: '6px 14px',
                      background: saving ? 'rgba(34,211,238,0.15)' : 'linear-gradient(135deg, #06b6d4, #22d3ee)',
                      border: 'none', borderRadius: 8,
                      color: saving ? '#94a3b8' : '#060d1f',
                      fontSize: 12, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    style={{
                      padding: '6px 8px',
                      background: 'none', border: '1px solid rgba(51,65,85,0.4)',
                      borderRadius: 8, color: '#94a3b8', fontSize: 12,
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
