// SDK oficial de Google para usar los modelos de IA Gemini
import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializa el cliente de Gemini con la API key desde las variables de entorno
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Modelo especializado en generar embeddings (vectores numéricos que representan texto)
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
// Modelo de chat para generar respuestas en lenguaje natural (resúmenes de búsqueda)
const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
  const reviewList = reviews.map((r, i) =>
    `[${i + 1}] ${r.business_name} - ${r.product_name} ($${Number(r.product_price).toLocaleString('es-CO')} COP): ${r.content} (${r.is_recommended ? 'recomendado' : 'no recomendado'})`
  ).join('\n');

  // Detecta si la consulta menciona un monto de dinero (presupuesto del usuario)
  // Ejemplo: "pizza menos de 20 mil", "hamburguesa 15000 cop"
  const budgetMatch = query.match(/(\d[\d.,]*)(\s*(mil|pesos|cop))?/i);
  // Si se detectó un presupuesto, agrega una instrucción extra al prompt para manejarlo
  const budgetHint = budgetMatch ? `El usuario mencionó un presupuesto o filtro de precio en su búsqueda.` : '';

  // Construye el prompt con contexto, reseñas y reglas de comportamiento para la IA
  const prompt = `Eres un asistente de búsqueda de reseñas de comercios en Bogotá. El usuario busca: "${query}". ${budgetHint}

Estas reseñas ya fueron preseleccionadas por similitud semántica:
${reviewList}

Escribe un summary de 2-3 oraciones para el usuario. Si la búsqueda menciona un precio máximo y los resultados lo superan, primero reconoce que no hay opciones dentro de ese presupuesto y luego presenta estas como las alternativas más cercanas disponibles, con tono amigable.

Responde ÚNICAMENTE con un JSON válido (sin markdown):
{
  "summary": "resumen útil y honesto para el usuario"
}`;

  // Envía el prompt al modelo de chat y obtiene la respuesta en texto
  const result = await chatModel.generateContent(prompt);
  const text = result.response.text().trim();

  // Extrae el bloque JSON de la respuesta (el modelo puede incluir texto extra)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  // Si no se encontró JSON válido en la respuesta, retorna cadena vacía
  if (!jsonMatch) return '';

  // Parsea el JSON y retorna solo el campo summary
  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.summary || '';
}
