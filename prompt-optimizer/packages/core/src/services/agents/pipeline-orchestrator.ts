/** @format */

// Pipeline orchestrator implementation

import {
  IPipelineOrchestrator,
  PipelineConfig,
  Pipeline,
  PipelineResult,
  PipelineInput,
  PipelineStatus,
  PipelineState,
  AgentDefinition,
  AgentConnection,
  PipelineMode,
  HistoryQuery,
  AgentError,
  AgentRegistry,
  IContextManager,
  ContextMetadata,
  StorageType,
} from "./types";
import {
  AgentError as AgentErrorClass,
  AgentFailureError,
  TimeoutExceededError,
  InvalidPipelineConfigError,
  PipelineExecutionError,
  wrapError,
  isCriticalError,
  isRetryableError,
} from "./errors";

export class PipelineOrchestrator implements IPipelineOrchestrator {
  private activePipelines: Map<string, Pipeline> = new Map();
  private pipelineHistory: Map<string, PipelineResult> = new Map();
  private operationTimeout: number = 300000; // 5 minutes default

  constructor(
    private agentRegistry: AgentRegistry,
    private contextManager: IContextManager
  ) {}

  async createPipeline(config: PipelineConfig): Promise<Pipeline> {
    try {
      // Validate pipeline configuration
      const validation = await this.validatePipelineConfig(config);
      if (!validation.valid) {
        throw new InvalidPipelineConfigError(
          `Invalid pipeline config: ${validation.errors.join(", ")}`,
          validation.errors
        );
      }

      // Create context for the pipeline
      const context = await this.contextManager.createContext(config.id, {
        owner: "pipeline-orchestrator",
        tags: ["pipeline", config.mode],
        storage: StorageType.MEMORY,
      } as ContextMetadata);

      const pipeline: Pipeline = {
        id: config.id,
        config,
        status: {
          id: config.id,
          state: PipelineState.PENDING,
          progress: 0,
          errors: [],
          startTime: new Date(),
          updatedTime: new Date(),
        },
        context: {
          ...context,
          pipelineId: config.id,
        } as any, // We'll need to fix this type issue in the types.ts
      };

      return pipeline;
    } catch (error) {
      if (error instanceof AgentErrorClass) {
        throw error;
      }

      throw wrapError(
        error instanceof Error ? error : new Error(String(error)),
        { pipelineId: config.id }
      );
    }
  }

  async executePipeline(
    pipeline: Pipeline,
    input: PipelineInput
  ): Promise<PipelineResult> {
    const startTime = Date.now();

    try {
      // Mark pipeline as running
      this.activePipelines.set(pipeline.id, pipeline);
      pipeline.status.state = PipelineState.RUNNING;
      pipeline.status.updatedTime = new Date();

      // Set input data in context
      await this.contextManager.setData(pipeline.id, "pipelineInput", input, {
        type: "object",
        properties: {
          data: { type: "string" },
          metadata: { type: "object" },
        },
      });

      let result: PipelineResult;

      switch (pipeline.config.mode) {
        case PipelineMode.SEQUENTIAL:
          result = await this.executeSequential(pipeline, input);
          break;
        case PipelineMode.PARALLEL:
          result = await this.executeParallel(pipeline, input);
          break;
        case PipelineMode.HYBRID:
          result = await this.executeHybrid(pipeline, input);
          break;
        default:
          throw new AgentFailureError(
            `Unsupported pipeline mode: ${pipeline.config.mode}`,
            pipeline.id
          );
      }

      // Mark as completed
      pipeline.status.state = PipelineState.COMPLETED;
      pipeline.status.progress = 100;
      pipeline.status.updatedTime = new Date();

      // Clean up active pipeline
      this.activePipelines.delete(pipeline.id);

      // Store in history
      this.pipelineHistory.set(pipeline.id, result);

      return result;
    } catch (error) {
      const agentError =
        error instanceof AgentErrorClass
          ? error
          : wrapError(
              error instanceof Error ? error : new Error(String(error)),
              { pipelineId: pipeline.id }
            );

      pipeline.status.state = PipelineState.FAILED;
      pipeline.status.errors.push(agentError);
      pipeline.status.updatedTime = new Date();

      this.activePipelines.delete(pipeline.id);

      const result: PipelineResult = {
        pipelineId: pipeline.id,
        success: false,
        result: null,
        executionTime: Date.now() - startTime,
        errors: [agentError],
        agentResults: new Map(),
      };

      this.pipelineHistory.set(pipeline.id, result);

      throw new PipelineExecutionError(
        `Pipeline ${pipeline.id} failed: ${agentError.message}`,
        pipeline.id,
        [agentError]
      );
    }
  }

  async pausePipeline(pipelineId: string): Promise<boolean> {
    const pipeline = this.activePipelines.get(pipelineId);
    if (!pipeline) {
      return false;
    }

    if (pipeline.status.state !== PipelineState.RUNNING) {
      return false;
    }

    pipeline.status.state = PipelineState.PAUSED;
    pipeline.status.updatedTime = new Date();

    return true;
  }

  async resumePipeline(pipelineId: string): Promise<boolean> {
    const pipeline = this.activePipelines.get(pipelineId);
    if (!pipeline) {
      return false;
    }

    if (pipeline.status.state !== PipelineState.PAUSED) {
      return false;
    }

    pipeline.status.state = PipelineState.RUNNING;
    pipeline.status.updatedTime = new Date();

    return true;
  }

  async cancelPipeline(pipelineId: string): Promise<boolean> {
    const pipeline = this.activePipelines.get(pipelineId);
    if (!pipeline) {
      return false;
    }

    pipeline.status.state = PipelineState.CANCELLED;
    pipeline.status.updatedTime = new Date();

    // Clean up context
    await this.contextManager.deleteContext(pipelineId);

    this.activePipelines.delete(pipelineId);

    return true;
  }

  async getPipelineStatus(pipelineId: string): Promise<PipelineStatus> {
    const pipeline = this.activePipelines.get(pipelineId);
    if (pipeline) {
      return pipeline.status;
    }

    // Check completed pipelines
    const result = this.pipelineHistory.get(pipelineId);
    if (result) {
      return {
        id: pipelineId,
        state: result.success ? PipelineState.COMPLETED : PipelineState.FAILED,
        progress: 100,
        errors: result.errors,
        startTime: new Date(Date.now() - result.executionTime),
        updatedTime: new Date(Date.now() - result.executionTime),
      };
    }

    throw new AgentFailureError(`Pipeline ${pipelineId} not found`, pipelineId);
  }

  async getActivePipelines(): Promise<Pipeline[]> {
    return Array.from(this.activePipelines.values());
  }

  async getPipelineHistory(query: HistoryQuery): Promise<Pipeline[]> {
    let results = Array.from(this.pipelineHistory.values())
      .filter((result) => {
        if (query.dateRange) {
          const resultTime = new Date(Date.now() - result.executionTime);
          return (
            resultTime >= query.dateRange.from &&
            resultTime <= query.dateRange.to
          );
        }
        return true;
      })
      .filter((result) => {
        if (query.status) {
          const currentStatus = this.getPipelineStatus(result.pipelineId);
          return currentStatus.then((status) => status.state === query.status);
        }
        return true;
      })
      .slice(query.offset || 0, query.limit || 100);

    // Convert results to pipeline format
    return results.map((result) => ({
      id: result.pipelineId,
      config: {
        id: result.pipelineId,
        name: "",
        description: "",
        mode: PipelineMode.SEQUENTIAL,
        agents: [],
        connections: [],
        timeouts: { pipeline: 0, agent: 0, communication: 0 },
        retries: { maxAttempts: 0, backoffStrategy: null as any },
        resourceLimits: {
          maxMemory: 0,
          maxConcurrentAgents: 0,
          maxPipelines: 0,
        },
        callbacks: {},
        notifications: {
          enableProgressNotifications: false,
          enableErrorNotifications: false,
          enableCompletionNotifications: false,
        },
      },
      status: {
        id: result.pipelineId,
        state: result.success ? PipelineState.COMPLETED : PipelineState.FAILED,
        progress: 100,
        errors: result.errors,
        startTime: new Date(Date.now() - result.executionTime),
        updatedTime: new Date(Date.now() - result.executionTime),
      },
      context: {} as any,
    }));
  }

  private async validatePipelineConfig(config: PipelineConfig) {
    const errors: string[] = [];

    if (!config.id) {
      errors.push("Pipeline ID is required");
    }

    if (!config.agents || config.agents.length === 0) {
      errors.push("At least one agent must be defined");
    }

    // Validate agent references
    for (const agentDef of config.agents) {
      if (!agentDef.id) {
        errors.push("Agent definition must have ID");
      }
    }

    // Validate connections
    for (const conn of config.connections) {
      if (!conn.fromAgent || !conn.toAgent) {
        errors.push("Connection must specify fromAgent and toAgent");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Execution modes implementation - simplified versions for now
  private async executeSequential(
    pipeline: Pipeline,
    input: PipelineInput
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const agentResults = new Map<string, any>();
    const errors: AgentError[] = [];

    // Simple sequential execution - get agents by definition
    for (const agentDef of pipeline.config.agents) {
      try {
        // Get agent instance by searching through all available agents
        const availableAgents = await this.agentRegistry.getAvailableAgents();
        const agent = availableAgents.find((a) => a.id === agentDef.id);

        if (!agent) {
          throw new AgentFailureError(
            `Agent ${agentDef.id} not found`,
            pipeline.id
          );
        }

        // Initialize agent in context
        await agent.initialize(pipeline.context);

        // Execute agent
        const result = await agent.process(pipeline.context, {
          data: input.data,
          correlationId: pipeline.id,
        });

        agentResults.set(agentDef.id, result);

        // Update progress
        const progress =
          (agentResults.size / pipeline.config.agents.length) * 100;
        pipeline.status.progress = Math.round(progress);
        pipeline.status.updatedTime = new Date();

        if (
          !result.success &&
          result.errors &&
          isCriticalError(result.errors[0])
        ) {
          errors.push(...result.errors);
          break; // Stop execution for critical errors
        }
      } catch (error) {
        const agentError =
          error instanceof AgentErrorClass
            ? error
            : wrapError(
                error instanceof Error ? error : new Error(String(error)),
                { agentId: agentDef.id, pipelineId: pipeline.id }
              );

        errors.push(agentError);

        if (isCriticalError(agentError)) {
          break;
        }
      }
    }

    const success = errors.length === 0;
    const executionTime = Date.now() - startTime;

    return {
      pipelineId: pipeline.id,
      success,
      result: agentResults,
      executionTime,
      errors,
      agentResults,
    };
  }

  private async executeParallel(
    pipeline: Pipeline,
    input: PipelineInput
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const agentResults = new Map<string, any>();
    const errors: AgentError[] = [];

    // Execute all agents concurrently
    const agentPromises = pipeline.config.agents.map(async (agentDef) => {
      try {
        const availableAgents = await this.agentRegistry.getAvailableAgents();
        const agent = availableAgents.find((a) => a.id === agentDef.id);

        if (!agent) {
          throw new AgentFailureError(
            `Agent ${agentDef.id} not found`,
            pipeline.id
          );
        }

        await agent.initialize(pipeline.context);

        const result = await agent.process(pipeline.context, {
          data: input.data,
          correlationId: pipeline.id,
        });

        return { agentId: agentDef.id, result };
      } catch (error) {
        const agentError =
          error instanceof AgentErrorClass
            ? error
            : wrapError(
                error instanceof Error ? error : new Error(String(error)),
                { agentId: agentDef.id, pipelineId: pipeline.id }
              );

        return { agentId: agentDef.id, error: agentError };
      }
    });

    // Wait for all to complete
    const results = await Promise.allSettled(agentPromises);

    for (const result of results) {
      if (result.status === "fulfilled") {
        const { agentId, result: agentResult, error } = result.value;
        if (error) {
          errors.push(error!);
        } else if (agentResult) {
          agentResults.set(agentId, agentResult);
        }
      } else {
        // Promise rejected
        errors.push(wrapError(result.reason, { pipelineId: pipeline.id }));
      }
    }

    const success = errors.length === 0;
    const executionTime = Date.now() - startTime;

    return {
      pipelineId: pipeline.id,
      success,
      result: agentResults,
      executionTime,
      errors,
      agentResults,
    };
  }

  private async executeHybrid(
    pipeline: Pipeline,
    input: PipelineInput
  ): Promise<PipelineResult> {
    // For hybrid mode, simply use sequential execution for now
    // In a full implementation, this would combine sequential and parallel
    return this.executeSequential(pipeline, input);
  }

  // Configuration methods
  setOperationTimeout(timeout: number): void {
    this.operationTimeout = timeout;
  }

  getOperationTimeout(): number {
    return this.operationTimeout;
  }
}
