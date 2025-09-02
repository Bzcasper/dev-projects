# Electron IPC Best Practices

## Problem Background

In Electron applications, Vue's reactive objects cannot be passed directly through IPC (Inter-Process Communication), which leads to the "An object could not be cloned" error. This is because Vue's reactive objects contain non-serializable proxy wrappers.

## Core Principles

### 1. The ElectronProxy Layer Automatically Handles Serialization

✅ **Current Approach**:
```javascript
// You can now pass Vue reactive objects directly; ElectronProxy will automatically serialize them.
await modelManager.addModel(newModel.value.key, {
  name: newModel.value.name,
  llmParams: newModel.value.llmParams // ElectronProxy will automatically clean up the reactive wrapper.
})
```

**Architectural Advantages**:
-   Vue components do not need to worry about serialization details.
-   All serialization logic is centralized in the ElectronProxy layer.
-   Automatic protection makes it hard to miss.
-   Cleaner code and a better developer experience.

### 2. Automatic Serialization Handling

**The ElectronProxy layer automatically handles serialization**:
-   All ElectronProxy classes have built-in serialization handling.
-   Vue components do not need to manually call serialization functions.
-   You can pass Vue reactive objects directly, and the proxy layer will automatically clean them up.

**Technical Implementation**:
-   Uses the `safeSerializeForIPC` function from `packages/core/src/utils/ipc-serialization.ts`.
-   Serialization is automatically called in every necessary ElectronProxy method.
-   Ensures 100% IPC compatibility.

### 3. How to Identify the Problem

When you see the following errors, it indicates an IPC serialization issue:
-   `An object could not be cloned`
-   `DataCloneError`
-   `Failed to execute 'postMessage'`

## Common Problem Scenarios

### 1. Model Management
```javascript
// ✅ You can now pass Vue reactive objects directly.
await modelManager.addModel(key, {
  llmParams: formData.value.llmParams // ElectronProxy will automatically serialize.
})
```

### 2. History Management
```javascript
// ✅ You can now pass Vue reactive objects directly.
await historyManager.createNewChain({
  metadata: { mode: optimizationMode.value } // ElectronProxy will automatically serialize.
})
```

### 3. Template Management
```javascript
// ✅ You can now pass Vue reactive objects directly.
await templateManager.saveTemplate({
  content: form.value.messages // ElectronProxy will automatically serialize.
})
```

## Development Checklist

Development is now simpler. You only need to check:

-   [ ] Has it been tested in the desktop environment?
-   [ ] Are there any direct IPC calls that bypass ElectronProxy?
-   [ ] Does the new ElectronProxy method include serialization handling?

## Debugging Tips

### 1. Check Object Type
```javascript
console.log('Object type:', Object.prototype.toString.call(obj))
console.log('Is reactive:', obj.__v_isReactive)
console.log('Is ref:', obj.__v_isRef)
```

### 2. Test Serialization
```javascript
try {
  JSON.stringify(obj)
  console.log('Object is serializable')
} catch (error) {
  console.error('Object is not serializable:', error)
}
```

### 3. Use Developer Tools
In Chrome DevTools, reactive objects will be displayed as the `Proxy` type.

## Architectural Recommendations

### 1. Unified Handling in the ElectronProxy Layer
Serialization handling has been moved to the ElectronProxy layer, so Vue components can call it directly:

```javascript
// In a component method - now much simpler
const handleSave = async () => {
  await service.save(formData.value) // Pass directly, no manual serialization needed.
}
```

### 2. Standard for New ElectronProxy Methods
When adding a new ElectronProxy method, serialize complex object parameters:

```typescript
async newMethod(complexObject: SomeType): Promise<ResultType> {
  // Serialize the complex object parameter
  const safeObject = safeSerializeForIPC(complexObject);
  return this.electronAPI.someService.newMethod(safeObject);
}
```

### 3. Type Safety
The ElectronProxy interface should accept Vue reactive objects and handle them automatically internally:

```typescript
interface IModelManager {
  addModel(key: string, config: ModelConfig | Ref<ModelConfig>): Promise<void>
  // The interface level supports reactive objects; the implementation level handles serialization automatically.
}
```

## Performance Considerations

-   The ElectronProxy layer uses `JSON.parse(JSON.stringify())` to ensure 100% compatibility.
-   Serialization only occurs at the IPC boundary and does not affect Vue component performance.
-   Avoid frequent service calls within the render loop.
-   For large objects, consider batch processing or passing data in smaller chunks.

## Testing Strategy

1.  **Unit Tests**: Ensure the serialization function correctly handles various data types.
2.  **Integration Tests**: Test all IPC calls in the desktop environment.
3.  **Regression Tests**: After any code change involving IPC, test in the desktop environment.

## Summary

The current architecture has greatly simplified the use of Electron IPC:

1.  **Vue Component Layer**: Pass reactive objects directly without worrying about serialization.
2.  **ElectronProxy Layer**: Automatically handles serialization to ensure IPC compatibility.
3.  **Main Process Layer**: Provides double protection to handle edge cases.
4.  **Developer Experience**: Cleaner code and fewer opportunities for errors.

Remember: **You can now safely pass Vue reactive objects; the architecture will handle it automatically!**

## 📚 Related Documents

-   [112-Desktop IPC Fixes](../archives/112-desktop-ipc-fixes/) - IPC architecture analysis and language switch fix.
-   [115-IPC Serialization Fixes](../archives/115-ipc-serialization-fixes/) - Solution for serializing Vue reactive objects.
-   [Proxy Layer Serialization](../archives/115-ipc-serialization-fixes/proxy-layer-serialization.md) - Technical implementation details.
-   [Architecture Evolution Record](../archives/115-ipc-serialization-fixes/architecture-evolution.md) - The evolution from manual to automatic.
