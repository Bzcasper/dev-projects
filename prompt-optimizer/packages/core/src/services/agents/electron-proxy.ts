/** @format */

// Electron IPC proxy for agent services

import { ipcRenderer, ipcMain, BrowserWindow } from "electron";
import { AgentRegistry } from "./types";
import { IContextManager } from "./types";
import { IPipelineOrchestrator } from "./types";
import { AgentMessage, AgentMessageBus } from "./message-passing";
import { AgentFailureError } from "./errors";

export interface ElectronAgentProxy {
  // Pipeline execution
  invokePipeline(pipelineConfig: any): Promise<any>;
  subscribeToUpdates(pipelineId: string): EventEmitter;
  cancelPipeline(pipelineId: string): Promise<boolean>;

  // Agent management
  registerAgent(agent: any): Promise<boolean>;
  unregisterAgent(agentId: string): Promise<boolean>;
  getAvailableAgents(): Promise<any[]>;

  // Context management
  createSharedContext(pipelineId: string, data?: any): Promise<string>;
  getSharedContext(contextId: string): Promise<any>;
  updateSharedContext(contextId: string, data: any): Promise<boolean>;
}

export class MainProcessAgentProxy implements ElectronAgentProxy {
  private contexts: Map<string, any> = new Map();

  constructor(
    private window: BrowserWindow,
    private agentRegistry: AgentRegistry,
    private contextManager: IContextManager,
    private pipelineOrchestrator: IPipelineOrchestrator,
    private messageBus: AgentMessageBus
  ) {
    this.setupIpcHandlers();
  }

  async invokePipeline(pipelineConfig: any): Promise<any> {
    try {
      // Create pipeline using orchestrator
      const pipeline = await this.pipelineOrchestrator.createPipeline(
        pipelineConfig
      );

      // Execute pipeline
      const result = await this.pipelineOrchestrator.executePipeline(pipeline, {
        data: pipelineConfig.input,
      });

      // Notify renderer process of completion
      this.window.webContents.send("pipeline-complete", {
        pipelineId: pipeline.id,
        result,
      });

      return result;
    } catch (error) {
      // Notify renderer process of error
      this.window.webContents.send("pipeline-error", {
        pipelineId: pipelineConfig.id,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  subscribeToUpdates(pipelineId: string): any {
    // In main process, we don't return EventEmitter
    // The renderer process should listen for IPC events
    return null;
  }

  async cancelPipeline(pipelineId: string): Promise<boolean> {
    return this.pipelineOrchestrator.cancelPipeline(pipelineId);
  }

  async registerAgent(agent: any): Promise<boolean> {
    return this.agentRegistry.registerAgent(agent);
  }

  async unregisterAgent(agentId: string): Promise<boolean> {
    return this.agentRegistry.unregisterAgent(agentId);
  }

  async getAvailableAgents(): Promise<any[]> {
    return this.agentRegistry.getAvailableAgents();
  }

  async createSharedContext(pipelineId: string, data?: any): Promise<string> {
    // Create context in main process
    const context = await this.contextManager.createContext(pipelineId, {
      owner: "electron-main",
      tags: ["electron", "shared"],
      storage: { type: "MEMORY" }, // Use memory storage for Electron
    });

    if (data) {
      await this.contextManager.setData(context.id, "initialData", data);
    }

    this.contexts.set(context.id, context);

    // Send context ID to renderer
    this.window.webContents.send("context-created", {
      contextId: context.id,
      pipelineId,
    });

    return context.id;
  }

  async getSharedContext(contextId: string): Promise<any> {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new AgentFailureError(
        `Context ${contextId} not found in main process`
      );
    }

    return context;
  }

  async updateSharedContext(contextId: string, data: any): Promise<boolean> {
    const success = await this.contextManager.setData(
      contextId,
      "sharedData",
      data
    );

    if (success) {
      // Notify all renderer processes of update
      this.window.webContents.send("context-updated", {
        contextId,
        data,
      });
    }

    return success;
  }

  private setupIpcHandlers(): void {
    // Handle pipeline execution requests from renderer
    ipcMain.handle("agent:invoke-pipeline", async (event, pipelineConfig) => {
      return this.invokePipeline(pipelineConfig);
    });

    // Handle pipeline cancellation
    ipcMain.handle("agent:cancel-pipeline", async (event, pipelineId) => {
      return this.cancelPipeline(pipelineId);
    });

    // Handle agent registration
    ipcMain.handle("agent:register", async (event, agentData) => {
      return this.registerAgent(agentData);
    });

    // Handle getting available agents
    ipcMain.handle("agent:get-available", async () => {
      return this.getAvailableAgents();
    });

    // Handle context operations
    ipcMain.handle("agent:create-context", async (event, pipelineId, data) => {
      return this.createSharedContext(pipelineId, data);
    });

    ipcMain.handle("agent:get-context", async (event, contextId) => {
      return this.getSharedContext(contextId);
    });

    ipcMain.handle("agent:update-context", async (event, contextId, data) => {
      return this.updateSharedContext(contextId, data);
    });

    // Handle message passing
    ipcMain.handle(
      "agent:send-message",
      async (event, message: AgentMessage) => {
        return this.messageBus.publish(message);
      }
    );

    ipcMain.handle(
      "agent:broadcast-message",
      async (event, message: Omit<AgentMessage, "recipient">) => {
        return this.messageBus.broadcast(message);
      }
    );
  }
}

// Renderer process proxy
export class RendererProcessAgentProxy implements ElectronAgentProxy {
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.setupMessageListeners();
  }

  async invokePipeline(pipelineConfig: any): Promise<any> {
    return ipcRenderer.invoke("agent:invoke-pipeline", pipelineConfig);
  }

  subscribeToUpdates(pipelineId: string): any {
    // Create a simple event emitter for the renderer
    const listeners: Function[] = [];
    this.listeners.set(pipelineId, listeners);

    const emitter = {
      on: (event: string, callback: Function) => {
        ipcRenderer.on(`${event}-${pipelineId}`, (_event, data) =>
          callback(data)
        );
        listeners.push(callback);
      },
      off: (event: string, callback?: Function) => {
        if (callback) {
          ipcRenderer.removeListener(`${event}-${pipelineId}`, callback as any);
        } else {
          this.listeners.delete(pipelineId);
        }
      },
      emit: (event: string, data: any) => {
        ipcRenderer.send(`${event}-${pipelineId}`, data);
      },
    };

    return emitter;
  }

  async cancelPipeline(pipelineId: string): Promise<boolean> {
    return ipcRenderer.invoke("agent:cancel-pipeline", pipelineId);
  }

  async registerAgent(agent: any): Promise<boolean> {
    return ipcRenderer.invoke("agent:register", agent);
  }

  async unregisterAgent(agentId: string): Promise<boolean> {
    return ipcRenderer.invoke("agent:unregister", agentId);
  }

  async getAvailableAgents(): Promise<any[]> {
    return ipcRenderer.invoke("agent:get-available");
  }

  async createSharedContext(pipelineId: string, data?: any): Promise<string> {
    return ipcRenderer.invoke("agent:create-context", pipelineId, data);
  }

  async getSharedContext(contextId: string): Promise<any> {
    return ipcRenderer.invoke("agent:get-context", contextId);
  }

  async updateSharedContext(contextId: string, data: any): Promise<boolean> {
    return ipcRenderer.invoke("agent:update-context", contextId, data);
  }

  private setupMessageListeners(): void {
    // Listen for pipeline events
    ipcRenderer.on("pipeline-complete", (_event, data) => {
      const listeners = this.listeners.get(data.pipelineId);
      if (listeners) {
        listeners.forEach((callback) => callback("complete", data));
      }
    });

    ipcRenderer.on("pipeline-error", (_event, data) => {
      const listeners = this.listeners.get(data.pipelineId);
      if (listeners) {
        listeners.forEach((callback) => callback("error", data));
      }
    });

    ipcRenderer.on("pipeline-progress", (_event, data) => {
      const listeners = this.listeners.get(data.pipelineId);
      if (listeners) {
        listeners.forEach((callback) => callback("progress", data));
      }
    });

    // Listen for context events
    ipcRenderer.on("context-created", (_event, data) => {
      const listeners = this.listeners.get(data.pipelineId);
      if (listeners) {
        listeners.forEach((callback) => callback("context-created", data));
      }
    });

    ipcRenderer.on("context-updated", (_event, data) => {
      const listeners = this.listeners.get(data.contextId);
      if (listeners) {
        listeners.forEach((callback) => callback("context-updated", data));
      }
    });
  }

  // Message passing in renderer
  async sendMessage(message: AgentMessage): Promise<void> {
    await ipcRenderer.invoke("agent:send-message", message);
  }

  async broadcastMessage(
    message: Omit<AgentMessage, "recipient">
  ): Promise<void> {
    await ipcRenderer.invoke("agent:broadcast-message", message);
  }
}

// Utility functions for detecting runtime environment
export function isMainProcess(): boolean {
  return typeof process !== "undefined" && process.type === "browser";
}

export function isRendererProcess(): boolean {
  return typeof window !== "undefined" && window.process?.type === "renderer";
}

export function createElectronAgentProxy(
  agentRegistry?: AgentRegistry,
  contextManager?: IContextManager,
  pipelineOrchestrator?: IPipelineOrchestrator,
  messageBus?: AgentMessageBus,
  mainWindow?: BrowserWindow
): ElectronAgentProxy {
  if (
    isMainProcess() &&
    agentRegistry &&
    contextManager &&
    pipelineOrchestrator &&
    messageBus &&
    mainWindow
  ) {
    return new MainProcessAgentProxy(
      mainWindow,
      agentRegistry,
      contextManager,
      pipelineOrchestrator,
      messageBus
    );
  } else if (isRendererProcess()) {
    return new RendererProcessAgentProxy();
  } else {
    // Fallback or web environment - would need to implement a different proxy
    throw new Error("Electron proxy can only be used in Electron environment");
  }
}

// Type guards
export function isElectronEnvironment(): boolean {
  return isMainProcess() || isRendererProcess();
}

// Electron preload script helper
export function setupPreloadApi(): void {
  if (typeof window !== "undefined") {
    (window as any).electronAgentProxy = {
      invokePipeline: (pipelineConfig: any) =>
        ipcRenderer.invoke("agent:invoke-pipeline", pipelineConfig),
      cancelPipeline: (pipelineId: string) =>
        ipcRenderer.invoke("agent:cancel-pipeline", pipelineId),
      getAvailableAgents: () => ipcRenderer.invoke("agent:get-available"),
      createContext: (pipelineId: string, data?: any) =>
        ipcRenderer.invoke("agent:create-context", pipelineId, data),
      getContext: (contextId: string) =>
        ipcRenderer.invoke("agent:get-context", contextId),
      updateContext: (contextId: string, data: any) =>
        ipcRenderer.invoke("agent:update-context", contextId, data),
      sendMessage: (message: AgentMessage) =>
        ipcRenderer.invoke("agent:send-message", message),
      onPipelineUpdate: (pipelineId: string, callback: Function) => {
        const eventName = `pipeline-update-${pipelineId}`;
        ipcRenderer.on(eventName, (_event, data) => callback(data));
        return () => ipcRenderer.removeListener(eventName, callback as any);
      },
    };
  }
}
