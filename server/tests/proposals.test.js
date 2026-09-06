import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';

let mongo;
let app;
let clientToken; // job poster
let freelancerToken; // applicant
let thirdToken; // unrelated user
let jobId;
let draftJobId;
let proposalId;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();

  const c = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Pia Poster', email: 'poster@example.com', password: 'StrongPass1' });
  clientToken = c.body.data.accessToken;

  const f = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Fred Lancer', email: 'fred@example.com', password: 'StrongPass1' });
  freelancerToken = f.body.data.accessToken;
  await auth(request(app).post('/api/wallet/reload'), freelancerToken)
    .set('Idempotency-Key', 'proposal-fixture-reload')
    .send({ amount: 500, provider: 'BKASH_SIMULATED' });

  const t = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Thea Third', email: 'thea@example.com', password: 'StrongPass1' });
  thirdToken = t.body.data.accessToken;

  const job = await auth(request(app).post('/api/jobs'), clientToken).send({
    title: 'Build a booking widget',
    description: 'We need a small embeddable booking widget with availability rules and email confirmations.',
    category: 'Development & IT',
    skills: ['React', 'Node.js'],
    budget: { type: 'fixed', min: 800, max: 1600 },
    experienceLevel: 'intermediate',
    duration: 'short',
  });
  jobId = job.body.data.job.id || job.body.data.job._id;

  const draft = await auth(request(app).post('/api/jobs'), clientToken).send({
    title: 'Unpublished idea',
    description: 'A draft posting that should not accept proposals until it is published to the board.',
    category: 'Development & IT',
    skills: ['Figma'],
    budget: { type: 'fixed', min: 100, max: 200 },
    status: 'draft',
  });
  draftJobId = draft.body.data.job.id || draft.body.data.job._id;
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const auth = (req, t) => req.set('Authorization', `Bearer ${t}`);

const proposalPayload = {
  coverLetter:
    'I have shipped several embeddable widgets with React and Node, including availability logic and ' +
    'transactional email, and I can deliver this one in reviewable increments.',
  bid: { amount: 1200, type: 'fixed', currency: 'USD' },
  estimatedDays: 14,
  milestones: [{ title: 'Widget skeleton + availability rules', amount: 600 }],
};

const jobProposalsCount = async (id) => {
  const res = await request(app).get(`/api/jobs/${id}`);
  return res.body.data.job.proposalsCount;
};

test('POST /proposals requires auth', async () => {
  const res = await request(app).post('/api/proposals').send({ job: jobId, ...proposalPayload });
  assert.equal(res.status, 401);
});

test('POST /proposals rejects an invalid payload (422)', async () => {
  const res = await auth(request(app).post('/api/proposals'), freelancerToken).send({
    job: jobId,
    coverLetter: 'too short',
    bid: { amount: 100 },
  });
  assert.equal(res.status, 422);
});

test('POST /proposals creates a proposal, grants the freelancer role, and bumps proposalsCount', async () => {
  const before = await jobProposalsCount(jobId);

  const res = await auth(request(app).post('/api/proposals'), freelancerToken).send({ job: jobId, ...proposalPayload });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.proposal.status, 'submitted');
  assert.equal(res.body.data.proposal.bid.amount, 1200);
  assert.equal(res.body.data.proposal.milestones.length, 1);
  proposalId = res.body.data.proposal.id || res.body.data.proposal._id;
  assert.ok(proposalId);

  const me = await auth(request(app).get('/api/auth/me'), freelancerToken);
  assert.ok((me.body.data.user.roles || []).includes('freelancer'));

  assert.equal(await jobProposalsCount(jobId), before + 1);
});

test('a second proposal for the same job is a 409', async () => {
  const res = await auth(request(app).post('/api/proposals'), freelancerToken).send({ job: jobId, ...proposalPayload });
  assert.equal(res.status, 409);
});

test('the job owner cannot apply to their own job (400)', async () => {
  const res = await auth(request(app).post('/api/proposals'), clientToken).send({ job: jobId, ...proposalPayload });
  assert.equal(res.status, 400);
});

test('a non-open job does not accept proposals (400)', async () => {
  const res = await auth(request(app).post('/api/proposals'), freelancerToken).send({
    job: draftJobId,
    ...proposalPayload,
  });
  assert.equal(res.status, 400);
});

test('GET /proposals/mine lists only the caller’s proposals', async () => {
  const mine = await auth(request(app).get('/api/proposals/mine'), freelancerToken);
  assert.equal(mine.status, 200);
  assert.equal(mine.body.data.items.length, 1);
  assert.equal(mine.body.data.items[0].job.title, 'Build a booking widget'); // populated
  assert.ok(mine.body.data.pagination);

  // The ?job filter answers "did I already apply to this job?".
  const filtered = await auth(request(app).get('/api/proposals/mine'), freelancerToken).query({ job: jobId });
  assert.equal(filtered.body.data.items.length, 1);

  const otherUser = await auth(request(app).get('/api/proposals/mine'), thirdToken);
  assert.equal(otherUser.body.data.items.length, 0);
});

test('GET /proposals/received is scoped to the caller’s own jobs', async () => {
  const received = await auth(request(app).get('/api/proposals/received'), clientToken);
  assert.equal(received.status, 200);
  assert.equal(received.body.data.items.length, 1);
  assert.equal(received.body.data.items[0].freelancer.name, 'Fred Lancer'); // populated
  assert.ok('freelancerProfile' in received.body.data.items[0]); // profile snippet merged in

  const none = await auth(request(app).get('/api/proposals/received'), thirdToken);
  assert.equal(none.body.data.items.length, 0);
});

test('GET /proposals/:id is visible to author and job owner, hidden from everyone else', async () => {
  const asAuthor = await auth(request(app).get(`/api/proposals/${proposalId}`), freelancerToken);
  assert.equal(asAuthor.status, 200);
  assert.equal(asAuthor.body.data.proposal.viewedAt, null); // the author reading it is not a review

  const asOwner = await auth(request(app).get(`/api/proposals/${proposalId}`), clientToken);
  assert.equal(asOwner.status, 200);
  assert.ok(asOwner.body.data.proposal.viewedAt); // client's first read is recorded

  const asStranger = await auth(request(app).get(`/api/proposals/${proposalId}`), thirdToken);
  assert.equal(asStranger.status, 404); // 404, not 403 — existence is not leaked
});

test('PATCH /proposals/:id is author-only', async () => {
  const ok = await auth(request(app).patch(`/api/proposals/${proposalId}`), freelancerToken).send({
    bid: { amount: 1400, type: 'fixed' },
    estimatedDays: 10,
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.proposal.bid.amount, 1400);
  assert.equal(ok.body.data.proposal.estimatedDays, 10);
  assert.equal(ok.body.data.proposal.milestones.length, 1); // untouched by a partial patch

  const forbidden = await auth(request(app).patch(`/api/proposals/${proposalId}`), clientToken).send({
    bid: { amount: 1, type: 'fixed' },
  });
  assert.equal(forbidden.status, 403);
});

test('POST /proposals/:id/decision is job-owner-only and drives the review trail', async () => {
  const forbidden = await auth(request(app).post(`/api/proposals/${proposalId}/decision`), thirdToken).send({
    decision: 'shortlist',
  });
  assert.equal(forbidden.status, 403);

  const shortlist = await auth(request(app).post(`/api/proposals/${proposalId}/decision`), clientToken).send({
    decision: 'shortlist',
    reviewNote: 'Strong widget experience.',
  });
  assert.equal(shortlist.status, 200);
  assert.equal(shortlist.body.data.proposal.status, 'shortlisted');
  assert.equal(shortlist.body.data.proposal.reviewNote, 'Strong widget experience.');
  assert.ok(shortlist.body.data.proposal.decidedAt);

  // Shortlisted proposals are still editable by their author.
  const stillEditable = await auth(request(app).patch(`/api/proposals/${proposalId}`), freelancerToken).send({
    estimatedDays: 12,
  });
  assert.equal(stillEditable.status, 200);

  const reject = await auth(request(app).post(`/api/proposals/${proposalId}/decision`), clientToken).send({
    decision: 'reject',
  });
  assert.equal(reject.body.data.proposal.status, 'rejected');

  const reconsider = await auth(request(app).post(`/api/proposals/${proposalId}/decision`), clientToken).send({
    decision: 'reconsider',
  });
  assert.equal(reconsider.body.data.proposal.status, 'submitted');
  assert.equal(reconsider.body.data.proposal.decidedAt, null);
});

test('a rejected proposal can no longer be edited by its author (400)', async () => {
  await auth(request(app).post(`/api/proposals/${proposalId}/decision`), clientToken).send({ decision: 'reject' });
  const res = await auth(request(app).patch(`/api/proposals/${proposalId}`), freelancerToken).send({ estimatedDays: 3 });
  assert.equal(res.status, 400);
  await auth(request(app).post(`/api/proposals/${proposalId}/decision`), clientToken).send({ decision: 'reconsider' });
});

test('withdraw frees the job slot, and re-applying revives the same proposal', async () => {
  const before = await jobProposalsCount(jobId);

  const withdraw = await auth(request(app).post(`/api/proposals/${proposalId}/withdraw`), freelancerToken);
  assert.equal(withdraw.status, 200);
  assert.equal(withdraw.body.data.proposal.status, 'withdrawn');
  assert.ok(withdraw.body.data.proposal.withdrawnAt);
  assert.equal(await jobProposalsCount(jobId), before - 1);

  // Withdrawing twice is a 400, not a second decrement.
  const again = await auth(request(app).post(`/api/proposals/${proposalId}/withdraw`), freelancerToken);
  assert.equal(again.status, 400);
  assert.equal(await jobProposalsCount(jobId), before - 1);

  // Re-applying reuses the withdrawn row (the {job, freelancer} index is unique).
  const reapply = await auth(request(app).post('/api/proposals'), freelancerToken).send({ job: jobId, ...proposalPayload });
  assert.equal(reapply.status, 201);
  assert.equal(reapply.body.data.proposal.id || reapply.body.data.proposal._id, proposalId);
  assert.equal(reapply.body.data.proposal.status, 'submitted');
  assert.equal(reapply.body.data.proposal.withdrawnAt, null);
  assert.equal(await jobProposalsCount(jobId), before);

  const mine = await auth(request(app).get('/api/proposals/mine'), freelancerToken);
  assert.equal(mine.body.data.items.length, 1); // revived, not duplicated
});

test('GET /proposals/:id with a bad id is a 422', async () => {
  const res = await auth(request(app).get('/api/proposals/not-a-valid-id'), freelancerToken);
  assert.equal(res.status, 422);
});

test('POST /ai/proposal/draft returns an editable cover letter, not a proposal', async () => {
  const res = await auth(request(app).post('/api/ai/proposal/draft'), thirdToken).send({
    job: jobId,
    tone: 'friendly',
    notes: 'I can start on Monday.',
  });
  assert.equal(res.status, 200);
  const { draft } = res.body.data;
  assert.ok(draft.coverLetter.length >= 50);
  assert.match(draft.coverLetter, /booking widget/i);
  assert.match(draft.coverLetter, /Monday/);
  assert.ok(draft.suggestedBid.amount > 0);
  assert.ok(Array.isArray(draft.talkingPoints));
  assert.ok(draft.disclaimer); // advisory-only notice travels with the draft

  // Drafting does not create anything.
  const mine = await auth(request(app).get('/api/proposals/mine'), thirdToken);
  assert.equal(mine.body.data.items.length, 0);
});

test('POST /ai/proposal/draft refuses the caller’s own job (400)', async () => {
  const res = await auth(request(app).post('/api/ai/proposal/draft'), clientToken).send({ job: jobId });
  assert.equal(res.status, 400);
});
