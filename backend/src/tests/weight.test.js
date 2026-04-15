// Tests de integración para el sistema de peso (weight) de las reseñas.
// Verifican que el weight se recalcule correctamente tras votos nuevos, toggle y cambios.
// Ejecutan contra una base de datos real (sin mocks) — requieren DATABASE_URL válida.
import request from 'supertest';
import app from '../../app.js';
import pool from '../config/db.js';

const userA = { username: 'weightA', email: 'weightA@test.com', password: '123456' };
const userB = { username: 'weightB', email: 'weightB@test.com', password: '123456' };

const testReview = {
  product_name: 'Tamal tolimense',
  product_price: 12000,
  content: 'Excelente tamal, bien envuelto y con buena sazón',
  is_recommended: true,
  business_name: 'Tamales Don Jorge',
  business_location_text: 'Calle 13 con Carrera 10, Bogotá'
};

let tokenA, tokenB, reviewId;

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

async function getWeight() {
  const res = await pool.query('SELECT weight FROM reviews WHERE id = $1', [reviewId]);
  return Number(res.rows[0].weight);
}

describe('Review weight', () => {
  it('starts at 0 after creation', async () => {
    expect(await getWeight()).toBe(0);
  });

  it('increases after an upvote', async () => {
    await request(app)
      .post(`/api/reviews/${reviewId}/vote`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ vote: 1 });

    // voter rep=0 → multiplier=1.0, new review → timeFactor≈1.0
    // weight = 1.0 * 1 * ~1.0 ≈ 1.0
    expect(await getWeight()).toBeCloseTo(1.0, 1);
  });

  it('goes back to ~0 when vote is toggled off', async () => {
    await request(app)
      .post(`/api/reviews/${reviewId}/vote`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ vote: 1 });

    expect(await getWeight()).toBeCloseTo(0, 1);
  });

  it('decreases below 0 after a downvote', async () => {
    await request(app)
      .post(`/api/reviews/${reviewId}/vote`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ vote: -1 });

    expect(await getWeight()).toBeCloseTo(-1.0, 1);
  });

  it('shifts correctly when vote is changed from down to up', async () => {
    // Currently at -1 (downvote from B). Change to upvote.
    await request(app)
      .post(`/api/reviews/${reviewId}/vote`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ vote: 1 });

    // delta = 1 - (-1) = +2 → weight ≈ +1
    expect(await getWeight()).toBeCloseTo(1.0, 1);
  });
});
