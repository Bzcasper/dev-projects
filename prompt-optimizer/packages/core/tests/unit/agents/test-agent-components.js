/** @format */

// Simple test script to check basic agent component functionality
// This bypasses the compilation issues to test agent logic

console.log("=== Multi-Agent Pipeline Core Component Testing ===\n");

// Test 1: Basic agent instantiation
console.log("1. Testing Agent Instantiation...");

try {
  // Import types directly
  const {
    BaseAgent,
    AgentType,
    CapabilityType,
  } = require("../../../src/services/agents/base-agent.ts");
  console.log("✓ BaseAgent import successful");

  // Test basic agent creation
  const agentConfig = {
    timeout: 30000,
    retries: 3,
    modelConfig: {
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY || "your_openai_api_key",
      model: "gpt-3.5-turbo",
      temperature: 0.7,
    },
  };

  const mockCtx = {
    id: "test-context",
    pipelineId: "test-pipeline",
    data: new Map(),
    metadata: {
      owner: "test",
      tags: [],
      storage: "memory",
    },
    version: "1.0",
    created: new Date(),
    updated: new Date(),
  };

  // Mock agent creation
  const testAgent = new BaseAgent("test-agent", [], agentConfig);
  console.log("✓ Basic agent instantiation");
} catch (error) {
  console.log("✗ Agent instantiation failed:", error.message);
}

// Test 2: Context Manager
console.log("\n2. Testing Context Manager...");

try {
  const {
    ContextManager,
  } = require("../../../src/services/agents/context-manager.ts");
  const contextManager = new ContextManager();
  console.log("✓ ContextManager instantiation");
} catch (error) {
  console.log("✗ Context Manager failed:", error.message);
}

// Test 3: Pipeline Orchestrator
console.log("\n3. Testing Pipeline Orchestrator...");

try {
  const {
    PipelineOrchestrator,
  } = require("../../../src/services/agents/pipeline-orchestrator.ts");
  const orchestrator = new PipelineOrchestrator();
  console.log("✓ PipelineOrchestrator instantiation");
} catch (error) {
  console.log("✗ Pipeline Orchestrator failed:", error.message);
}

// Test 4: Message Bus
console.log("\n4. Testing Message Passing...");

try {
  const {
    AgentMessageBus,
  } = require("../../../src/services/agents/message-passing.ts");
  // Need mock agent registry
  const mockRegistry = {
    getAvailableAgents: async () => [],
  };
  const messageBus = new AgentMessageBus(mockRegistry);
  console.log("✓ AgentMessageBus instantiation");
} catch (error) {
  console.log("✗ Message Bus failed:", error.message);
}

console.log("\n=== Test Summary ===");
console.log(
  "Note: Tests bypass compilation issues to check basic instantiation"
);
console.log("Components may fail due to build requirements or dependencies");
