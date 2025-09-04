/**
 * LiteLLM Smart Routing Types
 * Integration with Google Cloud LiteLLM MicroVM for cost-optimized agent routing
 *
 * @format
 */

import type { Message, LLMResponse, StreamHandlers } from "../llm/types";

export enum AgentType {
  RESEARCHER = "researcher",
  ANALYSIS = "analysis",
  WRITING = "writing",
  EDITING = "editing",
  FORMATTING = "formatting",
}

export interface ModelRoute {
  /** Primary model for this agent type */
  primary: string;
  /** Fallback model if primary fails */
  fallback: string;
  /** Direct provider key for ultimate fallback */
  fallbackProvider: string;
  /** Cost tier for monitoring */
  costTier: "cheap" | "premium";
}

export interface AgentModelRoutes {
  [AgentType.RESEARCHER]: ModelRoute;
  [AgentType.ANALYSIS]: ModelRoute;
  [AgentType.WRITING]: ModelRoute;
  [AgentType.EDITING]: ModelRoute;
  [AgentType.FORMATTING]: ModelRoute;
}

export interface LiteLLMConfig {
  /** Google Cloud microVM base URL */
  baseURL: string;
  /** GCP service account key or API token */
  apiKey: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Number of retry attempts */
  retries: number;
  /** Agent to model routing configuration */
  routingTable: AgentModelRoutes;
  /** Fallback strategy */
  fallbackStrategy: FallbackStrategy;
  /** Health check interval in milliseconds */
  healthCheckInterval: number;
}

export enum FallbackStrategy {
  IMMEDIATE = "immediate",
  EXPONENTIAL_BACKOFF = "exponential_backoff",
  CIRCUIT_BREAKER = "circuit_breaker",
}

export interface LiteLLMRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  metadata?: {
    agent_type: AgentType;
    cost_tier: string;
    request_id: string;
  };
}

export interface LiteLLMResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  metadata?: {
    cost_estimate: number;
    provider: string;
    latency_ms: number;
  };
}

export interface HealthStatus {
  healthy: boolean;
  lastCheck: Date;
  consecutiveFailures: number;
  uptime: number;
  averageLatency: number;
  totalRequests: number;
  failedRequests: number;
}

export interface CircuitBreakerState {
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
  lastSuccessTime: number;
}

export interface ILiteLLMProvider {
  /**
   * Send message through LiteLLM with agent-based routing
   */
  sendMessage(messages: Message[], agentType: AgentType): Promise<LLMResponse>;

  /**
   * Send structured message with custom model override
   */
  sendMessageStructured(
    messages: Message[],
    model: string,
    agentType?: AgentType,
  ): Promise<LLMResponse>;

  /**
   * Stream message with agent-based routing
   */
  sendMessageStream(
    messages: Message[],
    agentType: AgentType,
    callbacks: StreamHandlers,
  ): Promise<void>;

  /**
   * Test connection to LiteLLM service
   */
  testConnection(): Promise<boolean>;

  /**
   * Get current health status
   */
  getHealthStatus(): HealthStatus;

  /**
   * Get available models for agent type
   */
  getAvailableModels(agentType: AgentType): Promise<string[]>;

  /**
   * Get cost estimate for request
   */
  estimateCost(messages: Message[], agentType: AgentType): Promise<number>;
}

export interface IHealthChecker {
  /**
   * Check if service is healthy
   */
  isHealthy(): boolean;

  /**
   * Perform health check
   */
  checkHealth(): Promise<boolean>;

  /**
   * Get health status
   */
  getStatus(): HealthStatus;

  /**
   * Reset health status
   */
  reset(): void;
}

export interface ICircuitBreaker {
  /**
   * Execute operation with circuit breaker protection
   */
  execute<T>(operation: () => Promise<T>): Promise<T>;

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState;

  /**
   * Reset circuit breaker
   */
  reset(): void;
}

// Default routing configuration for cost optimization
const DEFAULT_AGENT_MODEL_ROUTES: AgentModelRoutes = {
  [AgentType.RESEARCHER]: {
    primary: "gpt-3.5-turbo",
    fallback: "claude-3-haiku",
    fallbackProvider: "anthropic",
    costTier: "cheap",
  },
  [AgentType.ANALYSIS]: {
    primary: "gpt-3.5-turbo",
    fallback: "claude-3-haiku",
    fallbackProvider: "anthropic",
    costTier: "cheap",
  },
  [AgentType.WRITING]: {
    primary: "gpt-4",
    fallback: "claude-3-5-sonnet",
    fallbackProvider: "anthropic",
    costTier: "premium",
  },
  [AgentType.EDITING]: {
    primary: "gpt-4",
    fallback: "claude-3-5-sonnet",
    fallbackProvider: "anthropic",
    costTier: "premium",
  },
  [AgentType.FORMATTING]: {
    primary: "claude-3-5-sonnet",
    fallback: "gpt-4",
    fallbackProvider: "openai",
    costTier: "premium",
  },
};

export { DEFAULT_AGENT_MODEL_ROUTES };
