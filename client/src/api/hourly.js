import { api } from './client.js';
export const hourlyApi = {
  summary: (id) => api.get(`/hourly-contracts/${id}/time-summary`).then((r) => r.data.data),
  start: (contractId) => api.post('/time-tracking/start', { contractId }).then((r) => r.data.data.timer),
  heartbeat: (timerId) => api.post(`/time-tracking/${timerId}/heartbeat`).then((r) => r.data.data.timer),
  stop: (timerId, body) => api.post(`/time-tracking/${timerId}/stop`, body).then((r) => r.data.data.entry),
  add: (id, body) => api.post(`/contracts/${id}/time-entries`, body).then((r) => r.data.data.entry),
  invoice: (id, body) => api.post(`/hourly-contracts/${id}/invoices`, body).then((r) => r.data.data.invoice),
};
