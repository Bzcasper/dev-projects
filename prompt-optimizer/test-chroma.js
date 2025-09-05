#!/usr/bin/env node
/**
 * ChromaDB Test and Initialization Script
 * Tests ChromaDB connectivity and initializes with sample data
 *
 * @format
 */

require("dotenv").config({ path: "./.env" });

async function testChromaDB() {
  try {
    console.log("🔍 Testing ChromaDB Cloud connection...");
    console.log("🏠 Tenant:", process.env.CHROMA_TENANT);
    console.log("📃 Database:", process.env.CHROMA_DATABASE);

    const { CloudClient } = require("chromadb");

    const client = new CloudClient({
      apiKey: process.env.CHROMA_API_KEY,
      tenant: process.env.CHROMA_TENANT,
      database: process.env.CHROMA_DATABASE,
    });

    // Test connection by listing collections
    const collections = await client.listCollections();
    console.log("✅ ChromaDB connected successfully!");
    console.log("📊 Current collections:", collections.length);

    // If no collections exist, create one with sample data
    if (collections.length === 0) {
      console.log("📝 No collections found. Creating sample collection...");

      const collection = await client.createCollection({
        name: "prompt_templates",
        metadata: {
          description: "Prompt optimization templates",
          created_at: new Date().toISOString(),
        },
      });

      console.log("✨ Created collection: prompt_templates");

      // Add some sample data
      const sampleDocuments = [
        {
          id: "template-1",
          document:
            "You are a helpful AI assistant that provides clear and concise responses to user queries.",
          metadatas: { type: "system_prompt", category: "general" },
        },
        {
          id: "template-2",
          document:
            "Analyze the following text and provide key insights and main themes.",
          metadatas: { type: "analysis_prompt", category: "academic" },
        },
        {
          id: "template-3",
          document:
            "Write a creative story with the given characters and setting.",
          metadatas: { type: "creative_prompt", category: "writing" },
        },
      ];

      await collection.add({
        ids: sampleDocuments.map((doc) => doc.id),
        documents: sampleDocuments.map((doc) => doc.document),
        metadatas: sampleDocuments.map((doc) => doc.metadatas),
      });

      console.log("📤 Added sample data to collection");
    }

    // Test querying
    if (collections.length > 0) {
      const collectionName = collections[0];
      console.log(`📝 Found existing collection: ${collectionName}`);

      const collection = await client.getCollection({
        name: collectionName,
      });

      const count = await collection.count();
      console.log(
        `📊 Collection '${collections[0].name}' has ${count} documents`
      );

      if (count > 0) {
        const results = await collection.query({
          queryTexts: ["AI assistant prompt"],
          nResults: 2,
        });
        console.log("🔍 Sample query executed successfully");
        console.log(
          "📈 Results:",
          results.documents.length > 0 ? "Found matches" : "No matches"
        );
      }
    }

    console.log("\n🎉 ChromaDB test completed successfully!");
    console.log("💡 Your ChromaDB instance is now ready for use.");

    return true;
  } catch (error) {
    console.error("❌ ChromaDB error:", error.message);
    console.log("\n🚨 Possible issues:");
    console.log("1. Check your CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE");
    console.log("2. Verify the ChromaDB Cloud instance is active");
    console.log("3. Ensure network connectivity to ChromaDB Cloud");
    return false;
  }
}

// Test ChromaDB Cloud heartbeat
async function testCloudHeartbeat() {
  console.log("\n🔗 Testing ChromaDB Cloud connectivity...");

  try {
    // Try a simple heartbeat check to ChromaDB Cloud API
    const response = await fetch("https://api.trychroma.com/api/v1/heartbeat");

    if (response.ok) {
      console.log("✅ ChromaDB Cloud service is accessible");
      return true;
    } else {
      console.log("⚠️ ChromaDB Cloud heartbeat failed:", response.status);
      return false;
    }
  } catch (error) {
    console.log("⚠️ ChromaDB Cloud connectivity error:", error.message);
    return false;
  }
}

// Run tests
async function main() {
  console.log("🧪 Starting ChromaDB Cloud Testing...\n");

  const cloudOk = await testCloudHeartbeat();
  if (!cloudOk) {
    console.log(
      "⚠️ ChromaDB Cloud service check failed, but continuing with client test...\n"
    );
  }

  const chromaOk = await testChromaDB();

  if (chromaOk) {
    console.log("\n✅ All tests passed! ChromaDB is working correctly.");
  } else {
    console.log("\n❌ Some tests failed. Please check your configuration.");
  }
}

main().catch(console.error);
