// Tests de integración para el sistema de votos en reseñas (votar, toggle, cambiar voto).
// Ejecutan contra una base de datos real (sin mocks) — requieren DATABASE_URL válida.
import request from 'supertest';
import app from '../../app.js';
import pool from '../config/db.js';

const userA = { username: 'votetestA', email: 'voteA@test.com', password: '123456' };
const userB = { username: 'votetestB', email: 'voteB@test.com', password: '123456' };

const testReview = {
  product_name: 'Arepas de choclo',
  product_price: 8000,
  content: 'Las mejores arepas de choclo del barrio, muy recomendadas',
  is_recommended: true,
  business_name: 'Arepas Doña Rosa',
  business_location_text: 'Carrera 7 con Calle 45, Bogotá'
};

let tokenA;
let tokenB;
let reviewId;

beforeAll(async () => {
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [[userA.email, userB.email]]);

  const resA = await request(app).post('/api/auth/register').send(userA);
  tokenA = resA.body.data.token;

  const resB = await request(app).post('/api/auth/register').send(userB);
  tokenB = resB.body.data.token;

  const resReview = await request(app)
    .post('/api/reviews')
    .set('Authorization', `Bearer ${tokenA}`)
    .send(testReview);
  reviewId = resReview.body.data.id;
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [[userA.email, userB.email]]);
  await pool.end();
});

describe('Votes', () => {
  describe('POST /api/reviews/:id/vote', () => {
    it('should register a positive vote', async () => {
      const res = await request(app)
        .post(`/api/reviews/${reviewId}/vote`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ vote: 1 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vote).toBe(1);
    });

    it('should remove vote if same vote is sent again', async () => {
      const res = await request(app)
        .post(`/api/reviews/${reviewId}/vote`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ vote: 1 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    });

    it('should register a negative vote', async () => {
      const res = await request(app)
        .post(`/api/reviews/${reviewId}/vote`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ vote: -1 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vote).toBe(-1);
    });

    it('should fail if user votes their own review', async () => {
      const res = await request(app)
        .post(`/api/reviews/${reviewId}/vote`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ vote: 1 });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .post(`/api/reviews/${reviewId}/vote`)
        .send({ vote: 1 });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid vote value', async () => {
      const res = await request(app)
        .post(`/api/reviews/${reviewId}/vote`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ vote: 5 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
