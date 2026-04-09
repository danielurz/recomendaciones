// Librería para verificar y decodificar tokens JWT
import jwt from 'jsonwebtoken';

/**
 * Middleware de autenticación JWT.
 * Protege las rutas que requieren usuario autenticado.
 * Lee el token del header Authorization, lo verifica y agrega el usuario decodificado a req.user.
 * Si el token no existe o es inválido, responde 401 y corta la cadena de middlewares.
 */
const authMiddleware = (req, res, next) => {
  // Lee el header Authorization enviado por el cliente (formato: "Bearer <token>")
  const authHeader = req.headers.authorization;

  // Verifica que el header exista y tenga el formato correcto "Bearer ..."
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // 401 Unauthorized: no se proporcionó token o tiene formato incorrecto
    return res.status(401).json({ success: false, error: 'No token provided', message: 'Authentication required' });
  }

  // Extrae solo el token JWT (la segunda parte después de "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // Verifica la firma del token con la clave secreta y decodifica el payload
    // Lanza un error si el token está expirado, tiene firma inválida o fue manipulado
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Adjunta el payload decodificado (contiene { id: user.id }) a la solicitud
    // Los controladores pueden acceder al ID del usuario autenticado mediante req.user.id
    req.user = decoded;
    // Llama al siguiente middleware o controlador en la cadena
    next();
  } catch (error) {
    // 401 Unauthorized: token inválido, expirado o con firma incorrecta
    return res.status(401).json({ success: false, error: 'Invalid token', message: 'Authentication failed' });
  }
};

export default authMiddleware;
