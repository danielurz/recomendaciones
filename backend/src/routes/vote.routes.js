import { Router } from 'express';
import { body } from 'express-validator';
import VoteController from '../controllers/vote.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

router.post('/', authMiddleware, [
  body('vote').isIn([1, -1]).withMessage('Vote must be 1 or -1')
], VoteController.vote);

export default router;
