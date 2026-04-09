// Router de Express para definir rutas modulares
import { Router } from 'express';
// body: valida y sanitiza campos del cuerpo de la solicitud
import { body } from 'express-validator';
// Controlador que maneja la lógica de registro e inicio de sesión
import AuthController from '../controllers/auth.controller.js';

// Crea un router independiente para las rutas de autenticación
const router = Router();

// POST /api/auth/register — Registra un nuevo usuario
// Los middlewares de validación se ejecutan antes del controlador
router.post('/register', [
  body('username').trim().notEmpty().withMessage('Username is required'),          // No puede estar vacío
  body('email').isEmail().withMessage('Valid email is required'),                  // Debe ser un email válido
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters') // Mínimo 6 caracteres
], AuthController.register);

// POST /api/auth/login — Inicia sesión de un usuario existente
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),   // Debe ser un email válido
  body('password').notEmpty().withMessage('Password is required')   // No puede estar vacío
], AuthController.login);

export default router;
