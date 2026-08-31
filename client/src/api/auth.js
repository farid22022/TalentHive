import { api } from './client.js';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data.data),
  logout: () => api.post('/auth/logout').then((r) => r.data.data),
  refresh: () => api.post('/auth/refresh').then((r) => r.data.data),
  me: () => api.get('/auth/me').then((r) => r.data.data),
  changePassword: (payload) => api.post('/auth/change-password', payload).then((r) => r.data.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((r) => r.data.data),
  resetPassword: (payload) => api.post('/auth/reset-password', payload).then((r) => r.data.data),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }).then((r) => r.data.data),
};

export const usersApi = {
  updateMe: (payload) => api.patch('/users/me', payload).then((r) => r.data.data),
};
