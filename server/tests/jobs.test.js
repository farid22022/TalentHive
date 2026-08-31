import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';

let mongo;
let app;
let clientToken; // job poster
let otherToken; // a second user (freelancer/second client)
let jobId;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();

  const c = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Cli Ent', email: 'client@example.com', password: 'StrongPass1' });
  clientToken = c.body.data.accessToken;

  const o = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Otto User', email: 'other@example.com', password: 'StrongPass1' });
  otherToken = o.body.data.accessToken;
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const auth = (req, t) => req.set('Authorization', `Bearer ${t}`);

const jobPayload = {
  title: 'Build a React dashboard',
  description: 'We need an experienced React developer to build an analytics dashboard with charts.',
  category: 'Development & IT',
  skills: ['React', 'Node.js'],
  budget: { type: 'fixed', min: 500, max: 2000 },
  experienceLevel: 'expert',
  duration: 'medium',
};

test('POST /jobs requires auth', async () => {
  const res = await request(app).post('/api/jobs').send(jobPayload);
  assert.equal(res.status, 401);
});

test('POST /jobs creates an open job and grants the client role', async () => {
  const res = await auth(request(app).post('/api/jobs'), clientToken).send(jobPayload);
  assert.equal(res.status, 201);
  assert.equal(res.body.data.job.status, 'open');
  assert.equal(res.body.data.job.title, jobPayload.title);
  assert.equal(res.body.data.job.budget.max, 2000);
  jobId = res.body.data.job.id || res.body.data.job._id;
  assert.ok(jobId);

  // The poster should now hold the client role.
  const me = await auth(request(app).get('/api/auth/me'), clientToken);
  assert.ok((me.body.data.user.roles || []).includes('client'));
});

test('POST /jobs rejects invalid payload (422)', async () => {
  const res = await auth(request(app).post('/api/jobs'), clientToken).send({ title: 'x' });
  assert.equal(res.status, 422);
});

test('GET /jobs lists open jobs publicly (no auth)', async () => {
  const res = await request(app).get('/api/jobs');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.data.items));
  assert.ok(res.body.data.items.length >= 1);
  assert.ok(res.body.data.pagination);
});

test('GET /jobs filters by category and search', async () => {
  const byCat = await request(app).get('/api/jobs').query({ category: 'Development & IT' });
  assert.equal(byCat.status, 200);
  assert.ok(byCat.body.data.items.length >= 1);

  const search = await request(app).get('/api/jobs').query({ q: 'dashboard' });
  assert.equal(search.status, 200);
  assert.ok(search.body.data.items.length >= 1);

  const miss = await request(app).get('/api/jobs').query({ category: 'Legal' });
  assert.equal(miss.body.data.items.length, 0);
});

test('GET /jobs/:id returns a single open job', async () => {
  const res = await request(app).get(`/api/jobs/${jobId}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.job.id || res.body.data.job._id, jobId);
  assert.ok(res.body.data.job.client.name); // populated
});

test('PATCH /jobs/:id updates own job; non-owner is forbidden', async () => {
  const ok = await auth(request(app).patch(`/api/jobs/${jobId}`), clientToken).send({ title: 'Build a Vue dashboard' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.job.title, 'Build a Vue dashboard');

  const forbidden = await auth(request(app).patch(`/api/jobs/${jobId}`), otherToken).send({ title: 'Hijack' });
  assert.equal(forbidden.status, 403);
});

test('draft jobs are hidden from the public board and non-owners', async () => {
  const draft = await auth(request(app).post('/api/jobs'), clientToken).send({ ...jobPayload, title: 'Secret draft job', status: 'draft' });
  assert.equal(draft.status, 201);
  const draftId = draft.body.data.job.id || draft.body.data.job._id;

  // Not in public list.
  const list = await request(app).get('/api/jobs').query({ q: 'Secret draft' });
  assert.equal(list.body.data.items.length, 0);

  // Non-owner gets 404, owner can view.
  const asOther = await auth(request(app).get(`/api/jobs/${draftId}`), otherToken);
  assert.equal(asOther.status, 404);
  const asOwner = await auth(request(app).get(`/api/jobs/${draftId}`), clientToken);
  assert.equal(asOwner.status, 200);
});

test('save / list saved / unsave a job', async () => {
  const save = await auth(request(app).post(`/api/jobs/${jobId}/save`), otherToken);
  assert.equal(save.status, 200);
  assert.equal(save.body.data.saved, true);

  // Idempotent second save.
  await auth(request(app).post(`/api/jobs/${jobId}/save`), otherToken);

  const saved = await auth(request(app).get('/api/jobs/saved'), otherToken);
  assert.equal(saved.status, 200);
  assert.equal(saved.body.data.items.length, 1);
  assert.equal(saved.body.data.items[0].id || saved.body.data.items[0]._id, jobId);

  const unsave = await auth(request(app).delete(`/api/jobs/${jobId}/save`), otherToken);
  assert.equal(unsave.status, 200);
  const savedAfter = await auth(request(app).get('/api/jobs/saved'), otherToken);
  assert.equal(savedAfter.body.data.items.length, 0);
});

test('GET /jobs/mine returns only the caller’s jobs', async () => {
  const mine = await auth(request(app).get('/api/jobs/mine'), clientToken);
  assert.equal(mine.status, 200);
  assert.ok(mine.body.data.items.length >= 2); // open + draft
  for (const j of mine.body.data.items) assert.ok(j.title);

  const otherMine = await auth(request(app).get('/api/jobs/mine'), otherToken);
  assert.equal(otherMine.body.data.items.length, 0);
});

test('DELETE /jobs/:id removes own job; non-owner forbidden', async () => {
  const forbidden = await auth(request(app).delete(`/api/jobs/${jobId}`), otherToken);
  assert.equal(forbidden.status, 403);

  const del = await auth(request(app).delete(`/api/jobs/${jobId}`), clientToken);
  assert.equal(del.status, 200);

  const gone = await request(app).get(`/api/jobs/${jobId}`);
  assert.equal(gone.status, 404);
});

test('GET /jobs/:id with a bad id is a 422', async () => {
  const res = await request(app).get('/api/jobs/not-a-valid-id');
  assert.equal(res.status, 422);
});
