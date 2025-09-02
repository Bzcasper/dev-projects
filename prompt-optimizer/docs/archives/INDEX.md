# 📚 Comprehensive Index of Archived Documents

This index categorizes all archived documents by feature to help you quickly locate relevant content.

## 🏗️ Architecture Refactoring Series

### Core Architecture Evolution
- **[101-singleton-refactor](./101-singleton-refactor/)** - Singleton Pattern Refactoring
  - Removed the singleton pattern from the project and replaced it with a dependency injection architecture.
  - Improved code testability and maintainability.
  - Laid the foundation for subsequent architectural refactoring.

- **[102-web-architecture-refactor](./102-web-architecture-refactor/)** - Web Architecture Refactoring
  - Based on the singleton refactoring, a comprehensive refactoring of the web application and browser extension architecture was carried out.
  - Adopted a unified Composable architecture.
  - Fixed application startup failure issues.

- **[103-desktop-architecture](./103-desktop-architecture/)** - Desktop Architecture
  - Design and refactoring of the desktop (Electron) architecture.
  - Ensured consistency with the web-side architecture.
  - Inter-process communication optimization.

### Architecture Fixes and Optimizations
- **[111-electron-preference-architecture](./111-electron-preference-architecture/)** - Electron Preference Architecture
  - Electron PreferenceService architecture refactoring.
  - Race condition fixes.
  - Cross-process state management optimization.

## 🚀 Feature Development Series

### Core Functional Modules
- **[106-template-management](./106-template-management/)** - Template Management Function
  - CRUD functions for templates.
  - Asynchronous operation optimization.
  - User experience improvements.

- **[107-component-standardization](./107-component-standardization/)** - Component Standardization Refactoring
  - Unified the behavior and API of all modal/dialog components.
  - Established a unified component API specification.
  - Improved code consistency and maintainability.

### Interface Function Optimization
- **[104-test-panel-refactor](./104-test-panel-refactor/)** - Test Panel Refactoring 📋
  - Test panel function refactoring and optimization.
  - User experience improvements.

- **[105-output-display-v2](./105-output-display-v2/)** - Output Display v2 📋
  - Second version design of the output display function.
  - Performance and user experience optimization.

## 🎨 System Optimization Series

### UI/UX System
- **[108-layout-system](./108-layout-system/)** - Layout System Experience
  - Experience in implementing dynamic Flex layout.
  - Best practices for responsive design.
  - Summary of layout system architecture.

- **[109-theme-system](./109-theme-system/)** - Theme System Development
  - Design and implementation of the theme system.
  - Dynamic theme switching function.
  - Best practices for style management.

## 🔧 Problem Fixing Series

### Storage and Data
- **[110-desktop-indexeddb-fix](./110-desktop-indexeddb-fix/)** - Desktop IndexedDB Fix
  - Fixed IndexedDB compatibility issues on the desktop.
  - Improved data storage stability.
  - Optimized cross-platform storage solutions.

### Inter-Process Communication
- **[112-desktop-ipc-fixes](./112-desktop-ipc-fixes/)** - Collection of Desktop IPC Fixes
  - Fixed the issue of the language switch button displaying "Object Promise".
  - Fixed Vue reactive object IPC serialization issues.
  - IPC architecture analysis and fixes.
  - Unified cross-environment asynchronous interfaces.
  - Standardized preload.js architecture.

- **[115-ipc-serialization-fixes](./115-ipc-serialization-fixes/)** - IPC Serialization Fixes and Data Consistency 🔄
  - Unified handling of Vue reactive object IPC serialization.
  - Implementation of the `safeSerialize` function.
  - Fixed data consistency issues in the business logic layer.
  - Resolved model data loss issues.
  - Established a dual protection mechanism.

## ⚙️ Service Refactoring Series

### Comprehensive Refactoring
- **[113-full-service-refactoring](./113-full-service-refactoring/)** - Comprehensive Service Refactoring
  - Comprehensive refactoring of the service layer architecture.
  - Dependency injection optimization.
  - Service interface standardization.

- **[114-desktop-file-storage](./114-desktop-file-storage/)** - Desktop File Storage Implementation 💾
  - Implemented FileStorageProvider to replace in-memory storage.
  - Complete data persistence solution.
  - High-performance file I/O and error recovery mechanisms.
  - Enhanced data security: intelligent recovery mechanism, backup protection, atomic operations.

- **[116-desktop-packaging-optimization](./116-desktop-packaging-optimization/)** - Desktop Application Packaging Optimization 📦
  - Switched from portable mode to ZIP package mode.
  - Resolved storage path detection issues.
  - Simplified code architecture and improved user experience.

- **[119-csp-safe-template-processing](./119-csp-safe-template-processing/)** - CSP-Safe Template Processing 🔒
  - Resolved template compilation failures caused by browser extension CSP restrictions.
  - Implemented an environment-adaptive template processing mechanism.
  - Maintained cross-platform functional integrity and backward compatibility.

## 🔍 Quick Find Guide

### Find by Problem Type
- **Startup issues** → 102-web-architecture-refactor
- **Display anomalies** → 112-desktop-ipc-fixes
- **Storage issues** → 110-desktop-indexeddb-fix, 114-desktop-file-storage, 116-desktop-packaging-optimization
- **Data consistency issues** → 114-desktop-file-storage, 115-ipc-serialization-fixes
- **Serialization errors** → 112-desktop-ipc-fixes, 115-ipc-serialization-fixes
- **Application exit issues** → 114-desktop-file-storage
- **Language setting issues** → 112-desktop-ipc-fixes
- **Layout issues** → 108-layout-system
- **Theme issues** → 109-theme-system
- **Template issues** → 106-template-management, 119-csp-safe-template-processing
- **Component issues** → 107-component-standardization
- **CSP security issues** → 119-csp-safe-template-processing
- **Browser extension issues** → 119-csp-safe-template-processing

### Find by Technology Stack
- **Electron related** → 103, 110, 111, 112, 114
- **Vue/Frontend related** → 102, 104, 105, 107, 108, 109
- **Browser extension related** → 119
- **Architecture design related** → 101, 102, 103, 111, 113
- **Service layer related** → 101, 106, 113, 119
- **IPC communication related** → 103, 111, 112
- **Template system related** → 106, 119

### Find by Development Stage
- **Initial project architecture** → 101, 102, 103
- **Feature development stage** → 104, 105, 106, 107
- **Optimization and improvement stage** → 108, 109
- **Problem fixing stage** → 110, 111, 112, 114, 119
- **Refactoring and improvement stage** → 113

### Find by Experience Type
- **Architecture design experience** → 101, 102, 103, 111
- **Feature development experience** → 106, 107
- **UI/UX design experience** → 108, 109
- **Problem troubleshooting experience** → 110, 112, 114, 119
- **Refactoring practice experience** → 101, 113

## 📖 Usage Suggestions

### Onboarding Path for Newcomers
1. **Understand the architecture** → 101 → 102 → 103
2. **Learn feature development** → 106 → 107
3. **Master system optimization** → 108 → 109
4. **Learn problem troubleshooting** → 110 → 112 → 114

### Problem Solving Path
1. **Determine the problem type** → See "Find by Problem Type"
2. **Find the relevant document** → Read the README for an overview
3. **Dive into technical details** → See experience.md and troubleshooting.md
4. **Apply the solution** → Refer to implementation.md

### Experience Learning Path
1. **Choose an area of interest** → See "Find by Technology Stack"
2. **Read in chronological order** → Understand the evolution process
3. **Extract key experiences** → Focus on experience.md
4. **Build a knowledge system** → Integrate related experiences

---

**💡 Tip**: Each document contains a complete background, implementation, and summary of experience. It is recommended to read selectively according to actual needs.
