import ReviewModel from '../models/review.model.js';

const ReviewService = {
  async getAll() {
    return await ReviewModel.findAll();
  },

  async getById(id) {
    const review = await ReviewModel.findById(id);
    if (!review) {
      throw new Error('Review not found');
    }
    return review;
  },

  async create(user_id, data) {
    return await ReviewModel.create({ user_id, ...data });
  },

  async update(id, user_id, data) {
    const isOwner = await ReviewModel.isOwner(id, user_id);
    if (!isOwner) {
      throw new Error('Unauthorized');
    }
    const review = await ReviewModel.update(id, data);
    if (!review) {
      throw new Error('Review not found');
    }
    return review;
  },

  async delete(id, user_id) {
    const isOwner = await ReviewModel.isOwner(id, user_id);
    if (!isOwner) {
      throw new Error('Unauthorized');
    }
    await ReviewModel.delete(id);
  }
};

export default ReviewService;
