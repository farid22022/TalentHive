import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { collaborationController as c } from '../controllers/collaboration.controller.js';
const router = Router(); router.use(requireAuth);
router.post('/conversations/:id/participants', c.add); router.get('/conversations/:id/pinned', c.pinned); router.get('/messages/:messageId/thread', c.thread); router.post('/messages/:messageId/save', c.save); router.delete('/messages/:messageId/save', c.unsave); router.get('/saved-messages', c.saved); export default router;
