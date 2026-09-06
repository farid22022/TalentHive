import crypto from 'node:crypto';
import { SecurityEvent } from '../models/SecurityEvent.js';
import { RiskSignal } from '../models/RiskSignal.js';
import { RiskAssessment } from '../models/RiskAssessment.js';
import { Device } from '../models/Device.js';
const level = (score) => score >= 75 ? 'critical' : score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';
const decision = (score) => score >= 75 ? 'review_required' : score >= 50 ? 'challenge' : score >= 25 ? 'limit' : 'allow';
export const securityService = {
  event: async (body) => SecurityEvent.create({ ...body, eventId: body.eventId || crypto.randomUUID(), riskLevel: level(body.riskScore || 0) }),
  signal: async (body) => RiskSignal.create(body),
  assess: async ({ subjectType, subjectId }) => { const signals = await RiskSignal.find({ subjectType, subjectId, $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }] }); const score = Math.min(100, signals.reduce((n, s) => n + (s.weight * s.confidence), 0)); const assessment = await RiskAssessment.create({ assessmentId: crypto.randomUUID(), subjectType, subjectId, score: Math.round(score), level: level(score), decision: decision(score), signals: signals.map((s) => s.signalType), confidence: signals.length ? Math.min(1, signals.reduce((n, s) => n + s.confidence, 0) / signals.length) : 0, explanations: signals.map((s) => `${s.signalType}: ${s.source}`), expiresAt: new Date(Date.now() + 86400000) }); return assessment; },
  registerDevice: async (user, body) => Device.findOneAndUpdate({ deviceId: body.deviceId, user: user._id }, { $set: { ...body, lastSeenAt: new Date() }, $setOnInsert: { user: user._id, firstSeenAt: new Date() } }, { upsert: true, new: true }),
  events: async (query = {}) => SecurityEvent.find(query).sort({ createdAt: -1 }).limit(100),
  assessments: async (query = {}) => RiskAssessment.find(query).sort({ createdAt: -1 }).limit(100),
};
