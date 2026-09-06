import { api } from './client.js';
export const disputesApi = { list: () => api.get('/disputes').then((r) => r.data.data.disputes), create: (body) => api.post('/disputes', body).then((r) => r.data.data.dispute) };
