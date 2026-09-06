import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { moderationController as c } from '../controllers/moderation.controller.js';
const router = Router();
router.post('/reports', requireAuth, c.report); router.get('/admin/moderation', requireAuth, requireRole('admin'), c.queue); router.post('/admin/moderation/:id/action', requireAuth, requireRole('admin'), c.action);
export default router;
