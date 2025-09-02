# Web and Extension Architecture Refactoring Plan

## 1. Current Status and Problems

**Latest Status (2024-12-29):** Both the underlying and upper-level application refactoring have been completed.

- **Completed**: The `@prompt-optimizer/core` and `@prompt-optimizer/ui` packages have successfully removed all singleton services.
- **Resolved**: The entry files (`App.vue`) for the web application (`@prompt-optimizer/web`) and the browser extension (`@prompt-optimizer/extension`) have been adapted, and the application **can start and run normally**.

This plan aims to document and summarize the adaptation process of `App.vue`.

## 2. Refactoring Goals

- **Fix the application startup failure issue** so that it can run normally.
- **Fully align the upper-level application with the underlying service architecture**, using a unified `useAppInitializer` for service initialization.
- **Simplify `App.vue`** so that it is only responsible for layout and initialization, delegating business logic entirely to Composables.
- **Adopt the latest Composable architecture**, consuming Composables that return a `reactive` object instead of multiple `ref`s.

## 3. Implementation Plan

### Phase 1: Purify the UI Package (Completed) ✅

1.  **File**: `packages/ui/src/index.ts`
    -   **Task**: Remove all service instances re-exported from `@prompt-optimizer/core`.
    -   **Status**: ✅ **Completed**. The UI package now only exports components, Composables, factory functions, and types.

### Phase 2: Create a Unified Application Initializer (Completed) ✅

1.  **File**: `packages/ui/src/composables/useAppInitializer.ts` (New)
    -   **Task**: Create a Vue Composable that creates and returns instances of all necessary services based on the environment (Web/Electron).
    -   **Status**: ✅ **Completed**.

### Phase 3: Refactor the Application Entry Point (Completed) ✅

This phase was the core of this refactoring and has now been **successfully completed**.

1.  **File**: `packages/web/src/App.vue` and `packages/extension/src/App.vue`
    -   **Status**: ✅ **Completed**. The application can now start normally.
    -   **Final Implementation Plan**:
        1.  **[x] Clean up invalid imports**:
            -   In `<script setup>`, deleted all direct imports of singleton services (`modelManager`, `templateManager`, etc.).
        2.  **[x] Depend on `useAppInitializer`**:
            -   Called `const { services, isInitializing } = useAppInitializer()` at the top level as the sole source for all services.
        3.  **[x] Call all business Composables at the top level**:
            -   Following the results of the [Composable Refactoring Plan](./composables-refactor-plan.md), all business logic Composables (e.g., `usePromptOptimizer`, `useModelManager`) are called at the top level of `<script setup>`.
            -   These Composables accept the `services` ref as a parameter and return a single `reactive` object.
            -   **Example Code**:
                ```typescript
                // App.vue
                const { services, isInitializing, error } = useAppInitializer();

                // Call directly at the top level, passing the services ref
                const modelManagerState = useModelManager(services);
                const templateManagerState = useTemplateManager(services);
                const optimizerState = usePromptOptimizer(services);
                // ... other Composables
                ```
        4.  **[x] Update the template (`<template>`)**:
            -   All data bindings and event handling in the template are now linked to the properties of the `reactive` object returned by the Composables (e.g., `optimizerState.isIterating`).
            -   This resolved the previous prop type validation failure issue caused by passing `ref` objects.
        5.  **[x] Fix `computed` and type errors**:
            -   Corrected the `computed` properties in `App.vue` so that they no longer incorrectly access `.value`.
            -   Added missing i18n translation entries, such as `promptOptimizer.originalPromptPlaceholder`.
            -   Correctly passed deep dependencies like `templateLanguageService` via `provide`.
        6.  **[x] Promote `provide`/`inject`**:
            -   Retained `provide('services', services)` and encouraged child components (e.g., `ModelSelect.vue`, `DataManager.vue`) to get services via `inject`, reducing props passing.

## 4. Expected Results (Achieved)

- [x] The web and extension applications are back to normal, with functionality consistent with before the refactoring.
- [x] The `App.vue` code has become extremely concise, responsible only for "initialization" and "layout".
- [x] The entire application's startup process is clear, robust, and fully follows the best practices of dependency injection and reactive data flow.
- [x] A solid foundation has been laid for adding new features on all platforms (Web/Extension/Desktop) in the future.

## 5. Latest Progress: Purify UI Subcomponents (Completed) ✅

**Background**: After `App.vue` completed its adaptation to `useAppInitializer`, it was discovered that several of its subordinate UI components (`@prompt-optimizer/ui/components/*`) were still directly importing singleton services from `@prompt-optimizer/core`. This violated the new dependency injection architecture and could lead to potential bugs and testing difficulties.

**Task**: Completely remove the direct dependency of the UI component layer on service singletons, and instead receive service instances via `props`.

**Implementation Checklist**:
- [x] **`TemplateSelect.vue`**: Removed direct import of `templateManager`, now passed in via props.
- [x] **`ModelSelect.vue`**: Removed direct import of `modelManager`, now passed in via props.
- [x] **`OutputDisplayCore.vue`**: Removed direct import of `compareService`, now passed in via props.
- [x] **`HistoryDrawer.vue`**: Removed direct import of `historyManager` (this component already receives data via props, just needed to clean up unused imports).
- [x] **`BuiltinTemplateLanguageSwitch.vue`**: Removed direct imports of `templateManager` and `templateLanguageService`, now passed in via props.
- [x] **`DataManager.vue`**: Removed direct import of `dataManager`, now passed in via props or injected from `services`.
- [x] **`TemplateManager.vue`**: Ensured that `templateManager` and `templateLanguageService` are obtained from the `services` injection and correctly passed to child components.

**Results**:
- All core UI display components have been decoupled from the service layer.
- The reusability and testability of the components have been significantly improved.
- The entire front-end architecture is more in line with the principle of "depending on interfaces, not implementations".
- The architectural consistency of the project is guaranteed, clearing the way for future maintenance and iteration.
