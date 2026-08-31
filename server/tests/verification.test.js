import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { ROLES } from '../src/config/constants.js';

let mongo;
let app;
let token; // freelancer applicant
let adminToken;
let userId;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();

  const reg = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Vera Ify', email: 'vera@example.com', password: 'StrongPass1' });
  token = reg.body.data.accessToken;
  userId = reg.body.data.user.id || reg.body.data.user._id;

  // Create an admin directly, then log in for a token.
  const admin = new User({ name: 'Admin', email: 'admin-v@example.com', role: ROLES.ADMIN, roles: [ROLES.ADMIN], emailVerified: true });
  await admin.setPassword('StrongPass1');
  await admin.save();
  const login = await request(app).post('/api/auth/login').send({ email: 'admin-v@example.com', password: 'StrongPass1' });
  adminToken = login.body.data.accessToken;

  // Ensure applicant has a freelancer profile so badges persist there.
  await request(app).get('/api/profiles/me').set('Authorization', `Bearer ${token}`);
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const auth = (req, t = token) => req.set('Authorization', `Bearer ${t}`);

test('GET /verification/status starts unverified with no badges', async () => {
  const res = await auth(request(app).get('/api/verification/status'));
  assert.equal(res.status, 200);
  assert.equal(res.body.data.emailVerified, false);
  assert.equal(res.body.data.phoneVerified, false);
  assert.deepEqual(res.body.data.badges, []);
  assert.equal(res.body.data.verificationState, 'UNVERIFIED');
});

test('email resend + verify sets the email badge', async () => {
  const resend = await auth(request(app).post('/api/verification/email/resend'));
  assert.equal(resend.status, 200);
  const devToken = resend.body.data.devVerifyToken;
  assert.ok(devToken, 'dev verify token exposed in non-prod');

  const verify = await request(app).post('/api/auth/verify-email').send({ token: devToken });
  assert.equal(verify.status, 200);

  const status = await auth(request(app).get('/api/verification/status'));
  assert.ok(status.body.data.badges.includes('email_verified'));
});

test('phone send returns a dev code; wrong code rejected, correct code verifies', async () => {
  const send = await auth(request(app).post('/api/verification/phone/send')).send({ phone: '+1 555 0100' });
  assert.equal(send.status, 200);
  const code = send.body.data.devCode;
  assert.ok(/^\d{6}$/.test(code), 'six-digit dev code');

  const wrong = await auth(request(app).post('/api/verification/phone/verify')).send({ code: '000000' });
  assert.equal(wrong.status, 400);

  const good = await auth(request(app).post('/api/verification/phone/verify')).send({ code });
  assert.equal(good.status, 200);
  assert.equal(good.body.data.phoneVerified, true);

  const status = await auth(request(app).get('/api/verification/status'));
  assert.ok(status.body.data.badges.includes('phone_verified'));
});

test('submit identity request, block duplicate, then admin approves → verified badge', async () => {
  const submit = await auth(request(app).post('/api/verification/requests'))
    .field('type', 'identity')
    .field('note', 'Government ID attached')
    .attach('documents', Buffer.from('%PDF-1.4 fake id'), { filename: 'id.pdf', contentType: 'application/pdf' });
  assert.equal(submit.status, 201);
  const reqId = submit.body.data.request.id || submit.body.data.request._id;
  assert.equal(submit.body.data.request.status, 'pending');
  // Private path must not leak.
  assert.equal(submit.body.data.request.documents[0].path, undefined);

  const dup = await auth(request(app).post('/api/verification/requests'))
    .field('type', 'identity')
    .attach('documents', Buffer.from('again'), { filename: 'id2.pdf', contentType: 'application/pdf' });
  assert.equal(dup.status, 409);

  // Non-admin cannot see the queue.
  const forbidden = await auth(request(app).get('/api/verification/admin/requests'));
  assert.equal(forbidden.status, 403);

  // Admin sees the pending queue.
  const queue = await auth(request(app).get('/api/verification/admin/requests'), adminToken);
  assert.equal(queue.status, 200);
  assert.ok(queue.body.data.items.some((r) => (r.id || r._id) === reqId));

  // Admin approves.
  const decide = await auth(request(app).post(`/api/verification/admin/requests/${reqId}/decision`), adminToken).send({
    decision: 'approve',
    reviewNote: 'Verified against passport',
  });
  assert.equal(decide.status, 200);
  assert.equal(decide.body.data.request.status, 'approved');

  const status = await auth(request(app).get('/api/verification/status'));
  assert.ok(status.body.data.badges.includes('identity_verified'));
  assert.ok(status.body.data.badges.includes('verified'));
  assert.equal(status.body.data.verificationState, 'VERIFIED');
});

test('deciding an already-reviewed request is rejected', async () => {
  const submit = await auth(request(app).post('/api/verification/requests'))
    .field('type', 'document')
    .attach('documents', Buffer.from('doc'), { filename: 'cert.pdf', contentType: 'application/pdf' });
  const reqId = submit.body.data.request.id || submit.body.data.request._id;

  const first = await auth(request(app).post(`/api/verification/admin/requests/${reqId}/decision`), adminToken).send({ decision: 'reject', reviewNote: 'Illegible' });
  assert.equal(first.status, 200);
  const second = await auth(request(app).post(`/api/verification/admin/requests/${reqId}/decision`), adminToken).send({ decision: 'approve' });
  assert.equal(second.status, 400);
});

test('cancel a pending request', async () => {
  const submit = await auth(request(app).post('/api/verification/requests'))
    .field('type', 'document')
    .attach('documents', Buffer.from('doc2'), { filename: 'cert2.pdf', contentType: 'application/pdf' });
  const reqId = submit.body.data.request.id || submit.body.data.request._id;
  const cancel = await auth(request(app).delete(`/api/verification/requests/${reqId}`));
  assert.equal(cancel.status, 200);
  assert.equal(cancel.body.data.request.status, 'cancelled');
});

test('unauthenticated access is rejected', async () => {
  const res = await request(app).get('/api/verification/status');
  assert.equal(res.status, 401);
});
