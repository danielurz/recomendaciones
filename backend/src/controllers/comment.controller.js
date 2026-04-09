// validationResult: lee los errores que dejaron los validadores de express-validator en la ruta
import { validationResult } from 'express-validator';
// Servicio que contiene la lógica de negocio de comentarios
import CommentService from '../services/comment.service.js';

// Controlador de comentarios: maneja las solicitudes HTTP de comentarios en reseñas
const CommentController = {
  /**
   * GET /api/reviews/:id/comments
   * Retorna todos los comentarios de una reseña. Ruta pública, no requiere autenticación.
   * req.params.id es el ID de la reseña (viene del router padre con mergeParams: true).
   * Responde 200 con los comentarios, 404 si la reseña no existe, 500 para otros errores.
   */
  async getByReview(req, res) {
    try {
      // req.params.id es el ID de la reseña padre (disponible gracias a mergeParams: true)
      const comments = await CommentService.getByReview(req.params.id);
      res.status(200).json({ success: true, data: comments, message: 'Comments retrieved successfully' });
    } catch (error) {
      // 404 si la reseña no existe, 500 para errores inesperados
      const status = error.message === 'Review not found' ? 404 : 500;
      res.status(status).json({ success: false, error: error.message, message: 'Failed to retrieve comments' });
    }
  },

  /**
   * POST /api/reviews/:id/comments
   * Crea un nuevo comentario en una reseña. Requiere autenticación.
   * Responde 201 con el comentario creado, 400 validación, 404 reseña no existe, 500 error.
   */
  async create(req, res) {
    // Valida que el campo content no esté vacío
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation error', message: errors.array()[0].msg });
    }

    try {
      // req.params.id = ID de la reseña, req.user.id = ID del usuario autenticado
      const comment = await CommentService.create(req.params.id, req.user.id, req.body);
      // 201 Created: el comentario fue creado exitosamente
      res.status(201).json({ success: true, data: comment, message: 'Comment created successfully' });
    } catch (error) {
      const status = error.message === 'Review not found' ? 404 : 500;
      res.status(status).json({ success: false, error: error.message, message: 'Failed to create comment' });
    }
  },

  /**
   * DELETE /api/reviews/:id/comments/:commentId
   * Elimina un comentario. Solo el propietario puede eliminarlo.
   * req.params.commentId es el ID del comentario (parámetro específico de esta ruta).
   * Responde 200 si fue eliminado, 403 sin permiso, 500 error inesperado.
   */
  async delete(req, res) {
    try {
      // req.params.commentId es el ID del comentario, req.user.id del usuario autenticado
      await CommentService.delete(req.params.commentId, req.user.id);
      res.status(200).json({ success: true, data: null, message: 'Comment deleted successfully' });
    } catch (error) {
      // 403 Forbidden: el usuario no es el dueño del comentario
      const status = error.message === 'Unauthorized' ? 403 : 500;
      res.status(status).json({ success: false, error: error.message, message: 'Failed to delete comment' });
    }
  }
};

export default CommentController;
