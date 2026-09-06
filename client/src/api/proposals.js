import { api } from './client.js';

export const proposalsApi = {
  // Freelancer side
  create: (payload) => api.post('/proposals', payload).then((r) => r.data.data.proposal),
  update: (id, payload) => api.patch(`/proposals/${id}`, payload).then((r) => r.data.data.proposal),
  withdraw: (id) => api.post(`/proposals/${id}/withdraw`).then((r) => r.data.data.proposal),
  listMine: (params) => api.get('/proposals/mine', { params }).then((r) => r.data.data),

  // Client side
  listReceived: (params) => api.get('/proposals/received', { params }).then((r) => r.data.data),
  decide: (id, payload) => api.post(`/proposals/${id}/decision`, payload).then((r) => r.data.data.proposal),

  // Either party (author or job owner)
  getOne: (id) => api.get(`/proposals/${id}`).then((r) => r.data.data.proposal),
};
