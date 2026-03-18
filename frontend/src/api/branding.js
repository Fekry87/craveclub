import api from './axios';

// Corporate endpoints (PLATFORM_ADMIN)
export const getClubBranding = (clubId) =>
  api.get(`/corporate/clubs/${clubId}`).then((r) => r.data);

export const updateClubBranding = (clubId, data) =>
  api.put(`/corporate/clubs/${clubId}/branding`, data).then((r) => r.data);

export const uploadBrandingFile = (clubId, file, type) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  return api
    .post(`/corporate/clubs/${clubId}/branding/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

// Club Manager endpoints (CLUB_MANAGER)
export const getOwnBranding = () =>
  api.get('/club/branding').then((r) => r.data);

export const updateOwnBranding = (data) =>
  api.put('/club/branding', data).then((r) => r.data);

export const uploadOwnBrandingFile = (file, type) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  return api
    .post('/club/branding/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};
