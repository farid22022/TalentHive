import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';
import { matchingService } from '../services/matching.service.js';
export const matchingController = { analyzeJob: asyncHandler(async (req, res) => ok(res, await matchingService.analyzeJob(req.user, req.params.jobId), 'Job analyzed')), match: asyncHandler(async (req, res) => ok(res, { matches: await matchingService.matchJob(req.user, req.params.jobId) }, 'Matches generated')), list: asyncHandler(async (req, res) => ok(res, { matches: await matchingService.listMatches(req.user, req.params.jobId) }, 'OK')) };
