// Script de semilla para poblar la base de datos con datos de prueba.
// Ejecutar manualmente con: node src/tests/seed.js
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
  // SUSHI / JAPONESA
  { product_name: 'Sushi roll salmón x8', product_price: 32000, content: 'El salmón estaba increíblemente fresco, se deshacía en la boca. El arroz en su punto y el nori crujiente. Llevaba tiempo buscando buen sushi en Bogotá y por fin lo encontré.', is_recommended: true, business_name: 'Sakura Sushi Bar', business_location_text: 'Calle 93 con Carrera 11, Bogotá' },
  { product_name: 'Sushi bento box', product_price: 45000, content: 'La caja venía con rolls, nigiri y gyoza. Todo fresco y bien presentado. El miso soup caliente y bien sazonado. Relación calidad-precio excelente para sushi de esta categoría.', is_recommended: true, business_name: 'Sakura Sushi Bar', business_location_text: 'Calle 93 con Carrera 11, Bogotá' },
  { product_name: 'Ramen tonkotsu', product_price: 38000, content: 'El caldo espeso y con sabor profundo, el chashu perfectamente caramelizado. Los fideos al dente. Uno de los mejores ramen que he probado fuera de Japón. Muy recomendado.', is_recommended: true, business_name: 'Noodle House Bogotá', business_location_text: 'Carrera 11 con Calle 85, Bogotá' },
  { product_name: 'Sashimi mixto', product_price: 55000, content: 'El pescado no estaba fresco. El atún tenía un color opaco y olor extraño. Tuve malestar estomacal horas después. Pésima experiencia para un restaurante que cobra estos precios.', is_recommended: false, business_name: 'Tokyo Express', business_location_text: 'Centro Comercial El Retiro, Bogotá' },

  // HAMBURGUESAS
  { product_name: 'Smash burger doble', product_price: 28000, content: 'La carne aplastada en la plancha crea una costra increíble. El queso americano perfectamente derretido y el pan brioche tostado con mantequilla. La mejor hamburguesa que he comido en Bogotá sin duda.', is_recommended: true, business_name: 'Burger Factory', business_location_text: 'Calle 72 con Carrera 7, Bogotá' },
  { product_name: 'Hamburguesa BBQ bacon', product_price: 32000, content: 'El bacon crujiente, la salsa BBQ ahumada y el queso cheddar fundido hacen una combinación perfecta. Las papas caseras con cáscara son adictivas. Vale cada peso.', is_recommended: true, business_name: 'Burger Factory', business_location_text: 'Calle 72 con Carrera 7, Bogotá' },
  { product_name: 'Hamburguesa vegetariana', product_price: 24000, content: 'La hamburguesa de lentejas y champiñones tenía muy buen sabor. Nada que envidiarle a la de carne. Los ingredientes frescos y el pan artesanal excelente. Sorprendentemente buena.', is_recommended: true, business_name: 'Green Burger Co.', business_location_text: 'Carrera 15 con Calle 82, Bogotá' },
  { product_name: 'Hamburguesa gourmet triple', product_price: 38000, content: 'La carne venía cruda en el centro pidiendo término medio. El pan estaba duro como si fuera del día anterior. Para ese precio esperaba mucho más. No vuelvo.', is_recommended: false, business_name: 'The Burger Club', business_location_text: 'Calle 119 con Carrera 7, Bogotá' },

  // PIZZA
  { product_name: 'Pizza napolitana margherita', product_price: 35000, content: 'Masa delgada y crujiente horneada en horno de leña. La salsa de tomate San Marzano y el queso mozzarella fresco son de primera calidad. Llegó caliente y perfecta al domicilio.', is_recommended: true, business_name: 'La Piazza Italiana', business_location_text: 'Calle 85 con Carrera 13, Bogotá' },
  { product_name: 'Pizza quattro formaggi', product_price: 42000, content: 'Cuatro quesos perfectamente equilibrados. La masa artesanal bien fermentada con bordes esponjosos. El servicio en mesa fue atento y rápido. Una de las mejores pizzas de la ciudad.', is_recommended: true, business_name: 'La Piazza Italiana', business_location_text: 'Calle 85 con Carrera 13, Bogotá' },
  { product_name: 'Pizza pepperoni familiar', product_price: 45000, content: 'Llegó al domicilio fría, aplastada y con el queso pegado en la caja. El pepperoni crudo en algunas partes. Imposible comer eso. El servicio al cliente no ofreció solución. Pésimo.', is_recommended: false, business_name: 'Pizza House Express', business_location_text: 'Carrera 13 con Calle 63, Bogotá' },

  // COMIDA COLOMBIANA
  { product_name: 'Bandeja paisa completa', product_price: 28000, content: 'Chicharrón crocante, chorizo casero, frijoles cremosos, arroz, aguacate y huevo. Todo en punto perfecto. La porción es generosa y alcanza con creces. El sabor casero que se extraña.', is_recommended: true, business_name: 'Restaurante El Antioqueño', business_location_text: 'Calle 80 con Carrera 15, Bogotá' },
  { product_name: 'Ajiaco santafereño', product_price: 22000, content: 'Las tres variedades de papa bien cocidas y cremosas. El pollo desmechado y la guascas le dan el sabor auténtico bogotano. Con crema, alcaparras y aguacate incluidos. Muy reconfortante.', is_recommended: true, business_name: 'La Cazuela Bogotana', business_location_text: 'Carrera 7 con Calle 45, Bogotá' },
  { product_name: 'Churrasco + papas criollas', product_price: 45000, content: 'Pedí el churrasco a término medio y llegó completamente crudo por dentro. Esperamos 70 minutos para que lo volvieran a hacer y llegó igual. El mesero fue grosero al reclamar. Nunca más.', is_recommended: false, business_name: 'Parrilla del Norte', business_location_text: 'Calle 147 con Carrera 9, Bogotá' },
  { product_name: 'Sancocho de gallina', product_price: 25000, content: 'El caldo oscuro y sabroso con yuca, papa, plátano y la gallina bien cocida. El sabor intenso y casero que no se consigue en cualquier lado. Con arroz y ensalada. Espectacular.', is_recommended: true, business_name: 'Restaurante Doña Esperanza', business_location_text: 'Carrera 24 con Calle 57, Bogotá' },

  // BARBERÍA
  { product_name: 'Corte degradado + barba perfilada', product_price: 45000, content: 'El barbero escuchó exactamente lo que quería y lo ejecutó a la perfección. El degradado limpio y la barba bien delineada con navaja. El ambiente del local es muy agradable. Mi barbería fija ya.', is_recommended: true, business_name: 'Barbería El Señor', business_location_text: 'Calle 85 con Carrera 15, Bogotá' },
  { product_name: 'Corte clásico + afeitado', product_price: 38000, content: 'Servicio completo con toalla caliente, aceites y navaja. El corte clásico impecable y el afeitado dejó la piel suave sin irritación. Una experiencia de barbería tradicional de primera.', is_recommended: true, business_name: 'Old School Barber', business_location_text: 'Carrera 11 con Calle 93, Bogotá' },
  { product_name: 'Corte de cabello hombre', product_price: 25000, content: 'El barbero hizo lo que quiso sin preguntar. Quedé con un corte que no pedí y demasiado corto. Cuando lo llamé la atención dijo que así quedaba mejor. Irrespeto total al cliente.', is_recommended: false, business_name: 'Peluquería Rápida Express', business_location_text: 'Carrera 7 con Calle 45, Centro, Bogotá' },

  // ESTÉTICA / SALÓN
  { product_name: 'Tinte balayage + tratamiento', product_price: 280000, content: 'La colorista es una artista. El balayage quedó natural y progresivo, exactamente como las referencias que llevé. El tratamiento de keratina dejó el cabello sedoso. Vale cada peso.', is_recommended: true, business_name: 'Salón Vogue', business_location_text: 'Calle 90 con Carrera 14, Bogotá' },
  { product_name: 'Manicure gel + pedicure', product_price: 55000, content: 'El esmalte gel duró tres semanas sin despegarse ni astillarse. El pedicure muy completo con exfoliación y masaje. Los implementos esterilizados en frente mío. Profesionalismo total.', is_recommended: true, business_name: 'Nails & Spa Bogotá', business_location_text: 'Carrera 15 con Calle 90, Bogotá' },
  { product_name: 'Tinte + corte de puntas', product_price: 120000, content: 'Me quemaron el cuero cabelludo con el tinte y quedé con el cabello seco y sin brillo. Cuando reclamé dijeron que era reacción normal. Tuve que ir a otro salón a arreglarlo gastando el doble.', is_recommended: false, business_name: 'Salón Glamour', business_location_text: 'Centro Comercial Unicentro, Bogotá' },

  // GIMNASIO / FITNESS
  { product_name: 'Membresía mensual + clases', product_price: 130000, content: 'Equipos nuevos y siempre disponibles, duchas calientes y limpias. Los instructores te orientan sin que lo pidas. El ambiente es motivador sin ser intimidante. El mejor gimnasio que he frecuentado.', is_recommended: true, business_name: 'Smart Fit Chapinero', business_location_text: 'Carrera 13 con Calle 60, Bogotá' },
  { product_name: 'Clase de crossfit', product_price: 40000, content: 'El entrenador modificó los ejercicios según mi nivel sin problema. La clase intensa pero alcanzable. El box limpio y bien equipado. Salí agotado pero satisfecho. Lo recomiendo para ponerse en forma.', is_recommended: true, business_name: 'CrossFit Norte Bogotá', business_location_text: 'Calle 127 con Carrera 19, Bogotá' },
  { product_name: 'Clase de yoga', product_price: 35000, content: 'La instructora llegó 25 minutos tarde sin disculparse y dio solo 35 minutos de clase de los 60 prometidos. Cuando pregunté por el tiempo cobró la clase completa igual. Un robo descarado.', is_recommended: false, business_name: 'Centro Zen Bogotá', business_location_text: 'Calle 82 con Carrera 11, Bogotá' },
  { product_name: 'Entrenamiento personal (mes)', product_price: 400000, content: 'Mi entrenador diseñó un plan completamente personalizado y ajustó la rutina cada semana según mi progreso. En dos meses vi resultados que no logré en años de ir solo al gimnasio.', is_recommended: true, business_name: 'FitPro Training', business_location_text: 'Carrera 15 con Calle 104, Bogotá' },

  // SALUD / MÉDICO
  { product_name: 'Consulta médica general', product_price: 80000, content: 'El médico se tomó 40 minutos revisándome sin apresurarse. Explicó el diagnóstico con términos claros y recetó solo lo necesario. La primera vez que salgo de una consulta sin sentir que me apresuraron.', is_recommended: true, business_name: 'Clínica Médicos Unidos', business_location_text: 'Calle 45 con Carrera 9, Bogotá' },
  { product_name: 'Limpieza dental + blanqueamiento', product_price: 250000, content: 'La odontóloga fue extremadamente cuidadosa y explicó cada procedimiento antes de hacerlo. El blanqueamiento dejó resultados visibles desde la primera sesión. El consultorio impecable y moderno.', is_recommended: true, business_name: 'Dental Plus', business_location_text: 'Carrera 11 con Calle 100, Bogotá' },
  { product_name: 'Consulta dermatológica', product_price: 120000, content: 'La dermatóloga diagnosticó en segundos sin siquiera mirarme bien. Me recetó tres cremas costosas sin explicar para qué era cada una. Sentí que solo le interesaba cobrar la consulta. Decepcionante.', is_recommended: false, business_name: 'Centro Dermatológico Bogotá', business_location_text: 'Calle 100 con Carrera 14, Bogotá' },
  { product_name: 'Examen de laboratorio completo', product_price: 95000, content: 'Panel completo de sangre con resultados digitales en 3 horas. La toma de muestra sin dolor y el personal muy amable. Los resultados llegaron con un resumen interpretativo muy útil.', is_recommended: true, business_name: 'Laboratorio Clínico Rápido', business_location_text: 'Calle 57 con Carrera 9, Bogotá' },

  // TECNOLOGÍA / ELECTRÓNICA
  { product_name: 'iPhone 15 Pro 256GB', product_price: 4200000, content: 'Me vendieron el equipo como sellado de fábrica pero la batería estaba al 87% y la caja tenía señales de haber sido abierta. El vendedor negó todo. Tuve que ir a Apple Store a confirmar que era reacondicionado.', is_recommended: false, business_name: 'iStore Colpatria', business_location_text: 'Centro Comercial Colpatria, Bogotá' },
  { product_name: 'Reparación pantalla Samsung S23', product_price: 180000, content: 'Pantalla original Samsung instalada en menos de 2 horas. Garantía de 6 meses por escrito. El técnico hizo pruebas de táctil y cámara antes de entregarlo. Precio muy justo para la calidad del servicio.', is_recommended: true, business_name: 'Tecno Repair Express', business_location_text: 'Calle 13 con Carrera 7, Centro, Bogotá' },
  { product_name: 'Portátil Lenovo IdeaPad', product_price: 2400000, content: 'Lleva 4 meses funcionando perfectamente para diseño gráfico. La pantalla tiene colores precisos y el rendimiento con programas pesados es sorprendente para el precio. La batería dura 7 horas reales.', is_recommended: true, business_name: 'Alkosto Calle 170', business_location_text: 'Calle 170 con Carrera 7, Bogotá' },
  { product_name: 'Smart TV 55" 4K', product_price: 1800000, content: 'La imagen es espectacular y la configuración de Android TV muy intuitiva. Sin embargo la garantía fue un problema: el panel falló a los 5 meses y tardaron 3 meses en repararlo. El producto bien, el servicio postventa malo.', is_recommended: false, business_name: 'Jumbo Calle 80', business_location_text: 'Calle 80 con Carrera 68, Bogotá' },
  { product_name: 'Audífonos Sony WH-1000XM5', product_price: 1200000, content: 'La cancelación de ruido es impresionante, bloquea el ruido del metro completamente. El sonido limpio y preciso. La batería dura 30 horas reales. La mejor inversión en audio que he hecho.', is_recommended: true, business_name: 'Sony Store Andino', business_location_text: 'Centro Comercial Andino, Bogotá' },

  // ROPA Y MODA
  { product_name: 'Tenis New Balance 574', product_price: 380000, content: 'Originales con certificado, cómodos desde el primer día sin necesitar adaptación. La atención en tienda excelente, me midieron el pie y recomendaron la talla correcta. Ya van 8 meses y siguen perfectos.', is_recommended: true, business_name: 'Marathon Sports Unicentro', business_location_text: 'Centro Comercial Unicentro, Bogotá' },
  { product_name: 'Chaqueta impermeable de montaña', product_price: 420000, content: 'Probada en el páramo de Sumapaz bajo lluvia intensa: completamente seca por dentro. Las costuras selladas y la capucha ajustable funcionan perfectamente. Vale la inversión para quien hace senderismo.', is_recommended: true, business_name: 'Lippi Colombia', business_location_text: 'Calle 122 con Carrera 15, Bogotá' },
  { product_name: 'Vestido de cóctel', product_price: 280000, content: 'La tela de muy buena caída y el corte favorecedor. Me lo entregaron en el tiempo prometido y con el dobladillo perfecto. Recibí muchos cumplidos en el evento. Definitivamente vuelvo a esta boutique.', is_recommended: true, business_name: 'Boutique Élite', business_location_text: 'Calle 82 con Carrera 13, Bogotá' },
  { product_name: 'Jeans skinny', product_price: 150000, content: 'El jean se decoloró después de dos lavadas siguiendo las instrucciones del fabricante. La costura de la entrepierna se abrió al mes. Para esos precios esperaba mejor calidad. No compren aquí.', is_recommended: false, business_name: 'Fashion Store Andino', business_location_text: 'Centro Comercial Andino, Bogotá' },
  { product_name: 'Ropa deportiva mujer (set)', product_price: 180000, content: 'La tela compresiva de muy buena calidad, no transparenta al agacharse. El set incluye top y leggins perfectamente coordinados. Después de 6 meses de uso frecuente sigue igual de bien.', is_recommended: true, business_name: 'Decathlon Calle 170', business_location_text: 'Calle 170 con Carrera 54, Bogotá' },

  // AUTOMOTRIZ
  { product_name: 'Cambio de aceite 5W-30 sintético', product_price: 95000, content: 'Me cobraron por el filtro de aire y al llegar a casa revisé: era el mismo filtro viejo. Cuando fui a reclamar con fotos y fecha, el mecánico jefe dijo que debía haberme quedado a ver el proceso. Un robo con premeditación.', is_recommended: false, business_name: 'AutoService Centro', business_location_text: 'Calle 6 con Carrera 24, Bogotá' },
  { product_name: 'Lavado full detailing interior+exterior', product_price: 130000, content: 'El carro quedó mejor que cuando salió del concesionario. Limpiaron hasta los rincones del tablero y los tapetes como nuevos. El pulido exterior eliminó rayones superficiales. Tardaron 4 horas pero valió cada minuto.', is_recommended: true, business_name: 'AutoSpa Premium', business_location_text: 'Carrera 50 con Calle 80, Bogotá' },
  { product_name: 'Diagnóstico escáner OBD + revisión', product_price: 60000, content: 'El técnico conectó el escáner, leyó los códigos de error y me explicó exactamente qué significaba cada uno sin tratar de venderme reparaciones innecesarias. Honestidad que ya no se ve. Recomendado 100%.', is_recommended: true, business_name: 'Taller Mecánico Confianza', business_location_text: 'Carrera 30 con Calle 13, Bogotá' },

  // HOGAR / SERVICIOS
  { product_name: 'Instalación aire acondicionado split', product_price: 180000, content: 'Instalación en 3 horas, limpia y sin dañar paredes. El técnico explicó el mantenimiento preventivo y dejó todo recogido. El equipo enfría perfectamente. Precio competitivo para la calidad del trabajo.', is_recommended: true, business_name: 'Clima Total Bogotá', business_location_text: 'Carrera 68 con Calle 22, Bogotá' },
  { product_name: 'Plomería emergencia tubería rota', product_price: 150000, content: 'Llegaron 2 horas después de lo prometido. Soldaron la tubería rápido pero mal. A los tres días volvió la fuga peor que antes y ya no contestaban el teléfono ni respondieron el WhatsApp. Pérdida de dinero total.', is_recommended: false, business_name: 'Plomeros 24h Bogotá', business_location_text: 'Carrera 7 con Calle 100, Bogotá' },
  { product_name: 'Pintura de apartamento (3 habitaciones)', product_price: 800000, content: 'Trabajo impecable con bordes perfectos sin usar masking tape. Los pintores llegaron puntual los 3 días, cubrieron todos los muebles y dejaron el apartamento sin rastro de pintura fuera de las paredes. Profesionales de verdad.', is_recommended: true, business_name: 'Pintores Pro Bogotá', business_location_text: 'Calle 34 con Carrera 24, Bogotá' },

  // EDUCACIÓN
  { product_name: 'Curso inglés B1 intensivo (mes)', product_price: 280000, content: 'Profesores nativos con metodología comunicativa real. Clases dinámicas sin libros de texto aburridos. En 4 semanas tuve conversaciones reales. El progreso fue notablemente más rápido que en academias tradicionales.', is_recommended: true, business_name: 'English Now Bogotá', business_location_text: 'Calle 100 con Carrera 11, Bogotá' },
  { product_name: 'Curso de programación Python (2 meses)', product_price: 450000, content: 'El instructor explica con proyectos reales desde el primer día. Al terminar el curso construí una aplicación funcional. El material actualizado y la comunidad de alumnos muy activa. Cambié de carrera gracias a este curso.', is_recommended: true, business_name: 'Academia Tech Bogotá', business_location_text: 'Carrera 11 con Calle 93, Bogotá' },
  { product_name: 'Clases de guitarra (4 sesiones)', product_price: 160000, content: 'El profesor canceló 3 de las 4 clases pagadas por WhatsApp a última hora. Cuando pedí reembolso dijo que podía reagendar pero nunca tuvo disponibilidad. Me bloqueó cuando insistí. Cuidado con este lugar.', is_recommended: false, business_name: 'Academia Musical Armonia', business_location_text: 'Carrera 5 con Calle 26, Bogotá' },

  // MASCOTAS
  { product_name: 'Baño medicado + corte caniche', product_price: 65000, content: 'Mi caniche tiene piel sensible y aquí usan productos hipoalergénicos sin costo adicional. El corte quedó exactamente como las fotos de referencia que llevé. El perro llegó calmado, sin signos de estrés. El mejor grooming de Bogotá.', is_recommended: true, business_name: 'PetLove Spa Canino', business_location_text: 'Calle 90 con Carrera 19, Bogotá' },
  { product_name: 'Consulta veterinaria + vacunas', product_price: 120000, content: 'El veterinario revisó mi gata con mucha paciencia y explicó el plan de vacunación de forma clara. Detectó una infección de oído que yo no había notado. El consultorio con equipos modernos y limpio. Veterinario de confianza.', is_recommended: true, business_name: 'Clínica Veterinaria Los Animales', business_location_text: 'Carrera 15 con Calle 100, Bogotá' },
  { product_name: 'Hotel para mascotas (semana)', product_price: 350000, content: 'Dejé a mi labrador una semana y las actualizaciones con fotos y videos diarios me dieron tranquilidad total. Llegó sano, bien alimentado y feliz. No lo vi ansioso ni estresado. Vale la pena para viajes largos.', is_recommended: true, business_name: 'PetHotel Premium', business_location_text: 'Calle 140 con Carrera 9, Bogotá' },

  // TRANSPORTE / MUDANZAS
  { product_name: 'Mudanza apartamento 2 habitaciones', product_price: 380000, content: 'Llegaron puntual con el camión, embalaron los muebles frágiles con cuidado y terminaron 2 horas antes del tiempo estimado. Sin un solo daño y al precio acordado sin cobros sorpresa al final. Excelente servicio.', is_recommended: true, business_name: 'Mudanzas Rápido y Seguro', business_location_text: 'Carrera 30 con Calle 26, Bogotá' },

  // RESTAURANTE EJECUTIVO / CAFÉ
  { product_name: 'Menú ejecutivo almuerzo', product_price: 18000, content: 'Sopa de pasta, seco de pollo guisado, arroz, ensalada, jugo natural y postre por 18 mil. Comida casera y bien sazonada. Las porciones generosas. El lugar limpio y el servicio amable. El mejor corrientazo de la zona.', is_recommended: true, business_name: 'Restaurante Doña Esperanza', business_location_text: 'Carrera 24 con Calle 57, Bogotá' },
  { product_name: 'Cappuccino + croissant', product_price: 18000, content: 'El espresso bien extraído con crema dorada y la leche texturizada perfectamente. El croissant con capas hojaldradas y mantequilla de calidad. El ambiente tranquilo ideal para trabajar. Mi café de cabecera en Chapinero.', is_recommended: true, business_name: 'Café Grano Negro', business_location_text: 'Calle 63 con Carrera 9, Bogotá' },
  { product_name: 'Desayuno americano completo', product_price: 22000, content: 'Los huevos revueltos esponjosos, el tocino crujiente y el pan tostado con mantequilla real. El jugo de naranja recién exprimido. Porciones grandes que llenan hasta el almuerzo. El mejor desayuno del norte de Bogotá.', is_recommended: true, business_name: 'The Breakfast Club', business_location_text: 'Carrera 13 con Calle 90, Bogotá' },

  // DROGUERÍA / FARMACIA
  { product_name: 'Domicilio medicamentos formulados', product_price: 85000, content: 'Me enviaron un medicamento de diferente laboratorio al formulado y sin llamarme para confirmar el cambio. Cuando llamé a reclamar dijeron que era bioequivalente. No tienen el derecho de cambiar sin autorización del paciente.', is_recommended: false, business_name: 'Droguería Salud Total', business_location_text: 'Carrera 50 con Calle 45, Bogotá' },
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
