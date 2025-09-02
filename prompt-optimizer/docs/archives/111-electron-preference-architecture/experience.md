# Development Experience Summary

## 🎯 Core Experience

### 1. Electron API Initialization Timing Management
**Experience**: In an Electron environment, there is a timing race between the API exposure from the preload script and the component initialization in the renderer process.

**Best Practice**:
```typescript
// ❌ Incorrect approach: Directly accessing the API
window.electronAPI.preference.get(key, defaultValue)

// ✅ Correct approach: Check before accessing
if (isElectronApiReady()) {
  await window.electronAPI.preference.get(key, defaultValue)
} else {
  await waitForElectronApi()
  // Then access it
}
```

**Applicable Scenarios**: Service initialization in all Electron applications.

### 2. Vue Component Initialization and Service Dependencies
**Experience**: Vue's `onMounted` hook can be triggered before services are fully ready, leading to race conditions.

**Solution**:
-   Use an asynchronous initialization pattern.
-   Implement lazy loading at the service layer.
-   Add a service readiness check.

**How to Avoid**: Do not immediately call services that may not be ready when a component is mounted.

### 3. API Path Standardization
**Experience**: The API path exposed by `preload.js` must exactly match the path accessed in the code.

**Standard Pattern**:
```typescript
// preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  preference: { /* API methods */ }
})

// Code access
window.electronAPI.preference.get()
```

**Common Errors**:
-   Preload exposes under `electronAPI`, but code accesses `api`.
-   Inconsistent API structure leads to `undefined` access.

## 🛠️ Technical Implementation Experience

### 1. Environment Detection Best Practices
```typescript
// Multi-level detection to ensure the API is fully available
export function isElectronApiReady(): boolean {
  const window_any = window as any;
  const hasElectronAPI = typeof window_any.electronAPI !== 'undefined';
  const hasPreferenceApi = hasElectronAPI &&
    typeof window_any.electronAPI.preference !== 'undefined';
  return hasElectronAPI && hasPreferenceApi;
}
```

**Key Points**:
-   Detect not just the environment, but also the availability of specific APIs.
-   Use a type-safe detection method.
-   Provide detailed debugging logs.

### 2. Asynchronous Waiting Pattern
```typescript
export function waitForElectronApi(timeout = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    // Check immediately to avoid unnecessary waiting
    if (isElectronApiReady()) {
      resolve(true);
      return;
    }

    // Polling check + timeout protection
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isElectronApiReady()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 50);
  });
}
```

**Design Points**:
-   **Fast Path**: Return immediately if already ready.
-   **Reasonable Interval**: 50ms balances performance and responsiveness.
-   **Timeout Protection**: Prevents infinite waiting.
-   **Resource Cleanup**: Clean up the timer promptly.

### 3. Proxy Service Protection Pattern
```typescript
class ElectronPreferenceServiceProxy {
  private ensureApiAvailable() {
    if (!window?.electronAPI?.preference) {
      throw new Error('Electron API not available');
    }
  }

  async get<T>(key: string, defaultValue: T): Promise<T> {
    this.ensureApiAvailable(); // Check before every call
    return window.electronAPI.preference.get(key, defaultValue);
  }
}
```

**Design Principles**:
-   **Defensive Programming**: Check before every call.
-   **Clear Error Messages**: Facilitates troubleshooting.
-   **Unified Check Logic**: Avoids repetitive code.

## 🚫 Pitfall Guide

### 1. Common Error Patterns

#### Error 1: Assuming the API is immediately available
```typescript
// ❌ Dangerous: Assuming the API is ready
export function useTemplateManager() {
  const services = inject('services')
  // This might be called before the API is ready
  services.preferenceService.get('template-selection', null)
}
```

#### Error 2: Inconsistent API paths
```typescript
// ❌ Error: Path mismatch
// preload.js: window.electronAPI.preference
// Code access: window.api.preference
```

#### Error 3: Lack of timeout protection
```typescript
// ❌ Dangerous: May wait indefinitely
while (!isApiReady()) {
  await sleep(100) // No timeout mechanism
}
```

### 2. Debugging Tips

#### Add Detailed Logs
```typescript
console.log('[isElectronApiReady] API readiness check:', {
  hasElectronAPI,
  hasPreferenceApi,
});
```

#### Use Breakpoint Debugging
-   Set a breakpoint in the API detection function.
-   Inspect the actual structure of the `window` object.
-   Verify the completeness of the exposed API.

#### Timing Analysis
-   Record timestamps for each initialization step.
-   Analyze the timing relationship between component mounting and API readiness.

## 🔄 Architectural Design Experience

### 1. Service Layer Abstraction
**Experience**: Through service layer abstraction, UI components do not need to know the underlying storage implementation.

**Benefits**:
-   **Environment Agnostic**: The same UI code can run in both Web and Electron environments.
-   **Easy to Test**: The service layer can be easily mocked.
-   **Separation of Concerns**: UI focuses on presentation, service layer handles data.

### 2. Application of the Proxy Pattern
**Experience**: Use the proxy pattern to encapsulate IPC communication in the Electron environment.

**Advantages**:
-   **Unified Interface**: The proxy service implements the same interface.
-   **Error Isolation**: The proxy layer handles communication errors.
-   **Transparent Switching**: Upper-level code does not need to be aware of the environment difference.

### 3. Dependency Injection Pattern
**Experience**: Use dependency injection to manage service instances.

**Implementation**:
```typescript
// Environment-adaptive service creation
if (isRunningInElectron()) {
  preferenceService = new ElectronPreferenceServiceProxy()
} else {
  preferenceService = createPreferenceService(storageProvider)
}

// Unified injection
provide('services', { preferenceService, ... })
```

## 📊 Performance Optimization Experience

### 1. Initialization Performance
-   **Lazy Loading**: Initialize services only when needed.
-   **Parallel Initialization**: Services with no dependencies can be initialized in parallel.
-   **Cache Detection Results**: Avoid repetitive environment checks.

### 2. Runtime Performance
-   **Batch Operations**: Merge multiple configuration read/write operations.
-   **Asynchronous Processing**: Use Promises to avoid blocking the UI.
-   **Error Recovery**: Gracefully handle API call failures.

## 🧪 Testing Strategy Experience

### 1. Environment Mocking
```typescript
// Mock the Electron environment
Object.defineProperty(window, 'electronAPI', {
  value: {
    preference: {
      get: jest.fn(),
      set: jest.fn(),
    }
  }
})
```

### 2. Timing Tests
-   Test access behavior before the API is ready.
-   Test handling of timeout scenarios.
-   Test the safety of concurrent initializations.

### 3. Integration Tests
-   End-to-end testing of the complete initialization flow.
-   Verify consistent behavior across different environments.
-   Test error recovery mechanisms.

## 🔗 Related Resources

### Documentation Links
-   [Electron Context Bridge Documentation](https://www.electronjs.org/docs/api/context-bridge)
-   [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)

### Code Examples
-   For the full implementation, see: `packages/core/src/services/preference/`
-   For test cases, see: `packages/core/tests/`

---

**Summary Date**: 2025-01-01
**Applicable Versions**: Electron 37.x, Vue 3.x
**Experience Level**: Production Environment Verified
