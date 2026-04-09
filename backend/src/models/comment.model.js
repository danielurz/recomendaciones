// Pool de conexiones a la base de datos
import pool from '../config/db.js';

// Modelo de comentario: contiene todas las operaciones de base de datos relacionadas con la tabla comments
const CommentModel = {
  /**
   * Obtiene todos los comentarios de una reseña específica.
   * Incluye el username y avatar del autor de cada comentario mediante JOIN.
   * Ordena por fecha de creación ascendente (el más antiguo primero, como en un hilo de conversación).
   */
  async findByReview(review_id) {
    const result = await pool.query(
      `SELECT c.*, u.username, u.avatar_url  -- c.* trae todos los campos del comentario
       FROM comments c
       JOIN users u ON c.user_id = u.id      -- agrega datos del autor
       WHERE c.review_id = $1               -- filtra por la reseña indicada
       ORDER BY c.created_at ASC`,          -- orden cronológico para que el hilo se lea de arriba a abajo
      [review_id]
    );
    return result.rows; // Retorna array de comentarios con datos del autor
  },

  /**
   * Crea un nuevo comentario en una reseña.
   * parent_id es opcional: si se pasa, es una respuesta a otro comentario; si no, es un comentario raíz.
   * RETURNING * retorna todos los campos del comentario recién creado.
   */
  async create({ review_id, user_id, parent_id, content }) {
    const result = await pool.query(
      'INSERT INTO comments (review_id, user_id, parent_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [review_id, user_id, parent_id || null, content] // parent_id || null: convierte undefined a null para la BD
    );
    return result.rows[0]; // Retorna el comentario recién creado
  },

  /**
   * Verifica si un usuario es el propietario de un comentario.
   * Retorna true si el comentario existe y pertenece al usuario, false si no.
   * Se usa para autorizar la eliminación.
   */
  async isOwner(id, user_id) {
    const result = await pool.query(
      'SELECT id FROM comments WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );
    return result.rows.length > 0; // true = es dueño, false = no lo es
  },

  /**
   * Elimina permanentemente un comentario por su ID.
   * No retorna nada; el servicio llama a isOwner antes de eliminar.
   */
  async delete(id) {
    await pool.query('DELETE FROM comments WHERE id = $1', [id]);
  }
};

export default CommentModel;
