/**
 * LiteLLM Smart Routing Errors
 * Specialized error handling for Google Cloud microVM integration
 *
 * @format
 */

export class LiteLLMError extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly agentType?: string;

  constructor(
    message: string,
    code:
      | "CONNECTION_ERROR"
      | "AUTHENTICATION_ERROR"
      | "MODEL_ERROR"
      | "ROUTING_ERROR"
      | "FALLBACK_ERROR"
      | "CIRCUIT_BREAKER_OPEN"
      | "HEALTH_CHECK_FAILED"
      | "QUOTA_EXCEEDED"
      | "TIMEOUT_ERROR",
    details?: any,
    agentType?: string,
  ) {
    super(message);
    this.name = "LiteLLMError";
    this.code = code;
    this.details = details;
    this.agentType = agentType;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LiteLLMError);
    }
  }
}

export class LiteLLMConnectionError extends LiteLLMError {
  constructor(message: string, details?: any) {
    super(message, "CONNECTION_ERROR", details);
    this.name = "LiteLLMConnectionError";
  }
}

export class LiteLLMAuthenticationError extends LiteLLMError {
  constructor(message: string, details?: any) {
    super(message, "AUTHENTICATION_ERROR", details);
    this.name = "LiteLLMAuthenticationError";
  }
}

export class LiteLLMModelError extends LiteLLMError {
  constructor(message: string, details?: any, agentType?: string) {
    super(message, "MODEL_ERROR", details, agentType);
    this.name = "LiteLLMModelError";
  }
}

export class LiteLLMRoutingError extends LiteLLMError {
  constructor(message: string, details?: any, agentType?: string) {
    super(message, "ROUTING_ERROR", details, agentType);
    this.name = "LiteLLMRoutingError";
  }
}

export class LiteLLMFallbackError extends LiteLLMError {
  constructor(message: string, details?: any, agentType?: string) {
    super(message, "FALLBACK_ERROR", details, agentType);
    this.name = "LiteLLMFallbackError";
  }
}

export class CircuitBreakerOpenError extends LiteLLMError {
  constructor(message: string, details?: any) {
    super(message, "CIRCUIT_BREAKER_OPEN", details);
    this.name = "CircuitBreakerOpenError";
  }
}

export class HealthCheckError extends LiteLLMError {
  constructor(message: string, details?: any) {
    super(message, "HEALTH_CHECK_FAILED", details);
    this.name = "HealthCheckError";
  }
}

export class QuotaExceededError extends LiteLLMError {
  constructor(message: string, details?: any, agentType?: string) {
    super(message, "QUOTA_EXCEEDED", details, agentType);
    this.name = "QuotaExceededError";
  }
}

export class TimeoutError extends LiteLLMError {
  constructor(message: string, details?: any) {
    super(message, "TIMEOUT_ERROR", details);
    this.name = "TimeoutError";
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof LiteLLMError) {
    return [
      "CONNECTION_ERROR",
      "TIMEOUT_ERROR",
      "HEALTH_CHECK_FAILED",
    ].includes(error.code);
  }
  return false;
}

/**
 * Check if error should trigger fallback
 */
export function shouldFallback(error: Error): boolean {
  if (error instanceof CircuitBreakerOpenError) {
    return true;
  }

  if (error instanceof LiteLLMError) {
    return [
      "CONNECTION_ERROR",
      "AUTHENTICATION_ERROR",
      "MODEL_ERROR",
      "QUOTA_EXCEEDED",
    ].includes(error.code);
  }

  return true; // Default to fallback for unknown errors
}

/**
 * Get error severity level
 */
export function getErrorSeverity(
  error: Error,
): "low" | "medium" | "high" | "critical" {
  if (error instanceof LiteLLMError) {
    switch (error.code) {
      case "AUTHENTICATION_ERROR":
      case "QUOTA_EXCEEDED":
        return "critical";
      case "CONNECTION_ERROR":
      case "MODEL_ERROR":
        return "high";
      case "TIMEOUT_ERROR":
      case "HEALTH_CHECK_FAILED":
        return "medium";
      case "ROUTING_ERROR":
      case "FALLBACK_ERROR":
        return "low";
      default:
        return "medium";
    }
  }
  return "medium";
}
