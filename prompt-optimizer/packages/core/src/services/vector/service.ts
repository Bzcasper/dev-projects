/**
 * Vector Search Service Implementation
 * Provides semantic search capabilities using ChromaDB with secure cloud integration
 *
 * @format
 */

import { Collection, IncludeEnum } from "chromadb";
import { chromaClient } from "../../dbClient";
import type {
  IVectorSearchService,
  VectorSearchConfig,
  VectorSearchDocument,
  SearchResult,
  VectorSearchQuery,
} from "./types";
import {
  ChromaConnectionError,
  EmbeddingError,
  SearchError,
  DocumentError,
} from "./errors";
import { createCohereRerankingService } from "../cohere-reranking";

export class VectorSearchService implements IVectorSearchService {
  private collection: Collection | null = null;
  private config: VectorSearchConfig | null = null;
  private ready: boolean = false;
  private rerankingService: any = null;

  async initialize(config: VectorSearchConfig): Promise<void> {
    try {
      // Validate input configuration
      if (!config.collectionName || config.collectionName.trim() === "") {
        throw new ChromaConnectionError(
          "Collection name is required and cannot be empty"
        );
      }

      // Merge environment config with provided config
      this.config = {
        collectionName: config.collectionName,
        chromaUrl:
          config.chromaUrl || process.env.CHROMA_URL || "http://localhost:8000",
        embeddingFunction: config.embeddingFunction,
        persistDirectory: config.persistDirectory,
      };

      // Test connection using secured chromaClient
      try {
        await chromaClient.heartbeat();
      } catch (connError: any) {
        throw new ChromaConnectionError(
          `Cannot connect to ChromaDB server: ${connError.message}`,
          connError
        );
      }

      // Get or create collection
      try {
        this.collection = await chromaClient.getCollection({
          name: this.config.collectionName,
          embeddingFunction: undefined as any, // ChromaDB Cloud handles this
        });
        console.log(
          `🔄 Using existing collection: ${this.config.collectionName}`
        );
      } catch (error) {
        // Collection doesn't exist, create it
        this.collection = await chromaClient.createCollection({
          name: this.config.collectionName,
          metadata: {
            "hnsw:space": "cosine",
            description: "Prompt Optimizer vector search collection",
            created_at: new Date().toISOString(),
          },
        });
        console.log(`✨ Created new collection: ${this.config.collectionName}`);
      }

      this.ready = true;
      console.log(
        `✅ Vector search service initialized successfully for collection: ${this.config.collectionName}`
      );
    } catch (error: any) {
      const errorMessage =
        `Failed to initialize vector search service. Please check:\n` +
        `1. ChromaDB server is running\n` +
        `2. CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE environment variables are set\n` +
        `3. Network connectivity to ChromaDB service\n` +
        `Original error: ${error.message}`;

      throw new ChromaConnectionError(errorMessage, error);
    }
  }

  async addDocuments(documents: VectorSearchDocument[]): Promise<void> {
    if (!this.ready || !this.collection) {
      throw new DocumentError("Vector search service not initialized");
    }

    try {
      const ids = documents.map((doc) => doc.id);
      const contents = documents.map((doc) => doc.content);
      const metadatas = documents.map((doc) => doc.metadata || {});

      // If documents have embeddings, use them; otherwise ChromaDB will generate them
      const embeddings = documents.some((doc) => doc.embedding)
        ? documents.map((doc) => doc.embedding || [])
        : undefined;

      await this.collection.add({
        ids,
        documents: contents,
        metadatas,
        embeddings,
      });
    } catch (error: any) {
      throw new DocumentError(
        `Failed to add documents: ${error.message}`,
        error
      );
    }
  }

  async search(query: VectorSearchQuery): Promise<SearchResult[]> {
    if (!this.ready || !this.collection) {
      throw new SearchError(
        "Vector search service not initialized. Call initialize() first."
      );
    }

    if (!query.text || query.text.trim() === "") {
      throw new SearchError("Search query text cannot be empty");
    }

    try {
      // Use environment variables for defaults
      const topK = query.topK || parseInt(process.env.VECTOR_TOP_K || "5");
      const defaultThreshold = parseFloat(
        process.env.VECTOR_DEFAULT_THRESHOLD || "0.0"
      );

      console.log(
        `🔍 Searching for: "${query.text}" (topK: ${topK}, threshold: ${
          query.threshold || defaultThreshold
        })`
      );

      const results = await this.collection.query({
        queryTexts: [query.text.trim()],
        nResults: topK,
        where: query.filter,
        include: [
          IncludeEnum.Documents,
          IncludeEnum.Metadatas,
          IncludeEnum.Distances,
        ],
      });

      // Transform ChromaDB results to our SearchResult format
      const searchResults: SearchResult[] = [];

      if (results.documents && results.documents[0]) {
        results.documents[0].forEach((document, index) => {
          if (document && document.trim() !== "") {
            const distance = results.distances?.[0]?.[index] || 0;
            const score = this.distanceToScore(distance);
            const threshold = query.threshold || defaultThreshold;

            // Apply threshold filter if specified (> 0 means we want to filter)
            if (threshold <= 0 || score >= threshold) {
              searchResults.push({
                id: results.ids?.[0]?.[index] || `result_${index}`,
                content: document.trim(),
                metadata: results.metadatas?.[0]?.[index] || {},
                score,
                distance,
              });
            }
          }
        });

        // Sort results by score (highest first)
        searchResults.sort((a, b) => b.score - a.score);

        console.log(
          `📊 Found ${searchResults.length} results (filtered from ${results.documents[0].length} raw results)`
        );
      } else {
        console.log(`📊 No valid results found for query: "${query.text}"`);
      }

      return searchResults;
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new SearchError(
        `Search failed for query "${query.text}": ${errorMessage}`,
        error as any
      );
    }
  }

  /**
   * Enhanced search method with optional Cohere reranking
   */
  async searchWithReranking(
    query: VectorSearchQuery,
    enableReranking: boolean = true
  ): Promise<SearchResult[]> {
    // Perform initial vector search
    const vectorResults = await this.search(query);

    if (!enableReranking || vectorResults.length === 0) {
      return vectorResults;
    }

    // Try to initialize reranking service if not already done
    if (!this.rerankingService) {
      try {
        this.rerankingService = createCohereRerankingService();
        await this.rerankingService.initialize();
        console.log(
          "✅ Cohere reranking service initialized for vector search"
        );
      } catch (error) {
        console.warn(
          "⚠️ Could not initialize Cohere reranking:",
          error instanceof Error ? error.message : String(error)
        );
        console.log("Returning vector search results without reranking");
        return vectorResults;
      }
    }

    // Apply reranking using Cohere
    try {
      const rerankedResults = await this.rerankingService.rerankSearchResults(
        vectorResults,
        query.text
      );

      console.log("✅ Successfully reranked vector search results");
      return rerankedResults;
    } catch (error) {
      console.warn(
        "⚠️ Cohere reranking failed, returning original vector results:",
        error instanceof Error ? error.message : String(error)
      );
      return vectorResults;
    }
  }

  async deleteDocuments(ids: string[]): Promise<void> {
    if (!this.ready || !this.collection) {
      throw new DocumentError("Vector search service not initialized");
    }

    try {
      await this.collection.delete({
        ids,
      });
    } catch (error: any) {
      throw new DocumentError(
        `Failed to delete documents: ${error.message}`,
        error
      );
    }
  }

  async getCollectionInfo(): Promise<{
    name: string;
    count: number;
    metadata?: Record<string, any>;
  }> {
    if (!this.ready || !this.collection) {
      throw new SearchError("Vector search service not initialized");
    }

    try {
      const count = await this.collection.count();
      return {
        name: this.config!.collectionName,
        count,
        metadata: {
          chromaUrl: this.config!.chromaUrl,
          ready: this.ready,
        },
      };
    } catch (error: any) {
      throw new SearchError(
        `Failed to get collection info: ${error.message}`,
        error
      );
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  /**
   * Convert ChromaDB cosine distance to similarity score (0-1)
   * ChromaDB returns cosine distance, we want similarity score
   */
  private distanceToScore(distance: number): number {
    // Cosine distance is 1 - cosine similarity
    // So cosine similarity = 1 - distance
    return Math.max(0, 1 - distance);
  }
}

/**
 * Factory function to create VectorSearchService instance
 */
export function createVectorSearchService(): VectorSearchService {
  return new VectorSearchService();
}
