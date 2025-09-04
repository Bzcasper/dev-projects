/**
 * Electron Proxy for LiteLLM Service
 * Provides IPC bridge for Electron renderer process
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

interface LiteLLMElectronAPI {
  litellm?: {
    sendMessageStructured: (
      messages: Message[],
      provider: string,
      agentType?: AgentType,
    ) => Promise<LLMResponse>;
    sendMessage: (messages: Message[], provider: string) => Promise<string>;
    sendMessageWithAgent: (
      messages: Message[],
      agentType: AgentType,
      fallbackProvider?: string,
    ) => Promise<LLMResponse>;
    sendMessageStream: (
      messages: Message[],
      provider: string,
      agentType?: AgentType,
    ) => Promise<{ chunks: string[] }>; // Simplified for IPC
    testConnection: (provider: string) => Promise<void>;
    fetchModelList: (
      provider: string,
      customConfig?: Partial<ModelConfig>,
    ) => Promise<ModelOption[]>;
    getLiteLLMStatus: () => Promise<{
      enabled: boolean;
      healthy: boolean;
      healthStatus?: any;
      circuitBreakerState?: any;
    }>;
    estimateRequestCost: (
      messages: Message[],
      agentType: AgentType,
    ) => Promise<number>;
  };
}

export class ElectronLiteLLMProxy implements ILLMService {
  private electronAPI: NonNullable<LiteLLMElectronAPI["litellm"]>;

  constructor() {
    const electronAPI = (window as any).electronAPI as LiteLLMElectronAPI;
    if (!electronAPI?.litellm) {
      throw new Error(
        "Electron LiteLLM API not available. Make sure you are running in Electron environment with LiteLLM support.",
      );
    }
    this.electronAPI = electronAPI.litellm;
  }

  async sendMessage(messages: Message[], provider: string): Promise<string> {
    return await this.electronAPI.sendMessage(messages, provider);
  }

  async sendMessageStructured(
    messages: Message[],
    provider: string,
    agentType?: AgentType,
  ): Promise<LLMResponse> {
    return await this.electronAPI.sendMessageStructured(
      messages,
      provider,
      agentType,
    );
  }

  /**
   * Enhanced method for agent-based routing
   */
  async sendMessageWithAgent(
    messages: Message[],
    agentType: AgentType,
    fallbackProvider?: string,
  ): Promise<LLMResponse> {
    return await this.electronAPI.sendMessageWithAgent(
      messages,
      agentType,
      fallbackProvider,
    );
  }

  async sendMessageStream(
    messages: Message[],
    provider: string,
    callbacks: StreamHandlers,
    agentType?: AgentType,
  ): Promise<void> {
    // IPC doesn't support real streaming, so we get chunks and simulate it
    const result = await this.electronAPI.sendMessageStream(
      messages,
      provider,
      agentType,
    );

    // Simulate streaming by delivering chunks with delays
    for (const chunk of result.chunks) {
      callbacks.onToken(chunk);
      // Small delay to simulate streaming
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    callbacks.onComplete();
  }

  async testConnection(provider: string): Promise<void> {
    return await this.electronAPI.testConnection(provider);
  }

  async fetchModelList(
    provider: string,
    customConfig?: Partial<ModelConfig>,
  ): Promise<ModelOption[]> {
    return await this.electronAPI.fetchModelList(provider, customConfig);
  }

  /**
   * Get LiteLLM service status and health metrics
   */
  async getLiteLLMStatus() {
    return await this.electronAPI.getLiteLLMStatus();
  }

  /**
   * Estimate cost for agent request
   */
  async estimateRequestCost(
    messages: Message[],
    agentType: AgentType,
  ): Promise<number> {
    return await this.electronAPI.estimateRequestCost(messages, agentType);
  }
}
