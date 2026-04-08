import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export async function generateEmbedding(text) {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

export async function semanticSearch(query, reviews) {
  const reviewList = reviews.map((r, i) =>
    `[${i + 1}] ${r.business_name} - ${r.product_name}: ${r.content} (${r.is_recommended ? 'recomendado' : 'no recomendado'})`
  ).join('\n');

  const prompt = `Eres un asistente de búsqueda de reseñas. El usuario busca: "${query}".

Aquí están las reseñas disponibles:
${reviewList}

Devuelve ÚNICAMENTE un array JSON con los índices (1-based) de las reseñas más relevantes para la búsqueda, ordenados por relevancia. Máximo 10 resultados. Ejemplo: [2, 5, 1]`;

  const result = await chatModel.generateContent(prompt);
  const text = result.response.text().trim();
  const match = text.match(/\[[\d,\s]+\]/);
  if (!match) return [];

  const indices = JSON.parse(match[0]);
  return indices.map(i => reviews[i - 1]).filter(Boolean);
}
