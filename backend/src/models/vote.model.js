// Pool de conexiones a la base de datos
import pool from '../config/db.js';

// Modelo de voto: contiene todas las operaciones de base de datos relacionadas con la tabla review_votes
const VoteModel = {
  /**
   * Busca el voto que un usuario específico emitió sobre una reseña específica.
   * Retorna el voto existente o undefined si el usuario no ha votado esa reseña.
   * Se usa para saber si crear un voto nuevo, actualizarlo o eliminarlo.
   */
  async findByReviewAndUser(review_id, user_id) {
    const result = await pool.query(
      'SELECT * FROM review_votes WHERE review_id = $1 AND user_id = $2',
      [review_id, user_id]
    );
    return result.rows[0]; // Retorna el voto o undefined si no existe
  },

  /**
   * Registra un nuevo voto de un usuario sobre una reseña.
   * vote debe ser 1 (útil) o -1 (no útil).
   * La constraint UNIQUE(review_id, user_id) en la BD evita votos duplicados.
   */
  async create(review_id, user_id, vote) {
    const result = await pool.query(
      'INSERT INTO review_votes (review_id, user_id, vote) VALUES ($1, $2, $3) RETURNING *',
      [review_id, user_id, vote]
    );
    return result.rows[0]; // Retorna el voto recién creado
  },

  /**
   * Cambia el valor de un voto existente (de +1 a -1 o viceversa).
   * Se llama cuando el usuario ya votó pero quiere cambiar su voto al opuesto.
   */
  async update(review_id, user_id, vote) {
    const result = await pool.query(
      'UPDATE review_votes SET vote = $1 WHERE review_id = $2 AND user_id = $3 RETURNING *',
      [vote, review_id, user_id]
    );
    return result.rows[0]; // Retorna el voto actualizado
  },

  /**
   * Elimina el voto de un usuario sobre una reseña.
   * Se llama cuando el usuario vuelve a votar igual (toggle: si ya votó +1 y vuelve a presionar +1, se elimina).
   */
  async delete(review_id, user_id) {
    await pool.query(
      'DELETE FROM review_votes WHERE review_id = $1 AND user_id = $2',
      [review_id, user_id]
    );
  }
};

export default VoteModel;
