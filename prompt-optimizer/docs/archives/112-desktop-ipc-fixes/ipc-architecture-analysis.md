# IPC Architecture Analysis and Development Experience

## 📝 Background

Analysis and resolution experience for IPC architecture issues encountered during Desktop version development.

## 🔍 Architectural Difference Analysis

### 1. Web Environment vs. Desktop Environment

**Web Environment (Single Process):**
```
Vue Component → Direct Call → Service Instance
```

**Desktop Environment (Multi-Process):**
```
Vue Component → ElectronProxy → IPC → Main Process → Service Instance
```

### 2. Common Problem Patterns

#### Problem 1: Missing Interface Contract
```typescript
// ❌ Incomplete interface definition
interface ITemplateManager {
  getTemplate(id: string): Promise<Template>;
  // Missing language-related methods
}

// ✅ Complete interface definition
interface ITemplateManager {
  getTemplate(id: string): Promise<Template>;
  getCurrentBuiltinTemplateLanguage(): Promise<BuiltinTemplateLanguage>;
  changeBuiltinTemplateLanguage(language: BuiltinTemplateLanguage): Promise<void>;
}
```

#### Problem 2: Incomplete Proxy Implementation
```typescript
// ❌ Proxy class missing methods
class ElectronTemplateManagerProxy implements ITemplateManager {
  async getTemplate(id: string): Promise<Template> {
    return this.electronAPI.getTemplate(id);
  }
  // Missing implementation of other methods
}

// ✅ Complete proxy implementation
class ElectronTemplateManagerProxy implements ITemplateManager {
  async getTemplate(id: string): Promise<Template> {
    return this.electronAPI.getTemplate(id);
  }

  async getCurrentBuiltinTemplateLanguage(): Promise<BuiltinTemplateLanguage> {
    return this.electronAPI.getCurrentBuiltinTemplateLanguage();
  }
}
```

#### Problem 3: Incomplete IPC Link
```javascript
// preload.js - Missing method exposure
window.electronAPI = {
  template: {
    getTemplate: (id) => ipcRenderer.invoke('template-getTemplate', id),
    // Missing language-related methods
  }
}

// main.js - Missing handler
ipcMain.handle('template-getTemplate', async (event, id) => {
  // Handler logic
});
// Missing language-related handlers
```

## 🛠️ Fix Strategy

### 1. Interface-First Design
```typescript
// Step 1: Define the complete interface
export interface ITemplateManager {
  // All required methods
}

// Step 2: Implement for the Web environment
export class TemplateManager implements ITemplateManager {
  // Complete implementation
}

// Step 3: Implement the Electron proxy
export class ElectronTemplateManagerProxy implements ITemplateManager {
  // Complete proxy implementation
}
```

### 2. IPC Link Integrity Check
```
Vue component call → Check proxy method → Check preload exposure → Check main handler → Check service method
```

### 3. Error Handling Principle
```typescript
// ❌ Masking errors
async someMethod() {
  try {
    return await this.service.method();
  } catch (error) {
    return null; // Masks the error
  }
}

// ✅ Propagating errors
async someMethod() {
  return await this.service.method(); // Let the error propagate naturally
}
```

## 🎯 Development Checklist

### IPC Feature Development Check
- [ ] Is the interface definition complete?
- [ ] Is the Web environment implementation complete?
- [ ] Is the Electron proxy implementation complete?
- [ ] Does `preload.js` expose all methods?
- [ ] Does `main.js` have corresponding handlers?
- [ ] Is error handling correct?
- [ ] Have both environments been tested?

### Architecture Violation Check
- [ ] Does `preload.js` only forward calls, without business logic?
- [ ] Are all methods asynchronous?
- [ ] Is a unified error handling format used?
- [ ] Are there any direct cross-process calls?

## 💡 Best Practices

### 1. Progressive Development
1. First, implement and test in the Web environment.
2. Define the complete interface.
3. Implement the Electron proxy.
4. Complete the IPC link.
5. Test in the Desktop environment.

### 2. Debugging Techniques
```javascript
// Add logs at each step
console.log('[Vue] Calling method:', methodName);
console.log('[Proxy] Forwarding to IPC:', methodName);
console.log('[Main] Handling IPC:', methodName);
console.log('[Service] Executing:', methodName);
```

### 3. Type Safety
```typescript
// Use strict type checking
interface ElectronAPI {
  template: {
    [K in keyof ITemplateManager]: ITemplateManager[K];
  };
}
```

## 🔗 Related Experience

This architectural analysis provides a foundation for subsequent development:
- Established a complete IPC development process.
- Formed an interface-first design principle.
- Created a comprehensive development and debugging checklist.

This experience was further applied in the subsequent serialization optimizations (115).
