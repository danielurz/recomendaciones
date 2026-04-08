import pool from '../config/db.js';

const ReviewModel = {
  async findAll() {
    const result = await pool.query(
      `SELECT r.*, u.username, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       ORDER BY r.created_at DESC`
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT r.*, u.username, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async create({ user_id, product_name, product_price, content, is_recommended, business_name, business_location_text, google_place_id, google_place_name, latitude, longitude, place_confirmed }) {
    const result = await pool.query(
      `INSERT INTO reviews
        (user_id, product_name, product_price, content, is_recommended, business_name, business_location_text, google_place_id, google_place_name, latitude, longitude, place_confirmed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [user_id, product_name, product_price, content, is_recommended, business_name, business_location_text, google_place_id, google_place_name, latitude, longitude, place_confirmed]
    );
    return result.rows[0];
  },

  async update(id, { product_name, product_price, content, is_recommended }) {
    const result = await pool.query(
      `UPDATE reviews
       SET product_name = $1, product_price = $2, content = $3, is_recommended = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [product_name, product_price, content, is_recommended, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
  },

  async isOwner(id, user_id) {
    const result = await pool.query(
      'SELECT id FROM reviews WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );
    return result.rows.length > 0;
  }
};

export default ReviewModel;
