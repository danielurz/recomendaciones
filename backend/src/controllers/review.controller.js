// validationResult: lee los errores que dejaron los validadores de express-validator en la ruta
import { validationResult } from 'express-validator';
// Servicio que contiene la lógica de negocio de reseñas
import ReviewService from '../services/review.service.js';

// Controlador de reseñas: maneja las solicitudes HTTP del CRUD de reseñas
const ReviewController = {
  /**
   * GET /api/reviews
   * Retorna todas las reseñas. Ruta pública, no requiere autenticación.
   * Responde 200 con el listado o 500 si ocurre un error inesperado.
   */
  async getAll(req, res) {
    try {
      const reviews = await ReviewService.getAll();
      res.status(200).json({ success: true, data: reviews, message: 'Reviews retrieved successfully' });
    } catch (error) {
      // 500 Internal Server Error: error inesperado en base de datos u otro servicio
      res.status(500).json({ success: false, error: error.message, message: 'Failed to retrieve reviews' });
    }
  },

  /**
   * GET /api/reviews/:id
   * Retorna el detalle de una reseña específica. Ruta pública.
   * Responde 200 si existe, 404 si no se encuentra, 500 para otros errores.
   */
  async getById(req, res) {
    try {
      // req.params.id viene del segmento de URL /:id
      const review = await ReviewService.getById(req.params.id);
      res.status(200).json({ success: true, data: review, message: 'Review retrieved successfully' });
    } catch (error) {
      // Mapea el error del servicio al código HTTP correspondiente
      const status = error.message === 'Review not found' ? 404 : 500;
      res.status(status).json({ success: false, error: error.message, message: 'Failed to retrieve review' });
    }
  },

  /**
   * POST /api/reviews
   * Crea una nueva reseña. Requiere autenticación (authMiddleware agrega req.user).
   * Responde 201 con la reseña creada o 400/500 si hay errores.
   */
  async create(req, res) {
    // Valida los campos del cuerpo antes de procesar
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation error', message: errors.array()[0].msg });
    }

    try {
      // req.user.id es el ID del usuario autenticado, añadido por authMiddleware
      const review = await ReviewService.create(req.user.id, req.body);
      // 201 Created: la reseña fue creada exitosamente
      res.status(201).json({ success: true, data: review, message: 'Review created successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message, message: 'Failed to create review' });
    }
  },

  /**
   * PUT /api/reviews/:id
   * Actualiza una reseña existente. Solo el propietario puede editarla.
   * Responde 200 si fue actualizada, 400 validación, 403 sin permiso, 404 no existe, 500 error.
   */
  async update(req, res) {
    // Valida los campos del cuerpo antes de procesar
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation error', message: errors.array()[0].msg });
    }

    try {
      // Pasa el ID de la reseña, el ID del usuario autenticado y los nuevos datos
      const review = await ReviewService.update(req.params.id, req.user.id, req.body);
      res.status(200).json({ success: true, data: review, message: 'Review updated successfully' });
    } catch (error) {
      // Mapea el error del servicio al código HTTP correspondiente
      const status = error.message === 'Unauthorized' ? 403 : error.message === 'Review not found' ? 404 : 500;
      res.status(status).json({ success: false, error: error.message, message: 'Failed to update review' });
    }
  },

  /**
   * DELETE /api/reviews/:id
   * Elimina una reseña. Solo el propietario puede eliminarla.
   * Responde 200 si fue eliminada, 403 sin permiso, 500 error inesperado.
   */
  async delete(req, res) {
    try {
      // Pasa el ID de la reseña y el ID del usuario para verificar propiedad
      await ReviewService.delete(req.params.id, req.user.id);
      // data: null indica que el recurso ya no existe
      res.status(200).json({ success: true, data: null, message: 'Review deleted successfully' });
    } catch (error) {
      // 403 Forbidden: el usuario no es el dueño de la reseña
      const status = error.message === 'Unauthorized' ? 403 : 500;
      res.status(status).json({ success: false, error: error.message, message: 'Failed to delete review' });
    }
  }
};

export default ReviewController;
