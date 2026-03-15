import api from './axios';

export function getAnalytics() {
  return api.get('/club/analytics').then(r => r.data);
}
