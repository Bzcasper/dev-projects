# Test 001: Data Export Completeness Verification

## 📋 Test Information
- **Test ID:** TEST-001
- **Test Type:** Functional Test
- **Priority:** High
- **Estimated Execution Time:** 5 minutes

## 🎯 Test Objective
To verify that after fixing the storage key consistency issues, all user settings can be correctly exported to a JSON file.

## 📝 Prerequisites
1. The application is launched and initialized.
2. The user can access settings and data management features.
3. The browser supports file download functionality.

## 🧪 Test Steps

### Step 1: Set User Preferences
```javascript
// 1.1 Switch theme settings
browser_click(element="Theme Toggle Button", ref="theme-toggle");
browser_wait_for(time=1);
browser_snapshot();

// 1.2 Switch interface language
browser_click(element="Language Toggle Button", ref="language-toggle");
browser_wait_for(time=1);
browser_snapshot();

// 1.3 Switch built-in template language
browser_click(element="Built-in Template Language Toggle Button", ref="builtin-lang-toggle");
browser_wait_for(time=1);
browser_snapshot();
```

### Step 2: Configure Model Selection
```javascript
// 2.1 Open Model Management
browser_click(element="Model Management Button", ref="model-manager");
browser_wait_for(time=2);
browser_snapshot();

// 2.2 Select optimization model
browser_click(element="Optimization Model Select", ref="optimize-model-select");
browser_wait_for(time=1);
browser_click(element="Gemini Model Option", ref="gemini-option");
browser_wait_for(time=1);

// 2.3 Select test model
browser_click(element="Test Model Select", ref="test-model-select");
browser_wait_for(time=1);
browser_click(element="SiliconFlow Model Option", ref="siliconflow-option");
browser_wait_for(time=1);

browser_press_key("Escape");
browser_wait_for(time=1);
```

### Step 3: Configure Template Selection
```javascript
// 3.1 Open Template Management
browser_click(element="Template Management Button", ref="template-manager");
browser_wait_for(time=2);
browser_snapshot();

// 3.2 Select system optimization template
browser_click(element="System Optimization Template Select", ref="system-optimize-template");
browser_wait_for(time=1);

// 3.3 Select iteration template
browser_click(element="Iteration Template Select", ref="iterate-template");
browser_wait_for(time=1);

browser_press_key("Escape");
browser_wait_for(time=1);
```

### Step 4: Export Data
```javascript
// 4.1 Open Data Management
browser_click(element="Data Management Button", ref="data-manager");
browser_wait_for(time=1);
browser_snapshot();

// 4.2 Execute data export
browser_click(element="Export Data Button", ref="export-button");
browser_wait_for(time=3);
browser_snapshot();
```

## ✅ Verification Points

### Primary Verification Points
- [ ] **Export Successful** - The file is downloaded successfully with no error messages.
- [ ] **Correct JSON Format** - The exported file is in a valid JSON format.
- [ ] **Contains All Settings** - `userSettings` contains the 8 expected setting items.

### Detailed Verification Points
- [ ] `app:settings:ui:theme-id` - Theme setting is exported correctly.
- [ ] `app:settings:ui:preferred-language` - Language setting is exported correctly.
- [ ] `app:settings:ui:builtin-template-language` - Built-in template language setting is exported correctly.
- [ ] `app:selected-optimize-model` - Optimization model selection is exported correctly.
- [ ] `app:selected-test-model` - Test model selection is exported correctly.
- [ ] `app:selected-optimize-template` - System optimization template selection is exported correctly.
- [ ] `app:selected-user-optimize-template` - User optimization template selection is exported correctly (if set).
- [ ] `app:selected-iterate-template` - Iteration template selection is exported correctly.

### Expected JSON Structure
```json
{
  "version": 1,
  "data": {
    "userSettings": {
      "app:settings:ui:theme-id": "dark",
      "app:settings:ui:preferred-language": "zh-CN",
      "app:settings:ui:builtin-template-language": "zh-CN",
      "app:selected-optimize-model": "gemini",
      "app:selected-test-model": "siliconflow",
      "app:selected-optimize-template": "general-optimize",
      "app:selected-iterate-template": "iterate"
    },
    "models": [...],
    "userTemplates": [...],
    "history": [...]
  }
}
```

## 🚨 Failure Handling

### If the exported `userSettings` has fewer than 7 items:
1. Check the console for error messages.
2. Verify that the individual settings were actually saved.
3. Check if the storage key names are correct.
4. Record the specific missing setting items.

### If the key name format is incorrect:
1. Check if any components are still using the old, short key names.
2. Verify that the constant definitions are imported correctly.
3. Check for any caching issues.

## 📊 Test Results

### Execution Information
- **Execution Time:** [To be filled]
- **Execution Environment:** [Web/Desktop]
- **Browser Version:** [To be filled]

### Result Log
- **Test Status:** [Pass/Fail/Partial Pass]
- **Number of Exported Settings:** [Actual Number]/8
- **Discovered Issues:** [Issue Description]

### Actual Exported JSON
```json
[Paste the actual exported JSON content here]
```

## 🔄 Follow-up Actions
- [ ] If the test fails, create a bug report.
- [ ] If the test passes, update the test status.
- [ ] Record any suggestions for improvement.
