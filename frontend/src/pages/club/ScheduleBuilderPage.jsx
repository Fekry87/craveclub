import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { PageHeader } from '../../components/CrudTable';
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  showSchedule,
  previewSchedule,
  generateSchedule,
  addHolidays,
  removeHoliday,
  deleteSchedule,
} from '../../api/recurringSchedules';

// ── WeekdayPicker ──────────────────────────────────────────
function WeekdayPicker({ selected = [], onChange }) {
  const days = [
    { value: 6, label: 'Sa' },
    { value: 5, label: 'Fr' },
    { value: 4, label: 'Th' },
    { value: 3, label: 'We' },
    { value: 2, label: 'Tu' },
    { value: 1, label: 'Mo' },
    { value: 0, label: 'Su' },
  ];

  const toggle = (val) => {
    if (selected.includes(val)) {
      if (selected.length <= 1) return; // min 1
      onChange(selected.filter((d) => d !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {days.map((d) => {
          const active = selected.includes(d.value);
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => toggle(d.value)}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: active ? '2px solid #22d3ee' : '2px solid rgba(34,211,238,0.15)',
                background: active ? 'rgba(34,211,238,0.15)' : 'transparent',
                color: active ? '#22d3ee' : '#64748b',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              {d.label}
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
        {selected.length} day{selected.length !== 1 ? 's' : ''} per week selected
      </div>
    </div>
  );
}

// ── ScheduleCalendar ───────────────────────────────────────
function ScheduleCalendar({
  periodStart,
  periodEnd,
  previewDates = [],
  holidayDates = [],
  generatedDates = [],
  onDayClick,
}) {
  const [viewMonth, setViewMonth] = useState(null);

  const startDate = periodStart ? new Date(periodStart) : null;
  const endDate = periodEnd ? new Date(periodEnd) : null;

  useEffect(() => {
    if (startDate) {
      setViewMonth(new Date(startDate.getFullYear(), startDate.getMonth(), 1));
    }
  }, [periodStart]);

  if (!viewMonth) {
    return (
      <div style={{ color: '#64748b', textAlign: 'center', padding: 40, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
        Set period dates to see calendar preview
      </div>
    );
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const previewSet = new Set(previewDates);
  const holidaySet = new Set(holidayDates);
  const generatedSet = new Set(generatedDates);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => setViewMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setViewMonth(new Date(year, month + 1, 1));

  const getCellStyle = (dateStr) => {
    if (!startDate || !endDate) return {};
    const d = new Date(dateStr);
    const inPeriod = d >= startDate && d <= endDate;
    if (!inPeriod) return { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.2)' };
    if (holidaySet.has(dateStr)) return { background: 'rgba(239,68,68,0.25)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' };
    if (generatedSet.has(dateStr)) return { background: 'rgba(34,197,94,0.2)', color: '#86efac', border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer' };
    if (previewSet.has(dateStr)) return { background: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' };
    return { color: '#94a3b8' };
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button type="button" onClick={prevMonth} style={navBtnStyle}>&lt;</button>
        <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
          {monthNames[month]} {year}
        </span>
        <button type="button" onClick={nextMonth} style={navBtnStyle}>&gt;</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
        {dayLabels.map((l) => (
          <div key={l} style={{ fontSize: 11, color: '#64748b', padding: '4px 0', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{l}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const style = getCellStyle(dateStr);
          const clickable = generatedSet.has(dateStr) || (startDate && endDate && new Date(dateStr) >= startDate && new Date(dateStr) <= endDate && !previewSet.has(dateStr) && !holidaySet.has(dateStr));
          return (
            <div
              key={dateStr}
              onClick={() => clickable && onDayClick?.(dateStr)}
              style={{
                padding: '6px 2px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.15s',
                cursor: clickable ? 'pointer' : 'default',
                border: '1px solid transparent',
                ...style,
              }}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        <Legend color="rgba(59,130,246,0.4)" label="Session day" />
        <Legend color="rgba(34,197,94,0.4)" label="Generated" />
        <Legend color="rgba(239,68,68,0.4)" label="Holiday" />
      </div>
    </div>
  );
}

const navBtnStyle = {
  background: 'rgba(6,13,31,0.6)',
  border: '1px solid rgba(34,211,238,0.10)',
  color: '#94a3b8',
  borderRadius: 8,
  width: 32,
  height: 32,
  cursor: 'pointer',
  fontSize: 14,
  transition: 'all 0.2s ease',
};

function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
      <span style={{ fontSize: 11, color: '#64748b', fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
    </div>
  );
}

// ── Holiday Dialog ─────────────────────────────────────────
function HolidayDialog({ date, onConfirm, onCancel, hasSession }) {
  const [reason, setReason] = useState('');
  return (
    <div style={overlayStyle}>
      <div style={dialogStyle}>
        <h3 style={{ margin: '0 0 8px', color: '#f1f5f9', fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Add Holiday: {date}</h3>
        {hasSession && (
          <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 10, padding: '8px 12px', marginBottom: 12, color: '#fbbf24', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            A session exists on this date and will be cancelled.
          </div>
        )}
        <input
          type="text"
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={inputStyle}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="button" onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
          <button type="button" onClick={() => onConfirm(reason)} style={confirmBtnStyle}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function ScheduleBuilderPage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [groups, setGroups] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit mode state
  const [editingSchedule, setEditingSchedule] = useState(null); // null = create mode, object = edit mode

  // Form state
  const [form, setForm] = useState({
    name: '',
    group_id: '',
    coach_user_id: '',
    period_start: '',
    period_end: '',
    days_of_week: [1, 3, 5], // Mon, Wed, Fri
    start_time: '16:00',
    duration_minutes: 60,
    location: '',
    training_plan_id: '',
  });

  // Preview state
  const [previewData, setPreviewData] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [createdScheduleId, setCreatedScheduleId] = useState(null);

  // Holiday dialog
  const [holidayDialog, setHolidayDialog] = useState(null);

  // Toast
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = () => {
    setLoading(true);
    Promise.all([
      getSchedules().catch(() => ({ data: { data: [] } })),
      api.get('/club/groups').catch(() => ({ data: { data: [] } })),
      api.get('/club/plans').catch(() => ({ data: { data: [] } })),
    ]).then(([sRes, gRes, pRes]) => {
      setSchedules(sRes.data?.data || []);
      setGroups(gRes.data?.data || []);
      setPlans(pRes.data?.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Duration display
  const durationDays = useMemo(() => {
    if (!form.period_start || !form.period_end) return 0;
    const s = new Date(form.period_start);
    const e = new Date(form.period_end);
    return Math.max(0, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
  }, [form.period_start, form.period_end]);

  const handleChange = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setPreviewData(null);
    setGeneratedResult(null);
    setCreatedScheduleId(null);
  };

  const handleCreateAndPreview = async () => {
    setError('');
    if (!form.name || !form.group_id || !form.period_start || !form.period_end) {
      setError('Please fill in all required fields.');
      return;
    }
    if (durationDays > 365) {
      setError('Period cannot exceed 365 days.');
      return;
    }

    setPreviewing(true);
    try {
      // Find the coach_user_id for the selected group
      const group = groups.find((g) => String(g.id) === String(form.group_id));
      const payload = {
        ...form,
        coach_user_id: group?.coach_user_id || user?.id,
        group_id: parseInt(form.group_id),
        training_plan_id: form.training_plan_id ? parseInt(form.training_plan_id) : null,
        duration_minutes: parseInt(form.duration_minutes),
      };

      const createRes = await createSchedule(payload);
      const scheduleId = createRes.data.id;
      setCreatedScheduleId(scheduleId);

      const previewRes = await previewSchedule(scheduleId);
      setPreviewData(previewRes.data);
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(Object.values(err.response.data.errors).map((a) => a[0]).join('. '));
      } else {
        setError(err.response?.data?.message || 'Failed to preview schedule.');
      }
    } finally {
      setPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    if (!createdScheduleId) return;
    setGenerating(true);
    setError('');
    try {
      const res = await generateSchedule(createdScheduleId);
      setGeneratedResult(res.data);
      showToast(`${res.data.created} sessions created successfully`);
      load(); // refresh schedules table
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate sessions.');
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '', group_id: '', coach_user_id: '', period_start: '', period_end: '',
      days_of_week: [1, 3, 5], start_time: '16:00', duration_minutes: 60,
      location: '', training_plan_id: '',
    });
    setPreviewData(null);
    setCreatedScheduleId(null);
    setGeneratedResult(null);
    setEditingSchedule(null);
  };

  const handleEditSchedule = async (schedule) => {
    setError('');
    try {
      const res = await showSchedule(schedule.id);
      const s = res.data;
      setEditingSchedule(s);
      setForm({
        name: s.name || '',
        group_id: String(s.group_id || ''),
        coach_user_id: String(s.coach_user_id || ''),
        period_start: s.period_start ? s.period_start.split('T')[0] : '',
        period_end: s.period_end ? s.period_end.split('T')[0] : '',
        days_of_week: s.days_of_week || [1, 3, 5],
        start_time: s.start_time ? s.start_time.substring(0, 5) : '16:00',
        duration_minutes: s.duration_minutes || 60,
        location: s.location || '',
        training_plan_id: s.training_plan_id ? String(s.training_plan_id) : '',
      });
      setPreviewData(null);
      setCreatedScheduleId(null);
      setGeneratedResult(null);
      // Scroll to top of the form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load schedule for editing.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingSchedule) return;
    setError('');
    setSaving(true);
    try {
      const group = groups.find((g) => String(g.id) === String(form.group_id));
      const payload = {
        name: form.name,
        group_id: parseInt(form.group_id),
        coach_user_id: group?.coach_user_id || parseInt(form.coach_user_id) || user?.id,
        period_start: form.period_start,
        period_end: form.period_end,
        days_of_week: form.days_of_week,
        start_time: form.start_time,
        duration_minutes: parseInt(form.duration_minutes),
        location: form.location || null,
        training_plan_id: form.training_plan_id ? parseInt(form.training_plan_id) : null,
      };

      await updateSchedule(editingSchedule.id, payload);
      showToast('Schedule updated successfully');
      load();
      resetForm();
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(Object.values(err.response.data.errors).map((a) => a[0]).join('. '));
      } else {
        setError(err.response?.data?.message || 'Failed to update schedule.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDayClick = (dateStr) => {
    if (!createdScheduleId) return;

    const isGenerated = generatedResult?.dates?.includes(dateStr);
    if (isGenerated) {
      // Quick-view drawer for generated session
      showToast(`Session on ${dateStr}`);
      return;
    }

    // Add holiday dialog
    const hasSession = previewData?.dates?.includes(dateStr) || generatedResult?.dates?.includes(dateStr);
    setHolidayDialog({ date: dateStr, hasSession });
  };

  const handleAddHoliday = async (reason) => {
    if (!createdScheduleId || !holidayDialog) return;
    try {
      await addHolidays(createdScheduleId, [holidayDialog.date], reason || null);
      showToast('Holiday added');
      // Re-fetch preview
      const previewRes = await previewSchedule(createdScheduleId);
      setPreviewData(previewRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add holiday.');
    }
    setHolidayDialog(null);
  };

  const handleGenerateFromTable = async (id) => {
    try {
      await generateSchedule(id);
      showToast('Sessions generated');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate.');
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!confirm('Delete this schedule?')) return;
    try {
      await deleteSchedule(id);
      showToast('Schedule deleted');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete.');
    }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 1000,
          background: 'linear-gradient(145deg, rgba(13,31,60,0.95) 0%, rgba(10,22,40,0.95) 100%)',
          border: '1px solid rgba(34,211,238,0.15)',
          borderRadius: 14, padding: '14px 20px',
          color: '#f1f5f9', fontSize: 13, fontWeight: 500,
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'fadeInUp 0.3s ease-out',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', flexShrink: 0, animation: 'glowPulse 2s infinite' }} />
          {toast}
        </div>
      )}

      {/* Holiday Dialog */}
      {holidayDialog && (
        <HolidayDialog
          date={holidayDialog.date}
          hasSession={holidayDialog.hasSession}
          onConfirm={handleAddHoliday}
          onCancel={() => setHolidayDialog(null)}
        />
      )}

      <PageHeader title="Schedules" />

      {/* Error Banner */}
      {error && (
        <div style={{
          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.20)',
          borderRadius: 14, padding: '12px 16px', marginBottom: 20,
          color: '#f43f5e', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fadeInUp 0.3s ease-out',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{ flex: 1 }}>{error}</span>
          <button type="button" onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: 16, padding: 0 }}>x</button>
        </div>
      )}

      {/* Two-Column Builder */}
      <div className="schedule-builder-grid" style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 16, marginBottom: 22 }}>
        {/* Left Panel - Form */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
          border: '1px solid rgba(34,211,238,0.06)',
          borderRadius: 18, padding: '26px 28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)',
          animation: 'fadeInUp 0.4s ease-out 0.1s both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ color: '#22d3ee', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {editingSchedule ? 'Edit Schedule' : 'New Schedule'}
            </h3>
            {editingSchedule && (
              <button
                type="button"
                onClick={resetForm}
                style={{ ...smallBtnStyle, fontSize: 11, padding: '3px 8px' }}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Schedule Name */}
            <FieldGroup label="Schedule Name *">
              <input
                type="text"
                placeholder="January 2026 Schedule"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                style={inputStyle}
              />
            </FieldGroup>

            {/* Group Selector */}
            <FieldGroup label="Group *">
              <select
                value={form.group_id}
                onChange={(e) => handleChange('group_id', e.target.value)}
                style={inputStyle}
              >
                <option value="">Select group...</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </FieldGroup>

            {/* Period Date Range */}
            <FieldGroup label="Period *">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="date"
                  value={form.period_start}
                  onChange={(e) => handleChange('period_start', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <span style={{ color: '#64748b', fontSize: 13 }}>to</span>
                <input
                  type="date"
                  value={form.period_end}
                  onChange={(e) => handleChange('period_end', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
              {durationDays > 0 && (
                <div style={{ fontSize: 11, color: durationDays > 365 ? '#f43f5e' : '#64748b', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                  Duration: {durationDays} days
                  {durationDays > 365 && ' (exceeds 365 day limit)'}
                </div>
              )}
            </FieldGroup>

            {/* Weekday Picker */}
            <FieldGroup label="Training Days *">
              <WeekdayPicker
                selected={form.days_of_week}
                onChange={(val) => handleChange('days_of_week', val)}
              />
            </FieldGroup>

            {/* Session Time */}
            <FieldGroup label="Session Time">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => handleChange('start_time', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => handleChange('duration_minutes', Math.max(30, form.duration_minutes - 15))}
                    style={stepBtnStyle}
                  >-</button>
                  <span style={{ color: '#f1f5f9', fontSize: 13, minWidth: 50, textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
                    {form.duration_minutes} min
                  </span>
                  <button
                    type="button"
                    onClick={() => handleChange('duration_minutes', Math.min(180, form.duration_minutes + 15))}
                    style={stepBtnStyle}
                  >+</button>
                </div>
              </div>
            </FieldGroup>

            {/* Location */}
            <FieldGroup label="Location">
              <input
                type="text"
                placeholder="Pool A, Lane 1-3"
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
                style={inputStyle}
              />
            </FieldGroup>

            {/* Training Plan */}
            <FieldGroup label="Training Plan">
              <select
                value={form.training_plan_id}
                onChange={(e) => handleChange('training_plan_id', e.target.value)}
                style={inputStyle}
              >
                <option value="">None</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </FieldGroup>

            {/* Action Buttons */}
            {editingSchedule ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  style={{
                    ...primaryBtnStyle,
                    flex: 1,
                    opacity: saving ? 0.6 : 1,
                    background: 'rgba(52,211,153,0.12)',
                    border: '1px solid rgba(52,211,153,0.25)',
                    color: '#34d399',
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    ...primaryBtnStyle,
                    flex: 0,
                    minWidth: 100,
                    background: 'rgba(6,13,31,0.6)',
                    border: '1px solid rgba(34,211,238,0.10)',
                    color: '#94a3b8',
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCreateAndPreview}
                disabled={previewing || saving}
                style={{
                  ...primaryBtnStyle,
                  opacity: previewing ? 0.6 : 1,
                }}
              >
                {previewing ? 'Creating preview...' : 'Preview Schedule'}
              </button>
            )}
          </div>
        </div>

        {/* Right Panel - Calendar */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
          border: '1px solid rgba(34,211,238,0.06)',
          borderRadius: 18, padding: '26px 28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)',
          animation: 'fadeInUp 0.4s ease-out 0.15s both',
        }}>
          <h3 style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            Calendar Preview
          </h3>

          <ScheduleCalendar
            periodStart={form.period_start}
            periodEnd={form.period_end}
            previewDates={previewData?.dates || []}
            holidayDates={previewData?.holiday_dates || []}
            generatedDates={generatedResult?.dates || []}
            onDayClick={handleDayClick}
          />

          {/* Preview Summary */}
          {previewData && !generatedResult && (
            <div style={{
              marginTop: 20,
              background: 'rgba(34,211,238,0.06)',
              border: '1px solid rgba(34,211,238,0.12)',
              borderRadius: 14,
              padding: 16,
            }}>
              <div style={{ color: '#22d3ee', fontSize: 13, fontWeight: 600, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                {previewData.total} sessions will be created in {durationDays} days
              </div>
              {previewData.holiday_dates?.length > 0 && (
                <div style={{ color: '#f43f5e', fontSize: 12, marginBottom: 8 }}>
                  {previewData.holiday_dates.length} holiday(s) excluded
                </div>
              )}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                style={{
                  ...generateBtnStyle,
                  opacity: generating ? 0.6 : 1,
                }}
              >
                {generating ? 'Generating...' : 'Confirm & Create Sessions'}
              </button>
            </div>
          )}

          {/* Generation Result */}
          {generatedResult && (
            <div style={{
              marginTop: 20,
              background: 'rgba(52,211,153,0.06)',
              border: '1px solid rgba(52,211,153,0.15)',
              borderRadius: 14,
              padding: 16,
            }}>
              <div style={{ color: '#34d399', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                {generatedResult.created} sessions created successfully
              </div>
              {generatedResult.skipped > 0 && (
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                  {generatedResult.skipped} skipped (already exist or holiday)
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedules List Table */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
        border: '1px solid rgba(34,211,238,0.06)',
        borderRadius: 18, padding: '26px 28px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)',
        animation: 'fadeInUp 0.4s ease-out 0.2s both',
      }}>
        <h3 style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
          Existing Schedules
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', borderTopColor: '#22d3ee', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
            <div style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Loading...</div>
          </div>
        ) : schedules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            No recurring schedules yet. Create one above.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name', 'Group', 'Period', 'Days', 'Sessions', 'Holidays', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={tdStyle}>{s.name}</td>
                    <td style={tdStyle}>{s.group?.name || '-'}</td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12 }}>
                        {s.period_start?.split('T')[0]} - {s.period_end?.split('T')[0]}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {(s.days_of_week || []).map((d) => ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d]).join(', ')}
                    </td>
                    <td style={tdStyle}>{s.sessions_count ?? 0}</td>
                    <td style={tdStyle}>{s.holidays_count ?? 0}</td>
                    <td style={tdStyle}>
                      <StatusBadge status={s.status} />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" onClick={() => handleEditSchedule(s)} style={{ ...smallBtnStyle, color: '#fbbf24', borderColor: 'rgba(245,158,11,0.3)' }}>
                          Edit
                        </button>
                        {s.status === 'draft' && (
                          <button type="button" onClick={() => handleGenerateFromTable(s.id)} style={smallBtnStyle}>
                            Generate
                          </button>
                        )}
                        <button type="button" onClick={() => handleDeleteSchedule(s.id)} style={{ ...smallBtnStyle, color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    draft: { bg: 'rgba(148,163,184,0.08)', color: '#94a3b8', border: 'rgba(148,163,184,0.15)' },
    active: { bg: 'rgba(52,211,153,0.08)', color: '#34d399', border: 'rgba(52,211,153,0.15)' },
    completed: { bg: 'rgba(34,211,238,0.08)', color: '#22d3ee', border: 'rgba(34,211,238,0.15)' },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {status}
    </span>
  );
}

// ── Field Group ────────────────────────────────────────────
function FieldGroup({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Shared Styles ──────────────────────────────────────────
const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(6,13,31,0.6)',
  border: '1px solid rgba(34,211,238,0.10)',
  borderRadius: 10,
  color: '#e2e8f0',
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
};

const primaryBtnStyle = {
  width: '100%',
  padding: '12px',
  background: 'rgba(34,211,238,0.12)',
  border: '1px solid rgba(34,211,238,0.25)',
  borderRadius: 10,
  color: '#22d3ee',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const generateBtnStyle = {
  width: '100%',
  padding: '12px',
  background: 'rgba(52,211,153,0.12)',
  border: '1px solid rgba(52,211,153,0.25)',
  borderRadius: 10,
  color: '#34d399',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const stepBtnStyle = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: '1px solid rgba(34,211,238,0.10)',
  background: 'rgba(6,13,31,0.6)',
  color: '#94a3b8',
  cursor: 'pointer',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
};

const smallBtnStyle = {
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 6,
  border: '1px solid rgba(34,211,238,0.15)',
  background: 'rgba(34,211,238,0.06)',
  color: '#22d3ee',
  cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif",
  transition: 'all 0.2s ease',
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999,
};

const dialogStyle = {
  background: 'linear-gradient(145deg, rgba(13,31,60,0.95) 0%, rgba(10,22,40,0.95) 100%)',
  borderRadius: 18,
  padding: 28,
  minWidth: 380,
  border: '1px solid rgba(34,211,238,0.10)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

const cancelBtnStyle = {
  padding: '8px 16px',
  background: 'rgba(6,13,31,0.6)',
  border: '1px solid rgba(34,211,238,0.10)',
  borderRadius: 10,
  color: '#94a3b8',
  cursor: 'pointer',
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
};

const confirmBtnStyle = {
  padding: '8px 16px',
  background: 'rgba(34,211,238,0.12)',
  border: '1px solid rgba(34,211,238,0.25)',
  borderRadius: 10,
  color: '#22d3ee',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "'DM Sans', sans-serif",
};

const thStyle = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  background: 'rgba(13,31,60,0.4)',
  fontFamily: "'DM Sans', sans-serif",
};

const tdStyle = {
  padding: '10px 14px',
  fontSize: 13,
  color: '#94a3b8',
  fontFamily: "'DM Sans', sans-serif",
  borderBottom: '1px solid rgba(255,255,255,0.04)',
};
