import api from './axios';

export const getPlans = () =>
  api.get('/club/subscription-plans').then(r => r.data);

export const createPlan = (data) =>
  api.post('/club/subscription-plans', data).then(r => r.data);

export const updatePlan = (id, data) =>
  api.put(`/club/subscription-plans/${id}`, data).then(r => r.data);

export const deletePlan = (id) =>
  api.delete(`/club/subscription-plans/${id}`).then(r => r.data);

export const togglePlan = (id) =>
  api.patch(`/club/subscription-plans/${id}/toggle-active`).then(r => r.data);

export const reorderPlans = (orderedIds) =>
  api.post('/club/subscription-plans/reorder', { ordered_ids: orderedIds }).then(r => r.data);
