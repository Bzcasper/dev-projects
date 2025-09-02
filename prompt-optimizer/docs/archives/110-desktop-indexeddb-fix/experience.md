# Lessons Learned from the "Desktop IndexedDB Fix" Task

## Core Experience

### Architectural Design
- **Explicitness is better than convenience**: The core of this task was the removal of convenience methods like `createDefault()`. This forces developers to explicitly specify the storage type when creating a service, thus preventing the accidental creation of IndexedDB in unsuitable environments like Electron. This is an important architectural principle that prevents hidden, environment-induced side effects.
- **Avoid module-level side effects**: We discovered that creating instances (like storage providers) at the top-level scope of modules such as `factory.ts` is a major hidden danger. Modules should not perform any substantial operations with side effects upon being imported. All instantiation should be done through explicit function calls and dependency injection.

### Debugging and Troubleshooting
- **Beware of legacy data**: This is a key lesson. Even after the code has been fixed, residual IndexedDB data in the browser can cause the application to behave abnormally, thereby masking the true effect of the fix. When dealing with issues related to persisted data, "clearing historical data" must be part of the validation process.
- **Avoid over-fixing**: In the initial stages of troubleshooting, we added some complex environment checks and warning logic to the code. While the intention was good, this increased the complexity of the code. Ultimately, a more fundamental architectural fix (removing `createDefault`) made this complex logic redundant. This reminds us to promptly review and clean up any temporary or overly defensive code added during the process after a fix is in place.

## Specific Pitfall Avoidance Guide

- **Problem**: IndexedDB should not appear in the Electron renderer process.
- **Consequence**: This violates the core architecture of the desktop application (data should be managed centrally by the main process) and can lead to data inconsistency and unexpected disk I/O.
- **Correct Approach**: The renderer process should communicate with the main process exclusively through an IPC proxy to manipulate data. It should not directly create any storage instances. All storage-related logic should be encapsulated within the main process.

- **Problem**: Convenient factory methods (like `createDefault()`) can hide environmental dependencies.
- **Consequence**: This causes modules to behave inconsistently in different environments, increasing debugging difficulty.
- **Correct Approach**: Remove such methods that implicitly create instances. Enforce the use of dependency injection, making all dependencies explicit, controllable, and easy to test.
