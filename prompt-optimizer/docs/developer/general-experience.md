# Project General Experience Guide

This guide collects general experiences and best practices from project development to quickly solve common problems and improve development efficiency.

> **Note**: Function-specific experiences have been archived in the corresponding `docs/archives/` directory.

## 📚 Archived Special Experiences

-   **Modal Component Experience** → [106-template-management/modal-experience.md](../archives/106-template-management/modal-experience.md)
-   **Layout System Experience** → [108-layout-system/experience.md](../archives/108-layout-system/experience.md)
-   **Theme System Experience** → [109-theme-system/experience.md](../archives/109-theme-system/experience.md)
-   **Composable Architecture Experience** → [102-web-architecture-refactor/experience.md](../archives/102-web-architecture-refactor/experience.md)
-   **Large-scale Architecture Refactoring Experience** → [117-import-export-architecture-refactor/experience.md](../archives/117-import-export-architecture-refactor/experience.md)
-   **Version Update System Experience** → [118-desktop-auto-update-system/experience.md](../archives/118-desktop-auto-update-system/experience.md)
-   **MCP Server Module Development Experience** → [120-mcp-server-module/experience.md](../archives/120-mcp-server-module/experience.md)
-   **Multi-Custom Models Support Experience** → [121-multi-custom-models-support/experience.md](../archives/121-multi-custom-models-support/experience.md)

## 🔧 General Development Standards

### API Integration
```typescript
// Unified OpenAI-compatible format
const config = {
  baseURL: "https://api.provider.com/v1",
  models: ["model-name"],
  apiKey: import.meta.env.VITE_API_KEY // Must use Vite environment variables
};
```

**Core Principles**:
-   Separate business logic from API configuration.
-   Only pass parameters explicitly configured by the user; do not set default values.
-   Manage sensitive information through environment variables.

### Error Handling
```typescript
try {
  await apiCall();
} catch (error) {
  console.error('[Service Error]', error); // Development log
  throw new Error('Operation failed, please try again later'); // User-friendly message
}
```

### Testing Standards
```javascript
describe("Functionality Test", () => {
  beforeEach(() => {
    testId = `test-${Date.now()}`; // Unique identifier to avoid conflicts
  });

  // LLM Parameter Test: Test each parameter independently
  it("should handle temperature parameter", async () => {
    await modelManager.updateModel(configKey, {
      llmParams: { temperature: 0.7 } // Test only one parameter
    });
  });
});
```

**Key Points**:
-   Use a dynamic unique identifier.
-   Create an independent test for each LLM parameter.
-   Cover exception scenarios.
-   Properly clean up test state.

### Vue Development Best Practices

#### Attribute Inheritance in Multi-Root Components
**Problem**: When a Vue component has multiple root nodes, it cannot automatically inherit non-prop attributes (like `class`) passed from the parent component and will generate a warning.

**Solution**:
1.  Use `defineOptions({ inheritAttrs: false })` in `<script setup>` to disable the default attribute inheritance behavior.
2.  In the template, manually bind `v-bind="$attrs"` to the **specific** root node where you want to receive these attributes.

**Example**:
```vue
<template>
  <!-- $attrs will apply class, id, etc. attributes to this component -->
  <OutputDisplayCore v-bind="$attrs" ... />
  <OutputDisplayFullscreen ... />
</template>

<script setup>
defineOptions({
  inheritAttrs: false,
});
</script>
```

#### Event Propagation Mechanism in Deeply Nested Components
**Problem**: When a global state change needs to notify deeply nested components, event propagation can be interrupted, causing deep components not to update in time.

**Typical Scenarios**:
-   After a language switch, the main interface component updates correctly, but a component inside a Modal shows the old state.
-   Component hierarchy difference: `App.vue → ComponentA` (direct reference) vs `App.vue → ComponentB → ComponentC` (indirect reference).

**Core Reasons**:
1.  **`v-if` conditional rendering**: The component is destroyed, and its `ref` becomes invalid, making it impossible to call component methods.
2.  **Event propagation breakpoint**: The event only propagates to direct child components and does not automatically propagate down to deeper components.
3.  **Component lifecycle differences**: Components at different levels may be in different lifecycle stages.

**Solutions**:
1.  **Use `v-show` instead of `v-if`**: Ensure the component instance always exists and the `ref` remains valid.
   ```vue
   <!-- ❌ Problematic solution: The component will be destroyed -->
   <Modal v-if="showModal">
     <TemplateSelect ref="templateRef" />
   </Modal>

   <!-- ✅ Recommended solution: The component is always rendered -->
   <Modal v-show="showModal">
     <TemplateSelect ref="templateRef" />
   </Modal>
   ```

2.  **Establish a complete event propagation chain**: From the event source to all consuming components.
   ```javascript
   // Parent component: Establish event propagation
   const handleGlobalStateChange = (newState) => {
     // Refresh direct child component
     if (directChildRef.value?.refresh) {
       directChildRef.value.refresh()
     }

     // Refresh deep child component (via exposed method of the intermediate component)
     if (intermediateRef.value?.refreshDeepChild) {
       intermediateRef.value.refreshDeepChild()
     }
   }

   // Intermediate component: Expose the refresh method of the deep child component
   const deepChildRef = ref()

   const refreshDeepChild = () => {
     if (deepChildRef.value?.refresh) {
       deepChildRef.value.refresh()
     }
   }

   defineExpose({
     refreshDeepChild
   })
   ```

3.  **Unified refresh interface**: All related components expose the same refresh method.
   ```javascript
   // Every component that needs to respond to global state changes implements the refresh method
   const refresh = () => {
     // Reload data or update state
   }

   defineExpose({
     refresh
   })
   ```

**Best Practices**:
-   **Architectural Design**: Consider the complete path of event propagation during the design phase.
-   **Interface Consistency**: Define a standard component refresh interface (e.g., `refresh()` method).
-   **Documentation**: Create a clear architectural diagram for complex event propagation chains.
-   **Test Verification**: Ensure events propagate correctly in all usage scenarios.

**Applicable Scenarios**:
-   Global theme switching
-   Language switching
-   User permission changes
-   Template/configuration updates

> **Detailed Case Study**: See [106-template-management/event-propagation-fix.md](../archives/106-template-management/event-propagation-fix.md)

## ⚡ Quick Troubleshooting

### Layout Issues
1.  Check if the Flex constraint chain is complete.
2.  Confirm if `min-h-0` has been added.
3.  Verify that the parent container is `display: flex`.

### Scrolling Issues
1.  Check for incorrect `overflow` properties in intermediate layers.
2.  Confirm that height constraints are correctly passed down from the top level.
3.  Verify that the scrolling container has the correct `overflow-y: auto`.

### Component State Synchronization Issues
1.  **Deep component not updating**:
    -   Check if `v-if` is used, causing the component to be destroyed.
    -   Confirm if the event propagation chain is complete (Parent → Intermediate → Target component).
    -   Verify that the target component exposes a refresh method.

2.  **Abnormal state of component inside a Modal**:
    -   Check if the Modal uses `v-show` instead of `v-if`.
    -   Confirm if the component `ref` is still valid when the Modal is closed.
    -   Verify that the global state change event propagates into the Modal.

3.  **Component `ref` call fails**:
    -   Confirm if the component has finished mounting (`nextTick`).
    -   Check if conditional rendering is causing the component not to exist.
    -   Verify that the component bound to the `ref` exposes the corresponding method.

### API Call Issues
1.  Check if environment variables are set correctly (with `VITE_` prefix).
2.  Confirm if parameters are overly set with default values.
3.  Verify that error handling is user-friendly.

### Test Failures
1.  Check if the test ID is unique.
2.  Confirm if the state is correctly cleaned up after the test.
3.  Verify if LLM parameter tests are independent.

## 🔄 Version Management

### Version Synchronization
```json
// package.json
{
  "scripts": {
    "version": "pnpm run version:sync && git add -A"
  }
}
```
**Key**: Use the `version` hook instead of `postversion` to ensure synchronized files are included in the version commit.

### Template Management
-   **Built-in templates**: Cannot be modified or exported.
-   **User templates**: Can be modified; a new ID is generated upon import.
-   **Import rule**: Skip templates with IDs that conflict with built-in templates.

## 🚨 Key Bug Fix Patterns

### Parameter Transparency
```typescript
// ❌ Incorrect: Automatically setting default values
if (!config.temperature) config.temperature = 0.7;

// ✅ Correct: Only use user-configured parameters
const requestConfig = {
  model: modelConfig.defaultModel,
  messages: formattedMessages,
  ...userLlmParams // Only pass parameters explicitly configured by the user
};
```

### Data Import Security Validation
```javascript
// Whitelist validation + type checking
for (const [key, value] of Object.entries(importData)) {
  if (!ALLOWED_KEYS.includes(key)) {
    console.warn(`Skipping unknown configuration: ${key}`);
    continue;
  }
  if (typeof value !== 'string') {
    console.warn(`Skipping invalid type for ${key}: ${typeof value}`);
    continue;
  }
  await storage.setItem(key, value);
}
```

### Internationalization (i18n) Key Synchronization
**Problem**: `[intlify] Not found 'key' in 'locale' messages` error, usually caused by unsynchronized keys between Chinese and English language packs.

**Solution**: Create an automated script to compare the two language files and list the differences.

## 📝 Document Update Standards

When encountering new problems or finding better solutions, this document should be updated promptly:
1.  Add new experiences to the corresponding section.
2.  Update code examples.
3.  Record the fix time and problem background.
4.  Keep the document concise and avoid overly detailed process descriptions.

---

**Remember**: Good experience documentation should allow team members to quickly find solutions, not repeat mistakes.

## 🎯 Vue Composables Design Experience

### The Importance of the Singleton Pattern
**Problem Scenario**: When multiple components use the same composable, if a new instance is created for each call, it leads to state desynchronization.

**Incorrect Implementation**:
```typescript
export function useUpdater() {
  const state = reactive({...})  // A new instance is created with every call
  return { state, ... }
}
```

**Correct Implementation**:
```typescript
let globalUpdaterInstance: any = null

export function useUpdater() {
  if (globalUpdaterInstance) {
    return globalUpdaterInstance  // Return the existing instance
  }

  const state = reactive({...})
  const instance = { state, ... }
  globalUpdaterInstance = instance  // Cache the instance
  return instance
}
```

**Decision Criterion**: If multiple components need to access the same state, the singleton pattern should be used.

**Common Scenarios Requiring a Singleton**:
-   Global state management (e.g., update status, user settings)
-   Modal state
-   Notification system

### Debugging Strategy
-   **Log-driven debugging**: Confirm the state of each step through detailed logs.
-   **Layered validation**: Validate the data layer first, then the UI layer.
-   **Avoid over-engineering**: Do not add complex patches just to solve a problem.

## 🏗️ General Experience in Architectural Refactoring

### Large-scale Refactoring Strategy
**Progressive Refactoring Principles**:
1.  **Interface First**: Design the interface first, then implement the functionality.
2.  **Phased Execution**: Maintain functional continuity and avoid breaking changes.
3.  **Test Protection**: Each phase must have test coverage.
4.  **Synchronized Documentation**: Update documentation while refactoring.

### Distributed Architecture Design
**Core Principles**:
-   **Single Responsibility**: Each service is only responsible for its own data.
-   **Unified Interface**: All services implement the same interface.
-   **Loose Coupling**: Services interact through interfaces.
-   **Extensible**: New services can be added simply by implementing the interface.

### Storage Abstraction Design
**Avoid Leaky Abstractions**:
-   Encapsulate storage details at the service layer.
-   Expose logical key names externally.
-   Establish clear abstraction boundaries.
-   Document the dual purpose of storage keys.

### AI-Automated Testing
**MCP Tool Application**:
-   Use browser automation to validate real user scenarios.
-   Establish repeatable test cases.
-   Verify architectural consistency and data integrity.
-   Improve test coverage and reliability.

> For detailed experience, refer to: [117-import-export-architecture-refactor](../archives/117-import-export-architecture-refactor/)

## Node.js Application Development Experience

### Environment Variable Management
-   **Loading time is crucial**: Environment variables must be loaded into `process.env` before any modules are imported.
-   **Node.js `-r` flag**: The most reliable way to preload a script before the module system initializes.
-   **Path resolution**: Support multiple path lookups to account for different working directories and deployment scenarios.

### Build Tool Usage
-   **Separate entry files**: The entry file should only export and not execute any code with side effects.
-   **Independent startup file**: Use a separate startup file to be responsible for executing the main logic.
-   **Avoid build side effects**: Ensure the build process does not execute any code with side effects.

### Windows Compatibility
-   **Avoid complex process management**: Do not use complex process management tools like `concurrently`.
-   **Separate build and start**: Adopt separate build and start processes.
-   **Simple npm scripts**: Use simple npm scripts instead of complex command combinations.

## Architectural Design Experience

### Adapter Pattern
-   **Decoupling**: Achieve decoupling between different systems through the adapter pattern.
-   **Extensibility**: The adapter pattern makes it easy to add new adapters to support more features.
-   **Maintainability**: Each adapter has a single responsibility, making it easy to maintain.

### Stateless Design
-   **Simplified Deployment**: Stateless design simplifies the deployment process.
-   **Improved Reliability**: Avoids state inconsistency issues.
-   **Easy to Test**: Each test runs in a completely new environment.

Related Archives:
-   [120-mcp-server-module](../archives/120-mcp-server-module/) - MCP Server Module Development

## 🖥️ Node.js Environment Development Experience

### Environment Variable Loading Timing
**Problem**: Node.js environment variables must be loaded before modules are imported; otherwise, they won't be available when modules initialize.
```bash
# ✅ Correct: Use the -r flag to preload
node -r ./preload-env.js dist/index.js

# ❌ Incorrect: Loading environment variables after module import
node dist/index.js  # Environment variables may not be loaded at this point
```

**Solution**:
1.  Create a preload script that supports multi-path lookups.
2.  Handle environment variable loading uniformly in the startup script.
3.  Support silent loading to avoid errors when configuration files are not found.

### Controlling Side Effects During Build
**Problem**: Build tools (like tsup) executing module-level code can cause the server to start unexpectedly.
```typescript
// ❌ Incorrect: Entry file executes directly
import { startServer } from './server'
startServer() // This will be executed during build

// ✅ Correct: Separate export and execution
export { startServer } from './server'
// Use a separate startup file to execute the main logic
```

### Windows Process Management
**Problem**: Process management tools like `concurrently` have signal handling issues on Windows.
```json
// ❌ Avoid: Complex process management
"scripts": {
  "dev": "concurrently \"npm run build:watch\" \"npm run start\""
}

// ✅ Recommended: Simple, separate scripts
"scripts": {
  "build": "tsup",
  "start": "node dist/index.js",
  "dev": "npm run build && npm run start"
}
```

## 📝 Usage Instructions

1.  **Find Experience**: First, check the archived special experiences, then look at the general standards.
2.  **Apply in Practice**: Choose the appropriate solution for your specific scenario.
3.  **Continuous Updates**: Supplement this document with new general experiences as they are discovered.
4.  **Avoid Repetition**: Function-specific experiences should be archived in their corresponding `archives` directory.
