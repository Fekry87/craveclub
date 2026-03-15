import api from './axios';

export function getCoachPerformance() {
  return api.get('/club/coaches/performance').then(r => r.data);
}

export function getCoachDetail(coachId) {
  return api.get(`/club/coaches/${coachId}/performance`).then(r => r.data);
}

export function compareCoaches(ids) {
  const params = ids.map(id => `ids[]=${id}`).join('&');
  return api.get(`/club/coaches/performance/compare?${params}`).then(r => r.data);
}
