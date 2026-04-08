import VoteModel from '../models/vote.model.js';
import ReviewModel from '../models/review.model.js';

const VoteService = {
  async vote(review_id, user_id, vote) {
    const review = await ReviewModel.findById(review_id);
    if (!review) {
      throw new Error('Review not found');
    }

    if (review.user_id === user_id) {
      throw new Error('You cannot vote your own review');
    }

    const existing = await VoteModel.findByReviewAndUser(review_id, user_id);

    if (!existing) {
      return await VoteModel.create(review_id, user_id, vote);
    }

    if (existing.vote === vote) {
      await VoteModel.delete(review_id, user_id);
      return null;
    }

    return await VoteModel.update(review_id, user_id, vote);
  }
};

export default VoteService;
