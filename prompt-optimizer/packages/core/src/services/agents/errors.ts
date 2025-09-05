/** @format */

// Agent system error classes based on AGENT_PIPELINE_ARCHITECTURE.md

import { ErrorType, AgentError as IAgentError } from "./types";

export class AgentError extends Error implements IAgentError {
  type: ErrorType;
  agentId?: string;
  pipelineId?: string;
  critical: boolean;
  retryable: boolean;
  metadata?: Record<string, any>;
  cause?: Error;

  constructor(
    message: string,
    type: ErrorType,
    options: {
      agentId?: string;
      pipelineId?: string;
      critical?: boolean;
      retryable?: boolean;
      metadata?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message);

    this.name = "AgentError";
    this.type = type;
    this.agentId = options.agentId;
    this.pipelineId = options.pipelineId;
    this.critical = options.critical ?? false;
    this.retryable = options.retryable ?? true;
    this.metadata = options.metadata;

    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

export class AgentFailureError extends AgentError {
  constructor(
    message: string,
    agentId: string,
    options: {
      pipelineId?: string;
      metadata?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message, ErrorType.AGENT_FAILURE, {
      ...options,
      agentId,
      critical: false,
      retryable: true,
    });
  }
}

export class ContextCorruptionError extends AgentError {
  constructor(
    message: string,
    contextId: string,
    options: { agentId?: string; pipelineId?: string } = {}
  ) {
    super(message, ErrorType.CONTEXT_CORRUPTION, {
      ...options,
      critical: true,
      retryable: false,
      metadata: { contextId },
    });
  }
}

export class CommunicationException extends AgentError {
  constructor(
    message: string,
    options: {
      agentId?: string;
      pipelineId?: string;
      cause?: Error;
      retryAfter?: number;
    } = {}
  ) {
    super(message, ErrorType.COMMUNICATION_EXCEPTION, {
      ...options,
      critical: false,
      retryable: true,
      metadata: options.retryAfter
        ? { retryAfter: options.retryAfter }
        : undefined,
    });
  }
}

export class TimeoutExceededError extends AgentError {
  constructor(
    message: string,
    options: {
      agentId?: string;
      pipelineId?: string;
      timeoutMs?: number;
    } = {}
  ) {
    super(message, ErrorType.TIMEOUT_EXCEEDED, {
      ...options,
      critical: false,
      retryable: true,
      metadata: options.timeoutMs
        ? { timeoutMs: options.timeoutMs }
        : undefined,
    });
  }
}

export class ResourceExhaustedError extends AgentError {
  constructor(
    message: string,
    resourceType: string,
    options: {
      agentId?: string;
      pipelineId?: string;
      requested?: number;
      available?: number;
    } = {}
  ) {
    super(message, ErrorType.RESOURCE_EXHAUSTED, {
      ...options,
      critical: true,
      retryable: false,
      metadata: {
        resourceType,
        requested: options.requested,
        available: options.available,
      },
    });
  }
}

export class ValidationError extends AgentError {
  constructor(
    message: string,
    validationErrors: string[],
    options: {
      agentId?: string;
      pipelineId?: string;
      field?: string;
    } = {}
  ) {
    super(message, ErrorType.VALIDATION_ERROR, {
      ...options,
      critical: false,
      retryable: false,
      metadata: {
        validationErrors,
        field: options.field,
      },
    });
  }
}

export class PipelineExecutionError extends Error {
  pipelineId: string;
  errors: AgentError[];

  constructor(message: string, pipelineId: string, errors: AgentError[]) {
    super(message);
    this.name = "PipelineExecutionError";
    this.pipelineId = pipelineId;
    this.errors = errors;
  }
}

export class AgentInitializationError extends AgentError {
  constructor(
    message: string,
    agentId: string,
    options: { pipelineId?: string; cause?: Error } = {}
  ) {
    super(message, ErrorType.AGENT_FAILURE, {
      ...options,
      agentId,
      critical: true,
      retryable: false,
    });
  }
}

export class AgentNotFoundError extends AgentError {
  constructor(agentId: string, options: { pipelineId?: string } = {}) {
    super(`Agent ${agentId} not found`, ErrorType.AGENT_FAILURE, {
      ...options,
      agentId,
      critical: true,
      retryable: false,
    });
  }
}

export class ContextNotFoundError extends AgentError {
  constructor(
    contextId: string,
    options: { agentId?: string; pipelineId?: string } = {}
  ) {
    super(`Context ${contextId} not found`, ErrorType.CONTEXT_CORRUPTION, {
      ...options,
      critical: true,
      retryable: false,
      metadata: { contextId },
    });
  }
}

export class InvalidPipelineConfigError extends AgentError {
  constructor(message: string, validationErrors: string[]) {
    super(message, ErrorType.VALIDATION_ERROR, {
      critical: true,
      retryable: false,
      metadata: { validationErrors },
    });
  }
}

export class CircuitBreakerOpenError extends AgentError {
  constructor(
    serviceName: string,
    options: { agentId?: string; pipelineId?: string } = {}
  ) {
    super(
      `Circuit breaker open for service: ${serviceName}`,
      ErrorType.COMMUNICATION_EXCEPTION,
      {
        ...options,
        critical: false,
        retryable: true,
        metadata: { serviceName, circuitBreakerOpen: true },
      }
    );
  }
}

export class MessageDeliveryError extends AgentError {
  constructor(
    messageId: string,
    options: { recipient?: string; cause?: Error } = {}
  ) {
    super(
      `Failed to deliver message ${messageId}`,
      ErrorType.COMMUNICATION_EXCEPTION,
      {
        ...options,
        critical: false,
        retryable: true,
        metadata: {
          messageId,
          recipient: options.recipient,
        },
      }
    );
  }
}

// Utility functions for error handling
export function isCriticalError(error: Error): boolean {
  if (error instanceof AgentError) {
    return error.critical;
  }
  return false;
}

export function isRetryableError(error: Error): boolean {
  if (error instanceof AgentError) {
    return error.retryable;
  }
  return true; // Default to retryable for unknown errors
}

export function getErrorType(error: Error): ErrorType | null {
  if (error instanceof AgentError) {
    return error.type;
  }
  return null;
}

export function wrapError(
  error: Error,
  context: { agentId?: string; pipelineId?: string }
): AgentError {
  if (error instanceof AgentError) {
    return error;
  }

  // Wrap unknown errors as AgentFailureError
  return new AgentFailureError(error.message, context.agentId || "unknown", {
    pipelineId: context.pipelineId,
    cause: error,
  });
}

export function logError(
  error: AgentError,
  logger?: { error: (message: string, meta?: any) => void }
): void {
  const logMessage = `${error.type}: ${error.message}`;

  const metadata = {
    agentId: error.agentId,
    pipelineId: error.pipelineId,
    critical: error.critical,
    retryable: error.retryable,
    ...error.metadata,
  };

  if (logger) {
    logger.error(logMessage, metadata);
  } else {
    // Fallback to console logging
    console.error(logMessage, metadata);
    if (error.cause) {
      console.error("Caused by:", error.cause);
    }
  }
}
