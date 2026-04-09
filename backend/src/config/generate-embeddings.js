// Carga variables de entorno (DATABASE_URL, GEMINI_API_KEY, etc.)
import 'dotenv/config';
// Pool de conexiones a PostgreSQL
import pool from './db.js';
// Función que genera el vector de embedding usando la API de Gemini
import { generateEmbedding } from '../ai/gemini.js';

// Obtiene todas las reseñas que aún no tienen embedding calculado
// Se usa WHERE embedding IS NULL para no recalcular las que ya fueron procesadas
const reviews = await pool.query('SELECT id, business_name, product_name, content FROM reviews WHERE embedding IS NULL');

console.log(`Generating embeddings for ${reviews.rows.length} reviews...`);

// Procesa cada reseña sin embedding una por una
for (const review of reviews.rows) {
  // Concatena los campos más relevantes en un solo texto para representar la reseña
  // El embedding de este texto permite comparar reseñas por similitud semántica
  const text = `${review.business_name} ${review.product_name} ${review.content}`;
  try {
    // Llama a la API de Gemini para obtener el vector numérico que representa el texto
    const embedding = await generateEmbedding(text);
    // Guarda el embedding en la base de datos como JSON (pgvector lo convierte internamente)
    await pool.query('UPDATE reviews SET embedding = $1 WHERE id = $2', [JSON.stringify(embedding), review.id]);
    console.log(`  ✓ ${review.business_name} - ${review.product_name}`);
  } catch (error) {
    // Si falla el embedding de una reseña, se registra el error y se continúa con las demás
    console.error(`  ✗ ${review.business_name}: ${error.message}`);
  }
}

console.log('Done.');
// Cierra el pool de conexiones al finalizar el script
await pool.end();
