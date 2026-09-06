import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { disputeController as c } from '../controllers/dispute.controller.js';
const router = Router(); router.use(requireAuth);
router.get('/disputes', c.list); router.post('/disputes', c.create); router.get('/disputes/:id', c.get); router.post('/disputes/:id/evidence', c.evidence); router.post('/disputes/:id/respond', c.respond); router.post('/disputes/:id/resolve', c.resolve);
export default router;
