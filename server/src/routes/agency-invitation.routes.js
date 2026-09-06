import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { agencyController as c } from '../controllers/agency.controller.js';
import { agencyId, invitation } from '../validators/agency.validators.js';
const router = Router(); router.use(requireAuth); router.get('/', c.invitations); router.post('/:id/accept', validate(invitation), c.accept); router.post('/:id/decline', validate(agencyId), c.decline); export default router;
