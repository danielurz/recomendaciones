// Librería para hashear y comparar contraseñas de forma segura
import bcrypt from 'bcryptjs';
// Librería para generar y verificar tokens JWT
import jwt from 'jsonwebtoken';
// Modelo de usuario para interactuar con la base de datos
import UserModel from '../models/user.model.js';

// Servicio de autenticación: contiene la lógica de negocio de registro e inicio de sesión
const AuthService = {
  /**
   * Registra un nuevo usuario en el sistema.
   * Verifica que el email no esté ya registrado, hashea la contraseña y genera un JWT.
   * Lanza un error si el email ya existe (el controlador lo convierte en respuesta 400).
   */
  async register({ username, email, password }) {
    // Verifica si ya existe un usuario con ese email para evitar duplicados
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered'); // El controlador captura este error
    }

    // Hashea la contraseña con un salt factor de 10 (balance entre seguridad y velocidad)
    // Nunca se guarda la contraseña en texto plano
    const password_hash = await bcrypt.hash(password, 10);
    // Crea el usuario en la base de datos con el hash de la contraseña
    const user = await UserModel.create({ username, email, password_hash });

    // Genera un token JWT firmado con el ID del usuario como payload
    // El token expira según JWT_EXPIRES_IN (ej. "7d")
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    // Retorna el usuario recién creado y el token para que el cliente inicie sesión directamente
    return { user, token };
  },

  /**
   * Inicia sesión de un usuario existente.
   * Verifica que el email exista y que la contraseña coincida con el hash almacenado.
   * Usa el mismo mensaje de error para email y contraseña incorrectos (no revela cuál falló).
   */
  async login({ email, password }) {
    // Busca el usuario por email; retorna undefined si no existe
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials'); // Mensaje genérico: no revela si el email existe
    }

    // Compara la contraseña ingresada con el hash almacenado en la base de datos
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid credentials'); // Mismo mensaje genérico por seguridad
    }

    // Genera un nuevo token JWT para esta sesión
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    // Desestructura el objeto user para excluir password_hash de la respuesta
    // Nunca se devuelve el hash de la contraseña al cliente
    const { password_hash, ...userData } = user;
    return { user: userData, token };
  }
};

export default AuthService;
