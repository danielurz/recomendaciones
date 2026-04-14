// Servicio que llama a la Google Places API
import PlacesService from '../services/places.service.js';

// Controlador de Places: maneja el proxy de autocompletar comercios
const PlacesController = {
  /**
   * GET /api/places/autocomplete?q=...&sessiontoken=...
   * Retorna sugerencias de comercios desde Google Places. Ruta pública.
   * Responde 400 si falta el parámetro q, 500 si falla la llamada externa.
   */
  async autocomplete(req, res) {
    const { q, sessiontoken } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Missing query', message: 'El parámetro q es requerido' });
    }

    try {
      const suggestions = await PlacesService.autocomplete(q.trim(), sessiontoken);
      res.status(200).json({ success: true, data: suggestions, message: 'Suggestions retrieved successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message, message: 'Failed to fetch suggestions' });
    }
  },
};

export default PlacesController;
