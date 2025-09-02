# Language Switch Button Fix

## 🎯 Problem Description

### Core Issue
The language switch button in the functional prompt management displays "Object Promise" instead of the correct language name (e.g., "中文" or "English").

### How it Manifests
- The UI component displays the abnormal text "Object Promise".
- The language switch functionality does not work correctly.
- Inconsistent behavior between Web and Electron environments.

### Root Cause
- **Inconsistent Asynchronous Interface**: The method in the Electron environment returns a Promise but is used as a synchronous value.
- **Incorrect IPC Call Handling**: The result of an asynchronous IPC call is not correctly awaited.
- **Mismatched Interface Definitions**: Different method signatures are used for the Web and Electron environments.

## 🔧 Solution

### 1. Unify Asynchronous Interface Design
Create an `ITemplateLanguageService` interface to ensure consistency across environments:

```typescript
export interface ITemplateLanguageService {
  initialize(): Promise<void>;
  getCurrentLanguage(): Promise<BuiltinTemplateLanguage>;
  setLanguage(language: BuiltinTemplateLanguage): Promise<void>;
  toggleLanguage(): Promise<BuiltinTemplateLanguage>;
  isValidLanguage(language: string): Promise<boolean>;
  getSupportedLanguages(): Promise<BuiltinTemplateLanguage[]>;
}
```

### 2. Fix Asynchronous Calls in Vue Component
```vue
<!-- Before Fix -->
<span>{{ languageService.getCurrentLanguage() }}</span>

<!-- After Fix -->
<span>{{ currentLanguage }}</span>

<script setup>
const currentLanguage = ref('')

onMounted(async () => {
  currentLanguage.value = await languageService.getCurrentLanguage()
})
</script>
```

### 3. Complete the IPC Call Chain
```javascript
// preload.js
templateLanguage: {
  getCurrentLanguage: async () => {
    const result = await ipcRenderer.invoke('template-getCurrentBuiltinTemplateLanguage');
    if (!result.success) throw new Error(result.error);
    return result.data;
  }
}

// main.js
ipcMain.handle('template-getCurrentBuiltinTemplateLanguage', async (event) => {
  try {
    const result = await templateManager.getCurrentBuiltinTemplateLanguage();
    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
});
```

## ✅ Fix Validation

### Validation Checklist
- [x] The language switch button correctly displays "中文" or "English".
- [x] The "Object Promise" display issue is completely resolved.
- [x] Behavior is consistent across Web and Electron environments.
- [x] All asynchronous calls are handled correctly.

## 💡 Lessons Learned

### Core Principles
1.  **Interface Consistency**: Interfaces across different environments must maintain consistent asynchronicity.
2.  **Error Handling**: Let errors propagate naturally to facilitate problem diagnosis.
3.  **Type Safety**: Use TypeScript to ensure the completeness of interface implementations.
4.  **Event Propagation**: Ensure language switch events can propagate to all relevant components.

### Best Practices
1.  **Unified Asynchronicity**: All cross-environment interfaces should be asynchronous.
2.  **Interface-Driven**: Define the interface first, then implement the specific classes.
3.  **Complete Testing**: Verify functionality in both environments.
4.  **Event Chain Integrity**: Establish a complete event propagation mechanism to ensure that even deeply nested components can respond to state changes.

### Related Issues
-   **Iteration Page Template Selection Not Updating**: After a language switch, the template selection on the iteration page fails to update correctly due to component hierarchy differences and a missing event propagation mechanism. The solution is to establish a complete event propagation chain to ensure all `TemplateSelect` components can respond to the language switch event. See section 9 of `106-template-management/troubleshooting.md` for details.

This fix establishes a complete asynchronous interface design pattern, providing a standard for subsequent IPC development.
