import { api } from './client.js';
const unwrap = (r) => r.data.data;
export const matchingApi = { analyzeJob: (id) => api.post(`/ai/jobs/${id}/analyze`).then(unwrap), generate: (id) => api.post(`/ai/jobs/${id}/match`).then(unwrap), list: (id) => api.get(`/jobs/${id}/matches`).then(unwrap) };
