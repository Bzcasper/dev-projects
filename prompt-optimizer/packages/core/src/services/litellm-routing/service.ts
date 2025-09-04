/**
 * LiteLLM Smart Routing Service
 * Integration with Google Cloud LiteLLM MicroVM for cost-optimized agent routing
 *
 * @format
 */

import type {
  ILiteLLMProvider,
  LiteLLMConfig,
  AgentType,
  ModelRoute,
  LiteLLMRequest,
  HealthStatus,
  AgentModelRoutes,
} from "./types";
import { DEFAULT_AGENT_MODEL_ROUTES } from "./types";
import type {
  Message,
  LLMResponse,
  StreamHandlers,
  ILLMService,
} from "../llm/types";
import {
  LiteLLMConnectionError,
  LiteLLMAuthenticationError,
  LiteLLMModelError,
  LiteLLMRoutingError,
  TimeoutError,
  QuotaExceededError,
  shouldFallback,
} from "./errors";
import { HealthChecker } from "./health-checker";
import { CircuitBreaker } from "./circuit-breaker";

export class LiteLLMProvider implements ILiteLLMProvider {
  private readonly config: LiteLLMConfig;
  private readonly fallbackService: ILLMService;
  private readonly healthChecker: HealthChecker;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly routingTable: Map<AgentType, ModelRoute>;

  constructor(config: LiteLLMConfig, fallbackService: ILLMService) {
    this.config = config;
    this.fallbackService = fallbackService;
    this.healthChecker = new HealthChecker(config);
    this.circuitBreaker = new CircuitBreaker(config);
    this.routingTable = this.initializeRoutingTable(config.routingTable);
  }

  private initializeRoutingTable(
    routes: AgentModelRoutes,
  ): Map<AgentType, ModelRoute> {
    const table = new Map<AgentType, ModelRoute>();

    for (const [agentType, route] of Object.entries(routes)) {
      table.set(agentType as AgentType, route);
    }

    console.log(
      `✅ LiteLLM routing table initialized with ${table.size} agent routes`,
    );
    return table;
  }

  private getModelRoute(agentType: AgentType): ModelRoute {
    const route = this.routingTable.get(agentType);
    if (!route) {
      throw new LiteLLMRoutingError(
        `No routing configuration found for agent type: ${agentType}`,
        { agentType },
        agentType,
      );
    }
    return route;
  }

  async sendMessage(
    messages: Message[],
    agentType: AgentType,
  ): Promise<LLMResponse> {
    const route = this.getModelRoute(agentType);

    try {
      return await this.circuitBreaker.execute(() =>
        this.makeLiteLLMRequest(messages, route.primary, agentType),
      );
    } catch (error: any) {
      console.warn(
        `LiteLLM primary model ${route.primary} failed for ${agentType}:`,
        error.message,
      );

      if (shouldFallback(error)) {
        try {
          // Try fallback model through LiteLLM
          return await this.makeLiteLLMRequest(
            messages,
            route.fallback,
            agentType,
          );
        } catch (fallbackError: any) {
          console.warn(
            `LiteLLM fallback model ${route.fallback} also failed, using direct provider`,
          );

          // Ultimate fallback to direct service
          return await this.fallbackService.sendMessageStructured(
            messages,
            route.fallbackProvider,
          );
        }
      }

      throw error;
    }
  }

  async sendMessageStructured(
    messages: Message[],
    model: string,
    agentType?: AgentType,
  ): Promise<LLMResponse> {
    if (agentType) {
      // Use agent-based routing
      return await this.sendMessage(messages, agentType);
    }

    try {
      return await this.circuitBreaker.execute(() =>
        this.makeLiteLLMRequest(messages, model),
      );
    } catch (error: any) {
      if (shouldFallback(error)) {
        // Fallback to direct service with best-guess provider
        const provider = this.inferProvider(model);
        return await this.fallbackService.sendMessageStructured(
          messages,
          provider,
        );
      }
      throw error;
    }
  }

  async sendMessageStream(
    messages: Message[],
    agentType: AgentType,
    callbacks: StreamHandlers,
  ): Promise<void> {
    const route = this.getModelRoute(agentType);

    try {
      await this.circuitBreaker.execute(() =>
        this.makeLiteLLMStreamRequest(
          messages,
          route.primary,
          agentType,
          callbacks,
        ),
      );
    } catch (error: any) {
      console.warn(
        `LiteLLM streaming failed for ${agentType}, falling back to direct provider`,
      );

      if (shouldFallback(error)) {
        // Fallback to direct service streaming
        await this.fallbackService.sendMessageStream(
          messages,
          route.fallbackProvider,
          callbacks,
        );
      } else {
        throw error;
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeHttpRequest("/health", "GET", null, 5000);
      return response.status === "healthy";
    } catch (error) {
      console.warn("LiteLLM health check failed:", error);
      return false;
    }
  }

  getHealthStatus(): HealthStatus {
    return this.healthChecker.getStatus();
  }

  async getAvailableModels(agentType: AgentType): Promise<string[]> {
    try {
      const response = await this.makeHttpRequest("/models", "GET");
      const models = response.models || [];

      // Filter models based on agent cost tier
      const route = this.getModelRoute(agentType);
      if (route.costTier === "cheap") {
        return models.filter(
          (model: string) =>
            model.includes("3.5") ||
            model.includes("haiku") ||
            model.includes("flash"),
        );
      } else {
        return models.filter(
          (model: string) =>
            model.includes("gpt-4") ||
            model.includes("sonnet") ||
            model.includes("opus"),
        );
      }
    } catch (error) {
      console.warn("Failed to fetch available models:", error);
      const route = this.getModelRoute(agentType);
      return [route.primary, route.fallback];
    }
  }

  async estimateCost(
    messages: Message[],
    agentType: AgentType,
  ): Promise<number> {
    const route = this.getModelRoute(agentType);
    const tokenCount = this.estimateTokenCount(messages);

    // Rough cost estimation based on model tier
    const costPerToken = route.costTier === "cheap" ? 0.0000015 : 0.00003;
    return tokenCount * costPerToken;
  }

  private async makeLiteLLMRequest(
    messages: Message[],
    model: string,
    agentType?: AgentType,
  ): Promise<LLMResponse> {
    const requestId = this.generateRequestId();
    const requestBody: LiteLLMRequest = {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4000,
      metadata: agentType
        ? {
            agent_type: agentType,
            cost_tier: this.getModelRoute(agentType).costTier,
            request_id: requestId,
          }
        : undefined,
    };

    console.log(
      `🔄 LiteLLM request: ${model} for ${agentType || "direct"} (${requestId})`,
    );

    try {
      const response = await this.makeHttpRequest(
        "/chat/completions",
        "POST",
        requestBody,
      );

      this.healthChecker.recordSuccess(response.metadata?.latency_ms || 0);

      const llmResponse: LLMResponse = {
        content: response.choices[0]?.message?.content || "",
        reasoning: undefined, // Could be extracted from metadata if needed
        metadata: {
          model: response.model || model,
          tokens: response.usage?.total_tokens || 0,
          finishReason: response.choices[0]?.finish_reason || "stop",
        },
      };

      console.log(
        `✅ LiteLLM success: ${model} (${requestId}) - ${llmResponse.metadata?.tokens} tokens`,
      );
      return llmResponse;
    } catch (error: any) {
      this.healthChecker.recordFailure();
      throw this.handleHttpError(error, model, agentType);
    }
  }

  private async makeLiteLLMStreamRequest(
    messages: Message[],
    model: string,
    agentType: AgentType,
    callbacks: StreamHandlers,
  ): Promise<void> {
    // Note: Streaming implementation would require SSE handling
    // For now, fall back to non-streaming request and simulate streaming
    const response = await this.makeLiteLLMRequest(messages, model, agentType);

    // Simulate streaming by chunking the response
    const chunks = this.chunkResponse(response.content);
    for (const chunk of chunks) {
      callbacks.onToken(chunk);
      await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate streaming delay
    }

    callbacks.onComplete(response);
  }

  private async makeHttpRequest(
    endpoint: string,
    method: "GET" | "POST",
    body?: any,
    timeoutMs?: number,
  ): Promise<any> {
    const url = `${this.config.baseURL}${endpoint}`;
    const timeout = timeoutMs || this.config.timeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          "User-Agent": "prompt-optimizer-litellm/1.0.0",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw new TimeoutError(`Request timeout after ${timeout}ms`);
      }

      throw error;
    }
  }

  private handleHttpError(
    error: any,
    model: string,
    agentType?: string,
  ): Error {
    const message = error.message || "Unknown error";

    if (error.name === "TimeoutError") {
      return error;
    }

    if (message.includes("401") || message.includes("403")) {
      return new LiteLLMAuthenticationError(
        `Authentication failed for LiteLLM service: ${message}`,
        { model, agentType, originalError: error },
      );
    }

    if (message.includes("429")) {
      return new QuotaExceededError(
        `Rate limit or quota exceeded for model ${model}: ${message}`,
        { model, agentType, originalError: error },
        agentType,
      );
    }

    if (message.includes("404") || message.includes("model not found")) {
      return new LiteLLMModelError(
        `Model ${model} not available: ${message}`,
        { model, agentType, originalError: error },
        agentType,
      );
    }

    if (message.includes("connection") || message.includes("network")) {
      return new LiteLLMConnectionError(
        `Connection failed to LiteLLM service: ${message}`,
        { model, agentType, originalError: error },
      );
    }

    return new LiteLLMConnectionError(`LiteLLM request failed: ${message}`, {
      model,
      agentType,
      originalError: error,
    });
  }

  private inferProvider(model: string): string {
    if (model.includes("gpt")) return "openai";
    if (model.includes("claude")) return "anthropic";
    if (model.includes("gemini")) return "google";
    return "openai"; // Default fallback
  }

  private estimateTokenCount(messages: Message[]): number {
    // Rough estimation: ~4 characters per token
    return messages.reduce(
      (count, msg) => count + Math.ceil(msg.content.length / 4),
      0,
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private chunkResponse(content: string): string[] {
    const chunkSize = 10; // Words per chunk
    const words = content.split(" ");
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(" ") + " ");
    }

    return chunks;
  }
}

/**
 * Create LiteLLM provider instance
 */
export function createLiteLLMProvider(
  fallbackService: ILLMService,
  customConfig?: Partial<LiteLLMConfig>,
): LiteLLMProvider {
  const config: LiteLLMConfig = {
    baseURL: process.env.LITELLM_BASE_URL || "http://localhost:4000",
    apiKey: process.env.LITELLM_API_KEY || "",
    timeout: parseInt(process.env.LITELLM_TIMEOUT || "30000"),
    retries: parseInt(process.env.LITELLM_RETRIES || "3"),
    routingTable: DEFAULT_AGENT_MODEL_ROUTES,
    fallbackStrategy:
      (process.env.LITELLM_FALLBACK_STRATEGY as any) || "circuit_breaker",
    healthCheckInterval: parseInt(
      process.env.LITELLM_HEALTH_CHECK_INTERVAL || "60000",
    ),
    ...customConfig,
  };

  console.log(
    `🚀 LiteLLM provider initialized with endpoint: ${config.baseURL}`,
  );
  return new LiteLLMProvider(config, fallbackService);
}
