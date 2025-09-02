# Prompt Optimizer Desktop Application Developer Guide

## 1. Project Background and Goals

The user wants to transform the existing Prompt Optimizer Web application into a desktop application. The core goal is to **use the Electron main process to proxy API requests, thereby completely solving the browser's CORS cross-origin issues**.

### Technology Selection: Why Choose Electron?

-   **Unified Technology Stack**: Electron allows us to reuse the existing JavaScript/TypeScript and Vue technology stack without introducing new technologies like Rust (the Tauri solution). This reduces the team's learning curve and development barrier.
-   **Minimal Code Intrusion**: Through Electron's Inter-Process Communication (IPC) mechanism, we can implement a seamless API request proxy. We only need to inject a custom network request function during SDK initialization, which results in minimal intrusion into the core business logic (`packages/core`).
-   **Mature Ecosystem**: Electron has a large and mature community and ecosystem, providing strong support for future feature extensions (such as automatic updates and system notifications).

## 2. Architectural Design

The application adopts a **high-level service proxy** architecture, which has clear responsibilities and is highly maintainable. The main process acts as the backend service provider, and the renderer process acts as the frontend consumer.

### Overall Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron Desktop Application             │
├─────────────────────────────────────────────────────────────┤
│                  Main Process (main.js) - Server-side        │
│  - Window Management                                         │
│  - **Directly consumes the @prompt-optimizer/core package**    │
│  - **Instantiates and holds core services (LLMService, ModelManager)** │
│  - **Acts as a backend, providing high-level service interfaces (e.g., testConnection) via IPC** │
├─────────────────────────────────────────────────────────────┤
│              Preload Script (preload.js) - Secure Bridge     │
│  - Exposes the main process's high-level service interfaces (`llm.testConnection`) │
│  - Securely to the renderer process (`window.electronAPI.llm.*`) │
├─────────────────────────────────────────────────────────────┤
│            Renderer Process (Vue Application) - Pure Frontend Consumer │
│  - UI and user interaction                                   │
│  - **Calls `window.electronAPI.llm.testConnection()` via proxy objects (`ElectronLLMProxy`) from the `core` package** │
│  - **Does not handle network requests directly, only calls defined service interfaces** │
└─────────────────────────────────────────────────────────────┘
```

### Service Call Data Flow

```
1. User interacts with the UI, triggering a method in a Vue component.
2. The Vue component calls the Electron-oriented proxy service (`ElectronLLMProxy`) from the `core` package.
3. The proxy service calls the `window.electronAPI.llm.testConnection()` exposed by the preload script (IPC call).
4. The preload script sends the request to the main process via `ipcRenderer`.
5. The `ipcMain` listener in the main process captures the request and directly calls the **real LLMService instance held in the main process**.
6. The LLMService instance, running in the Node.js environment, uses `node-fetch` to make the actual API request.
7. The final result (JSON data, not a Response object) is returned along the same path: Main Process → Preload Script → Proxy Service → Vue Component → UI Update.
```

### Core Architecture Explained: Proxy Pattern and Inter-Process Communication (IPC)

To fully understand the robustness of the new architecture, one must grasp its core philosophy: **the main process is the "brain," and the renderer process is the "limbs."** All memory, thinking, and decision-making (core services) must be unified in the "brain," while the "limbs" (UI) are only responsible for perception and action.

#### 1. Why can't the UI layer directly call the `core` module?

In a pure web application, the UI and Core live in the same world (a single process) and can communicate directly. But in Electron, the main process and the renderer process are two **completely isolated operating system processes**, each with its own independent memory space.

What happens if `createModelManager()` is called directly in the UI layer (renderer process)?
-   **Data Silos**: A **new, blank** `ModelManager` instance would be created in the renderer process. It would have **no connection** to the instance in the main process that holds the real data, leading to data that can never be synchronized.
-   **Missing Capabilities**: Some features of the `core` module (like future file I/O) depend on the Node.js environment. The renderer process (based on Chromium) lacks these capabilities, and calling related functions would directly cause the **application to crash**.

#### 2. `ipcRenderer` and `ipcMain`: The Telephones Between Two Worlds

Inter-Process Communication (IPC) is the only bridge connecting these two isolated worlds.
-   **`ipcRenderer`**: A "telephone" installed in the **renderer process**, specifically for "calling" the main process (making requests).
-   **`ipcMain`**: A "switchboard" installed in the **main process**, specifically for "answering calls" (handling requests).

We primarily use the `invoke`/`handle` **two-way communication** model, which perfectly simulates the asynchronous "request-response" flow.

#### 3. `ElectronModelManagerProxy`: The Elegant "Plenipotentiary Agent"

Allowing the UI layer to directly manipulate low-level "telephone commands" like `ipcRenderer.invoke('channel-name', ...)` is chaotic and insecure. To solve this, we introduce the **Proxy Pattern**.

The core role of proxy classes like `ElectronModelManagerProxy` is to **"pretend" to be the real `ModelManager`**. This allows the UI layer's code to be called seamlessly as before, without needing to worry about the complex cross-process communication happening behind the scenes.

Its workflow is a precise "intercept-forward-return" process:
1.  **UI Call**: The UI calls `modelManager.getModels()`.
2.  **Proxy Interception**: In reality, it's calling the method of the same name on the `ElectronModelManagerProxy` instance.
3.  **Proxy Forwarding**: This method contains no business logic; it's only responsible for calling `ipcRenderer.invoke('model-getModels')` via the `electronAPI` exposed by `preload.js`.
4.  **Main Process Handling**: `ipcMain.handle` captures the request, calls the **single, real `ModelManager` instance in the main process**, processes the request, and returns the data.
5.  **Data Return**: The result is returned along the original path, finally being delivered to the UI component.

Although this pattern requires adding "boilerplate code" to multiple files (`main.js`, `preload.js`, `proxy.ts`) when adding a new method, this is not meaningless repetition. It is a highly cost-effective price to pay for a **single source of truth, secure boundaries, and an elegant, type-safe abstraction**.

## 3. Quick Start (Development Mode)

### System Requirements

-   Windows 10/11, macOS, or Linux
-   Node.js 18+
-   pnpm 8+

### Startup Steps

```bash
# 1. (First time) Install all dependencies in the project root directory
pnpm install

# 2. Run the desktop application in development mode
pnpm dev:desktop
```

This command will simultaneously start the Vite development server (for the frontend interface) and the Electron application instance, with hot-reloading enabled.

## 4. Core Technical Implementation

The current architecture abandons the fragile low-level `fetch` proxy in favor of a more stable and maintainable **high-level service proxy model**.

### Service Consumption Model

The main process (`main.js`) now acts as a backend service, directly consuming the capabilities of `packages/core` and fully reusing its business logic, which avoids code redundancy.

```javascript
// main.js - The main process directly imports and uses the core package
const {
    createLLMService,
    createModelManager,
    // ... other services
} = require('@prompt-optimizer/core');

// Instantiate services when the main process starts
let llmService;
app.whenReady().then(() => {
    // A storage solution suitable for Node.js is needed here (see below)
    const modelManager = createModelManager(/* ... */);

    // Create a real LLMService instance that runs in the Node.js environment
    llmService = createLLMService(modelManager);

    // Pass the service instance to the IPC setup function
    setupIPC(llmService);
});
```

### High-Level IPC Interface

The "contract" for communication between the renderer process and the main process has been upgraded from the unstable `fetch` API to our own stable, defined `ILLMService` interface.

```javascript
// main.js - Provides the service interface
function setupIPC(llmService) {
    ipcMain.handle('llm-testConnection', async (event, provider) => {
        try {
            await llmService.testConnection(provider);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    // ... implementation of other interfaces
}

// preload.js - Exposes the service interface
contextBridge.exposeInMainWorld('electronAPI', {
    llm: {
        testConnection: (provider) => ipcRenderer.invoke('llm-testConnection', provider),
        // ... exposure of other interfaces
    }
});
```

### Storage Strategy

Since the renderer process's `IndexedDB` is not available in the main process (Node.js), we have designed a phased storage solution for the desktop application:

-   **Phase 1 (Current Implementation):** Adopt a temporary **in-memory storage** solution. This allows the new architecture to get up and running quickly, but data is lost when the application is closed.
-   **Phase 2 (Future Plan):** Implement a **file storage (`FileStorageProvider`)** to persist data like models and templates as JSON files on the user's local disk, fully leveraging the advantages of the desktop environment.

## 5. Build and Deployment

### Development Scripts

-   `pnpm dev:desktop`: Starts both the frontend development server and the Electron application for daily development.
-   `pnpm build:web`: Builds only the frontend web application, with output in `packages/desktop/web-dist`.
-   `pnpm build:desktop`: Builds the final distributable desktop application (e.g., `.exe` or `.dmg`).

### Production Build Process

```bash
# Full build process, which will automatically build the web content first
pnpm build:desktop

# After the build is complete, the executable files are located in the following directory:
# packages/desktop/dist/
```

### Electron Builder Configuration

The packaging configuration is located in the `build` field of `packages/desktop/package.json`.

```json
{
  "build": {
    "appId": "com.promptoptimizer.desktop",
    "productName": "Prompt Optimizer",
    "directories": { "output": "dist" },
    "files": [
      "main.js",
      "preload.js",
      "web-dist/**/*", // Package the built frontend application
      "node_modules/**/*"
    ],
    "win": {
      "target": "nsis", // Windows installer format
      "icon": "icon.ico" // Application icon
    }
  }
}
```

## 6. Troubleshooting

**1. Application fails to start or shows a blank screen**
-   Ensure `pnpm install` has been executed successfully.
-   Confirm that `pnpm build:web` has run successfully and that the `packages/desktop/web-dist` directory has been generated and is not empty.
-   Try cleaning and reinstalling: `pnpm store prune && pnpm install`.

**2. Incomplete Electron installation**
-   This is usually a network issue. You can try configuring the `electron_mirror` environment variable or installing manually.
-   Manual installation command:
    ```bash
    # (Path may vary depending on pnpm version)
    cd node_modules/.pnpm/electron@<version>/node_modules/electron
    node install.js
    ```

**3. API call fails**
-   Check if the API key is correctly configured on the "Model Management" page of the desktop application.
-   Open the developer tools (`Ctrl+Shift+I`) to view the `Console` of the renderer process.
-   **Crucial:** Since the core API call logic has been moved to the main process, be sure to **check the log output in the terminal (command line window) that started the desktop application**. It will contain the most direct `node-fetch` error messages.
-   Confirm that the network connection is normal.

## 7. Future Architectural Improvement Directions

The current manual maintenance of IPC "boilerplate code" across multiple files is clear and robust, but as features expand, development efficiency and consistency will become a challenge. In the future, we can adopt a **Code Generation** solution to completely solve this problem.

### Core Concept

The only file we should need to maintain manually is the service's **interface definition** (e.g., `IModelManager`). We will use this interface as the **"Single Source of Truth"**.

### Automated Workflow

1.  **Define the Blueprint**: Maintain interfaces like `IModelManager` in the `types.ts` file of the `core` package.
2.  **Write a Generator Script**: Use a library like `ts-morph` to write a Node.js script that can read and parse the structure of a TypeScript interface (method names, parameters, return values, etc.).
3.  **Automatically Generate Boilerplate Code**: The script iterates through each method in the interface and, based on a preset template, automatically generates the `ipcMain.handle` in `main.js`, the `ipcRenderer` call in `preload.js`, and the proxy method in `electron-proxy.ts`.
4.  **One-Click Update**: Integrate this script into `package.json`. In the future, when adding/modifying/deleting an interface method, a developer only needs to modify the interface definition and then run a command (e.g., `pnpm generate:ipc`), and all related IPC code will be updated automatically and correctly.

### Alternative Solutions

The mature `tRPC` framework in the community offers a similar idea, with its core being a "zero-code-generation" type-safe API layer. We can draw inspiration from its ideas or even try to integrate it into Electron's IPC mechanism.

By adopting this solution, our development process will become extremely efficient and secure, completely eliminating all potential errors that could arise from manually maintaining IPC calls.
