import { proposalService } from '../services/proposal.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/ApiResponse.js';
import { parsePagination } from '../utils/pagination.js';

/** Attach the freelancer's public profile snippet (rate/skills/badges) to a serialized proposal. */
const withProfile = (proposal, profiles) => {
  const json = proposal.toJSON();
  const key = String(proposal.freelancer?._id || proposal.freelancer);
  json.freelancerProfile = profiles[key] || null;
  return json;
};

export const proposalController = {
  create: asyncHandler(async (req, res) => {
    const proposal = await proposalService.create(req.user, req.body);
    return created(res, { proposal: proposal.toJSON() }, 'Proposal submitted');
  }),

  listMine: asyncHandler(async (req, res) => {
    const q = req.validatedQuery || {};
    const { page, limit, skip } = parsePagination(q, { defaultLimit: 20, maxLimit: 50 });
    const { items, total } = await proposalService.listMine(req.user, { ...q, page, limit, skip });
    return paginated(res, items.map((p) => p.toJSON()), { page, limit, total }, 'OK');
  }),

  listReceived: asyncHandler(async (req, res) => {
    const q = req.validatedQuery || {};
    const { page, limit, skip } = parsePagination(q, { defaultLimit: 20, maxLimit: 50 });
    const { items, total, profiles } = await proposalService.listReceived(req.user, { ...q, page, limit, skip });
    return paginated(res, items.map((p) => withProfile(p, profiles)), { page, limit, total }, 'OK');
  }),

  getOne: asyncHandler(async (req, res) => {
    const { proposal, profiles } = await proposalService.getById(req.user, req.params.id);
    return ok(res, { proposal: withProfile(proposal, profiles) }, 'OK');
  }),

  update: asyncHandler(async (req, res) => {
    const proposal = await proposalService.update(req.user, req.params.id, req.body);
    return ok(res, { proposal: proposal.toJSON() }, 'Proposal updated');
  }),

  withdraw: asyncHandler(async (req, res) => {
    const proposal = await proposalService.withdraw(req.user, req.params.id);
    return ok(res, { proposal: proposal.toJSON() }, 'Proposal withdrawn');
  }),

  decide: asyncHandler(async (req, res) => {
    const proposal = await proposalService.decide(req.user, req.params.id, req.body);
    return ok(res, { proposal: proposal.toJSON() }, 'Proposal updated');
  }),
};
