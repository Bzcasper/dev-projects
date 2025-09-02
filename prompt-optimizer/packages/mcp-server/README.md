# MCP Server for Prompt Optimizer

Provides MCP (Model Context Protocol) server for the prompt optimizer project. Offers prompt optimization tools, supports connection via HTTP protocol, can be used by any MCP compatible client.

> **User deployment and usage guide**: Please check [MCP Server User Guide](../../docs/user/mcp-server.md)

## Features

- **optimize-user-prompt**: Optimize user prompts to improve LLM performance
- **optimize-system-prompt**: Optimize system prompts to improve LLM performance
- **iterate-prompt**: Iterate and improve mature prompts based on specific requirements

## Quick Start

### Development Mode (Recommended)

```bash
# Install dependencies
pnpm install

# Development mode: Monitor file changes automatically, automatically compile and restart server
pnpm dev
```

The server starts at `http://localhost:3000/mcp`, and restarts automatically after code changes.

### Production Mode

```bash
# 1. Build the project
pnpm build

# 2. Start the server
pnpm start
```

The server starts at `http://localhost:3000/mcp`.

### Root Directory Shortcuts

If you're in the project root directory, you can use the following shortcut commands:

```bash
# Development mode
pnpm mcp:dev

# Build project
pnpm mcp:build

# Start server (debug logging enabled by default)
pnpm mcp:start

# Adjust log level if needed
MCP_LOG_LEVEL=info pnpm mcp:start

# Run tests
pnpm mcp:test
```

## Development Configuration

### Environment Variables

When developing, configure `.env.local` file in the project root directory. For detailed configuration instructions, please refer to [User Guide](../../docs/user/mcp-server.md#environment-variable-configuration).

Development environment minimum configuration example:
```bash
# Configure at least one API key
VITE_OPENAI_API_KEY=your-openai-key
MCP_DEFAULT_MODEL_PROVIDER=openai
MCP_LOG_LEVEL=debug
```

## Log Configuration

MCP server enables `debug` level logging by default, adjustable via `MCP_LOG_LEVEL` environment variable:

```bash
# Default debug level (show all logs)
pnpm start

# Adjust to info level
MCP_LOG_LEVEL=info pnpm start

# Adjust to warn level
MCP_LOG_LEVEL=warn pnpm start

# Adjust to error level
MCP_LOG_LEVEL=error pnpm start
```

### Log Level Description

- `debug` - Debug information (default, use in development)
- `info` - General information (service startup, configuration, etc.)
- `warn` - Warning information (non-fatal issues)
- `error` - Error information (issues that need attention)



## Development

```bash
# Development mode (automatically monitor file changes, automatically restart server)
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm type-check

# Code checking
pnpm lint
```

## Testing & Debugging

### Testing with MCP Inspector

MCP Inspector is the official visual testing tool, supports testing MCP server via Web UI.

#### Using MCP Inspector for Testing

```bash
# 1. Start MCP server
pnpm start

# 2. Start Inspector in another terminal
npx @modelcontextprotocol/inspector
```

Then in the Inspector Web UI:
1. Select transmission method: `Streamable HTTP`
2. Server URL: `http://localhost:3000/mcp`
3. Click "Connect" to connect to server
4. Test available tools: `optimize-user-prompt`, `optimize-system-prompt`, `iterate-prompt`

#### Other Testing Methods

**Important Note**: MCP protocol is not a simple REST API, cannot test directly with curl.

**Recommended Testing Methods**:
1. **MCP Inspector** (Official tool) - Best choice
2. **Claude Desktop** - Actual usage scenario
3. **Custom MCP client** - Use `@modelcontextprotocol/sdk`

**Why cannot use curl**:
- MCP uses JSON-RPC 2.0 protocol
- Requires special handshake and initialization process
- HTTP transport uses streaming connection, not simple request-response

## 📚 Related Documentation

- [MCP Server User Guide](../../docs/user/mcp-server.md) - User deployment and usage guide
- [MCP Server Development Experience](../../docs/archives/120-mcp-server-module/experience.md) - Development experience and best practices
- [Project Homepage](../../README.md) - Project overview and quick start

## Architecture Design

This MCP server follows zero-invasion design principles:
- Only uses existing Core module APIs, no need to modify
- Uses memory storage to implement stateless operation
- Provides parameter adaptation between MCP and Core formats

## License

MIT
