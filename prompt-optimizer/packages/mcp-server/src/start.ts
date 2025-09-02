#!/usr/bin/env node

/**
 * MCP Server startup file
 * This file is specifically for starting the server, avoiding execution during build
 */

import { main } from './index.js';

// Start the server
main().catch(console.error);
