import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { agencyController as c } from '../controllers/agency.controller.js';
import { agencyBody, agencyPatch, agencyId, slug, invite, invitation } from '../validators/agency.validators.js';
const router = Router();
router.get('/', c.list); router.get('/:slug/dashboard', requireAuth, validate(slug), c.workspaceBySlug); router.get('/:slug', validate(slug), c.publicOne);
router.post('/', requireAuth, validate(agencyBody), c.create); router.patch('/:id', requireAuth, validate(agencyPatch), c.update); router.get('/:id/members', requireAuth, validate(agencyId), c.members); router.post('/:id/members/invite', requireAuth, validate(invite), c.invite); router.get('/:id/workspace', requireAuth, validate(agencyId), c.workspace);
export default router;
