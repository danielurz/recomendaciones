import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from './db.js';

const users = [
  { username: 'carlos_m', email: 'carlos@seed.com', password: '123456' },
  { username: 'laura_v', email: 'laura@seed.com', password: '123456' },
  { username: 'andres_r', email: 'andres@seed.com', password: '123456' },
  { username: 'sofia_p', email: 'sofia@seed.com', password: '123456' },
  { username: 'miguel_t', email: 'miguel@seed.com', password: '123456' }
];

const reviews = [
  {
    product_name: 'Corte de cabello degradado',
    product_price: 35000,
    content: 'El barbero hizo un trabajo increíble, el degradado quedó perfecto y duró más de lo esperado. El local es limpio y la atención muy profesional.',
    is_recommended: true,
    business_name: 'Barbería Kings Cut',
    business_location_text: 'Calle 93 con Carrera 15, Bogotá'
  },
  {
    product_name: 'Membresía mensual gimnasio',
    product_price: 120000,
    content: 'Las máquinas están en mal estado, varias rotas y sin mantenimiento. Los vestuarios huelen mal y el personal es poco amable. No vale lo que cobran.',
    is_recommended: false,
    business_name: 'GymPower Chapinero',
    business_location_text: 'Carrera 13 con Calle 57, Bogotá'
  },
  {
    product_name: 'Samsung Galaxy A55',
    product_price: 1450000,
    content: 'Me vendieron el teléfono con la caja abierta y cuando llegué a casa vi que le faltaban los audífonos. Cuando fui a reclamar me dijeron que así venía de fábrica.',
    is_recommended: false,
    business_name: 'Tecno Express',
    business_location_text: 'Centro Comercial Andino, Bogotá'
  },
  {
    product_name: 'Domicilio de medicamentos',
    product_price: 85000,
    content: 'Pedí medicamentos a domicilio y llegaron en 20 minutos. El precio fue el mismo que en tienda, sin recargo por el envío. Muy buena experiencia.',
    is_recommended: true,
    business_name: 'Droguería El Alivio',
    business_location_text: 'Calle 45 con Carrera 24, Bogotá'
  },
  {
    product_name: 'Limpieza dental completa',
    product_price: 180000,
    content: 'Excelente servicio odontológico. La doctora fue muy cuidadosa, explicó todo el procedimiento y no sentí dolor en ningún momento. El consultorio está muy bien equipado.',
    is_recommended: true,
    business_name: 'Clínica Dental Sonrisas',
    business_location_text: 'Carrera 11 con Calle 82, Bogotá'
  }
];

const positiveComments = [
  'Totalmente de acuerdo, tuve la misma experiencia.',
  'Lo visité la semana pasada y también quedé muy satisfecho.',
  'Recomendado al 100%, no te arrepentirás.',
  'Muy buena reseña, refleja exactamente lo que viví.',
  'Sí, es uno de los mejores del sector sin duda.'
];

const negativeComments = [
  'No estoy de acuerdo, a mí me fue muy mal ahí.',
  'Yo tuve una experiencia completamente distinta y negativa.',
  'No lo recomiendo, el servicio ha bajado mucho de calidad.',
  'Fui hace poco y fue una decepción total.',
  'Hay mejores opciones en el mismo sector, no merece la pena.'
];

function getRandomSplit(total) {
  const positiveCount = Math.floor(Math.random() * (total + 1));
  return { positiveCount, negativeCount: total - positiveCount };
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

async function seed() {
  console.log('Cleaning previous seed data...');
  const emails = users.map(u => u.email);
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [emails]);

  console.log('Creating users...');
  const createdUsers = [];
  for (const user of users) {
    const password_hash = await bcrypt.hash(user.password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [user.username, user.email, password_hash]
    );
    createdUsers.push(result.rows[0]);
    console.log(`  ✓ ${user.username}`);
  }

  console.log('\nCreating reviews...');
  const createdReviews = [];
  for (let i = 0; i < createdUsers.length; i++) {
    const author = createdUsers[i];
    const review = reviews[i];
    const result = await pool.query(
      `INSERT INTO reviews (user_id, product_name, product_price, content, is_recommended, business_name, business_location_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [author.id, review.product_name, review.product_price, review.content, review.is_recommended, review.business_name, review.business_location_text]
    );
    createdReviews.push({ ...result.rows[0], author });
    console.log(`  ✓ "${review.product_name}" por ${author.username}`);
  }

  console.log('\nCreating comments and votes...');
  for (const review of createdReviews) {
    const commenters = createdUsers.filter(u => u.id !== review.author.id);
    const shuffled = shuffle(commenters);
    const { positiveCount, negativeCount } = getRandomSplit(shuffled.length);

    console.log(`\n  Review: "${review.product_name}"`);
    console.log(`  Split: ${positiveCount} positivos / ${negativeCount} negativos`);

    for (let i = 0; i < shuffled.length; i++) {
      const commenter = shuffled[i];
      const isPositive = i < positiveCount;
      const commentPool = isPositive ? positiveComments : negativeComments;
      const content = commentPool[Math.floor(Math.random() * commentPool.length)];
      const vote = isPositive ? 1 : -1;

      await pool.query(
        'INSERT INTO comments (review_id, user_id, content) VALUES ($1, $2, $3)',
        [review.id, commenter.id, content]
      );

      await pool.query(
        'INSERT INTO review_votes (review_id, user_id, vote) VALUES ($1, $2, $3)',
        [review.id, commenter.id, vote]
      );

      console.log(`    ${isPositive ? '+' : '-'} ${commenter.username}: "${content.substring(0, 50)}..."`);
    }
  }

  console.log('\nSeed completed successfully.');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  pool.end();
});
