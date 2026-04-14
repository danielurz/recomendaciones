import { Router } from 'express';
import SearchController from '../controllers/search.controller.js';

const router = Router();

router.get('/results', SearchController.results);
router.post('/summary', SearchController.summary);

export default router;
