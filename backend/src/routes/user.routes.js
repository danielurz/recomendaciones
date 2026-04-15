// Router de Express para las rutas de perfil de usuario
import { Router } from 'express';
// Controlador que devuelve el perfil público y las reseñas de un usuario
import UserController from '../controllers/user.controller.js';

// Crea un router independiente para las rutas de usuario
const router = Router();

// GET /api/users/:id — Devuelve el perfil público del usuario y todas sus reseñas (ruta pública)
router.get('/:id', UserController.getProfile);

export default router;
