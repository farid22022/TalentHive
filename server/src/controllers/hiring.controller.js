import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import { hiringService } from '../services/hiring.service.js';
export const hiringController = {
  listOffers: asyncHandler(async (req, res) => ok(res, { offers: await hiringService.listOffers(req.user, req.query) })),
  createOffer: asyncHandler(async (req, res) => created(res, { offer: await hiringService.createOffer(req.user, req.body) }, 'Offer created')),
  getOffer: asyncHandler(async (req, res) => ok(res, { offer: await hiringService.viewOffer(req.user, req.params.id) })),
  sendOffer: asyncHandler(async (req, res) => ok(res, { offer: await hiringService.sendOffer(req.user, req.params.id) }, 'Offer sent')),
  acceptOffer: asyncHandler(async (req, res) => ok(res, await hiringService.acceptOffer(req.user, req.params.id), 'Offer accepted')),
  rejectOffer: asyncHandler(async (req, res) => ok(res, { offer: await hiringService.rejectOffer(req.user, req.params.id) }, 'Offer declined')),
  requestChanges: asyncHandler(async (req, res) => ok(res, { offer: await hiringService.requestChanges(req.user, req.params.id, req.body.message) }, 'Changes requested')),
  withdrawOffer: asyncHandler(async (req, res) => ok(res, { offer: await hiringService.withdrawOffer(req.user, req.params.id) }, 'Offer withdrawn')),
  contracts: asyncHandler(async (req, res) => ok(res, { contracts: await hiringService.listContracts(req.user) })),
  contract: asyncHandler(async (req, res) => ok(res, { contract: await hiringService.getContract(req.user, req.params.id) })),
  contractAction: asyncHandler(async (req, res) => ok(res, { contract: await hiringService.contractAction(req.user, req.params.id, req.action) })),
  projects: asyncHandler(async (req, res) => ok(res, { projects: await hiringService.listProjects(req.user) })),
  project: asyncHandler(async (req, res) => { const project = await hiringService.getProject(req.user, req.params.id); const milestones = await hiringService.milestones(req.user, req.params.id); return ok(res, { project, milestones }); }),
  milestones: asyncHandler(async (req, res) => ok(res, { milestones: await hiringService.milestones(req.user, req.params.id) })),
  start: asyncHandler(async (req, res) => ok(res, { milestone: await hiringService.startMilestone(req.user, req.params.id) })),
  submit: asyncHandler(async (req, res) => created(res, { submission: await hiringService.submitWork(req.user, req.params.id, req.body) }, 'Work submitted')),
  submissions: asyncHandler(async (req, res) => ok(res, { submissions: await hiringService.submissions(req.user, req.params.id) })),
  review: asyncHandler(async (req, res) => ok(res, { submission: await hiringService.reviewSubmission(req.user, req.params.id, req.action, req.body.feedback) }, req.action === 'approve' ? 'Work approved' : 'Revision requested')),
};
