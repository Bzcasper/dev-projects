# Storage Key Architecture Design

## 📋 Overview

This document details the two uses of storage keys in the application and their relationship, addressing the architectural issue of incomplete data export.

## 🔍 Two Uses of Storage Keys

### 1. Storage Layer Usage (Physical Storage Keys)

**Purpose:** Actual data storage operations (localStorage, Dexie, file storage, etc.)

#### UI Settings Managed by PreferenceService
```typescript
// PreferenceService adds the 'pref:' prefix
private readonly PREFIX = 'pref:';

// Logical key name -> Physical storage key name
'app:settings:ui:theme-id' -> 'pref:app:settings:ui:theme-id'
'app:settings:ui:preferred-language' -> 'pref:app:settings:ui:preferred-language'
'app:selected-optimize-model' -> 'pref:app:selected-optimize-model'
'app:selected-test-model' -> 'pref:app:selected-test-model'
'app:selected-optimize-template' -> 'pref:app:selected-optimize-template'
'app:selected-user-optimize-template' -> 'pref:app:selected-user-optimize-template'
'app:selected-iterate-template' -> 'pref:app:selected-iterate-template'
```

#### Directly Stored Data
```typescript
// Core services use storage directly, without a prefix
'models'                                    // ModelManager
'user-templates'                           // TemplateManager
'prompt_history'                          // HistoryManager
```

### 2. Import/Export JSON Keys (Logical Key Names)

**Purpose:** JSON data exchange format for data import and export.

```json
{
  "version": 1,
  "data": {
    "userSettings": {
      "app:settings:ui:theme-id": "dark",           // Logical key name
      "app:settings:ui:preferred-language": "zh-CN", // Logical key name
      "app:settings:ui:builtin-template-language": "zh-CN", // Now also via PreferenceService
      "app:selected-optimize-model": "gemini",
      "app:selected-test-model": "siliconflow",
      "app:selected-optimize-template": "general-optimize",
      "app:selected-user-optimize-template": "user-template-id",
      "app:selected-iterate-template": "iterate"
    },
    "models": [...],
    "userTemplates": [...],
    "history": [...]
  }
}
```

## ❌ Discovered Architectural Issue

### Problem Description
DataManager directly uses logical key names to find storage during export, but the actual stored key names may have prefixes, leading to data not being found.

### Root Cause
```typescript
// ❌ Original incorrect implementation
for (const key of UI_SETTINGS_KEYS) {
  const value = await this.storage.getItem(key); // Looks for 'app:settings:ui:theme-id'
  // But the actual stored key is 'pref:app:settings:ui:theme-id'
}
```

### Scope of Impact
- User-exported JSON only contains 4 setting items instead of the expected 8.
- UI settings stored via PreferenceService cannot be exported.
- User preferences may not be correctly restored during data import.

## ✅ Solution

### Architectural Improvement
DataManager now distinguishes between two storage methods and uses the correct service to retrieve data:

```typescript
// Setting keys stored via PreferenceService
const PREFERENCE_BASED_KEYS = [
  'app:settings:ui:theme-id',
  'app:settings:ui:preferred-language',
  'app:selected-optimize-model',
  'app:selected-test-model',
  'app:selected-optimize-template',
  'app:selected-user-optimize-template',
  'app:selected-iterate-template'
] as const;

// Directly stored setting keys
const DIRECT_STORAGE_KEYS = [
  'app:settings:ui:builtin-template-language',
] as const;
```

### Export Logic Fix
```typescript
// ✅ Fixed export logic
// Export settings stored via PreferenceService
for (const key of PREFERENCE_BASED_KEYS) {
  const value = await this.preferenceService.get(key, null);
  if (value !== null) {
    userSettings[key] = String(value);
  }
}

// Export directly stored settings
for (const key of DIRECT_STORAGE_KEYS) {
  const value = await this.storage.getItem(key);
  if (value !== null) {
    userSettings[key] = value;
  }
}
```

### Import Logic Fix
```typescript
// ✅ Fixed import logic
if (PREFERENCE_BASED_KEYS.includes(normalizedKey as any)) {
  // Store via PreferenceService
  await this.preferenceService.set(normalizedKey, value);
} else if (DIRECT_STORAGE_KEYS.includes(normalizedKey as any)) {
  // Store directly
  await this.storage.setItem(normalizedKey, value);
}
```

## 🏗️ Architectural Principles

### 1. Layered Storage
- **PreferenceService Layer** - Manages user preference settings, adds prefixes to avoid conflicts.
- **Direct Storage Layer** - Manages application data, uses original key names.

### 2. Key Name Mapping
- **Logical Key Names** - Used for business logic and data exchange, maintaining semantic clarity.
- **Physical Key Names** - Used for actual storage, may contain prefixes or other modifiers.

### 3. Service Responsibilities
- **PreferenceService** - Responsible for storing and retrieving user preferences.
- **DataManager** - Responsible for data import and export, knowing how to correctly retrieve various data.
- **Core Services** - Responsible for managing business data, using appropriate storage methods.

## 📊 Storage Key Classification

| Key Name | Storage Method | Physical Key Name | Purpose |
|---|---|---|---|
| `app:settings:ui:theme-id` | PreferenceService | `pref:app:settings:ui:theme-id` | Theme setting |
| `app:settings:ui:preferred-language` | PreferenceService | `pref:app:settings:ui:preferred-language` | UI language |
| `app:settings:ui:builtin-template-language` | PreferenceService | `pref:app:settings:ui:builtin-template-language` | Built-in template language |
| `app:selected-optimize-model` | PreferenceService | `pref:app:selected-optimize-model` | Optimization model selection |
| `app:selected-test-model` | PreferenceService | `pref:app:selected-test-model` | Test model selection |
| `app:selected-optimize-template` | PreferenceService | `pref:app:selected-optimize-template` | System optimization template |
| `app:selected-user-optimize-template` | PreferenceService | `pref:app:selected-user-optimize-template` | User optimization template |
| `app:selected-iterate-template` | PreferenceService | `pref:app:selected-iterate-template` | Iteration template |
| `models` | Direct Storage | `models` | Model configuration |
| `user-templates` | Direct Storage | `user-templates` | User templates |
| `prompt_history` | Direct Storage | `prompt_history` | Prompt history |

## 🔄 Backward Compatibility

### Key Name Conversion
The application supports importing data from old versions, automatically converting through `LEGACY_KEY_MAPPING`:

```typescript
const LEGACY_KEY_MAPPING: Record<string, string> = {
  'theme-id': 'app:settings:ui:theme-id',
  'preferred-language': 'app:settings:ui:preferred-language',
  'builtin-template-language': 'app:settings:ui:builtin-template-language',
};
```

### Data Migration
When importing data from an old version, the system will:
1. Identify the old key name format.
2. Convert to the new standard key name.
3. Save using the correct storage method.
4. Display conversion information in the console.

## 🚀 Best Practices

### 1. Adding New Storage Keys
- Use unified constant definitions.
- Clarify the storage method (PreferenceService vs. Direct Storage).
- Update the classification arrays in DataManager.

### 2. Modifying Storage Methods
- Consider backward compatibility.
- Update import/export logic.
- Add data migration logic.

### 3. Test Validation
- Verify the integrity of data export.
- Test importing data from old versions.
- Check storage key consistency.

## 📝 Related Files

- **Constant Definitions**: `packages/ui/src/constants/storage-keys.ts`
- **Core Constants**: `packages/core/src/constants/storage-keys.ts`
- **Data Management**: `packages/core/src/services/data/manager.ts`
- **Preference Service**: `packages/core/src/services/preference/service.ts`
- **Test Documentation**: `docs/testing/ai-automation/storage-key-consistency/`
