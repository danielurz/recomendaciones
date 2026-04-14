// Servicio de Google Places: llama a la API de autocompletar lugares
const PlacesService = {
  /**
   * Busca sugerencias de comercios usando Google Places Autocomplete.
   * Usa session tokens para agrupar llamadas en una sola sesión de billing.
   * @param {string} query - Texto ingresado por el usuario
   * @param {string} [sessiontoken] - Token de sesión para billing agrupado
   * @returns {Array} Lista de sugerencias con place_id y description
   */
  async autocomplete(query, sessiontoken) {
    const params = new URLSearchParams({
      input: query,
      key: process.env.GOOGLE_PLACES_API_KEY,
      language: 'es',
      components: 'country:co',
    });

    if (sessiontoken) {
      params.append('sessiontoken', sessiontoken);
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Google Places API request failed');
    }

    const json = await response.json();

    if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places error: ${json.status}`);
    }

    return (json.predictions || []).map((p) => ({
      place_id: p.place_id,
      description: p.description,
      main_text: p.structured_formatting?.main_text ?? null,
      secondary_text: p.structured_formatting?.secondary_text ?? null,
    }));
  },
};

export default PlacesService;
