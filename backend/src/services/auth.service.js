// Librería para hashear y comparar contraseñas de forma segura
import bcrypt from 'bcryptjs';
// Librería para generar y verificar tokens JWT
import jwt from 'jsonwebtoken';
// Módulo nativo para generar tokens aleatorios seguros
import crypto from 'crypto';
// Modelo de usuario para interactuar con la base de datos
import UserModel from '../models/user.model.js';
// Utilidades para envío de emails
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/mailer.js';

// Servicio de autenticación: contiene la lógica de negocio de registro e inicio de sesión
const AuthService = {
  /**
   * Registra un nuevo usuario en el sistema.
   * Verifica que el email no esté ya registrado, hashea la contraseña y genera un JWT.
   * Lanza un error si el email ya existe (el controlador lo convierte en respuesta 400).
   */
  async register({ username, email, password }) {
    // Verifica duplicados de email y username en paralelo
    const [existingEmail, existingUsername] = await Promise.all([
      UserModel.findByEmail(email),
      UserModel.findByUsername(username),
    ]);
    if (existingEmail) throw new Error('Email already registered');
    if (existingUsername) throw new Error('Username already taken');

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

    // Envía email de bienvenida en segundo plano (no bloquea la respuesta si falla)
    sendWelcomeEmail(user.email, user.username).catch(() => {});

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
      throw new Error('Email not found');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Wrong password');
    }

    // Genera un nuevo token JWT para esta sesión
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    // Desestructura el objeto user para excluir password_hash de la respuesta
    // Nunca se devuelve el hash de la contraseña al cliente
    const { password_hash, ...userData } = user;
    return { user: userData, token };
  },

  /**
   * Genera un token de reset y envía el email al usuario.
   * No revela si el email existe o no (seguridad contra enumeración).
   */
  async forgotPassword(email) {
    const user = await UserModel.findByEmail(email);
    // Si el usuario no existe, no hacemos nada pero tampoco revelamos que no existe
    if (!user) return;

    // Token aleatorio de 32 bytes en hex (64 caracteres)
    const token = crypto.randomBytes(32).toString('hex');
    // Expira en 1 hora
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await UserModel.saveResetToken(email, token, expiresAt);
    await sendPasswordResetEmail(email, token);
  },

  /**
   * Valida el token y actualiza la contraseña del usuario.
   * Lanza error si el token es inválido o ha expirado.
   */
  async resetPassword(token, newPassword) {
    const user = await UserModel.findByResetToken(token);
    if (!user) {
      throw new Error('Invalid or expired token');
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await UserModel.updatePassword(user.id, password_hash);
  }
};

export default AuthService;
