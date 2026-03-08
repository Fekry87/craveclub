import api from './axios';

export const getBranches = () =>
  api.get('/club/branches').then(r => r.data);

export const getBranch = (id) =>
  api.get(`/club/branches/${id}`).then(r => r.data);

export const createBranch = (data) =>
  api.post('/club/branches', data).then(r => r.data);

export const updateBranch = (id, data) =>
  api.put(`/club/branches/${id}`, data).then(r => r.data);

export const deleteBranch = (id) =>
  api.delete(`/club/branches/${id}`).then(r => r.data);

export const updateBranchFeatures = (id, features) =>
  api.put(`/club/branches/${id}/features`, features).then(r => r.data);

export const getAvailableCoaches = (branchId) =>
  api.get(`/club/branches/${branchId}/available-coaches`).then(r => r.data);

export const getAvailableSwimmers = (branchId) =>
  api.get(`/club/branches/${branchId}/available-swimmers`).then(r => r.data);

export const assignCoaches = (branchId, coachIds) =>
  api.post(`/club/branches/${branchId}/assign-coaches`, { coach_ids: coachIds }).then(r => r.data);

export const unassignCoaches = (branchId, coachIds) =>
  api.post(`/club/branches/${branchId}/unassign-coaches`, { coach_ids: coachIds }).then(r => r.data);

export const assignSwimmers = (branchId, swimmerIds) =>
  api.post(`/club/branches/${branchId}/assign-swimmers`, { swimmer_ids: swimmerIds }).then(r => r.data);

export const unassignSwimmers = (branchId, swimmerIds) =>
  api.post(`/club/branches/${branchId}/unassign-swimmers`, { swimmer_ids: swimmerIds }).then(r => r.data);
