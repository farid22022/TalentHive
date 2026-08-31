import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';

let mongo;
let app;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const creds = { name: 'Test User', email: 'test@example.com', password: 'StrongPass1' };

test('rejects registration with a weak password', async () => {
  const res = await request(app).post('/api/auth/register').send({ ...creds, password: 'weak' });
  assert.equal(res.status, 422);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('registers a new user and returns an access token (no passwordHash)', async () => {
  const res = await request(app).post('/api/auth/register').send(creds);
  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.accessToken);
  assert.equal(res.body.data.user.email, creds.email);
  assert.equal(res.body.data.user.passwordHash, undefined);
});

test('prevents duplicate email registration', async () => {
  const res = await request(app).post('/api/auth/register').send(creds);
  assert.equal(res.status, 409);
});

test('logs in with valid credentials and sets a refresh cookie', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: creds.email, password: creds.password });
  assert.equal(res.status, 200);
  assert.ok(res.body.data.accessToken);
  const cookies = res.headers['set-cookie'] || [];
  assert.ok(cookies.some((c) => c.startsWith('refreshToken=') && c.includes('HttpOnly')));
});

test('rejects login with wrong password', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: creds.email, password: 'WrongPass1' });
  assert.equal(res.status, 401);
});

test('protects /me and returns the current user with a valid token', async () => {
  const login = await request(app).post('/api/auth/login').send({ email: creds.email, password: creds.password });
  const token = login.body.data.accessToken;

  const unauth = await request(app).get('/api/auth/me');
  assert.equal(unauth.status, 401);

  const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.email, creds.email);
});

test('rotates refresh tokens and detects reuse', async () => {
  const login = await request(app).post('/api/auth/login').send({ email: creds.email, password: creds.password });
  const cookie = (login.headers['set-cookie'] || []).find((c) => c.startsWith('refreshToken='));

  const first = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
  assert.equal(first.status, 200);
  assert.ok(first.body.data.accessToken);

  // Reusing the original (now-rotated) cookie must be rejected.
  const reuse = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
  assert.equal(reuse.status, 401);
});
