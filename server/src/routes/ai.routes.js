import { Router } from 'express';
import { aiController } from '../controllers/ai.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { aiLimiter } from '../middlewares/rateLimit.js';
import {
  analyzeCvSchema,
  listAnalysesSchema,
  analysisIdParam,
  draftProposalSchema,
} from '../validators/ai.validators.js';

const router = Router();

// All AI endpoints require authentication.
router.use(requireAuth);

// CV analysis (cost-controlled: rate-limited + content-hash cached in the service).
router.post('/cv/analyze', aiLimiter, validate(analyzeCvSchema), aiController.analyzeCv);
router.get('/cv/latest', aiController.latest);
router.get('/cv/analyses', validate(listAnalysesSchema), aiController.listAnalyses);
router.get('/cv/analyses/:id', validate(analysisIdParam), aiController.getAnalysis);
router.delete('/cv/analyses/:id', validate(analysisIdParam), aiController.deleteAnalysis);
router.post('/cv/analyses/:id/apply-skills', validate(analysisIdParam), aiController.applySkills);

// Proposal cover-letter assistant (Phase 6). Returns a draft; it never creates a proposal.
router.post('/proposal/draft', aiLimiter, validate(draftProposalSchema), aiController.draftProposal);

export default router;
