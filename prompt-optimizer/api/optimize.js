import { NextRequest, NextResponse } from 'next/server';

/**
 * Vercel Edge Function for prompt optimization
 * Handles AI model routing and optimization requests
 */
export default async function handler(req) {
  const { method } = req;
  
  // CORS headers for cross-origin requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:18181',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };

  // Handle preflight OPTIONS request
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Health check endpoint
    if (method === 'GET') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.VITE_APP_VERSION || '1.4.4',
        deployment: process.env.VERCEL_URL || 'local',
        region: process.env.VERCEL_REGION || 'unknown',
        environment: process.env.NODE_ENV || 'development'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Handle POST requests for prompt optimization
    if (method === 'POST') {
      const body = await req.json();
      const { prompt, model, temperature, maxTokens } = body;

      // Validate required fields
      if (!prompt) {
        return new Response(JSON.stringify({
          error: 'Missing required field: prompt',
          code: 'MISSING_PROMPT'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // Basic prompt optimization logic
      const optimizedPrompt = optimizePrompt(prompt, {
        model: model || 'gpt-3.5-turbo',
        temperature: temperature || 0.7,
        maxTokens: maxTokens || 2048
      });

      // Simulate processing time and add optimization metrics
      const processingTime = Math.random() * 200 + 50; // 50-250ms
      await new Promise(resolve => setTimeout(resolve, processingTime));

      return new Response(JSON.stringify({
        originalPrompt: prompt,
        optimizedPrompt: optimizedPrompt.text,
        improvements: optimizedPrompt.improvements,
        metrics: {
          processingTime: Math.round(processingTime),
          improvementScore: optimizedPrompt.score,
          tokenCount: estimateTokenCount(optimizedPrompt.text),
          optimizationApplied: optimizedPrompt.techniques
        },
        timestamp: new Date().toISOString(),
        model: model || 'gpt-3.5-turbo'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Processing-Time': Math.round(processingTime).toString(),
          ...corsHeaders,
        },
      });
    }

    // Method not allowed
    return new Response(JSON.stringify({
      error: `Method ${method} not allowed`,
      code: 'METHOD_NOT_ALLOWED'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'GET, POST, OPTIONS',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Basic prompt optimization function
 * @param {string} prompt - Original prompt
 * @param {object} options - Optimization options
 */
function optimizePrompt(prompt, options) {
  const techniques = [];
  let optimizedText = prompt;
  let score = 0;

  // Add role specification if missing
  if (!prompt.toLowerCase().includes('you are') && !prompt.toLowerCase().includes('as a')) {
    optimizedText = 'You are an expert assistant. ' + optimizedText;
    techniques.push('role_specification');
    score += 10;
  }

  // Add structure for complex prompts
  if (prompt.length > 100 && !prompt.includes('\n')) {
    optimizedText = optimizedText.replace(/\. /g, '.\n\n');
    techniques.push('structure_improvement');
    score += 15;
  }

  // Add specificity markers
  if (!prompt.toLowerCase().includes('specific') && !prompt.toLowerCase().includes('detail')) {
    optimizedText += '\n\nPlease provide specific and detailed information.';
    techniques.push('specificity_enhancement');
    score += 8;
  }

  // Add format instruction for longer prompts
  if (prompt.length > 200 && !prompt.toLowerCase().includes('format')) {
    optimizedText += '\n\nFormat your response clearly with proper structure.';
    techniques.push('format_instruction');
    score += 12;
  }

  return {
    text: optimizedText,
    improvements: techniques.length,
    score: Math.min(score, 100),
    techniques
  };
}

/**
 * Estimate token count (rough approximation)
 * @param {string} text - Text to count tokens for
 */
function estimateTokenCount(text) {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

export const config = {
  runtime: 'edge',
  regions: ['iad1', 'cle1', 'fra1', 'hnd1'], // Multi-region deployment
};