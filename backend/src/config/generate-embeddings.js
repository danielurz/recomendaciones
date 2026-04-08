import 'dotenv/config';
import pool from './db.js';
import { generateEmbedding } from '../ai/gemini.js';

const reviews = await pool.query('SELECT id, business_name, product_name, content FROM reviews WHERE embedding IS NULL');

console.log(`Generating embeddings for ${reviews.rows.length} reviews...`);

for (const review of reviews.rows) {
  const text = `${review.business_name} ${review.product_name} ${review.content}`;
  try {
    const embedding = await generateEmbedding(text);
    await pool.query('UPDATE reviews SET embedding = $1 WHERE id = $2', [JSON.stringify(embedding), review.id]);
    console.log(`  ✓ ${review.business_name} - ${review.product_name}`);
  } catch (error) {
    console.error(`  ✗ ${review.business_name}: ${error.message}`);
  }
}

console.log('Done.');
await pool.end();
