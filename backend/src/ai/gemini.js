// SDK oficial de Google para usar los modelos de IA Gemini
import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializa el cliente de Gemini con la API key desde las variables de entorno
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Modelo especializado en generar embeddings (vectores numéricos que representan texto)
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
// Modelo de chat para generar respuestas en lenguaje natural (resúmenes de búsqueda)
const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

/**
 * Genera un embedding para un documento (reseña).
 * Se usa al guardar una reseña nueva para indexarla en la búsqueda semántica.
 * taskType RETRIEVAL_DOCUMENT optimiza el vector para ser recuperado por consultas.
 */
export async function generateEmbedding(text) {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text }], role: 'user' },
    taskType: 'RETRIEVAL_DOCUMENT' // Indica que este texto es un documento a indexar
  });
  // Retorna el array de números flotantes que representa el texto en el espacio vectorial
  return result.embedding.values;
}

/**
 * Genera un embedding para una consulta de búsqueda del usuario.
 * Se usa en tiempo real cuando el usuario busca algo.
 * taskType RETRIEVAL_QUERY optimiza el vector para encontrar documentos similares.
 */
export async function generateQueryEmbedding(text) {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text }], role: 'user' },
    taskType: 'RETRIEVAL_QUERY' // Indica que este texto es una consulta de búsqueda
  });
  // Retorna el vector de la consulta para compararlo con los vectores de las reseñas
  return result.embedding.values;
}

/**
 * Extrae una etiqueta concisa del producto o servicio que está siendo reseñado.
 * Se usa para darle peso semántico dominante al tipo de producto en el embedding,
 * evitando que reseñas de productos distintos queden cerca por compartir lenguaje similar.
 */
export async function extractProductLabel(product_name, business_name, content) {
  const prompt = `¿Qué producto o servicio específico está siendo reseñado? Responde con 2-5 palabras máximo, solo el nombre del producto o servicio, sin explicaciones. Ejemplos de respuesta: "pizza pepperoni", "sushi rolls", "corte de cabello", "membresía de gimnasio", "reparación de pantalla".

Producto: ${product_name}
Comercio: ${business_name}
Reseña: ${content.slice(0, 200)}`;

  const result = await chatModel.generateContent(prompt);
  return result.response.text().trim().toLowerCase();
}

/**
 * Genera un resumen en lenguaje natural de los resultados de búsqueda.
 * La IA analiza las reseñas encontradas y produce un texto útil para el usuario.
 */
export async function generateSummary(query, reviews) {
  // Si no hay resultados, retorna un mensaje invitando al usuario a ser el primero en reseñar
  if (reviews.length === 0) {
    return 'Nadie ha hecho una recomendación sobre lo que estás buscando todavía. ¡Sé el primero en reseñarlo!';
  }

  // Formatea cada reseña como texto legible para incluirla en el prompt
  // Incluye: número, comercio, producto, precio en COP, contenido y si fue recomendado
  const reviewList = reviews.map((r, i) => {
    const weight = Number(r.weight ?? 0);
    const weightLabel = weight > 10 ? ' [muy respaldada por la comunidad]'
                      : weight > 3  ? ' [respaldada por la comunidad]'
                      : weight < -3 ? ' [cuestionada por la comunidad]'
                      : '';
    return `[${i + 1}] ${r.business_name} - ${r.product_name} ($${Number(r.product_price).toLocaleString('es-CO')} COP): ${r.content} (${r.is_recommended ? 'recomendado' : 'no recomendado'}${weightLabel})`;
  }).join('\n');

  // Detecta si el usuario mencionó explícitamente un precio o presupuesto en su búsqueda
  // Solo palabras clave de precio directamente en la query, no en el contenido de las reseñas
  const budgetMatch = query.match(/\b(\d[\d.,]+)\s*(mil|pesos|cop|\$)/i)
                   || query.match(/\b(precio|presupuesto|barato|económico|caro|valor|costo)\b/i);
  const budgetHint = budgetMatch
    ? 'El usuario preguntó por precio. Puedes mencionar precios si son relevantes para responder.'
    : 'El usuario NO preguntó por precios. No menciones precios ni valores monetarios en el resumen.';

  const prompt = `Eres un asistente de búsqueda de reseñas de comercios en Bogotá. El usuario busca: "${query}".

Estas reseñas ya fueron preseleccionadas por similitud semántica:
${reviewList}

Instrucciones:
- Escribe un resumen de 2-3 oraciones respondiendo directamente a lo que el usuario busca.
- ${budgetHint}
- Si hay reseñas [muy respaldada por la comunidad] o [respaldada por la comunidad], dales más peso en tu resumen.
- Si hay reseñas [cuestionada por la comunidad], mencionalo con cautela.
- Tono amigable y directo. Responde SOLO con el texto del resumen, sin formato, sin listas, sin markdown.`;

  const result = await chatModel.generateContent(prompt);
  return result.response.text().trim();
}
