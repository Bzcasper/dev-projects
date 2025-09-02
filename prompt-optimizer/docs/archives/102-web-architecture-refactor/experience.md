# Web Architecture Refactoring Experience Summary

## 📋 Overview

This document summarizes the core experiences accumulated during the web architecture refactoring process, including Vue Composable architecture design, reactive system optimization, and dependency injection best practices.

## 🎯 Vue Composable Architecture Refactoring: Solving Asynchronous Initialization Problems

### Problem Background
Calling a Vue Composable function within an asynchronous callback leads to an error: `Uncaught (in promise) SyntaxError: Must be called at the top of a 'setup' function`. This violates the core rules of the Vue Composition API and requires an architectural refactoring.

### Core Solution: Top-Level Declaration, Reactive Connection, Internal Autonomy
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

### Key Architectural Design Points
1. **Unified Service Interface**: Create an `AppServices` interface to uniformly manage all core services.
2. **Service Initializer**: `useAppInitializer` is responsible for creating and initializing all services.
3. **Composable Parameter Pattern**: All Composables accept a `services` reference as a parameter.

### Key Experiences
1. **Vue Reactive Context**: Vue Composables must be called synchronously at the top level of `<script setup>`.
2. **Reactive Connection Pattern**: Use `watch` to listen for service readiness, instead of calling Composables in callbacks.
3. **Fail-Fast Principle**: In a development environment, exposing problems quickly is more valuable than hiding them.
4. **Unified Architecture**: Maintain a consistent architectural pattern for all Composables.
5. **Type System Challenges**: Complex type systems can lead to interface mismatch issues.

## 🔄 Composable Refactoring: Deep Dive into `reactive` vs `ref`

### Background
To solve the problem of Vue not automatically unwrapping deeply nested `ref`s, we refactored the return values of several core Composables from an object containing multiple `ref`s to a single `reactive` object.

### Core Challenges and Solutions

#### 1. Dependency Injection Failure
- **Symptom**: Components cannot get service instances via `inject`.
- **Root Cause**: Services were created but not correctly registered with the dependency injection system.
- **Solution**: Ensure the complete chain of service creation, registration, and provision.

#### 2. Reactive Interface Mismatch
- **Symptom**: `Cannot read properties of null (reading 'value')` error.
- **Root Cause**: The properties of the `reactive` object do not match the expected `ref` interface.
- **Solution**: Use `toRef` as an adapter.
  ```typescript
  // Create a two-way bound ref for a property of a reactive object
  const selectedTemplateRef = toRef(optimizer, 'selectedTemplate');
  ```

#### 3. Robustness of External APIs
- **Symptom**: API detection failure leads to parsing errors.
- **Root Cause**: Attempting to parse JSON without checking the `Content-Type` of the response.
- **Solution**: Check the `Content-Type` response header before parsing.

### Summary
- `reactive` is suitable for managing a **group** of related states and simplifying top-level APIs.
- `ref` is still a reliable way to pass a **single** reactive variable across components.
- `toRef` and `toRefs` are essential tools for adapting between `reactive` and `ref`.
- The correctness of the dependency injection and service initialization process is the cornerstone of a stable and complex application.

## 💡 Core Experience Summary

1. **Vue Reactive Context**: Vue Composables must be called synchronously at the top level of `<script setup>`.
2. **Reactive Connection Pattern**: Use `watch` to listen for service readiness, keeping the code clean and maintainable.
3. **Fail-Fast Principle**: In a development environment, exposing problems quickly is more valuable than hiding them.
4. **Unified Architecture**: Maintain a consistent architectural pattern for all Composables.
5. **Type System**: Complex type systems require careful handling of interface matching issues.
6. **Reactive System**: `reactive` and `ref` each have their own use cases, and `toRef` is an important adaptation tool.

## 🔗 Related Documents

- [Web Architecture Refactoring Overview](./README.md)
- [Composable Refactoring Implementation Record](./composables-refactor.md)
- [Architectural Design Principles](./design-principles.md)

---

**Document Type**: Experience Summary
**Scope**: Vue Composable Architecture Development
**Last Updated**: 2025-07-01
