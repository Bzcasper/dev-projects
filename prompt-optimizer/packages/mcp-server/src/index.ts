#!/usr/bin/env node

/**
 * MCP Server for Prompt Optimizer
 *
 * Provides 3 core tools:
 * - optimize-user-prompt: Optimizes user prompts
 * - optimize-system-prompt: Optimizes system prompts
 * - iterate-prompt: Iterates and optimizes mature prompts
 *
 * Supports both stdio and HTTP transport methods
 *
 * Note: Environment variables are loaded through environment.ts at application startup
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ListToolsRequestSchema, CallToolRequestSchema, isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { CoreServicesManager } from './adapters/core-services.js';
import { loadConfig } from './config/environment.js';
import * as logger from './utils/logging.js';
import { ParameterValidator } from './adapters/parameter-adapter.js';
import { getTemplateOptions, getDefaultTemplateId } from './config/templates.js';
import { randomUUID } from 'node:crypto';
import express from 'express';

// Factory function to create server instances
async function createServerInstance(config: any) {
  // Create MCP Server instance - using correct API
  const server = new Server({
    name: 'prompt-optimizer-mcp-server',
    version: '0.1.0'
  }, {
    capabilities: {
      tools: {}
    }
  });

  // Initialize Core services (each server instance is independent)
  const coreServices = CoreServicesManager.getInstance();
  await coreServices.initialize(config);

  return { server, coreServices };
}

// Function to set up server tool handlers
async function setupServerHandlers(server: Server, coreServices: CoreServicesManager) {

  // Get template options and default template IDs for tool definitions
  logger.info('Fetching template options...');
  const templateManager = coreServices.getTemplateManager();
  const [userOptimizeOptions, systemOptimizeOptions, iterateOptions, userDefaultId, systemDefaultId, iterateDefaultId] = await Promise.all([
    getTemplateOptions(templateManager, 'userOptimize'),
    getTemplateOptions(templateManager, 'optimize'),
    getTemplateOptions(templateManager, 'iterate'),
    getDefaultTemplateId(templateManager, 'user'),
    getDefaultTemplateId(templateManager, 'system'),
    getDefaultTemplateId(templateManager, 'iterate')
  ]);

  // Register tool list handler
  logger.info('Registering MCP tools...');
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "optimize-user-prompt",
          description: "Optimizes user prompts to enhance AI conversation effectiveness. Suitable for daily conversations, Q&A, creation and other scenarios.\n\nCore Features:\n- Enhances expression clarity and specificity\n- Adds necessary contextual information\n- Optimizes language expression and logical structure\n- Improves AI understanding accuracy\n\nExample Usage Scenarios:\n- Converting vague questions into specific and clear inquiries\n- Adding detailed requirements and constraints for creation tasks\n- Optimizing technical question descriptions",
          inputSchema: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "The user prompt to optimize. For example: 'Help me write an article' or 'Explain machine learning'"
              },
              template: {
                type: "string",
                description: `Select optimization template, different templates suit different scenarios:\n${userOptimizeOptions.map(opt => `- ${opt.label}：${opt.description}`).join('\n')}`,
                enum: userOptimizeOptions.map(opt => opt.value),
                default: userDefaultId
              }
            },
            required: ["prompt"]
          }
        },
        {
          name: "optimize-system-prompt",
          description: "Optimizes system prompts to enhance AI role-playing and behavior control effects. Suitable for customizing AI assistants, creating professional roles, and designing dialogue systems.\n\nCore Features:\n- Enhances role definitions and professionalism\n- Optimizes behavior guidelines and constraints\n- Improves instruction structure and hierarchy\n- Adds necessary professional knowledge\n\nExample Usage Scenarios:\n- Converting simple role descriptions into professional role definitions\n- Adding detailed behavior rules and restrictions for AI assistants\n- Optimizing knowledge frameworks for specific domain experts",
          inputSchema: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "The system prompt to optimize. For example: 'You are an assistant' or 'You are a medical consultant'"
              },
              template: {
                type: "string",
                description: `Select optimization template, different templates suit different scenarios:\n${systemOptimizeOptions.map(opt => `- ${opt.label}：${opt.description}`).join('\n')}`,
                enum: systemOptimizeOptions.map(opt => opt.value),
                default: systemDefaultId
              }
            },
            required: ["prompt"]
          }
        },
        {
          name: "iterate-prompt",
          description: "Iteratively improves existing prompts based on specific requirements. Suitable for scenarios where basic prompts exist but need fine-tuned adjustments for specific demands.\n\nCore Features:\n- Maintains original prompt core functionality\n- Performs targeted improvements based on specific requirements\n- Addresses existing prompt problems\n- Adapts to new usage scenarios or requirements\n\nExample Usage Scenarios:\n- Existing prompts have unsatisfactory effects and need improvement\n- Need to adapt to new business requirements or usage scenarios\n- Solve specific issues with output format or content\n- Need to enhance performance in specific aspects",
          inputSchema: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "The existing prompt to iterate and improve. Should be a complete prompt already in use but needs improvement"
              },
              requirements: {
                type: "string",
                description: "Specific improvement needs or problem descriptions. For example: 'Output format is not standardized' or 'Need more professional language style' or 'Want to increase creativity'"
              },
              template: {
                type: "string",
                description: `Select iteration optimization template, different templates have different improvement strategies:\n${iterateOptions.map(opt => `- ${opt.label}：${opt.description}`).join('\n')}`,
                enum: iterateOptions.map(opt => opt.value),
                default: iterateDefaultId
              }
            },
            required: ["prompt", "requirements"]
          }
        }
      ]
    };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger.info(`Processing tool call request: ${name}`);

    try {
      switch (name) {
        case "optimize-user-prompt": {
          const { prompt, template } = args as { prompt?: string; template?: string };

          if (!prompt) {
            return {
              isError: true,
              content: [{
                type: "text",
                text: "Error: Missing required parameter 'prompt'"
              }]
            };
          }

          // Parameter validation
          ParameterValidator.validatePrompt(prompt);
          if (template) {
            ParameterValidator.validateTemplate(template);
          }

          // Call Core services
          const promptService = coreServices.getPromptService();
          const modelManager = coreServices.getModelManager();
          const templateManager = coreServices.getTemplateManager();

          // Check if MCP default model is available
          const mcpModel = await modelManager.getModel('mcp-default');
          if (!mcpModel || !mcpModel.enabled) {
            return {
              isError: true,
              content: [{
                type: "text",
                text: "Error: MCP default model is not configured or not enabled, please check environment variable configuration"
              }]
            };
          }

          const templateId = template || await getDefaultTemplateId(templateManager, 'user');
          const result = await promptService.optimizePrompt({
            targetPrompt: prompt,
            modelKey: 'mcp-default',
            optimizationMode: 'user',
            templateId
          });

          return {
            content: [{
              type: "text",
              text: result
            }]
          };
        }

        case "optimize-system-prompt": {
          const { prompt, template } = args as { prompt?: string; template?: string };

          if (!prompt) {
            return {
              isError: true,
              content: [{
                type: "text",
                text: "Error: Missing required parameter 'prompt'"
              }]
            };
          }

          // Parameter validation
          ParameterValidator.validatePrompt(prompt);
          if (template) {
            ParameterValidator.validateTemplate(template);
          }

          // Call Core services
          const promptService = coreServices.getPromptService();
          const modelManager = coreServices.getModelManager();
          const templateManager = coreServices.getTemplateManager();

          // Check if MCP default model is available
          const mcpModel = await modelManager.getModel('mcp-default');
          if (!mcpModel || !mcpModel.enabled) {
            return {
              isError: true,
              content: [{
                type: "text",
                text: "Error: MCP default model is not configured or not enabled, please check environment variable configuration"
              }]
            };
          }

          const templateId = template || await getDefaultTemplateId(templateManager, 'system');
          const result = await promptService.optimizePrompt({
            targetPrompt: prompt,
            modelKey: 'mcp-default',
            optimizationMode: 'system',
            templateId
          });

          return {
            content: [{
              type: "text",
              text: result
            }]
          };
        }

        case "iterate-prompt": {
          const { prompt, requirements, template } = args as {
            prompt?: string;
            requirements?: string;
            template?: string
          };

          if (!prompt) {
            return {
              isError: true,
              content: [{
                type: "text",
                text: "Error: Missing required parameter 'prompt'"
              }]
            };
          }

          if (!requirements) {
            return {
              isError: true,
              content: [{
                type: "text",
                text: "Error: Missing required parameter 'requirements'"
              }]
            };
          }

          // Parameter validation
          ParameterValidator.validatePrompt(prompt);
          ParameterValidator.validateRequirements(requirements);
          if (template) {
            ParameterValidator.validateTemplate(template);
          }

          // Call Core services
          const promptService = coreServices.getPromptService();
          const modelManager = coreServices.getModelManager();
          const templateManager = coreServices.getTemplateManager();

          // Check if MCP default model is available
          const mcpModel = await modelManager.getModel('mcp-default');
          if (!mcpModel || !mcpModel.enabled) {
            return {
              isError: true,
              content: [{
                type: "text",
                text: "Error: MCP default model is not configured or not enabled, please check environment variable configuration"
              }]
            };
          }

          const templateId = template || await getDefaultTemplateId(templateManager, 'iterate');
          const result = await promptService.iteratePrompt(
            prompt,
            prompt, // Use original prompt as the last optimized prompt
            requirements,
            'mcp-default',
            templateId
          );

          return {
            content: [{
              type: "text",
              text: result
            }]
          };
        }

        default:
          return {
            isError: true,
            content: [{
              type: "text",
              text: `Error: Unknown tool '${name}'`
            }]
          };
      }
    } catch (error) {
      logger.error(`Tool execution error ${name}:`, error as Error);
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Tool execution error: ${(error as Error).message}`
        }]
      };
    }
  });

  logger.info('MCP tools registration completed');
}

async function main() {
  const config = loadConfig();
  logger.setLogLevel(config.logLevel);

  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const transport = args.find(arg => arg.startsWith('--transport='))?.split('=')[1] || 'stdio';
    const port = parseInt(args.find(arg => arg.startsWith('--port='))?.split('=')[1] || config.httpPort.toString());

    logger.info('Starting MCP Server for Prompt Optimizer');
    logger.info(`Transport: ${transport}, Port: ${port}`);

    // Initialize Core services (single initialization for configuration verification)
    logger.info('Initializing Core services...');
    const coreServices = CoreServicesManager.getInstance();
    await coreServices.initialize(config);
    logger.info('Core services initialization completed');

    // Start transport layer
    if (transport === 'http') {
      logger.info('Starting HTTP server with session management...');
      // Use Express with session management support for multi-client connections
      const app = express();
      app.use(express.json());
      logger.info('Express app configured');

      // Store transport instances for each session
      const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

      // Handle POST requests (client to server communication)
      app.post('/mcp', async (req, res) => {
        // Check for existing session ID
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        let httpTransport: StreamableHTTPServerTransport;

        if (sessionId && transports[sessionId]) {
          // Reuse existing transport
          httpTransport = transports[sessionId];
        } else if (!sessionId && isInitializeRequest(req.body)) {
          // New initialization request - create independent server instance per session
          httpTransport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
              // Store transport instance
              transports[sessionId] = httpTransport;
            },
            // MCP protocol doesn't need complex CORS configuration, allow all origins
            allowedOrigins: ['*'],
            enableDnsRebindingProtection: false
          });

          // Clean up transport instance
          httpTransport.onclose = () => {
            if (httpTransport.sessionId) {
              delete transports[httpTransport.sessionId];
            }
          };

          // Create independent server instance per session
          const { server } = await createServerInstance(config);
          await setupServerHandlers(server, coreServices);

          // Connect to MCP server
          await server.connect(httpTransport);
        } else {
          // Invalid request
          res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Bad Request: No valid session ID provided',
            },
            id: null,
          });
          return;
        }

        // Process request
        await httpTransport.handleRequest(req, res, req.body);
      });

      // Handle GET requests (server to client notifications via SSE)
      app.get('/mcp', async (req, res) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        if (!sessionId || !transports[sessionId]) {
          res.status(400).send('Invalid or missing session ID');
          return;
        }

        const httpTransport = transports[sessionId];
        await httpTransport.handleRequest(req, res);
      });

      // Handle DELETE requests (session termination)
      app.delete('/mcp', async (req, res) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        if (!sessionId || !transports[sessionId]) {
          res.status(400).send('Invalid or missing session ID');
          return;
        }

        const httpTransport = transports[sessionId];
        await httpTransport.handleRequest(req, res);
      });

      logger.info('Setting up HTTP server listener...');
      app.listen(port, () => {
        logger.info(`MCP Server running on HTTP port ${port} with session management`);
      });
      logger.info('HTTP server setup completed');
    } else {
      // stdio mode - create single server instance
      const { server } = await createServerInstance(config);
      await setupServerHandlers(server, coreServices);

      const stdioTransport = new StdioServerTransport();
      await server.connect(stdioTransport);
      logger.info('MCP Server running on stdio');
    }

  } catch (error) {
    // Ensure error information is always displayed, even without DEBUG enabled
    console.error('❌ MCP Server startup failed:');
    console.error('   ', (error as Error).message);

    // Also log detailed information with debug library
    logger.error('Failed to start MCP Server', error as Error);

    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Export main function for external calls
export { main };

// Create a separate startup file to avoid execution during build
