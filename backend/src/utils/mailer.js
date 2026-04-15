// Librería para enviar emails mediante SMTP
import nodemailer from 'nodemailer';

// Crea el transporter de email usando las credenciales de Mailtrap (sandbox de emails para desarrollo)
// En producción se reemplaza Mailtrap por un proveedor real (SendGrid, Resend, etc.)
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT),
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

/**
 * Envía un email de bienvenida al usuario recién registrado.
 * @param {string} to - Email del destinatario
 * @param {string} username - Nombre del usuario
 */
export async function sendWelcomeEmail(to, username) {
  await transporter.sendMail({
    from: `"Recomendaciones App" <${process.env.MAILTRAP_FROM}>`,
    to,
    subject: '¡Bienvenido a Recomendaciones!',
    html: `
      <h2>¡Hola, ${username}!</h2>
      <p>Tu cuenta ha sido creada exitosamente. Ya puedes empezar a compartir tus reseñas.</p>
      <p>Gracias por unirte a la comunidad.</p>
    `,
  });
}

/**
 * Envía un email con el link para restablecer la contraseña.
 * El link usa el deep link de la app con el token como query param.
 * @param {string} to - Email del destinatario
 * @param {string} token - Token de reset generado
 */
export async function sendPasswordResetEmail(to, token) {
  const resetLink = `saasrecomendaciones:///reset-password?token=${token}`;
  await transporter.sendMail({
    from: `"Recomendaciones App" <${process.env.MAILTRAP_FROM}>`,
    to,
    subject: 'Restablecer contraseña',
    html: `
      <h2>Restablecer contraseña</h2>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
      <p>
        <a href="${resetLink}" style="background:#0a7ea4;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
          Restablecer contraseña
        </a>
      </p>
      <p>Este enlace expira en <strong>1 hora</strong>. Si no solicitaste esto, ignora este email.</p>
    `,
  });
}
