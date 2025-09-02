# Test 003: Code Storage Key Consistency Check

## 📋 Test Information
- **Test ID:** TEST-003
- **Test Type:** Code Review Test
- **Priority:** High
- **Estimated Execution Time:** 10 minutes

## 🎯 Test Objective
To verify through code inspection that all storage operations use a unified constant definition, with no hard-coded magic strings.

## 📝 Test Scope
1. Use of storage keys in UI components.
2. Use of storage keys in core services.
3. Use of storage keys in test files.
4. Consistency of constant definitions.

## 🧪 Checklist

### UI Component Storage Key Usage Check

#### ThemeToggleUI.vue
- [ ] **Import Constant** - `UI_SETTINGS_KEYS` is imported correctly.
- [ ] **Use Constant** - Uses `UI_SETTINGS_KEYS.THEME_ID` instead of `'theme-id'`.
- [ ] **All References** - All `getPreference` and `setPreference` calls use the constant.

**Code Location to Check:**
```typescript
// packages/ui/src/components/ThemeToggleUI.vue
import { UI_SETTINGS_KEYS } from '../constants/storage-keys';

// Should use:
await setPreference(UI_SETTINGS_KEYS.THEME_ID, theme.id);
const themeId = await getPreference(UI_SETTINGS_KEYS.THEME_ID, defaultTheme);

// Instead of:
await setPreference('theme-id', theme.id); // ❌
```

#### LanguageSwitch.vue
- [ ] **Import Constant** - `UI_SETTINGS_KEYS` is imported correctly.
- [ ] **Use Constant** - Uses `UI_SETTINGS_KEYS.PREFERRED_LANGUAGE`.

#### BuiltinTemplateLanguageSwitch.vue
- [ ] **Service Consistency** - `TemplateLanguageService` uses the correct full key name.

### Core Service Storage Key Usage Check

#### ModelManager
- [ ] **Import Constant** - `CORE_SERVICE_KEYS` is imported correctly.
- [ ] **Use Constant** - Uses `CORE_SERVICE_KEYS.MODELS` instead of `'models'`.

**Code Location to Check:**
```typescript
// packages/core/src/services/model/manager.ts
import { CORE_SERVICE_KEYS } from '../../constants/storage-keys';

export class ModelManager implements IModelManager {
  private readonly storageKey = CORE_SERVICE_KEYS.MODELS; // ✅
  // Instead of:
  // private readonly storageKey = 'models'; // ❌
}
```

#### TemplateManager
- [ ] **Import Constant** - `CORE_SERVICE_KEYS` is imported correctly.
- [ ] **Use Constant** - Uses `CORE_SERVICE_KEYS.USER_TEMPLATES` instead of `'user-templates'`.

**Code Location to Check:**
```typescript
// packages/core/src/services/template/manager.ts
this.config = {
  storageKey: config?.storageKey || CORE_SERVICE_KEYS.USER_TEMPLATES, // ✅
  // Instead of:
  // storageKey: config?.storageKey || 'user-templates', // ❌
};
```

#### HistoryManager
- [ ] **Import Constant** - `CORE_SERVICE_KEYS` is imported correctly.
- [ ] **Use Constant** - Uses `CORE_SERVICE_KEYS.PROMPT_HISTORY` instead of `'prompt_history'`.

#### TemplateLanguageService
- [ ] **Use Full Key Name** - Uses `'app:settings:ui:builtin-template-language'` instead of `'builtin-template-language'`.

**Code Location to Check:**
```typescript
// packages/core/src/services/template/languageService.ts
export class TemplateLanguageService implements ITemplateLanguageService {
  private readonly STORAGE_KEY = 'app:settings:ui:builtin-template-language'; // ✅
  // Instead of:
  // private readonly STORAGE_KEY = 'builtin-template-language'; // ❌
}
```

### Constant Definition Consistency Check

#### UI Package Constant Definition
- [ ] **File Exists** - `packages/ui/src/constants/storage-keys.ts` exists.
- [ ] **Includes Core Service Keys** - Contains `CORE_SERVICE_KEYS` definition.
- [ ] **Complete Type Definitions** - Contains all necessary type definitions.

#### Core Package Constant Definition
- [ ] **File Exists** - `packages/core/src/constants/storage-keys.ts` exists.
- [ ] **In Sync with UI Package** - UI setting keys are consistent with the UI package.
- [ ] **Complete Exports** - Exports all necessary constants and types.

#### DataManager Sync
- [ ] **Uses Unified Constants** - `DataManager`'s `UI_SETTINGS_KEYS` is consistent with the constants file.
- [ ] **Correct Import** - Imports from the constants file instead of redefining.

### Test File Check

#### Unit Tests
- [ ] **ModelManager Test** - Uses the correct storage key constant.
- [ ] **TemplateManager Test** - Uses the correct storage key constant.
- [ ] **HistoryManager Test** - Uses the correct storage key constant.
- [ ] **TemplateLanguageService Test** - Uses the correct full key name.

**Code Location to Check:**
```typescript
// packages/core/tests/unit/template/languageService.test.ts
expect(mockStorage.getItem).toHaveBeenCalledWith('app:settings:ui:builtin-template-language'); // ✅
// Instead of:
// expect(mockStorage.getItem).toHaveBeenCalledWith('builtin-template-language'); // ❌
```

## 🔍 Automated Check Script

### Search for Magic Strings
```bash
# Search for possible magic string usage
grep -r "theme-id" packages/ --exclude-dir=node_modules
grep -r "preferred-language" packages/ --exclude-dir=node_modules
grep -r "builtin-template-language" packages/ --exclude-dir=node_modules
grep -r "'models'" packages/ --exclude-dir=node_modules
grep -r "'user-templates'" packages/ --exclude-dir=node_modules
grep -r "'prompt_history'" packages/ --exclude-dir=node_modules
```

### Verify Constant Usage
```bash
# Verify constant imports
grep -r "UI_SETTINGS_KEYS" packages/ui/src/
grep -r "CORE_SERVICE_KEYS" packages/core/src/
grep -r "MODEL_SELECTION_KEYS" packages/ui/src/
grep -r "TEMPLATE_SELECTION_KEYS" packages/ui/src/
```

## ✅ Verification Criteria

### Pass Criteria
- [ ] All UI components use constants instead of magic strings.
- [ ] All core services use constants instead of magic strings.
- [ ] Constant definitions are consistent across both packages.
- [ ] Test files use the correct key names.
- [ ] No hard-coded storage key strings are found.

### Fail Criteria
- Any code found directly using string literals as storage keys.
- Inconsistent or missing constant definitions.
- Test files using incorrect key names.

## 📊 Check Results

### Execution Information
- **Check Time:** [To be filled]
- **Scope of Check:** [Number of files]
- **Check Tool:** [Manual/Script]

### Discovered Issues
1.  **File:** [File Path]
    **Issue:** [Issue Description]
    **Suggestion:** [Repair Suggestion]

2.  **File:** [File Path]
    **Issue:** [Issue Description]
    **Suggestion:** [Repair Suggestion]

### Check Statistics
- **Number of Files Checked:** [Number]
- **Number of Issues Found:** [Number]
- **Files Needing Repair:** [Number]
- **Files Compliant with Standard:** [Number]

## 🔄 Follow-up Actions
- [ ] Fix all discovered issues.
- [ ] Create ESLint rules to prevent magic strings.
- [ ] Update development documentation and coding standards.
- [ ] Set up CI checks to ensure code quality.

## 📝 Improvement Suggestions

### Tooling Suggestions
1.  **ESLint Rule** - Create a custom rule to detect magic strings for storage keys.
2.  **TypeScript Strict Mode** - Use literal types to restrict storage keys.
3.  **Pre-commit Hook** - Automatically check code consistency before committing.

### Documentation Suggestions
1.  **Coding Standards** - Clearly define storage key usage standards.
2.  **Development Guide** - Provide best practices for using storage keys.
3.  **Architecture Document** - Explain the storage key management strategy.
