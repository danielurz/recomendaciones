import pool from '../config/db.js';
import { generateEmbedding, generateQueryEmbedding } from '../ai/gemini.js';

const ReviewModel = {
  async findAll() {
    const result = await pool.query(
      `SELECT r.id, r.user_id, r.product_name, r.product_price, r.content, r.is_recommended,
        r.business_name, r.business_location_text, r.google_place_id, r.google_place_name,
        r.latitude, r.longitude, r.place_confirmed, r.score, r.created_at, r.updated_at,
        u.username, u.avatar_url,
        COUNT(DISTINCT c.id)::INT AS comment_count,
        COUNT(DISTINCT CASE WHEN rv.vote = 1 THEN rv.id END)::INT AS upvotes,
        COUNT(DISTINCT CASE WHEN rv.vote = -1 THEN rv.id END)::INT AS downvotes
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN comments c ON c.review_id = r.id
       LEFT JOIN review_votes rv ON rv.review_id = r.id
       GROUP BY r.id, u.username, u.avatar_url
       ORDER BY r.created_at DESC`
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT r.id, r.user_id, r.product_name, r.product_price, r.content, r.is_recommended,
        r.business_name, r.business_location_text, r.google_place_id, r.google_place_name,
        r.latitude, r.longitude, r.place_confirmed, r.score, r.created_at, r.updated_at,
        u.username, u.avatar_url,
        COUNT(DISTINCT c.id)::INT AS comment_count,
        COUNT(DISTINCT CASE WHEN rv.vote = 1 THEN rv.id END)::INT AS upvotes,
        COUNT(DISTINCT CASE WHEN rv.vote = -1 THEN rv.id END)::INT AS downvotes
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN comments c ON c.review_id = r.id
       LEFT JOIN review_votes rv ON rv.review_id = r.id
       WHERE r.id = $1
       GROUP BY r.id, u.username, u.avatar_url`,
      [id]
    );
    return result.rows[0];
  },

  async create({ user_id, product_name, product_price, content, is_recommended, business_name, business_location_text, google_place_id, google_place_name, latitude, longitude, place_confirmed }) {
    const embeddingText = `${business_name} ${product_name} ${content}`;
    const embedding = await generateEmbedding(embeddingText);

    const result = await pool.query(
      `INSERT INTO reviews
        (user_id, product_name, product_price, content, is_recommended, business_name, business_location_text, google_place_id, google_place_name, latitude, longitude, place_confirmed, embedding)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, user_id, product_name, product_price, content, is_recommended,
        business_name, business_location_text, google_place_id, google_place_name,
        latitude, longitude, place_confirmed, score, created_at, updated_at`,
      [user_id, product_name, product_price, content, is_recommended, business_name, business_location_text, google_place_id, google_place_name, latitude, longitude, place_confirmed, JSON.stringify(embedding)]
    );
    return result.rows[0];
  },

  async findSimilar(query, limit = 10) {
    const embedding = await generateQueryEmbedding(query);
    const result = await pool.query(
      `SELECT r.id, r.user_id, r.product_name, r.product_price, r.content, r.is_recommended,
        r.business_name, r.business_location_text, r.google_place_id, r.google_place_name,
        r.latitude, r.longitude, r.place_confirmed, r.score, r.created_at, r.updated_at,
        u.username, u.avatar_url,
        COUNT(DISTINCT c.id)::INT AS comment_count,
        COUNT(DISTINCT CASE WHEN rv.vote = 1 THEN rv.id END)::INT AS upvotes,
        COUNT(DISTINCT CASE WHEN rv.vote = -1 THEN rv.id END)::INT AS downvotes
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN comments c ON c.review_id = r.id
       LEFT JOIN review_votes rv ON rv.review_id = r.id
       WHERE r.embedding IS NOT NULL
        AND r.embedding <=> $1::vector(3072) < 0.65
       GROUP BY r.id, u.username, u.avatar_url
       ORDER BY r.embedding <=> $1::vector(3072)
       LIMIT $2`,
      [JSON.stringify(embedding), limit]
    );
    return result.rows;
  },

  async update(id, { product_name, product_price, content, is_recommended }) {
    const result = await pool.query(
      `UPDATE reviews
       SET product_name = $1, product_price = $2, content = $3, is_recommended = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, user_id, product_name, product_price, content, is_recommended,
        business_name, business_location_text, google_place_id, google_place_name,
        latitude, longitude, place_confirmed, score, created_at, updated_at`,
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
