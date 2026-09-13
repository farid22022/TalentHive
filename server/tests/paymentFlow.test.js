import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { User } from '../src/models/User.js';
import { Project } from '../src/models/Project.js';
import { Contract } from '../src/models/Contract.js';
import { Milestone } from '../src/models/Milestone.js';
import { paymentService } from '../src/services/payment.service.js';
import { PAYMENT_STATUS } from '../src/config/constants.js';

let mongo;

before(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
  await Promise.all(Object.values(mongoose.models).map(m => m.init()));
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('creates an idempotent milestone payment with a backend-generated transaction reference', async () => {
  const client = await User.create({
    name: 'Client User',
    email: 'client-payment@example.com',
    passwordHash: 'hash',
    role: 'client',
    roles: ['client'],
    status: 'active',
  });
  const freelancer = await User.create({
    name: 'Freelancer User',
    email: 'freelancer-payment@example.com',
    passwordHash: 'hash',
    role: 'freelancer',
    roles: ['freelancer'],
    status: 'active',
  });

  const contract = await Contract.create({
    client: client._id,
    freelancer: freelancer._id,
    job: new mongoose.Types.ObjectId(),
    proposal: new mongoose.Types.ObjectId(),
    offer: new mongoose.Types.ObjectId(),
    contractNumber: 'CG-2026-0001',
    title: 'Backend contract',
    description: 'Build backend API',
    type: 'fixed',
    rate: 0,
    totalAmount: 15000,
    estimatedHours: 40,
    status: 'active',
  });

  const project = await Project.create({
    client: client._id,
    freelancer: freelancer._id,
    job: contract.job,
    contract: contract._id,
    title: 'E-commerce Website',
    description: 'Build store backend',
    status: 'not_started',
  });

  const milestone = await Milestone.create({
    project: project._id,
    contract: contract._id,
    title: 'Backend Development',
    description: 'API endpoints',
    amount: 15000,
    order: 1,
    status: 'pending',
  });

  const first = await paymentService.fundMilestone({ _id: client._id }, milestone._id, 'payment-key-1', 'BKASH_SIMULATED');
  assert.equal(first.status, PAYMENT_STATUS.CHECKOUT_CREATED);
  assert.match(first.transactionReference || '', /^TH-TXN-\d{8}-[A-Z0-9]+$/);

  const fundedMilestone = await Milestone.findById(milestone._id);
  assert.equal(fundedMilestone.status, 'funding_pending');
  assert.equal(fundedMilestone.paymentState, 'funding_pending');

  const duplicate = await paymentService.fundMilestone({ _id: client._id }, milestone._id, 'payment-key-1', 'BKASH_SIMULATED');
  assert.equal(String(duplicate._id), String(first._id));
});
