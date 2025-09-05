/** @format */

/**
 * ChromaDB Database Client Configuration
 *
 * This file sets up the ChromaDB Cloud connector with secure environment variable access.
 * Used for vector search and document storage operations.
 */

import { CloudClient } from "chromadb";

// Environment variables for ChromaDB configuration
const CHROMA_API_KEY = process.env.CHROMA_API_KEY;
const CHROMA_TENANT = process.env.CHROMA_TENANT;
const CHROMA_DATABASE = process.env.CHROMA_DATABASE;

// Validate required environment variables
if (!CHROMA_API_KEY) {
  throw new Error("CHROMA_API_KEY environment variable is required");
}

if (!CHROMA_TENANT) {
  throw new Error("CHROMA_TENANT environment variable is required");
}

if (!CHROMA_DATABASE) {
  throw new Error("CHROMA_DATABASE environment variable is required");
}

// Create ChromaDB Cloud Client
const chromaClient = new CloudClient({
  apiKey: CHROMA_API_KEY,
  tenant: CHROMA_TENANT,
  database: CHROMA_DATABASE,
});

// Export for use in other modules
export { chromaClient };
export default chromaClient;
