import api from './axios';

export const getClubSportModules = () =>
  api.get('/club/sport-modules').then(r => r.data);

export const getClubSportModuleDetail = (id) =>
  api.get(`/club/sport-modules/${id}`).then(r => r.data);
