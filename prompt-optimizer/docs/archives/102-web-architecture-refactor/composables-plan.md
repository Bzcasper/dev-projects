# Vue Composable Architecture Refactoring Plan

## 1. Background and Issues

After the "de-singletonization" refactoring of the core services, a series of serious issues related to Vue's reactivity system and component communication were exposed during application startup. These issues initially manifested as various warnings and errors:

1.  **Property Type Mismatch**: The type of props received by child components did not match the expectations, for example, expecting a `Boolean` but receiving an `Object` (`[Vue warn]: Invalid prop: type check failed`). This issue was prevalent in multiple components like `PromptPanel`.
2.  **Invalid Watch Source**: Composables like `useStorage` caused a `watch` to listen to an `undefined` source because their dependent `services` object had not yet been initialized (`[Vue warn]: Invalid watch source: undefined`).
3.  **Top-Level Call Error**: Attempting to call a Composable within some asynchronous initialization logic caused Vue to throw a `Must be called at the top of a 'setup' function` error.

## 2. Root Cause Analysis

After investigation, these seemingly separate issues all pointed to the same systemic architectural flaw: **improper state encapsulation patterns in Composables**.

Many business logic Composables (e.g., `usePromptOptimizer`, `useModelManager`) returned a plain JavaScript object containing multiple `ref`s, like this:

```typescript
// Old pattern
function usePromptOptimizer() {
  const isIterating = ref(false);
  const someOtherState = ref('');
  return { isIterating, someOtherState };
}
```

When used in `App.vue`:

```html
<!-- App.vue -->
<script setup>
const optimizer = usePromptOptimizer();
</script>

<template>
  <!--
    The problem: optimizer.isIterating is a ref object,
    not its inner value. Vue's template auto-unwrapping does not go deep into object properties.
  -->
  <PromptPanel :is-iterating="optimizer.isIterating" />
</template>
```

The `is-iterating` prop received by the `PromptPanel` component was a `Ref<boolean>` object, not the expected `boolean` value, causing the type check to fail. This issue was at the core of all the chain reactions.

## 3. Solution: Uniformly Return `reactive` Objects

To fundamentally solve the problem, we adopted a unified architectural decision: **refactor all core business Composables to return a single `reactive` object**.

```typescript
// ✅ New pattern
function usePromptOptimizer() {
  const state = reactive({
    isIterating: false,
    someOtherState: '',
  });

  // ... logic code modifies state ...

  return state; // Return a reactive object
}
```

When used in `App.vue`, the problem is solved:

```html
<!-- App.vue (modified) -->
<script setup>
const optimizerState = usePromptOptimizer();
</script>

<template>
  <!--
    Now optimizerState.isIterating is directly a boolean value,
    matching the child component's prop expectation.
  -->
  <PromptPanel :is-iterating="optimizerState.isIterating" />
</template>
```

This pattern ensures that the values passed to child components are primitive values, not `ref` wrappers, while preserving state reactivity across components.

## 4. Implementation Process and Results (Completed) ✅

This refactoring has been **successfully completed**.

**Core Refactoring**:
- [x] **`usePromptOptimizer`**: Refactored to return a `reactive` object.
- [x] **`useModelManager`**: Refactored to return a `reactive` object.
- [x] **`useHistoryManager`**: Refactored to return a `reactive` object.
- [x] **`useTemplateManager`**: Refactored to return a `reactive` object.
- [x] **`usePromptTester`**: Refactored to return a `reactive` object.
- [x] **`useModals`**: Refactored to return a `reactive` object.

**Auxiliary Fixes**:
- [x] **Fixed `useStorage`**: The `ThemeToggleUI` and `LanguageSwitch` components were modified to get the `services` instance via `inject` and pass it to `useStorage`, solving the problem of premature dependency initialization.
- [x] **Adapted `App.vue`**: Adjusted template bindings and `computed` properties in `App.vue` to accommodate the new `reactive` state structure and fixed the resulting type errors.
- [x] **Dependency Injection**: In components like `ModelSelect` and `DataManager`, the pattern of using `inject` to directly get dependencies from `services` was promoted, simplifying the `App.vue` template.

**Final Results**:
- Completely resolved all Vue `warn` and `error` messages at startup.
- Established a more robust, predictable, and Vue-best-practice-compliant state management paradigm.
- The application code, especially `App.vue`, has become cleaner and easier to maintain.

## 5. Experience Summary

- **`reactive` vs. Object-wrapped `ref`s**: For a group of highly cohesive reactive states that will be passed or manipulated together, using `reactive` for encapsulation is a better pattern than returning an object containing multiple `ref`s. It effectively avoids deep unwrapping issues and simplifies the consumer-side code.
- **`provide`/`inject` is a powerful tool for service injection**: For global or cross-level services/dependencies (like the `services` object), using `provide`/`inject` is a more elegant and efficient solution than passing `props` down through layers.
- **Systemic problems require systemic solutions**: When faced with a series of seemingly different errors, it is crucial to deeply analyze their common root cause. By identifying the core "state encapsulation pattern" issue, all superficial symptoms were resolved at once.
