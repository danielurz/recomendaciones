import ReviewModel from '../models/review.model.js';
import { semanticSearch } from '../ai/gemini.js';

const SearchController = {
  async search(req, res) {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Query is required', message: 'Please provide a search query' });
    }

    try {
      const allReviews = await ReviewModel.findAll();
      const results = await semanticSearch(q, allReviews);
      res.status(200).json({ success: true, data: results, message: `${results.length} results found` });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message, message: 'Search failed' });
    }
  }
};

export default SearchController;
