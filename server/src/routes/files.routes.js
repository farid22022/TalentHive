import { Router } from 'express';
import { profileController } from '../controllers/profile.controller.js';
import { optionalAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { fileParam } from '../validators/profile.validators.js';

const router = Router();

// Serve locally-stored uploads. Images are public; documents (private CVs) require a valid
// access token — enforced in the controller after optionalAuth attaches req.user.
router.get('/:kind/:name', optionalAuth, validate(fileParam), profileController.serveFile);

export default router;
