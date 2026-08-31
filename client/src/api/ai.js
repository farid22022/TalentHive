import { api } from './client.js';

export const aiApi = {
  analyzeCv: ({ text, force } = {}) =>
    api.post('/ai/cv/analyze', { text, force }).then((r) => r.data.data.analysis),
  getLatest: () => api.get('/ai/cv/latest').then((r) => r.data.data.analysis),
  listAnalyses: (params) => api.get('/ai/cv/analyses', { params }).then((r) => r.data.data),
  getAnalysis: (id) => api.get(`/ai/cv/analyses/${id}`).then((r) => r.data.data.analysis),
  deleteAnalysis: (id) => api.delete(`/ai/cv/analyses/${id}`).then((r) => r.data.data),
  applySkills: (id) => api.post(`/ai/cv/analyses/${id}/apply-skills`).then((r) => r.data.data),
};
