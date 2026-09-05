import { useState, useRef, useEffect, useCallback } from 'react';
import { createSkill } from '../../api/skills';
import { inputStyle } from './styles';

// Soft system tints per skill type — used for the option row's trailing pill.
const TYPE_COLORS = {
  SKILL: { bg: 'rgba(0,113,227,0.1)', color: '#0058B3' },
  SWIM_TYPE: { bg: 'rgba(52,199,89,0.14)', color: '#1E7A3B' },
  TECHNIQUE: { bg: 'rgba(255,149,0,0.16)', color: '#A35A00' },
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
          paddingInlineEnd: 34,
        }}
      />
      {/* Dropdown chevron */}
      <svg
        width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="#86868B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{
          position: 'absolute', insetInlineEnd: 12, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}
      >
        <path d="M6 9l6 6 6-6" />
      </svg>

      {open && (skills.length > 0 || search) && (
        <div style={{
          position: 'absolute', top: '100%', insetInlineStart: 0, insetInlineEnd: 0,
          marginTop: 6, zIndex: 9999,
          background: '#FFFFFF',
          border: '1px solid #E5E5EA',
          borderRadius: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.14)',
          overflow: 'hidden',
          maxHeight: 280, overflowY: 'auto',
          animation: 'fadeIn 0.15s ease-out both',
        }}>
          <div ref={listRef}>
            {/* No results message */}
            {filtered.length === 0 && !showCreateOption && !creating && (
              <div style={{
                padding: '16px', textAlign: 'center',
                fontFamily: 'var(--font-body)', fontSize: 13,
                color: '#86868B',
              }}>
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
                    padding: '8px 14px 4px',
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
                    color: '#6E6E73',
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
                          margin: '0 6px', padding: '9px 8px',
                          display: 'flex', alignItems: 'center', gap: 10,
                          cursor: 'pointer', fontSize: 14,
                          color: '#1D1D1F',
                          borderRadius: 8,
                          background: isHighlighted ? '#F2F2F7' : 'transparent',
                          transition: 'background 0.12s ease',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{skill.name}</span>
                        <span style={{
                          fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, lineHeight: '16px',
                          color: tc.color, background: tc.bg,
                          padding: '3px 9px', borderRadius: 980, flexShrink: 0,
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
                    marginTop: filtered.length > 0 ? 6 : 0,
                    borderTop: filtered.length > 0 ? '1px solid #F2F2F7' : 'none',
                    padding: '11px 14px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', fontSize: 14, fontWeight: 500,
                    color: '#0071E3',
                    background: isHighlighted ? '#F2F2F7' : 'transparent',
                    transition: 'background 0.12s ease',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(0,113,227,0.1)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0071E3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                  <span>Create &ldquo;{search.trim()}&rdquo; as new skill</span>
                </div>
              );
            })()}

            {/* Inline creation form */}
            {creating && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  padding: '12px 14px',
                  borderTop: '1px solid #F2F2F7',
                  background: '#FFFFFF',
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
                  color: '#6E6E73', marginBottom: 8,
                }}>
                  New skill: {search.trim()}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    style={{
                      flex: 1,
                      height: 36,
                      padding: '0 10px',
                      background: '#FFFFFF',
                      border: '1px solid #D2D2D7',
                      borderRadius: 10,
                      color: '#1D1D1F', fontSize: 14,
                      fontFamily: 'var(--font-body)',
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
                    className="pl-btn pl-btn-primary pl-btn-sm"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="pl-btn pl-btn-ghost pl-btn-sm"
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
