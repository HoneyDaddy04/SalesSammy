/**
 * Document chunking service.
 * Splits text into overlapping chunks for embedding and retrieval.
 */

const DEFAULT_CHUNK_SIZE = 500;    // ~500 tokens ≈ 2000 chars
const DEFAULT_CHUNK_OVERLAP = 100; // ~100 tokens ≈ 400 chars
const CHARS_PER_TOKEN = 4;        // Rough estimate

export interface Chunk {
  content: string;
  index: number;
}

/**
 * Split text into overlapping chunks by token estimate.
 * Tries to break at sentence boundaries when possible.
 */
export function chunkText(
  text: string,
  chunkSizeTokens: number = DEFAULT_CHUNK_SIZE,
  overlapTokens: number = DEFAULT_CHUNK_OVERLAP,
): Chunk[] {
  const chunkSize = chunkSizeTokens * CHARS_PER_TOKEN;
  const overlap = overlapTokens * CHARS_PER_TOKEN;

  if (text.length <= chunkSize) {
    return [{ content: text.trim(), index: 0 }];
  }

  const chunks: Chunk[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    // Try to break at a sentence boundary (. ! ? \n) within last 20% of chunk
    if (end < text.length) {
      const searchStart = Math.floor(end - chunkSize * 0.2);
      const slice = text.slice(searchStart, end);
      const lastBreak = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf(".\n"),
        slice.lastIndexOf("! "),
        slice.lastIndexOf("? "),
        slice.lastIndexOf("\n\n"),
      );
      if (lastBreak > 0) {
        end = searchStart + lastBreak + 1;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push({ content: chunk, index });
      index++;
    }

    start = end - overlap;
    if (start >= text.length) break;
    // Prevent infinite loop
    if (end === text.length) break;
  }

  return chunks;
}
