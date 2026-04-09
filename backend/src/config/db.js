// Cliente oficial de PostgreSQL para Node.js
import pg from 'pg';

// Extrae la clase Pool del módulo pg (maneja múltiples conexiones simultáneas)
const { Pool } = pg;

// Crea el pool de conexiones a la base de datos PostgreSQL en Supabase
// rejectUnauthorized: false permite la conexión SSL sin validar el certificado (necesario en Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // URL completa de conexión desde .env
  ssl: { rejectUnauthorized: false }
});

// Exporta el pool para ser usado en los modelos
export default pool;
