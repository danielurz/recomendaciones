import { Router } from 'express';
import { body } from 'express-validator';
import ReviewController from '../controllers/review.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', ReviewController.getAll);
router.get('/:id', ReviewController.getById);

router.post('/', authMiddleware, [
  body('product_name').trim().notEmpty().withMessage('Product name is required'),
  body('product_price').isNumeric().withMessage('Product price must be a number'),
  body('content').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  body('is_recommended').isBoolean().withMessage('is_recommended must be a boolean'),
  body('business_name').trim().notEmpty().withMessage('Business name is required'),
  body('business_location_text').trim().notEmpty().withMessage('Business location is required')
], ReviewController.create);

router.put('/:id', authMiddleware, [
  body('product_name').trim().notEmpty().withMessage('Product name is required'),
  body('product_price').isNumeric().withMessage('Product price must be a number'),
  body('content').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  body('is_recommended').isBoolean().withMessage('is_recommended must be a boolean')
], ReviewController.update);

router.delete('/:id', authMiddleware, ReviewController.delete);

export default router;
