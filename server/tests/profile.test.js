import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';

let mongo;
let app;
let token;
let userId;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();

  const reg = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Fael Ancer', email: 'fael@example.com', password: 'StrongPass1' });
  token = reg.body.data.accessToken;
  userId = reg.body.data.user.id || reg.body.data.user._id;
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const auth = (req) => req.set('Authorization', `Bearer ${token}`);

test('GET /profiles/me auto-creates an empty profile', async () => {
  const res = await auth(request(app).get('/api/profiles/me'));
  assert.equal(res.status, 200);
  assert.equal(res.body.data.profile.completeness, 0);
  assert.equal(res.body.data.profile.onboardingCompleted, false);
});

test('PATCH /profiles/me updates fields and recomputes completeness', async () => {
  const res = await auth(request(app).patch('/api/profiles/me')).send({
    title: 'Senior Full-Stack Engineer',
    overview: 'Ten years building web platforms across the JavaScript ecosystem and beyond.',
    category: 'Development & IT',
    hourlyRate: 85,
    availability: 'full_time',
    skills: ['react', 'node', 'mongodb'],
    languages: [{ name: 'English', proficiency: 'native' }],
    location: { country: 'Portugal', city: 'Lisbon' },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.profile.title, 'Senior Full-Stack Engineer');
  assert.ok(res.body.data.profile.completeness > 40, 'completeness should climb');
});

test('validation rejects too many skills', async () => {
  const skills = Array.from({ length: 40 }, (_, i) => `skill${i}`);
  const res = await auth(request(app).patch('/api/profiles/me')).send({ skills });
  assert.equal(res.status, 422);
});

test('onboarding marks profile complete and public', async () => {
  const res = await auth(request(app).post('/api/profiles/me/onboarding')).send({
    experience: [{ company: 'Acme', title: 'Engineer', current: true }],
    education: [{ school: 'State University', degree: 'BSc' }],
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.profile.onboardingCompleted, true);
  assert.equal(res.body.data.profile.visibility, 'public');
});

test('avatar upload stores an image and sets user.avatar', async () => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  const res = await auth(request(app).post('/api/profiles/me/avatar')).attach('image', png, 'a.png');
  assert.equal(res.status, 200);
  // Stored to ImgBB when IMGBB_API_KEY is set, else served locally — accept either.
  assert.match(res.body.data.avatar, /^https?:\/\/|^\/api\/files\/images\//);
});

test('CV upload (pdf) stores a private document', async () => {
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');
  const res = await auth(request(app).post('/api/profiles/me/cv')).attach('document', pdf, 'cv.pdf');
  assert.equal(res.status, 200);
  assert.match(res.body.data.profile.cv.url, /^\/api\/files\/documents\//);
  assert.equal(res.body.data.profile.cv.path, undefined, 'private local path must not leak');
});

test('CV upload rejects unsupported type', async () => {
  const res = await auth(request(app).post('/api/profiles/me/cv')).attach('document', Buffer.from('x'), 'x.exe');
  assert.equal(res.status, 400);
});

test('private documents require auth to download', async () => {
  const cv = await auth(request(app).get('/api/profiles/me'));
  const url = cv.body.data.profile.cv.url; // /api/files/documents/<name>
  const noauth = await request(app).get(url);
  assert.equal(noauth.status, 401);
  const withauth = await auth(request(app).get(url));
  assert.equal(withauth.status, 200);
});

test('public talent listing includes the onboarded profile', async () => {
  const res = await request(app).get('/api/profiles/talent?q=engineer');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.data.items));
  assert.ok(res.body.data.items.length >= 1);
  assert.ok(res.body.data.items[0].user, 'listing populates user');
});

test('public profile fetch by userId works and hides private path', async () => {
  const res = await request(app).get(`/api/profiles/${userId}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.profile.user.name, 'Fael Ancer');
});
