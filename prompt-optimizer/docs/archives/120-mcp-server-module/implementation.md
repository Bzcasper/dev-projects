# MCP Server Module Technical Implementation Details

## 🔧 Architecture Design

### Overall Architecture
MCP Server module adopted layered architecture design to ensure decoupling with Core module:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MCP Client    │    │   MCP Client    │    │   MCP Client    │
│ (Claude Desktop)│    │ (MCP Inspector) │    │   (Custom App)  │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
           │                      │                      │
           └──────────────────────┼──────────────────────┘
                                  │ MCP Protocol
           ┌────────────────────────────────────────────────┐
           │              MCP Server                        │
           │  ┌─────────────────────────────────────────┐   │
           │  │           Transport Layer               │   │
           │  │  ┌─────────────┐  ┌─────────────────┐   │   │
           │  │  │    stdio    │  │ Streamable HTTP │   │   │
           │  │  └─────────────┘  └─────────────────┘   │   │
           │  └─────────────────────────────────────────┘   │
           │  ┌─────────────────────────────────────────┐   │
           │  │           MCP Protocol Layer            │   │
           │  │            ┌─────────┐                  │   │
           │  │            │  Tools  │                  │   │
           │  │            └─────────┘                  │   │
           │  └─────────────────────────────────────────┘   │
           │  ┌─────────────────────────────────────────┐   │
           │  │         Service Adapter Layer           │   │
           │  └─────────────────────────────────────────┘   │
           └────────────────────┬───────────────────────────┘
                                │
           ┌────────────────────────────────────────────────┐
           │              Core Module                       │
           │  ┌─────────────┐ ┌─────────────┐ ┌──────────┐  │
           │  │PromptService│ │ LLMService  │ │ Template │  │
           │  └─────────────┘ └─────────────┘ │ Manager  │  │
           │  ┌─────────────┐ ┌─────────────┐ └──────────┘  │
           │  │HistoryMgr   │ │ ModelMgr    │ ┌──────────┐  │
           │  └─────────────┘ └─────────────┘ │ Memory   │  │
           │                                  │ Storage  │  │
           │                                  └──────────┘  │
           └────────────────────────────────────────────────┘
```

### Module Structure
```
packages/mcp-server/
├── package.json                 # Project configuration and dependencies
├── tsconfig.json               # TypeScript configuration
├── src/
│   ├── index.ts                # Main entry point (only exports)
│   ├── start.ts                # Startup entry point
│   ├── config/                 # Configuration management
│   │   ├── environment.ts      # Environment variable management
│   │   ├── models.ts           # Default model configuration
│   │   └── templates.ts        # Default template configuration
│   ├── tools/                  # MCP Tools implementation
│   │   ├── index.ts            # Tools export
│   │   ├── optimize-user-prompt.ts      # User prompt optimization
│   │   ├── optimize-system-prompt.ts    # System prompt optimization
│   │   └── iterate-prompt.ts            # Prompt iteration optimization
│   ├── adapters/               # Service adapter layer
│   │   ├── core-services.ts    # Core service initialization and management
│   │   ├── parameter-adapter.ts # Parameter format conversion
│   │   └── error-handler.ts    # Error handling adaptation
│   └── utils/                  # Utility functions
│       └── logging.ts          # Logging tools
├── examples/                   # Usage examples
│   ├── stdio-client.js         # stdio client example
│   └── http-client.js          # HTTP client example
├── docs/                       # Documentation
│   └── README.md               # Usage instructions
└── tests/                      # Test files
    ├── tools.test.ts           # Tools test
    └── integration.test.ts     # Integration test
```

## 🐛 Problem Diagnosis and Resolution

### Environment Variable Loading Timing Issue
**Problem description**: Core package's `defaultModels` initializes during module import, cannot read environment variables loaded via dotenv later.

**Solution**: Create preload script (`preload-env.js`), preload environment variables during Node.js startup:

```javascript
// preload-env.js
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables by priority
const paths = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '../.env.local'),
  resolve(__dirname, '../../.env.local'),
  // ... more paths
];

paths.forEach(path => {
  try {
    config({ path });
  } catch (error) {
    // Ignore file not found errors
  }
});
```

Use `-r` parameter to preload:
```json
{
  "scripts": {
    "dev": "node -r ./preload-env.js dist/start.js --transport=http"
  }
}
```

### Build-Time Background Process Issue
**Problem description**: In `src/index.ts` file, executing code at the end causes accidental server startup when tsup builds and occupies ports.

**Solution**: File separation strategy

1. `src/index.ts` - Only export, no execution：
```typescript
// Export main function for external calls
export { main };
```

2. `src/start.ts` - Dedicated for startup：
```typescript
#!/usr/bin/env node
import { main } from './index.js';

// Start server
main().catch(console.error);
```

3. Update build configuration：
```json
{
  "scripts": {
    "build": "tsup src/index.ts src/start.ts --format cjs,esm --dts --clean",
    "dev": "node -r ./preload-env.js dist/start.js --transport=http"
  }
}
```

## 📝 Implementation Steps

1. Project structure design and initialization
2. Core service manager implementation
3. Parameter adapter layer implementation
4. Default configuration management
5. MCP Tools implementation
6. Error handling and conversion
7. MCP Server instance creation
8. Multi-transport support
9. Testing and documentation

## 🔍 Debugging Process

In development, we used the following debugging methods：

1. **MCP Inspector debugging**: Use official debugging tools for protocol-level testing
2. **Log-driven debugging**: Record detailed status of each link, quickly locate issues
3. **Layered testing strategy**: Test Core services first then MCP packaging, quickly locate issues

## 🧪 Testing Verification

### Build Testing
- ✅ CJS/ESM dual format output
- ✅ TypeScript type definition generation
- ✅ Build-time no side effects (server not started)

### Functional Testing
- ✅ Environment variables loaded correctly
- ✅ Model auto-selection and configuration
- ✅ Template loading and management
- ✅ MCP tool registration and calling
- ✅ HTTP/stdio dual transport support

### Compatibility Testing
- ✅ Windows 10/11
- ✅ Node.js 18+
- ✅ MCP Inspector integration
- ✅ Claude Desktop compatibility