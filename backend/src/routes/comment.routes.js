// Router de Express para definir rutas modulares
import { Router } from 'express';
// body: valida y sanitiza campos del cuerpo de la solicitud
import { body } from 'express-validator';
// Controlador que maneja los comentarios en reseñas
import CommentController from '../controllers/comment.controller.js';
// Middleware que verifica el token JWT y agrega req.user
import authMiddleware from '../middlewares/auth.middleware.js';

// mergeParams: true es obligatorio para que este router acceda al :id de la ruta padre
// Sin esto, req.params.id (el ID de la reseña) no estaría disponible en el controlador
const router = Router({ mergeParams: true });

// GET /api/reviews/:id/comments — Lista todos los comentarios de una reseña (ruta pública)
router.get('/', CommentController.getByReview);

// POST /api/reviews/:id/comments — Crea un comentario en una reseña (requiere autenticación)
router.post('/', authMiddleware, [
  body('content').trim().notEmpty().withMessage('Content is required') // El comentario no puede estar vacío
], CommentController.create);

// DELETE /api/reviews/:id/comments/:commentId — Elimina un comentario específico (requiere autenticación)
// :commentId distingue el comentario de :id (la reseña padre)
router.delete('/:commentId', authMiddleware, CommentController.delete);

export default router;
