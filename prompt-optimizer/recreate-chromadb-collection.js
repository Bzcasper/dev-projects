#!/usr/bin/env node
/**
 * Recreate ChromaDB Cloud Collection with Embeddings
 *
 * @format
 */

require("dotenv").config({ path: "./.env" });

async function recreateCollection() {
  try {
    console.log(
      "🔄 Recreating ChromaDB Cloud collection with proper embeddings..."
    );

    const { CloudClient, DefaultEmbeddingFunction } = require("chromadb");

    const client = new CloudClient({
      apiKey: process.env.CHROMA_API_KEY,
      tenant: process.env.CHROMA_TENANT,
      database: process.env.CHROMA_DATABASE,
    });

    const collectionName = "prompt_templates";

    // Delete existing collection if it exists
    console.log("🗑️  Attempting to delete existing collection...");
    try {
      await client.deleteCollection({ name: collectionName });
      console.log("✅ Deleted existing collection");
    } catch (error) {
      console.log(
        "⚠️  Collection didn't exist or couldn't be deleted:",
        error.message
      );
    }

    // Create new collection with default embeddings
    console.log("🆕 Creating new collection with embedding function...");
    const embeddingFunction = new DefaultEmbeddingFunction();

    await client.createCollection({
      name: collectionName,
      embeddingFunction,
      metadata: {
        description: "Prompt optimization templates and data",
        created_at: new Date().toISOString(),
        embedding_config: "default",
      },
    });

    console.log("✅ Collection recreated successfully");

    // Test the collection by checking count
    const collection = await client.getCollection({ name: collectionName });
    const count = await collection.count();
    console.log(`📊 New collection has ${count} documents`);

    // Generate embeddings manually for ChromaDB Cloud
    console.log("🧠 Generating embeddings for test document...");
    const testText = "This is a test document for ChromaDB Cloud verification";
    const embeddings = await embeddingFunction.generate([testText]);

    // Add test data with pre-computed embeddings
    const testDocuments = [
      {
        id: "test-1",
        embeddings: embeddings[0], // Explicitly pass embeddings
        metadatas: { test: true, type: "verification" },
      },
    ];

    console.log("📤 Adding test document with embeddings...");
    await collection.add(testDocuments);
    console.log("✅ Test document added successfully");

    const newCount = await collection.count();
    console.log(`📊 Collection now has ${newCount} documents`);

    return true;
  } catch (error) {
    console.error("❌ Failed to recreate collection:", error.message);
    console.error("Full error:", error);
    return false;
  }
}

recreateCollection().catch(console.error);
