/** @format */

// Abstract base agent class implementing common agent functionality

import {
  IAgent,
  AgentCapability,
  AgentDependency,
  AgentContext,
  AgentInput,
  AgentResult,
  AgentConfig,
  ValidationResult,
  AgentMetadata,
  SchemaDefinition,
  CapabilityType,
  AgentType,
} from "./types";
import {
  AgentError,
  AgentFailureError,
  TimeoutExceededError,
  ValidationError,
  AgentInitializationError,
  wrapError,
} from "./errors";

export abstract class BaseAgent implements IAgent {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly capabilities: AgentCapability[];
  public readonly dependencies: AgentDependency[];

  protected readonly config: AgentConfig;
  protected initialized: boolean = false;
  protected currentContext: AgentContext | null = null;

  constructor(
    id: string,
    name: string,
    description: string,
    capabilities: AgentCapability[],
    dependencies: AgentDependency[] = [],
    config: Partial<AgentConfig> = {}
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.capabilities = capabilities;
    this.dependencies = dependencies;

    // Merge with default config
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };
  }

  abstract get agentType(): AgentType;
  abstract getInputSchema(): SchemaDefinition;
  abstract getOutputSchema(): SchemaDefinition;
  abstract processImpl(
    ctx: AgentContext,
    input: AgentInput
  ): Promise<AgentResult>;

  async process(ctx: AgentContext, input: AgentInput): Promise<AgentResult> {
    if (!this.initialized) {
      throw new AgentInitializationError(
        `Agent ${this.id} is not initialized`,
        this.id,
        {
          pipelineId: ctx.pipelineId,
        }
      );
    }

    this.currentContext = ctx;

    const startTime = Date.now();

    try {
      // Pre-processing validation
      const inputValidation = await this.validateInput(input);
      if (!inputValidation.valid) {
        throw new ValidationError(
          `Input validation failed: ${inputValidation.errors.join(", ")}`,
          inputValidation.errors,
          { agentId: this.id, pipelineId: ctx.pipelineId }
        );
      }

      // Execute with timeout
      const result = await this.executeWithTimeout(() =>
        this.processImpl(ctx, input)
      );

      // Validate output
      const outputValidation = await this.validateOutput(result);
      if (!outputValidation.valid) {
        throw new ValidationError(
          `Output validation failed: ${outputValidation.errors.join(", ")}`,
          outputValidation.errors,
          { agentId: this.id, pipelineId: ctx.pipelineId }
        );
      }

      result.metadata = {
        ...result.metadata,
        agentId: this.id,
        processingTimeMs: Date.now() - startTime,
        agentVersion: this.getMetadata().version,
      };

      return result;
    } catch (error) {
      if (error instanceof AgentError) {
        throw error;
      }

      throw wrapError(
        error instanceof Error ? error : new Error(String(error)),
        { agentId: this.id, pipelineId: ctx.pipelineId }
      );
    } finally {
      this.currentContext = null;
    }
  }

  validateConfiguration(config: AgentConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.timeout <= 0) {
      errors.push("Timeout must be greater than 0");
    }

    if (config.retries < 0) {
      errors.push("Retries cannot be negative");
    }

    if (config.timeout > 300000) {
      // 5 minutes
      warnings.push("Timeout is very high (>= 5 minutes)");
    }

    if (this.capabilities.length === 0) {
      warnings.push("Agent has no defined capabilities");
    }

    // Validate capability-specific configuration
    for (const capability of this.capabilities) {
      const capabilityErrors = this.validateCapabilityConfig(capability);
      errors.push(...capabilityErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async initialize(ctx: AgentContext): Promise<void> {
    if (this.initialized) {
      return; // Already initialized
    }

    try {
      // Validate configuration
      const configValidation = this.validateConfiguration(this.config);
      if (!configValidation.valid) {
        throw new ValidationError(
          `Configuration validation failed: ${configValidation.errors.join(
            ", "
          )}`,
          configValidation.errors,
          { agentId: this.id, pipelineId: ctx.pipelineId }
        );
      }

      // Agent-specific initialization
      await this.initializeImpl(ctx);

      this.initialized = true;
    } catch (error) {
      if (error instanceof AgentError) {
        throw error;
      }

      throw wrapError(
        error instanceof Error ? error : new Error(String(error)),
        { agentId: this.id, pipelineId: ctx.pipelineId }
      );
    }
  }

  async cleanup(ctx: AgentContext): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      await this.cleanupImpl(ctx);
    } catch (error) {
      // Log but don't throw cleanup errors
      console.warn(`Cleanup failed for agent ${this.id}:`, error);
    } finally {
      this.initialized = false;
      this.currentContext = null;
    }
  }

  getMetadata(): AgentMetadata {
    return {
      version: "1.0.0",
      author: "Multi-Agent Pipeline System",
      created: new Date("2025-01-01"),
      updated: new Date(),
      category: this.agentType,
    };
  }

  // Protected methods that can be overridden by subclasses

  protected async initializeImpl(_ctx: AgentContext): Promise<void> {
    // Default implementation - no-op
  }

  protected async cleanupImpl(_ctx: AgentContext): Promise<void> {
    // Default implementation - no-op
  }

  protected async validateInput(input: AgentInput): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!input) {
      errors.push("Input is required");
      return { valid: false, errors, warnings: [] };
    }

    if (input.data === undefined) {
      errors.push("Input data is required");
    }

    return { valid: errors.length === 0, errors, warnings: [] };
  }

  protected async validateOutput(
    result: AgentResult
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!result) {
      errors.push("Result is required");
      return { valid: false, errors, warnings };
    }

    if (result.data === undefined) {
      errors.push("Result data is required");
    }

    if (!result.success && (!result.errors || result.errors.length === 0)) {
      warnings.push("Failed result should include error details");
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  protected validateCapabilityConfig(capability: AgentCapability): string[] {
    const errors: string[] = [];

    if (!capability.type) {
      errors.push("Capability type is required");
    }

    if (capability.priority < 0 || capability.priority > 100) {
      errors.push("Capability priority must be between 0 and 100");
    }

    return errors;
  }

  // Utility methods

  protected hasCapability(type: CapabilityType): boolean {
    return this.capabilities.some((cap) => cap.type === type);
  }

  protected getCapability(type: CapabilityType): AgentCapability | undefined {
    return this.capabilities.find((cap) => cap.type === type);
  }

  protected async executeWithTimeout<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new TimeoutExceededError(
            `Operation timed out after ${this.config.timeout}ms`,
            {
              agentId: this.id,
              pipelineId: this.currentContext?.pipelineId,
              timeoutMs: this.config.timeout,
            }
          )
        );
      }, this.config.timeout);
    });

    return Promise.race([operation(), timeoutPromise]);
  }

  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.retries,
    backoffMs: number = 1000
  ): Promise<T> {
    let lastError: Error = new Error("Unexpected error");

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries && (error as AgentError).retryable !== false) {
          await new Promise((resolve) =>
            setTimeout(resolve, backoffMs * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError;
  }

  protected createResult(
    success: boolean,
    data: any,
    errors: AgentError[] = []
  ): AgentResult {
    return {
      success,
      data,
      metadata: {},
      errors,
    };
  }

  protected createSuccessResult(
    data: any,
    metadata: Record<string, any> = {}
  ): AgentResult {
    return {
      success: true,
      data,
      metadata,
      errors: [],
    };
  }

  protected createFailureResult(
    errorMessage: string,
    data: any = null,
    metadata: Record<string, any> = {}
  ): AgentResult {
    const error = new AgentFailureError(errorMessage, this.id, {
      pipelineId: this.currentContext?.pipelineId,
      metadata,
    });

    return {
      success: false,
      data,
      metadata: {
        ...metadata,
        error: errorMessage,
      },
      errors: [error],
    };
  }

  protected getCurrentContext(): AgentContext {
    if (!this.currentContext) {
      throw new Error(`Agent ${this.id} has no active context`);
    }
    return this.currentContext;
  }

  protected getCurrentPipelineId(): string {
    return this.getCurrentContext().pipelineId;
  }
}
