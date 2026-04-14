// Router de Express para definir rutas modulares
import { Router } from 'express';
// Controlador que maneja el proxy de Google Places
import PlacesController from '../controllers/places.controller.js';

// Crea un router independiente para las rutas de lugares
const router = Router();

// GET /api/places/autocomplete?q=texto&sessiontoken=uuid
// Sugerencias de comercios desde Google Places. Ruta pública.
router.get('/autocomplete', PlacesController.autocomplete);

export default router;
