import { Router } from 'express';
import { optionalAuth, requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { searchController as c } from '../controllers/search.controller.js';
import { query, savedSearch, id } from '../validators/search.validators.js';
const router = Router();
router.get('/search', optionalAuth, validate(query), c.global); router.get('/search/suggestions', validate(query), c.suggestions);
router.use(requireAuth); router.get('/search/history', c.history); router.delete('/search/history', c.clearHistory); router.get('/saved-searches', c.savedSearches); router.post('/saved-searches', validate(savedSearch), c.saveSearch); router.delete('/saved-searches/:id', validate(id), c.deleteSearch); router.get('/freelancers/saved', c.savedTalent); router.post('/freelancers/:id/save', validate(id), c.saveTalent); router.delete('/freelancers/:id/save', validate(id), c.unsaveTalent); router.get('/jobs/recommended', c.recommendations);
export default router;
