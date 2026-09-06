import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './users.routes.js';
import profileRoutes from './profiles.routes.js';
import fileRoutes from './files.routes.js';
import aiRoutes from './ai.routes.js';
import verificationRoutes from './verification.routes.js';
import jobRoutes from './jobs.routes.js';
import proposalRoutes from './proposals.routes.js';
import conversationRoutes from './conversations.routes.js';
import hiringRoutes from './hiring.routes.js';
import paymentRoutes from './payment.routes.js';
import reviewRoutes from './review.routes.js';
import matchingRoutes from './matching.routes.js';
import searchRoutes from './search.routes.js';
import agencyRoutes from './agency.routes.js';
import agencyInvitationRoutes from './agency-invitation.routes.js';
import hourlyRoutes from './hourly.routes.js';
import disputeRoutes from './dispute.routes.js';
import notificationRoutes from './notification.routes.js';
import moderationRoutes from './moderation.routes.js';
import securityRoutes from './security.routes.js';
import collaborationRoutes from './collaboration.routes.js';
import localeRoutes from './locale.routes.js';
import virtualCardRoutes from './virtualCard.routes.js';

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
router.use('/proposals', proposalRoutes);
router.use('/conversations', conversationRoutes);
router.use('/', hiringRoutes);
router.use('/', paymentRoutes);
router.use('/', reviewRoutes);
router.use('/', matchingRoutes);
router.use('/', searchRoutes);
router.use('/agencies', agencyRoutes);
router.use('/agency-invitations', agencyInvitationRoutes);
router.use('/', hourlyRoutes);
router.use('/', disputeRoutes);
router.use('/', notificationRoutes);
router.use('/', moderationRoutes);
router.use('/', securityRoutes);
router.use('/', collaborationRoutes);
router.use('/', localeRoutes);
router.use('/', virtualCardRoutes);

// Future phase mounts (contracts, payments, admin...) attach here.

export default router;
