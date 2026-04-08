import pool from '../config/db.js';

const VoteModel = {
  async findByReviewAndUser(review_id, user_id) {
    const result = await pool.query(
      'SELECT * FROM review_votes WHERE review_id = $1 AND user_id = $2',
      [review_id, user_id]
    );
    return result.rows[0];
  },

  async create(review_id, user_id, vote) {
    const result = await pool.query(
      'INSERT INTO review_votes (review_id, user_id, vote) VALUES ($1, $2, $3) RETURNING *',
      [review_id, user_id, vote]
    );
    return result.rows[0];
  },

  async update(review_id, user_id, vote) {
    const result = await pool.query(
      'UPDATE review_votes SET vote = $1 WHERE review_id = $2 AND user_id = $3 RETURNING *',
      [vote, review_id, user_id]
    );
    return result.rows[0];
  },

  async delete(review_id, user_id) {
    await pool.query(
      'DELETE FROM review_votes WHERE review_id = $1 AND user_id = $2',
      [review_id, user_id]
    );
  }
};

export default VoteModel;
