import ReviewModel from '../models/review.model.js';
import { generateSummary } from '../ai/gemini.js';

const SearchController = {
  async results(req, res) {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Query is required', message: 'Please provide a search query' });
    }
    try {
      const t0 = Date.now();
      const results = await ReviewModel.findSimilar(q);
      console.log(`[search] results: ${Date.now() - t0}ms, ${results.length} found`);
      res.status(200).json({ success: true, data: { results } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message, message: 'Search failed' });
    }
  },

  async summary(req, res) {
    const { q } = req.query;
    const { results } = req.body;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Query is required', message: 'Please provide a search query' });
    }
    try {
      const t0 = Date.now();
      const reviews = Array.isArray(results) ? results : await ReviewModel.findSimilar(q);
      console.log(`[search] summary input: ${reviews.length} reviews, q="${q}"`);
      const summary = await generateSummary(q, reviews);
      console.log(`[search] summary output: "${summary?.slice(0, 80)}"`);
      console.log(`[search] summary: ${Date.now() - t0}ms`);
      res.status(200).json({ success: true, data: { summary } });
    } catch (error) {
      console.error('[search] summary error:', error.message);
      res.status(500).json({ success: false, error: error.message, message: 'Summary failed' });
    }
  }
};

export default SearchController;
