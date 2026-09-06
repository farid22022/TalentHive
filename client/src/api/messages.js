import { api } from './client.js';

export const conversationsApi = {
  list: () => api.get('/conversations').then((r) => r.data.data.items),
  createOrOpen: (payload) => api.post('/conversations', payload).then((r) => r.data.data.conversation),
  getOne: (id) => api.get(`/conversations/${id}`).then((r) => r.data.data.conversation),
  listMessages: (id, params = {}) => api.get(`/conversations/${id}/messages`, { params }).then((r) => r.data.data.items),
  createMessage: (id, payload) => api.post(`/conversations/${id}/messages`, payload).then((r) => r.data.data.message),
  markRead: (id) => api.post(`/conversations/${id}/read`).then((r) => r.data.data),
};
