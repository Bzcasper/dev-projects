import { NextResponse } from 'next/server';

/**
 * Vercel Edge Function for health monitoring and system status
 * Provides comprehensive health checks and performance metrics
 */
export default async function handler(req) {
  const { method } = req;
  const startTime = Date.now();

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:18181',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (method !== 'GET') {
    return new Response(JSON.stringify({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'GET, OPTIONS',
        ...corsHeaders,
      },
    });
  }

  try {
    // Perform health checks
    const healthChecks = await performHealthChecks();
    const responseTime = Date.now() - startTime;

    const healthData = {
      status: healthChecks.overall === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: responseTime,
      version: process.env.VITE_APP_VERSION || '1.4.4',
      deployment: {
        url: process.env.VERCEL_URL || 'localhost',
        region: process.env.VERCEL_REGION || 'local',
        environment: process.env.NODE_ENV || 'development',
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'unknown'
      },
      checks: healthChecks,
      metrics: {
        uptime: process.uptime ? Math.round(process.uptime()) : 'unknown',
        memory: getMemoryUsage(),
        requests: {
          total: await getRequestCount(),
          errors: await getErrorCount(),
          averageResponseTime: await getAverageResponseTime()
        }
      },
      features: {
        edgeFunctions: true,
        analytics: !!process.env.VITE_ANALYTICS_ENABLED,
        litellm: !!process.env.LITELLM_ENABLED,
        vectorSearch: !!process.env.CHROMA_URL,
        monitoring: true
      }
    };

    return new Response(JSON.stringify(healthData), {
      status: healthChecks.overall === 'healthy' ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`,
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: {
        message: 'Health check failed',
        code: 'HEALTH_CHECK_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      responseTime: Date.now() - startTime
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${Date.now() - startTime}ms`,
        ...corsHeaders,
      },
    });
  }
}

/**
 * Perform comprehensive health checks
 */
async function performHealthChecks() {
  const checks = {
    api: 'healthy',
    database: 'unknown',
    external: 'healthy',
    memory: 'healthy',
    overall: 'healthy'
  };

  // Check memory usage
  try {
    const memory = getMemoryUsage();
    if (memory.usedPercent > 90) {
      checks.memory = 'critical';
      checks.overall = 'degraded';
    } else if (memory.usedPercent > 70) {
      checks.memory = 'warning';
    }
  } catch (error) {
    checks.memory = 'unknown';
  }

  // Check external services (LiteLLM, Vector DB)
  try {
    if (process.env.LITELLM_ENABLED === 'true' && process.env.LITELLM_BASE_URL) {
      const litellmCheck = await checkLiteLLMHealth();
      if (!litellmCheck) {
        checks.external = 'degraded';
        if (checks.overall === 'healthy') checks.overall = 'degraded';
      }
    }

    if (process.env.CHROMA_URL) {
      const chromaCheck = await checkVectorDBHealth();
      if (!chromaCheck) {
        checks.database = 'degraded';
        if (checks.overall === 'healthy') checks.overall = 'degraded';
      } else {
        checks.database = 'healthy';
      }
    }
  } catch (error) {
    checks.external = 'error';
    checks.overall = 'degraded';
  }

  return checks;
}

/**
 * Get memory usage information
 */
function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      used: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      total: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100, // MB
      usedPercent: Math.round((usage.heapUsed / usage.heapTotal) * 100)
    };
  }
  
  return {
    used: 'unknown',
    total: 'unknown',
    external: 'unknown',
    usedPercent: 0
  };
}

/**
 * Check LiteLLM service health
 */
async function checkLiteLLMHealth() {
  if (!process.env.LITELLM_BASE_URL) return true;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    const response = await fetch(`${process.env.LITELLM_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Authorization': process.env.LITELLM_API_KEY ? `Bearer ${process.env.LITELLM_API_KEY}` : undefined
      }
    });
    
    clearTimeout(timeout);
    return response.ok;
  } catch (error) {
    console.warn('LiteLLM health check failed:', error.message);
    return false;
  }
}

/**
 * Check Vector Database (Chroma) health
 */
async function checkVectorDBHealth() {
  if (!process.env.CHROMA_URL) return true;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    const response = await fetch(`${process.env.CHROMA_URL}/api/v1/heartbeat`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Authorization': process.env.CHROMA_API_KEY ? `Bearer ${process.env.CHROMA_API_KEY}` : undefined
      }
    });
    
    clearTimeout(timeout);
    return response.ok;
  } catch (error) {
    console.warn('Vector DB health check failed:', error.message);
    return false;
  }
}

/**
 * Mock functions for request metrics (would be implemented with actual monitoring)
 */
async function getRequestCount() {
  // In production, this would connect to analytics/monitoring service
  return Math.floor(Math.random() * 10000) + 1000;
}

async function getErrorCount() {
  // In production, this would connect to error tracking service
  return Math.floor(Math.random() * 100);
}

async function getAverageResponseTime() {
  // In production, this would be calculated from actual metrics
  return Math.floor(Math.random() * 200) + 50;
}

export const config = {
  runtime: 'edge',
  regions: ['iad1', 'cle1', 'fra1', 'hnd1'],
};