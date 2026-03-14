import api from './axios';

// Club Manager endpoints
export const getTrainingPlans = (params) => api.get('/club/plans', { params });
export const createPlan = (data) => api.post('/club/plans', data);
export const updatePlan = (id, data) => api.put(`/club/plans/${id}`, data);
export const deletePlan = (id) => api.delete(`/club/plans/${id}`);
export const assignPlanToCoach = (planId, coachUserId) =>
  api.post(`/club/training-plans/${planId}/assign-to-coach`, { coach_user_id: coachUserId });

// Coach endpoints
export const getCoachPlans = () => api.get('/coach/training-plans');
export const assignPlan = (planId, data) => api.post(`/coach/training-plans/${planId}/assign`, data);
export const getCoachAssignments = () => api.get('/coach/training-plans/assignments');
export const updateAssignment = (id, data) => api.patch(`/coach/training-plans/assignments/${id}`, data);
