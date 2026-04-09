// Router de Express para definir rutas modulares
import { Router } from 'express';
// body: valida y sanitiza campos del cuerpo de la solicitud
import { body } from 'express-validator';
// Controlador que maneja la lógica de votación
import VoteController from '../controllers/vote.controller.js';
// Middleware que verifica el token JWT y agrega req.user
import authMiddleware from '../middlewares/auth.middleware.js';

// mergeParams: true permite acceder al :id de la ruta padre (/api/reviews/:id/vote)
const router = Router({ mergeParams: true });

// POST /api/reviews/:id/vote — Registra, actualiza o elimina el voto (requiere autenticación)
// Solo se puede votar +1 (útil) o -1 (no útil); cualquier otro valor es rechazado
router.post('/', authMiddleware, [
  body('vote').isIn([1, -1]).withMessage('Vote must be 1 or -1') // Valores permitidos: 1 o -1
], VoteController.vote);

export default router;
