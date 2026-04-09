// validationResult: lee los errores que dejaron los validadores de express-validator en la ruta
import { validationResult } from 'express-validator';
// Servicio que contiene la lógica de negocio del sistema de votación
import VoteService from '../services/vote.service.js';

// Controlador de votos: maneja las solicitudes HTTP de votación en reseñas
const VoteController = {
  /**
   * POST /api/reviews/:id/vote
   * Registra, actualiza o elimina el voto de un usuario sobre una reseña.
   * El comportamiento es toggle: votar igual elimina el voto, votar diferente lo cambia.
   * Requiere autenticación. Responde con el voto resultante o null si fue eliminado.
   */
  async vote(req, res) {
    // Valida que el campo vote sea 1 o -1
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation error', message: errors.array()[0].msg });
    }

    try {
      // req.params.id = ID de la reseña, req.user.id = usuario autenticado, req.body.vote = 1 o -1
      const result = await VoteService.vote(req.params.id, req.user.id, req.body.vote);
      // El mensaje varía según si se registró un voto nuevo o se eliminó (toggle off)
      const message = result ? 'Vote registered successfully' : 'Vote removed successfully';
      // result es el objeto voto si fue creado/actualizado, o null si fue eliminado
      res.status(200).json({ success: true, data: result, message });
    } catch (error) {
      // Mapea los errores del servicio a sus códigos HTTP correspondientes
      // 404: la reseña no existe | 403: intento de votar la propia reseña | 500: error inesperado
      const status = error.message === 'Review not found' ? 404 : error.message === 'You cannot vote your own review' ? 403 : 500;
      res.status(status).json({ success: false, error: error.message, message: 'Failed to register vote' });
    }
  }
};

export default VoteController;
