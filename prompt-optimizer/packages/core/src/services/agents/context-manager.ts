/** @format */

// Context Manager implementation for shared agent context management

import {
  IContextManager,
  Context,
  AgentContext,
  ContextMetadata,
  DataUpdater,
  OptimizationResult,
  StorageType,
} from "./types";
import { AgentNotFoundError } from "./errors";

export class ContextManager implements IContextManager {
  private contexts: Map<string, Context> = new Map();
  private cleanupTimer?: NodeJS.Timeout;
  private readonly cleanupInterval = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Start periodic cleanup
    this.startCleanupTimer();
  }

  async createContext(
    pipelineId: string,
    metadata: ContextMetadata
  ): Promise<Context> {
    const contextId = `${pipelineId}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const context: Context = {
      id: contextId,
      data: new Map(),
      metadata: {
        ...metadata,
        expiration:
          metadata.expiration || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24h
      },
      version: 1,
      created: new Date(),
      updated: new Date(),
    };

    this.contexts.set(contextId, context);

    return { ...context, data: new Map(context.data) };
  }

  async getContext(contextId: string): Promise<Context> {
    const context = this.contexts.get(contextId);
    if (!context) {
      return Promise.reject(
        new AgentNotFoundError(`Context ${contextId} not found`)
      );
    }

    // Check if context has expired
    if (
      context.metadata.expiration &&
      context.metadata.expiration < new Date()
    ) {
      await this.deleteContext(contextId);
      return Promise.reject(
        new AgentNotFoundError(`Context ${contextId} has expired`)
      );
    }

    return { ...context, data: new Map(context.data) };
  }

  async cloneContext(contextId: string): Promise<Context> {
    const originalContext = await this.getContext(contextId);

    const clonedContext: Context = {
      ...originalContext,
      id: `${contextId}-cloned-${Date.now()}`,
      data: new Map(originalContext.data),
      version: 1,
      created: new Date(),
      updated: new Date(),
    };

    this.contexts.set(clonedContext.id, clonedContext);

    return { ...clonedContext, data: new Map(clonedContext.data) };
  }

  async deleteContext(contextId: string): Promise<boolean> {
    return this.contexts.delete(contextId);
  }

  async setData(
    contextId: string,
    key: string,
    data: any,
    schema?: any
  ): Promise<boolean> {
    const context = this.contexts.get(contextId);
    if (!context) {
      return false;
    }

    // Validate data against schema if provided
    if (schema) {
      const validationResult = this.validateAgainstSchema(data, schema);
      if (!validationResult.valid) {
        return false;
      }
    }

    context.data.set(key, {
      value: data,
      timestamp: new Date(),
      schema,
    });

    context.updated = new Date();

    return true;
  }

  async getData(contextId: string, key: string): Promise<any> {
    const context = await this.getContext(contextId);
    const dataEntry = context.data.get(key);

    if (!dataEntry) {
      return undefined;
    }

    return dataEntry.value;
  }

  async updateData(
    contextId: string,
    key: string,
    updater: DataUpdater
  ): Promise<boolean> {
    const context = this.contexts.get(contextId);
    if (!context) {
      return false;
    }

    const dataEntry = context.data.get(key);
    if (!dataEntry) {
      return false;
    }

    const updatedData = updater(dataEntry.value);

    dataEntry.value = updatedData;
    dataEntry.timestamp = new Date();

    context.updated = new Date();

    return true;
  }

  async deleteData(contextId: string, key: string): Promise<boolean> {
    const context = this.contexts.get(contextId);
    if (!context) {
      return false;
    }

    const deleted = context.data.delete(key);

    if (deleted) {
      context.updated = new Date();
    }

    return deleted;
  }

  async shareContext(
    contextId: string,
    targetPipeline: string
  ): Promise<boolean> {
    const context = await this.getContext(contextId);

    // Create a new context for the target pipeline with shared data
    const sharedContext: Context = {
      id: `${targetPipeline}-shared-${contextId}`,
      data: new Map(context.data),
      metadata: {
        ...context.metadata,
        owner: targetPipeline,
        tags: [...context.metadata.tags, "shared"],
      },
      version: 1,
      created: new Date(),
      updated: new Date(),
    };

    this.contexts.set(sharedContext.id, sharedContext);

    return true;
  }

  async createVersion(contextId: string): Promise<string> {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new AgentNotFoundError(`Context ${contextId} not found`);
    }

    const versionId = `v${context.version}-${Date.now()}`;

    // Create a snapshot of the current state
    const versionedContext: Context = {
      ...context,
      id: `${contextId}-${versionId}`,
      data: new Map(context.data),
      version: context.version + 1,
    };

    this.contexts.set(versionedContext.id, versionedContext);

    // Update original context version
    context.version++;

    return versionId;
  }

  async revertToVersion(
    contextId: string,
    versionId: string
  ): Promise<boolean> {
    const versionedContextId = `${contextId}-${versionId}`;
    const versionedContext = this.contexts.get(versionedContextId);

    if (!versionedContext) {
      return false;
    }

    const originalContext = this.contexts.get(contextId);
    if (!originalContext) {
      return false;
    }

    // Revert data to the versioned state
    originalContext.data = new Map(versionedContext.data);
    originalContext.version = versionedContext.version;
    originalContext.updated = new Date();

    return true;
  }

  async cleanupExpiredContexts(): Promise<number> {
    const expiredContexts: string[] = [];
    const now = new Date();

    for (const [contextId, context] of this.contexts) {
      if (context.metadata.expiration && context.metadata.expiration < now) {
        expiredContexts.push(contextId);
      }
    }

    expiredContexts.forEach((contextId) => this.contexts.delete(contextId));

    return expiredContexts.length;
  }

  async optimizeStorage(): Promise<OptimizationResult> {
    const startTime = Date.now();
    let itemsCleaned = 0;
    let storageFreed = 0;

    // Clean expired contexts
    itemsCleaned += await this.cleanupExpiredContexts();

    // Remove old versions (keep only last 3 versions per context)
    const contextVersions = new Map<string, Context[]>();
    for (const [contextId, context] of this.contexts) {
      const baseId = contextId.split("-cloned-")[0].split("-shared-")[0];
      if (!contextVersions.has(baseId)) {
        contextVersions.set(baseId, []);
      }
      contextVersions.get(baseId)!.push(context);
    }

    for (const versions of contextVersions.values()) {
      if (versions.length > 3) {
        // Sort by creation time and keep the 3 most recent
        versions.sort((a, b) => b.created.getTime() - a.created.getTime());
        const toDelete = versions.slice(3);

        for (const context of toDelete) {
          this.contexts.delete(context.id);
          itemsCleaned++;
        }
      }
    }

    // Estimate storage freed (rough calculation)
    storageFreed = itemsCleaned * 1024; // Assume ~1KB per context

    const timeTaken = Date.now() - startTime;

    return {
      itemsCleaned,
      storageFreed,
      timeTaken,
    };
  }

  // Utility methods

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredContexts().catch((error) => {
        console.warn("Failed to cleanup expired contexts:", error);
      });
    }, this.cleanupInterval);
  }

  private validateAgainstSchema(
    data: any,
    schema: any
  ): { valid: boolean; errors?: string[] } {
    // Simple schema validation (in real implementation, use a proper validator)
    const errors: string[] = [];

    if (schema.type) {
      if (schema.type === "string" && typeof data !== "string") {
        errors.push(`Expected string, got ${typeof data}`);
      } else if (schema.type === "number" && typeof data !== "number") {
        errors.push(`Expected number, got ${typeof data}`);
      } else if (schema.type === "boolean" && typeof data !== "boolean") {
        errors.push(`Expected boolean, got ${typeof data}`);
      } else if (schema.type === "array" && !Array.isArray(data)) {
        errors.push(`Expected array, got ${typeof data}`);
      }
    }

    if (schema.required && Array.isArray(schema.required)) {
      for (const requiredField of schema.required) {
        if (!(requiredField in data)) {
          errors.push(`Missing required field: ${requiredField}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // AgentContext utilities for easy agent integration
  async createAgentContext(
    pipelineId: string,
    agentId: string,
    parentContextId?: string
  ): Promise<AgentContext> {
    let data = new Map<string, any>();
    let metadata: ContextMetadata;

    if (parentContextId) {
      const parentContext = await this.getContext(parentContextId);
      data = new Map(parentContext.data);
      metadata = parentContext.metadata;
    } else {
      const baseContext = await this.createContext(pipelineId, {
        owner: agentId,
        tags: ["agent", pipelineId],
        storage: StorageType.MEMORY,
      });
      metadata = baseContext.metadata;
    }

    return {
      id: `${pipelineId}-${agentId}-${Date.now()}`,
      pipelineId,
      parentContextId,
      data,
      metadata,
      version: "1.0",
      created: new Date(),
      updated: new Date(),
    };
  }

  async persistAgentContext(agentContext: AgentContext): Promise<void> {
    // Convert AgentContext to persisted Context format
    const contextData = new Map();
    for (const [key, value] of agentContext.data) {
      contextData.set(key, {
        value,
        timestamp: agentContext.updated,
      });
    }

    const context: Context = {
      id: agentContext.id,
      data: contextData,
      metadata: {
        ...agentContext.metadata,
        expiration:
          agentContext.metadata.expiration ||
          new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
      version: parseInt(agentContext.version) || 1,
      created: agentContext.created,
      updated: agentContext.updated,
    };

    this.contexts.set(context.id, context);
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.contexts.clear();
  }
}
