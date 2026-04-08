import { validationResult } from 'express-validator';
import VoteService from '../services/vote.service.js';

const VoteController = {
  async vote(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation error', message: errors.array()[0].msg });
    }

    try {
      const result = await VoteService.vote(req.params.id, req.user.id, req.body.vote);
      const message = result ? 'Vote registered successfully' : 'Vote removed successfully';
      res.status(200).json({ success: true, data: result, message });
    } catch (error) {
      const status = error.message === 'Review not found' ? 404 : error.message === 'You cannot vote your own review' ? 403 : 500;
      res.status(status).json({ success: false, error: error.message, message: 'Failed to register vote' });
    }
  }
};

export default VoteController;
