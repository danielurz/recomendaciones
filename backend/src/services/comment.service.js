import CommentModel from '../models/comment.model.js';
import ReviewModel from '../models/review.model.js';

const CommentService = {
  async getByReview(review_id) {
    const review = await ReviewModel.findById(review_id);
    if (!review) {
      throw new Error('Review not found');
    }
    return await CommentModel.findByReview(review_id);
  },

  async create(review_id, user_id, { content, parent_id }) {
    const review = await ReviewModel.findById(review_id);
    if (!review) {
      throw new Error('Review not found');
    }
    return await CommentModel.create({ review_id, user_id, parent_id, content });
  },

  async delete(id, user_id) {
    const isOwner = await CommentModel.isOwner(id, user_id);
    if (!isOwner) {
      throw new Error('Unauthorized');
    }
    await CommentModel.delete(id);
  }
};

export default CommentService;
