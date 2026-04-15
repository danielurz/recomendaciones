// Controller for public user profile endpoints.
// Combines user data and their reviews into a single response for the profile page.
import UserModel from '../models/user.model.js';
import ReviewModel from '../models/review.model.js';

const UserController = {
  // GET /api/users/:id
  // Returns a user's public profile and all reviews they have authored.
  // Accessible by anyone (no auth required).
  async getProfile(req, res) {
    const { id } = req.params;
    try {
      const user = await UserModel.findById(id);

      // Return 404 if the user does not exist
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found', message: 'User not found' });
      }

      // Fetch all reviews written by this user (ordered by created_at DESC in the model)
      const reviews = await ReviewModel.findByUser(id);

      res.status(200).json({
        success: true,
        data: { user, reviews },
        message: 'Profile fetched successfully'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message, message: 'Failed to fetch profile' });
    }
  }
};

export default UserController;
