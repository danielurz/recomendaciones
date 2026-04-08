import ReviewModel from '../models/review.model.js';
import { generateSummary } from '../ai/gemini.js';

const SearchController = {
  async search(req, res) {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Query is required', message: 'Please provide a search query' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const t0 = Date.now();
      const results = await ReviewModel.findSimilar(q);
      const t1 = Date.now();
      console.log(`[search] embedding+pgvector: ${t1 - t0}ms`);

      res.write(`event: results\ndata: ${JSON.stringify({ success: true, data: { results }, message: `${results.length} results found` })}\n\n`);

      const summary = await generateSummary(q, results);
      const t2 = Date.now();
      console.log(`[search] summary: ${t2 - t1}ms | total: ${t2 - t0}ms`);

      res.write(`event: summary\ndata: ${JSON.stringify({ success: true, data: { summary } })}\n\n`);
    } catch (error) {
      res.write(`event: error\ndata: ${JSON.stringify({ success: false, error: error.message, message: 'Search failed' })}\n\n`);
    } finally {
      res.end();
    }
  }
};

export default SearchController;
