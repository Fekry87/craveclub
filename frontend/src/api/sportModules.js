import api from './axios';

export const getSportModules = () =>
  api.get('/corporate/sport-modules').then(r => r.data);

export const createSportModule = (data) =>
  api.post('/corporate/sport-modules', data).then(r => r.data);

export const updateSportModule = (id, data) =>
  api.put(`/corporate/sport-modules/${id}`, data).then(r => r.data);

export const deleteSportModule = (id) =>
  api.delete(`/corporate/sport-modules/${id}`).then(r => r.data);

export const getClubSportModules = (clubId) =>
  api.get(`/corporate/clubs/${clubId}/sport-modules`).then(r => r.data);

export const assignToClub = (clubId, sportModuleId) =>
  api.post(`/corporate/clubs/${clubId}/sport-modules`, { sport_module_id: sportModuleId }).then(r => r.data);

export const removeFromClub = (clubId, moduleId) =>
  api.delete(`/corporate/clubs/${clubId}/sport-modules/${moduleId}`).then(r => r.data);
