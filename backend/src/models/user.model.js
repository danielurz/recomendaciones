// Pool de conexiones a la base de datos
import pool from '../config/db.js';

// Modelo de usuario: contiene todas las operaciones de base de datos relacionadas con la tabla users
const UserModel = {
  /**
   * Busca un usuario por su email.
   * Retorna todos los campos, incluyendo password_hash (se usa en el login para comparar contraseñas).
   */
  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  async findByUsername(username) {
    const result = await pool.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );
    return result.rows[0];
  },

  /**
   * Busca un usuario por su ID.
   * Excluye el password_hash por seguridad (se usa para mostrar perfil público).
   */
  async findById(id) {
    const result = await pool.query(
      'SELECT id, username, email, avatar_url, bio, reputation_score, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0]; // Retorna el usuario o undefined si no existe
  },

  /**
   * Crea un nuevo usuario en la base de datos.
   * Recibe el hash de la contraseña ya procesado (nunca la contraseña en texto plano).
   * Retorna solo los campos públicos del usuario recién creado.
   */
  async create({ username, email, password_hash }) {
    const result = await pool.query(
      // RETURNING devuelve los campos del registro insertado sin necesidad de otra consulta
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, password_hash]
    );
    return result.rows[0]; // Retorna el nuevo usuario con su ID generado
  },

  /**
   * Guarda el token de reset y su fecha de expiración en el usuario.
   * Sobreescribe cualquier token previo que no haya sido usado.
   */
  async saveResetToken(email, token, expiresAt) {
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE email = $3',
      [token, expiresAt, email]
    );
  },

  /**
   * Busca un usuario por su reset token.
   * Retorna el usuario solo si el token existe y no ha expirado.
   */
  async findByResetToken(token) {
    const result = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires_at > NOW()',
      [token]
    );
    return result.rows[0];
  },

  /**
   * Actualiza la contraseña del usuario y elimina el token de reset usado.
   */
  async updatePassword(id, password_hash) {
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL WHERE id = $2',
      [password_hash, id]
    );
  }
};

export default UserModel;
