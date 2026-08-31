import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';

let mongo;
let app;
let token;
let token2;

const SAMPLE_CV = `John Developer
Summary: Senior software engineer with 7 years of experience building web platforms.
Contact: john@example.com · linkedin.com/in/john
Experience: Led a team of 5, cut page load time by 40% at Acme Corp.
Skills: JavaScript, TypeScript, React, Node.js, MongoDB, AWS, Docker.
Education: BSc Computer Science, State University.`;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();

  const reg = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Ana Lyst', email: 'ana@example.com', password: 'StrongPass1' });
  token = reg.body.data.accessToken;

  const reg2 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Bob Other', email: 'bob@example.com', password: 'StrongPass1' });
  token2 = reg2.body.data.accessToken;

  // Ensure the primary user has a (empty) freelancer profile so apply-skills has a target.
  await request(app).get('/api/profiles/me').set('Authorization', `Bearer ${token}`);
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const auth = (req, t = token) => req.set('Authorization', `Bearer ${t}`);

test('POST /ai/cv/analyze (pasted text) returns a scored analysis with detected skills', async () => {
  const res = await auth(request(app).post('/api/ai/cv/analyze')).send({ text: SAMPLE_CV });
  assert.equal(res.status, 201);
  const a = res.body.data.analysis;
  assert.equal(a.feature, 'cv_analysis');
  assert.ok(a.result.overallScore > 0 && a.result.overallScore <= 100);
  assert.ok(a.result.detectedSkills.includes('react'));
  assert.equal(a.result.seniority, 'senior'); // 7 years
  assert.ok(a.result.disclaimer.length > 0, 'advisory disclaimer present');
});

test('identical text is served from cache (same _id, no new history row)', async () => {
  const first = await auth(request(app).post('/api/ai/cv/analyze')).send({ text: SAMPLE_CV });
  const before = await auth(request(app).get('/api/ai/cv/analyses'));
  const totalBefore = before.body.data.pagination.total;

  const second = await auth(request(app).post('/api/ai/cv/analyze')).send({ text: SAMPLE_CV });
  assert.equal(second.body.data.analysis._id || second.body.data.analysis.id, first.body.data.analysis._id || first.body.data.analysis.id);

  const after = await auth(request(app).get('/api/ai/cv/analyses'));
  assert.equal(after.body.data.pagination.total, totalBefore, 'cache hit must not add history');
});

test('force:true creates a new analysis', async () => {
  const before = await auth(request(app).get('/api/ai/cv/analyses'));
  const res = await auth(request(app).post('/api/ai/cv/analyze')).send({ text: SAMPLE_CV, force: true });
  assert.equal(res.status, 201);
  const after = await auth(request(app).get('/api/ai/cv/analyses'));
  assert.equal(after.body.data.pagination.total, before.body.data.pagination.total + 1);
});

test('analyze without CV or text is rejected', async () => {
  const res = await auth(request(app).post('/api/ai/cv/analyze'), token2).send({});
  assert.equal(res.status, 400);
});

test('history + get-by-id are owner-scoped', async () => {
  const list = await auth(request(app).get('/api/ai/cv/analyses'));
  const id = list.body.data.items[0]._id || list.body.data.items[0].id;

  const mine = await auth(request(app).get(`/api/ai/cv/analyses/${id}`));
  assert.equal(mine.status, 200);

  const others = await auth(request(app).get(`/api/ai/cv/analyses/${id}`), token2);
  assert.equal(others.status, 404, "another user cannot read someone else's analysis");
});

test('apply-skills merges suggested skills into the profile', async () => {
  const list = await auth(request(app).get('/api/ai/cv/analyses'));
  const analysis = list.body.data.items[0];
  const id = analysis._id || analysis.id;

  const res = await auth(request(app).post(`/api/ai/cv/analyses/${id}/apply-skills`));
  assert.equal(res.status, 200);
  const skills = res.body.data.profile.skills.map((s) => s.toLowerCase());
  for (const s of analysis.result.suggestedSkills) {
    assert.ok(skills.includes(s.toLowerCase()), `profile should now include ${s}`);
  }
});

test('GET /ai/cv/latest returns the most recent analysis', async () => {
  const res = await auth(request(app).get('/api/ai/cv/latest'));
  assert.equal(res.status, 200);
  assert.ok(res.body.data.analysis, 'latest analysis present');
});

test('DELETE removes an analysis', async () => {
  const list = await auth(request(app).get('/api/ai/cv/analyses'));
  const id = list.body.data.items[0]._id || list.body.data.items[0].id;
  const del = await auth(request(app).delete(`/api/ai/cv/analyses/${id}`));
  assert.equal(del.status, 200);
  const gone = await auth(request(app).get(`/api/ai/cv/analyses/${id}`));
  assert.equal(gone.status, 404);
});

test('unauthenticated requests are rejected', async () => {
  const res = await request(app).post('/api/ai/cv/analyze').send({ text: SAMPLE_CV });
  assert.equal(res.status, 401);
});
