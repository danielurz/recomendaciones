// Modelo de comentario para acceder a la base de datos
import CommentModel from '../models/comment.model.js';
import ReviewModel from '../models/review.model.js';
import ReputationService from './reputation.service.js';

// Servicio de comentarios: contiene la lógica de negocio para comentarios en reseñas
const CommentService = {
  /**
   * Obtiene todos los comentarios de una reseña específica.
   * Primero verifica que la reseña exista para evitar consultas huérfanas.
   * Lanza 'Review not found' si la reseña no existe.
   */
  async getByReview(review_id) {
    // Valida que la reseña existe antes de buscar sus comentarios
    const review = await ReviewModel.findById(review_id);
    if (!review) {
      throw new Error('Review not found'); // El controlador convierte esto en respuesta 404
    }
    return await CommentModel.findByReview(review_id);
  },

  /**
   * Crea un comentario en una reseña específica.
   * Valida que la reseña exista antes de crear el comentario.
   * parent_id es opcional: permite responder a otro comentario (comentarios anidados).
   */
  async create(review_id, user_id, { content, parent_id }) {
    // Valida que la reseña existe antes de agregar el comentario
    const review = await ReviewModel.findById(review_id);
    if (!review) {
      throw new Error('Review not found'); // El controlador convierte esto en respuesta 404
    }
    // Crea el comentario con todos los campos necesarios
    const comment = await CommentModel.create({ review_id, user_id, parent_id, content });
    await ReputationService.markActive(user_id);
    return comment;
  },

  /**
   * Elimina un comentario, pero solo si el usuario autenticado es el propietario.
   * Lanza 'Unauthorized' si no es el dueño (también cubre el caso de que no exista).
   */
  async delete(id, user_id) {
    // Verifica que el usuario sea el dueño del comentario antes de eliminarlo
    const isOwner = await CommentModel.isOwner(id, user_id);
    if (!isOwner) {
      throw new Error('Unauthorized'); // El controlador convierte esto en respuesta 403
    }
    await CommentModel.delete(id);
  }
};

export default CommentService;
