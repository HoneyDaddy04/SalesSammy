import OpenAI from "openai";
import { config } from "../config/env.js";

const openai = new OpenAI({ apiKey: config.openaiApiKey });

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 512; // Smaller = faster + cheaper, still very accurate

/**
 * Generate an embedding vector for a text string.
 * Uses OpenAI text-embedding-3-small (1536 dims, reduced to 512).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000), // Model limit safety
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in a single batch call.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts.map(t => t.slice(0, 8000)),
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return response.data.map(d => d.embedding);
}

export { EMBEDDING_DIMENSIONS };
