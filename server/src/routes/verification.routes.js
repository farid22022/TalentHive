import { Router } from 'express';
import { verificationController } from '../controllers/verification.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { verifyLimiter } from '../middlewares/rateLimit.js';
import { uploadDocuments, handleUploadError } from '../middlewares/upload.js';
import { ROLES } from '../config/constants.js';
import {
  sendPhoneSchema,
  verifyPhoneSchema,
  submitRequestSchema,
  requestIdParam,
  adminQueueSchema,
  decisionSchema,
} from '../validators/verification.validators.js';

const router = Router();

// All verification endpoints require authentication.
router.use(requireAuth);

// --- Owner self-service ---
router.get('/status', verificationController.status);
router.post('/email/resend', verifyLimiter, verificationController.resendEmail);
router.post('/phone/send', verifyLimiter, validate(sendPhoneSchema), verificationController.sendPhone);
router.post('/phone/verify', validate(verifyPhoneSchema), verificationController.verifyPhone);

// Identity/document requests (multipart `documents`, up to 3 files).
router.post(
  '/requests',
  uploadDocuments,
  handleUploadError,
  validate(submitRequestSchema),
  verificationController.submitRequest
);
router.get('/requests', verificationController.myRequests);
router.delete('/requests/:id', validate(requestIdParam), verificationController.cancelRequest);

// --- Admin review queue ---
router.get('/admin/requests', requireRole(ROLES.ADMIN), validate(adminQueueSchema), verificationController.adminQueue);
router.get(
  '/admin/requests/:id',
  requireRole(ROLES.ADMIN),
  validate(requestIdParam),
  verificationController.adminGetRequest
);
router.post(
  '/admin/requests/:id/decision',
  requireRole(ROLES.ADMIN),
  validate(decisionSchema),
  verificationController.adminDecide
);

export default router;
