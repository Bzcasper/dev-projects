# Electron API Best Practices Guide

## 🎯 Core Principles

**Keep it simple, call directly, and resolve IDE warnings through type definitions.**

## 📝 Correct Implementation

### 1. Complete Type Definitions

Define the complete API types in `packages/ui/src/types/electron.d.ts`:

```typescript
declare global {
  interface Window {
    electronAPI: {
      updater: {
        checkAllVersions(): Promise<{
          currentVersion: string
          stable?: {
            remoteVersion?: string
            hasUpdate?: boolean
            message?: string
            releaseDate?: string
            releaseNotes?: string
            remoteReleaseUrl?: string
          }
          prerelease?: {
            remoteVersion?: string
            hasUpdate?: boolean
            message?: string
            releaseDate?: string
            releaseNotes?: string
            remoteReleaseUrl?: string
          }
        }>
        installUpdate(): Promise<void>
        ignoreVersion(version: string, versionType?: 'stable' | 'prerelease'): Promise<void>
        downloadSpecificVersion(versionType: 'stable' | 'prerelease'): Promise<{
          hasUpdate: boolean
          message: string
          version?: string
          reason?: 'ignored' | 'latest' | 'error'
        }>
      }
      shell: {
        openExternal(url: string): Promise<void>
        showItemInFolder(path: string): Promise<void>
      }
      on: (event: string, callback: Function) => void
      off: (event: string, callback: Function) => void
    }
  }
}
```

### 2. Use the API Directly

Call directly in the business logic without any wrappers:

```typescript
// ✅ Correct usage
export function useUpdater() {
  const checkBothVersions = async () => {
    try {
      // Direct call, type-safe, no IDE warnings
      const results = await window.electronAPI!.updater.checkAllVersions()

      // Use the returned data directly
      console.log('Current version:', results.currentVersion)
      if (results.stable?.hasUpdate) {
        console.log('Stable update available:', results.stable.remoteVersion)
      }

      return results
    } catch (error) {
      console.error('Version check failed:', error)
      throw error
    }
  }

  const installUpdate = async () => {
    try {
      await window.electronAPI!.updater.installUpdate()
      console.log('Update installation initiated')
    } catch (error) {
      console.error('Install failed:', error)
    }
  }

  const openReleaseUrl = async (url: string) => {
    try {
      await window.electronAPI!.shell.openExternal(url)
    } catch (error) {
      console.error('Failed to open URL:', error)
    }
  }

  return {
    checkBothVersions,
    installUpdate,
    openReleaseUrl
  }
}
```

### 3. Event Listening

```typescript
// ✅ Correct event listening
const setupEventListeners = () => {
  if (!window.electronAPI?.on) return

  const updateAvailableListener = (info: any) => {
    console.log('Update available:', info)
  }

  window.electronAPI.on('update-available-info', updateAvailableListener)

  // Cleanup function
  return () => {
    if (window.electronAPI?.off) {
      window.electronAPI.off('update-available-info', updateAvailableListener)
    }
  }
}
```

## ❌ Anti-Patterns to Avoid

### 1. Over-Abstraction

```typescript
// ❌ Incorrect: Unnecessary wrapper layer
const useElectronAPI = () => {
  const safeCall = async (apiCall) => {
    try {
      const data = await apiCall()
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return {
    updater: {
      checkAllVersions: () => safeCall(() => window.electronAPI.updater.checkAllVersions())
    }
  }
}
```

### 2. Complex Response Formats

```typescript
// ❌ Incorrect: Introducing unnecessary wrapper formats
const response = await electronAPI.updater.checkAllVersions()
if (!response.success) {  // Adds complexity
  throw new Error(response.error)
}
const data = response.data  // Redundant unpacking
```

## 🔧 preload.js Best Practices

Keep `preload.js` simple:

```javascript
// ✅ Correct: Simple and direct
const electronAPI = {
  updater: {
    checkAllVersions: async () => {
      const result = await ipcRenderer.invoke('update-check-all-versions')
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data  // Return data directly
    },

    installUpdate: async () => {
      const result = await ipcRenderer.invoke('update-install')
      if (!result.success) {
        throw new Error(result.error)
      }
      // void return, no data to return
    }
  },

  shell: {
    openExternal: async (url) => {
      const result = await ipcRenderer.invoke('shell-open-external', url)
      if (!result.success) {
        throw new Error(result.error)
      }
      // void return
    }
  },

  on: (event, callback) => ipcRenderer.on(event, callback),
  off: (event, callback) => ipcRenderer.off(event, callback)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
```

## 🎯 Key Takeaways

1.  **Type safety is achieved through type definitions**, not runtime wrappers.
2.  **Keep API calls direct**, reducing abstraction layers.
3.  **Error handling is done in the business layer**, not wrapped in the API layer.
4.  **`preload.js` is only responsible for exposing APIs**, not complex logic.
5.  **Prioritize solving core problems**, avoiding over-engineering.

## 🚀 Advantages

-   **Better Performance**: No extra function call overhead.
-   **Simple Debugging**: Problems are located directly at the source.
-   **Clear Code**: Intent is clear and easy to understand.
-   **Simple Maintenance**: Reduces the maintenance burden of abstraction layers.
-   **Type Safety**: Full TypeScript support.

---

**Remember**: The best abstraction is no abstraction. Only introduce complexity when it's truly needed.
