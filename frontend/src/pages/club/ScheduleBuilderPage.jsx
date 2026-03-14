import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
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
                border: active ? '2px solid #3b82f6' : '2px solid rgba(255,255,255,0.2)',
                background: active ? '#3b82f6' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {d.label}
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
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
      <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 40 }}>
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
    return { color: 'rgba(255,255,255,0.5)' };
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button type="button" onClick={prevMonth} style={navBtnStyle}>&lt;</button>
        <span style={{ fontWeight: 600, color: '#fff' }}>
          {monthNames[month]} {year}
        </span>
        <button type="button" onClick={nextMonth} style={navBtnStyle}>&gt;</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
        {dayLabels.map((l) => (
          <div key={l} style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', padding: '4px 0', fontWeight: 600 }}>{l}</div>
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
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff',
  borderRadius: 6,
  width: 32,
  height: 32,
  cursor: 'pointer',
  fontSize: 14,
};

function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
    </div>
  );
}

// ── Holiday Dialog ─────────────────────────────────────────
function HolidayDialog({ date, onConfirm, onCancel, hasSession }) {
  const [reason, setReason] = useState('');
  return (
    <div style={overlayStyle}>
      <div style={dialogStyle}>
        <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: 16 }}>Add Holiday: {date}</h3>
        {hasSession && (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, color: '#fbbf24', fontSize: 13 }}>
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
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 1000,
          background: 'linear-gradient(135deg, #059669, #10b981)',
          color: '#fff', padding: '12px 20px', borderRadius: 10,
          boxShadow: '0 8px 30px rgba(16,185,129,0.3)',
          fontSize: 14, fontWeight: 500, animation: 'fadeIn 0.3s ease',
        }}>
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

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#fff' }}>
          Recurring Schedule Builder
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
          Create repeating session schedules and generate sessions automatically
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          color: '#fca5a5', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>!</span>
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: 16 }}>x</button>
        </div>
      )}

      {/* Two-Column Builder */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24, marginBottom: 32 }}>
        {/* Left Panel - Form */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#fff' }}>
              {editingSchedule ? 'Edit Schedule' : 'New Schedule'}
            </h2>
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
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>to</span>
                <input
                  type="date"
                  value={form.period_end}
                  onChange={(e) => handleChange('period_end', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
              {durationDays > 0 && (
                <div style={{ fontSize: 12, color: durationDays > 365 ? '#f87171' : 'rgba(255,255,255,0.4)', marginTop: 4 }}>
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
                  <span style={{ color: '#fff', fontSize: 13, minWidth: 50, textAlign: 'center' }}>
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
                    background: 'linear-gradient(135deg, #059669, #10b981)',
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
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
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
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: 24,
        }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#fff' }}>
            Calendar Preview
          </h2>

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
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 12,
              padding: 16,
            }}>
              <div style={{ color: '#93c5fd', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                {previewData.total} sessions will be created in {durationDays} days
              </div>
              {previewData.holiday_dates?.length > 0 && (
                <div style={{ color: '#fca5a5', fontSize: 12, marginBottom: 8 }}>
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
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 12,
              padding: 16,
            }}>
              <div style={{ color: '#86efac', fontSize: 14, fontWeight: 600 }}>
                {generatedResult.created} sessions created successfully
              </div>
              {generatedResult.skipped > 0 && (
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>
                  {generatedResult.skipped} skipped (already exist or holiday)
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedules List Table */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, padding: 24,
      }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#fff' }}>
          Existing Schedules
        </h2>

        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 20 }}>Loading...</div>
        ) : schedules.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 20 }}>
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
    draft: { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af' },
    active: { bg: 'rgba(34,197,94,0.15)', color: '#86efac' },
    completed: { bg: 'rgba(20,184,166,0.15)', color: '#5eead4' },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500,
      background: s.bg, color: s.color,
    }}>
      {status}
    </span>
  );
}

// ── Field Group ────────────────────────────────────────────
function FieldGroup({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Shared Styles ──────────────────────────────────────────
const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const primaryBtnStyle = {
  width: '100%',
  padding: '12px',
  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  border: 'none',
  borderRadius: 10,
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const generateBtnStyle = {
  width: '100%',
  padding: '12px',
  background: 'linear-gradient(135deg, #059669, #10b981)',
  border: 'none',
  borderRadius: 10,
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const stepBtnStyle = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const smallBtnStyle = {
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.05)',
  color: '#93c5fd',
  cursor: 'pointer',
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999,
};

const dialogStyle = {
  background: '#1e293b',
  borderRadius: 16,
  padding: 24,
  minWidth: 360,
  border: '1px solid rgba(255,255,255,0.1)',
};

const cancelBtnStyle = {
  padding: '8px 16px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#fff',
  cursor: 'pointer',
  fontSize: 13,
};

const confirmBtnStyle = {
  padding: '8px 16px',
  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const thStyle = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.5)',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
};

const tdStyle = {
  padding: '10px 12px',
  fontSize: 13,
  color: 'rgba(255,255,255,0.8)',
};
