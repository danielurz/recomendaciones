// Router de Express para definir rutas modulares
import { Router } from 'express';
// Controlador que maneja la búsqueda semántica con IA
import SearchController from '../controllers/search.controller.js';

// Crea un router independiente para las rutas de búsqueda
const router = Router();

// GET /api/search?q=texto — Búsqueda semántica pública (no requiere autenticación)
// El parámetro de búsqueda se recibe como query string: ?q=pizza bogota
// La respuesta usa Server-Sent Events (SSE) en lugar de JSON estándar
router.get('/', SearchController.search);

export default router;
