// Router de Express para definir rutas modulares
import { Router } from 'express';
// body: valida y sanitiza campos del cuerpo de la solicitud
import { body } from 'express-validator';
// Controlador que maneja el CRUD de reseñas
import ReviewController from '../controllers/review.controller.js';
// Middleware que verifica el token JWT y agrega req.user
import authMiddleware from '../middlewares/auth.middleware.js';

// Crea un router independiente para las rutas de reseñas
const router = Router();

// GET /api/reviews — Lista todas las reseñas (ruta pública, sin autenticación)
router.get('/', ReviewController.getAll);
// GET /api/reviews/:id — Detalle de una reseña específica (ruta pública)
router.get('/:id', ReviewController.getById);

// POST /api/reviews — Crea una nueva reseña (requiere autenticación)
// authMiddleware va primero para verificar el token antes de validar el cuerpo
router.post('/', authMiddleware, [
  body('product_name').trim().notEmpty().withMessage('Product name is required'),                      // Nombre del producto obligatorio
  body('product_price').isNumeric().withMessage('Product price must be a number'),                    // Precio debe ser numérico
  body('content').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'), // Contenido mínimo de 10 caracteres
  body('is_recommended').isBoolean().withMessage('is_recommended must be a boolean'),                 // Debe ser true o false
  body('business_name').trim().notEmpty().withMessage('Business name is required'),                   // Nombre del comercio obligatorio
  body('business_location_text').trim().notEmpty().withMessage('Business location is required')       // Ubicación del comercio obligatoria
], ReviewController.create);

// PUT /api/reviews/:id — Actualiza una reseña existente (requiere autenticación)
// No valida business_name ni business_location_text: no se pueden cambiar después de crear
router.put('/:id', authMiddleware, [
  body('product_name').trim().notEmpty().withMessage('Product name is required'),
  body('product_price').isNumeric().withMessage('Product price must be a number'),
  body('content').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  body('is_recommended').isBoolean().withMessage('is_recommended must be a boolean')
], ReviewController.update);

// DELETE /api/reviews/:id — Elimina una reseña (requiere autenticación)
// Sin validaciones de cuerpo: solo necesita el ID en la URL y el token
router.delete('/:id', authMiddleware, ReviewController.delete);

export default router;
