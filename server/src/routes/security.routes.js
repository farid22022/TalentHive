import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { securityController as c } from '../controllers/security.controller.js';
const router = Router();
router.post('/security/devices', requireAuth, c.device); router.get('/admin/security/events', requireAuth, requireRole('admin'), c.events); router.get('/admin/security/assessments', requireAuth, requireRole('admin'), c.assessments);
export default router;
