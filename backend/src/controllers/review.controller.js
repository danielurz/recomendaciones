import { validationResult } from 'express-validator';
import ReviewService from '../services/review.service.js';

const ReviewController = {
  async getAll(req, res) {
    try {
      const reviews = await ReviewService.getAll();
      res.status(200).json({ success: true, data: reviews, message: 'Reviews retrieved successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message, message: 'Failed to retrieve reviews' });
    }
  },

  async getById(req, res) {
    try {
      const review = await ReviewService.getById(req.params.id);
      res.status(200).json({ success: true, data: review, message: 'Review retrieved successfully' });
    } catch (error) {
      const status = error.message === 'Review not found' ? 404 : 500;
      res.status(status).json({ success: false, error: error.message, message: 'Failed to retrieve review' });
    }
  },

  async create(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation error', message: errors.array()[0].msg });
    }

    try {
      const review = await ReviewService.create(req.user.id, req.body);
      res.status(201).json({ success: true, data: review, message: 'Review created successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message, message: 'Failed to create review' });
    }
  },

  async update(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation error', message: errors.array()[0].msg });
    }

    try {
      const review = await ReviewService.update(req.params.id, req.user.id, req.body);
      res.status(200).json({ success: true, data: review, message: 'Review updated successfully' });
    } catch (error) {
      const status = error.message === 'Unauthorized' ? 403 : error.message === 'Review not found' ? 404 : 500;
      res.status(status).json({ success: false, error: error.message, message: 'Failed to update review' });
    }
  },

  async delete(req, res) {
    try {
      await ReviewService.delete(req.params.id, req.user.id);
      res.status(200).json({ success: true, data: null, message: 'Review deleted successfully' });
    } catch (error) {
      const status = error.message === 'Unauthorized' ? 403 : 500;
      res.status(status).json({ success: false, error: error.message, message: 'Failed to delete review' });
    }
  }
};

export default ReviewController;
