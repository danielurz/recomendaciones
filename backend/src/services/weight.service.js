import pool from '../config/db.js';
import { getReputationMultiplier } from '../utils/reputation_multiplier.js';

const WeightService = {
  /**
   * Recalculates and persists the weight of a review.
   *
   * Formula:
   *   weight = net_weighted_votes × time_decay
   *
   *   net_weighted_votes = Σ (voter_reputation_multiplier × vote_direction)
   *   time_decay         = e^(-age_in_days / 730)   -- half-life ~2 years
   *
   * A review with no votes has weight = 0.
   * Heavily downvoted reviews approach negative values; the ORDER BY formula
   * in findSimilar handles this with a logarithmic scale so they still appear
   * if semantically relevant but rank below neutral/positive reviews.
   */
  async recalculate(review_id) {
    const reviewResult = await pool.query(
      'SELECT created_at FROM reviews WHERE id = $1',
      [review_id]
    );
    if (!reviewResult.rows[0]) return;

    const ageInDays =
      (Date.now() - new Date(reviewResult.rows[0].created_at).getTime()) /
      (1000 * 60 * 60 * 24);

    // Two-phase decay:
    //   Grace period : first 30 days → no decay (factor = 1.0)
    //   Phase 1 (slow) : days 30–365 → loses ~12.8% over the first year (k = 2500)
    //   Phase 2 (fast) : after day 365 → accelerates from the 87.2% baseline (k = 600)
    //
    //   1 month → 100% │ 6 months → 94.2% │ 1 year → 87.2%
    //   2 years → 47.6% │ 3 years → 26% │ 5 years → 7.7%
    const ageEffective = Math.max(0, ageInDays - 30);
    const PHASE1_K = 2500;
    const PHASE2_K = 600;
    const PHASE1_DAYS = 335; // 365 total - 30 grace
    const PHASE1_END = Math.exp(-PHASE1_DAYS / PHASE1_K); // ~0.872 baseline

    const timeFactor = ageEffective <= PHASE1_DAYS
      ? Math.exp(-ageEffective / PHASE1_K)
      : PHASE1_END * Math.exp(-(ageEffective - PHASE1_DAYS) / PHASE2_K);

    const votesResult = await pool.query(
      `SELECT rv.vote, u.reputation_score
       FROM review_votes rv
       JOIN users u ON rv.user_id = u.id
       WHERE rv.review_id = $1`,
      [review_id]
    );

    const netWeightedVotes = votesResult.rows.reduce((sum, row) => {
      const multiplier = getReputationMultiplier(row.reputation_score);
      return sum + multiplier * row.vote;
    }, 0);

    const weight = netWeightedVotes * timeFactor;

    await pool.query(
      'UPDATE reviews SET weight = $1 WHERE id = $2',
      [weight, review_id]
    );

    return weight;
  },
};

export default WeightService;
