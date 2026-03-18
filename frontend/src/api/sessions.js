import api from './axios';

export const getSessions = (params = {}) =>
  api.get('/club/sessions', { params }).then(r => r.data);

export const getSession = (id) =>
  api.get(`/club/sessions/${id}`).then(r => r.data);

export const getSessionAttendance = (id) =>
  api.get(`/club/sessions/${id}/attendance`).then(r => r.data);
