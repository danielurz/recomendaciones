// Tests de integración para el CRUD de comentarios (crear, listar, eliminar).
// Ejecutan contra una base de datos real (sin mocks) — requieren DATABASE_URL válida.
import request from 'supertest';
import app from '../../app.js';
import pool from '../config/db.js';

const userA = { username: 'commenttestA', email: 'commentA@test.com', password: '123456' };
const userB = { username: 'commenttestB', email: 'commentB@test.com', password: '123456' };

const testReview = {
  product_name: 'Empanadas de pipián',
  product_price: 3000,
  content: 'Las mejores empanadas de pipián que he probado en Bogotá',
  is_recommended: true,
  business_name: 'Empanadas La Abuela',
  business_location_text: 'Calle 13 con Carrera 10, Bogotá'
};

let tokenA;
let tokenB;
let reviewId;
let commentId;

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

describe('Comments', () => {
  describe('POST /api/reviews/:id/comments', () => {
    it('should create a comment', async () => {
      const res = await request(app)
        .post(`/api/reviews/${reviewId}/comments`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ content: 'Totalmente de acuerdo, son deliciosas' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Totalmente de acuerdo, son deliciosas');
      commentId = res.body.data.id;
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .post(`/api/reviews/${reviewId}/comments`)
        .send({ content: 'Comentario sin auth' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with empty content', async () => {
      const res = await request(app)
        .post(`/api/reviews/${reviewId}/comments`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ content: '' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/reviews/:id/comments', () => {
    it('should return all comments of a review', async () => {
      const res = await request(app).get(`/api/reviews/${reviewId}/comments`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should fail with non-existing review', async () => {
      const res = await request(app).get('/api/reviews/00000000-0000-0000-0000-000000000000/comments');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/reviews/:id/comments/:commentId', () => {
    it('should fail if user is not the owner', async () => {
      const res = await request(app)
        .delete(`/api/reviews/${reviewId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should delete a comment', async () => {
      const res = await request(app)
        .delete(`/api/reviews/${reviewId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
