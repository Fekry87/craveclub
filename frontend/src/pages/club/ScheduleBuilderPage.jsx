import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  // Natural Sun→Sat order; RTL layouts flip it visually via the container's dir.
  const days = [
    { value: 0, label: 'Su' },
    { value: 1, label: 'Mo' },
    { value: 2, label: 'Tu' },
    { value: 3, label: 'We' },
    { value: 4, label: 'Th' },
    { value: 5, label: 'Fr' },
    { value: 6, label: 'Sa' },
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
                borderRadius: 20,
                border: `1px solid ${active ? '#0071E3' : '#E5E5EA'}`,
                background: active ? '#0071E3' : '#FFFFFF',
                color: active ? '#FFFFFF' : '#515154',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                fontFamily: 'var(--font-body)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
              }}
            >
              {d.label}
            </button>
          );
        })}
      </div>
      <div style={{
        fontSize: 11, color: '#6E6E73', marginTop: 8,
        fontFamily: 'var(--font-body)',
      }}>
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
      <div style={{
        color: '#6E6E73', textAlign: 'center', padding: 40, fontSize: 11,
        fontFamily: 'var(--font-body)',
      }}>
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
    if (!startDate || !endDate) return { border: '1px solid #E5E5EA', color: '#1D1D1F' };
    const d = new Date(dateStr);
    const inPeriod = d >= startDate && d <= endDate;
    if (!inPeriod) return { border: '1px solid #F2F2F7', color: '#6E6E73' };
    if (holidaySet.has(dateStr)) return { border: '1px solid #FF3B30', color: '#FF3B30' };
    if (generatedSet.has(dateStr)) return { border: '1px solid #E5E5EA', color: '#1D1D1F', cursor: 'pointer' };
    if (previewSet.has(dateStr)) return { border: '1px solid #E5E5EA', background: '#F2F2F7', color: '#1D1D1F' };
    return { border: '1px solid #E5E5EA', color: '#515154' };
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button type="button" onClick={prevMonth} style={navBtnStyle}>&lt;</button>
        <span style={{
          color: '#1D1D1F', fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 600,
          letterSpacing: '-0.02em', lineHeight: 1,
        }}>
          {monthNames[month]} {year}
        </span>
        <button type="button" onClick={nextMonth} style={navBtnStyle}>&gt;</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
        {dayLabels.map((l) => (
          <div key={l} style={{
            fontSize: 11, color: '#6E6E73', padding: '6px 0',
            fontFamily: 'var(--font-body)',
          }}>{l}</div>
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
                position: 'relative',
                padding: '8px 2px',
                fontSize: 12,
                fontFamily: 'var(--font-body)',
                transition: 'border-color 0.15s ease',
                cursor: clickable ? 'pointer' : 'default',
                ...style,
              }}
            >
              {day}
              {generatedSet.has(dateStr) && (
                <span style={{
                  position: 'absolute', bottom: 3, insetInlineEnd: 3,
                  width: 6, height: 6, borderRadius: 3, background: '#0071E3', display: 'block',
                }} />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        <Legend color="#F2F2F7" label="Session day" />
        <Legend color="#0071E3" label="Generated" />
        <Legend color="#FF3B30" label="Holiday" />
      </div>
    </div>
  );
}

const navBtnStyle = { borderRadius: 16,
  background: '#FFFFFF',
  border: '1px solid #AEAEB2',
  color: '#1D1D1F',
  width: 32,
  height: 32,
  cursor: 'pointer',
  fontSize: 13,
  fontFamily: 'var(--font-body)',
  transition: 'border-color 0.15s ease',
};

function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 10, height: 10, background: color, border: '1px solid #E5E5EA' }} />
      <span style={{
        fontSize: 11, color: '#6E6E73', fontFamily: 'var(--font-body)',
      }}>{label}</span>
    </div>
  );
}

// ── Holiday Dialog ─────────────────────────────────────────
function HolidayDialog({ date, onConfirm, onCancel, hasSession, t }) {
  const [reason, setReason] = useState('');
  return (
    <div style={overlayStyle}>
      <div style={dialogStyle}>
        <h3 style={{
          margin: '0 0 16px', color: '#1D1D1F', fontSize: 18,
          fontFamily: 'var(--font-display)', fontWeight: 600,
          letterSpacing: '-0.02em', lineHeight: 1,
        }}>Add Holiday: {date}</h3>
        {hasSession && (
          <div style={{ background: '#FFFFFF', border: '1px solid #FF9500', padding: '8px 12px', marginBottom: 12, color: '#FF9500', fontSize: 13, fontFamily: 'var(--font-body)' }}>
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
          <button type="button" className="pl-btn pl-btn-ghost" onClick={onCancel}>{t('actions.cancel')}</button>
          <button type="button" className="pl-btn pl-btn-primary" onClick={() => onConfirm(reason)}>{t('actions.confirm')}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function ScheduleBuilderPage() {
  const { t } = useTranslation();
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
        <div style={{ borderRadius: 14, position: 'fixed', top: 20, insetInlineEnd: 20, zIndex: 1000,
          background: '#FFFFFF',
          border: '1px solid #E5E5EA',
          padding: '14px 20px',
          color: '#1D1D1F', fontSize: 11,
          fontFamily: 'var(--font-body)',
          animation: 'fadeInUp 0.3s ease-out',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: '#0071E3', flexShrink: 0 }} />
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
          t={t}
        />
      )}

      <PageHeader title="Schedules" />

      {/* Error Banner */}
      {error && (
        <div style={{
          background: '#FFFFFF', border: '1px solid #FF3B30',
          padding: '12px 16px', marginBottom: 20,
          color: '#FF3B30', fontSize: 13, fontFamily: 'var(--font-body)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fadeInUp 0.3s ease-out',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{ flex: 1 }}>{error}</span>
          <button type="button" onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: 16, padding: 0 }}>x</button>
        </div>
      )}

      {/* Two-Column Builder */}
      <div className="schedule-builder-grid" style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 16, marginBottom: 22 }}>
        {/* Left Panel - Form */}
        <div style={{ borderRadius: 16,
          background: '#FFFFFF',
          border: '1px solid #E5E5EA',
          padding: '26px 28px',
          animation: 'fadeInUp 0.4s ease-out 0.1s both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ color: '#1D1D1F', fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {editingSchedule ? 'Edit Schedule' : 'New Schedule'}
            </h3>
            {editingSchedule && (
              <button type="button" className="pl-btn pl-btn-ghost pl-btn-sm" onClick={resetForm}>
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
                <span style={{ color: '#6E6E73', fontSize: 11, fontFamily: 'var(--font-body)',}}>to</span>
                <input
                  type="date"
                  value={form.period_end}
                  onChange={(e) => handleChange('period_end', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
              {durationDays > 0 && (
                <div style={{ fontSize: 11, color: durationDays > 365 ? '#FF3B30' : '#6E6E73', marginTop: 8, fontFamily: 'var(--font-body)',}}>
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
                  <span style={{ color: '#1D1D1F', fontSize: 12, minWidth: 56, textAlign: 'center', fontFamily: 'var(--font-body)',}}>
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
                  <option key={p.id} value={p.id}>{p.title || p.name}</option>
                ))}
              </select>
            </FieldGroup>

            {/* Action Buttons */}
            {editingSchedule ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="pl-btn pl-btn-primary"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {saving ? t('loading.saving') : t('actions.saveChanges')}
                </button>
                <button
                  type="button"
                  className="pl-btn pl-btn-ghost"
                  onClick={resetForm}
                  style={{ minWidth: 100, justifyContent: 'center' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="pl-btn pl-btn-primary"
                onClick={handleCreateAndPreview}
                disabled={previewing || saving}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {previewing ? 'Creating preview...' : 'Preview Schedule'}
              </button>
            )}
          </div>
        </div>

        {/* Right Panel - Calendar */}
        <div style={{ borderRadius: 16,
          background: '#FFFFFF',
          border: '1px solid #E5E5EA',
          padding: '26px 28px',
          animation: 'fadeInUp 0.4s ease-out 0.15s both',
        }}>
          <h3 style={{ color: '#1D1D1F', fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, margin: '0 0 18px', paddingBottom: 12, borderBottom: '1px solid #E5E5EA', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
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
            <div style={{ borderRadius: 16,
              marginTop: 20,
              background: '#F2F2F7',
              border: '1px solid #E5E5EA',
              padding: 16,
            }}>
              <div style={{
                color: '#1D1D1F', fontSize: 15, marginBottom: 10,
                fontFamily: 'var(--font-display)', fontWeight: 600,
                letterSpacing: '-0.02em', lineHeight: 1.2,
              }}>
                {previewData.total} sessions will be created in {durationDays} days
              </div>
              {previewData.holiday_dates?.length > 0 && (
                <div style={{
                  color: '#FF3B30', fontSize: 11, marginBottom: 12,
                  fontFamily: 'var(--font-body)',
                }}>
                  {previewData.holiday_dates.length} holiday(s) excluded
                </div>
              )}
              <button
                type="button"
                className="pl-btn pl-btn-accent"
                onClick={handleGenerate}
                disabled={generating}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {generating ? 'Generating...' : 'Confirm & Create Sessions'}
              </button>
            </div>
          )}

          {/* Generation Result */}
          {generatedResult && (
            <div style={{ borderRadius: 16,
              marginTop: 20,
              background: '#FFFFFF',
              border: '1px solid #E5E5EA',
              borderInlineStart: '3px solid #34C759',
              padding: 16,
            }}>
              <div style={{
                color: '#34C759', fontSize: 15,
                fontFamily: 'var(--font-display)', fontWeight: 600,
                letterSpacing: '-0.02em', lineHeight: 1.2,
              }}>
                {generatedResult.created} sessions created successfully
              </div>
              {generatedResult.skipped > 0 && (
                <div style={{
                  color: '#6E6E73', fontSize: 11, marginTop: 8,
                  fontFamily: 'var(--font-body)',
                }}>
                  {generatedResult.skipped} skipped (already exist or holiday)
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedules List Table */}
      <div style={{ borderRadius: 16,
        background: '#FFFFFF',
        border: '1px solid #E5E5EA',
        padding: '26px 28px',
        animation: 'fadeInUp 0.4s ease-out 0.2s both',
      }}>
        <h3 style={{ color: '#1D1D1F', fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, margin: '0 0 18px', paddingBottom: 12, borderBottom: '1px solid #E5E5EA', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
          Existing Schedules
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#515154' }}>
            <div style={{ width: 24, height: 24, border: '2px solid #E5E5EA', borderTopColor: '#1D1D1F', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
            <div style={{ fontSize: 11, color: '#6E6E73', fontFamily: 'var(--font-body)',}}>{t('loading.default')}</div>
          </div>
        ) : schedules.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 30, color: '#6E6E73', fontSize: 11,
            fontFamily: 'var(--font-body)',
          }}>
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
                  <tr key={s.id} style={{ borderBottom: '1px solid #E5E5EA' }}>
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
                        <button type="button" className="pl-btn pl-btn-ghost pl-btn-sm" onClick={() => handleEditSchedule(s)}>
                          Edit
                        </button>
                        {s.status === 'draft' && (
                          <button type="button" className="pl-btn pl-btn-secondary pl-btn-sm" onClick={() => handleGenerateFromTable(s.id)}>
                            Generate
                          </button>
                        )}
                        <button type="button" className="pl-btn pl-btn-danger pl-btn-sm" onClick={() => handleDeleteSchedule(s.id)}>
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
    draft: { color: '#6E6E73', border: '#AEAEB2' },
    active: { color: '#34C759', border: '#34C759' },
    completed: { color: '#1D1D1F', border: '#1D1D1F' },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{
      padding: '3px 10px', fontSize: 10,
      background: 'transparent', color: s.color, border: `1px solid ${s.border}`,
      fontFamily: 'var(--font-body)', letterSpacing: '-0.02em',
      display: 'inline-block',
    }}>
      {status}
    </span>
  );
}

// ── Field Group ────────────────────────────────────────────
function FieldGroup({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 11, color: '#6E6E73', marginBottom: 8,
        fontFamily: 'var(--font-body)',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Shared Styles ──────────────────────────────────────────
const inputStyle = { borderRadius: 16,
  width: '100%',
  height: 42,
  padding: '0 12px',
  background: '#FFFFFF',
  border: '1px solid #AEAEB2',
  color: '#1D1D1F',
  fontSize: 14,
  fontFamily: 'var(--font-body)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
};



const stepBtnStyle = { borderRadius: 16,
  width: 30,
  height: 30,
  border: '1px solid #AEAEB2',
  background: '#FFFFFF',
  color: '#1D1D1F',
  cursor: 'pointer',
  fontSize: 14,
  fontFamily: 'var(--font-body)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'border-color 0.15s ease',
};


const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(29,29,31,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999,
};

const dialogStyle = { borderRadius: 16,
  background: '#FFFFFF',
  padding: 28,
  minWidth: 380,
  border: '1px solid #E5E5EA',
};



const thStyle = {
  padding: '10px 14px',
  textAlign: 'start',
  fontSize: 11,
  fontWeight: 500,
  color: '#6E6E73',
  borderBottom: '1px solid #E5E5EA',
  background: '#FFFFFF',
  fontFamily: 'var(--font-body)',
};

const tdStyle = {
  padding: '10px 14px',
  fontSize: 13,
  color: '#1D1D1F',
  fontFamily: 'var(--font-body)',
  borderBottom: '1px solid #E5E5EA',
};
