import api from './axios';

export function getNotifications(page = 1) {
  return api.get(`/notifications?page=${page}`).then(r => r.data);
}

export function markNotificationRead(id) {
  return api.put(`/notifications/${id}/read`).then(r => r.data);
}

export function markAllNotificationsRead() {
  return api.put('/notifications/read-all').then(r => r.data);
}
