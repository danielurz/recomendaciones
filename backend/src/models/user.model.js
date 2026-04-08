import pool from '../config/db.js';

const UserModel = {
  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query(
      'SELECT id, username, email, avatar_url, bio, reputation_score, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async create({ username, email, password_hash }) {
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, password_hash]
    );
    return result.rows[0];
  }
};

export default UserModel;
