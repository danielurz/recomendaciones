// Modelo de voto de comentario para acceder a la base de datos
import CommentVoteModel from '../models/comment_vote.model.js';
// Pool de conexiones directo para verificar existencia del comentario
import pool from '../config/db.js';
// Servicio de reputación para actualizar el puntaje del autor tras cada voto
import ReputationService from './reputation.service.js';

// Servicio de votos de comentario: espeja la lógica de vote.service.js pero para comentarios
const CommentVoteService = {
  /**
   * Registra, actualiza o elimina el voto de un usuario sobre un comentario.
   * Implementa lógica de toggle idéntica a vote.service.js:
   *   - Si no ha votado → crea el voto
   *   - Si ya votó igual → elimina el voto (toggle off), retorna null
   *   - Si ya votó diferente → actualiza al nuevo valor
   *
   * @param {string} comment_id - ID del comentario a votar
   * @param {string} user_id - ID del usuario que vota
   * @param {number} vote - Valor del voto: 1 (útil) o -1 (no útil)
   * @returns {object|null} El voto creado/actualizado, o null si fue eliminado
   */
  async vote(comment_id, user_id, vote) {
    // Verifica que el comentario exista y obtiene su propietario en la misma consulta
    const { rows } = await pool.query(
      'SELECT id, user_id FROM comments WHERE id = $1',
      [comment_id]
    );
    if (!rows[0]) throw new Error('Comment not found');

    // Un usuario no puede votar su propio comentario (evita manipulación de reputación)
    if (rows[0].user_id === user_id) throw new Error('You cannot vote your own comment');

    // Busca si el usuario ya tiene un voto registrado para este comentario
    const existing = await CommentVoteModel.findByCommentAndUser(comment_id, user_id);

    // Caso 1: El usuario no ha votado antes → crea el voto nuevo
    if (!existing) {
      const result = await CommentVoteModel.create(comment_id, user_id, vote);
      await ReputationService.onCommentVote(comment_id, user_id, vote);
      return result;
    }

    // Caso 2: El usuario ya votó con el mismo valor → elimina el voto (toggle off)
    if (existing.vote === vote) {
      await CommentVoteModel.delete(comment_id, user_id);
      await ReputationService.onCommentVote(comment_id, user_id, -existing.vote); // revierte el efecto del voto eliminado
      return null;
    }

    // Caso 3: El usuario ya votó pero con valor diferente → actualiza al nuevo valor
    const result = await CommentVoteModel.update(comment_id, user_id, vote);
    await ReputationService.onCommentVote(comment_id, user_id, vote - existing.vote); // delta = diferencia entre votos
    return result;
  }
};

export default CommentVoteService;
