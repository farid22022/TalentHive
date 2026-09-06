import { api } from './client.js';
export const applicantsApi = { list: (jobId) => api.get(`/jobs/${jobId}/applicants`).then((r) => r.data.data) };
