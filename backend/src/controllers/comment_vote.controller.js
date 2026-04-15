// Controller for comment vote endpoints.
// Delegates business logic to CommentVoteService and maps results to HTTP responses.
import CommentVoteService from '../services/comment_vote.service.js';

const CommentVoteController = {
  // POST /api/reviews/:id/comments/:commentId/vote
  // Casts, changes, or removes a vote on a comment.
  // Requires authentication. Comment owners cannot vote on their own comments.
  // Body: { vote: 1 | -1 }
  // Returns the new vote record or null if the vote was toggled off.
  async vote(req, res) {
    const { commentId } = req.params;
    const { vote } = req.body;
    const user_id = req.user.id; // injected by authMiddleware

    // Only +1 (upvote) and -1 (downvote) are valid values
    if (vote !== 1 && vote !== -1) {
      return res.status(400).json({ success: false, error: 'Invalid vote', message: 'Vote must be 1 or -1' });
    }

    try {
      // Service handles toggle logic: same vote → remove, different vote → update, no prior vote → insert
      const result = await CommentVoteService.vote(commentId, user_id, vote);

      // result is null when the vote was removed (toggle off)
      const message = result === null ? 'Vote removed' : vote === 1 ? 'Upvoted' : 'Downvoted';
      res.status(200).json({ success: true, data: result, message });
    } catch (error) {
      // Map known service errors to appropriate HTTP status codes
      const status = error.message === 'Comment not found' ? 404
                   : error.message.includes('cannot vote') ? 403 : 500;
      res.status(status).json({ success: false, error: error.message, message: error.message });
    }
  }
};

export default CommentVoteController;
