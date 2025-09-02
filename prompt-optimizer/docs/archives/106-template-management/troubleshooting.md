# Template Management Troubleshooting Checklist

## Common Issues and Solutions

### 1. Template Deletion Error: "Template not found"

**Symptoms:**
- `TemplateError: Template not found: template-xxx` error occurs when deleting a template.
- The error is usually thrown at `index.js:1683`.

**Cause:**
- Missing `await` keyword in an asynchronous method call.
- Timing issue: `deleteTemplate` and `loadTemplates` execute concurrently.
- The template is accessed by another operation during the deletion process.

**Solution:**
1. Ensure all asynchronous template operations use `await`:
   ```javascript
   // ❌ Incorrect
   getTemplateManager.value.deleteTemplate(templateId)
   await loadTemplates()

   // ✅ Correct
   await getTemplateManager.value.deleteTemplate(templateId)
   await loadTemplates()
   ```

2. Check for asynchronous calls in the following functions:
   - `confirmDelete()`
   - `handleSubmit()`
   - `handleFileImport()`
   - `applyMigration()`

### 2. Incorrect Template Type: Adding a template after switching categories in the management interface still results in the wrong type.

**Symptoms:**
- After switching to the "User Prompts" category in the template management interface, clicking the "Add" button still adds a "System Prompt" template.
- The type of the added template does not match the currently displayed category.

**Cause:**
- **Core Issue**: The `getCurrentTemplateType()` function returns a fixed `props.templateType` and does not change when the user switches categories within the management interface.
- The template type used when adding a template comes from the wrong source.

**Important Concept Clarification:**
- **Category Switching in Template Management**: Users can switch between viewing different types of templates within the management interface.
- **"Add" Button Behavior**: It should determine the type of template to add based on the currently displayed category.
  - Current category is "System Prompts" → Add a system prompt template (`templateType: 'optimize'`).
  - Current category is "User Prompts" → Add a user prompt template (`templateType: 'userOptimize'`).
  - Current category is "Iteration Prompts" → Add an iteration prompt template (`templateType: 'iterate'`).

**Solution:**
1. Correct the `getCurrentTemplateType()` function to decide based on the current category, not the props:
   ```javascript
   // ❌ Incorrect: Uses a fixed props value
   function getCurrentTemplateType() {
     return props.templateType
   }

   // ✅ Correct: Decides based on the current category
   function getCurrentTemplateType() {
     switch (currentCategory.value) {
       case 'system-optimize': return 'optimize'
       case 'user-optimize': return 'userOptimize'
       case 'iterate': return 'iterate'
       default: return 'optimize'
     }
   }
   ```

2. Ensure the category switch buttons correctly update `currentCategory`:
   ```javascript
   @click="currentCategory = 'user-optimize'"
   ```

3. Verify that the correct template type is used when adding a template:
   ```javascript
   templateType: getCurrentTemplateType() // Now returns the correct type based on the current category
   ```

### 3. Template Manager Opens to the Wrong Location

**Symptoms:**
- Clicking "Manage" from the system optimization prompt dropdown opens a different category.
- Opening the template manager from the navigation bar navigates to the wrong category.
- The initial location of the template manager does not match its opening source.

**Cause:**
- `currentCategory` is only set on component initialization and does not react to changes in `props.templateType`.
- The default logic for opening from the navigation bar is incorrect.

**Solution:**
1. Add a watcher for changes to `props.templateType`:
   ```javascript
   // Watch for changes in props.templateType and update the current category
   watch(() => props.templateType, (newTemplateType) => {
     currentCategory.value = getCategoryFromProps()
   }, { immediate: true })
   ```

2. Correct the default logic for opening from the navigation bar:
   ```javascript
   // ❌ Incorrect: Decides based on the current optimization mode
   const openTemplateManager = (templateType?: string) => {
     currentTemplateManagerType.value = templateType || (selectedOptimizationMode.value === 'system' ? 'optimize' : 'userOptimize')
   }

   // ✅ Correct: Defaults to system optimization prompts
   const openTemplateManager = (templateType?: string) => {
     currentTemplateManagerType.value = templateType || 'optimize'
   }
   ```

3. Ensure the correct navigation rules:
   - From system optimization prompt dropdown → Navigate to the system optimization prompt category.
   - From user optimization prompt dropdown → Navigate to the user optimization prompt category.
   - From iteration prompt dropdown → Navigate to the iteration prompt category.
   - From navigation bar → Navigate to the system optimization prompt category (default first).

### 4. Template Save Fails

**Symptoms:**
- An error occurs when saving a template.
- The template list is not updated.

**Checklist:**
- [ ] Is `await` used for the `saveTemplate()` call?
- [ ] Is `await` used for the `loadTemplates()` call?
- [ ] Is the template data format correct?
- [ ] Does the template ID meet the format requirements (at least 3 characters, only lowercase letters, numbers, and hyphens)?

### 5. Template Import Fails

**Symptoms:**
- An error occurs when importing a JSON file.
- The template list is not updated after import.

**Checklist:**
- [ ] Is `await` used for the `importTemplate()` call?
- [ ] Is `await` used for the `loadTemplates()` call?
- [ ] Is the JSON file format correct?
- [ ] Does the template pass schema validation?

### 6. Architectural Design Principles

**Service Dependency Injection:**
- [ ] Use dependency injection instead of creating service instances directly.
- [ ] Avoid using `StorageFactory.createDefault()` in UI components.
- [ ] Ensure service instances are consistent throughout the application.

**Error Handling:**
- [ ] Throw exceptions immediately instead of handling them silently.
- [ ] Avoid retry mechanisms that mask problems.
- [ ] Fail fast when service checks fail.

**Asynchronous Operations:**
- [ ] Use `await` for all asynchronous method calls.
- [ ] Avoid concurrently executing potentially conflicting operations.
- [ ] Ensure the correct order of operations.

### 7. Code Review Checklist

**When reviewing template management related code, check:**
- [ ] Are all `templateManager` method calls correctly using `await`?
- [ ] Are asynchronous functions correctly declared as `async`?
- [ ] Is error handling complete?
- [ ] Is there a risk of race conditions?
- [ ] Is the template ID generation and validation logic correct?
- [ ] Have harmful default values been removed?
- [ ] Is the optimization mode correctly passed to all relevant components?

### 8. Testing Suggestions

**Unit Tests:**
- [ ] Test the asynchronous behavior of template CRUD operations.
- [ ] Test exception handling in error scenarios.
- [ ] Test the safety of concurrent operations.

**Integration Tests:**
- [ ] Test the complete template management flow.
- [ ] Test the interaction between UI components and the service layer.
- [ ] Test IPC communication in the Electron environment.

### 9. Iteration Page Template Selection Not Updating After Built-in Template Language Switch

**Symptoms:**
- After switching the built-in template language in the template management interface, the optimization prompt dropdown on the main interface updates correctly.
- However, after performing an optimization and clicking "Continue Optimization," the template selection on the iteration page shows the template name in the old language.
- The dropdown list has been updated to the new language, but the currently selected item is still in the old language.
- The new language is actually used when sending the request (because it's re-fetched via templateId).

**Root Cause:**
- **Different Event Propagation Paths**: The `TemplateSelect` components on the main interface and the iteration page are at different levels.
- **Component Hierarchy Difference**:
  - Main interface: `App.vue → TemplateSelectUI` (direct reference)
  - Iteration page: `App.vue → PromptPanelUI → TemplateSelect` (indirect reference)
- **Missing Refresh Mechanism**: The language switch event cannot propagate to the deeply nested `TemplateSelect` component.

**Detailed Analysis:**
1. **Why the main interface is normal**:
   - `templateSelectRef?.refresh?.()` is called automatically when `TemplateManager` closes.
   - Simple component hierarchy, short event propagation path.
   - Has a direct reference and refresh mechanism.

2. **Why the iteration page is abnormal**:
   - The `TemplateSelect` on the iteration page is not included in the refresh logic for the language switch.
   - The component hierarchy is deeper, requiring an additional event propagation mechanism.
   - A complete event propagation chain was not previously established.

**Solution:**
1. **Establish an Event Propagation Chain**:
   ```javascript
   // TemplateManager.vue - Emit a language change event
   const handleLanguageChanged = async (newLanguage: string) => {
     // ... existing logic ...

     // Emit a language change event to notify the parent component
     emit('languageChanged', newLanguage)
   }
   ```

2. **App.vue Handles and Propagates the Event**:
   ```javascript
   // Handle template language change
   const handleTemplateLanguageChanged = (newLanguage: string) => {
     // Refresh the template select component on the main interface
     if (templateSelectRef.value?.refresh) {
       templateSelectRef.value.refresh()
     }

     // Refresh the template select component on the iteration page
     if (promptPanelRef.value?.refreshIterateTemplateSelect) {
       promptPanelRef.value.refreshIterateTemplateSelect()
     }
   }
   ```

3. **PromptPanel Exposes a Refresh Method**:
   ```javascript
   // PromptPanel.vue - Expose a method to refresh the iteration template
   const refreshIterateTemplateSelect = () => {
     if (iterateTemplateSelectRef.value?.refresh) {
       iterateTemplateSelectRef.value.refresh()
     }
   }

   defineExpose({
     refreshIterateTemplateSelect
   })
   ```

**Fix Validation:**
- [x] The language switch event propagates correctly to all `TemplateSelect` components.
- [x] The dropdown list on the iteration page updates correctly to the new language.
- [x] The user can select the correct language template on the iteration page.
- [x] The behavior of the main interface and the iteration page is consistent.

**Lessons Learned:**
1. **Component Hierarchy Affects Event Propagation**: Deeply nested components require additional event propagation mechanisms.
2. **Unified Refresh Mechanism**: All related components should have a unified refresh interface.
3. **Complete Event Chain**: Ensure events can propagate to all components that need to respond.
4. **Architectural Consistency**: Components with the same functionality should have the same response mechanism.

### 10. Monitoring and Debugging

**Logging:**
- [ ] Log the start and end of template operations.
- [ ] Log the timing of asynchronous operations.
- [ ] Log detailed context for errors.

**Debugging Techniques:**
- [ ] Use browser developer tools to inspect the asynchronous call stack.
- [ ] Check the initialization state of the template manager.
- [ ] Verify the integrity of template data.

## Preventive Measures

1. **Coding Standards:**
   - All asynchronous template operations must use `await`.
   - Asynchronous functions must be declared as `async`.
   - Error handling must be complete.
   - Remove all harmful default values, especially those related to optimization mode.

2. **Architectural Principles:**
   - Use dependency injection to manage service instances.
   - Avoid creating services directly in the UI layer.
   - Maintain the consistency of service instances.

3. **Test Coverage:**
   - Write unit tests for all template operations.
   - Test the correctness of asynchronous operations.
   - Test error handling.

4. **Code Review:**
   - Focus on the correctness of asynchronous operations.
   - Verify the completeness of error handling.
   - Ensure adherence to architectural principles.
