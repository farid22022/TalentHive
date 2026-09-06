import { Router } from 'express';
import { jobController } from '../controllers/job.controller.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createJobSchema,
  updateJobSchema,
  listJobsSchema,
  myJobsSchema,
  savedJobsSchema,
  jobIdParam,
} from '../validators/job.validators.js';

const router = Router();

// --- Public job board ---
router.get('/', validate(listJobsSchema), jobController.list);

// --- Authenticated: own jobs + saved jobs (static routes before /:id) ---
router.get('/mine', requireAuth, validate(myJobsSchema), jobController.listMine);
router.get('/saved', requireAuth, validate(savedJobsSchema), jobController.listSaved);

router.post('/', requireAuth, validate(createJobSchema), jobController.create);

// Save / unsave a job (bookmark).
router.post('/:id/save', requireAuth, validate(jobIdParam), jobController.save);
router.delete('/:id/save', requireAuth, validate(jobIdParam), jobController.unsave);

// Owner-only mutations.
router.patch('/:id', requireAuth, validate(updateJobSchema), jobController.update);
router.delete('/:id', requireAuth, validate(jobIdParam), jobController.remove);
router.get('/:id/applicants', requireAuth, validate(jobIdParam), jobController.applicants);

// Single job — optionalAuth so owners can view their own draft/closed jobs.
router.get('/:id', optionalAuth, validate(jobIdParam), jobController.getOne);

export default router;
