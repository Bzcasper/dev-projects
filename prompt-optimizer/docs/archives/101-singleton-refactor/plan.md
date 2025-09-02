# Service Singleton Pattern Refactoring Plan

## 1. Problem Background

After in-depth investigation, we found a core flaw in the current architecture: **service instances are created too early (Eager Instantiation) when modules are imported**, and are exported and passed between multiple packages as singletons.

This has led to the following serious problems:

1.  **"Ghost" Services**: In the rendering process of Electron, a set of web-side services based on `Dexie` (IndexedDB) was unexpectedly created. Although these services were not ultimately used, they consumed resources and created the illusion of data confusion.
2.  **State Inconsistency**: Because the creation of service instances is not aware of the running environment, there is a state inconsistency between the UI process (which sees the state of the web version instance) and the main process (which actually executes the logic).
3.  **Architectural Coupling**: The `@prompt-optimizer/ui` package unnecessarily exports core service instances, making its responsibilities unclear and more like a service transit station than a pure UI library.
4.  **Testing Difficulty**: The singleton pattern makes it very difficult to isolate and mock services in tests.

## 2. Refactoring Goals

The core goal of this refactoring is to **achieve lazy initialization and dependency injection of services**, ensuring that the only correct service instance is created only when needed, in the correct environment.

- **Remove Singleton Exports**: No package (`core`, `ui`) should export pre-created service instances anymore.
- **Unified Initialization Entry Point**: Create a single, environment-aware application initializer.
- **Clear Division of Responsibilities**: `core` only provides service classes and factory functions, `ui` only provides UI components and Hooks, and the application entry point (`App.vue`) is responsible for orchestration.

## 3. Implementation Plan and Results

This refactoring has been **successfully completed**. All core services have been migrated from the singleton pattern to the factory function and dependency injection pattern, achieving the goal of creating service instances on demand and according to the environment.

### Phase 1: Refactor the Core Package, Remove Singleton Exports (Completed) ✅

**Goal**: Change the singleton export pattern of all services (`export const service = new Service()`) to the factory function pattern (`export function createService()`).

**Steps**:
1.  [x] **`services/storage/factory.ts`**: Remove the `storageProvider` singleton export.
2.  [x] **`services/model/manager.ts`**: Remove the `modelManager` singleton export and make its factory function accept dependencies.
3.  [x] **`services/template/manager.ts`**: Remove the `templateManager` singleton export and make its factory function accept dependencies.
4.  [x] **`services/history/manager.ts`**: Remove the `historyManager` singleton export and make its factory function accept dependencies.
5.  [x] **`index.ts`**: Update the entry file to ensure that only modules and factory functions are exported.

**Deviations and Handling During the Process**:

*   **Deep Dependency of `TemplateManager`**:
    *   **Discovery**: `TemplateManager` depends on another undiscovered singleton `templateLanguageService`.
    *   **Action**: The same refactoring was performed on `services/template/languageService.ts`, removing the singleton and creating the `createTemplateLanguageService` factory function. Accordingly, `createTemplateManager` now accepts `storageProvider` and `languageService` instances as parameters.

*   **Export Cleanup of `index.ts`**:
    *   **Discovery**: `index.ts` exported the `electron-proxy.ts` file, which belongs to the application layer.
    *   **Action**: Cleaned up `index.ts`, removing these exports that should not be exposed by the `core` package, making the API purer.

### Phase 2: Purify the UI Package, Stop Exporting Services (Completed) ✅

**Goal**: Let `@prompt-optimizer/ui` return to its pure UI library responsibility.

6.  **`packages/ui/src/index.ts`**
    - [x] **Remove** all service instances re-exported from `@prompt-optimizer/core`. The UI package has returned to its pure UI library responsibility.

### Phase 3: Create a Unified Application Initializer (Completed) ✅

**Goal**: Converge all initialization logic into a reusable `composable`.

7.  **File**: `packages/ui/src/composables/useAppInitializer.ts` (New)
    - [x] **Create the file** and implement the following logic:
        - Import all `create...` factory functions and Electron proxy classes.
        - Define `services` and `isInitializing` refs.
        - In `onMounted`, use `isRunningInElectron()` to determine the environment:
            - **If Electron**: Create **proxy** instances of all services.
            - **If Web**: Create **real** service instances of all services (including `storageProvider`).
            - Aggregate all service instances into the `services` ref.
            - Update the `isInitializing` state.

### Phase 4: Refactor the Application Entry Point (`App.vue`) (Completed) ✅

**Goal**: Make the application entry point concise, only responsible for consuming the services returned by the initializer.

8.  **Modify `packages/web/src/App.vue` & `packages/extension/src/App.vue`**
    - [x] **Completed**: The application entry points for the web and extension have been refactored to consume the services returned by `useAppInitializer`, achieving a clear initialization process.
    - [x] **Deepened**: Further refactored all UI subcomponents under `App.vue` (such as `ModelSelect`, `TemplateSelect`, etc.) so that they no longer directly import service singletons, but receive service instances through `props` or `inject`, completely unifying the architecture of the UI layer.

## 4. Expected Results (Achieved)

-   [x] **No "Ghost" Services**: `Dexie` will only be created once in the web environment.
-   [x] **Clear Data Flow**: The dependency relationship becomes `useAppInitializer` -> `App.vue` -> `Components`, which is unidirectional and clear.
-   [x] **Robust Initialization**: All services are created at the right time with the right configuration.
-   [x] **Complete Solution to State Inconsistency**: Because the creation logic of service instances is unified and unique.

This plan will fundamentally solve the architectural problems we have found and lay a solid foundation for the future maintainability and scalability of the project.

## 5. Refactoring Reflection and Subsequent Decisions

This refactoring successfully transformed the core services from a singleton pattern to a factory function pattern, solving the fundamental problems of environment isolation and state inconsistency. However, in the process of fixing the large number of test failures that resulted, we also summarized some valuable experience and design decisions that need further improvement:

### 5.1 Regarding Forcing the Call of `ensureInitialized()`

- **Current Situation Reflection**: The current design requires the caller to manually call `await manager.ensureInitialized()` after obtaining a `Manager` instance to complete the asynchronous initialization. Although this decouples the instance creation and initialization process, it also exposes internal implementation details and increases the burden on the caller.
- **Optimization Direction**: A more ideal design is to make the factory function (such as `createTemplateManager`) itself an asynchronous function, which handles all initialization logic internally and directly returns a fully usable instance `Promise<Manager>`. This way, the caller only needs to `await` once, and the interface is more concise and better encapsulated.
- **Decision**: **Temporarily accept** the current design, but mark it as a **point for future optimization**. The current core task is to stabilize the code after refactoring.

### 5.2 Regarding Error Handling: Adhering to the "Fail-fast" Principle

- **Problem Discovery**: The refactored `TemplateManager`, when encountering a storage error during initialization, would silently downgrade to using built-in templates instead of throwing an error.
- **Decision**: This concealed serious underlying problems and violated the "Fail-fast" principle. We decided to **correct this behavior**. When `TemplateManager` encounters critical errors such as storage access during initialization, it **must throw an exception upwards**. The top-level logic of the application will then catch it and decide how to handle it (e.g., report an error to the user, enter safe mode, etc.).

### 5.3 Regarding the Rigor of Test Code

- **Problem Discovery**: Some old unit tests were not rigorous enough.
- **Decision and Results**: **Fixed**. During the test fixing phase of this refactoring, a large number of assertions were rewritten, and the stability and reliability of the tests were enhanced using methods such as `expect.objectContaining`. All core tests have passed.

### 5.4 Chain Reaction and Response at the UI Layer

- **Discovery**: The "de-singletonization" refactoring of the core services had a greater impact on the upper-level UI and Composables than expected. After the original pattern of directly importing singletons was broken, it triggered a series of chain reactions, including `property type check failure`, `loss of reactive state`, and `service not initialized`.
- **Response**: We developed a dedicated [`composables-refactor-plan.md`](./composables-refactor-plan.md) and [`web-refactor-plan.md`](./web-refactor-plan.md) for this. The core countermeasures were: 1) Refactor Composables that return multiple `ref`s to return a single `reactive` object to solve the property passing problem. 2) At the component level, inject services through the `provide/inject` mechanism to reduce `props drilling`. This experience shows that major changes in the underlying architecture must be accompanied by a full assessment of the impact on the upper-level application and a detailed transformation plan.

## 6. Detailed Modification Checklist

All items in this checklist have been completed in recent commits.

### **Phase 1: Refactor the Core Package**

1.  **File**: `packages/core/src/services/storage/factory.ts`
    - [x] **Delete** (approx. L125): `export const storageProvider = StorageFactory.createDefault();`

2.  **File**: `packages/core/src/services/model/manager.ts`
    - [x] **Delete** (approx. L427): `export const modelManager = ...`
    - [x] **Modify** (approx. L428): `export function createModelManager(storageProvider?: IStorageProvider): ModelManager`
        - **To**: `export function createModelManager(storageProvider: IStorageProvider): ModelManager`
        - **Remove**: `storageProvider = storageProvider || StorageFactory.createDefault();`

3.  **File**: `packages/core/src/services/template/manager.ts`
    - [x] **Delete** (approx. L300): `export const templateManager = ...`

4.  **File**: `packages/core/src/services/history/manager.ts`
    - [x] **Delete** (approx. L230): `export const historyManager = ...`

5.  **File**: `packages/core/src/services/data/manager.ts`
    - [x] **Delete** (approx. L80): `export const dataManager = ...`
    - [x] **Modify** (constructor): `constructor()` -> `constructor(modelManager: IModelManager, templateManager: ITemplateManager, historyManager: IHistoryManager)`
    - [x] **Modify** (factory function): `createDataManager()` -> `createDataManager(modelManager: IModelManager, templateManager: ITemplateManager, historyManager: IHistoryManager)`

### **Phase 2: Purify the UI Package**

6.  **File**: `packages/ui/src/index.ts`
    - [x] **Delete** (approx. L45-53):
        ```typescript
        export {
            templateManager,
            modelManager,
            historyManager,
            dataManager,
            storageProvider,
            createLLMService,
            createPromptService
        } from '@prompt-optimizer/core'
        ```
    - [x] **Add**: Export `createDataManager` and other necessary factory functions.

### **Phase 3: Create a Unified Application Initializer**

7.  **File**: `packages/ui/src/composables/useAppInitializer.ts` (New)
    - [x] **Create the file** and implement the following logic:
        - Import all `create...` factory functions and Electron proxy classes.
        - Define `services` and `isInitializing` refs.
        - In `onMounted`, use `isRunningInElectron()` to determine the environment:
            - **If Electron**: Create **proxy** instances of all services.
            - **If Web**: Create **real** service instances of all services (including `storageProvider`).
            - Aggregate all service instances into the `services` ref.
            - Update the `isInitializing` state.

### **Phase 4: Refactor the Application Entry Point**

8.  **File**: `packages/web/src/App.vue` & `packages/extension/src/App.vue`
    - [x] **Remove**: All imports of service singletons like `modelManager`, `templateManager`, `historyManager`.
    - [x] **Replace**:
        - **Old**: `import { modelManager, ... } from '@prompt-optimizer/ui'`
        - **New**: `import { useAppInitializer } from '@prompt-optimizer/ui'`
    - [x] **Call**: `const { services, isInitializing } = useAppInitializer();`
    - [x] **Wrap**: Use `v-if="!isInitializing"` on the root element of the template, and add a loading state with `v-else`.
    - [x] **Pass**: Pass `services.value` as props to the required child components, or use `services.value.modelManager` etc. in `composables`.
    - [x] **Clean up**: Delete the manual initialization logic in `onMounted`.
