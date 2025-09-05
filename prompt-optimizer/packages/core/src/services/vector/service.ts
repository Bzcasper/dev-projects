/**
 * Vector Search Service Implementation
 * Provides semantic search capabilities using ChromaDB Cloud with secure API integration
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

// import { QdrantClient } from "@qdrant/qdrant-js";
const { CloudClient, DefaultEmbeddingFunction } = require("chromadb");

export class VectorSearchService implements IVectorSearchService {
  private chromaClient: any = null;
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
        chromaUrl: config.chromaUrl || process.env.CHROMA_URL,
        embeddingFunction: config.embeddingFunction,
        persistDirectory: config.persistDirectory,
      };

      // Initialize ChromaDB Cloud client
      this.chromaClient = new CloudClient({
        apiKey: process.env.CHROMA_API_KEY || "",
        tenant: process.env.CHROMA_TENANT || "",
        database: process.env.CHROMA_DATABASE || "",
      });

      this.collectionName = this.config.collectionName;

      // Test connection and create collection if needed
      try {
        const collections = await this.chromaClient.listCollections();
        const collectionExists = collections.includes(this.collectionName!);

        if (!collectionExists) {
          // Create collection with default embedding function
          const embeddingFunction = new DefaultEmbeddingFunction();

          await this.chromaClient.createCollection({
            name: this.collectionName!,
            embeddingFunction,
            metadata: {
              description: "Prompt optimization templates and data",
              created_at: new Date().toISOString(),
            },
          });
          console.log(`✨ Created new collection: ${this.collectionName}`);
        } else {
          console.log(`🔄 Using existing collection: ${this.collectionName}`);
        }

        console.log("✅ ChromaDB Cloud connection established");
      } catch (connError: any) {
        throw new ChromaConnectionError(
          `Cannot connect to ChromaDB Cloud: ${connError.message}`,
          connError
        );
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
    if (!this.ready || !this.chromaClient) {
      throw new DocumentError("Vector search service not initialized");
    }

    try {
      const collection = await this.chromaClient.getCollection({
        name: this.collectionName!,
      });

      await collection.add({
        ids: documents.map((doc) => doc.id),
        documents: documents.map((doc) => doc.content),
        metadatas: documents.map((doc) => doc.metadata),
      });

      console.log(
        `✅ Added ${documents.length} documents to ChromaDB collection`
      );
    } catch (error: any) {
      throw new DocumentError(
        `Failed to add documents: ${error.message}`,
        error
      );
    }
  }

  async search(query: VectorSearchQuery): Promise<SearchResult[]> {
    if (!this.ready || !this.chromaClient) {
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
        `🔍 Searching with ChromaDB (topK: ${topK}, threshold: ${
          query.threshold || defaultThreshold
        })`
      );

      const collection = await this.chromaClient.getCollection({
        name: this.collectionName!,
      });

      const searchResults = await collection.query({
        queryTexts: [query.text],
        nResults: topK,
      });

      // Transform ChromaDB results to our SearchResult format
      const results: SearchResult[] = [];

      if (searchResults.documents && searchResults.documents.length > 0) {
        for (let i = 0; i < searchResults.documents[0].length; i++) {
          const document = searchResults.documents[0][i];
          const metadata = searchResults.metadatas?.[0]?.[i] || {};
          const id = searchResults.ids?.[0]?.[i] || `result-${i}`;
          const score = searchResults.distances?.[0]?.[i] || 0;
          const threshold = query.threshold || defaultThreshold;

          // Apply threshold filter if specified (> 0 means we want to filter)
          if (threshold <= 0 || score >= threshold) {
            results.push({
              id,
              content: document || "",
              metadata,
              score,
              distance: score, // ChromaDB distances are already normalized
            });
          }
        }

        // Sort results by score (highest first)
        results.sort((a, b) => b.score - a.score);

        console.log(`📊 Found ${results.length} results`);
      } else {
        console.log(`📊 No valid results found`);
      }

      return results;
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
    if (!this.ready || !this.chromaClient) {
      throw new DocumentError("Vector search service not initialized");
    }

    try {
      const collection = await this.chromaClient.getCollection({
        name: this.collectionName!,
      });

      await collection.delete({
        ids,
      });
    } catch (error: any) {
      throw new DocumentError(
        `Failed to delete documents: ${error.message}`,
        error
      );
    }
  }

  getDocumentCount(): Promise<number> {
    return this.getCollectionInfo().then((info) => info.count);
  }

  async getCollectionInfo(): Promise<{
    name: string;
    count: number;
    metadata?: Record<string, any>;
  }> {
    if (!this.ready || !this.chromaClient) {
      throw new SearchError("Vector search service not initialized");
    }

    try {
      const collection = await this.chromaClient.getCollection({
        name: this.collectionName!,
      });
      const count = await collection.count();

      return {
        name: this.config!.collectionName,
        count,
        metadata: {
          chromaUrl: this.config!.chromaUrl,
          ready: this.ready,
          collectionName: this.collectionName,
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
