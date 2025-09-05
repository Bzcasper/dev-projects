/** @format */

// Test script for Qdrant vector search integration
const VectorSearchService = require("./packages/core/src/services/vector/service.ts");

async function testQdrantIntegration() {
  console.log("🧪 Testing Qdrant Vector Search Integration...\n");

  try {
    const service = new VectorSearchService();

    // Initialize with Qdrant
    await service.initialize({
      collectionName: "test-collection",
      chromaUrl: process.env.QDRANT_URL,
    });

    console.log("✅ Qdrant service initialized successfully");
    console.log(
      "📊 Collection Info:",
      JSON.stringify(await service.getCollectionInfo(), null, 2)
    );
    console.log("✅ Basic Qdrant integration test completed");
  } catch (error) {
    console.error("❌ Qdrant integration test failed:", error.message);
  }
}

if (require.main === module) {
  testQdrantIntegration();
}

module.exports = { testQdrantIntegration };
