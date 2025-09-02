# MCP Server Module Development Experience Summary

## 🎯 Core Experience

### Zero-Intrusion Design Principles
In developing the MCP Server module, we adopted zero-intrusion design principles, achieving full functional integration through adaptation layers without modifying any Core module code. This design approach brings the following benefits:

1. **Maintaining architecture cleanliness**: Avoids modifications to core modules, maintaining code purity
2. **Reducing maintenance costs**: Core module updates do not affect the MCP Server module
3. **Improving testability**: The MCP Server module and Core module can be tested independently

**Implementation key points**:
- **Absolutely no modifications to Core module code**: All adaptations are completed at the MCP server layer
- **Using existing interfaces**: Strictly follow the Core module's existing API for calls
- **Complete service initialization**: All Core service dependencies must be initialized

### Core Module Service-Oriented Architecture Matching
The Core module's service-oriented architecture highly matches the MCP protocol, providing a good foundation for zero-intrusion design:
- All core functions are exposed through service interfaces
- Service interdependencies are clear, facilitating management by adaptation layers
- Parameter and return value formats are standardized, facilitating protocol conversion

### Hierarchical Architecture Design
Adopting hierarchical architecture design to separate MCP protocol layer, transmission layer, and service adaptation layer, making each layer's responsibilities clear, conducive to maintenance and expansion.

## 🛠️ Technical Implementation Experience

### Environment Variable Loading Timing Issues
In Node.js applications, the timing of environment variable loading is crucial. We ran into a problem where the Core module initializes configuration when imported, but environment variables have not been loaded yet.

**Problem phenomenon**:
- Node.js environment variables must be loaded before module import, otherwise modules cannot read them during initialization
- Core module will read environment variables to initialize configuration upon import

**Solution**:
1. Use Node.js's `-r` parameter to preload environment variables before module system initialization
2. Create a preload script (preload-env.js) to support multi-path lookup, adapting to different deployment scenarios
3. Unified configuration in project root directory, easy to manage
4. Support silent loading to avoid errors when configuration file is not found

**Implementation details**:
```bash
node -r ./preload-env.js dist/index.js
```

### Build-Time Side Effect Control
When using the tsup build tool, need to pay attention to the side effects of entry files.

**Problem phenomenon**:
- Build tools (like tsup) executing module-level code leads to accidental server startup
- Occupies ports during build, affecting development experience

**Best practices**:
1. Entry files only export, do not execute any side-effect codes
2. Use separate start files responsible for executing main logic
3. Avoid calling side-effect functions at module top level
4. Separate build entry and startup entry

### Windows Process Management Compatibility
When developing under Windows environment, need to pay attention to process management specific issues.

**Problem phenomenon**:
- Windows concurrently and other process management tools have signal processing issues
- Ctrl+C cannot correctly terminate child processes
- Complex process management leads to poor development experience

**Solutions**:
1. Avoid using complex process management tools like concurrently
2. Separate build and startup processes, using simple npm scripts
3. Use simple npm scripts to replace complex command combinations
4. Prefer simple solutions in Windows environment

### MCP Protocol Debugging Techniques
During MCP Server development, debugging is an important aspect.

**Debugging tools**:
1. **MCP Inspector**: Use official debugging tools for protocol-level testing
2. **Hierarchical testing strategy**: Test Core services first then MCP packaging to quickly locate issues
3. **Log-driven debugging**: Record detailed status of each link, quickly locate issues

**Testing methods**:
- Use custom MCP Inspector testing tool to verify functionality
- Chinese and English input testing ensure internationalization support
- Custom parameter testing verify parameter adaptation correctness

## 🚫 Pitfall Avoidance Guide

### Environment Variable Loading Timing Traps
**Problem**: Environment variables loaded after module import, configuration cannot be initialized correctly
**Cause**: Node.js module system executes module code upon import, when environment variables may not be loaded yet
**Solution**: Use Node.js `-r` parameter to preload environment variable script
**Avoidance methods**: Unified handling of environment variable loading in project startup scripts

### Build-Time Side Effect Traps
**Problem**: Accidental execution of server startup code during build time, occupies ports
**Cause**: Build tools execute module-level code to analyze dependencies
**Solution**: Separate build entry and startup entry, ensure no side effects in build process
**Avoidance methods**: Entry files only export, do not execute any side effect operations

### Windows Signal Processing Traps
**Problem**: When using concurrently and other tools in Windows, signal processing issues, cannot correctly terminate processes
**Cause**: Windows signal processing mechanism differs from Unix systems
**Solution**: Avoid using complex process management tools, adopt simple npm scripts
**Avoidance methods**: Prefer simple solutions in Windows environment

### Storage Layer Environment Difference Traps
**Problem**: Storage layer configuration inconsistent in different environments
**Cause**: Storage mechanisms differ between browser and Node.js environments
**Solution**: Use StorageFactory to adapt different environments, choose correct Provider during configuration
**Avoidance methods**: Clarify storage strategy in project initial stage, avoid large-scale modifications later

## 🔄 Architecture Design Experience

### Deep Application of Adapter Patterns
In the MCP Server module, we extensively used adapter patterns, converting MCP protocol interfaces to Core module interfaces. The advantages of this design pattern include:

1. **Decoupling**: MCP protocol layer and Core service layer are completely decoupled
2. **Extensibility**: Can easily add new adapters to support more functions
3. **Maintainability**: Each adapter has single responsibility, easy to maintain

**Implementation complexity considerations**:
- **Service management**: Need to manage complete Core service stack
- **Parameter conversion**: MCP simple parameters → Core complex parameter format
- **Configuration management**: Default model, template configuration and validation
- **Error handling**: Core error → MCP protocol error conversion

### Value of Stateless Design
MCP Server adopts stateless design, using memory storage, no persistence, each restart is fresh state. The advantages of this design:

1. **Simplifying deployment**: No need to consider data persistence and state management
2. **Improving reliability**: Avoids state inconsistency problems
3. **Convenient testing**: Each test is fresh environment
4. **Professional tool positioning**: Fits tool application usage pattern

### Independent Module Design Principles
Keep dependency relationships clean, avoid circular dependencies:
- Only depend on Core module, avoid UI layer pollution
- Organize by function hierarchy, easy to maintain and expand
- Unified error conversion layer, provide consistent user experience

## 📚 Learning Resources & Tool Configurations

### Useful Documents
- **MCP Official Documentation**: https://modelcontextprotocol.io - Protocol specifications and best practices
- **MCP TypeScript SDK**: https://github.com/modelcontextprotocol/typescript-sdk - Complete API documentation and examples

### Development Tool Configurations
- **MCP TypeScript SDK**: Use registerTool/registerResource methods, support Zod validation
- **tsup Build Tool**: Configure ESM/CJS dual format output, consistent with Core module
- **Environment Variable Preloading**: Create preload-env.js script, support multi-path lookup and silent loading

### Code Implementation Patterns
- **MCP Tools Implementation Pattern**: Use registerTool + Zod validation
- **Storage Layer Adaptation**: StorageFactory.create('memory') - Memory storage configuration
- **Parameter Adaptation Pattern**: MCP simple parameters → Core complex parameter conversion

## 🎯 Key Decision Records

### Technology Selection Decisions
- **MCP SDK**: Choose official TypeScript SDK, reason: Type safety, complete function support
- **Storage Solution**: Choose MemoryStorageProvider, reason: Suitable for tool applications, no persistence demand
- **Transmission Method**: Support stdio + HTTP dual mode, reason: Flexible deployment, meet different usage scenarios
- **Validation Library**: Choose Zod, reason: Already used by the project, perfect match with MCP SDK

### Architecture Decisions
- **Dependency Relationship**: Only depend on Core module, reason: Keep architecture clean, avoid UI layer pollution
- **Module Structure**: Organize by function hierarchy, reason: Easy to maintain and expand
- **Error Handling**: Unified error conversion layer, reason: Provide consistent user experience
- **Zero Intrusion Principle**: Completely no modification to Core code, reason: Maintain core module purity