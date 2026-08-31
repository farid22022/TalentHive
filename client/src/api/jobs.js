import { api } from './client.js';

export const jobsApi = {
  // Public board
  list: (params) => api.get('/jobs', { params }).then((r) => r.data.data),
  getOne: (id) => api.get(`/jobs/${id}`).then((r) => r.data.data.job),

  // Client-owned
  create: (payload) => api.post('/jobs', payload).then((r) => r.data.data.job),
  update: (id, payload) => api.patch(`/jobs/${id}`, payload).then((r) => r.data.data.job),
  remove: (id) => api.delete(`/jobs/${id}`).then((r) => r.data.data),
  listMine: (params) => api.get('/jobs/mine', { params }).then((r) => r.data.data),

  // Saved jobs
  save: (id) => api.post(`/jobs/${id}/save`).then((r) => r.data.data),
  unsave: (id) => api.delete(`/jobs/${id}/save`).then((r) => r.data.data),
  listSaved: (params) => api.get('/jobs/saved', { params }).then((r) => r.data.data),
};
