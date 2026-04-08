import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export async function generateEmbedding(text) {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text }], role: 'user' },
    taskType: 'RETRIEVAL_DOCUMENT'
  });
  return result.embedding.values;
}

export async function generateQueryEmbedding(text) {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text }], role: 'user' },
    taskType: 'RETRIEVAL_QUERY'
  });
  return result.embedding.values;
}

export async function generateSummary(query, reviews) {
  if (reviews.length === 0) {
    return 'Nadie ha hecho una recomendación sobre lo que estás buscando todavía. ¡Sé el primero en reseñarlo!';
  }

  const reviewList = reviews.map((r, i) =>
    `[${i + 1}] ${r.business_name} - ${r.product_name} ($${Number(r.product_price).toLocaleString('es-CO')} COP): ${r.content} (${r.is_recommended ? 'recomendado' : 'no recomendado'})`
  ).join('\n');

  const budgetMatch = query.match(/(\d[\d.,]*)(\s*(mil|pesos|cop))?/i);
  const budgetHint = budgetMatch ? `El usuario mencionó un presupuesto o filtro de precio en su búsqueda.` : '';

  const prompt = `Eres un asistente de búsqueda de reseñas de comercios en Bogotá. El usuario busca: "${query}". ${budgetHint}

Estas reseñas ya fueron preseleccionadas por similitud semántica:
${reviewList}

Escribe un summary de 2-3 oraciones para el usuario. Si la búsqueda menciona un precio máximo y los resultados lo superan, primero reconoce que no hay opciones dentro de ese presupuesto y luego presenta estas como las alternativas más cercanas disponibles, con tono amigable.

Responde ÚNICAMENTE con un JSON válido (sin markdown):
{
  "summary": "resumen útil y honesto para el usuario"
}`;

  const result = await chatModel.generateContent(prompt);
  const text = result.response.text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return '';

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.summary || '';
}
