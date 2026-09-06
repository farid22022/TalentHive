import { api } from './client.js';
export const adminApi = { dashboard: () => api.get('/admin/dashboard').then((r) => r.data.data), users: () => api.get('/admin/users').then((r) => r.data.data.users), status: (id, body) => api.patch(`/admin/users/${id}/status`, body) };
