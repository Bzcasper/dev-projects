## **`TestPanel.vue` Component Upgrade and Refactoring Guide**

### 1. **Objective**

To comprehensively upgrade the `OutputPanelUI` component, used for displaying "Original Prompt Result" and "Optimized Prompt Result" in `TestPanel.vue`, to the more powerful and consistent `OutputDisplay` component.

### 2. **Core Principles**

This refactoring will follow the same architectural pattern as the `OutputDisplay` usage in `PromptPanel.vue` to ensure consistency and maintainability across the codebase. The core principles are as follows:

*   **Parent Component Owns State**: `TestPanel.vue` will be the owner of the data, fully responsible for managing the streaming reception, content storage, and loading state of test results.
*   **Unidirectional Data Flow**: All state (such as content and loading status) will be passed down to the child component `OutputDisplay` via `props`.
*   **Separation of Concerns**: `TestPanel.vue` focuses on business logic (how to fetch data), while `OutputDisplay` focuses on view presentation (how to display data).

### 3. **Scope of Refactoring**

*   **File**: `packages/ui/src/components/TestPanel.vue`

### 4. **Detailed Implementation Steps**

#### **4.1. Template (`<template>`) Modifications**

1.  **Remove Markdown Toggle Buttons**:
    *   In the template, find and completely remove the two `<button>` elements and their associated `enableMarkdown` logic used for toggling Markdown rendering. `OutputDisplay` has its own built-in view switching functionality, making external control unnecessary.

2.  **Replace "Original Prompt Test Result" Panel**:
    *   Find the `div` with `v-show="isCompareMode"`.
    *   Delete the `<OutputPanelUI ... />` component inside it.
    *   Add the following new structure in its place:
        ```html
        <h3 class="text-lg font-semibold theme-text truncate mb-3">{{ t('test.originalResult') }}</h3>
        <OutputDisplay
          :content="originalTestResult"
          :streaming="isTestingOriginal"
          mode="readonly"
          class="flex-1 h-full"
        />
        ```

3.  **Replace "Optimized Prompt Test Result" Panel**:
    *   Find the `div` that displays the optimized result.
    *   Delete the `<OutputPanelUI ... />` component inside it.
    *   Add the following new structure in its place:
        ```html
        <h3 class="text-lg font-semibold theme-text truncate mb-3">
          {{ isCompareMode ? t('test.optimizedResult') : t('test.testResult') }}
        </h3>
        <OutputDisplay
          :content="optimizedTestResult"
          :streaming="isTestingOptimized"
          mode="readonly"
          class="flex-1 h-full"
        />
        ```

4.  **Remove `ref` Attributes**:
    *   Delete the `ref="originalOutputPanelRef"` and `ref="optimizedOutputPanelRef"` attributes from the template, as they will no longer be used.

#### **4.2. Script (`<script setup>`) Modifications**

1.  **Update Imports**:
    *   Remove `OutputPanelUI` from the import statement for `'./OutputPanel.vue'`.
    *   Add an import for `OutputDisplay` from `'./OutputDisplay.vue'`.
    *   Ensure `useToast` is imported from `'../composables/useToast'` and initialized with `const toast = useToast()`.

2.  **Remove Deprecated State**:
    *   Delete the following `ref` definitions:
        ```javascript
        const originalOutputPanelRef = ref(null)
        const optimizedOutputPanelRef = ref(null)
        const enableMarkdown = ref(true); // if it exists
        ```

3.  **Refactor `testOriginalPrompt` Function**:
    *   This function will be refactored from a delegation pattern to an active management pattern.
    *   The **complete refactored logic** should be as follows:
        ```javascript
        const testOriginalPrompt = async () => {
          if (!props.originalPrompt) return

          isTestingOriginal.value = true
          originalTestResult.value = ''
          originalTestError.value = '' // Optional, mainly for debugging

          await nextTick(); // Ensure state updates and DOM clearing are complete

          try {
            const streamHandler = {
              onToken: (token) => {
                originalTestResult.value += token
              },
              onComplete: () => { /* No longer need to set isTesting here, handled by finally */ },
              onError: (err) => {
                const errorMessage = err.message || t('test.error.failed')
                originalTestError.value = errorMessage
                toast.error(errorMessage)
              }
            }

            // ... The logic for building systemPrompt and userPrompt remains unchanged ...

            await props.promptService.testPromptStream(
              systemPrompt,
              userPrompt,
              selectedTestModel.value,
              streamHandler
            )
          } catch (error) {
            console.error('[TestPanel] Original prompt test failed:', error); // Add detailed error logging
            const errorMessage = error.message || t('test.error.failed')
            originalTestError.value = errorMessage
            toast.error(errorMessage)
            originalTestResult.value = ''
          } finally {
            // Ensure the loading state is always turned off, whether successful or not
            isTestingOriginal.value = false
          }
        }
        ```

4.  **Refactor `testOptimizedPrompt` Function**:
    *   Apply the exact same refactoring logic as `testOriginalPrompt`, but operate on the `optimized`-related state (`props.optimizedPrompt`, `isTestingOptimized`, `optimizedTestResult`, `optimizedTestError`).
    *   **Key Enhancement**: Also add `await nextTick()` and `console.error` logging within the `try-catch-finally` structure here.

5.  **Remove `defineExpose`**:
    *   Since it's no longer necessary to reference internal `ref`s or methods from outside the component, delete the entire `defineExpose` block.

### 5. **Expected Outcome**

*   `TestPanel.vue` no longer depends on `OutputPanel.vue` and exclusively uses `OutputDisplay.vue`.
*   The test result area now has the same appearance and interactions (like view switching, fullscreen, etc.) as the main optimization panel but is restricted to read-only mode.
*   The streaming data display logic is correctly moved to the `<script>` section of `TestPanel.vue`, resulting in a cleaner code structure and more reliable state management.
*   The project has eliminated the `OutputPanel.vue` component, which was only used in a specific scenario, improving code reuse and consistency.
