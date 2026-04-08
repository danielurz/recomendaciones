import request from 'supertest';
import app from '../../app.js';
import pool from '../config/db.js';

const testUser = {
  username: 'reviewtestuser',
  email: 'reviewtest@test.com',
  password: '123456'
};

const testReview = {
  product_name: 'Bandeja paisa',
  product_price: 25000,
  content: 'Excelente bandeja paisa, muy bien servida y a buen precio',
  is_recommended: true,
  business_name: 'Restaurante El Rancho',
  business_location_text: 'Calle 80 con Carrera 15, Bogotá'
};

let token;
let reviewId;

beforeAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
  const res = await request(app).post('/api/auth/register').send(testUser);
  token = res.body.data.token;
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
  await pool.end();
});

describe('Reviews', () => {
  describe('POST /api/reviews', () => {
    it('should create a review', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send(testReview);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product_name).toBe(testReview.product_name);
      reviewId = res.body.data.id;
    });

    it('should fail without token', async () => {
      const res = await request(app).post('/api/reviews').send(testReview);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with missing fields', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ product_name: 'Solo nombre' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/reviews', () => {
    it('should return all reviews', async () => {
      const res = await request(app).get('/api/reviews');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/reviews/:id', () => {
    it('should return a review by id', async () => {
      const res = await request(app).get(`/api/reviews/${reviewId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(reviewId);
    });

    it('should fail with non-existing id', async () => {
      const res = await request(app).get('/api/reviews/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/reviews/:id', () => {
    it('should update a review', async () => {
      const res = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ ...testReview, product_name: 'Bandeja paisa especial', product_price: 28000 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product_name).toBe('Bandeja paisa especial');
    });

    it('should fail without token', async () => {
      const res = await request(app).put(`/api/reviews/${reviewId}`).send(testReview);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    it('should delete a review', async () => {
      const res = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should fail with non-existing id', async () => {
      const res = await request(app)
        .delete('/api/reviews/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
