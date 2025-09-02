# Development Process Archive

This is where refactoring records, design documents, experience summaries, etc., from the project development process are archived by feature for future tracking and troubleshooting.

## 📚 Archive Description

### Numbering Specification
- **Starting Number**: 101
- **Numbering Method**: Simple increment (101, 102, 103...)
- **Number Reservation**: Numbers are not reused even if a feature is deprecated.

### Archiving Principles
- **Archive by Feature**: All related documents for the same feature are placed together.
- **Complete Context**: Includes complete records of planning, design, implementation, experience, etc.
- **Chronological Order**: The numbering reflects the chronological order of development.

## 🗂️ Feature List

### Architecture Refactoring Series (Completed)
- [101-singleton-refactor](./101-singleton-refactor/) - Singleton Pattern Refactoring ✅
- [102-web-architecture-refactor](./102-web-architecture-refactor/) - Web Architecture Refactoring ✅
- [103-desktop-architecture](./103-desktop-architecture/) - Desktop Architecture ✅

### Feature Development Series
- [104-test-panel-refactor](./104-test-panel-refactor/) - Test Panel Refactoring 📋
- [105-output-display-v2](./105-output-display-v2/) - Output Display v2 📋
- [106-template-management](./106-template-management/) - Template Management Function 🔄
- [107-component-standardization](./107-component-standardization/) - Component Standardization Refactoring 🔄

### System Optimization Series (Completed)
- [108-layout-system](./108-layout-system/) - Layout System Experience Summary ✅
- [109-theme-system](./109-theme-system/) - Theme System Development ✅

### Problem Fixing Series (Completed)
- [110-desktop-indexeddb-fix](./110-desktop-indexeddb-fix/) - Desktop IndexedDB Problem Fix ✅
- [111-electron-preference-architecture](./111-electron-preference-architecture/) - Electron PreferenceService Architecture Refactoring and Race Condition Fix ✅
- [112-desktop-ipc-fixes](./112-desktop-ipc-fixes/) - Collection of Desktop IPC Fixes ✅

### Service Refactoring Series
- [113-full-service-refactoring](./113-full-service-refactoring/) - Comprehensive Service Refactoring 🔄

### Data Architecture Series (Completed)
- [114-desktop-file-storage](./114-desktop-file-storage/) - Desktop File Storage Implementation ✅
- [115-ipc-serialization-fixes](./115-ipc-serialization-fixes/) - IPC Serialization Problem Fix ✅
- [116-desktop-packaging-optimization](./116-desktop-packaging-optimization/) - Desktop Packaging Optimization ✅
- [117-import-export-architecture-refactor](./117-import-export-architecture-refactor/) - Import/Export Architecture Refactoring ✅

### System Integration Series (Completed)
- [118-desktop-auto-update-system](./118-desktop-auto-update-system/) - Desktop Application Release and Smart Update System ✅
- [119-csp-safe-template-processing](./119-csp-safe-template-processing/) - CSP Safe Template Processing ✅
- [120-mcp-server-module](./120-mcp-server-module/) - MCP Server Module Development ✅

### Feature Extension Series (Completed)
- [121-multi-custom-models-support](./121-multi-custom-models-support/) - Multi-Custom Models Environment Variable Support ✅
- [122-docker-api-proxy](./122-docker-api-proxy/) - Docker API Proxy Function Implementation ✅

## 📋 Document Structure

Each feature directory contains:
- **README.md** - Feature overview, timeline, status
- **Core Documents** (depending on the situation):
  - `plan.md` - Planning document
  - `design.md` - Design document
  - `implementation.md` - Implementation record
  - `experience.md` - Experience summary
  - `troubleshooting.md` - Troubleshooting checklist

## 🔍 Find Guide

### Find by Time
- **101-103**: Architecture refactoring at the end of December 2024
- **104-107**: Feature development from the end of December 2024 to July 2025
- **108-109**: System optimization in July 2025
- **110-113**: Fixes and refactoring from January to July 2025

### Find by Feature Category
- **Architecture Refactoring Series**: 101, 102, 103
- **Feature Development Series**: 104, 105, 106, 107
- **System Optimization Series**: 108, 109
- **Problem Fixing Series**: 110, 111, 112
- **Service Refactoring Series**: 113

### Find by Status
- **Completed**: 101, 102, 103, 108, 109, 110, 111, 112, 114, 115, 116, 117, 118, 119, 120, 121, 122
- **In Progress**: 106, 107, 113
- **Planned**: 104, 105

## 📝 Usage Instructions

1. **Find the relevant feature**: Find the corresponding directory by feature name or number.
2. **Understand the background**: Read README.md first to understand the feature overview.
3. **Dive into details**: View specific planning, design, or experience documents as needed.
4. **Troubleshooting**: If there are related problems, check troubleshooting.md.

## 🔄 Maintenance Instructions

- **New feature archiving**: Continue numbering from 123.
- **Document updates**: Update status and experience summaries promptly after feature completion.
- **Cross-referencing**: Establish reference relationships between related feature points.
- **Merging principle**: Consider merging when there are more than 3 related documents in the same functional area.
- **Quality standard**: Empty directories or documents with insufficient content should be merged or deleted.

## 📋 Organization Guide

### Archiving Standards
1. **Functional completeness**: Each feature point contains a complete chain of plan → design → implementation → experience.
2. **Avoid duplicate numbering**: Strictly assign numbers in chronological order and do not reuse them.
3. **Content quality**: Ensure that the document content is substantial and has practical value.

### Document Structure Specification
```
{number}-{feature-name}/
├── README.md (feature overview, timeline, status)
├── plan.md (planning document, optional)
├── design.md (design document, optional)
├── implementation.md (implementation record, optional)
├── experience.md (experience summary, required)
└── troubleshooting.md (troubleshooting checklist, optional)
```

## 📊 Statistics

- **Total Archives**: 22
- **Completed**: 17
- **In Progress**: 3
- **Planned**: 2
- **Next Number**: 123
