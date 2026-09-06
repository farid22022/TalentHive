import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { notificationController as c } from '../controllers/notification.controller.js';
const router = Router(); router.use(requireAuth);
router.get('/notifications', c.list); router.post('/notifications/read-all', c.readAll); router.patch('/notifications/:id/read', c.read); router.patch('/notifications/:id/archive', c.archive); router.get('/notification-preferences', c.preferences); router.patch('/notification-preferences', c.updatePreferences);
export default router;
