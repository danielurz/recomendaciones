// Pool de conexiones a la base de datos
import pool from '../config/db.js';

// Modelo de voto de comentario: operaciones CRUD sobre la tabla comment_votes
// Espeja la estructura de vote.model.js pero para comentarios en lugar de reseñas
const CommentVoteModel = {
  /**
   * Busca el voto que un usuario específico emitió sobre un comentario.
   * Retorna el registro existente o undefined si el usuario no ha votado ese comentario.
   * Se usa para saber si crear, actualizar o eliminar el voto.
   */
  async findByCommentAndUser(comment_id, user_id) {
    const result = await pool.query(
      'SELECT * FROM comment_votes WHERE comment_id = $1 AND user_id = $2',
      [comment_id, user_id]
    );
    return result.rows[0]; // Retorna el voto o undefined si no existe
  },

  /**
   * Registra un nuevo voto de un usuario sobre un comentario.
   * vote debe ser 1 (útil) o -1 (no útil).
   * La constraint UNIQUE(comment_id, user_id) en la BD evita votos duplicados.
   */
  async create(comment_id, user_id, vote) {
    const result = await pool.query(
      'INSERT INTO comment_votes (comment_id, user_id, vote) VALUES ($1, $2, $3) RETURNING *',
      [comment_id, user_id, vote]
    );
    return result.rows[0]; // Retorna el voto recién creado
  },

  /**
   * Cambia el valor de un voto existente (de +1 a -1 o viceversa).
   * Se llama cuando el usuario ya votó pero quiere cambiar su voto al opuesto.
   */
  async update(comment_id, user_id, vote) {
    const result = await pool.query(
      'UPDATE comment_votes SET vote = $1 WHERE comment_id = $2 AND user_id = $3 RETURNING *',
      [vote, comment_id, user_id]
    );
    return result.rows[0]; // Retorna el voto actualizado
  },

  /**
   * Elimina el voto de un usuario sobre un comentario.
   * Se llama cuando el usuario vuelve a votar igual (toggle: voto igual → eliminar).
   */
  async delete(comment_id, user_id) {
    await pool.query(
      'DELETE FROM comment_votes WHERE comment_id = $1 AND user_id = $2',
      [comment_id, user_id]
    );
  }
};

export default CommentVoteModel;
