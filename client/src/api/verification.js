import { api } from './client.js';

export const verificationApi = {
  getStatus: () => api.get('/verification/status').then((r) => r.data.data),
  resendEmail: () => api.post('/verification/email/resend').then((r) => r.data.data),
  sendPhone: (phone) => api.post('/verification/phone/send', { phone }).then((r) => r.data.data),
  verifyPhone: (code) => api.post('/verification/phone/verify', { code }).then((r) => r.data.data),

  submitRequest: ({ type, note, files }, onProgress) => {
    const form = new FormData();
    form.append('type', type);
    if (note) form.append('note', note);
    (files || []).forEach((f) => form.append('documents', f));
    return api
      .post('/verification/requests', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress,
      })
      .then((r) => r.data.data.request);
  },
  myRequests: () => api.get('/verification/requests').then((r) => r.data.data.requests),
  cancelRequest: (id) => api.delete(`/verification/requests/${id}`).then((r) => r.data.data.request),

  // Admin
  adminQueue: (params) => api.get('/verification/admin/requests', { params }).then((r) => r.data.data),
  adminGetRequest: (id) => api.get(`/verification/admin/requests/${id}`).then((r) => r.data.data.request),
  adminDecide: (id, payload) =>
    api.post(`/verification/admin/requests/${id}/decision`, payload).then((r) => r.data.data.request),
};
