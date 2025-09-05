/**
 * Vector Search Service Errors
 * Centralized error handling for vector operations
 *
 * @format
 */

export class VectorSearchError extends Error {
  public readonly code: string;
  public readonly details?: any;

  constructor(
    message: string,
    code:
      | "CHROMA_CONNECTION_ERROR"
      | "COHERE_CONNECTION_ERROR"
      | "EMBEDDING_ERROR"
      | "SEARCH_ERROR"
      | "DOCUMENT_ERROR"
      | "RERANKING_ERROR"
      | "CONFIG_ERROR",
    details?: any,
  ) {
    super(message);
    this.name = "VectorSearchError";
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VectorSearchError);
    }
  }
}

export class ChromaConnectionError extends VectorSearchError {
  constructor(message: string, details?: any) {
    super(message, "CHROMA_CONNECTION_ERROR", details);
    this.name = "ChromaConnectionError";
  }
}

export class EmbeddingError extends VectorSearchError {
  constructor(message: string, details?: any) {
    super(message, "EMBEDDING_ERROR", details);
    this.name = "EmbeddingError";
  }
}

export class SearchError extends VectorSearchError {
  constructor(message: string, details?: any) {
    super(message, "SEARCH_ERROR", details);
    this.name = "SearchError";
  }
}

export class DocumentError extends VectorSearchError {
  constructor(message: string, details?: any) {
    super(message, "DOCUMENT_ERROR", details);
    this.name = "DocumentError";
  }
}

export class CohereConnectionError extends VectorSearchError {
  constructor(message: string, details?: any) {
    super(message, "COHERE_CONNECTION_ERROR", details);
    this.name = "CohereConnectionError";
  }
}

export class RerankingError extends VectorSearchError {
  constructor(message: string, details?: any) {
    super(message, "RERANKING_ERROR", details);
    this.name = "RerankingError";
  }
}
