// Tests de integración para el sistema de reputación.
// Cubren: cambios de reputación por votos en reseñas y comentarios, decaimiento por inactividad.
// Ejecutan contra una base de datos real (sin mocks) — requieren DATABASE_URL válida.
import request from 'supertest';
import app from '../../app.js';
import pool from '../config/db.js';
import ReputationService from '../services/reputation.service.js';

const userA = { username: 'repA', email: 'repA@test.com', password: '123456' };
const userB = { username: 'repB', email: 'repB@test.com', password: '123456' };

const testReview = {
  product_name: 'Caldo de costilla',
  product_price: 15000,
  content: 'Reconfortante y con muy buen sabor, ideal para el frío bogotano',
  is_recommended: true,
  business_name: 'Caldos La Esperanza',
  business_location_text: 'Avenida 19 con Calle 100, Bogotá'
};

let tokenA, tokenB, userAId, reviewId, commentId;

beforeAll(async () => {
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [[userA.email, userB.email]]);

  const resA = await request(app).post('/api/auth/register').send(userA);
  tokenA = resA.body.data.token;
  userAId = resA.body.data.user.id;

  const resB = await request(app).post('/api/auth/register').send(userB);
  tokenB = resB.body.data.token;

  const resReview = await request(app)
    .post('/api/reviews')
    .set('Authorization', `Bearer ${tokenA}`)
    .send(testReview);
  reviewId = resReview.body.data.id;

  const resComment = await request(app)
    .post(`/api/reviews/${reviewId}/comments`)
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ content: 'Este caldo es de otro nivel, muy recomendado' });
  commentId = resComment.body.data.id;
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [[userA.email, userB.email]]);
  await pool.end();
});

async function getReputation(userId) {
  const res = await pool.query('SELECT reputation_score FROM users WHERE id = $1', [userId]);
  return Number(res.rows[0].reputation_score);
}

describe('Reputation — review votes', () => {
  it('increases when another user upvotes your review', async () => {
    const before = await getReputation(userAId);

    await request(app)
      .post(`/api/reviews/${reviewId}/vote`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ vote: 1 });

    const after = await getReputation(userAId);
    // voter rep=0 → multiplier=1.0 → delta = 1 * 1.0 * 0.15 = 0.15
    expect(after).toBeCloseTo(before + 0.15, 3);
  });

  it('decreases when vote is toggled off', async () => {
    const before = await getReputation(userAId);

    await request(app)
      .post(`/api/reviews/${reviewId}/vote`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ vote: 1 });

    const after = await getReputation(userAId);
    // delta = -1 * 1.0 * 0.15 = -0.15
    expect(after).toBeCloseTo(before - 0.15, 3);
  });

  it('decreases when another user downvotes your review', async () => {
    // Reset to a known positive value so the floor doesn't interfere
    await pool.query('UPDATE users SET reputation_score = 1 WHERE id = $1', [userAId]);
    // Clear any existing vote from B so this is a fresh downvote
    await pool.query('DELETE FROM review_votes WHERE review_id = $1', [reviewId]);

    await request(app)
      .post(`/api/reviews/${reviewId}/vote`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ vote: -1 });

    const after = await getReputation(userAId);
    // delta = -1 * 1.0 * 0.15 = -0.15 → 1 - 0.15 = 0.85
    expect(after).toBeCloseTo(0.85, 3);
  });

  it('never goes below 0', async () => {
    // Force reputation to 0
    await pool.query('UPDATE users SET reputation_score = 0 WHERE id = $1', [userAId]);

    // Remove existing downvote first (toggle), then downvote again
    await request(app)
      .post(`/api/reviews/${reviewId}/vote`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ vote: -1 }); // toggle off the current downvote

    await request(app)
      .post(`/api/reviews/${reviewId}/vote`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ vote: -1 }); // new downvote

    const rep = await getReputation(userAId);
    expect(rep).toBeGreaterThanOrEqual(0);
  });

  it('does not change your own reputation when you vote yourself', async () => {
    const before = await getReputation(userAId);

    // A tries to vote their own review — should be rejected (403)
    await request(app)
      .post(`/api/reviews/${reviewId}/vote`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ vote: 1 });

    expect(await getReputation(userAId)).toBe(before);
  });
});

describe('Reputation — comment votes', () => {
  beforeEach(async () => {
    // Reset reputation and clear existing comment votes for a clean state
    await pool.query('UPDATE users SET reputation_score = 0 WHERE id = $1', [userAId]);
    await pool.query(
      'DELETE FROM comment_votes WHERE comment_id = $1',
      [commentId]
    );
  });

  it('increases when another user upvotes your comment', async () => {
    await request(app)
      .post(`/api/reviews/${reviewId}/comments/${commentId}/vote`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ vote: 1 });

    const rep = await getReputation(userAId);
    // delta = 1 * 1.0 * 0.05 = 0.05
    expect(rep).toBeCloseTo(0.05, 3);
  });

  it('decreases when another user downvotes your comment', async () => {
    await request(app)
      .post(`/api/reviews/${reviewId}/comments/${commentId}/vote`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ vote: -1 });

    const rep = await getReputation(userAId);
    // delta = -1 * 1.0 * 0.05 = -0.05 → floor at 0
    expect(rep).toBe(0);
  });

  it('cannot vote your own comment', async () => {
    const res = await request(app)
      .post(`/api/reviews/${reviewId}/comments/${commentId}/vote`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ vote: 1 });

    expect(res.status).toBe(403);
    expect(await getReputation(userAId)).toBe(0);
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .post(`/api/reviews/${reviewId}/comments/${commentId}/vote`)
      .send({ vote: 1 });

    expect(res.status).toBe(401);
  });
});

describe('Reputation — inactivity decay', () => {
  it('reduces reputation for users inactive 90+ days', async () => {
    await pool.query(
      `UPDATE users SET reputation_score = 100, last_active_at = NOW() - INTERVAL '91 days'
       WHERE id = $1`,
      [userAId]
    );

    await ReputationService.applyInactivityDecay();

    const rep = await getReputation(userAId);
    // 100 * 0.995 = 99.5
    expect(rep).toBeCloseTo(99.5, 1);
  });

  it('does not affect users active within 90 days', async () => {
    await pool.query(
      'UPDATE users SET reputation_score = 100, last_active_at = NOW() WHERE id = $1',
      [userAId]
    );

    await ReputationService.applyInactivityDecay();

    expect(await getReputation(userAId)).toBeCloseTo(100, 1);
  });

  it('never decays below 1.0', async () => {
    await pool.query(
      `UPDATE users SET reputation_score = 1.001, last_active_at = NOW() - INTERVAL '91 days'
       WHERE id = $1`,
      [userAId]
    );

    await ReputationService.applyInactivityDecay();

    expect(await getReputation(userAId)).toBeGreaterThanOrEqual(1.0);
  });

  it('does not affect users already at 1.0 or below', async () => {
    await pool.query(
      `UPDATE users SET reputation_score = 1.0, last_active_at = NOW() - INTERVAL '91 days'
       WHERE id = $1`,
      [userAId]
    );

    await ReputationService.applyInactivityDecay();

    expect(await getReputation(userAId)).toBeCloseTo(1.0, 3);
  });
});
