import { Router } from 'express';
import { body } from 'express-validator';
import CommentController from '../controllers/comment.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

router.get('/', CommentController.getByReview);

router.post('/', authMiddleware, [
  body('content').trim().notEmpty().withMessage('Content is required')
], CommentController.create);

router.delete('/:commentId', authMiddleware, CommentController.delete);

export default router;
