// Modelo de reseña para ejecutar la búsqueda semántica con pgvector
import ReviewModel from '../models/review.model.js';
// Función de IA que genera el resumen en lenguaje natural de los resultados
import { generateSummary } from '../ai/gemini.js';

// Controlador de búsqueda: maneja la búsqueda semántica con IA usando Server-Sent Events (SSE)
const SearchController = {
  /**
   * GET /api/search?q=texto
   * Busca reseñas semánticamente similares al texto de búsqueda.
   * Usa Server-Sent Events (SSE) para enviar los resultados en dos fases:
   *   1. Primero envía los resultados de pgvector (rápido)
   *   2. Luego envía el resumen generado por la IA (más lento)
   * Esto permite al cliente mostrar los resultados inmediatamente mientras espera el resumen.
   */
  async search(req, res) {
    // Extrae el parámetro de búsqueda de la query string (?q=...)
    const { q } = req.query;

    // Valida que se haya proporcionado una consulta no vacía
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Query is required', message: 'Please provide a search query' });
    }

    // Configura las cabeceras para Server-Sent Events (SSE)
    // text/event-stream: formato estándar para SSE, permite enviar múltiples mensajes en la misma conexión
    res.setHeader('Content-Type', 'text/event-stream');
    // no-cache: evita que intermediarios (proxies, CDN) almacenen el stream
    res.setHeader('Cache-Control', 'no-cache');
    // keep-alive: mantiene la conexión TCP abierta para seguir enviando eventos
    res.setHeader('Connection', 'keep-alive');

    try {
      // Fase 1: búsqueda semántica con pgvector
      const t0 = Date.now(); // Marca de tiempo inicial para medir performance
      const results = await ReviewModel.findSimilar(q); // Busca reseñas similares usando embeddings
      const t1 = Date.now();
      console.log(`[search] embedding+pgvector: ${t1 - t0}ms`); // Log de tiempo de búsqueda vectorial

      // Envía el primer evento SSE con los resultados de búsqueda
      // Formato SSE: "event: nombre\ndata: JSON\n\n" (doble salto de línea termina el mensaje)
      res.write(`event: results\ndata: ${JSON.stringify({ success: true, data: { results }, message: `${results.length} results found` })}\n\n`);

      // Fase 2: generación del resumen con IA (operación más lenta)
      const summary = await generateSummary(q, results); // Llama a Gemini para generar el resumen
      const t2 = Date.now();
      console.log(`[search] summary: ${t2 - t1}ms | total: ${t2 - t0}ms`); // Log de tiempos parcial y total

      // Envía el segundo evento SSE con el resumen generado por la IA
      res.write(`event: summary\ndata: ${JSON.stringify({ success: true, data: { summary } })}\n\n`);
    } catch (error) {
      // Si ocurre un error en cualquier fase, envía un evento de error por el stream
      res.write(`event: error\ndata: ${JSON.stringify({ success: false, error: error.message, message: 'Search failed' })}\n\n`);
    } finally {
      // Siempre cierra la conexión SSE al terminar, sin importar si hubo error o no
      res.end();
    }
  }
};

export default SearchController;
