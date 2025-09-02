# Test 002: Legacy Data Import Compatibility Verification

## 📋 Test Information
- **Test ID:** TEST-002
- **Test Type:** Compatibility Test
- **Priority:** Medium
- **Estimated Execution Time:** 3 minutes

## 🎯 Test Objective
To verify that the application can correctly import data files using old-version short key names and automatically convert them to the new full key name format.

## 📝 Prerequisites
1. The application is launched and initialized.
2. The user can access the data management feature.
3. A test data file with old-version key names is prepared.

## 🧪 Test Data Preparation

### Create Test Data File
Create a file named `legacy-test-data.json` with the following content:

```json
{
  "version": 1,
  "data": {
    "userSettings": {
      "theme-id": "dark",
      "preferred-language": "en-US",
      "builtin-template-language": "zh-CN",
      "app:selected-optimize-model": "gemini",
      "app:selected-test-model": "siliconflow",
      "app:selected-optimize-template": "general-optimize",
      "app:selected-iterate-template": "iterate"
    },
    "models": [
      {
        "key": "test-model",
        "id": "test-model",
        "name": "Test Model",
        "enabled": true
      }
    ],
    "userTemplates": [
      {
        "id": "test-template",
        "name": "Test Template",
        "content": "Test content",
        "isBuiltin": false,
        "metadata": {
          "templateType": "optimize",
          "version": "1.0",
          "lastModified": 1640995200000
        }
      }
    ],
    "history": [
      {
        "id": "test-history",
        "prompt": "Test prompt",
        "timestamp": 1640995200000
      }
    ]
  }
}
```

## 🧪 Test Steps

### Step 1: Clear Current Data (Optional)
```javascript
// 1.1 Open Data Management
browser_click(element="Data Management Button", ref="data-manager");
browser_wait_for(time=1);
browser_snapshot();

// 1.2 If necessary, clear existing data first
// This step is optional and depends on testing needs
```

### Step 2: Import Legacy Data
```javascript
// 2.1 Select the import function
browser_click(element="Import Data Area", ref="import-area");
browser_wait_for(time=1);

// 2.2 Upload the test file
// Note: This requires an actual file upload operation
// The specific implementation depends on the UI's file upload method
browser_file_upload(paths=["./legacy-test-data.json"]);
browser_wait_for(time=2);

// 2.3 Confirm the import
browser_click(element="Confirm Import Button", ref="confirm-import");
browser_wait_for(time=3);
browser_snapshot();
```

### Step 3: Verify Import Results
```javascript
// 3.1 Check for a successful import message
browser_snapshot();

// 3.2 Close the data management dialog
browser_press_key("Escape");
browser_wait_for(time=1);

// 3.3 Verify that the settings have taken effect
// Check if the theme has changed to dark
// Check if the language has changed to en-US
browser_snapshot();
```

### Step 4: Verify Key Name Conversion
```javascript
// 4.1 Re-export data to verify the conversion result
browser_click(element="Data Management Button", ref="data-manager");
browser_wait_for(time=1);

browser_click(element="Export Data Button", ref="export-button");
browser_wait_for(time=3);
browser_snapshot();
```

## ✅ Verification Points

### Import Process Verification
- [ ] **Import Successful** - A success message is displayed with no errors.
- [ ] **Console Logs** - Key name conversion information is displayed.
- [ ] **Settings Applied** - Imported settings are correctly reflected in the UI.

### Key Name Conversion Verification
- [ ] `theme-id` → `app:settings:ui:theme-id`
- [ ] `preferred-language` → `app:settings:ui:preferred-language`
- [ ] `builtin-template-language` → `app:settings:ui:builtin-template-language`
- [ ] New format key names remain unchanged.

### Functional Verification
- [ ] **Theme Setting** - The UI theme changes to the imported "dark" theme.
- [ ] **Language Setting** - The UI language changes to the imported "en-US".
- [ ] **Template Language** - The built-in template language changes to the imported "zh-CN".
- [ ] **Model Selection** - Optimization and test model selections are correct.
- [ ] **Template Selection** - Template selection settings are correct.

### Re-export Verification
- [ ] **New Format Key Names** - Re-exported data uses the full new format key names.
- [ ] **Data Integrity** - All imported data is saved correctly.
- [ ] **Forward Compatibility** - The newly exported data format complies with the latest standard.

## 🚨 Failure Handling

### If import fails:
1. Check if the file format is correct.
2. Check the console for error messages.
3. Verify that the file upload function is working.
4. Check the data validation logic.

### If key name conversion fails:
1. Check the `LEGACY_KEY_MAPPING` configuration.
2. Verify the `normalizeSettingKey` function.
3. Check the console for conversion logs.
4. Check the `isValidSettingKey` validation logic.

### If settings do not apply:
1. Check the storage content after import.
2. Verify the settings reading logic of each component.
3. Check if a page refresh is needed.
4. Verify the reactive update mechanism.

## 📊 Test Results

### Execution Information
- **Execution Time:** [To be filled]
- **Execution Environment:** [Web/Desktop]
- **Browser Version:** [To be filled]

### Result Log
- **Test Status:** [Pass/Fail/Partial Pass]
- **Number of Key Names Converted:** [Number Converted]/3
- **Settings Application Status:** [Description]

### Console Log Record
```
[Record relevant console output, especially key name conversion information]
```

### Re-exported JSON
```json
[Paste the re-exported JSON content to verify key name format]
```

## 🔄 Follow-up Actions
- [ ] If the test fails, analyze the cause of failure.
- [ ] If the test passes, verify with other legacy data formats.
- [ ] Update the compatibility documentation.
- [ ] Consider adding more edge case tests.
