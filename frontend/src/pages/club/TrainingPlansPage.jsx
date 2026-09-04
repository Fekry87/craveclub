import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
  getTrainingPlans, createPlan, updatePlan, deletePlan, assignPlanToCoach,
  managerAssignPlan, getManagerAssignments, managerUpdateAssignment,
  getCoachPlans, assignPlan, getCoachAssignments, updateAssignment,
} from '../../api/trainingPlans';
import api from '../../api/axios';
import { getSkills } from '../../api/skills';
import { formatDate } from '../../lib/dates';
import { PageHeader, Button, FormField, Input, Select, TextArea } from '../../components/CrudTable';
import { Modal, ModalActions } from '../../components/ui/Modal';
import { FormPage, FormPageActions } from '../../components/ui/FormPage';
import SkillPicker from '../../components/ui/SkillPicker';

const DIFFICULTY_COLORS = {
  beginner: { bg: 'rgba(45,212,191,0.1)', border: 'rgba(45,212,191,0.2)', text: '#2dd4bf' },
  intermediate: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', text: '#fbbf24' },
  advanced: { bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.2)', text: '#f43f5e' },
};

const STATUS_COLORS = {
  active: { bg: 'rgba(45,212,191,0.1)', border: 'rgba(45,212,191,0.2)', text: '#2dd4bf' },
  paused: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', text: '#fbbf24' },
  completed: { bg: 'rgba(34,211,238,0.1)', border: 'rgba(34,211,238,0.2)', text: '#22d3ee' },
  cancelled: { bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.2)', text: '#f43f5e' },
};

const DURATION_OPTIONS = [1, 2, 4, 8, 12, 16, 24, 52];

const durationHelper = (w) => {
  if (w < 4) return `${w} week${w > 1 ? 's' : ''}`;
  const m = Math.round(w / 4.33);
  return `${w} weeks ~ ${m} month${m > 1 ? 's' : ''}`;
};

const emptyPhase = { week_start: 1, week_end: 2, focus: '', exercises: [] };
const emptyExercise = { name: '', sets: '', reps: '', notes: '' };

const emptyForm = {
  title: '', goals: '', difficulty_level: 'beginner',
  duration_weeks: 4, sessions_per_week: 3,
  is_template: false, description: '',
  phases: [], items: [],
};

export default function TrainingPlansPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isManager = user?.role === 'CLUB_MANAGER';
  const isCoach = user?.role === 'COACH';

  const [plans, setPlans] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [groups, setGroups] = useState([]);
  const [swimmers, setSwimmers] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [skills, setSkills] = useState([]);
  const [tab, setTab] = useState('plans'); // plans | assignments
  const [filter, setFilter] = useState('all'); // all | unassigned | assigned | templates

  // Modal state
  const [modal, setModal] = useState(null);
  const [editPlan, setEditPlan] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Assign to coach
  const [assignCoachPlan, setAssignCoachPlan] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState('');

  // Assign to group/swimmer
  const [assignPlanId, setAssignPlanId] = useState(null);
  const [assignType, setAssignType] = useState('group');
  const [assigneeId, setAssigneeId] = useState('');
  const [assignStartDate, setAssignStartDate] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [swimmerSearch, setSwimmerSearch] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoadError('');
    try {
      if (isManager) {
        const [plansRes, coachesRes, groupsRes, swimmersRes, assignRes] = await Promise.all([
          getTrainingPlans(),
          api.get('/club/coaches'),
          api.get('/club/groups'),
          api.get('/club/swimmers'),
          getManagerAssignments(),
        ]);
        setPlans(plansRes.data?.data || plansRes.data || []);
        setCoaches(coachesRes.data?.data || coachesRes.data || []);
        setGroups(groupsRes.data?.data || groupsRes.data || []);
        setSwimmers(swimmersRes.data?.data || swimmersRes.data || []);
        setAssignments(assignRes.data?.data || assignRes.data || []);
      } else if (isCoach) {
        const [plansRes, assignRes, groupsRes, swimmersRes] = await Promise.all([
          getCoachPlans(),
          getCoachAssignments(),
          api.get('/coach/groups'),
          api.get('/coach/swimmers'),
        ]);
        setPlans(plansRes.data?.data || plansRes.data || []);
        setAssignments(assignRes.data?.data || assignRes.data || []);
        setGroups(groupsRes.data?.data || groupsRes.data || []);
        setSwimmers(swimmersRes.data?.data || swimmersRes.data || []);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setLoadError('feature_disabled');
      } else {
        setLoadError('Failed to load training plans.');
      }
    }
  };

  // ── Filtered plans ──
  const filteredPlans = (plans || []).filter(p => {
    if (filter === 'unassigned') return !p.coach_user_id && !p.is_template;
    if (filter === 'assigned') return !!p.coach_user_id;
    if (filter === 'templates') return p.is_template;
    return true;
  });

  // ── Create / Edit handlers ──
  const fetchSkills = () => {
    getSkills({ per_page: 200 }).then(r => setSkills(r.data?.data || [])).catch(() => {});
  };

  const openCreate = () => {
    setForm(emptyForm);
    setError('');
    setEditPlan(null);
    setModal('create');
    fetchSkills();
  };

  const openEdit = (plan) => {
    setForm({
      title: plan.title || '',
      goals: plan.goals || '',
      difficulty_level: plan.difficulty_level || 'beginner',
      duration_weeks: plan.duration_weeks || 4,
      sessions_per_week: plan.sessions_per_week || 3,
      is_template: plan.is_template || false,
      description: plan.description || '',
      phases: plan.phases || [],
      items: plan.items || [],
    });
    setError('');
    setEditPlan(plan);
    setModal('edit');
    fetchSkills();
  };

  const openDelete = (plan) => {
    setError('');
    setEditPlan(plan);
    setModal('delete');
  };

  const closeModal = () => {
    setModal(null);
    setEditPlan(null);
    setAssignCoachPlan(null);
    setAssignPlanId(null);
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        items: (form.items || []).map((item, i) => ({ ...item, sort_order: i + 1 })),
      };
      if (modal === 'create') {
        await createPlan(payload);
      } else {
        await updatePlan(editPlan.id, payload);
      }
      closeModal();
      loadData();
    } catch (err) {
      if (err.response?.status === 422) {
        const data = err.response.data;
        setError(data.errors ? Object.values(data.errors).map(a => a[0]).join('. ') : data.message || 'Validation failed.');
      } else {
        setError(err.response?.data?.message || 'Failed to save plan.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError('');
    try {
      await deletePlan(editPlan.id);
      closeModal();
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete plan.');
    } finally {
      setSaving(false);
    }
  };

  // ── Assign to coach (Manager) ──
  const openAssignCoach = (plan) => {
    setAssignCoachPlan(plan);
    setSelectedCoach(plan.coach_user_id || '');
    setError('');
    setModal('assign-coach');
  };

  const handleAssignCoach = async () => {
    setSaving(true);
    setError('');
    try {
      await assignPlanToCoach(assignCoachPlan.id, selectedCoach);
      closeModal();
      loadData();
    } catch (err) {
      if (err.response?.status === 422) {
        const data = err.response.data;
        setError(data.errors ? Object.values(data.errors).map(a => a[0]).join('. ') : data.message || 'Validation failed.');
      } else {
        setError(err.response?.data?.message || 'Failed to assign coach.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Assign to group/swimmer (Coach) ──
  const openAssignPlan = (plan) => {
    setAssignPlanId(plan.id);
    setAssignType('group');
    setAssigneeId('');
    setAssignStartDate(new Date().toISOString().split('T')[0]);
    setAssignNotes('');
    setSwimmerSearch('');
    setError('');
    setModal('assign-plan');
  };

  const computedEndDate = () => {
    if (!assignStartDate || !assignPlanId) return '';
    const plan = (plans || []).find(p => p.id === assignPlanId);
    if (!plan) return '';
    const d = new Date(assignStartDate);
    d.setDate(d.getDate() + (plan.duration_weeks || 4) * 7);
    return d.toISOString().split('T')[0];
  };

  const handleAssignPlan = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        assignee_type: assignType,
        assignee_id: Number(assigneeId),
        start_date: assignStartDate,
        notes: assignNotes || undefined,
      };
      if (isManager) {
        await managerAssignPlan(assignPlanId, payload);
      } else {
        await assignPlan(assignPlanId, payload);
      }
      closeModal();
      loadData();
    } catch (err) {
      if (err.response?.status === 422) {
        const data = err.response.data;
        setError(data.errors ? Object.values(data.errors).map(a => a[0]).join('. ') : data.message || 'Validation failed.');
      } else {
        setError(err.response?.data?.message || 'Failed to assign plan.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Assignment status update ──
  const handleStatusUpdate = async (assignment, newStatus) => {
    try {
      if (isManager) {
        await managerUpdateAssignment(assignment.id, { status: newStatus });
      } else {
        await updateAssignment(assignment.id, { status: newStatus });
      }
      loadData();
    } catch {
      // silent
    }
  };

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  // ── Phase editor helpers ──
  const addPhase = () => {
    const phases = [...(form.phases || [])];
    const lastEnd = phases.length > 0 ? phases[phases.length - 1].week_end : 0;
    phases.push({ ...emptyPhase, week_start: lastEnd + 1, week_end: lastEnd + 2 });
    updateField('phases', phases);
  };

  const updatePhase = (idx, key, value) => {
    const phases = [...form.phases];
    phases[idx] = { ...phases[idx], [key]: value };
    updateField('phases', phases);
  };

  const removePhase = (idx) => {
    updateField('phases', form.phases.filter((_, i) => i !== idx));
  };

  const addExercise = (phaseIdx) => {
    const phases = [...form.phases];
    phases[phaseIdx] = {
      ...phases[phaseIdx],
      exercises: [...(phases[phaseIdx].exercises || []), { ...emptyExercise }],
    };
    updateField('phases', phases);
  };

  const updateExercise = (phaseIdx, exIdx, key, value) => {
    const phases = [...form.phases];
    const exercises = [...phases[phaseIdx].exercises];
    exercises[exIdx] = { ...exercises[exIdx], [key]: value };
    phases[phaseIdx] = { ...phases[phaseIdx], exercises };
    updateField('phases', phases);
  };

  const removeExercise = (phaseIdx, exIdx) => {
    const phases = [...form.phases];
    phases[phaseIdx] = {
      ...phases[phaseIdx],
      exercises: phases[phaseIdx].exercises.filter((_, i) => i !== exIdx),
    };
    updateField('phases', phases);
  };

  // ── Filtered swimmers for search ──
  const filteredSwimmers = swimmers.filter(s => {
    const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
    return name.includes(swimmerSearch.toLowerCase());
  });

  // ── Create / Edit Plan Form Page ──
  if (modal === 'create' || modal === 'edit') {
    return (
      <FormPage
        title={modal === 'create' ? 'New Training Plan' : `Edit \u2014 ${editPlan?.title}`}
        onBack={closeModal}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
      >
        <FormField label="Plan Name *">
          <Input value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="e.g. Sprint Training, Endurance Plan" />
        </FormField>

        <FormField label="Goals">
          <TextArea value={form.goals} onChange={e => updateField('goals', e.target.value)} placeholder="Plan goals and objectives..." style={{ minHeight: 60 }} />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Difficulty *">
            <Select value={form.difficulty_level} onChange={e => updateField('difficulty_level', e.target.value)}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </FormField>
          <FormField label="Description">
            <Input value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="Optional" />
          </FormField>
        </div>

        {/* Duration weeks */}
        <FormField label="Duration (weeks) *">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {DURATION_OPTIONS.map(w => (
              <button key={w} type="button" onClick={() => updateField('duration_weeks', w)} style={{
                padding: '8px 14px', borderRadius: 10,
                border: form.duration_weeks === w ? '1px solid rgba(34,211,238,0.4)' : '1px solid rgba(51,65,85,0.3)',
                background: form.duration_weeks === w ? 'rgba(34,211,238,0.12)' : 'rgba(6,13,31,0.4)',
                color: form.duration_weeks === w ? '#22d3ee' : '#94a3b8',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {w}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{durationHelper(form.duration_weeks)}</div>
        </FormField>

        {/* Sessions per week */}
        <FormField label="Sessions per Week *">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" onClick={() => updateField('sessions_per_week', Math.max(1, form.sessions_per_week - 1))} style={stepperBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
            </button>
            <div style={{ flex: 1, textAlign: 'center', fontSize: 28, fontWeight: 800, color: '#22d3ee', fontFamily: "'Outfit', sans-serif" }}>
              {form.sessions_per_week}
            </div>
            <button type="button" onClick={() => updateField('sessions_per_week', Math.min(7, form.sessions_per_week + 1))} style={stepperBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
        </FormField>

        {/* Template toggle (Manager only) */}
        {isManager && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', borderRadius: 12,
            background: form.is_template ? 'rgba(251,191,36,0.06)' : 'rgba(6,13,31,0.4)',
            border: form.is_template ? '1px solid rgba(251,191,36,0.2)' : '1px solid rgba(51,65,85,0.3)',
            marginBottom: 12, transition: 'all 0.25s ease',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16 }}>&#128218;</span> Template Plan
              </div>
              <div style={{ fontSize: 12, color: form.is_template ? '#fbbf24' : '#64748b', marginTop: 2 }}>
                {form.is_template ? 'Visible to all coaches in this club.' : 'Make this plan available to all coaches.'}
              </div>
            </div>
            <ToggleSwitch checked={form.is_template} onChange={() => updateField('is_template', !form.is_template)} color="#fbbf24" />
          </div>
        )}

        {/* Phases editor */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ color: '#94a3b8', margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Phases ({(form.phases || []).length})
            </h4>
            <Button type="button" variant="secondary" onClick={addPhase}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Add Phase
            </Button>
          </div>

          {(form.phases || []).map((phase, pi) => (
            <div key={pi} style={{
              background: 'rgba(6,13,31,0.5)', padding: 14, borderRadius: 12, marginBottom: 10,
              border: '1px solid rgba(51,65,85,0.3)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#22d3ee' }}>Phase {pi + 1}</span>
                <button type="button" onClick={() => removePhase(pi)} style={iconBtn}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fda4af" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 8, marginBottom: 8 }}>
                <Input type="number" placeholder="Week start" value={phase.week_start} onChange={e => updatePhase(pi, 'week_start', Number(e.target.value))} />
                <Input type="number" placeholder="Week end" value={phase.week_end} onChange={e => updatePhase(pi, 'week_end', Number(e.target.value))} />
                <Input placeholder="Focus (e.g. Technique, Endurance)" value={phase.focus} onChange={e => updatePhase(pi, 'focus', e.target.value)} />
              </div>

              {/* Exercises */}
              {(phase.exercises || []).map((ex, ei) => (
                <div key={ei} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 6, marginBottom: 6 }}>
                  <SkillPicker
                    value={ex.name}
                    onChange={val => updateExercise(pi, ei, 'name', val)}
                    skills={skills}
                    onSkillCreated={newSkill => setSkills(prev => [...prev, newSkill])}
                  />
                  <Input placeholder="Sets" value={ex.sets} onChange={e => updateExercise(pi, ei, 'sets', e.target.value)} />
                  <Input placeholder="Reps" value={ex.reps} onChange={e => updateExercise(pi, ei, 'reps', e.target.value)} />
                  <button type="button" onClick={() => removeExercise(pi, ei)} style={iconBtn}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fda4af" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addExercise(pi)} style={{
                background: 'none', border: '1px dashed rgba(51,65,85,0.4)', borderRadius: 8,
                color: '#64748b', fontSize: 12, padding: '6px 12px', cursor: 'pointer', width: '100%',
              }}>
                + Add Exercise
              </button>
            </div>
          ))}
        </div>

        {error && <ErrorBanner message={error} />}

        <FormPageActions>
          <Button type="button" variant="secondary" onClick={closeModal}>{t('actions.cancel')}</Button>
          <Button type="button" disabled={saving || !form.title} onClick={handleSave}>
            {saving ? t('loading.saving') : modal === 'create' ? t('actions.create') : t('actions.saveChanges')}
          </Button>
        </FormPageActions>
      </FormPage>
    );
  }

  // ── Feature disabled ──
  if (loadError === 'feature_disabled') {
    return (
      <>
        <PageHeader title="Training Plans" />
        <div style={emptyBoxStyle}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>&#128274;</div>
          <p style={{ color: '#a78bfa', fontSize: 16, fontWeight: 600, margin: '0 0 6px' }}>Feature Disabled</p>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0, maxWidth: 360, marginInline: 'auto' }}>
            Training Plans are disabled for your club. Contact your platform admin to enable this feature.
          </p>
        </div>
      </>
    );
  }

  // ── Loading ──
  if (plans === null && !loadError) {
    return (
      <>
        <PageHeader title="Training Plans" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              height: 240, borderRadius: 18,
              background: 'linear-gradient(145deg, rgba(13,31,60,0.5) 0%, rgba(10,22,40,0.3) 100%)',
              border: '1px solid rgba(34,211,238,0.06)',
              animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </>
    );
  }

  // ── Error ──
  if (loadError) {
    return (
      <>
        <PageHeader title="Training Plans" />
        <div style={{ ...emptyBoxStyle, borderColor: 'rgba(244,63,94,0.15)' }}>
          <p style={{ color: '#fda4af', fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>{loadError}</p>
          <Button type="button" variant="secondary" onClick={loadData}>Retry</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Training Plans">
        {isManager && (
          <Button type="button" onClick={openCreate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            New Plan
          </Button>
        )}
      </PageHeader>

      {/* ── Tab bar (plans | assignments) ── */}
      {(isCoach || isManager) && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: 4, background: 'rgba(6,13,31,0.5)', borderRadius: 12, border: '1px solid rgba(51,65,85,0.2)' }}>
          {['plans', 'assignments'].map(t => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{
              flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: tab === t ? 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(6,182,212,0.08))' : 'transparent',
              color: tab === t ? '#22d3ee' : '#64748b',
              fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {t === 'plans' ? 'My Plans' : 'Assignments'}
            </button>
          ))}
        </div>
      )}

      {/* ── Manager filter tabs ── */}
      {isManager && tab === 'plans' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'unassigned', label: 'Unassigned' },
            { key: 'assigned', label: 'Assigned' },
            { key: 'templates', label: 'Templates' },
          ].map(f => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)} style={{
              padding: '7px 16px', borderRadius: 20, border: '1px solid',
              borderColor: filter === f.key ? 'rgba(34,211,238,0.3)' : 'rgba(51,65,85,0.3)',
              background: filter === f.key ? 'rgba(34,211,238,0.08)' : 'transparent',
              color: filter === f.key ? '#22d3ee' : '#94a3b8',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
            }}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Plans grid / Assignments table ── */}
      {tab === 'plans' && (
        filteredPlans.length === 0 ? (
          <div style={emptyBoxStyle}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>&#128203;</div>
            <p style={{ color: '#94a3b8', fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>No plans found</p>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>
              {isManager ? 'Create training plans for your coaches.' : 'No training plans available yet.'}
            </p>
            {isManager && <Button type="button" onClick={openCreate}>Create your first plan</Button>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {filteredPlans.map((plan, i) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={i}
                isManager={isManager}
                isCoach={isCoach}
                coaches={coaches}
                onEdit={() => openEdit(plan)}
                onDelete={() => openDelete(plan)}
                onAssignCoach={() => openAssignCoach(plan)}
                onAssignPlan={() => openAssignPlan(plan)}
              />
            ))}
          </div>
        )
      )}

      {/* ── Assignments table ── */}
      {(isCoach || isManager) && tab === 'assignments' && (
        <AssignmentsTable
          assignments={assignments}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {/* ── Delete Modal ── */}
      {modal === 'delete' && editPlan && (
        <Modal
          title={`Delete ${editPlan.title}?`}
          onClose={closeModal}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.8" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>}
        >
          {(editPlan.assignments_count ?? 0) > 0 && (
            <div style={{ padding: '12px 14px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, marginBottom: 12 }}>
              <p style={{ color: '#fbbf24', fontSize: 14, margin: 0, lineHeight: 1.6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" /></svg>
                This plan has {editPlan.assignments_count} active assignment{editPlan.assignments_count > 1 ? 's' : ''}.
              </p>
            </div>
          )}
          <div style={{ padding: '16px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 12, marginBottom: 4 }}>
            <p style={{ color: '#fda4af', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              This action cannot be undone. The plan and all its data will be permanently removed.
            </p>
          </div>
          {error && <ErrorBanner message={error} />}
          <ModalActions>
            <Button type="button" variant="secondary" onClick={closeModal}>{t('actions.cancel')}</Button>
            <Button type="button" variant="danger" disabled={saving} onClick={handleDelete}>
              {saving ? t('loading.deleting') : t('actions.delete')}
            </Button>
          </ModalActions>
        </Modal>
      )}

      {/* ── Assign to Coach Modal (Manager) ── */}
      {modal === 'assign-coach' && assignCoachPlan && (
        <Modal
          title={`Assign Coach \u2014 ${assignCoachPlan.title}`}
          onClose={closeModal}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6M23 11h-6" /></svg>}
        >
          {assignCoachPlan.coach_user_id && (
            <div style={{ padding: '10px 14px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, marginBottom: 16, fontSize: 13, color: '#fbbf24' }}>
              Currently assigned to: <strong>{assignCoachPlan.coach?.name || `Coach #${assignCoachPlan.coach_user_id}`}</strong>.
              Changing coach will not affect existing assignments.
            </div>
          )}
          <FormField label="Select Coach *">
            <Select value={selectedCoach} onChange={e => setSelectedCoach(e.target.value)}>
              <option value="">-- Select a coach --</option>
              {coaches.map(c => (
                <option key={c.id} value={c.user_id || c.id}>{c.user?.name || c.name || `Coach #${c.id}`}</option>
              ))}
            </Select>
          </FormField>
          {error && <ErrorBanner message={error} />}
          <ModalActions>
            <Button type="button" variant="secondary" onClick={closeModal}>{t('actions.cancel')}</Button>
            <Button type="button" disabled={saving || !selectedCoach} onClick={handleAssignCoach}>
              {saving ? t('loading.saving') : 'Assign Coach'}
            </Button>
          </ModalActions>
        </Modal>
      )}

      {/* ── Assign to Group/Swimmer Modal (Coach) ── */}
      {modal === 'assign-plan' && assignPlanId && (
        <Modal
          title="Assign Plan"
          onClose={closeModal}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>}
        >
          {/* Step 1: Toggle group vs individual */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: 4, background: 'rgba(6,13,31,0.5)', borderRadius: 12, border: '1px solid rgba(51,65,85,0.2)' }}>
            {['group', 'swimmer'].map(t => (
              <button key={t} type="button" onClick={() => { setAssignType(t); setAssigneeId(''); }} style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: assignType === t ? 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(6,182,212,0.08))' : 'transparent',
                color: assignType === t ? '#22d3ee' : '#64748b',
                fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
              }}>
                {t === 'group' ? 'Group' : 'Individual Swimmer'}
              </button>
            ))}
          </div>

          {/* Step 2: Select assignee */}
          {assignType === 'group' ? (
            <FormField label="Select Group *">
              <Select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                <option value="">-- Select a group --</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.swimmers_count ?? g.members_count ?? '?'} swimmers)</option>
                ))}
              </Select>
            </FormField>
          ) : (
            <FormField label="Select Swimmer *">
              <Input placeholder="Search swimmers..." value={swimmerSearch} onChange={e => setSwimmerSearch(e.target.value)} style={{ marginBottom: 8 }} />
              <Select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                <option value="">-- Select a swimmer --</option>
                {filteredSwimmers.map(s => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                ))}
              </Select>
            </FormField>
          )}

          {/* Step 3: Start date */}
          <FormField label="Start Date *">
            <Input type="date" value={assignStartDate} onChange={e => setAssignStartDate(e.target.value)} />
          </FormField>
          {assignStartDate && (
            <div style={{ padding: '10px 14px', background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.12)', borderRadius: 12, marginBottom: 12, fontSize: 13, color: '#94a3b8' }}>
              End date: <strong style={{ color: '#22d3ee' }}>{computedEndDate()}</strong>
            </div>
          )}

          {/* Step 4: Notes */}
          <FormField label="Coach Notes">
            <TextArea value={assignNotes} onChange={e => setAssignNotes(e.target.value)} placeholder="Optional notes for this assignment..." style={{ minHeight: 50 }} />
          </FormField>

          {error && <ErrorBanner message={error} />}
          <ModalActions>
            <Button type="button" variant="secondary" onClick={closeModal}>{t('actions.cancel')}</Button>
            <Button type="button" disabled={saving || !assigneeId || !assignStartDate} onClick={handleAssignPlan}>
              {saving ? t('loading.saving') : 'Assign Plan'}
            </Button>
          </ModalActions>
        </Modal>
      )}
    </>
  );
}

/* ── Plan Card ── */
function PlanCard({ plan, index, isManager, isCoach, coaches, onEdit, onDelete, onAssignCoach, onAssignPlan }) {
  const dc = DIFFICULTY_COLORS[plan.difficulty_level] || DIFFICULTY_COLORS.beginner;
  const coachName = plan.coach?.name || (coaches || []).find(c => c.user_id === plan.coach_user_id || c.id === plan.coach_user_id)?.name;

  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.2)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = plan.is_template ? 'rgba(251,191,36,0.15)' : 'rgba(34,211,238,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
      style={{
        background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
        border: plan.is_template ? '1px solid rgba(251,191,36,0.15)' : '1px solid rgba(34,211,238,0.06)',
        borderRadius: 18, padding: 20, position: 'relative', overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(6,13,31,0.3)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: `fadeInUp 0.4s ease-out ${0.05 + index * 0.06}s both`,
      }}
    >
      {/* Template badge */}
      {plan.is_template && (
        <div style={{
          position: 'absolute', top: 14, right: -32, transform: 'rotate(45deg)',
          background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#060d1f',
          fontSize: 10, fontWeight: 800, padding: '4px 40px',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          Template
        </div>
      )}

      {/* Title + difficulty */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', fontFamily: "'Outfit', sans-serif", flex: 1, paddingRight: plan.is_template ? 60 : 0 }}>
          {plan.title}
        </div>
        <span style={{
          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: dc.bg, border: `1px solid ${dc.border}`, color: dc.text,
          textTransform: 'capitalize', whiteSpace: 'nowrap',
        }}>
          {plan.difficulty_level || 'beginner'}
        </span>
      </div>

      {/* Duration info */}
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
        {plan.duration_weeks || 4} weeks &middot; {plan.sessions_per_week || 3} sessions/week
      </div>

      {/* Goals preview */}
      {plan.goals && (
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {plan.goals.length > 80 ? plan.goals.substring(0, 80) + '...' : plan.goals}
        </div>
      )}

      {/* Phases count */}
      {(plan.phases?.length ?? 0) > 0 && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', color: '#a78bfa', fontSize: 11, fontWeight: 600, marginBottom: 10 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          {plan.phases.length} phase{plan.phases.length > 1 ? 's' : ''}
        </div>
      )}

      {/* Manager: coach assignment info */}
      {isManager && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10,
          background: 'rgba(6,13,31,0.4)', marginBottom: 10,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.coach_user_id ? '#2dd4bf' : '#fbbf24'} strokeWidth="1.8" strokeLinecap="round">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" />
          </svg>
          <span style={{ fontSize: 13, color: plan.coach_user_id ? '#94a3b8' : '#fbbf24', fontWeight: 500 }}>
            {plan.coach_user_id ? (coachName || `Coach #${plan.coach_user_id}`) : 'Unassigned'}
          </span>
        </div>
      )}

      {/* Assignment count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, background: 'rgba(6,13,31,0.4)', marginBottom: 14 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
        <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
          {plan.assignments_count ?? plan.active_assignments_count ?? 0} assignment{(plan.assignments_count ?? 0) !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, paddingTop: 14, borderTop: '1px solid rgba(51,65,85,0.2)', flexWrap: 'wrap' }}>
        {isManager && !plan.is_template && (
          <button type="button" onClick={onAssignCoach} title="Assign to Coach"
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.2)'; }}
            style={actionBtnStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6M23 11h-6" /></svg>
          </button>
        )}
        {(isCoach || isManager) && (
          <button type="button" onClick={onAssignPlan} title="Assign to Group/Swimmer"
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,212,191,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.2)'; }}
            style={actionBtnStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
          </button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button type="button" onClick={onEdit} title="Edit"
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.2)'; }}
            style={actionBtnStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button type="button" onClick={onDelete} title="Delete"
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.2)'; }}
            style={actionBtnStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fda4af" strokeWidth="1.8" strokeLinecap="round"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Assignments Table (Coach) ── */
function AssignmentsTable({ assignments, onStatusUpdate }) {
  if (!assignments || assignments.length === 0) {
    return (
      <div style={emptyBoxStyle}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>&#128196;</div>
        <p style={{ color: '#94a3b8', fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>No assignments yet</p>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Assign a training plan to a group or swimmer to get started.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {assignments.map((a, i) => {
        const sc = STATUS_COLORS[a.status] || STATUS_COLORS.active;
        const startDate = new Date(a.start_date);
        const endDate = new Date(a.end_date);
        const now = new Date();
        const totalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
        const elapsedDays = Math.max(0, Math.min(totalDays, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24))));
        const progress = Math.round((elapsedDays / totalDays) * 100);

        return (
          <div key={a.id} style={{
            background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
            border: '1px solid rgba(34,211,238,0.06)',
            borderRadius: 16, padding: 18,
            animation: `fadeInUp 0.4s ease-out ${0.05 + i * 0.06}s both`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
                  {a.training_plan?.title || 'Untitled Plan'}
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>
                  {a.group ? `Group: ${a.group.name}` : a.swimmer ? `${a.swimmer.first_name} ${a.swimmer.last_name}` : 'Unknown'}
                </div>
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text,
                textTransform: 'capitalize',
              }}>
                {a.status}
              </span>
            </div>

            {/* Dates */}
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b', marginBottom: 10 }}>
              <span>Start: {formatDate(startDate)}</span>
              <span>End: {formatDate(endDate)}</span>
            </div>

            {/* Progress bar */}
            {a.status === 'active' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                  <span>{elapsedDays} / {totalDays} days</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(51,65,85,0.3)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, width: `${progress}%`,
                    background: 'linear-gradient(90deg, #22d3ee, #2dd4bf)',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Coach notes */}
            {a.coach_notes && (
              <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginBottom: 10, padding: '6px 10px', background: 'rgba(6,13,31,0.4)', borderRadius: 8 }}>
                {a.coach_notes}
              </div>
            )}

            {/* Actions */}
            {a.status === 'active' && (
              <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid rgba(51,65,85,0.2)' }}>
                <button type="button" onClick={() => onStatusUpdate(a, 'paused')} style={statusBtnStyle('#fbbf24')}>
                  Pause
                </button>
                <button type="button" onClick={() => onStatusUpdate(a, 'completed')} style={statusBtnStyle('#22d3ee')}>
                  Complete
                </button>
                <button type="button" onClick={() => onStatusUpdate(a, 'cancelled')} style={statusBtnStyle('#f43f5e')}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Toggle Switch ── */
function ToggleSwitch({ checked, onChange, color }) {
  const c = color || '#2dd4bf';
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={onChange} style={{
      position: 'relative', display: 'inline-flex', width: 44, height: 24, borderRadius: 12,
      background: checked ? c : 'rgba(51,65,85,0.4)',
      border: checked ? `1px solid ${c}40` : '1px solid rgba(51,65,85,0.5)',
      cursor: 'pointer', transition: 'all 0.25s ease', padding: 0, flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 2, insetInlineStart: checked ? 22 : 2,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'inset-inline-start 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }} />
    </button>
  );
}

/* ── Error Banner ── */
function ErrorBanner({ message }) {
  return (
    <div style={{
      background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
      borderRadius: 10, padding: '10px 14px', marginTop: 16,
      fontSize: 13, color: '#fda4af', display: 'flex', alignItems: 'center', gap: 8,
      animation: 'fadeInUp 0.3s ease-out',
    }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="8" cy="8" r="7" stroke="#f43f5e" strokeWidth="1.5" />
        <path d="M8 5v3M8 10.5v.5" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {message}
    </div>
  );
}

/* ── Shared styles ── */
const emptyBoxStyle = {
  textAlign: 'center', padding: '60px 20px',
  background: 'linear-gradient(145deg, rgba(13,31,60,0.4) 0%, rgba(10,22,40,0.2) 100%)',
  borderRadius: 18, border: '1px solid rgba(34,211,238,0.06)',
};

const stepperBtn = {
  width: 40, height: 40, borderRadius: 12,
  background: 'rgba(51,65,85,0.3)', border: '1px solid rgba(51,65,85,0.5)',
  color: '#94a3b8', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.2s',
};

const iconBtn = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const actionBtnStyle = {
  background: 'rgba(51,65,85,0.2)', border: '1px solid rgba(51,65,85,0.3)',
  borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.2s',
};

const statusBtnStyle = (color) => ({
  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
  background: `${color}10`, border: `1px solid ${color}30`, color,
  cursor: 'pointer', transition: 'all 0.2s',
});
