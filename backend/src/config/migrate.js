// Carga variables de entorno antes de importar el pool de base de datos
import 'dotenv/config';
// readFileSync: lee el contenido de un archivo de forma sincrónica
// readdirSync: lista los archivos de un directorio de forma sincrónica
import { readFileSync, readdirSync } from 'fs';
// Convierte la URL del módulo ESM a una ruta de archivo del sistema operativo
import { fileURLToPath } from 'url';
// dirname: obtiene el directorio padre de una ruta
// join: une segmentos de ruta de forma segura
import { dirname, join } from 'path';
// Pool de conexiones a la base de datos
import pool from './db.js';

// En módulos ESM no existe __dirname nativo; se reconstruye a partir de import.meta.url
const __dirname = dirname(fileURLToPath(import.meta.url));
// Ruta absoluta a la carpeta que contiene los archivos SQL de migración
const migrationsDir = join(__dirname, 'migrations');

// Lee todos los archivos .sql de la carpeta migrations y los ordena alfabéticamente
// El orden garantiza que las migraciones se ejecuten en la secuencia correcta (001, 002, etc.)
const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

// Ejecuta cada archivo SQL en orden
for (const file of files) {
  // Lee el contenido del archivo SQL como texto
  const sql = readFileSync(join(migrationsDir, file), 'utf8');
  try {
    // Envía el SQL completo a la base de datos para ejecutarlo
    await pool.query(sql);
    console.log(`✓ ${file}`); // Indica que la migración fue exitosa
  } catch (error) {
    console.error(`✗ ${file}: ${error.message}`); // Muestra el error si la migración falla
    process.exit(1); // Detiene el proceso para evitar migraciones parciales
  }
}

// Cierra todas las conexiones del pool al terminar
await pool.end();
console.log('Migrations completed.');
