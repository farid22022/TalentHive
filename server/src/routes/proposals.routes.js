import { Router } from 'express';
import { proposalController } from '../controllers/proposal.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createProposalSchema,
  updateProposalSchema,
  myProposalsSchema,
  receivedProposalsSchema,
  decisionSchema,
  proposalIdParam,
} from '../validators/proposal.validators.js';

const router = Router();

// Every proposal route is private: a proposal is only ever visible to its author or the job owner.
router.use(requireAuth);

// --- Static routes before /:id ---
router.get('/mine', validate(myProposalsSchema), proposalController.listMine);
router.get('/received', validate(receivedProposalsSchema), proposalController.listReceived);

router.post('/', validate(createProposalSchema), proposalController.create);

// Author actions.
router.patch('/:id', validate(updateProposalSchema), proposalController.update);
router.post('/:id/withdraw', validate(proposalIdParam), proposalController.withdraw);

// Job-owner review: shortlist / reject / reconsider.
router.post('/:id/decision', validate(decisionSchema), proposalController.decide);

router.get('/:id', validate(proposalIdParam), proposalController.getOne);

export default router;
