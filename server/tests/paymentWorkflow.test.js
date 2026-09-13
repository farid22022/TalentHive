import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/utils/tokens.js';
import { User } from '../src/models/User.js';
import { Project } from '../src/models/Project.js';
import { Contract } from '../src/models/Contract.js';
import { Milestone } from '../src/models/Milestone.js';
import { Payment } from '../src/models/Payment.js';
import { PaymentTransaction } from '../src/models/PaymentTransaction.js';
import { WalletLedgerEntry } from '../src/models/WalletLedgerEntry.js';
import { Wallet } from '../src/models/Wallet.js';
import { VirtualCard } from '../src/models/VirtualCard.js';
import { Transaction } from '../src/models/Transaction.js';
import { Notification } from '../src/models/Notification.js';
import { paymentService } from '../src/services/payment.service.js';
import { virtualCardService } from '../src/services/virtualCard.service.js';
import { hiringService } from '../src/services/hiring.service.js';
import { projectWorkspaceService } from '../src/services/projectWorkspace.service.js';

let mongo;
const app = createApp();
before(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
  await Promise.all(Object.values(mongoose.models).map(m => m.init()));
  mongoose.set('sanitizeFilter', true);
});
after(async () => { await mongoose.disconnect(); await mongo?.stop(); });
async function fixture(label) {
  const client = await User.create({ name: 'Payment Client', email: `${label}-client@test.local`, passwordHash: 'hash', role: 'client', roles: ['client'], status: 'active' });
  const freelancer = await User.create({ name: 'Payment Developer', email: `${label}-dev@test.local`, passwordHash: 'hash', role: 'freelancer', roles: ['freelancer'], status: 'active' });
  await virtualCardService.ensureForUser(freelancer);
  const contract = await Contract.create({ client: client._id, freelancer: freelancer._id, job: new mongoose.Types.ObjectId(), proposal: new mongoose.Types.ObjectId(), offer: new mongoose.Types.ObjectId(), contractNumber: label, title: 'Payment test', description: 'Payment test contract', type: 'fixed', totalAmount: 15000, status: 'active' });
  const project = await Project.create({ client: client._id, freelancer: freelancer._id, job: contract.job, contract: contract._id, title: 'Payment test', description: 'Payment test project' });
  const milestone = await Milestone.create({ project: project._id, contract: contract._id, title: 'Deliver API', amount: 15000, order: 1 });
  return { client, freelancer, contract, project, milestone };
}
async function settle(payment, io) {
  await Payment.updateOne({ _id: payment._id }, { $set: { processAfter: new Date(0) } });
  await paymentService.processPending(io);
  assert.equal((await Payment.findById(payment._id)).status, 'processing');
  await Payment.updateOne({ _id: payment._id }, { $set: { processAfter: new Date(0) } });
  await paymentService.processPending(io);
  return Payment.findById(payment._id);
}
const auth = (req, user) => req.set('Authorization', `Bearer ${signAccessToken(user)}`);
for (const provider of ['BKASH_SIMULATED', 'NAGAD_SIMULATED', 'ROCKET_SIMULATED']) {
  test(`${provider}: API funding, private events, ledger, review and concurrent release`, async () => {
    const f = await fixture(provider);
    const response = await auth(request(app).post(`/api/milestones/${f.milestone._id}/fund`), f.client).set('Idempotency-Key', provider).send({ provider, amount: 1, developerId: f.client._id });
    assert.equal(response.status, 202, JSON.stringify(response.body));
    const p = response.body.data.payment;
    assert.equal(p.amount, 15000); assert.equal(p.status, 'checkout_created'); assert.equal(p.simulationOutcome, undefined); assert.equal(p.freelancerAmount, undefined);
    const events = []; const io = { to: room => ({ emit: (event, data) => events.push({ room, event, data }) }) };
    const done = await settle(p, io); assert.equal(done.status, 'succeeded');
    const clientCardAfterFunding = await VirtualCard.findOne({ user: f.client._id });
    assert.equal(clientCardAfterFunding.heldBalance, 15000);
    assert.equal((await Milestone.findById(f.milestone._id)).status, 'funded');
    assert.equal(await WalletLedgerEntry.countDocuments({ referenceId: p._id }), 1);
    assert.equal(await Transaction.countDocuments({ payment: p._id, type: 'escrow_funding' }), 1);
    assert.equal((await VirtualCard.findOne({ user: f.freelancer._id })).balance, 0);
    assert.equal(await Notification.countDocuments({ entityId: p._id }), 2);
    assert.ok(events.some(e => e.event === 'payment:success' && e.room === `user:${f.freelancer._id}`));
    assert.ok(events.every(e => [f.client._id, f.freelancer._id].some(id => e.room === `user:${id}`)));
    await assert.rejects(paymentService.release(f.client, f.milestone._id), /approved/);
    await hiringService.startMilestone(f.freelancer, f.milestone._id);
    const submission = await hiringService.submitWork(f.freelancer, f.milestone._id, { description: 'API delivery ready for review' });
    await hiringService.reviewSubmission(f.client, submission._id, 'approve');
    await Promise.all([paymentService.release(f.client, f.milestone._id), paymentService.release(f.client, f.milestone._id)]);
    assert.equal((await VirtualCard.findOne({ user: f.freelancer._id })).balance, done.freelancerAmount);
    assert.equal((await VirtualCard.findOne({ user: f.client._id })).heldBalance, 0);
    assert.equal(await WalletLedgerEntry.countDocuments({ referenceId: p._id, type: 'developer_earning' }), 1);
    assert.equal((await Wallet.findOne({ user: f.freelancer._id })).totalEarned, done.freelancerAmount);
    const httpWorkspace = await auth(request(app).get(`/api/projects/${f.project._id}/workspace`), f.client);
    assert.equal(httpWorkspace.status, 200, JSON.stringify(httpWorkspace.body));
    const workspace = httpWorkspace.body.data;
    assert.equal(workspace.permissions.canFundMilestones, true); assert.equal(workspace.financialSummary.released, 15000); assert.equal(workspace.financialSummary.escrow, 0);
    const details = await paymentService.getOne(f.client, p._id); assert.equal(details.attempts.length, 1); assert.equal(details.freelancerAmount, undefined);
  });
}
test('failure, safe retry, duplicate requests, unauthorized reads and key reuse', async () => {
  const f = await fixture('failure'); const other = await fixture('other');
  const p = await paymentService.fundMilestone(f.client, f.milestone._id, 'failure-key', 'NAGAD_SIMULATED', 'failed'); await settle(p);
  assert.equal((await Milestone.findById(f.milestone._id)).status, 'pending');
  assert.equal(await WalletLedgerEntry.countDocuments({ referenceId: p._id }), 0);
  await assert.rejects(paymentService.fundMilestone(other.client, f.milestone._id, 'failure-key'), /project client/);
  await assert.rejects(paymentService.fundMilestone(f.freelancer, f.milestone._id, 'failure-key'), /Only clients/);
  await assert.rejects(paymentService.getOne(other.client, p._id), /not found/);
  await assert.rejects(paymentService.fundMilestone(other.client, other.milestone._id, 'failure-key'), /already in use/);
  const retried = await Promise.all(Array.from({ length: 5 }, () => paymentService.fundMilestone(f.client, f.milestone._id, 'retry-key', 'ROCKET_SIMULATED')));
  assert.ok(retried.every(x => String(x._id) === String(p._id))); await settle(retried[0]);
  assert.equal(await PaymentTransaction.countDocuments({ milestoneId: f.milestone._id }), 2);
  assert.equal(await Transaction.countDocuments({ payment: p._id, type: 'escrow_funding' }), 1);
  const duplicate = await paymentService.fundMilestone(f.client, f.milestone._id, 'another-key'); assert.equal(duplicate.status, 'succeeded');
  assert.equal(await PaymentTransaction.countDocuments({ milestoneId: f.milestone._id }), 2);
});
test('contract relationship validation and atomic rollback when developer card is missing', async () => {
  const f = await fixture('rollback'); const other = await fixture('mismatch');
  await Milestone.updateOne({ _id: f.milestone._id }, { $set: { contract: other.contract._id } });
  await assert.rejects(paymentService.fundMilestone(f.client, f.milestone._id, 'mismatch-key'), /does not match/);
  await Milestone.updateOne({ _id: f.milestone._id }, { $set: { contract: f.contract._id } });
  const p = await paymentService.fundMilestone(f.client, f.milestone._id, 'rollback-key'); await settle(p);
  await Milestone.updateOne({ _id: f.milestone._id }, { $set: { status: 'approved' } });
  await VirtualCard.deleteOne({ user: f.freelancer._id });
  await assert.rejects(paymentService.release(f.client, f.milestone._id), /card not found/);
  assert.equal(await Wallet.countDocuments({ user: f.freelancer._id }), 0);
  assert.equal((await Payment.findById(p._id)).escrowStatus, 'funded');
  assert.equal(await Transaction.countDocuments({ payment: p._id, type: 'escrow_release' }), 0);
});

test('multiple developers are grouped for the client and isolated for developers', async () => {
  const first = await fixture('team-first'), second = await fixture('team-second');
  await Project.updateOne({ _id: second.project._id }, { $set: { client: first.client._id, job: first.contract.job } });
  await Contract.updateOne({ _id: second.contract._id }, { $set: { client: first.client._id, job: first.contract.job } });
  const workspace = await projectWorkspaceService.board(first.client, first.project._id);
  assert.equal(workspace.team.length, 2); assert.equal(workspace.milestones.length, 2); assert.equal(workspace.financialSummary.total, 30000);
  const privateWorkspace = await projectWorkspaceService.board(first.freelancer, first.project._id);
  assert.equal(privateWorkspace.milestones.length, 1); assert.equal(privateWorkspace.team.length, 1);
  const payment = await paymentService.fundMilestone(first.client, second.milestone._id, 'team-key');
  assert.equal(String(payment.freelancer), String(second.freelancer._id));
  await assert.rejects(paymentService.getOne(first.freelancer, payment._id), /not found/);
});

test('legacy checkout recovers after worker restart without a second payment', async () => {
  const f = await fixture('legacy');
  const p = await paymentService.fundMilestone(f.client, f.milestone._id, 'legacy-key');
  await Payment.updateOne({ _id: p._id }, { $unset: { processAfter: 1 } });
  await PaymentTransaction.deleteOne({ idempotencyKey: 'legacy-key' });
  await paymentService.processPending();
  assert.ok((await Payment.findById(p._id)).processAfter);
  await settle(p);
  assert.equal(await Payment.countDocuments({ milestone: f.milestone._id }), 1);
  assert.equal(await PaymentTransaction.countDocuments({ milestoneId: f.milestone._id }), 1);
});
