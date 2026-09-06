import { api } from './client.js';
const data = (request) => request.then((r) => r.data.data);
export const hiringApi = {
  offers: (params) => data(api.get('/offers', { params })),
  createOffer: (payload) => data(api.post('/offers', payload)),
  getOffer: (id) => data(api.get(`/offers/${id}`)),
  sendOffer: (id) => data(api.post(`/offers/${id}/send`)),
  acceptOffer: (id) => data(api.post(`/offers/${id}/accept`)),
  rejectOffer: (id) => data(api.post(`/offers/${id}/reject`)),
  requestChanges: (id, message) => data(api.post(`/offers/${id}/request-changes`, { message })),
  contracts: () => data(api.get('/contracts')),
  projects: () => data(api.get('/projects')),
  project: (id) => data(api.get(`/projects/${id}`)),
  startMilestone: (id) => data(api.post(`/milestones/${id}/start`)),
  submitWork: (id, payload) => data(api.post(`/milestones/${id}/submit`, payload)),
  submissions: (id) => data(api.get(`/milestones/${id}/submissions`)),
  approve: (id, feedback = '') => data(api.post(`/submissions/${id}/approve`, { feedback })),
  requestRevision: (id, feedback) => data(api.post(`/submissions/${id}/request-revision`, { feedback })),
};
