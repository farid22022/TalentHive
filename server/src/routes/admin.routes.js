import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { adminController as c } from '../controllers/admin.controller.js';
const router = Router(); router.use(requireAuth, requireRole('admin'));
router.get('/admin/dashboard', c.dashboard); router.get('/admin/users', c.users); router.patch('/admin/users/:id/status', c.setUserStatus); router.get('/admin/audit-logs', c.audit);
export default router;
