import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './users.routes.js';
import profileRoutes from './profiles.routes.js';
import fileRoutes from './files.routes.js';
import aiRoutes from './ai.routes.js';
import verificationRoutes from './verification.routes.js';
import jobRoutes from './jobs.routes.js';

const router = Router();

router.get('/health', (_req, res) =>
  res.json({ success: true, message: 'ok', data: { status: 'healthy', time: new Date().toISOString() } })
);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/profiles', profileRoutes);
router.use('/files', fileRoutes);
router.use('/ai', aiRoutes);
router.use('/verification', verificationRoutes);
router.use('/jobs', jobRoutes);

// Future phase mounts (proposals, contracts, payments, admin, ai...) attach here.

export default router;
