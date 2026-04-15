// Tests de integración para los endpoints de autenticación (registro, login, reset de contraseña).
// Ejecutan contra una base de datos real (sin mocks) — requieren DATABASE_URL válida.
import request from 'supertest';
import app from '../../app.js';
import pool from '../config/db.js';

const testUser = {
  username: 'jestuser',
  email: 'jest@test.com',
  password: '123456'
};

beforeAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
  await pool.end();
});

describe('Auth', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('should fail if email already exists', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({ ...testUser, email: 'invalidemail' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with short password', async () => {
      const res = await request(app).post('/api/auth/register').send({ ...testUser, email: 'other@test.com', password: '123' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should fail with wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with non-existing email', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'noexiste@test.com', password: '123456' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
