# Vue Composable Architecture Refactoring Implementation Record

## 📋 Task Overview

Resolve the error caused by calling Vue Composable functions in asynchronous callbacks: `Uncaught (in promise) SyntaxError: Must be called at the top of a 'setup' function`. Refactor all Composable files to implement the "top-level declaration, reactive connection, internal autonomy" design pattern.

## 🎯 Objectives

- Resolve the timing issue of Vue Composable calls
- Establish a unified service interface definition
- Implement reactive service dependency injection
- Improve code consistency and maintainability

## 📅 Execution Record

### ✅ Completed Steps

#### 1. Create a Unified Service Interface Definition
- **Completion Time**: Morning of 2025-07-05
- **Actual Result**: Successfully created the `packages/ui/src/types/services.ts` file, defining the `AppServices` interface
- **Experience Summary**: Centralized type definitions improve code consistency and maintainability

#### 2. Refactor Core Composable Files
- **Completion Time**: Afternoon of 2025-07-05
- **Actual Result**: Successfully refactored 8 major Composable files to accept the `services: Ref<AppServices | null>` parameter
- **Experience Summary**: A unified parameter pattern makes the code more consistent and easier to understand

#### 3. Update useAppInitializer
- **Completion Time**: Evening of 2025-07-05
- **Actual Result**: Enhanced error handling and logging, added an `error` state
- **Experience Summary**: Good error handling is crucial for debugging

#### 4. Update useModals
- **Completion Time**: Evening of 2025-07-05
- **Actual Result**: Included useModals in the new architecture, accepting the services parameter
- **Experience Summary**: Maintaining architectural consistency is very important for long-term maintenance

#### 5. Update Documentation
- **Completion Time**: Evening of 2025-07-05
- **Actual Result**: Updated architecture documents and experience records
- **Experience Summary**: Timely recording of architectural decisions and experiences is important for team knowledge transfer

### ⚠️ Unresolved Issues

#### 6. Update App.vue
- **In Progress**: 2025-07-06
- **Current Status**: Encountered type errors, need further resolution
- **Issue Record**:
  - The `services` object does not match the `AppServices` interface, especially the `dataManager` property
  - Tried to use type assertion `as any` as a temporary solution, but type errors persist
  - Need to further investigate the `DataManager` type definition and implementation

## 🔧 Core Solution

### Architecture Pattern
```typescript
// ❌ Error: Calling Composable in an async callback
onMounted(async () => {
  const services = await initServices();
  const modelManager = useModelManager(); // Error: Not called at the top of setup
});

// ✅ Correct: Top-level declaration, reactive connection
const { services } = useAppInitializer(); // Called at the top level
const modelManager = useModelManager(services); // Called at the top level, passing the services reference

// Internal implementation: Reactive connection
export function useModelManager(services: Ref<AppServices | null>) {
  // State definition...

  // Reactive connection: Watch for service readiness
  watch(services, (newServices) => {
    if (!newServices) return;
    // Use the ready services...
  }, { immediate: true });

  return { /* Return state and methods */ };
}
```

### Service Interface Definition
```typescript
// packages/ui/src/types/services.ts
export interface AppServices {
  storageProvider: IStorageProvider;
  modelManager: IModelManager;
  templateManager: ITemplateManager;
  historyManager: IHistoryManager;
  dataManager: DataManager;
  llmService: ILLMService;
  promptService: IPromptService;
}
```

## 📊 Progress Status

**80% of Core Objectives Achieved**:
- ✅ Resolved the `Must be called at the top of a 'setup' function` error
- ✅ Implemented a unified, predictable Composable design pattern
- ✅ Improved code maintainability and robustness
- ✅ Completed comprehensive documentation updates
- ❌ Type errors in App.vue still need to be resolved

**Technical Implementation**:
- Created a centralized `AppServices` interface
- Refactored 9 Composable files to use a unified parameter pattern
- Enhanced error handling and logging in `useAppInitializer`
- Adopted a "fail-fast" pattern to expose potential issues early

**Architectural Features**:
- All Composables are called at the top level of `<script setup>`
- Composables accept a `services: Ref<Services | null>` parameter
- Internally, `watch(services, ...)` is used to react to service readiness
- Clear, unidirectional dependency relationships

## 🎯 Next Steps

1. **Resolve App.vue Type Errors**:
   - Deeply investigate the `DataManager` type definition and implementation
   - Check the object structure returned by `useAppInitializer`
   - May need to adjust the `AppServices` interface or service implementation

2. **Add Error Handling UI**:
   - Utilize the `error` state returned by `useAppInitializer`
   - Add a user-friendly error message interface

3. **Write Architecture Guide**:
   - Create a detailed architecture guide for new developers
   - Explain the correct way to use Composables

## 💡 Core Experience Summary

1. **Vue Reactive Context**: Vue Composables must be called synchronously at the top level of `<script setup>`
2. **Reactive Connection Pattern**: Use the `watch(services, ...)` pattern to handle asynchronous initialization of services
3. **Fail-Fast Principle**: In a development environment, exposing problems quickly is more valuable than hiding them
4. **Unified Architecture**: Maintain a consistent architectural pattern for all Composables
5. **Type System Challenges**: Complex type systems can lead to interface mismatch issues

---

**Task Status**: ⚠️ Partially complete, type errors need to be resolved
**Completion**: 80%
**Last Updated**: 2025-07-01
