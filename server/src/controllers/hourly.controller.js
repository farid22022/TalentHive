import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import { hourlyService } from '../services/hourly.service.js';
export const hourlyController = {
  summary: asyncHandler(async (req, res) => ok(res, await hourlyService.summary(req.user, req.params.id))),
  start: asyncHandler(async (req, res) => created(res, { timer: await hourlyService.start(req.user, req.body.contractId || req.params.id, req.body) }, 'Timer started')),
  heartbeat: asyncHandler(async (req, res) => ok(res, { timer: await hourlyService.heartbeat(req.user, req.params.timerId) })),
  stop: asyncHandler(async (req, res) => created(res, { entry: await hourlyService.stop(req.user, req.params.timerId, req.body) }, 'Time recorded')),
  createEntry: asyncHandler(async (req, res) => created(res, { entry: await hourlyService.createEntry(req.user, req.params.id, req.body) }, 'Time entry created')),
  entries: asyncHandler(async (req, res) => ok(res, { entries: await hourlyService.entries(req.user, req.params.id) })),
  removeEntry: asyncHandler(async (req, res) => ok(res, { entry: await hourlyService.removeEntry(req.user, req.params.entryId) }, 'Time entry removed')),
  invoice: asyncHandler(async (req, res) => created(res, { invoice: await hourlyService.generateInvoice(req.user, req.params.id, req.body.periodStart, req.body.periodEnd) }, 'Invoice generated')),
};
