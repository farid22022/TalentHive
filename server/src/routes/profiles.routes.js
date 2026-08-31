import { Router } from 'express';
import { profileController } from '../controllers/profile.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { uploadImage, uploadDocument, handleUploadError } from '../middlewares/upload.js';
import {
  updateProfileSchema,
  onboardingSchema,
  listTalentSchema,
  objectIdParam,
} from '../validators/profile.validators.js';

const router = Router();

// --- Public talent directory + public profile view ---
router.get('/talent', validate(listTalentSchema), profileController.listTalent);

// --- Authenticated: manage own freelancer profile ---
router.get('/me', requireAuth, profileController.getMine);
router.patch('/me', requireAuth, validate(updateProfileSchema), profileController.updateMine);
router.post('/me/onboarding', requireAuth, validate(onboardingSchema), profileController.completeOnboarding);

router.post('/me/avatar', requireAuth, uploadImage, handleUploadError, profileController.uploadAvatar);
router.post('/me/cv', requireAuth, uploadDocument, handleUploadError, profileController.uploadCV);
router.delete('/me/cv', requireAuth, profileController.removeCV);

// Public profile by user id — keep last so it doesn't shadow the static routes above.
router.get('/:userId', validate(objectIdParam), profileController.getPublic);

export default router;
