// Modelo de voto para acceder a la base de datos
import VoteModel from '../models/vote.model.js';
// Modelo de reseña para verificar que existe y obtener su propietario
import ReviewModel from '../models/review.model.js';
// Servicio de peso para recalcular el weight de la reseña tras cada voto
import WeightService from './weight.service.js';
import ReputationService from './reputation.service.js';

// Servicio de votos: contiene la lógica de negocio para el sistema de votación
const VoteService = {
  /**
   * Registra, actualiza o elimina el voto de un usuario sobre una reseña.
   * Implementa lógica de toggle:
   *   - Si no ha votado → crea el voto
   *   - Si ya votó igual → elimina el voto (toggle off)
   *   - Si ya votó diferente → actualiza al nuevo valor
   *
   * @param {string} review_id - ID de la reseña a votar
   * @param {string} user_id - ID del usuario que vota
   * @param {number} vote - Valor del voto: 1 (útil) o -1 (no útil)
   * @returns {object|null} El voto creado/actualizado, o null si fue eliminado
   */
  async vote(review_id, user_id, vote) {
    // Verifica que la reseña exista antes de intentar votar
    const review = await ReviewModel.findById(review_id);
    if (!review) {
      throw new Error('Review not found'); // El controlador convierte esto en respuesta 404
    }

    // Un usuario no puede votar su propia reseña (evita manipulación del score)
    if (review.user_id === user_id) {
      throw new Error('You cannot vote your own review'); // El controlador convierte esto en respuesta 403
    }

    // Busca si el usuario ya tiene un voto registrado para esta reseña
    const existing = await VoteModel.findByReviewAndUser(review_id, user_id);

    let result;

    // Caso 1: El usuario no ha votado antes → crea el voto nuevo
    if (!existing) {
      result = await VoteModel.create(review_id, user_id, vote);
      await WeightService.recalculate(review_id);
      await ReputationService.onReviewVote(review_id, user_id, vote);
      return result;
    }

    // Caso 2: El usuario ya votó con el mismo valor → elimina el voto (toggle off)
    if (existing.vote === vote) {
      await VoteModel.delete(review_id, user_id);
      await WeightService.recalculate(review_id);
      await ReputationService.onReviewVote(review_id, user_id, -existing.vote);
      return null;
    }

    // Caso 3: El usuario ya votó pero con valor diferente → actualiza al nuevo valor
    result = await VoteModel.update(review_id, user_id, vote);
    await WeightService.recalculate(review_id);
    await ReputationService.onReviewVote(review_id, user_id, vote - existing.vote);
    return result;
  }
};

export default VoteService;
