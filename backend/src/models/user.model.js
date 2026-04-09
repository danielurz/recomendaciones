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
      [email] // Parámetro $1 evita inyección SQL
    );
    return result.rows[0]; // Retorna el primer resultado o undefined si no existe
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
  }
};

export default UserModel;
