import api from './axios';

export const getSchedules = (params) => api.get('/club/recurring-schedules', { params });
export const createSchedule = (data) => api.post('/club/recurring-schedules', data);
export const showSchedule = (id) => api.get(`/club/recurring-schedules/${id}`);
export const updateSchedule = (id, data) => api.put(`/club/recurring-schedules/${id}`, data);
export const previewSchedule = (id) => api.get(`/club/recurring-schedules/${id}/preview`);
export const generateSchedule = (id) => api.post(`/club/recurring-schedules/${id}/generate`);
export const addHolidays = (id, dates, reason) =>
  api.post(`/club/recurring-schedules/${id}/holidays`, { dates, reason });
export const removeHoliday = (id, date) =>
  api.delete(`/club/recurring-schedules/${id}/holidays/${date}`);
export const deleteSchedule = (id) => api.delete(`/club/recurring-schedules/${id}`);
