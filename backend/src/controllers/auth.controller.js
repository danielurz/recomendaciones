// validationResult: lee los errores que dejaron los validadores de express-validator en la ruta
import { validationResult } from 'express-validator';
// Servicio que contiene la lógica de negocio de autenticación
import AuthService from '../services/auth.service.js';

// Controlador de autenticación: maneja las solicitudes HTTP de registro e inicio de sesión
const AuthController = {
  /**
   * POST /api/auth/register
   * Registra un nuevo usuario. Valida los campos del cuerpo antes de llamar al servicio.
   * Responde 201 con usuario y token si es exitoso, o 400 si hay errores.
   */
  async register(req, res) {
    // Recoge los errores de validación generados por los middlewares de la ruta
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Retorna solo el primer error para no exponer demasiada información
      return res.status(400).json({ success: false, error: 'Validation error', message: errors.array()[0].msg });
    }

    try {
      // Delega la lógica al servicio y desestructura el resultado
      const { user, token } = await AuthService.register(req.body);
      // 201 Created: el recurso fue creado exitosamente
      res.status(201).json({ success: true, data: { user, token }, message: 'User registered successfully' });
    } catch (error) {
      // 400 Bad Request: el email ya está registrado u otro error de negocio
      res.status(400).json({ success: false, error: error.message, message: 'Registration failed' });
    }
  },

  /**
   * POST /api/auth/login
   * Inicia sesión de un usuario existente. Valida los campos antes de llamar al servicio.
   * Responde 200 con usuario y token si es exitoso, o 401 si las credenciales son inválidas.
   */
  async login(req, res) {
    // Recoge los errores de validación generados por los middlewares de la ruta
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation error', message: errors.array()[0].msg });
    }

    try {
      // Delega la lógica al servicio y desestructura el resultado
      const { user, token } = await AuthService.login(req.body);
      // 200 OK: login exitoso
      res.status(200).json({ success: true, data: { user, token }, message: 'Login successful' });
    } catch (error) {
      // 401 Unauthorized: credenciales inválidas (email no existe o contraseña incorrecta)
      res.status(401).json({ success: false, error: error.message, message: 'Login failed' });
    }
  }
};

export default AuthController;
