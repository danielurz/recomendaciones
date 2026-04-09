// Pool de conexiones a la base de datos
import pool from '../config/db.js';
// Funciones de IA para generar embeddings: una para documentos y otra para consultas
import { generateEmbedding, generateQueryEmbedding } from '../ai/gemini.js';

// Modelo de reseña: contiene todas las operaciones de base de datos relacionadas con la tabla reviews
const ReviewModel = {
  /**
   * Obtiene todas las reseñas con información del autor, conteo de comentarios y votos.
   * Usa JOIN para enriquecer cada reseña con datos del usuario que la creó.
   * COUNT DISTINCT evita duplicados en los conteos cuando hay múltiples JOINs.
   * Ordena por fecha de creación descendente (más recientes primero).
   */
  async findAll() {
    const result = await pool.query(
      `SELECT r.id, r.user_id, r.product_name, r.product_price, r.content, r.is_recommended,
        r.business_name, r.business_location_text, r.google_place_id, r.google_place_name,
        r.latitude, r.longitude, r.place_confirmed, r.score, r.created_at, r.updated_at,
        u.username, u.avatar_url,
        COUNT(DISTINCT c.id)::INT AS comment_count,           -- total de comentarios en la reseña
        COUNT(DISTINCT CASE WHEN rv.vote = 1 THEN rv.id END)::INT AS upvotes,   -- votos positivos
        COUNT(DISTINCT CASE WHEN rv.vote = -1 THEN rv.id END)::INT AS downvotes -- votos negativos
       FROM reviews r
       JOIN users u ON r.user_id = u.id                      -- obtiene username y avatar del autor
       LEFT JOIN comments c ON c.review_id = r.id            -- LEFT JOIN: incluye reseñas sin comentarios
       LEFT JOIN review_votes rv ON rv.review_id = r.id      -- LEFT JOIN: incluye reseñas sin votos
       GROUP BY r.id, u.username, u.avatar_url               -- agrupa para que los COUNT funcionen correctamente
       ORDER BY r.created_at DESC`                           -- más recientes primero
    );
    return result.rows; // Retorna array de reseñas
  },

  /**
   * Obtiene una reseña específica por ID con el mismo nivel de detalle que findAll.
   * Retorna undefined si no existe ninguna reseña con ese ID.
   */
  async findById(id) {
    const result = await pool.query(
      `SELECT r.id, r.user_id, r.product_name, r.product_price, r.content, r.is_recommended,
        r.business_name, r.business_location_text, r.google_place_id, r.google_place_name,
        r.latitude, r.longitude, r.place_confirmed, r.score, r.created_at, r.updated_at,
        u.username, u.avatar_url,
        COUNT(DISTINCT c.id)::INT AS comment_count,
        COUNT(DISTINCT CASE WHEN rv.vote = 1 THEN rv.id END)::INT AS upvotes,
        COUNT(DISTINCT CASE WHEN rv.vote = -1 THEN rv.id END)::INT AS downvotes
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN comments c ON c.review_id = r.id
       LEFT JOIN review_votes rv ON rv.review_id = r.id
       WHERE r.id = $1                                        -- filtra por el ID específico
       GROUP BY r.id, u.username, u.avatar_url`,
      [id]
    );
    return result.rows[0]; // Retorna la reseña o undefined si no existe
  },

  /**
   * Crea una nueva reseña en la base de datos.
   * Antes de insertar, genera el embedding del texto de la reseña para habilitar búsqueda semántica.
   * El embedding se guarda como JSON string; pgvector lo convierte al tipo vector internamente.
   */
  async create({ user_id, product_name, product_price, content, is_recommended, business_name, business_location_text, google_place_id, google_place_name, latitude, longitude, place_confirmed }) {
    // Combina los campos más descriptivos para crear un texto rico para el embedding
    const embeddingText = `${business_name} ${product_name} ${content}`;
    // Llama a la API de Gemini para obtener el vector que representa esta reseña
    const embedding = await generateEmbedding(embeddingText);

    const result = await pool.query(
      `INSERT INTO reviews
        (user_id, product_name, product_price, content, is_recommended, business_name, business_location_text, google_place_id, google_place_name, latitude, longitude, place_confirmed, embedding)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, user_id, product_name, product_price, content, is_recommended,
        business_name, business_location_text, google_place_id, google_place_name,
        latitude, longitude, place_confirmed, score, created_at, updated_at`,
      // El embedding se serializa como JSON para pasarlo al driver de PostgreSQL
      [user_id, product_name, product_price, content, is_recommended, business_name, business_location_text, google_place_id, google_place_name, latitude, longitude, place_confirmed, JSON.stringify(embedding)]
    );
    return result.rows[0]; // Retorna la reseña recién creada con su ID
  },

  /**
   * Busca reseñas semánticamente similares a una consulta de texto.
   * Usa el operador <=> de pgvector para calcular la distancia coseno entre vectores.
   * Solo retorna resultados con distancia menor a 0.65 (umbral de relevancia).
   * @param {string} query - Texto de búsqueda del usuario
   * @param {number} limit - Número máximo de resultados (por defecto 10)
   */
  async findSimilar(query, limit = 10) {
    // Convierte la consulta del usuario en un vector para compararlo con los de las reseñas
    const embedding = await generateQueryEmbedding(query);
    const result = await pool.query(
      `SELECT r.id, r.user_id, r.product_name, r.product_price, r.content, r.is_recommended,
        r.business_name, r.business_location_text, r.google_place_id, r.google_place_name,
        r.latitude, r.longitude, r.place_confirmed, r.score, r.created_at, r.updated_at,
        u.username, u.avatar_url,
        COUNT(DISTINCT c.id)::INT AS comment_count,
        COUNT(DISTINCT CASE WHEN rv.vote = 1 THEN rv.id END)::INT AS upvotes,
        COUNT(DISTINCT CASE WHEN rv.vote = -1 THEN rv.id END)::INT AS downvotes
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN comments c ON c.review_id = r.id
       LEFT JOIN review_votes rv ON rv.review_id = r.id
       WHERE r.embedding IS NOT NULL                          -- solo reseñas con embedding calculado
        AND r.embedding <=> $1::vector(3072) < 0.65          -- distancia coseno menor a 0.65 (más cercano = más similar)
       GROUP BY r.id, u.username, u.avatar_url
       ORDER BY r.embedding <=> $1::vector(3072)             -- ordena de más similar a menos similar
       LIMIT $2`,                                            -- limita el número de resultados
      [JSON.stringify(embedding), limit]
    );
    return result.rows; // Retorna las reseñas más relevantes para la búsqueda
  },

  /**
   * Actualiza los campos editables de una reseña (producto, precio, contenido, recomendación).
   * No permite cambiar el comercio ni la ubicación después de creada.
   * Actualiza updated_at con la fecha y hora actuales.
   */
  async update(id, { product_name, product_price, content, is_recommended }) {
    const result = await pool.query(
      `UPDATE reviews
       SET product_name = $1, product_price = $2, content = $3, is_recommended = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, user_id, product_name, product_price, content, is_recommended,
        business_name, business_location_text, google_place_id, google_place_name,
        latitude, longitude, place_confirmed, score, created_at, updated_at`,
      [product_name, product_price, content, is_recommended, id]
    );
    return result.rows[0]; // Retorna la reseña actualizada o undefined si no existe
  },

  /**
   * Elimina permanentemente una reseña por su ID.
   * No retorna nada; el servicio llama a isOwner antes de eliminar.
   */
  async delete(id) {
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
  },

  /**
   * Verifica si un usuario es el propietario de una reseña.
   * Retorna true si existe una reseña con ese ID y ese user_id, false si no.
   * Se usa para autorizar ediciones y eliminaciones.
   */
  async isOwner(id, user_id) {
    const result = await pool.query(
      'SELECT id FROM reviews WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );
    return result.rows.length > 0; // true = es dueño, false = no lo es
  }
};

export default ReviewModel;
