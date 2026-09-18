import { AppDatabase } from '../db/database.js';

export interface SearchResult {
  chunk_id: string;
  material_id: string;
  material_title: string;
  page_number: number;
  content: string;
  score: number;
}

export class VectorStore {
  /**
   * Generates a high-dimensional normalized term-frequency feature vector for semantic retrieval.
   */
  public static generateEmbedding(text: string): number[] {
    const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = cleanText.split(/\s+/).filter((t) => t.length > 2);
    
    // 128-dimensional deterministic hash embedding space
    const vectorDim = 128;
    const vector = new Array(vectorDim).fill(0);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      let hash = 0;
      for (let j = 0; j < token.length; j++) {
        hash = (hash << 5) - hash + token.charCodeAt(j);
        hash |= 0;
      }
      const index = Math.abs(hash) % vectorDim;
      vector[index] += 1.0;
    }

    // L2 Normalization for exact Cosine Similarity
    let norm = 0;
    for (let i = 0; i < vectorDim; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < vectorDim; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  /**
   * Calculates cosine similarity between two unit vectors: dot product.
   */
  public static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
    }
    return Math.max(0, Math.min(1, dotProduct));
  }

  /**
   * Semantic search scoped STRICTLY to the current project.
   */
  public static search(projectId: string, query: string, limit: number = 5): SearchResult[] {
    const queryVector = this.generateEmbedding(query);
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

    const rows = AppDatabase.query<{
      id: string;
      material_id: string;
      material_title: string;
      page_number: number;
      content: string;
      embedding_json: string;
    }>(
      `SELECT mc.id, mc.material_id, m.title as material_title, mc.page_number, mc.content, mc.embedding_json
       FROM material_chunks mc
       JOIN materials m ON mc.material_id = m.id
       WHERE mc.project_id = ? AND m.status = 'ready'`,
      [projectId]
    );

    if (!rows || rows.length === 0) {
      return [];
    }

    const scoredResults: SearchResult[] = rows.map((row) => {
      let vecScore = 0;
      if (row.embedding_json) {
        try {
          const chunkVector = JSON.parse(row.embedding_json);
          vecScore = this.cosineSimilarity(queryVector, chunkVector);
        } catch {
          vecScore = 0;
        }
      }

      // Hybrid boost for exact keyword matches
      const contentLower = row.content.toLowerCase();
      let keywordHits = 0;
      for (const term of queryTerms) {
        if (contentLower.includes(term)) {
          keywordHits++;
        }
      }
      const keywordScore = queryTerms.length > 0 ? (keywordHits / queryTerms.length) : 0;
      const combinedScore = (vecScore * 0.65) + (keywordScore * 0.35);

      return {
        chunk_id: row.id,
        material_id: row.material_id,
        material_title: row.material_title,
        page_number: row.page_number,
        content: row.content,
        score: combinedScore
      };
    });

    // Sort descending by score
    scoredResults.sort((a, b) => b.score - a.score);
    return scoredResults.slice(0, limit);
  }
}
