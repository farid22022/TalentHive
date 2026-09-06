import { api } from './client.js';

const data = (request) => request.then((response) => response.data.data);
export const virtualCardApi = {
  getMine: () => data(api.get('/cards/me')).then((result) => result.card),
  create: () => data(api.post('/cards/create')).then((result) => result.card),
  reload: ({ amount, provider, outcome = 'success', idempotencyKey }) => data(api.post('/wallet/reload', { amount, provider, outcome }, { headers: { 'Idempotency-Key': idempotencyKey } })),
  transactions: () => data(api.get('/cards/me/transactions')).then((result) => result.transactions),
  wallet: () => data(api.get('/wallet/me')).then((result) => result.wallet),
  eligibility: () => data(api.get('/developers/me/eligibility')),
  freeze: () => data(api.post('/cards/freeze')).then((result) => result.card),
  unfreeze: () => data(api.post('/cards/unfreeze')).then((result) => result.card),
};
