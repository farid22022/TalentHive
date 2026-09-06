import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import { reviewService } from '../services/review.service.js';
export const reviewController = {
  eligibility: asyncHandler(async (req, res) => ok(res, { eligibility: await reviewService.getEligibility(req.user, req.params.contractId) })),
  create: asyncHandler(async (req, res) => created(res, { review: await reviewService.create(req.user, req.params.contractId, req.body) }, 'Review published')),
  list: asyncHandler(async (req, res) => ok(res, await reviewService.listForUser(req.params.userId, req.validatedQuery || req.query))),
  get: asyncHandler(async (req, res) => ok(res, { review: await reviewService.getOne(req.params.id) })),
  reply: asyncHandler(async (req, res) => ok(res, { review: await reviewService.reply(req.user, req.params.id, req.body.content) }, 'Reply published')),
  report: asyncHandler(async (req, res) => created(res, { report: await reviewService.report(req.user, req.params.id, req.body) }, 'Review reported')),
  reputation: asyncHandler(async (req, res) => ok(res, { reputation: await reviewService.getReputation(req.params.userId) })),
};
