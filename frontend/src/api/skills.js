import api from './axios';

export const getSkills = (params) => api.get('/club/skills', { params });
export const createSkill = (data) => api.post('/club/skills', data);
export const updateSkill = (id, data) => api.put(`/club/skills/${id}`, data);
export const deleteSkill = (id) => api.delete(`/club/skills/${id}`);
