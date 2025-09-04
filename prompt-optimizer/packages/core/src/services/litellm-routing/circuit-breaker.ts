/**
 * Circuit Breaker for LiteLLM Service
 * Implements circuit breaker pattern for resilient service calls
 *
 * @format
 */

import type {
  ICircuitBreaker,
  CircuitBreakerState,
  LiteLLMConfig,
} from "./types";
import { CircuitBreakerOpenError } from "./errors";

export class CircuitBreaker implements ICircuitBreaker {
  private state: CircuitBreakerState;
  private readonly threshold: number;
  private readonly timeout: number;
  private readonly halfOpenMaxCalls: number;

  constructor(_config: LiteLLMConfig) {
    this.threshold = 5; // Open circuit after 5 failures
    this.timeout = 60000; // 1 minute timeout before trying half-open
    this.halfOpenMaxCalls = 3; // Max calls to try in half-open state

    this.state = {
      state: "CLOSED",
      failureCount: 0,
      lastFailureTime: 0,
      successCount: 0,
      lastSuccessTime: 0,
    };

    console.log(
      `🔧 Circuit breaker initialized (threshold: ${this.threshold}, timeout: ${this.timeout}ms)`,
    );
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state.state === "OPEN") {
      if (Date.now() - this.state.lastFailureTime > this.timeout) {
        this.state.state = "HALF_OPEN";
        this.state.successCount = 0;
        console.log("🔄 Circuit breaker transitioning to HALF_OPEN");
      } else {
        throw new CircuitBreakerOpenError(
          `Circuit breaker is OPEN. Failing fast. Last failure: ${new Date(this.state.lastFailureTime).toISOString()}`,
          {
            state: this.state.state,
            timeSinceLastFailure: Date.now() - this.state.lastFailureTime,
            timeoutRemaining:
              this.timeout - (Date.now() - this.state.lastFailureTime),
          },
        );
      }
    }

    // In HALF_OPEN state, limit the number of calls
    if (
      this.state.state === "HALF_OPEN" &&
      this.state.successCount >= this.halfOpenMaxCalls
    ) {
      throw new CircuitBreakerOpenError(
        "Circuit breaker is HALF_OPEN but max trial calls reached",
        { state: this.state.state, successCount: this.state.successCount },
      );
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      state: "CLOSED",
      failureCount: 0,
      lastFailureTime: 0,
      successCount: 0,
      lastSuccessTime: 0,
    };
    console.log("🔄 Circuit breaker reset to CLOSED");
  }

  private onSuccess(): void {
    this.state.lastSuccessTime = Date.now();

    if (this.state.state === "HALF_OPEN") {
      this.state.successCount++;

      // If we've had enough successful calls in HALF_OPEN, close the circuit
      if (this.state.successCount >= this.halfOpenMaxCalls) {
        this.state.state = "CLOSED";
        this.state.failureCount = 0;
        console.log("✅ Circuit breaker CLOSED - service recovered");
      }
    } else if (this.state.state === "CLOSED") {
      // Reset failure count on any success in CLOSED state
      this.state.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.state.failureCount++;
    this.state.lastFailureTime = Date.now();

    if (this.state.state === "HALF_OPEN") {
      // Any failure in HALF_OPEN state reopens the circuit
      this.state.state = "OPEN";
      console.warn(
        "⚠️ Circuit breaker OPENED - failure during half-open trial",
      );
    } else if (
      this.state.state === "CLOSED" &&
      this.state.failureCount >= this.threshold
    ) {
      // Too many failures in CLOSED state
      this.state.state = "OPEN";
      console.warn(
        `⚠️ Circuit breaker OPENED - ${this.state.failureCount} consecutive failures`,
      );
    }
  }

  /**
   * Check if the circuit is allowing calls
   */
  isCallAllowed(): boolean {
    switch (this.state.state) {
      case "CLOSED":
        return true;
      case "OPEN":
        return Date.now() - this.state.lastFailureTime > this.timeout;
      case "HALF_OPEN":
        return this.state.successCount < this.halfOpenMaxCalls;
      default:
        return false;
    }
  }

  /**
   * Get circuit breaker metrics
   */
  getMetrics(): {
    state: string;
    failureRate: number;
    uptime: number;
    timeSinceLastFailure: number;
    timeSinceLastSuccess: number;
  } {
    const now = Date.now();

    return {
      state: this.state.state,
      failureRate: this.calculateFailureRate(),
      uptime: this.calculateUptime(),
      timeSinceLastFailure:
        this.state.lastFailureTime > 0 ? now - this.state.lastFailureTime : 0,
      timeSinceLastSuccess:
        this.state.lastSuccessTime > 0 ? now - this.state.lastSuccessTime : 0,
    };
  }

  private calculateFailureRate(): number {
    // Simple failure rate based on recent state
    if (this.state.state === "OPEN") return 1.0;
    if (this.state.state === "CLOSED" && this.state.failureCount === 0)
      return 0.0;

    // For HALF_OPEN or CLOSED with some failures
    const totalAttempts = this.state.failureCount + this.state.successCount;
    return totalAttempts > 0 ? this.state.failureCount / totalAttempts : 0.0;
  }

  private calculateUptime(): number {
    // Calculate uptime percentage based on state history
    const totalTime =
      Date.now() -
      (Math.min(this.state.lastFailureTime, this.state.lastSuccessTime) ||
        Date.now());
    if (totalTime <= 0) return 1.0;

    if (this.state.state === "CLOSED") return 1.0;
    if (this.state.state === "OPEN") {
      const downTime = Date.now() - this.state.lastFailureTime;
      return Math.max(0, 1 - downTime / totalTime);
    }

    return 0.5; // HALF_OPEN state
  }

  /**
   * Get human-readable status
   */
  getStatusSummary(): string {
    const metrics = this.getMetrics();
    const uptimePercent = Math.round(metrics.uptime * 100);
    const failureRatePercent = Math.round(metrics.failureRate * 100);

    return [
      `State: ${this.state.state}`,
      `Failures: ${this.state.failureCount}/${this.threshold}`,
      `Uptime: ${uptimePercent}%`,
      `Failure Rate: ${failureRatePercent}%`,
      `Last Failure: ${this.state.lastFailureTime > 0 ? new Date(this.state.lastFailureTime).toISOString() : "Never"}`,
    ].join(" | ");
  }
}
