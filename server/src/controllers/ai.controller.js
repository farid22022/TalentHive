import { aiService } from '../services/ai.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/ApiResponse.js';
import { parsePagination } from '../utils/pagination.js';
import { AI_FEATURES } from '../config/constants.js';

export const aiController = {
  analyzeCv: asyncHandler(async (req, res) => {
    const analysis = await aiService.analyzeCV(req.user, req.body);
    return created(res, { analysis: analysis.toJSON() }, 'CV analyzed');
  }),

  latest: asyncHandler(async (req, res) => {
    const analysis = await aiService.latest(req.user, AI_FEATURES.CV_ANALYSIS);
    return ok(res, { analysis: analysis ? analysis.toJSON() : null }, 'OK');
  }),

  listAnalyses: asyncHandler(async (req, res) => {
    const q = req.validatedQuery || {};
    const { page, limit, skip } = parsePagination(q, { defaultLimit: 10, maxLimit: 50 });
    const { items, total } = await aiService.listAnalyses(req.user, { feature: q.feature, limit, skip });
    return paginated(res, items.map((a) => a.toJSON()), { page, limit, total }, 'OK');
  }),

  getAnalysis: asyncHandler(async (req, res) => {
    const analysis = await aiService.getAnalysis(req.user, req.params.id);
    return ok(res, { analysis: analysis.toJSON() }, 'OK');
  }),

  deleteAnalysis: asyncHandler(async (req, res) => {
    const out = await aiService.deleteAnalysis(req.user, req.params.id);
    return ok(res, out, 'Analysis deleted');
  }),

  applySkills: asyncHandler(async (req, res) => {
    const { profile, added } = await aiService.applySuggestedSkills(req.user, req.params.id);
    return ok(res, { profile: profile.toJSON(), added }, 'Skills added to profile');
  }),

  draftProposal: asyncHandler(async (req, res) => {
    const draft = await aiService.assistProposal(req.user, req.body);
    return ok(res, { draft }, 'Draft ready');
  }),
};
