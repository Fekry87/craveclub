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
import { Badge } from '../../components/ui/Badge';
import { cardStyle, labelStyle } from '../../components/ui/styles';
import SkillPicker from '../../components/ui/SkillPicker';

const DIFFICULTY_VARIANTS = {
  beginner: 'success',
  intermediate: 'info',
  advanced: 'warning',
};

const STATUS_VARIANTS = {
  active: 'success',
  paused: 'warning',
  completed: 'neutral',
  cancelled: 'danger',
};

const captionStyle = { ...labelStyle };

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
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
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
                minWidth: 46, height: 36, padding: '0 14px', borderRadius: 980, border: 'none',
                background: form.duration_weeks === w ? '#0071E3' : '#F2F2F7',
                color: form.duration_weeks === w ? '#FFFFFF' : '#515154',
                fontSize: 13, fontWeight: 500,
                cursor: 'pointer', transition: 'background 0.15s ease, color 0.15s ease',
              }}>
                {w}
              </button>
            ))}
          </div>
          <div style={{ ...captionStyle, marginTop: 8 }}>{durationHelper(form.duration_weeks)}</div>
        </FormField>

        {/* Sessions per week */}
        <FormField label="Sessions per Week *">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" className="pl-icon-btn" onClick={() => updateField('sessions_per_week', Math.max(1, form.sessions_per_week - 1))} style={{ width: 42, height: 42, flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
            </button>
            <div style={{
              flex: 1, textAlign: 'center', fontSize: 34, fontWeight: 700, color: '#1D1D1F',
              fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              {form.sessions_per_week}
            </div>
            <button type="button" className="pl-icon-btn" onClick={() => updateField('sessions_per_week', Math.min(7, form.sessions_per_week + 1))} style={{ width: 42, height: 42, flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
        </FormField>

        {/* Template toggle (Manager only) */}
        {isManager && (
          <div style={{
            ...cardStyle,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px',
            marginBottom: 12, gap: 16,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: '#1D1D1F',
                lineHeight: 1.3,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: form.is_template ? '#0071E3' : '#AEAEB2', display: 'inline-block', flexShrink: 0 }} />
                Template plan
              </div>
              <div style={{ fontSize: 13, color: '#6E6E73', marginTop: 6 }}>
                {form.is_template ? 'Visible to all coaches in this club.' : 'Make this plan available to all coaches.'}
              </div>
            </div>
            <ToggleSwitch checked={form.is_template} onChange={() => updateField('is_template', !form.is_template)} />
          </div>
        )}

        {/* Phases editor */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ ...captionStyle, margin: 0 }}>
              Phases ({(form.phases || []).length})
            </h4>
            <Button type="button" variant="secondary" size="sm" onClick={addPhase}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
              Add Phase
            </Button>
          </div>

          {(form.phases || []).map((phase, pi) => (
            <div key={pi} style={{
              ...cardStyle, padding: 14, marginBottom: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ ...captionStyle, color: '#1D1D1F', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Phase
                </span>
                <button type="button" onClick={() => removePhase(pi)} style={iconBtn} aria-label="Remove phase">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
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
                  <button type="button" onClick={() => removeExercise(pi, ei)} style={iconBtn} aria-label="Remove exercise">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addExercise(pi)} style={{
                background: '#F2F2F7', border: 'none', borderRadius: 10, color: '#0071E3',
                fontSize: 13, fontWeight: 500,
                padding: '9px 12px', cursor: 'pointer', width: '100%',
                transition: 'background 0.15s ease',
              }}>
                + Add exercise
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
          <p style={{
            color: '#1D1D1F', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600,
            letterSpacing: '-0.015em', lineHeight: 1.2, margin: '0 0 10px',
          }}>Feature Disabled</p>
          <p style={{ color: '#6E6E73', fontSize: 14, margin: 0, maxWidth: 360, marginInline: 'auto' }}>
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
              height: 240, background: '#FFFFFF',
              border: '1px solid #E5E5EA',
              animation: `fadeIn 0.3s ease-out ${i * 0.08}s both`,
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
        <div style={{ ...emptyBoxStyle, borderColor: '#FF3B30' }}>
          <p style={{ color: '#FF3B30', fontSize: 14, margin: '0 0 16px' }}>{loadError}</p>
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
        <div style={{ display: 'flex', gap: 24, marginBottom: 20, borderBottom: '1px solid #E5E5EA' }}>
          {['plans', 'assignments'].map(t => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{
              padding: '10px 0', background: 'transparent', cursor: 'pointer',
              border: 'none', borderBottom: `2px solid ${tab === t ? '#1D1D1F' : 'transparent'}`,
              marginBottom: -1,
              color: tab === t ? '#1D1D1F' : '#6E6E73',
              fontFamily: 'var(--font-body)', fontSize: 12, letterSpacing: '-0.02em',
              transition: 'color 0.15s ease, border-color 0.15s ease',
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
              padding: '8px 16px', border: '1px solid',
              borderColor: filter === f.key ? '#1D1D1F' : '#E5E5EA',
              background: filter === f.key ? '#1D1D1F' : '#FFFFFF',
              color: filter === f.key ? '#F5F5F7' : '#6E6E73',
              cursor: 'pointer',
              transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
              fontFamily: 'var(--font-body)', fontSize: 12,
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
            <p style={{
              color: '#1D1D1F', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600,
              letterSpacing: '-0.02em', lineHeight: 1, margin: '0 0 10px',
            }}>No plans found</p>
            <p style={{ color: '#6E6E73', fontSize: 14, margin: '0 0 20px' }}>
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
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>}
        >
          {(editPlan.assignments_count ?? 0) > 0 && (
            <div style={{ padding: '12px 14px', background: '#FFFFFF', border: '1px solid #FF9500', marginBottom: 12 }}>
              <p style={{ color: '#FF9500', fontSize: 13, margin: 0, lineHeight: 1.6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" /></svg>
                This plan has {editPlan.assignments_count} active assignment{editPlan.assignments_count > 1 ? 's' : ''}.
              </p>
            </div>
          )}
          <div style={{ padding: '16px', background: '#FFFFFF', border: '1px solid #FF3B30', marginBottom: 4 }}>
            <p style={{ color: '#FF3B30', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
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
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6M23 11h-6" /></svg>}
        >
          {assignCoachPlan.coach_user_id && (
            <div style={{ padding: '12px 14px', background: '#FFFFFF', border: '1px solid #FF9500', marginBottom: 16, fontSize: 13, color: '#FF9500', lineHeight: 1.6 }}>
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
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>}
        >
          {/* Step 1: Toggle group vs individual */}
          <div style={{ display: 'flex', marginBottom: 16, border: '1px solid #E5E5EA' }}>
            {['group', 'swimmer'].map(t => (
              <button key={t} type="button" onClick={() => { setAssignType(t); setAssigneeId(''); }} style={{
                flex: 1, padding: '11px 16px', border: 'none', cursor: 'pointer',
                background: assignType === t ? '#1D1D1F' : 'transparent',
                color: assignType === t ? '#F5F5F7' : '#6E6E73',
                fontFamily: 'var(--font-body)', fontSize: 12,
                transition: 'background 0.15s ease, color 0.15s ease',
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
            <div style={{ borderRadius: 16, padding: '12px 14px', background: '#F2F2F7', border: '1px solid #E5E5EA', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={captionStyle}>End date</span>
              <strong style={{ color: '#1D1D1F', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500 }}>{computedEndDate()}</strong>
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
  const coachName = plan.coach?.name || (coaches || []).find(c => c.user_id === plan.coach_user_id || c.id === plan.coach_user_id)?.name;

  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#D2D2D7'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5EA'; }}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E5EA', borderRadius: 16,
        padding: 20, position: 'relative',
        transition: 'border-color 0.15s ease',
        animation: `fadeInUp 0.3s ease-out ${0.04 + index * 0.04}s both`,
      }}
    >
      {/* Index + template marker */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
        {plan.is_template && (
          <Badge variant="warning" label="Template" />
        )}
      </div>

      {/* Title + difficulty */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <div style={{
          fontSize: 18, fontWeight: 500, color: '#1D1D1F', fontFamily: 'var(--font-display)',
          letterSpacing: '-0.02em', lineHeight: 1, flex: 1, minWidth: 0,
        }}>
          {plan.title}
        </div>
        <span style={{ flexShrink: 0 }}>
          <Badge variant={DIFFICULTY_VARIANTS[plan.difficulty_level] || 'success'} label={plan.difficulty_level || 'beginner'} />
        </span>
      </div>

      {/* Duration info */}
      <div style={{ ...captionStyle, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6E6E73" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
        {plan.duration_weeks || 4} weeks &middot; {plan.sessions_per_week || 3} sessions/week
      </div>

      {/* Goals preview */}
      {plan.goals && (
        <div style={{ fontSize: 13, color: '#515154', marginBottom: 10, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {plan.goals.length > 80 ? plan.goals.substring(0, 80) + '...' : plan.goals}
        </div>
      )}

      {/* Phases count */}
      {(plan.phases?.length ?? 0) > 0 && (
        <div style={{ ...captionStyle, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          {plan.phases.length} phase{plan.phases.length > 1 ? 's' : ''}
        </div>
      )}

      {/* Manager: coach assignment info */}
      {isManager && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0', marginBottom: 2,
          borderTop: '1px solid #F2F2F7',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.coach_user_id ? '#6E6E73' : '#FF9500'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" />
          </svg>
          <span style={{ fontSize: 13, color: plan.coach_user_id ? '#1D1D1F' : '#FF9500' }}>
            {plan.coach_user_id ? (coachName || `Coach #${plan.coach_user_id}`) : 'Unassigned'}
          </span>
        </div>
      )}

      {/* Assignment count */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0', marginBottom: 4,
        borderTop: '1px solid #F2F2F7',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6E6E73" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
        <span style={{ fontSize: 13, color: '#1D1D1F' }}>
          {plan.assignments_count ?? plan.active_assignments_count ?? 0} assignment{(plan.assignments_count ?? 0) !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, paddingTop: 14, borderTop: '1px solid #E5E5EA', flexWrap: 'wrap' }}>
        {isManager && !plan.is_template && (
          <button type="button" onClick={onAssignCoach} title="Assign to Coach" aria-label="Assign to Coach"
            className="pl-icon-btn" style={actionBtnStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6M23 11h-6" /></svg>
          </button>
        )}
        {(isCoach || isManager) && (
          <button type="button" onClick={onAssignPlan} title="Assign to Group/Swimmer" aria-label="Assign to Group or Swimmer"
            className="pl-icon-btn" style={actionBtnStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
          </button>
        )}
        <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 6 }}>
          <button type="button" onClick={onEdit} title="Edit" aria-label="Edit"
            className="pl-icon-btn" style={actionBtnStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button type="button" onClick={onDelete} title="Delete" aria-label="Delete"
            className="pl-icon-btn" style={{ ...actionBtnStyle, color: '#FF3B30' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
        <p style={{
          color: '#1D1D1F', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600,
          letterSpacing: '-0.02em', lineHeight: 1, margin: '0 0 10px',
        }}>No assignments yet</p>
        <p style={{ color: '#6E6E73', fontSize: 14, margin: 0 }}>Assign a training plan to a group or swimmer to get started.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {assignments.map((a, i) => {
        const startDate = new Date(a.start_date);
        const endDate = new Date(a.end_date);
        const now = new Date();
        const totalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
        const elapsedDays = Math.max(0, Math.min(totalDays, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24))));
        const progress = Math.round((elapsedDays / totalDays) * 100);

        return (
          <div key={a.id} style={{
            background: '#FFFFFF',
            border: '1px solid #E5E5EA', borderRadius: 16,
            padding: 18,
            animation: `fadeInUp 0.3s ease-out ${0.04 + i * 0.04}s both`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 16, fontWeight: 500, color: '#1D1D1F', marginBottom: 6,
                  fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1,
                }}>
                  {a.training_plan?.title || 'Untitled Plan'}
                </div>
                <div style={{ fontSize: 13, color: '#515154' }}>
                  {a.group ? `Group: ${a.group.name}` : a.swimmer ? `${a.swimmer.first_name} ${a.swimmer.last_name}` : 'Unknown'}
                </div>
              </div>
              <span style={{ flexShrink: 0 }}>
                <Badge variant={STATUS_VARIANTS[a.status] || 'neutral'} label={a.status} />
              </span>
            </div>

            {/* Dates */}
            <div style={{ display: 'flex', gap: 16, ...captionStyle, marginBottom: 12 }}>
              <span>Start: {formatDate(startDate)}</span>
              <span>End: {formatDate(endDate)}</span>
            </div>

            {/* Progress bar */}
            {a.status === 'active' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', ...captionStyle, marginBottom: 6 }}>
                  <span>{elapsedDays} / {totalDays} days</span>
                  <span style={{ color: '#1D1D1F' }}>{progress}%</span>
                </div>
                <div style={{ height: 4, background: '#EDEDF0', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${progress}%`,
                    background: '#FFFFFF',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Coach notes */}
            {a.coach_notes && (
              <div style={{ borderRadius: 16, fontSize: 13, color: '#515154', marginBottom: 10, padding: '10px 12px', background: '#F2F2F7', borderInlineStart: '2px solid #AEAEB2', lineHeight: 1.5 }}>
                {a.coach_notes}
              </div>
            )}

            {/* Actions */}
            {a.status === 'active' && (
              <div style={{ display: 'flex', gap: 8, paddingTop: 14, borderTop: '1px solid #E5E5EA', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => onStatusUpdate(a, 'paused')} style={statusBtnStyle('#FF9500')}>
                  Pause
                </button>
                <button type="button" onClick={() => onStatusUpdate(a, 'completed')} style={statusBtnStyle('#34C759')}>
                  Complete
                </button>
                <button type="button" onClick={() => onStatusUpdate(a, 'cancelled')} style={statusBtnStyle('#FF3B30')}>
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
  const c = color || '#1D1D1F';
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={onChange} style={{
      position: 'relative', display: 'inline-flex', width: 44, height: 26, borderRadius: 13,
      background: checked ? '#34C759' : '#E5E5EA',
      border: 'none',
      cursor: 'pointer', transition: 'background 0.15s ease, border-color 0.15s ease', padding: 0, flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 2, insetInlineStart: checked ? 20 : 2,
        width: 18, height: 18, background: '#F5F5F7',
        transition: 'inset-inline-start 0.2s ease',
      }} />
    </button>
  );
}

/* ── Error Banner ── */
function ErrorBanner({ message }) {
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #FF3B30',
      padding: '12px 14px', marginTop: 16,
      fontSize: 13, color: '#FF3B30', display: 'flex', alignItems: 'center', gap: 8,
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="8" cy="8" r="7" stroke="#FF3B30" strokeWidth="1.5" />
        <path d="M8 5v3M8 10.5v.5" stroke="#FF3B30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {message}
    </div>
  );
}

/* ── Shared styles ── */
const emptyBoxStyle = { borderRadius: 16,
  textAlign: 'center', padding: '60px 20px',
  background: '#FFFFFF',
  border: '1px solid #E5E5EA',
};

const iconBtn = {
  background: 'transparent', border: 'none', cursor: 'pointer', padding: 4,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const actionBtnStyle = {
  width: 32, height: 32,
};

const statusBtnStyle = (color) => ({
  padding: '8px 14px',
  background: 'transparent', border: `1px solid ${color}`, color,
  fontFamily: 'var(--font-body)', fontSize: 12, letterSpacing: '-0.02em',
  cursor: 'pointer', transition: 'background 0.15s ease, color 0.15s ease',
});
