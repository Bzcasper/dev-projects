# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a development workspace containing multiple AI-related projects:

- **claude-flow/** - AI orchestration platform with swarm intelligence and neural networks
- **mcphub/** - Model Context Protocol (MCP) server hub for unified AI service management
- **prompt-optimizer/** - AI prompt optimization tool with multi-platform support
- **ai-agents-no-code-tools/** - No-code AI agent toolkit
- **n8n-stack/** - Workflow automation stack

Each project is self-contained with its own dependencies and build systems.

## Common Development Commands

### Claude-Flow (AI Orchestration Platform)
```bash
# Main development
npm run dev                    # Start development server
npm run build                  # Build for production
npm run test                   # Run all tests
npm run typecheck              # Type checking
npm run lint                   # ESLint checking

# Core SPARC commands
npx claude-flow@alpha sparc modes              # List available modes
npx claude-flow@alpha sparc run <mode> "<task>" # Execute specific mode
npx claude-flow@alpha sparc tdd "<feature>"    # Run complete TDD workflow

# Hive-mind coordination
npx claude-flow@alpha hive-mind wizard         # Interactive setup
npx claude-flow@alpha hive-mind spawn "<task>" # Create AI swarm
npx claude-flow@alpha swarm "<task>" --claude  # Quick coordination
```

### MCPHub (MCP Server Management)
```bash
# Development
pnpm dev                       # Start both frontend and backend
pnpm backend:dev              # Backend only
pnpm frontend:dev             # Frontend only
pnpm build                    # Build entire project
pnpm test                     # Run tests

# Docker deployment
docker run -p 3000:3000 samanhappy/mcphub
```

### Prompt Optimizer (Multi-platform AI Tool)
```bash
# Development
pnpm dev                      # Build core/ui and run web app
pnpm dev:fresh                # Complete reset and restart
pnpm build                    # Build all packages
pnpm test                     # Run tests across all packages

# Package-specific development
pnpm dev:desktop              # Desktop app development
pnpm dev:ext                  # Chrome extension development
pnpm mcp:dev                  # MCP server development
```

## Architecture Overview

### Claude-Flow Architecture
- **SPARC Methodology**: Specification, Pseudocode, Architecture, Refinement, Completion
- **Hive-Mind Intelligence**: Queen-led AI coordination with 54 specialized agents
- **Neural Networks**: 27+ cognitive models with pattern recognition
- **87 MCP Tools**: Comprehensive toolkit for swarm orchestration
- **SQLite Memory**: Persistent `.swarm/memory.db` with cross-session context

### MCPHub Architecture
- **Backend**: Node.js/Express with TypeScript
- **Frontend**: React with Vite and Tailwind CSS
- **Protocol**: Model Context Protocol SDK integration
- **Smart Routing**: Vector semantic search with PostgreSQL/pgvector
- **Authentication**: JWT with bcrypt password hashing

### Prompt Optimizer Architecture
- **Monorepo Structure**: Multiple packages with shared core and UI
- **Multi-platform**: Web, desktop (Electron), Chrome extension, MCP server
- **Pure Frontend**: Client-side processing with no server dependencies
- **Multi-model Support**: OpenAI, Gemini, DeepSeek, Zhipu AI, SiliconFlow

## Development Best Practices

### File Organization
- **NEVER save working files to the root directory**
- Use appropriate subdirectories within each project
- Follow each project's established structure

### Claude-Flow Specific
- **Concurrent Execution**: Batch all related operations in single messages
- **File Organization**: Use `/src`, `/tests`, `/docs`, `/config`, `/scripts`, `/examples` directories
- **SPARC Workflow**: Always follow Specification → Pseudocode → Architecture → Refinement → Completion
- **Memory Management**: Store context in `.swarm/memory.db` for persistence

### Testing Requirements
- Run `npm test` or `pnpm test` after code changes
- Each project has specific test commands in their package.json
- Claude-Flow: Comprehensive test suite with unit, integration, e2e, and performance tests
- MCPHub: Jest-based testing with coverage reports
- Prompt Optimizer: Cross-package testing with individual package tests

### Configuration Management
- Claude-Flow uses existing CLAUDE.md with specific coordination rules
- Prompt Optimizer has .cursorrules with Windows-specific development guidelines
- MCPHub uses standard TypeScript/Node.js configuration

## Integration Notes

### MCP Protocol Support
All three main projects support Model Context Protocol:
- Claude-Flow: Native MCP integration with 87 tools
- MCPHub: MCP server hub for unified access
- Prompt Optimizer: MCP server for prompt optimization

### Cross-Project Dependencies
- Projects are independent but can complement each other
- Claude-Flow can orchestrate development across other projects
- MCPHub can manage MCP servers from other projects
- Prompt Optimizer can enhance prompts used in other projects

## Important Reminders

1. **Each project has its own CLAUDE.md or configuration** - respect project-specific guidelines
2. **Never modify existing CLAUDE.md files** unless explicitly requested
3. **Use project-specific package managers**: pnpm for MCPHub and Prompt Optimizer, npm for Claude-Flow
4. **Follow established patterns** in each codebase rather than introducing new approaches
5. **Test thoroughly** - each project has specific testing requirements and commands