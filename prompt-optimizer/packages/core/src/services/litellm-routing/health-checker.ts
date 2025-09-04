/**
 * Health Checker for LiteLLM Service
 * Monitors service health and performance metrics
 *
 * @format
 */

import type { IHealthChecker, HealthStatus, LiteLLMConfig } from "./types";

export class HealthChecker implements IHealthChecker {
  private status: HealthStatus;
  private readonly config: LiteLLMConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private latencyHistory: number[] = [];
  private readonly maxHistorySize = 100;

  constructor(config: LiteLLMConfig) {
    this.config = config;
    this.status = {
      healthy: true,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      uptime: 0,
      averageLatency: 0,
      totalRequests: 0,
      failedRequests: 0,
    };

    this.startHealthChecking();
  }

  isHealthy(): boolean {
    return this.status.healthy && this.status.consecutiveFailures < 3;
  }

  async checkHealth(): Promise<boolean> {
    const startTime = Date.now();

    try {
      // Simple health check - try to reach the service
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.baseURL}/health`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "User-Agent": "prompt-optimizer-health-check/1.0.0",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latency = Date.now() - startTime;
      const isHealthy = response.ok;

      if (isHealthy) {
        this.recordSuccess(latency);
        console.log(`✅ LiteLLM health check passed (${latency}ms)`);
      } else {
        this.recordFailure();
        console.warn(`⚠️ LiteLLM health check failed: HTTP ${response.status}`);
      }

      return isHealthy;
    } catch (error: any) {
      this.recordFailure();
      console.warn(`❌ LiteLLM health check error:`, error.message);
      return false;
    }
  }

  getStatus(): HealthStatus {
    return { ...this.status };
  }

  reset(): void {
    this.status = {
      healthy: true,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      uptime: 0,
      averageLatency: 0,
      totalRequests: 0,
      failedRequests: 0,
    };
    this.latencyHistory = [];
    console.log("🔄 LiteLLM health status reset");
  }

  recordSuccess(latency?: number): void {
    this.status.healthy = true;
    this.status.consecutiveFailures = 0;
    this.status.lastCheck = new Date();
    this.status.totalRequests++;

    if (latency !== undefined) {
      this.latencyHistory.push(latency);
      if (this.latencyHistory.length > this.maxHistorySize) {
        this.latencyHistory.shift();
      }
      this.updateAverageLatency();
    }
  }

  recordFailure(): void {
    this.status.consecutiveFailures++;
    this.status.failedRequests++;
    this.status.totalRequests++;
    this.status.lastCheck = new Date();

    // Mark as unhealthy after 3 consecutive failures
    if (this.status.consecutiveFailures >= 3) {
      this.status.healthy = false;
      console.warn(
        `⚠️ LiteLLM marked as unhealthy after ${this.status.consecutiveFailures} consecutive failures`,
      );
    }
  }

  private updateAverageLatency(): void {
    if (this.latencyHistory.length === 0) {
      this.status.averageLatency = 0;
      return;
    }

    const sum = this.latencyHistory.reduce((acc, latency) => acc + latency, 0);
    this.status.averageLatency = Math.round(sum / this.latencyHistory.length);
  }

  private startHealthChecking(): void {
    // Initial health check
    this.checkHealth();

    // Set up periodic health checks
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkHealth();
      } catch (error) {
        console.error("Health check interval error:", error);
      }
    }, this.config.healthCheckInterval);

    console.log(
      `🔄 LiteLLM health checking started (interval: ${this.config.healthCheckInterval}ms)`,
    );
  }

  /**
   * Stop health checking (for cleanup)
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log("🛑 LiteLLM health checking stopped");
    }
  }

  /**
   * Get health summary for logging/monitoring
   */
  getHealthSummary(): string {
    const successRate =
      this.status.totalRequests > 0
        ? Math.round(
            ((this.status.totalRequests - this.status.failedRequests) /
              this.status.totalRequests) *
              100,
          )
        : 100;

    return [
      `Health: ${this.status.healthy ? "✅ HEALTHY" : "❌ UNHEALTHY"}`,
      `Success Rate: ${successRate}% (${this.status.totalRequests - this.status.failedRequests}/${this.status.totalRequests})`,
      `Consecutive Failures: ${this.status.consecutiveFailures}`,
      `Avg Latency: ${this.status.averageLatency}ms`,
      `Last Check: ${this.status.lastCheck.toISOString()}`,
    ].join(" | ");
  }
}
