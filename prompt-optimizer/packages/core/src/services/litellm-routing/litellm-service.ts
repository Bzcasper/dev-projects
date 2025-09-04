/**
 * LiteLLM Service Adapter
 * Integrates Google Cloud LiteLLM microVM with existing LLM service
 * Uses zero-intrusion architecture with automatic fallback
 *
 * @format
 */

import type {
  ILLMService,
  Message,
  StreamHandlers,
  LLMResponse,
  ModelOption,
} from "../llm/types";
import type { ModelConfig } from "../model/types";
import type { AgentType } from "./types";
import { AgentType as AgentTypeEnum } from "./types";
import { ModelManager } from "../model/manager";
import { LLMService } from "../llm/service";
import { LiteLLMProvider, createLiteLLMProvider } from "./service";
import { shouldFallback } from "./errors";

export class LiteLLMService implements ILLMService {
  private readonly litellmProvider?: LiteLLMProvider;
  private readonly directService: ILLMService;
  private readonly isLiteLLMEnabled: boolean;

  constructor(modelManager: ModelManager) {
    this.directService = new LLMService(modelManager);
    this.isLiteLLMEnabled = this.isLiteLLMConfigured();

    if (this.isLiteLLMEnabled) {
      this.litellmProvider = createLiteLLMProvider(this.directService);
      console.log("🚀 LiteLLMService initialized with smart routing enabled");
    } else {
      console.log(
        "📝 LiteLLMService initialized with direct service only (LiteLLM disabled)",
      );
    }
  }

  private isLiteLLMConfigured(): boolean {
    const enabled = process.env.LITELLM_ENABLED === "true";
    const hasBaseUrl = !!process.env.LITELLM_BASE_URL;
    const hasApiKey = !!process.env.LITELLM_API_KEY;

    if (enabled && (!hasBaseUrl || !hasApiKey)) {
      console.warn(
        "⚠️ LiteLLM is enabled but missing configuration. Falling back to direct service.",
      );
      console.warn("   Required: LITELLM_BASE_URL, LITELLM_API_KEY");
      return false;
    }

    return enabled && hasBaseUrl && hasApiKey;
  }

  /**
   * Enhanced sendMessageStructured with agent-based routing
   */
  async sendMessageStructured(
    messages: Message[],
    provider: string,
    agentType?: AgentType,
  ): Promise<LLMResponse> {
    // Try LiteLLM with agent routing if available and healthy
    if (
      this.isLiteLLMEnabled &&
      agentType &&
      this.litellmProvider &&
      this.litellmProvider.getHealthStatus().healthy
    ) {
      try {
        console.log(`🎯 Routing ${agentType} agent request through LiteLLM`);
        const response = await this.litellmProvider.sendMessage(
          messages,
          agentType,
        );

        // Log cost optimization
        const route = (this.litellmProvider as any).getModelRoute(agentType);
        console.log(
          `💰 Cost optimization: ${agentType} → ${route.primary} (${route.costTier} tier)`,
        );

        return response;
      } catch (error: any) {
        console.warn(
          `LiteLLM routing failed for ${agentType}, falling back to direct service:`,
          error.message,
        );

        if (!shouldFallback(error)) {
          throw error;
        }
      }
    }

    // Fallback to direct service
    console.log(
      `📡 Using direct service for ${provider} ${agentType ? `(${agentType} fallback)` : ""}`,
    );
    return await this.directService.sendMessageStructured(messages, provider);
  }

  /**
   * Standard sendMessage - delegates to sendMessageStructured
   */
  async sendMessage(messages: Message[], provider: string): Promise<string> {
    const response = await this.sendMessageStructured(messages, provider);
    return response.content;
  }

  /**
   * Send message with agent-based routing (enhanced method)
   */
  async sendMessageWithAgent(
    messages: Message[],
    agentType: AgentType,
    fallbackProvider?: string,
  ): Promise<LLMResponse> {
    return await this.sendMessageStructured(
      messages,
      fallbackProvider || this.getDefaultProvider(agentType),
      agentType,
    );
  }

  /**
   * Stream messages with agent routing
   */
  async sendMessageStream(
    messages: Message[],
    provider: string,
    callbacks: StreamHandlers,
    agentType?: AgentType,
  ): Promise<void> {
    // Try LiteLLM streaming if enabled and agent type provided
    if (
      this.isLiteLLMEnabled &&
      agentType &&
      this.litellmProvider &&
      this.litellmProvider.getHealthStatus().healthy
    ) {
      try {
        console.log(`🎯 Streaming ${agentType} agent request through LiteLLM`);
        await this.litellmProvider.sendMessageStream(
          messages,
          agentType,
          callbacks,
        );
        return;
      } catch (error: any) {
        console.warn(
          `LiteLLM streaming failed for ${agentType}, falling back to direct service:`,
          error.message,
        );

        if (!shouldFallback(error)) {
          throw error;
        }
      }
    }

    // Fallback to direct service
    console.log(`📡 Streaming via direct service for ${provider}`);
    await this.directService.sendMessageStream(messages, provider, callbacks);
  }

  /**
   * Test connection - tests both LiteLLM and direct service
   */
  async testConnection(provider: string): Promise<void> {
    const results: { service: string; success: boolean; error?: string }[] = [];

    // Test LiteLLM if enabled
    if (this.isLiteLLMEnabled && this.litellmProvider) {
      try {
        const litellmHealthy = await this.litellmProvider.testConnection();
        results.push({ service: "LiteLLM", success: litellmHealthy });

        if (litellmHealthy) {
          console.log("✅ LiteLLM connection test passed");
        }
      } catch (error: any) {
        results.push({
          service: "LiteLLM",
          success: false,
          error: error.message,
        });
        console.warn("❌ LiteLLM connection test failed:", error.message);
      }
    }

    // Test direct service
    try {
      await this.directService.testConnection(provider);
      results.push({ service: `Direct (${provider})`, success: true });
      console.log(`✅ Direct service connection test passed for ${provider}`);
    } catch (error: any) {
      results.push({
        service: `Direct (${provider})`,
        success: false,
        error: error.message,
      });
      throw error; // Re-throw direct service errors
    }

    // Log connection test summary
    const summary = results
      .map(
        (r) =>
          `${r.service}: ${r.success ? "✅" : "❌"}${r.error ? ` (${r.error})` : ""}`,
      )
      .join(", ");
    console.log(`🔍 Connection test results: ${summary}`);
  }

  /**
   * Fetch model list - combines LiteLLM and direct service models
   */
  async fetchModelList(
    provider: string,
    customConfig?: Partial<ModelConfig>,
  ): Promise<ModelOption[]> {
    const models: ModelOption[] = [];

    // Get models from direct service first
    try {
      const directModels = await this.directService.fetchModelList(
        provider,
        customConfig,
      );
      models.push(...directModels);
    } catch (error) {
      console.warn(
        `Failed to fetch models from direct service (${provider}):`,
        error,
      );
    }

    // Add LiteLLM available models if enabled
    if (this.isLiteLLMEnabled && this.litellmProvider) {
      try {
        // Get models for different agent types
        const agentTypes: AgentType[] = [
          AgentTypeEnum.RESEARCHER,
          AgentTypeEnum.ANALYSIS,
          AgentTypeEnum.WRITING,
          AgentTypeEnum.EDITING,
          AgentTypeEnum.FORMATTING,
        ];
        const litellmModels = new Set<string>();

        for (const agentType of agentTypes) {
          const agentModels =
            await this.litellmProvider.getAvailableModels(agentType);
          agentModels.forEach((model) => litellmModels.add(model));
        }

        // Convert to ModelOption format
        const litellmOptions: ModelOption[] = Array.from(litellmModels).map(
          (model) => ({
            value: model,
            label: `${model} (LiteLLM - ${this.getModelTier(model)} tier)`,
          }),
        );

        models.push(...litellmOptions);
        console.log(
          `📊 Added ${litellmOptions.length} LiteLLM models to model list`,
        );
      } catch (error) {
        console.warn("Failed to fetch LiteLLM models:", error);
      }
    }

    return models;
  }

  /**
   * Get LiteLLM health status and metrics
   */
  getLiteLLMStatus(): {
    enabled: boolean;
    healthy: boolean;
    healthStatus?: any;
    circuitBreakerState?: any;
  } {
    if (!this.isLiteLLMEnabled) {
      return { enabled: false, healthy: false };
    }

    const healthStatus = this.litellmProvider?.getHealthStatus();
    const circuitBreakerState = (
      this.litellmProvider as any
    ).circuitBreaker?.getState();

    return {
      enabled: true,
      healthy: healthStatus?.healthy || false,
      healthStatus,
      circuitBreakerState,
    };
  }

  /**
   * Estimate cost for agent request
   */
  async estimateRequestCost(
    messages: Message[],
    agentType: AgentType,
  ): Promise<number> {
    if (!this.isLiteLLMEnabled) {
      return 0; // No cost estimation for direct service
    }

    try {
      return (
        (await this.litellmProvider?.estimateCost(messages, agentType)) || 0
      );
    } catch (error) {
      console.warn("Cost estimation failed:", error);
      return 0;
    }
  }

  private getDefaultProvider(agentType: AgentType): string {
    // Map agent types to default providers for fallback
    switch (agentType) {
      case "researcher":
      case "analysis":
        return "openai"; // Cheap models typically available via OpenAI
      case "writing":
      case "editing":
      case "formatting":
        return "anthropic"; // Premium models for quality writing
      default:
        return "openai";
    }
  }

  private getModelTier(model: string): "cheap" | "premium" {
    if (
      model.includes("3.5") ||
      model.includes("haiku") ||
      model.includes("flash")
    ) {
      return "cheap";
    }
    return "premium";
  }
}

/**
 * Create LiteLLM service instance
 */
export function createLiteLLMService(
  modelManager: ModelManager,
): LiteLLMService {
  return new LiteLLMService(modelManager);
}
