import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';

let mongo; let app; let token;
const auth = (req) => req.set('Authorization', `Bearer ${token}`);

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();
  const response = await request(app).post('/api/auth/register').send({ name: 'Card Developer', email: 'card-dev@example.com', password: 'StrongPass1' });
  token = response.body.data.accessToken;
});

after(async () => { await mongoose.disconnect(); await mongo.stop(); });

test('creates an inactive card and exposes only masked card data', async () => {
  const response = await auth(request(app).get('/api/cards/me'));
  assert.equal(response.status, 200);
  assert.equal(response.body.data.card.status, 'inactive');
  assert.equal(response.body.data.card.balance, 0);
  assert.match(response.body.data.card.maskedCardNumber, /^4928 \*\*\*\* \*\*\*\* \d{4}$/);
  assert.equal(response.body.data.card.cardNumberHash, undefined);
});

test('failed reloads do not change balance; successful reload activates once minimum is reached', async () => {
  const failed = await auth(request(app).post('/api/wallet/reload')).set('Idempotency-Key', 'card-failed-1').send({ amount: 500, provider: 'NAGAD_SIMULATED', outcome: 'failed' });
  assert.equal(failed.status, 201);
  assert.equal(failed.body.data.payment.status, 'failed');
  assert.equal(failed.body.data.card.balance, 0);

  const first = await auth(request(app).post('/api/wallet/reload')).set('Idempotency-Key', 'card-success-1').send({ amount: 300, provider: 'BKASH_SIMULATED' });
  assert.equal(first.body.data.card.balance, 300);
  assert.equal(first.body.data.card.status, 'inactive');
  const duplicate = await auth(request(app).post('/api/wallet/reload')).set('Idempotency-Key', 'card-success-1').send({ amount: 300, provider: 'BKASH_SIMULATED' });
  assert.equal(duplicate.body.data.card.balance, 300);

  const second = await auth(request(app).post('/api/wallet/reload')).set('Idempotency-Key', 'card-success-2').send({ amount: 200, provider: 'ROCKET_SIMULATED' });
  assert.equal(second.body.data.card.balance, 500);
  assert.equal(second.body.data.card.status, 'active');
  const eligibility = await auth(request(app).get('/api/developers/me/eligibility'));
  assert.equal(eligibility.body.data.canApplyForJobs, true);
});

test('card actions require the owner and freezing disables work eligibility', async () => {
  const frozen = await auth(request(app).post('/api/cards/freeze')).send({});
  assert.equal(frozen.status, 200);
  assert.equal(frozen.body.data.card.status, 'suspended');
  const eligibility = await auth(request(app).get('/api/developers/me/eligibility'));
  assert.equal(eligibility.body.data.reason, 'CARD_SUSPENDED');
  const unfrozen = await auth(request(app).post('/api/cards/unfreeze')).send({});
  assert.equal(unfrozen.body.data.card.status, 'active');
});
