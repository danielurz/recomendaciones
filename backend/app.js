// Carga las variables de entorno desde el archivo .env
import 'dotenv/config';
// Framework principal para crear el servidor HTTP
import express from 'express';
// Middleware para habilitar CORS (permite que el frontend consuma la API)
import cors from 'cors';
// Middleware de seguridad: agrega cabeceras HTTP que protegen contra ataques comunes
import helmet from 'helmet';
// Rutas de autenticación: registro, login, logout
import authRoutes from './src/routes/auth.routes.js';
// Rutas de reseñas: CRUD completo
import reviewRoutes from './src/routes/review.routes.js';
// Rutas de votos: votar una reseña como útil o no útil
import voteRoutes from './src/routes/vote.routes.js';
// Rutas de comentarios: comentar y eliminar comentarios en reseñas
import commentRoutes from './src/routes/comment.routes.js';
// Rutas de búsqueda semántica con IA
import searchRoutes from './src/routes/search.routes.js';
// Rutas del proxy de Google Places (autocompletar comercios)
import placesRoutes from './src/routes/places.routes.js';

// Crea la instancia principal de la aplicación Express
const app = express();

// Aplica cabeceras de seguridad HTTP (protección XSS, clickjacking, etc.)
app.use(helmet());
// Habilita solicitudes desde otros orígenes (necesario para el cliente móvil)
app.use(cors());
// Permite leer el cuerpo de las solicitudes como JSON
app.use(express.json());

// Ruta raíz: sirve como health check para verificar que la API está activa
app.get('/', (req, res) => {
  res.json({ success: true, message: 'API running' });
});

// Monta las rutas de autenticación en /api/auth
app.use('/api/auth', authRoutes);
// Monta las rutas de reseñas en /api/reviews
app.use('/api/reviews', reviewRoutes);
// Monta las rutas de votos anidadas bajo una reseña específica (/api/reviews/:id/vote)
app.use('/api/reviews/:id/vote', voteRoutes);
// Monta las rutas de comentarios anidadas bajo una reseña específica (/api/reviews/:id/comments)
app.use('/api/reviews/:id/comments', commentRoutes);
// Monta las rutas de búsqueda semántica en /api/search
app.use('/api/search', searchRoutes);
// Monta las rutas del proxy de Google Places en /api/places
app.use('/api/places', placesRoutes);

// Exporta la app para que server.js pueda iniciarla
export default app;
