/**
 * Vector Search Service Implementation
 * Provides semantic search capabilities using Qdrant with secure API integration
 *
 * @format
 */

// import { Collection, IncludeEnum } from "chromadb";
// import { chromaClient } from "../../dbClient";
import type {
  IVectorSearchService,
  VectorSearchConfig,
  VectorSearchDocument,
  SearchResult,
  VectorSearchQuery,
} from "./types";
import { ChromaConnectionError, SearchError, DocumentError } from "./errors";
import { createCohereRerankingService } from "../cohere-reranking";

import { QdrantClient } from "@qdrant/qdrant-js";

export class VectorSearchService implements IVectorSearchService {
  private qdrantClient: any = null;
  private collectionName: string | null = null;
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
          config.chromaUrl ||
          process.env.QDRANT_URL ||
          "https://446b25d1-4d2f-49dc-8d0e-8a61ba1a89c2.us-east4-0.gcp.cloud.qdrant.io",
        embeddingFunction: config.embeddingFunction,
        persistDirectory: config.persistDirectory,
      };

      // Initialize Qdrant client
      this.qdrantClient = new QdrantClient({
        url: this.config.chromaUrl,
        apiKey:
          process.env.QDRANT_API_KEY ||
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.fj6UruocQt0SXhbwoGMu66Gg__qyiN8oq2rfyhiBs0g",
      });

      this.collectionName = this.config.collectionName;

      // Test connection
      try {
        const response = await this.qdrantClient.service.healthCheck();
        console.log("✅ Connected to Qdrant:", response.status);
      } catch (connError: any) {
        throw new ChromaConnectionError(
          `Cannot connect to Qdrant server: ${connError.message}`,
          connError
        );
      }

      // Check if collection exists, create if not
      try {
        await this.qdrantClient.collections.getCollection({
          collection_name: this.collectionName,
        });
        console.log(`🔄 Using existing collection: ${this.collectionName}`);
      } catch (error: any) {
        // Collection doesn't exist, create it
        await this.qdrantClient.collections.createCollection({
          collection_name: this.collectionName,
          vectors: {
            size: 1536, // OpenAI text-embedding-ada-002 dimension
            distance: "Cosine",
          },
        });
        console.log(`✨ Created new collection: ${this.collectionName}`);
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
    if (!this.ready || !this.qdrantClient) {
      throw new DocumentError("Vector search service not initialized");
    }

    try {
      // Prepare points for Qdrant
      const points = documents.map((doc) => ({
        id: doc.id,
        vector: doc.embedding || [], // Need embeddings for Qdrant
        payload: {
          content: doc.content,
          ...doc.metadata,
        },
      }));

      // Use upsert operation
      await this.qdrantClient.points.upsert({
        collection_name: this.collectionName!,
        points,
        wait: true,
      });

      console.log(
        `✅ Added ${documents.length} documents to Qdrant collection`
      );
    } catch (error: any) {
      throw new DocumentError(
        `Failed to add documents: ${error.message}`,
        error
      );
    }
  }

  async search(query: VectorSearchQuery): Promise<SearchResult[]> {
    if (!this.ready || !this.qdrantClient) {
      throw new SearchError(
        "Vector search service not initialized. Call initialize() first."
      );
    }

    // For now, require text and fail gracefully if no vector embedding
    if (!query.text || query.text.trim().length === 0) {
      throw new SearchError("Search query text cannot be empty");
    }

    try {
      // Use environment variables for defaults
      const topK = query.topK || parseInt(process.env.VECTOR_TOP_K || "5");
      const defaultThreshold = parseFloat(
        process.env.VECTOR_DEFAULT_THRESHOLD || "0.0"
      );

      console.log(
        `🔍 Searching with vector (topK: ${topK}, threshold: ${
          query.threshold || defaultThreshold
        })`
      );

      // For now, create a placeholder vector - in production this would use embeddings
      const placeholderVector = new Array(1536)
        .fill(0)
        .map(() => Math.random() - 0.5);

      const searchResponse = await this.qdrantClient.search(
        this.collectionName!,
        {
          vector: placeholderVector,
          limit: topK,
          with_payload: true,
          with_vectors: false,
        }
      );

      // Transform Qdrant results to our SearchResult format
      const searchResults: SearchResult[] = [];

      if (searchResponse.result && searchResponse.result.length > 0) {
        searchResponse.result.forEach((point: any) => {
          const score = point.score;
          const threshold = query.threshold || defaultThreshold;

          // Apply threshold filter if specified (> 0 means we want to filter)
          if (threshold <= 0 || score >= threshold) {
            searchResults.push({
              id: point.id,
              content: point.payload.content || "",
              metadata: point.payload || {},
              score,
              distance: 1 - score, // Convert cosine similarity back to distance
            });
          }
        });

        // Sort results by score (highest first)
        searchResults.sort((a, b) => b.score - a.score);

        console.log(`📊 Found ${searchResults.length} results`);
      } else {
        console.log(`📊 No valid results found`);
      }

      return searchResults;
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new SearchError(`Search failed: ${errorMessage}`, error as any);
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
    if (!this.ready || !this.qdrantClient) {
      throw new DocumentError("Vector search service not initialized");
    }

    try {
      await this.qdrantClient.points.delete({
        collection_name: this.collectionName!,
        points: ids.map((id) => ({ id })),
        wait: true,
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
    if (!this.ready || !this.qdrantClient) {
      throw new SearchError("Vector search service not initialized");
    }

    try {
      const collectionInfo = await this.qdrantClient.collections.getCollection({
        collection_name: this.collectionName!,
      });
      const count = collectionInfo.result?.indexed_vectors_count || 0;
      return {
        name: this.config!.collectionName,
        count,
        metadata: {
          qdrantUrl: this.config!.chromaUrl,
          ready: this.ready,
          collection: collectionInfo.result,
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
}

/**
 * Factory function to create VectorSearchService instance
 */
export function createVectorSearchService(): VectorSearchService {
  return new VectorSearchService();
}
