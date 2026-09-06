import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { localeController as c } from '../controllers/locale.controller.js';
const router = Router(); router.get('/currencies', c.currencies); router.get('/locale/preferences', requireAuth, c.preferences); router.patch('/locale/preferences', requireAuth, c.update); export default router;
