# High-Level Service Proxy IPC Model Refactoring Plan

## 📋 Task Overview

Address the fragility and compatibility issues caused by the current underlying `fetch` proxy solution's imperfect simulation. Establish a stable, maintainable, and clearly defined desktop application architecture, where the main process acts as a backend service provider and the renderer process as a pure frontend consumer.

## 🎯 Objectives

- Deprecate the underlying `fetch` proxy and switch to a high-level service interface proxy.
- Establish a stable IPC communication protocol.
- Implement the service provider role in the main process.
- Improve system maintainability and stability.

## 📅 Planned Timeline

- **Start Date**: 2024-07-25
- **Current Status**: 📋 Planning Stage
- **Estimated Completion**: TBD

## 🔧 Planned Steps

### 1. Clean up the `core` package
- [ ] Remove all Electron-specific logic (e.g., `isRunningInElectron` and `fetch` injection).
- [ ] Make it a pure, platform-agnostic core business logic library.
- [ ] Ensure the core package can run in any JavaScript environment.

### 2. Refactor `main.js`
- [ ] Make it a service provider.
- [ ] Directly consume the `core` package via `require('@prompt-optimizer/core')`.
- [ ] Instantiate core services like `LLMService` in the main process.
- [ ] Establish service management and lifecycle control.

### 3. Implement a main process storage solution
- [ ] Provide a storage solution suitable for the Node.js environment for services in `main.js`.
- [ ] First, implement a temporary `MemoryStorageProvider`.
- [ ] Subsequently, implement file-based persistent storage.

### 4. Refactor the IPC communication protocol
- [ ] Deprecate the underlying `api-fetch` proxy.
- [ ] Establish a high-level IPC interface based on the public methods of `ILLMService` in `main.js` and `preload.js`.
- [ ] Implement method-level IPC calls (e.g., `testConnection`, `sendMessageStream`).

### 5. Create a renderer process proxy
- [ ] Create an `ElectronLLMProxy` class in the `core` package.
- [ ] This class will implement the `ILLMService` interface.
- [ ] Internal methods will call the IPC interface via `window.electronAPI.llm.*`.

### 6. Refactor the service initialization logic
- [ ] Modify `useServiceInitializer.ts`.
- [ ] Enable it to detect the current environment (Web or Electron).
- [ ] Provide the application with either a real `LLMService` instance or an `ElectronLLMProxy` instance.

## 🚨 Problem Analysis

### Current Architecture Issues
1. **Fragility of the underlying proxy**:
   - The `fetch` proxy causes serialization and instance type mismatch issues for objects like `AbortSignal` and `Headers` when transmitted across IPC.
   - This leads to application crashes and is difficult to maintain.

2. **Violation of Separation of Concerns**:
   - Attempting to simulate a complex and unstable underlying Web API.
   - Violates the principle of separation of concerns.

3. **Maintenance Difficulty**:
   - Imperfect simulation of underlying objects.
   - Difficult to debug and troubleshoot.

### Advantages of the Solution
1. **Stable Interface**: Proxy our own defined, high-level, stable service interfaces.
2. **Simple Data Structures**: Based on stable, simple, and serializable data structures and interfaces.
3. **Clear Responsibilities**: The main process focuses on service provision, and the renderer process focuses on the UI.

## 🏗️ New Architecture Design

### Main Process Architecture
```javascript
// main.js
const { LLMService, StorageProvider } = require('@prompt-optimizer/core');

class MainProcessServices {
  constructor() {
    this.storageProvider = new NodeStorageProvider();
    this.llmService = new LLMService(this.storageProvider);
  }

  async testConnection(config) {
    return await this.llmService.testConnection(config);
  }

  async sendMessageStream(messages, config, onChunk) {
    return await this.llmService.sendMessageStream(messages, config, onChunk);
  }
}

const services = new MainProcessServices();

// IPC Handlers
ipcMain.handle('llm:testConnection', async (event, config) => {
  return await services.testConnection(config);
});

ipcMain.handle('llm:sendMessageStream', async (event, messages, config) => {
  // Special logic for handling streaming responses
});
```

### Renderer Process Proxy
```typescript
// ElectronLLMProxy.ts
export class ElectronLLMProxy implements ILLMService {
  async testConnection(config: LLM-Config): Promise<boolean> {
    return await window.electronAPI.llm.testConnection(config);
  }

  async sendMessageStream(
    messages: Message[],
    config: LLM-Config,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    return await window.electronAPI.llm.sendMessageStream(messages, config, onChunk);
  }
}
```

### Environment Detection and Initialization
```typescript
// useServiceInitializer.ts
export function useServiceInitializer() {
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  if (isElectron) {
    return {
      llmService: new ElectronLLMProxy(),
      storageProvider: new ElectronStorageProxy()
    };
  } else {
    return {
      llmService: new LLMService(new WebStorageProvider()),
      storageProvider: new WebStorageProvider()
    };
  }
}
```

## 📋 Milestones

- [ ] Complete solution design and documentation synchronization.
- [ ] Complete code refactoring.
- [ ] The desktop application runs successfully under the new architecture.
- [ ] Implement file-based persistent storage in the main process.

## 💡 Core Experience

1. **Cross-Process Communication Principle**: Should be based on stable, simple, and serializable data structures and interfaces.
2. **Avoid Underlying Object Proxies**: Do not attempt to proxy complex, underlying native objects.
3. **Separation of Concerns**: The main process focuses on services, and the renderer process focuses on the UI.
4. **Interface Stability**: High-level interfaces are more stable than underlying APIs and are more suitable for cross-process communication.

## 🔗 Related Documents

- [Current Desktop Architecture](./README.md)
- [Desktop Application Implementation Record](./desktop-implementation.md)
- [IPC Communication Best Practices](./ipc-best-practices.md)

---

**Task Status**: 📋 Planning Stage
**Priority**: High
**Last Updated**: 2025-07-01
