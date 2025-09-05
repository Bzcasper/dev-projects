/** @format */

// Message passing system for inter-agent communication

import {
  AgentMessage,
  AgentId,
  MessagePayload,
  AgentAction,
  MessageType,
  MessageMetadata,
  MessagePriority,
  AgentRegistry,
} from "./types";
import {
  MessageDeliveryError,
  AgentNotFoundError,
  CommunicationException,
} from "./errors";

export interface MessageBus {
  // Publishing messages
  publish(message: AgentMessage): Promise<void>;

  // Subscribing to messages
  subscribe(agentId: AgentId, handler: MessageHandler): Promise<boolean>;
  unsubscribe(agentId: AgentId): Promise<boolean>;

  // Request-response messaging
  request(message: AgentMessage, timeout?: number): Promise<AgentMessage>;

  // Broadcast messages
  broadcast(message: Omit<AgentMessage, "recipient">): Promise<void>;
}

export type MessageHandler = (message: AgentMessage) => Promise<void> | void;

export class AgentMessageBus implements MessageBus {
  private subscribers: Map<AgentId, MessageHandler> = new Map();
  private pendingRequests: Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (error: any) => void;
      timeout: NodeJS.Timeout;
    }
  > = new Map();
  private messageHistory: AgentMessage[] = [];
  private readonly maxHistorySize = 1000;

  constructor(private agentRegistry: AgentRegistry) {}

  async publish(message: AgentMessage): Promise<void> {
    try {
      // Validate message
      const validation = this.validateMessage(message);
      if (!validation.valid) {
        throw new MessageDeliveryError(message.id, {
          cause: new Error(validation.errors.join(", ")),
        });
      }

      // Add to history
      this.addToHistory(message);

      // Route message based on type and recipient
      if (message.type === MessageType.REQUEST) {
        await this.handleRequest(message);
      } else if (message.type === MessageType.RESPONSE) {
        await this.handleResponse(message);
      } else {
        await this.routeMessage(message);
      }
    } catch (error) {
      if (error instanceof MessageDeliveryError) {
        throw error;
      }

      throw new MessageDeliveryError(message.id, {
        cause: error instanceof Error ? error : new Error(String(error)),
        recipient: message.recipient,
      });
    }
  }

  async subscribe(agentId: AgentId, handler: MessageHandler): Promise<boolean> {
    // Check if agent exists
    const agents = await this.agentRegistry.getAvailableAgents();
    const agent = agents.find((a) => a.id === agentId);

    if (!agent) {
      return false;
    }

    this.subscribers.set(agentId, handler);
    return true;
  }

  async unsubscribe(agentId: AgentId): Promise<boolean> {
    return this.subscribers.delete(agentId);
  }

  async request(
    message: Omit<AgentMessage, "type">,
    timeout: number = 30000
  ): Promise<AgentMessage> {
    const requestMessage: AgentMessage = {
      ...message,
      type: MessageType.REQUEST,
      timestamp: new Date(),
    };

    return new Promise(async (resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestMessage.id);
        reject(
          new CommunicationException(`Request timeout after ${timeout}ms`, {
            recipient: message.recipient || "unknown",
          })
        );
      }, timeout);

      this.pendingRequests.set(requestMessage.id, {
        resolve,
        reject,
        timeout: timeoutHandle,
      });

      try {
        await this.publish(requestMessage);
      } catch (error) {
        clearTimeout(timeoutHandle);
        this.pendingRequests.delete(requestMessage.id);
        reject(error);
      }
    });
  }

  async broadcast(message: Omit<AgentMessage, "recipient">): Promise<void> {
    // Get all active agents
    const agents = await this.agentRegistry.getAvailableAgents();

    // Send message to all agents
    const broadcastPromises = agents.map((agent) => {
      const agentMessage: AgentMessage = {
        ...message,
        recipient: agent.id,
        timestamp: new Date(),
      };

      return this.publish(agentMessage).catch((error) => {
        console.warn(`Failed to broadcast to agent ${agent.id}:`, error);
      });
    });

    await Promise.allSettled(broadcastPromises);
  }

  // Private methods

  private validateMessage(message: AgentMessage): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!message.id) {
      errors.push("Message ID is required");
    }

    if (!message.sender) {
      errors.push("Message sender is required");
    }

    if (!message.recipient && message.type !== MessageType.NOTIFICATION) {
      errors.push("Message recipient is required (except for notifications)");
    }

    if (!message.type) {
      errors.push("Message type is required");
    }

    if (!message.payload) {
      errors.push("Message payload is required");
    }

    // Type-specific validation
    if (message.type === MessageType.REQUEST) {
      if (!message.payload.action) {
        errors.push("Request messages must specify an action");
      }
    }

    if (
      message.type === MessageType.RESPONSE &&
      !message.payload.correlationId
    ) {
      errors.push("Response messages must have a correlation ID");
    }

    return { valid: errors.length === 0, errors };
  }

  private async handleRequest(message: AgentMessage): Promise<void> {
    const handler = this.subscribers.get(message.recipient);

    if (!handler) {
      throw new AgentNotFoundError(
        `No handler found for agent ${message.recipient}`
      );
    }

    try {
      await handler(message);
    } catch (error) {
      // Send error response back to sender
      const errorResponse: AgentMessage = {
        id: `${message.id}-error`,
        timestamp: new Date(),
        sender: message.recipient,
        recipient: message.sender,
        type: MessageType.ERROR,
        payload: {
          contextId: message.payload.contextId,
          action: AgentAction.PROCESS,
          data: {
            error: error instanceof Error ? error.message : String(error),
            originalRequestId: message.id,
          },
          correlationId: message.id,
        },
        metadata: {
          priority: MessagePriority.HIGH,
        },
      };

      await this.routeMessage(errorResponse);
    }
  }

  private async handleResponse(message: AgentMessage): Promise<void> {
    const pendingRequest = this.pendingRequests.get(
      message.payload.correlationId || ""
    );

    if (pendingRequest) {
      clearTimeout(pendingRequest.timeout);
      this.pendingRequests.delete(message.payload.correlationId || "");

      if (message.type === MessageType.ERROR) {
        pendingRequest.reject(
          new Error(message.payload.data?.error || "Request failed")
        );
      } else {
        pendingRequest.resolve(message);
      }
    } else {
      // Response without matching request - route normally
      await this.routeMessage(message);
    }
  }

  private async routeMessage(message: AgentMessage): Promise<void> {
    // Find appropriate handler
    const handler = this.subscribers.get(message.recipient);

    if (!handler) {
      // Check if it's a broadcast or if we should route to all subscribers
      if (message.type === MessageType.NOTIFICATION) {
        // Send to all subscribers except sender
        const promises = Array.from(this.subscribers.entries())
          .filter(([agentId]) => agentId !== message.sender)
          .map(([, handler]) => handler(message).catch(console.error));

        await Promise.allSettled(promises);
      } else {
        throw new AgentNotFoundError(
          `No handler found for agent ${message.recipient}`
        );
      }
    } else {
      await handler(message);
    }
  }

  private addToHistory(message: AgentMessage): void {
    this.messageHistory.push(message);

    // Keep history size manageable
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory = this.messageHistory.slice(-this.maxHistorySize);
    }
  }

  // Utility methods

  async sendDirectMessage(
    from: AgentId,
    to: AgentId,
    type: MessageType,
    payload: MessagePayload,
    priority: MessagePriority = MessagePriority.NORMAL
  ): Promise<void> {
    const message: AgentMessage = {
      id: `${from}-${to}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      timestamp: new Date(),
      sender: from,
      recipient: to,
      type,
      payload,
      metadata: {
        priority,
      },
    };

    await this.publish(message);
  }

  async sendNotification(
    from: AgentId,
    payload: Omit<MessagePayload, "correlationId">,
    priority: MessagePriority = MessagePriority.NORMAL
  ): Promise<void> {
    await this.broadcast({
      id: `${from}-notification-${Date.now()}`,
      timestamp: new Date(),
      sender: from,
      type: MessageType.NOTIFICATION,
      payload,
      metadata: {
        priority,
      },
    });
  }

  async getAgentMessages(agentId: AgentId): Promise<AgentMessage[]> {
    return this.messageHistory.filter(
      (message) => message.sender === agentId || message.recipient === agentId
    );
  }

  getMessageHistory(): readonly AgentMessage[] {
    return [...this.messageHistory];
  }

  clearHistory(): void {
    this.messageHistory.length = 0;
  }

  // Circuit breaker pattern for resilience
  private circuitBreakers: Map<
    string,
    {
      failures: number;
      lastFailure: number;
      state: "closed" | "open" | "half-open";
    }
  > = new Map();

  async shouldSendToAgent(agentId: string): Promise<boolean> {
    const circuit = this.circuitBreakers.get(agentId);

    if (!circuit) {
      return true; // No circuit breaker yet
    }

    const now = Date.now();

    if (circuit.state === "open") {
      // Check if timeout period has passed
      if (now - circuit.lastFailure > 30000) {
        // 30 seconds timeout
        circuit.state = "half-open";
        circuit.failures = 0;
        return true;
      }
      return false;
    }

    return true;
  }

  recordAgentFailure(agentId: string): void {
    const circuit = this.circuitBreakers.get(agentId) || {
      failures: 0,
      lastFailure: 0,
      state: "closed" as const,
    };

    circuit.failures++;
    circuit.lastFailure = Date.now();

    if (circuit.failures >= 3) {
      // Open circuit after 3 failures
      circuit.state = "open";
    }

    this.circuitBreakers.set(agentId, circuit);
  }

  recordAgentSuccess(agentId: string): void {
    const circuit = this.circuitBreakers.get(agentId);
    if (circuit) {
      circuit.failures = 0;
      circuit.state = "closed";
    }
  }

  // Load balancing for agent instances
  private agentInstances: Map<string, string[]> = new Map();
  private loadBalancingIndex: Map<string, number> = new Map();

  async registerAgentInstance(
    baseAgentId: string,
    instanceId: string
  ): Promise<void> {
    if (!this.agentInstances.has(baseAgentId)) {
      this.agentInstances.set(baseAgentId, []);
      this.loadBalancingIndex.set(baseAgentId, 0);
    }

    const instances = this.agentInstances.get(baseAgentId)!;
    instances.push(instanceId);
  }

  async getNextAgentInstance(baseAgentId: string): Promise<string | undefined> {
    const instances = this.agentInstances.get(baseAgentId);
    if (!instances || instances.length === 0) {
      return undefined;
    }

    let index = this.loadBalancingIndex.get(baseAgentId) || 0;
    const instanceId = instances[index];
    index = (index + 1) % instances.length;
    this.loadBalancingIndex.set(baseAgentId, index);

    return instanceId;
  }

  destroy(): void {
    // Clear all pending requests
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timeout);
    }

    this.pendingRequests.clear();
    this.subscribers.clear();
    this.messageHistory.length = 0;
    this.circuitBreakers.clear();
    this.agentInstances.clear();
    this.loadBalancingIndex.clear();
  }
}

// Helper functions for creating common message types
export function createProcessRequest(
  from: AgentId,
  to: AgentId,
  contextId: string,
  data: any
): AgentMessage {
  return {
    id: `${from}-request-${Date.now()}`,
    timestamp: new Date(),
    sender: from,
    recipient: to,
    type: MessageType.REQUEST,
    payload: {
      contextId,
      action: AgentAction.PROCESS,
      data,
    },
    metadata: {
      priority: MessagePriority.NORMAL,
    },
  };
}

export function createProcessResponse(
  originalRequestId: string,
  from: AgentId,
  to: AgentId,
  contextId: string,
  result: any
): AgentMessage {
  return {
    id: `${from}-response-${Date.now()}`,
    timestamp: new Date(),
    sender: from,
    recipient: to,
    type: MessageType.RESPONSE,
    payload: {
      contextId,
      action: AgentAction.PROCESS,
      data: result,
      correlationId: originalRequestId,
    },
    metadata: {
      priority: MessagePriority.NORMAL,
    },
  };
}

export function createHeartbeatMessage(
  from: AgentId,
  data?: any
): Omit<AgentMessage, "recipient"> {
  return {
    id: `${from}-heartbeat-${Date.now()}`,
    timestamp: new Date(),
    sender: from,
    type: MessageType.HEARTBEAT,
    payload: {
      contextId: "system",
      action: AgentAction.PROCESS,
      data: data || { timestamp: Date.now() },
    },
    metadata: {
      priority: MessagePriority.LOW,
    },
  };
}
