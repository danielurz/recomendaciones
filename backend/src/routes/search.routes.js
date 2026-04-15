// Router de Express para las rutas de búsqueda semántica con IA
import { Router } from 'express';
// Controlador que maneja la búsqueda vectorial y la generación de resúmenes con Gemini
import SearchController from '../controllers/search.controller.js';

// Crea un router independiente para las rutas de búsqueda
const router = Router();

// GET /api/search/results?q=texto — Busca reseñas por similitud semántica (ruta pública)
// Genera el embedding de la consulta y la compara con los embeddings almacenados en pgvector
router.get('/results', SearchController.results);

// POST /api/search/summary — Genera un resumen en lenguaje natural de los resultados
// Body: { results: [...] } — recibe los resultados ya obtenidos para no repetir la búsqueda
router.post('/summary', SearchController.summary);

export default router;
