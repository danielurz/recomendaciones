import pool from '../config/db.js';
import { getReputationMultiplier } from '../utils/reputation_multiplier.js';

// Cuánto aporta cada upvote/downvote a la reputación del autor
const REVIEW_FACTOR  = 0.15; // upvote/downvote en reseña
const COMMENT_FACTOR = 0.05; // upvote/downvote en comentario

/**
 * Applies a reputation delta to a user.
 * reputation_score never goes below 0 (the multiplier handles the 0.1 floor separately).
 */
async function applyDelta(author_id, delta) {
  await pool.query(
    `UPDATE users
     SET reputation_score = GREATEST(0, reputation_score + $1)
     WHERE id = $2`,
    [delta, author_id]
  );
}

/**
 * Gets the reputation multiplier of a voter from the DB.
 */
async function getVoterMultiplier(voter_id) {
  const result = await pool.query(
    'SELECT reputation_score FROM users WHERE id = $1',
    [voter_id]
  );
  return getReputationMultiplier(result.rows[0]?.reputation_score ?? 0);
}

const ReputationService = {
  /**
   * Called after a review vote changes.
   * vote_delta: net change in vote value
   *   new vote     → +1 or -1
   *   toggle off   → -existing_vote  (e.g. was +1, now removed → delta = -1)
   *   changed vote → new_vote - old_vote  (e.g. +1 → -1 = delta of -2)
   */
  async onReviewVote(review_id, voter_id, vote_delta) {
    if (vote_delta === 0) return;

    const reviewResult = await pool.query(
      'SELECT user_id FROM reviews WHERE id = $1',
      [review_id]
    );
    const author_id = reviewResult.rows[0]?.user_id;
    if (!author_id || author_id === voter_id) return;

    const voterMultiplier = await getVoterMultiplier(voter_id);
    const delta = vote_delta * voterMultiplier * REVIEW_FACTOR;
    await applyDelta(author_id, delta);
  },

  /**
   * Called after a comment vote changes.
   * vote_delta follows the same convention as onReviewVote.
   */
  async onCommentVote(comment_id, voter_id, vote_delta) {
    if (vote_delta === 0) return;

    const commentResult = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [comment_id]
    );
    const author_id = commentResult.rows[0]?.user_id;
    if (!author_id || author_id === voter_id) return;

    const voterMultiplier = await getVoterMultiplier(voter_id);
    const delta = vote_delta * voterMultiplier * COMMENT_FACTOR;
    await applyDelta(author_id, delta);
  },

  /**
   * Updates last_active_at for a user (called on review or comment creation).
   */
  async markActive(user_id) {
    await pool.query(
      'UPDATE users SET last_active_at = NOW() WHERE id = $1',
      [user_id]
    );
  },

  /**
   * Applies inactivity decay:
   * Users inactive for 90+ days lose 0.5% of reputation per week,
   * down to a floor of 1.0.
   * Designed to be run once per week via a cron script.
   */
  async applyInactivityDecay() {
    const result = await pool.query(
      `UPDATE users
       SET reputation_score = GREATEST(1, reputation_score * 0.995)
       WHERE reputation_score > 1
         AND (
           last_active_at IS NULL
           OR last_active_at < NOW() - INTERVAL '90 days'
         )
       RETURNING id, reputation_score`
    );
    return result.rows.length;
  }
};

export default ReputationService;
