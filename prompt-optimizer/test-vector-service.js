#!/usr/bin/env node
/**
 * Vector Service Test Script
 * Tests the VectorSearchService with ChromaDB Cloud
 *
 * @format
 */

require("dotenv").config({ path: "./.env" });

async function testVectorService() {
  try {
    console.log("🧪 Testing VectorSearchService with ChromaDB Cloud...");

    const {
      VectorSearchService,
    } = require("./packages/core/src/services/vector/service");
    const {
      ChromaConnectionError,
    } = require("./packages/core/src/services/vector/errors");

    // Initialize the service
    const config = {
      collectionName: "prompt_templates",
      embeddingModel: "text-embedding-3-small",
      maxRetries: 3,
      timeout: 30000,
    };

    const vectorService = new VectorSearchService();

    console.log("🔧 Initializing vector service...");
    await vectorService.initialize(config);
    console.log("✅ Vector service initialized");

    // Add some test data
    const testDocuments = [
      {
        id: "test-prompt-1",
        content:
          "You are a creative writing assistant that helps users craft compelling stories and narratives.",
        metadata: {
          type: "system_prompt",
          category: "creative_writing",
          author: "assistant",
          created_at: new Date().toISOString(),
        },
      },
      {
        id: "test-prompt-2",
        content:
          "Provide detailed analysis and insights for the given text, including main themes, key arguments, and critical evaluation.",
        metadata: {
          type: "analysis_prompt",
          category: "academic",
          author: "assistant",
          created_at: new Date().toISOString(),
        },
      },
      {
        id: "test-prompt-3",
        content:
          "You are an expert code reviewer. Provide constructive feedback on code quality, best practices, and potential improvements.",
        metadata: {
          type: "coding_prompt",
          category: "programming",
          author: "assistant",
          created_at: new Date().toISOString(),
        },
      },
    ];

    console.log("📤 Adding test documents...");
    await vectorService.addDocuments(testDocuments);
    console.log("✅ Test documents added successfully");

    // Test search
    console.log("🔍 Testing search functionality...");
    const searchResults = await vectorService.search({
      query: "creative writing story",
      limit: 2,
      score_threshold: 0.1,
    });

    console.log(`📊 Search results: ${searchResults.length} matches found`);
    if (searchResults.length > 0) {
      console.log(
        "🎯 Top result:",
        searchResults[0].content.substring(0, 100) + "..."
      );
      console.log("📈 Score:", searchResults[0].score);
    }

    // Test document count
    const count = await vectorService.getDocumentCount();
    console.log(`📊 Total documents in collection: ${count}`);

    console.log("\n🎉 Vector service test completed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Vector service error:", error.message);
    if (error instanceof ChromaConnectionError) {
      console.log("\n🚨 ChromaDB Connection Issues:");
      console.log(
        "1. Verify CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE in .env"
      );
      console.log("2. Check ChromaDB Cloud instance is active");
      console.log("3. Ensure network connectivity");
    }
    return false;
  }
}

testVectorService().catch(console.error);
