# MCP Server Integration in Docker

## Overview

The Docker container now runs two services simultaneously:
1.  **Web Application** (Nginx) - Port 80
2.  **MCP Server** (Node.js) - Port 3000

Supervisor is used to manage multiple processes, ensuring the stable operation of the services.

## Architecture Diagram

```
Docker Container
├── Nginx (Port 80)
│   ├── Web Application (/)
│   └── MCP Proxy (/mcp -> localhost:3000)
├── MCP Server (Port 3000)
└── Supervisor (Process Management)
```

## Port Mapping

-   **8081:80** - Web application access port
-   **3000:3000** - Direct access to MCP server (optional)

## Environment Variable Configuration

### Web Application Configuration
```bash
VITE_OPENAI_API_KEY=sk-your-key
VITE_GEMINI_API_KEY=your-key
# ... Other web application API configurations
```

### MCP Server Configuration
```bash
# Basic Configuration
MCP_HTTP_PORT=3000
MCP_LOG_LEVEL=info
MCP_ENABLE_CORS=true
MCP_ALLOWED_ORIGINS=*

# Model Configuration (Required)
MCP_DEFAULT_MODEL_PROVIDER=openai
MCP_DEFAULT_MODEL_NAME=gpt-4
MCP_DEFAULT_MODEL_API_KEY=sk-your-key
MCP_DEFAULT_MODEL_BASE_URL=
```

## Usage

### 1. Configure Environment Variables
```bash
cp .env.docker.example .env
# Edit the .env file and fill in your actual API keys
```

### 2. Start the Services
```bash
docker-compose up -d
```

### 3. Access the Services
-   **Web Application**: http://localhost:8081
-   **MCP Server**:
    -   Direct access: http://localhost:3000
    -   Via proxy: http://localhost:8081/mcp

### 4. Health Check
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# View MCP server logs
docker-compose exec prompt-optimizer supervisorctl tail -f mcp-server
```

## MCP Server API

### Get Tool List
```bash
curl -X POST http://localhost:8081/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
```

### Call a Tool
```bash
curl -X POST http://localhost:8081/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "optimize-user-prompt",
      "arguments": {
        "prompt": "Write a story",
        "template": "user-prompt-basic"
      }
    }
  }'
```

## Troubleshooting

### Check Service Status
```bash
docker-compose exec prompt-optimizer supervisorctl status
```

### Restart MCP Server
```bash
docker-compose exec prompt-optimizer supervisorctl restart mcp-server
```

### View Detailed Logs
```bash
# Nginx logs
docker-compose exec prompt-optimizer tail -f /var/log/nginx/error.log

# MCP server logs
docker-compose exec prompt-optimizer tail -f /var/log/supervisor/mcp-server.out.log
```

## Development Mode

If you need to run in development mode, you can modify `docker-compose.yml`:

```yaml
services:
  prompt-optimizer:
    build:
      context: .
      dockerfile: Dockerfile
    # ... other configurations
```

Then rebuild:
```bash
docker-compose up --build -d
```
