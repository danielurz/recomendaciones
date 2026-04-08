import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const users = [
  { username: 'carlos_m', email: 'carlos@seed.com' },
  { username: 'laura_v', email: 'laura@seed.com' },
  { username: 'andres_r', email: 'andres@seed.com' },
  { username: 'sofia_p', email: 'sofia@seed.com' },
  { username: 'miguel_t', email: 'miguel@seed.com' },
  { username: 'valentina_g', email: 'valentina@seed.com' },
  { username: 'juan_c', email: 'juan@seed.com' },
  { username: 'maria_f', email: 'maria@seed.com' },
  { username: 'diego_s', email: 'diego@seed.com' },
  { username: 'camila_r', email: 'camila@seed.com' },
  { username: 'sebastian_l', email: 'sebastian@seed.com' },
  { username: 'paula_m', email: 'paula@seed.com' },
  { username: 'nicolas_h', email: 'nicolas@seed.com' },
  { username: 'luisa_b', email: 'luisa@seed.com' },
  { username: 'felipe_o', email: 'felipe@seed.com' },
  { username: 'daniela_c', email: 'daniela@seed.com' },
  { username: 'alejandro_v', email: 'alejandro@seed.com' },
  { username: 'natalia_q', email: 'natalia@seed.com' },
  { username: 'jorge_e', email: 'jorge@seed.com' },
  { username: 'isabella_r', email: 'isabella@seed.com' }
];

const reviewPool = [
  // Restaurantes
  { product_name: 'Bandeja paisa completa', product_price: 28000, content: 'La mejor bandeja paisa de Bogotá. La porción es gigante, el chicharrón crocante y el hogao perfectamente sazonado. Llevo 3 años viniendo y nunca ha fallado.', is_recommended: true, business_name: 'Restaurante El Antioqueño', business_location_text: 'Calle 80 con Carrera 15, Bogotá' },
  { product_name: 'Ajiaco santafereño', product_price: 22000, content: 'El ajiaco más auténtico que he probado. La crema, las alcaparras y el pollo en su punto justo. El servicio fue rápido y amable.', is_recommended: true, business_name: 'La Cazuela Bogotana', business_location_text: 'Carrera 7 con Calle 45, Bogotá' },
  { product_name: 'Churrasco + papas', product_price: 45000, content: 'La carne llegó completamente fría y cruda por dentro cuando pedí término medio. Esperamos más de una hora y el mesero ni se disculpó.', is_recommended: false, business_name: 'Parrilla del Norte', business_location_text: 'Calle 147 con Carrera 9, Bogotá' },
  { product_name: 'Pizza familiar pepperoni', product_price: 38000, content: 'Pedí domicilio y llegó aplastada, fría y con la mitad del queso pegado en la caja. Cuando llamé a reclamar me dejaron en espera 20 minutos y colgaron.', is_recommended: false, business_name: 'Pizza House Express', business_location_text: 'Carrera 13 con Calle 63, Bogotá' },
  { product_name: 'Sushi roll especial x8', product_price: 32000, content: 'Excelente calidad del pescado, muy fresco. La presentación impecable y el arroz en su punto. Sin duda el mejor sushi de la zona norte.', is_recommended: true, business_name: 'Sakura Sushi Bar', business_location_text: 'Calle 93 con Carrera 11, Bogotá' },
  { product_name: 'Menú ejecutivo', product_price: 18000, content: 'Buena relación calidad-precio para el almuerzo. Sopa, seco, jugo y postre por 18mil. La comida casera y bien sazonada.', is_recommended: true, business_name: 'Restaurante Doña Esperanza', business_location_text: 'Carrera 24 con Calle 57, Bogotá' },
  { product_name: 'Hamburguesa gourmet doble', product_price: 29000, content: 'Carne jugosa, pan brioche tostado y los ingredientes frescos. Las papas fritas crujientes. Una de las mejores hamburguesas que he comido.', is_recommended: true, business_name: 'Burger Factory', business_location_text: 'Calle 72 con Carrera 7, Bogotá' },
  // Barbería / Estética
  { product_name: 'Corte + barba', product_price: 40000, content: 'El barbero tomó su tiempo para entender lo que quería. El corte quedó exactamente como lo pedí y la barba bien delineada. Volveré sin duda.', is_recommended: true, business_name: 'Barbería El Señor', business_location_text: 'Calle 85 con Carrera 15, Bogotá' },
  { product_name: 'Tinte + tratamiento', product_price: 120000, content: 'Me quemaron el cabello con el tinte. Quedé con el pelo seco y quebradizo. Cuando reclamé me dijeron que era por el estado previo de mi cabello.', is_recommended: false, business_name: 'Salón Glamour', business_location_text: 'Centro Comercial Unicentro, Bogotá' },
  { product_name: 'Manicure + pedicure', product_price: 45000, content: 'Excelente trabajo, el esmaltado duró más de dos semanas sin descascararse. El local muy limpio y los implementos desinfectados. Muy profesional.', is_recommended: true, business_name: 'Nails & Spa Bogotá', business_location_text: 'Carrera 15 con Calle 90, Bogotá' },
  // Gimnasio / Salud
  { product_name: 'Membresía mensual', product_price: 130000, content: 'Equipos modernos y en perfecto estado, duchas limpias y instructores atentos. El ambiente es motivador. Vale cada peso.', is_recommended: true, business_name: 'Smart Fit Chapinero', business_location_text: 'Carrera 13 con Calle 60, Bogotá' },
  { product_name: 'Clase de yoga', product_price: 35000, content: 'La instructora llegó 20 minutos tarde y solo dio 40 minutos de clase. Cuando pregunté por el tiempo restante dijo que así eran las clases.', is_recommended: false, business_name: 'Centro Zen Bogotá', business_location_text: 'Calle 82 con Carrera 11, Bogotá' },
  { product_name: 'Consulta médica general', product_price: 80000, content: 'El doctor fue muy detallado en su diagnóstico, me explicó todo claramente y me recetó solo lo necesario. La cita fue puntual.', is_recommended: true, business_name: 'Clínica Médicos Unidos', business_location_text: 'Calle 45 con Carrera 9, Bogotá' },
  { product_name: 'Limpieza dental + blanqueamiento', product_price: 250000, content: 'Excelente trabajo. La odontóloga fue muy cuidadosa y explicó cada paso. Resultados visibles desde el primer día. Muy recomendado.', is_recommended: true, business_name: 'Dental Plus', business_location_text: 'Carrera 11 con Calle 100, Bogotá' },
  // Tecnología
  { product_name: 'iPhone 15 Pro 256GB', product_price: 4200000, content: 'Me vendieron el equipo como nuevo pero traía la caja violada y la batería al 89%. Cuando fui a reclamar el vendedor negó haberlo sabido.', is_recommended: false, business_name: 'iStore Colpatria', business_location_text: 'Centro Comercial Colpatria, Bogotá' },
  { product_name: 'Reparación pantalla Samsung', product_price: 180000, content: 'Reparación rápida, en 2 horas lista. La pantalla quedó perfecta y garantizaron el trabajo por 6 meses. Precio justo para el servicio.', is_recommended: true, business_name: 'Tecno Repair Express', business_location_text: 'Calle 13 con Carrera 7, Centro, Bogotá' },
  { product_name: 'Portátil HP Pavilion', product_price: 2800000, content: 'Buen equipo para el precio. Pantalla nítida, buen rendimiento para trabajo y el servicio en tienda fue agradable. Lo recomiendo.', is_recommended: true, business_name: 'Alkosto Calle 170', business_location_text: 'Calle 170 con Carrera 7, Bogotá' },
  // Ropa y moda
  { product_name: 'Chaqueta de cuero sintético', product_price: 180000, content: 'A las dos semanas se empezó a descamar el cuero. Cuando fui a reclamar me dijeron que no tenía garantía porque era sintético.', is_recommended: false, business_name: 'Fashion Store Andino', business_location_text: 'Centro Comercial Andino, Bogotá' },
  { product_name: 'Tenis deportivos Nike', product_price: 320000, content: 'Originales, cómodos y llegaron en perfectas condiciones. El trato en la tienda fue excelente y me asesoraron bien sobre la talla.', is_recommended: true, business_name: 'Nike Store Atlantis', business_location_text: 'Centro Comercial Atlantis, Bogotá' },
  { product_name: 'Vestido de noche', product_price: 220000, content: 'Hermoso vestido, la tela de muy buena calidad y la costura impecable. Me lo entregaron en el tiempo prometido y con todos los accesorios.', is_recommended: true, business_name: 'Boutique Élite', business_location_text: 'Calle 82 con Carrera 13, Bogotá' },
  // Transporte / Servicios
  { product_name: 'Servicio de mudanza', product_price: 350000, content: 'Llegaron a tiempo, fueron cuidadosos con todos mis muebles y terminaron antes de lo previsto. Sin daños y al precio acordado.', is_recommended: true, business_name: 'Mudanzas Rápido y Seguro', business_location_text: 'Carrera 30 con Calle 26, Bogotá' },
  { product_name: 'Cambio de aceite + filtros', product_price: 95000, content: 'Me cobraron por repuestos que no cambiaron. Al revisar con otro mecánico confirmó que el filtro de aire era el original de hace un año.', is_recommended: false, business_name: 'AutoService Centro', business_location_text: 'Calle 6 con Carrera 24, Bogotá' },
  { product_name: 'Lavado full detailing', product_price: 120000, content: 'Dejaron el carro como nuevo por dentro y por fuera. Muy detallados en los rincones y el tiempo de entrega exacto. Lo recomiendo ampliamente.', is_recommended: true, business_name: 'AutoSpa Premium', business_location_text: 'Carrera 50 con Calle 80, Bogotá' },
  // Hogar
  { product_name: 'Instalación eléctrica residencial', product_price: 280000, content: 'Trabajo impecable, puntual y limpio. El electricista explicó todo lo que hizo y dejó el lugar sin rastros de obra. Muy profesional.', is_recommended: true, business_name: 'Electro Instalaciones JR', business_location_text: 'Calle 34 con Carrera 15, Bogotá' },
  { product_name: 'Plomería emergencia domicilio', product_price: 150000, content: 'Llegaron tarde, trabajaron rápido pero mal. A los dos días volvió la fuga y ya no respondieron el teléfono.', is_recommended: false, business_name: 'Plomeros 24h Bogotá', business_location_text: 'Carrera 7 con Calle 100, Bogotá' },
  // Educación
  { product_name: 'Curso inglés nivel básico (mes)', product_price: 180000, content: 'Los profesores son nativos y el método es muy dinámico. En 3 meses tuve una mejora notable. Las instalaciones son cómodas y modernas.', is_recommended: true, business_name: 'English Now Bogotá', business_location_text: 'Calle 100 con Carrera 11, Bogotá' },
  { product_name: 'Clases de guitarra (4 sesiones)', product_price: 160000, content: 'El profesor canceló 2 de las 4 clases a último momento y no las repuso. Cuando pedí reembolso parcial se negó.', is_recommended: false, business_name: 'Academia Musical Armonia', business_location_text: 'Carrera 5 con Calle 26, Bogotá' },
  // Mascotas
  { product_name: 'Baño + corte caniche', product_price: 55000, content: 'Mi perro salió perfumado, con el corte exacto que pedí y muy tranquilo. Se nota que lo tratan con cariño. La atención fue excelente.', is_recommended: true, business_name: 'PetLove Spa Canino', business_location_text: 'Calle 90 con Carrera 19, Bogotá' },
  { product_name: 'Consulta veterinaria', product_price: 70000, content: 'El veterinario fue muy atento con mi gata, explicó el diagnóstico con claridad y el precio fue justo. El consultorio limpio y bien equipado.', is_recommended: true, business_name: 'Clínica Veterinaria Los Animales', business_location_text: 'Carrera 15 con Calle 100, Bogotá' },
  // Farmacias / Droguería
  { product_name: 'Domicilio medicamentos', product_price: 92000, content: 'Me enviaron el medicamento equivocado. Cuando llamé a reclamar me dijeron que era lo mismo pero en diferente presentación, lo cual era falso.', is_recommended: false, business_name: 'Droguería Salud Total', business_location_text: 'Carrera 50 con Calle 45, Bogotá' },
  { product_name: 'Examen de laboratorio', product_price: 65000, content: 'Resultados listos en menos de 4 horas, personal amable y el proceso de toma de muestra indoloro. El precio muy accesible.', is_recommended: true, business_name: 'Laboratorio Clínico Rápido', business_location_text: 'Calle 57 con Carrera 9, Bogotá' }
];

const positiveComments = [
  'Totalmente de acuerdo, tuve exactamente la misma experiencia.',
  'Lo visité la semana pasada y también quedé muy satisfecho.',
  'Recomendado al 100%, no te arrepentirás de ir.',
  'Muy buena reseña, refleja exactamente lo que viví yo también.',
  'Sí señor, es uno de los mejores del sector sin duda alguna.',
  'Confirmo esto, fui con mi familia y todos quedamos encantados.',
  'Así fue mi experiencia también, muy buena atención.',
  'Gracias por la reseña, yo también lo recomiendo ampliamente.',
  'Llevaré a mis amigos, necesitaban una recomendación así de clara.',
  'Fui por esta reseña y no me decepcionó para nada.',
  'Segunda vez que voy y siempre igual de bueno.',
  'El precio es muy justo para la calidad que ofrecen.'
];

const negativeComments = [
  'No estoy de acuerdo, a mí me fue muy mal en ese lugar.',
  'Yo tuve una experiencia completamente diferente y muy negativa.',
  'No lo recomiendo, el servicio ha bajado mucho de calidad últimamente.',
  'Fui hace poco y fue una decepción total, esperaba más.',
  'Hay muchas mejores opciones en el mismo sector, no vale la pena.',
  'Me pasó algo similar, es un patrón de ese lugar.',
  'Pésima atención al cliente cuando hay que reclamar algo.',
  'Los precios no justifican la calidad que entregan.',
  'Llevé a un amigo y los dos salimos decepcionados.',
  'Ya no vuelvo, hay lugares mucho mejores cerca.',
  'Le di otra oportunidad después de una mala experiencia y repitió lo mismo.',
  'Cuidado con este lugar, no es lo que parece en las fotos.'
];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSplit(total) {
  const positiveCount = Math.floor(Math.random() * (total + 1));
  return { positiveCount, negativeCount: total - positiveCount };
}

async function seed() {
  console.log('Cleaning previous seed data...');
  const emails = users.map(u => u.email);
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [emails]);

  console.log('Creating 20 users...');
  const password_hash = await bcrypt.hash('123456', 10);
  const createdUsers = await Promise.all(
    users.map(user =>
      pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
        [user.username, user.email, password_hash]
      ).then(r => r.rows[0])
    )
  );
  console.log(`  ✓ ${createdUsers.length} usuarios creados`);

  console.log('\nCreating reviews (3+ per user)...');
  const shuffledReviews = shuffle(reviewPool);
  let reviewIndex = 0;

  const reviewInserts = createdUsers.flatMap(author => {
    const reviewCount = 3 + Math.floor(Math.random() * 2);
    return Array.from({ length: reviewCount }, () => {
      const review = shuffledReviews[reviewIndex++ % shuffledReviews.length];
      return pool.query(
        `INSERT INTO reviews (user_id, product_name, product_price, content, is_recommended, business_name, business_location_text)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [author.id, review.product_name, review.product_price, review.content, review.is_recommended, review.business_name, review.business_location_text]
      ).then(r => ({ ...r.rows[0], author }));
    });
  });

  const createdReviews = await Promise.all(reviewInserts);
  console.log(`  ✓ ${createdReviews.length} reseñas creadas`);

  console.log('\nCreating comments and votes (10+ per review)...');

  const commentAndVoteInserts = createdReviews.flatMap(review => {
    const commenters = shuffle(createdUsers.filter(u => u.id !== review.author.id));
    const selected = commenters.slice(0, 10 + Math.floor(Math.random() * 4));
    const { positiveCount } = getRandomSplit(selected.length);

    return selected.flatMap((commenter, i) => {
      const isPositive = i < positiveCount;
      const content = isPositive ? getRandom(positiveComments) : getRandom(negativeComments);
      const vote = isPositive ? 1 : -1;

      return [
        pool.query('INSERT INTO comments (review_id, user_id, content) VALUES ($1, $2, $3)', [review.id, commenter.id, content]),
        pool.query('INSERT INTO review_votes (review_id, user_id, vote) VALUES ($1, $2, $3)', [review.id, commenter.id, vote])
      ];
    });
  });

  await Promise.all(commentAndVoteInserts);
  const totalComments = commentAndVoteInserts.length / 2;
  const totalVotes = totalComments;

  console.log(`  ✓ ${totalComments} comentarios creados`);
  console.log(`  ✓ ${totalVotes} votos creados`);
  console.log(`\nSeed completed: ${createdUsers.length} users | ${createdReviews.length} reviews | ${totalComments} comments | ${totalVotes} votes`);
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  pool.end();
});
