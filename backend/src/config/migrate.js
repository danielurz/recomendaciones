import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const sql = readFileSync(join(__dirname, 'migrations/001_create_tables.sql'), 'utf8');

try {
  await pool.query(sql);
  console.log('Migration completed successfully');
} catch (error) {
  console.error('Migration failed:', error.message);
} finally {
  await pool.end();
}
