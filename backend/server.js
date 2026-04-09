// Importa la aplicación Express ya configurada con rutas y middlewares
import app from './app.js';

// Lee el puerto desde las variables de entorno; usa 3000 como valor por defecto
const PORT = process.env.PORT || 3000;

// Inicia el servidor HTTP y empieza a escuchar solicitudes entrantes en el puerto indicado
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
