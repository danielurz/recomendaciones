// Modelo de reseña para acceder a la base de datos
import ReviewModel from '../models/review.model.js';

// Servicio de reseñas: contiene la lógica de negocio para el CRUD de reseñas
const ReviewService = {
  /**
   * Obtiene todas las reseñas disponibles.
   * No aplica filtros; retorna el listado completo ordenado por fecha.
   */
  async getAll() {
    return await ReviewModel.findAll();
  },

  /**
   * Obtiene una reseña específica por ID.
   * Lanza un error si no existe para que el controlador devuelva un 404.
   */
  async getById(id) {
    const review = await ReviewModel.findById(id);
    if (!review) {
      throw new Error('Review not found'); // El controlador captura este error y responde 404
    }
    return review;
  },

  /**
   * Crea una nueva reseña asociada al usuario autenticado.
   * Combina el user_id del token JWT con los datos del cuerpo de la solicitud.
   */
  async create(user_id, data) {
    return await ReviewModel.create({ user_id, ...data }); // Spread para pasar todos los campos
  },

  /**
   * Actualiza una reseña, pero solo si el usuario autenticado es el propietario.
   * Verifica la propiedad antes de modificar para aplicar control de acceso.
   * Lanza 'Unauthorized' si no es el dueño o 'Review not found' si no existe.
   */
  async update(id, user_id, data) {
    // Primero verifica que el usuario sea el dueño de la reseña
    const isOwner = await ReviewModel.isOwner(id, user_id);
    if (!isOwner) {
      throw new Error('Unauthorized'); // El controlador convierte esto en respuesta 403
    }
    const review = await ReviewModel.update(id, data);
    if (!review) {
      throw new Error('Review not found'); // El controlador convierte esto en respuesta 404
    }
    return review;
  },

  /**
   * Elimina una reseña, pero solo si el usuario autenticado es el propietario.
   * Verifica la propiedad antes de eliminar para aplicar control de acceso.
   * Lanza 'Unauthorized' si no es el dueño (incluye el caso de que la reseña no exista).
   */
  async delete(id, user_id) {
    // Verifica que el usuario sea el dueño antes de eliminar
    const isOwner = await ReviewModel.isOwner(id, user_id);
    if (!isOwner) {
      throw new Error('Unauthorized'); // No revela si la reseña existe o no
    }
    await ReviewModel.delete(id);
  }
};

export default ReviewService;
