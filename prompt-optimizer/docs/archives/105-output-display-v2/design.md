# OutputDisplay V2 Design Document

## 1. Core Design Philosophy

The primary goal of the V2 release is to resolve the issues of confusing control layout and ambiguous scope present in V1. The new design adheres to the following core principles:

-   **Control Grouping**: Controls with similar functions or the same scope should be visually grouped together.
-   **Scope Association**: The layout position of a control should intuitively reflect the UI area it manages.
-   **High Visibility**: Frequently used functions should always be visible and easily accessible, avoiding unnecessary hover actions.

## 2. Final Layout Scheme (V3)

After several rounds of discussion, the V3 scheme was finalized. Its core is to create a unified, always-visible top-level toolbar, achieving logical separation and visual harmony through internal grouping.

### 2.1 Visual Layout

```
+----------------------------------------------------------------------+
| [Render|Source|Diff] (Fixed Left)                  [Copy][Fullscreen*] (Fixed Right)   |  <-- Unified Top-Level Toolbar (Always Visible)
+----------------------------------------------------------------------+
|                                                                      |
| [Reasoning]..........................................[Expand/Collapse] (Fixed) |  <-- Reasoning Panel
+----------------------------------------------------------------------+
|                      (Reasoning content area, optional, collapsible)   |
|                      (May have its own internal copy button)           |
+----------------------------------------------------------------------+
|                                                                      |
|                      (Main content area)                             |
|                                                                      |
+----------------------------------------------------------------------+

* The Fullscreen button is hidden in fullscreen view.
```

### 2.2 Control Details

#### 2.2.1 Primary Toolbar

-   **Positioning and Visibility**: Fixed at the very top of the entire component, always visible.
-   **Function**: Serves as a unified entry point for all primary operations.
-   **Internal Grouping**:
    -   **Left Group (View Control)**:
        -   **Members**: `Render`, `Source`, `Diff` button group.
        -   **Purpose**: Controls the presentation of the "Main Content Area" below.
    -   **Right Group (Action Execution)**:
        -   **Members**: `Copy`, `Fullscreen` buttons.
        -   **Purpose**: Executes a single action on the content or component. The `Copy` button acts on the "Main Content," and the `Fullscreen` button acts on the entire component.
        -   **Special Rule**: The `Fullscreen` button should be hidden when the component is already in fullscreen mode. This logic is **internally encapsulated** by the `OutputDisplayFullscreen.vue` component. It automatically filters out the `'fullscreen'` option from the `enabledActions` passed by the parent component, ensuring the component's behavior is self-consistent.

#### 2.2.2 "Reasoning" Panel

-   **Positioning**: Located below the top-level toolbar and above the main content area.
-   **Structure**: A self-contained module with its own title bar and content area.
-   **Controls**:
    -   **Expand/Collapse**: Located on the right side of the title bar, controlling the visibility of the content area. The entire title bar is clickable to trigger this action.
    -   **Copy Reasoning**: To ensure clear scope, this button can be placed inside the content area (e.g., at the bottom right) and is only visible when the content area is expanded.

## 3. Component Interface Design (`OutputDisplayCore`)

The external interface (Props & Events) of V2 remains highly compatible with V1. The core changes are reflected in the internal implementation and user experience.

### Props

```typescript
type ActionName = 'fullscreen' | 'diff' | 'copy' | 'edit' | 'reasoning';

interface OutputDisplayCoreProps {
  // ... other props remain unchanged ...
  content?: string;
  originalContent?: string; // Still a prerequisite for activating the "Diff mode" button
  reasoning?: string;
  mode: 'readonly' | 'editable'; // Defines the component's "capability," determining if it's editable in source mode
  enabledActions?: ActionName[]; // Still used to control toolbar features
  // ...
}
```

## 4. Data Flow and State Management (Handling Draft Content)

A common question is: how is the content edited by the user in source mode (which can be considered a "draft") managed?

**Core Principle**: `OutputDisplay` is a purely **Controlled Component**. It does not hold any temporary "draft" state itself. Its responsibility is to faithfully display the data passed in by the parent component via `props` and to notify the parent component of user input actions via `events`.

This pattern follows the **Single Source of Truth** architectural principle, ensuring a predictable and consistent data flow.

### Data Flow Loop

```mermaid
graph TD
    subgraph Parent Component (e.g., PromptPanel)
        A(State: optimizedPrompt)
    end

    subgraph OutputDisplay
        B(Textarea)
    end

    A -- "1. State passed down (Props)" --> B;
    B -- "2. User input triggers @input event" --> C{emit('update:content', ...)}
    C -- "3. Change request (Events)" --> A;
    A -- "4. View automatically syncs (Re-render)" --> B;
```

**Workflow Explained**:
1.  **State Pass-down**: The parent component passes the `optimizedPrompt` state to `OutputDisplay` via the `:content` prop.
2.  **Change Request**: When the user types in the `<textarea>`, `OutputDisplay` does not store the new content in any of its internal variables. Instead, it immediately emits the latest complete content via `emit('update:content', ...)`.
3.  **State Update**: The parent component listens for the `@update:content` event and updates its own `optimizedPrompt` state with the received new content.
4.  **View Synchronization**: Due to Vue's reactivity system, the update to `optimizedPrompt` automatically triggers a re-render of `OutputDisplay`, keeping its displayed `content` prop perfectly in sync with the parent's state, thus closing the data flow loop.

This process is analogous to a bank terminal, which does not store deposit data itself but is responsible for sending the user's transaction request to the head office server and displaying the latest balance returned by the server.

## 5. Component Structure and State Machine

### 5.1. Internal View State Machine

The core of the component is driven by a new internal view state, `internalViewMode`.

```mermaid
graph TD
    A(Render Mode) -- Click "Source" button --> B(Source Mode);
    B -- Click "Render" button --> A;
    A -- When originalContent exists<br/>Click "Diff" button --> C(Diff Mode);
    C -- Click "Render" button --> A;
    B -- When originalContent exists<br/>Click "Diff" button --> C;
    C -- Click "Source" button --> B;

    subgraph "Automatic Switching"
        D(Any Mode) -- streaming starts --> B;
        B -- streaming ends --> E{Restore previous mode};
    end
```

### 5.2. `OutputDisplayCore` Internal Structure

```OutputDisplayCore
├── FloatingToolbar
│   ├── ViewModeButtons (Render / Source / Diff)
│   └── ActionButtons (Copy / Fullscreen, etc.)
├── ReasoningSection (...)
└── MainContent
    ├── MarkdownRenderer (v-if="internalViewMode === 'render'")
    ├── textarea (v-if="internalViewMode === 'source'", :readonly="mode !== 'editable'")
    └── TextDiffUI (v-if="internalViewMode === 'diff'")
```

## 6. Features

### 6.1. Explicit View Modes

Users can freely switch between three modes using a dedicated button group on the toolbar. The currently active mode's button will be displayed in a disabled/highlighted state.

-   **Render Mode (`render`)**:
    -   The default view.
    -   Uses `MarkdownRenderer` to provide a rich text preview.
    -   Content is always read-only in this mode.
    -   **Shortcut**: Clicking the content area automatically switches to `Source Mode` for quick viewing or editing.

-   **Source Mode (`source`)**:
    -   Uses a `<textarea>` to display the raw, unprocessed text.
    -   **Editability**: The textbox in this mode is editable if and only if `props.mode` is `'editable'` and the component is **not** in a streaming update state (`streaming: false`). Otherwise, it is read-only.
    -   This is the best mode for displaying streaming output.

-   **Diff Mode (`diff`)**:
    -   **Availability**: The toggle button for this mode is **rendered** (controlled by `v-if`) only when the `originalContent` prop is passed valid content. If `originalContent` is empty, the button is completely removed from the DOM, not just disabled.
    -   Uses the `TextDiffUI` component to clearly show the differences between `content` and `originalContent`.

### 6.2. Intelligent Automatic Switching

This mechanism is designed to optimize the user experience during streaming updates, making it seamless and intelligent.

-   **Automatic Entry**: When `props.streaming` becomes `true`, the component will:
    1.  Internally remember the user's current view mode (e.g., `render`).
    2.  Automatically switch the view to `source` mode, as this is the best way to display the raw text stream.
-   **Automatic Restoration**: When `props.streaming` becomes `false`, the component automatically restores the view mode that the user had previously selected.

This process allows the user to clearly see the data generation process without losing their preferred viewing style after the process ends.

### 6.3. Intelligent Visibility of the Reasoning Area

To resolve the potential conflict between "automatic expand/collapse" and "manual user actions," we have introduced a "user intent memory" mechanism.

**Core State**:
- `isReasoningExpanded: ref(false)`: Controls the current expanded/collapsed state of the reasoning area.
- `userHasManuallyToggledReasoning: ref(false)`: Remembers if the user has manually interacted with it.

**Logic**:

| Scenario | Condition | Behavior |
| :--- | :--- | :--- |
| **Default State** | Component initialization | The reasoning area is collapsed by default. |
| **Manual Action** | User clicks the expand/collapse button | 1. Toggles the `isReasoningExpanded` state.<br>2. Sets `userHasManuallyToggledReasoning` to `true`, **locking out automatic behavior**. |
| **New Task Starts** | `props.streaming` changes from `false` to `true` | **Resets user memory**: Sets `userHasManuallyToggledReasoning` back to `false`, allowing automation logic to take over again. |
| **Automatic Expansion** | 1. `userHasManuallyToggledReasoning` is `false`.<br>2. Streaming content is detected for `props.reasoning`. | Sets `isReasoningExpanded` to `true`. |
| **Automatic Collapse** | 1. `userHasManuallyToggledReasoning` is `false`.<br>2. `props.streaming` changes from `true` to `false`. | Sets `isReasoningExpanded` to `false`. |

This design ensures that the user's explicit actions have the highest priority. The system only performs intelligent, automatic visibility changes when the user has not intervened, providing a seamless and non-disruptive user experience.

## V2 Refactoring Implementation Summary

This chapter documents the key decisions, implementation details, and subsequent optimizations during the refactoring from V1 to V2, serving as a supplementary explanation to the final design plan.

### 1. Core Improvements

The core improvements achieved through the refactoring are as follows:

-   **UI Structure Optimization**:
    -   **Unified Top-Level Toolbar**: Removed the old floating toolbar and replaced it with an always-visible top-level toolbar, significantly improving the discoverability and operational efficiency of common functions (like view switching, copying).
    -   **Clear Functional Grouping**: The toolbar is clearly divided into a "View Control Area" on the left and an "Action Execution Area" on the right, aligning with user intuition.
    -   **Independent Reasoning Panel**: The "Reasoning" panel was moved below the top-level toolbar and given its own clickable title bar for expanding/collapsing.

-   **Interaction Experience Enhancement**:
    -   Implemented intelligent automatic switching of view modes during streaming updates (switches to source on entry, restores on exit) and remembers the user's choice after manual intervention.
    -   Implemented intelligent expand/collapse logic for the reasoning panel, optimizing information presentation during content loading.

-   **Code Quality Improvement**:
    -   Significantly simplified state management logic, removing several old states like `isHovering`, `isEditing`, and `manualToggleActive`.
    -   Simplified the event handling mechanism, making component behavior more predictable.
    -   The unified and simplified design improved the component's maintainability and testability, resulting in good test case coverage (all 35 test cases passed).

### 2. Subsequent Optimization Record (Styles and Layout)

After the core functional refactoring was complete, a series of optimizations were made to improve visual consistency and fix style conflicts:

-   **Removed Redundant Controls**: Removed the extra "Copy" button from the reasoning panel to simplify the interface.
-   **Unified Padding**:
    -   **Problem**: Discovered that the padding for render mode (`MarkdownRenderer`) and source mode (`textarea`) was inconsistent, causing a visual jump.
    -   **Solution**: Added `!p-0` to the render mode container to override the default padding provided by `theme-card`, and then uniformly applied `px-3 py-2` padding to both `MarkdownRenderer` and `textarea`, ensuring visual consistency between views.

### 3. Theme Style Conflict Resolution (Key Experience)

When adapting the V2 version to custom themes (like purple, green), a style override issue with a third-party library was encountered. The final solution is recorded as an important experience:

-   **Root Cause**: The Tailwind Typography plugin (`prose` class) injects a complete style scheme, including foreground and background colors. This scheme would override the background color set for Markdown content in the project's custom theme, leading to a clashing light-colored background in a dark theme.
-   **Final Solution**:
    1.  **Isolate Styles**: In `theme.css`, the definition for `.theme-markdown-content` was completely removed from `@apply prose-sm ...`, thereby cutting off the strong color injection from `prose`.
    2.  **Manually Rebuild Layout**: Manually added pure, color-free layout and spacing styles (like `font-size`, `margin`, `padding`, etc.) for Markdown elements such as `h1`, `p`, `ul`, `code`.
    -   **Conclusion**: This "**isolate completely, rebuild manually**" strategy is an effective method for resolving conflicts between strongly opinionated third-party libraries and custom theme systems. It ensures that the custom theme's color scheme is applied correctly while preserving the necessary text layout.
