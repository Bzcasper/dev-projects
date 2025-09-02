# Storage Key Consistency Test

## 📋 Test Purpose

To verify that all uses of storage keys within the application adhere to a unified constant definition, avoiding issues like incomplete data exports and inconsistent key names caused by magic values.

## 🎯 Test Background

While fixing the issue of incomplete user settings exports, several storage key consistency problems were discovered:

### Discovered Issues
1.  **Theme Setting Key Mismatch** - `ThemeToggleUI.vue` used `'theme-id'` instead of `'app:settings:ui:theme-id'`.
2.  **Built-in Template Language Key Mismatch** - `TemplateLanguageService` used `'builtin-template-language'` instead of `'app:settings:ui:builtin-template-language'`.
3.  **Core Services Using Magic Values** - `ModelManager`, `TemplateManager`, and `HistoryManager` used string literals directly.

### Corrective Actions
1.  Created a unified storage key constants file.
2.  Updated all components and services to use the constants.
3.  Established AI-driven automated tests to ensure consistency.

## 🧪 Test Scenarios

### Scenario 1: Data Export Completeness Verification
**Test Purpose:** To verify that all user settings can be exported correctly.

**AI Execution Guide:**
```javascript
// 1. Set various user preferences
browser_click(element="Theme Toggle Button", ref="theme-toggle");
browser_wait_for(time=1);

browser_click(element="Language Toggle Button", ref="language-toggle");
browser_wait_for(time=1);

browser_click(element="Built-in Template Language Toggle Button", ref="builtin-lang-toggle");
browser_wait_for(time=1);

// 2. Select different models
browser_click(element="Model Manager Button", ref="model-manager");
browser_wait_for(time=2);
// Select optimization and testing models
browser_press_key("Escape");

// 3. Export data
browser_click(element="Data Manager Button", ref="data-manager");
browser_wait_for(time=1);
browser_click(element="Export Data Button", ref="export-button");
browser_wait_for(time=3);
```

**Verification Points:**
- [ ] The exported JSON contains all 8 user setting items.
- [ ] Theme setting is exported correctly (`app:settings:ui:theme-id`).
- [ ] Language setting is exported correctly (`app:settings:ui:preferred-language`).
- [ ] Built-in template language setting is exported correctly (`app:settings:ui:builtin-template-language`).
- [ ] Model selection settings are exported correctly.
- [ ] Template selection settings are exported correctly.

### Scenario 2: Data Import Compatibility Verification
**Test Purpose:** To verify backward compatibility with older data formats.

**AI Execution Guide:**
```javascript
// 1. Prepare old-format test data
const legacyData = {
  "version": 1,
  "data": {
    "userSettings": {
      "theme-id": "dark",
      "preferred-language": "en-US",
      "builtin-template-language": "zh-CN",
      "app:selected-optimize-model": "gemini"
    }
  }
};

// 2. Import test data
browser_click(element="Data Manager Button", ref="data-manager");
browser_wait_for(time=1);
// Upload the test file
browser_click(element="Import Data Button", ref="import-button");
browser_wait_for(time=2);

// 3. Verify settings after import
browser_snapshot();
```

**Verification Points:**
- [ ] Old version key names are correctly converted to new version key names.
- [ ] Settings (theme, language, etc.) are effective after import.
- [ ] The console displays key name conversion information.
- [ ] Re-exporting data uses the new key name format.

### Scenario 3: Storage Key Constant Usage Verification
**Test Purpose:** To verify through code inspection that all storage operations use constants.

**AI Execution Guide:**
```javascript
// This is a code review test that requires checking the source code.
// 1. Check if UI components use constants.
// 2. Check if core services use constants.
// 3. Check if test files use constants.
```

**Verification Points:**
- [ ] `ThemeToggleUI.vue` uses `UI_SETTINGS_KEYS.THEME_ID`.
- [ ] `LanguageSwitch.vue` uses `UI_SETTINGS_KEYS.PREFERRED_LANGUAGE`.
- [ ] `TemplateLanguageService` uses the correct full key name.
- [ ] `ModelManager` uses `CORE_SERVICE_KEYS.MODELS`.
- [ ] `TemplateManager` uses `CORE_SERVICE_KEYS.USER_TEMPLATES`.
- [ ] `HistoryManager` uses `CORE_SERVICE_KEYS.PROMPT_HISTORY`.

## 📊 Test Result Log

### Test Execution Record
- **Execution Time:** [To be filled]
- **Test Environment:** [Web/Desktop]
- **Execution Result:** [Pass/Fail]

### Discovered Issues
1. [Issue Description]
2. [Issue Description]

### Repair Suggestions
1. [Repair Suggestion]
2. [Repair Suggestion]

## 🔄 Continuous Monitoring

### Automated Checkpoints
1.  **Build-time Check** - Ensure all storage keys use constant definitions.
2.  **Test Coverage** - Verify the completeness of storage key constants.
3.  **Code Review** - Prohibit the direct use of string literals as storage keys.

### Preventive Measures
1.  **ESLint Rule** - Detect the use of magic strings.
2.  **TypeScript Types** - Enforce the use of storage key types.
3.  **Documentation Update** - Maintain a guide for using storage keys.

## 📝 Related Documents

- [Storage Key Constant Definitions](../../../../packages/ui/src/constants/storage-keys.ts)
- [Core Service Storage Keys](../../../../packages/core/src/constants/storage-keys.ts)
- [Data Manager Implementation](../../../../packages/core/src/services/data/manager.ts)
