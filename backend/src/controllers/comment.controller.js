import { validationResult } from 'express-validator';
import CommentService from '../services/comment.service.js';

const CommentController = {
  async getByReview(req, res) {
    try {
      const comments = await CommentService.getByReview(req.params.id);
      res.status(200).json({ success: true, data: comments, message: 'Comments retrieved successfully' });
    } catch (error) {
      const status = error.message === 'Review not found' ? 404 : 500;
      res.status(status).json({ success: false, error: error.message, message: 'Failed to retrieve comments' });
    }
  },

  async create(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation error', message: errors.array()[0].msg });
    }

    try {
      const comment = await CommentService.create(req.params.id, req.user.id, req.body);
      res.status(201).json({ success: true, data: comment, message: 'Comment created successfully' });
    } catch (error) {
      const status = error.message === 'Review not found' ? 404 : 500;
      res.status(status).json({ success: false, error: error.message, message: 'Failed to create comment' });
    }
  },

  async delete(req, res) {
    try {
      await CommentService.delete(req.params.commentId, req.user.id);
      res.status(200).json({ success: true, data: null, message: 'Comment deleted successfully' });
    } catch (error) {
      const status = error.message === 'Unauthorized' ? 403 : 500;
      res.status(status).json({ success: false, error: error.message, message: 'Failed to delete comment' });
    }
  }
};

export default CommentController;
