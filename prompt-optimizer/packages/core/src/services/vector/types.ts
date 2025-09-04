/**
 * Vector Search Service Types
 * Defines interfaces for semantic search and vector database operations
 */

export interface VectorSearchDocument {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface SearchResult {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  score: number;
  distance?: number;
}

export interface VectorSearchQuery {
  text: string;
  topK?: number;
  filter?: Record<string, any>;
  threshold?: number;
}

export interface VectorSearchConfig {
  collectionName: string;
  chromaUrl?: string;
  embeddingFunction?: string;
  persistDirectory?: string;
}

export interface IVectorSearchService {
  /**
   * Initialize the vector search service
   */
  initialize(config: VectorSearchConfig): Promise<void>;

  /**
   * Add documents to the vector database
   */
  addDocuments(documents: VectorSearchDocument[]): Promise<void>;

  /**
   * Search for similar documents
   */
  search(query: VectorSearchQuery): Promise<SearchResult[]>;

  /**
   * Delete documents by IDs
   */
  deleteDocuments(ids: string[]): Promise<void>;

  /**
   * Get collection statistics
   */
  getCollectionInfo(): Promise<{
    name: string;
    count: number;
    metadata?: Record<string, any>;
  }>;

  /**
   * Check if service is ready
   */
  isReady(): boolean;
}

export interface VectorSearchError extends Error {
  code: 'CHROMA_CONNECTION_ERROR' | 'EMBEDDING_ERROR' | 'SEARCH_ERROR' | 'DOCUMENT_ERROR';
  details?: any;
}