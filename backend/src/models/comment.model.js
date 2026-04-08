import pool from '../config/db.js';

const CommentModel = {
  async findByReview(review_id) {
    const result = await pool.query(
      `SELECT c.*, u.username, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.review_id = $1
       ORDER BY c.created_at ASC`,
      [review_id]
    );
    return result.rows;
  },

  async create({ review_id, user_id, parent_id, content }) {
    const result = await pool.query(
      'INSERT INTO comments (review_id, user_id, parent_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [review_id, user_id, parent_id || null, content]
    );
    return result.rows[0];
  },

  async isOwner(id, user_id) {
    const result = await pool.query(
      'SELECT id FROM comments WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );
    return result.rows.length > 0;
  },

  async delete(id) {
    await pool.query('DELETE FROM comments WHERE id = $1', [id]);
  }
};

export default CommentModel;
