import api from './axios';

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
