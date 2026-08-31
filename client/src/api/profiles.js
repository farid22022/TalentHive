import { api } from './client.js';

export const profilesApi = {
  // Own profile
  getMine: () => api.get('/profiles/me').then((r) => r.data.data.profile),
  updateMine: (payload) => api.patch('/profiles/me', payload).then((r) => r.data.data.profile),
  completeOnboarding: (payload) => api.post('/profiles/me/onboarding', payload).then((r) => r.data.data.profile),
  removeCv: () => api.delete('/profiles/me/cv').then((r) => r.data.data.profile),

  uploadAvatar: (file, onProgress) => {
    const form = new FormData();
    form.append('image', file);
    return api
      .post('/profiles/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress,
      })
      .then((r) => r.data.data);
  },

  uploadCv: (file, onProgress) => {
    const form = new FormData();
    form.append('document', file);
    return api
      .post('/profiles/me/cv', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress,
      })
      .then((r) => r.data.data.profile);
  },

  // Public
  getPublic: (userId) => api.get(`/profiles/${userId}`).then((r) => r.data.data.profile),
  listTalent: (params) => api.get('/profiles/talent', { params }).then((r) => r.data.data),
};
