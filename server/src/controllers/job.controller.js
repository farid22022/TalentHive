import { jobService } from '../services/job.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/ApiResponse.js';
import { parsePagination } from '../utils/pagination.js';

export const jobController = {
  create: asyncHandler(async (req, res) => {
    const job = await jobService.create(req.user, req.body);
    return created(res, { job: job.toJSON() }, 'Job posted');
  }),

  list: asyncHandler(async (req, res) => {
    const q = req.validatedQuery || {};
    const { page, limit, skip } = parsePagination(q, { defaultLimit: 12, maxLimit: 50 });
    const { items, total } = await jobService.list({ ...q, page, limit, skip });
    return paginated(res, items.map((j) => j.toJSON()), { page, limit, total }, 'OK');
  }),

  listMine: asyncHandler(async (req, res) => {
    const q = req.validatedQuery || {};
    const { page, limit, skip } = parsePagination(q, { defaultLimit: 20, maxLimit: 50 });
    const { items, total } = await jobService.listMine(req.user, { ...q, page, limit, skip });
    return paginated(res, items.map((j) => j.toJSON()), { page, limit, total }, 'OK');
  }),

  listSaved: asyncHandler(async (req, res) => {
    const q = req.validatedQuery || {};
    const { page, limit, skip } = parsePagination(q, { defaultLimit: 20, maxLimit: 50 });
    const { items, total } = await jobService.listSaved(req.user, { ...q, page, limit, skip });
    return paginated(res, items.map((j) => j.toJSON()), { page, limit, total }, 'OK');
  }),

  getOne: asyncHandler(async (req, res) => {
    const job = await jobService.getById(req.params.id, req.user);
    return ok(res, { job: job.toJSON() }, 'OK');
  }),

  update: asyncHandler(async (req, res) => {
    const job = await jobService.update(req.user, req.params.id, req.body);
    return ok(res, { job: job.toJSON() }, 'Job updated');
  }),

  remove: asyncHandler(async (req, res) => {
    const out = await jobService.remove(req.user, req.params.id);
    return ok(res, out, 'Job deleted');
  }),

  save: asyncHandler(async (req, res) => {
    const out = await jobService.save(req.user, req.params.id);
    return ok(res, out, 'Job saved');
  }),

  unsave: asyncHandler(async (req, res) => {
    const out = await jobService.unsave(req.user, req.params.id);
    return ok(res, out, 'Job unsaved');
  }),
};
