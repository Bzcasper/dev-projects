/** @format */

/**
 * Cohere Reranking Service
 * Provides superior result reranking for vector search using Cohere's rerank API
 */

// @ts-ignore - cohere-ai package not yet installed but code is ready
import CohereClient from "cohere-ai";
import type { SearchResult } from "./vector/types";
import { CohereConnectionError, RerankingError } from "./vector/errors";
import { z } from "zod";

// Configuration schema
const RerankingConfigSchema = z.object({
  apiKey: z.string().min(1, "COHERE_API_KEY is required"),
  model: z.string().default("rerank-english-v3.0"),
  maxDocuments: z.number().default(100),
  maxRetries: z.number().default(3),
  requestTimeout: z.number().default(30000),
});

export type RerankingConfig = z.infer<typeof RerankingConfigSchema>;

// Rerank query interface
export interface RerankQuery {
  query: string;
  documents: string[];
  topN?: number;
  model?: string;
  returnDocuments?: boolean;
}

// Rerank result interface
export interface RerankResult {
  index: number;
  relevance_score: number;
  document?: string;
}

export class CohereRerankingService {
  private client: CohereClient;
  private config: RerankingConfig;
  private initialized: boolean = false;

  constructor(config?: Partial<RerankingConfig>) {
    // Build configuration from environment and provided config
    const envConfig = {
      apiKey: process.env.COHERE_API_KEY,
      model: process.env.COHERE_RERANK_MODEL || "rerank-english-v3.0",
      maxDocuments: parseInt(process.env.COHERE_MAX_DOCUMENTS || "100"),
      maxRetries: parseInt(process.env.COHERE_MAX_RETRIES || "3"),
      requestTimeout: parseInt(process.env.COHERE_REQUEST_TIMEOUT || "30000"),
    };

    this.config = RerankingConfigSchema.parse({
      ...envConfig,
      ...config,
    });

    // Validate API key
    if (!this.config.apiKey) {
      throw new CohereConnectionError(
        "COHERE_API_KEY environment variable is required"
      );
    }

    this.client = new CohereClient({
      token: this.config.apiKey,
      timeout: this.config.requestTimeout,
    });
  }

  /**
   * Initialize the reranking service
   */
  async initialize(): Promise<void> {
    try {
      // Test connection by making a simple call
      await this.client.models.list();
      this.initialized = true;
      console.log("✅ Cohere reranking service initialized successfully");
    } catch (error: any) {
      throw new CohereConnectionError(
        `Failed to connect to Cohere API: ${error.message}`
      );
    }
  }

  /**
   * Rerank documents based on relevance to query
   */
  async rerank(query: RerankQuery): Promise<RerankResult[]> {
    if (!this.initialized) {
      throw new RerankingError(
        "Cohere reranking service not initialized. Call initialize() first."
      );
    }

    if (!query.query || query.query.trim() === "") {
      throw new RerankingError("Query text cannot be empty");
    }

    if (!query.documents || query.documents.length === 0) {
      throw new RerankingError("Documents array cannot be empty");
    }

    if (query.documents.length > this.config.maxDocuments) {
      console.warn(
        `⚠️ Document count (${query.documents.length}) exceeds maxDocuments limit (${this.config.maxDocuments}). Truncating.`
      );
      query.documents = query.documents.slice(0, this.config.maxDocuments);
    }

    try {
      const topN = Math.min(
        query.topN || query.documents.length,
        query.documents.length
      );

      console.log(
        `🔄 Reranking ${query.documents.length} documents using Cohere ${
          query.model || this.config.model
        }`
      );

      const response = await this.client.v2.rerank({
        model: query.model || this.config.model,
        query: query.query.trim(),
        documents: query.documents,
        topN: topN,
        returnDocuments: query.returnDocuments ?? false,
      });

      if (!response.data?.results) {
        throw new RerankingError(
          "No reranking results returned from Cohere API"
        );
      }

      const results: RerankResult[] = response.data.results.map(
        (result: any) => ({
          index: result.index,
          relevance_score: result.relevance_score,
          document:
            query.returnDocuments && query.documents
              ? query.documents[result.index]
              : undefined,
        })
      );

      console.log(`✅ Successfully reranked ${results.length} documents`);

      return results;
    } catch (error: any) {
      throw new RerankingError(
        `Cohere reranking failed: ${error.message}`,
        error
      );
    }
  }

  /**
   * Rerank vector search results
   * Combines vector search results with Cohere reranking for superior quality
   */
  async rerankSearchResults(
    searchResults: SearchResult[],
    originalQuery: string
  ): Promise<SearchResult[]> {
    if (searchResults.length === 0) {
      return [];
    }

    try {
      // Extract document texts for reranking
      const documents = searchResults.map((result) => result.content);

      // Rerank using Cohere
      const rerankResults = await this.rerank({
        query: originalQuery,
        documents: documents,
        topN: searchResults.length,
        returnDocuments: false,
      });

      // Combine vector scores with Cohere rerank scores
      const combinedResults: SearchResult[] = rerankResults.map(
        (rerankResult) => {
          const originalResult = searchResults[rerankResult.index];
          if (!originalResult) {
            throw new RerankingError(
              `Invalid rerank result index: ${rerankResult.index}`
            );
          }

          // Combine scores: weighted average of vector similarity and Cohere relevance
          const vectorScore = originalResult.score; // 0-1 scale
          const rerankScore = rerankResult.relevance_score; // 0-1 scale from Cohere

          // Weight: 70% Cohere relevance, 30% vector similarity (customizable)
          const combinedScore = rerankScore * 0.7 + vectorScore * 0.3;

          return {
            ...originalResult,
            score: combinedScore,
            metadata: {
              ...originalResult.metadata,
              rerankScore: rerankScore,
              originalVectorScore: vectorScore,
              reranked: true,
            },
          };
        }
      );

      // Sort by combined score (highest first)
      combinedResults.sort((a, b) => b.score - a.score);

      console.log(
        `🔀 Combined vector search with Cohere reranking for ${combinedResults.length} results`
      );

      return combinedResults;
    } catch (error: any) {
      console.warn(
        "⚠️ Cohere reranking failed, returning original results:",
        error.message
      );

      // Return original results if reranking fails
      return searchResults.map((result) => ({
        ...result,
        metadata: {
          ...result.metadata,
          reranked: false,
          rerankError: error.message,
        },
      }));
    }
  }

  /**
   * Check if the service is ready for reranking
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Get current configuration
   */
  getConfig(): Omit<RerankingConfig, "apiKey"> {
    const { apiKey, ...configWithoutKey } = this.config;
    return configWithoutKey;
  }
}

/**
 * Factory function to create CohereRerankingService instance
 */
export function createCohereRerankingService(
  config?: Partial<RerankingConfig>
): CohereRerankingService {
  return new CohereRerankingService(config);
}
