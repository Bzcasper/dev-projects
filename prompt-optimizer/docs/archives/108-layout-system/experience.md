# Core Layout System Experience

## 📋 Overview

This document summarizes the core experience of the dynamic Flex layout system in the project, including layout principles, common problem solutions, debugging methods, and best practices.

## 🎯 Core Layout Experience: Dynamic Flex Layout

**This is the most important experience from this project.** It involves abandoning fixed sizes and fully embracing Flexbox for dynamic space allocation.

### Core Principles
- **Highest Guiding Principle**: For an element to stretch as a Flex child (`flex-1`), its direct parent must be a Flex container (`display: flex`).
- **Constraint Chain Integrity**: All related parent and child elements from top to bottom must follow Flex rules.
- **The Golden Combination**: `flex: 1` + `min-h-0` (or `min-w-0`).

### Implementation Points
```css
/* Parent Container */
.parent {
  display: flex;
  flex-direction: column;
  height: 100vh; /* or another explicit height */
}

/* Dynamic Child Item */
.child {
  flex: 1;
  min-height: 0; /* Key: allows shrinking */
}

/* Scrollable Container */
.scrollable {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
```

### Debugging Method
When a Flex layout fails, start from the problematic element and check its parent elements layer by layer to see if they are `display: flex`.

## 🔧 Key Bug Fix Cases

### 1. Flex Constraint Chain Breakage Fix
**Typical Error**:
```html
<!-- ❌ Parent container is not flex, so child's flex-1 is ineffective -->
<div class="h-full relative">
  <TextDiff class="flex-1 min-h-0" />
</div>

<!-- ✅ Correct: Parent container must be flex -->
<div class="h-full flex flex-col">
  <TextDiff class="flex-1 min-h-0" />
</div>
```

### 2. TestPanel Complex Responsive Layout Fix (2024-12-21)

#### Symptom
The test result area in `TestPanel.vue` had a flex layout issue where content was pushed upwards instead of correctly occupying the available space, especially in small-screen mode with a vertical stack layout.

#### Root Cause
1.  **Incomplete Height Constraint Propagation**: The flex container was missing the `min-h-0` constraint, preventing child items from shrinking correctly.
2.  **Improper Handling of Mixed Layout Modes**: Absolute positioning was used for large screens and flex layout for small screens, but the height constraint rules were inconsistent between the two modes.
3.  **Title Element Participating in Space Allocation**: The `h3` title was not marked as `flex-none`, causing it to incorrectly participate in flex space allocation.

#### Fix
```html
<!-- Before Fix: Missing the crucial min-h-0 constraint -->
<div class="flex flex-col transition-all duration-300 min-h-[80px]">
  <h3 class="text-lg font-semibold theme-text truncate mb-3">Title</h3>
  <OutputDisplay class="flex-1" />
</div>

<!-- After Fix: A complete flex constraint chain -->
<div class="flex flex-col min-h-0 transition-all duration-300 min-h-[80px]">
  <h3 class="text-lg font-semibold theme-text truncate mb-3 flex-none">Title</h3>
  <OutputDisplay class="flex-1 min-h-0" />
</div>
```

#### Key Fix Points
- Added `min-h-0` constraint to each result container.
- Marked the title as `flex-none` to prevent it from participating in space allocation.
- Added `min-h-0` to the `OutputDisplay` component to ensure correct height constraint propagation into the component.

#### Lessons Learned
- In complex responsive layouts, each layout mode (flex vs. absolute) requires independent validation of height constraints.
- Components with mixed layout modes are particularly prone to broken constraint propagation and need to be checked layer by layer.
- Fixed-height elements like titles must be explicitly marked as `flex-none`.

## 🎯 UI State Synchronization and Reactive Data Flow Best Practices (2024-12-21)

### Typical Problem
In complex Vue component interactions, changes to a child component's internal state are not correctly reflected in other sibling components, leading to a UI display that is inconsistent with the underlying data. For example, after a user edits content in component A, component B (like the test panel) still gets the data from before the edit.

### Root Cause Analysis
The core of this issue lies in the synchronization gap between **unidirectional data flow** and **local component state**. When a child component's (e.g., `OutputDisplay`) internal state (`editingContent`) changes, it notifies the parent component to update the top-level state via an `emit` event. However, other sibling components (e.g., `TestPanel`) that depend on the same top-level state receive static `props` and do not automatically react to the indirect state change triggered by the `emit`, leading to data desynchronization.

### Solution: Building a Reliable Reactive Data Flow Architecture

**Core Goal**: Ensure that any state change originating from user interaction is **immediately and unidirectionally** synchronized back to a Single Source of Truth, and that all components depending on that data source react and update automatically.

#### Implementation Patterns

1.  **Pattern 1: Real-time State Hoisting**

    Child components should not hold temporary, unsynchronized "draft" states. Any editable state should be synchronized upwards via an `emit` event the moment it changes, rather than waiting for a specific action (like "save" or "blur") to trigger it.

    ```typescript
    // Child Component: OutputDisplayCore.vue
    // Use a watcher to sync internal editing content to the parent in real-time
    watch(editingContent, (newContent) => {
      if (isEditing.value) {
        emit('update:content', newContent);
      }
    }, { immediate: false });
    ```

2.  **Pattern 2: Timing and Race Condition Control**

    For asynchronous operations that need to clear or reset state (like starting a stream), it's crucial to ensure that state change operations (like exiting edit mode, clearing content) are completed *before* the async task starts. `nextTick` is key to resolving such race conditions between DOM updates and state changes.

    ```typescript
    // State Manager: usePromptOptimizer.ts
    async function handleOptimize() {
        isOptimizing.value = true;
        optimizedPrompt.value = ''; // 1. Synchronously clear the state
        await nextTick();          // 2. Wait for DOM and state updates to complete

        // 3. Start the asynchronous service
        await promptService.value.optimizePromptStream(...);
    }
    ```

3.  **Pattern 3: External Event-Driven State Reset**

    When an action (like optimization) needs to affect a sibling component's state (like forcing it to exit edit mode), it should be implemented through the top-level component's listeners and method calls (`ref.method()`), rather than direct communication between components.

    ```typescript
    // Parent Component: PromptPanel.vue
    // Watch for top-level state changes and call the child component's method
    watch(() => props.isOptimizing, (newVal) => {
      if (newVal) {
        outputDisplayRef.value?.forceExitEditing();
      }
    });
    ```

### Core Design Principles
-   **Single Source of Truth**: Any shared state must be owned by a single, high-level component or state manager. Child components can only receive it via `props` and request changes via `emit`.
-   **Reactive Data Flow Loop**: Ensure the "User Input -> `emit` -> Update Top-Level State -> `props` -> Update All Related Child Components" data flow is complete and automatically reactive.
-   **Systematic Debugging Strategy**: When encountering state synchronization issues, adding temporary logs from the data source (top-level state) to the consumer (child component props) is the most effective way to quickly locate the "breakpoint" in the data flow.

## ⚡ Quick Problem Troubleshooting

### Layout Issues
1.  Check if the Flex constraint chain is complete.
2.  Confirm if `min-h-0` has been added.
3.  Verify that the parent container is `display: flex`.

### Scrolling Issues
1.  Check for an incorrect `overflow` property on an intermediate layer.
2.  Confirm that the height constraint is correctly passed down from the top level.
3.  Verify that the scrollable container has the correct `overflow-y: auto`.

### State Synchronization Issues
1.  Check if the data flow forms a closed loop.
2.  Confirm if there is any unsynchronized temporary state.
3.  Verify the dependencies between components.

## 💡 Core Lessons Learned

1.  **Flex Constraint Chain**: A complete Flex constraint chain must be maintained from the top level to the bottom.
2.  **Minimum Height Constraint**: `min-h-0` is key to dynamic layouts, allowing elements to shrink correctly.
3.  **Mixed Layout Validation**: Different layout modes require independent validation of constraint propagation.
4.  **State Synchronization**: Establish a complete reactive data flow to avoid state inconsistencies between components.
5.  **Systematic Debugging**: Check the constraint chain and data flow layer by layer to quickly identify the root cause of problems.

## 🔗 Related Documents

- [Layout System Overview](./README.md)
- [Troubleshooting Checklist](./troubleshooting.md)
- [TestPanel Refactoring Record](../104-test-panel-refactor/README.md)

---

**Document Type**: Experience Summary
**Scope**: Flex Layout System Development
**Last Updated**: 2025-07-01
